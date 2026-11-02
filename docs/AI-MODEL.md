# Pretrained vehicle-damage AI

## Selected default: pretrained YOLOv8n

The selected default is the pinned `artemxdata/Car-Damage-Assessment-AI` YOLOv8n checkpoint documented below. It was loaded and tested locally after installing the official CPU PyTorch runtime. On the upstream public damaged-car sample, it returned `dislocated part` with model score 0.6300 and `dent` with score 0.4682 at the unchanged 0.45 threshold. These are preliminary model outputs on one image, not a validated accuracy result or a severity assessment.

The normalized boxes were approximately `[0.1465,0.4134,0.5155,0.8209]` and `[0.2204,0.1953,0.5994,0.4474]`. The UI can display them over the corresponding source image. No model is allowed to issue liability, injury, claim or roadworthiness decisions.

The locally tested Python stack includes torch 2.15.0+cpu, torchvision 0.29.2+cpu and ultralytics 8.4.198. Install CPU wheels from PyTorch's official index before the app's AI requirements, as shown in the README.

## Optional: pretrained ONNX damage model

Source project: [junaidariie/DamageLensAI](https://github.com/junaidariie/DamageLensAI). Its README links the detector weights at [junaid17/Yolo_Model](https://huggingface.co/junaid17/Yolo_Model).

Pinned model revision: `2b9ae0653850790caf83018107f655663f5b6cf7`.

Checkpoint: `damage_detector.onnx` (50,855,385 bytes), saved locally as `ai/models/damage-detector.onnx`.

SHA-256: `90db4bb34d758ec152cbfe86d4e428c621447802395bddfaf09e4589c194a71b`.

The downloaded model was inspected directly with ONNX Runtime. It expects a float32 RGB input `[1,3,640,640]`, exposes output `[1,5,8400]`, and declares **one class: damage**. The application therefore does not borrow the source project's broader classifier accuracy claims or invent damage subtypes. Ballighni implements its own letterboxing, output validation, nonmaximum suppression, inverse-coordinate mapping and source-linked display.

Local smoke tests confirm that the model loads and executes. A blank synthetic image returned no findings. One upstream damaged-car sample also returned no findings at the default 0.45 threshold (its strongest score was about 0.173 during diagnostic inspection). This demonstrates a false-negative limitation; it is **not** evidence of useful real-world accuracy. The threshold has not been lowered merely to make that sample pass. Human review and the original evidence remain essential. Dataset-based evaluation is still required before relying on this model.

The model repository supplies no explicit model license/card. Its availability does not establish commercial redistribution rights. Weights stay outside Git; the downloader uses a pinned checksum for local evaluation. Obtain applicable rights before commercial deployment or redistribution. ONNX Runtime is a separately licensed dependency; its use does not grant rights to the model or training data.

## Default checkpoint provenance

Source: [artemxdata/Car-Damage-Assessment-AI](https://github.com/artemxdata/Car-Damage-Assessment-AI).

Pinned source commit: `e4879d4fa6736e89bb22572cd8993d7bd56416c7`.

Checkpoint: `models/best.pt`, downloaded as `ai/models/damage-yolov8n.pt`.

SHA-256: `f1cff663ce47e1ac615da6f7a9b034a5ebbf7bedf75cf38f34d2c85fc6b761ce`.

The upstream training configuration identifies a YOLOv8n model trained for 50 epochs at 640 pixels on a CarDD-derived Roboflow dataset. Classes are crack, crash, dent, dislocated part, glass shatter, lamp broken, no part, rub, scratch and tire flat.

Upstream reports mAP50 0.5809, mAP50-95 0.4093, precision 0.6749 and recall 0.5344. These are the author's metrics, **not Ballighni validation results**. They do not establish performance on UAE road scenes, user uploads or severity estimates. "Crash" is an upstream visual category; it does not establish event cause or liability.

## Integration

Ballighni runs its own narrow inference adapter, not the upstream decision/claim agents. The normalized evidence image goes to an authenticated loopback Python service. YOLO returns class, bounding box and model score. The Node adapter validates labels, numeric ranges and response shape, attaches the evidence ID and marks every observation unverified.

The default confidence threshold is 0.45. It is an initial prototype threshold, not a calibrated probability of damage. No detection is not proof of no damage. At most four evidence photos are analyzed per request; the reviewer can inspect all six uploaded photos.

The model never supplies legal fault, injury assessment, roadworthiness, dispatch, official reports or repair cost. The narrative quotes the reporter account as unverified; image findings remain separate so they cannot silently become confirmed facts.

Unavailable model, timeout or invalid output produces a visible manual draft with no fabricated detections. Ollama is an optional alternative adapter, disabled unless explicitly configured.

## Provenance and licensing

The upstream project declares MIT for its source. Its trained model uses Ultralytics YOLO and a CarDD-derived dataset; **source, framework, model and training-data terms are separate**. Ultralytics distributes its framework under AGPL-3.0 or a commercial license; see [Ultralytics licensing](https://www.ultralytics.com/license). The original [CarDD project](https://cardd-ustc.github.io/) requires a dataset licensing form. Upstream's MIT source declaration does not independently establish unrestricted commercial rights to all training data or weights.

Ballighni does not copy the upstream insurance decision logic, does not relicense third-party models and does not commit the checkpoint to GitHub. The downloader pins and hashes it for reproducible local evaluation. Resolve the relevant terms with the owners before distributing the weights commercially or offering a production service. The complete Ballighni source is available in your private team repository; commercial clearance is not claimed.
