"""Loopback-only pretrained damage inference. No fault, costs or claim decisions."""
import base64
import io
import os
import secrets
import threading
from pathlib import Path
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from PIL import Image

ROOT = Path(__file__).resolve().parent
MODEL_PATH = Path(os.environ.get('DAMAGE_MODEL_PATH', ROOT / 'models' / 'damage-yolov8n.pt'))
TOKEN = os.environ.get('BALLIGHNI_AI_TOKEN')
if not TOKEN:
    raise RuntimeError('Use npm run start:ai to supply the private inference token.')
Image.MAX_IMAGE_PIXELS = 40_000_000
if MODEL_PATH.suffix == '.onnx':
    from ai.onnx_detector import DamageDetector
    model = DamageDetector(MODEL_PATH)
    MODEL_ID = 'damagelens-yolo-2b9ae06'
else:
    from ultralytics import YOLO
    model = YOLO(str(MODEL_PATH))
    MODEL_ID = 'artemxdata-yolov8n-cardd-e4879d4'
lock = threading.Lock()
app = FastAPI(title='Ballighni damage inference', docs_url=None, redoc_url=None)

class Photo(BaseModel):
    base64: str = Field(min_length=20, max_length=12_000_000)

def authenticate(authorization):
    if not secrets.compare_digest(authorization or '', 'Bearer ' + TOKEN):
        raise HTTPException(401, 'Unauthorized')

@app.get('/health')
def health(authorization: str | None = Header(default=None)):
    authenticate(authorization)
    return {'ok': True, 'model': MODEL_ID}

@app.post('/analyze')
def analyze(photo: Photo, authorization: str | None = Header(default=None)):
    authenticate(authorization)
    try:
        raw = base64.b64decode(photo.base64, validate=True)
        if len(raw) > 8 * 1024 * 1024:
            raise ValueError('Image too large')
        image = Image.open(io.BytesIO(raw))
        if image.format not in ('JPEG', 'PNG', 'WEBP'):
            raise ValueError('Unsupported image')
        image = image.convert('RGB')
    except Exception as exc:
        raise HTTPException(400, 'Invalid image') from exc
    if not lock.acquire(blocking=False):
        raise HTTPException(429, 'Model busy; retry shortly')
    try:
        if MODEL_PATH.suffix == '.onnx':
            return {'model': MODEL_ID, 'detections': model.predict(image)}
        result = model.predict(image, conf=0.45, imgsz=640, device='cpu', verbose=False, max_det=30)[0]
        detections = []
        for box in result.boxes:
            detections.append({
                'label': model.names[int(box.cls[0])],
                'confidence': round(float(box.conf[0]), 4),
                'box': [round(float(v), 4) for v in box.xyxyn[0]],
            })
        return {'model': MODEL_ID, 'detections': detections}
    finally:
        lock.release()
