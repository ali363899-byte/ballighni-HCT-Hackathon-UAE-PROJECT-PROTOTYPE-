"""Original NumPy adapter for the pretrained DamageLensAI YOLO ONNX export."""
import ast
import json
import numpy as np
import onnxruntime as ort
from PIL import Image

class DamageDetector:
    def __init__(self, path):
        self.session = ort.InferenceSession(str(path), providers=['CPUExecutionProvider'])
        self.input = self.session.get_inputs()[0]
        metadata = self.session.get_modelmeta().custom_metadata_map
        self.names = ast.literal_eval(metadata.get('names', '{}'))
        if not isinstance(self.names, (dict, list)) or not self.names:
            raise ValueError('Model does not declare damage classes')
        self.size = int(self.input.shape[-1]) if isinstance(self.input.shape[-1], int) else 640
        self.dtype = np.float16 if self.input.type == 'tensor(float16)' else np.float32

    def predict(self, image, threshold=0.45):
        width, height = image.size
        scale = min(self.size / width, self.size / height)
        resized = (round(width * scale), round(height * scale))
        left, top = (self.size - resized[0]) // 2, (self.size - resized[1]) // 2
        canvas = Image.new('RGB', (self.size, self.size), (114, 114, 114))
        canvas.paste(image.resize(resized, Image.Resampling.BILINEAR), (left, top))
        tensor = (np.asarray(canvas).astype(self.dtype) / 255).transpose(2, 0, 1)[None]
        rows = self.session.run(None, {self.input.name: tensor})[0]
        rows = np.squeeze(rows, axis=0)
        if rows.ndim != 2:
            raise ValueError('Unexpected ONNX output shape')
        # Standard YOLO v8/v11 detection export: [4 + classes, anchors].
        if rows.shape[0] == len(self.names) + 4:
            rows = rows.T
        if rows.shape[1] != len(self.names) + 4:
            raise ValueError('Unsupported detector output contract')
        ids = rows[:, 4:].argmax(axis=1)
        scores = rows[np.arange(len(rows)), ids + 4]
        valid = np.isfinite(scores) & (scores >= threshold) & (scores <= 1)
        rows, ids, scores = rows[valid], ids[valid], scores[valid]
        boxes = rows[:, :4].astype(np.float32)
        if not len(boxes):
            return []
        centers = boxes[:, :2].copy()
        sizes = boxes[:, 2:].copy()
        boxes[:, :2] = centers - sizes / 2
        boxes[:, 2:] = centers + sizes / 2
        order = scores.argsort()[::-1]
        keep = []
        while len(order) and len(keep) < 30:
            index = order[0]
            keep.append(index)
            rest = order[1:]
            if not len(rest):
                break
            lo = np.maximum(boxes[index, :2], boxes[rest, :2])
            hi = np.minimum(boxes[index, 2:], boxes[rest, 2:])
            intersection = np.maximum(hi - lo, 0).prod(axis=1)
            area = np.maximum(boxes[:, 2:] - boxes[:, :2], 0).prod(axis=1)
            iou = intersection / np.maximum(area[index] + area[rest] - intersection, 1e-6)
            order = rest[(iou <= 0.5) | (ids[rest] != ids[index])]
        results = []
        for i in keep:
            x1, y1, x2, y2 = boxes[i]
            normalized = np.clip([(x1-left)/scale/width, (y1-top)/scale/height, (x2-left)/scale/width, (y2-top)/scale/height], 0, 1)
            name = self.names[int(ids[i])] if isinstance(self.names, list) else self.names.get(int(ids[i]), self.names.get(str(int(ids[i])), 'unknown'))
            if normalized[2] <= normalized[0] or normalized[3] <= normalized[1]:
                continue
            results.append({'label': str(name).lower().replace('_', ' '), 'confidence': round(float(scores[i]), 4), 'box': [round(float(v), 4) for v in normalized]})
        return results
