# Where everything is

| Part                        | Folder / file                                      | What to change here                                                         |
| --------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| App screens and website     | `frontend/app.js`                                  | Reporting forms, tracking and overall page flow                             |
| Design / phone layout       | `frontend/style.css`                               | Colors, red emergency guidance, touch targets and responsive layouts        |
| Accessibility               | `frontend/accessibility.js`                        | Text/contrast/motion preferences and communication card                     |
| Participant/review screens  | `frontend/case-workflow.js`                        | Separate accounts, report packet and simulated routing UI                   |
| API, accounts, data         | `backend/server.mjs`                               | Permissions, persistence, image uploads and case lifecycle                  |
| Shared cases and routing    | `backend/case-workflow.mjs`                        | Private invitations, consent, reviewed packet snapshots and local receipts  |
| Image quality               | `backend/image-quality.mjs`                        | Bounded resolution/light/detail heuristics                                  |
| AI adapter / report draft   | `backend/ai.mjs`                                   | Validated findings, evidence citations and honest fallback                  |
| Pretrained damage inference | `ai/service.py`                                    | Authenticated loopback YOLO inference                                       |
| Optional ONNX runtime       | `ai/onnx_detector.py`                              | Alternate CPU detector adapter                                              |
| Android app                 | `android/`                                         | Native wrapper, manifest, signing/build settings and icons                  |
| Model downloaders           | `scripts/download-*.mjs`                           | Pinned model revisions and checksums                                        |
| One-command startup         | `scripts/start-with-ai.mjs`, `START-BALLIGHNI.cmd` | Start backend and AI, keep backend alive on model failure                   |
| Verification                | `tests/`                                           | Account access, uploads, model contracts, quality and combined-case privacy |
| Shared automation           | `.github/workflows/`                               | GitHub checks and Android APK build                                         |
| Private local data          | `data/`, `.env`                                    | Database, images and machine settings; never commit                         |

Start with `START-HERE.md`. The source repository is private. The invited teammate uses their own GitHub account and their own app account. Accepting a repository invitation does not grant app reviewer access.


## New in 1.2

| File | What it does |
|---|---|
| frontend/design.css, interface.js | Navy/white/mint design, overview and case progress |
| frontend/ai-workflow.js | Visible AI stages, background progress and explicit draft insertion |
| frontend/voice.js | Voice dialog, editable dictation, read-aloud and safe command whitelist |
| backend/ai-workflow.mjs | Assessment/testimony/report model roles and source-based AED reference engine |
| backend/case-workflow.mjs | Existing-report invitations, consent, exact-quote reviewer comparison and simulated receipts |
| android/.../BallighniVoicePlugin.java | Native Android speech recognition and text-to-speech |
| docs/LAPTOP-HOSTING.md | Step-by-step hosting and two-participant demo |
| docs/AI-WORKFLOW.md, ACCESSIBILITY.md, DESIGN.md | AI limits, speech/device behavior and visual identity |
