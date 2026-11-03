# Damage detector — version 1.3

## Active default
YOLO11m (~20.1 million parameters), replacing the previous YOLOv8n (~3.0 million). Source: https://github.com/ReverendBayes/YOLO11m-Car-Damage-Detector . Revision cd1cb118b5111634b49e02b3dc790f2636d49d82, file trained.pt, downloaded as ai/models/damage-yolo11m.pt. SHA-256: 40d324e82d8a9cef052d747bba1b65ba70e66fa2153cc832570370128d2c3818.

Run node scripts/download-model.mjs to download and verify weights. Weights are ignored by Git. Start npm run start:ai. Python uses 960-pixel inference, CPU threads 2, confidence threshold 0.45, and up to 30 detections per photo. All six submitted evidence photos are analyzed.

Classes: dent, scratch, crack, shattered glass, broken lamp, flat tire. The adapter maps the upstream labels to the existing report vocabulary. Findings retain source-photo IDs, normalized boxes and uncalibrated model scores. No finding is a confirmed fact until checked. Missing detections do not establish an undamaged vehicle. The model does not identify every displaced or missing part; wider coverage requires additional training.

## Local comparison
On the same public upstream damaged-car sample at 960 pixels and threshold 0.45, the former nano model found one displaced-part observation (score 0.544). YOLO11m returned three dent regions (0.820, 0.758, 0.739), a scratch (0.686) and crack (0.542). The visible hood is deformed; the full output still requires human review. CPU inference for this single trial was 3.24 seconds nano and 1.19 seconds medium, including first inference overhead. These timings are not a benchmark. More detections are not proof of better accuracy. No representative labeled user-photo evaluation has been completed, so no real-world accuracy improvement percentage is claimed.

The upstream author publishes class-level metrics and notes weaker dent/crack recall. Those metrics are not Ballighni validation. Subtle dents, reflections, dark scenes, occlusion and unfamiliar vehicles can still cause mistakes. Capture a wide view plus a close-up, inspect each finding, and use human corrections.

## Assessment and pricing
The detector recognizes visible classes and regions. The separate assessment/report language model organizes those observations; it is not a trained severity or repair-price estimator. AED references remain conditional repair scenarios from published price sources; unsupported parts require a workshop quote. No fault, injury, roadworthiness or insurer outcome is inferred.

## Rights and reproducibility
The upstream repository declares MIT. Ultralytics framework and CarDD training-data terms are separate; see https://www.ultralytics.com/license and https://cardd-ustc.github.io/ . No commercial clearance for third-party weights or data is claimed. Check applicable rights before commercial redistribution. Download scripts pin revision and hash; no third-party model code is copied. Original nano/ONNX provenance is retained in LEGACY-AI-MODEL.md. Use scripts/download-legacy-model.mjs and DAMAGE_MODEL_PATH for the former nano checkpoint if required.
