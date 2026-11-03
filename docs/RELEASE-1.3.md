# Ballighni 1.3 — camera capture and larger damage detector

- Take photo opens the phone camera separately from the gallery picker. Captured and picked photos accumulate in a single queue (up to six); preview and remove before upload. Add another camera photo to draft or more-information cases.
- Android declares camera-intent visibility and uses Capacitor's existing capture intent/FileProvider. No background camera or startup camera permission is introduced. Devices without a compatible camera app may fall back to the picker.
- Default detector upgraded from ~3M-parameter YOLOv8n to ~20M-parameter YOLO11m, pinned to a public GitHub revision and SHA-256. Inference uses 960-pixel input and all six photos. Class aliases remain compatible with reports and conditional AED references.
- Increased connection-test timeout to 20 seconds and replaced the raw timeout message with useful recovery guidance.

## Verified
21 automated tests passed. Browser camera-input selection, preview and removal passed using a public evaluation image. Android build, signature and packaged camera controls/current endpoint verified. Live HTTPS registration, login, photo upload, new model identity, five sample damage findings and report retrieval passed. A physical Android camera capture still needs a device check.

The larger model returned hood dent regions missed by the former model in the comparison image. This is one sample, not a representative accuracy evaluation. Dents/cracks can still be missed or confused with reflections. Model observations and AED ranges require human review. See docs/AI-MODEL.md for sources, hashes, class coverage, comparison and limitations.

## Try it
Install this release's Ballighni-Android.apk over the old version. New report → safety check → Take photo. Keep this laptop awake and online. The old temporary tunnel expired; current website/backend: https://rise-gotta-long-providers.trycloudflare.com . The new APK includes it. Existing APK users can set it in Connection help.
