# Pretrained vehicle-damage AI

## Selected model

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
