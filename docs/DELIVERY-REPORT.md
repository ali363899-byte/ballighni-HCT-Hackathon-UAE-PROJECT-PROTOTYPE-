# Ballighni 1.1.1 delivery report

Fantastic Four · 2 November 2026

Repository: https://github.com/ali363899-byte/ballighni (private). Owner: ali363899-byte. Collaborator abdulrahmanabuseedo has accepted and has repository access. Open ballighni.code-workspace in Visual Studio Code. START-HERE.md and docs/REPOSITORY-MAP.md explain every main folder.

## Delivered

- Responsive website and Capacitor Android app share one readable frontend.
- Red emergency guidance and tap-to-call Police 999, Fire/Civil Defence 997, Ambulance 998. Reporting requires a safely stopped user; the app cannot dispatch help.
- People of Determination support: larger text, high contrast, reduced motion, keyboard focus, optional local communication card and device read-aloud. Support requests are optional, require no diagnosis, and are visible to authorized reviewers.
- English/Arabic core interface controls and RTL layout. Longer explanatory copy is not fully localized; entered testimony and model output are never silently translated.
- Driver/witness reporting, permitted evidence uploads, saved drafts, explicit confirmation, tracking and reviewer information requests.
- Separate participant accounts connect through a hashed, expiring, single-use invitation with consent. A reviewer accepts the relationship. Each testimony stays independently attributed; the app makes no fault determination.
- A joint evidence report preserves original and confirmed accounts, image-source references, uncertainty, reviewer corrections and private support requests. Approval applies to the exact snapshot; new information invalidates approval.
- Local department and insurer demo receivers produce separate idempotent receipts. Both participants see routing history. These are simulations: no agency, insurer or email recipient is contacted.
- Pretrained damage-specific YOLOv8n service with source-linked observations and image regions. Poor-image prompts, missing-photo handling and honest manual fallback are included.
- SQLite persistence, salted password hashing, hashed expiring sessions, owner/reviewer controls, protected images, metadata stripping, upload limits and audit events.
- Backend starts immediately while AI warms up. AI failure no longer shuts down reporting. Clear connection/AI status, corrected endpoint testing and preserved sessions during temporary network failures.
- VS Code tasks, team guide, deployment examples, model provenance/downloaders, GitHub checks and Android build workflow.

## Verification

- Eight automated tests passed, covering API lifecycle/access controls, malformed AI output, image-quality fallback, independent testimony, consent withdrawal, private reviewer notes, approval invalidation and simulated routing.
- npm audit reported zero vulnerabilities at verification time.
- Live API upload → JPEG normalization → pretrained inference → evidence-linked findings passed. One normalized public evaluation image produced a possible dislocated-part observation at model score 0.5371. This is a smoke test, not an accuracy benchmark.
- Browser-tested saved accessibility preferences and Arabic/English controls. Reviewer walkthrough linked separate synthetic accounts and preserved their disagreement.
- Android 1.1.0 (version code 2) compiled locally. APK signature and manifest verification are documented with the release artifacts.
- No physical Android device was connected. Camera picker, native file export, keyboard, installation and back navigation still need testing on actual hardware. Browser layouts do not establish native-device behavior.

## AI selection

Default: artemxdata/Car-Damage-Assessment-AI, commit e4879d4fa6736e89bb22572cd8993d7bd56416c7. The downloader verifies SHA-256. Possible classes include crack, dent, scratch and dislocated part. Scores are uncalibrated; findings need human inspection.

An optional one-class ONNX checkpoint performed worse on the smoke-test image and is not the default. No representative UAE accuracy benchmark, severity validation, repair cost estimate or accident reconstruction is claimed. See AI-MODEL.md for provenance and license limits. Weights and evaluation photographs are excluded from the repository/source archive.

## PDF alignment and limits

PDF-CHECKLIST.md maps the supplied playbook to implementation. The PDF is a product blueprint, not authorization for official integrations. No fault verdict, injury diagnosis, safe-to-drive declaration, official police report, emergency dispatch or insurance decision is generated.

Full Arabic prose localization, automatic face/plate redaction, validated image-quality scoring, production retention/deletion operations, backup/recovery and independent security/domain review remain future work. The image-quality check is an explainable heuristic, not a validated classifier.

## Running and sharing

Run npm ci, follow AI-MODEL.md, then START-BALLIGHNI.cmd or npm run start:ai. Open http://localhost:3000 and keep the server terminal running. npm start works in manual-drafting mode without the Python service. npm run demo:seed creates fictional local accounts; its credentials are saved only in ignored data/demo-accounts.json.

The APK installs directly without Google Play and requires Android 7+. It is a debug-signed prototype, not a production publisher certificate. Preserve a separate release signing key for eventual distribution.

The bundled overview, safety guidance and synthetic example work without a server. Live accounts, reports, image AI and cross-device synchronization require the same reachable HTTPS backend on every client. A phone's localhost refers to the phone. GitHub shares code, not the database. Read CONNECTIONS.md and DEPLOYMENT.md.

No shared HTTPS host has been deployed. The owner's previous instruction was GitHub/local only; revised hosting preference was requested. Docker deployment examples are prepared, but the full Node/Python container has not been built or deployed here. Real agency/insurer transmission needs authorized endpoints and agreements. These limitations must remain visible during demonstrations.

Hosting update: the owner subsequently selected a shared HTTPS backend, with no paid service without approval. Browser-only Railway setup is prepared; no desktop/plugin installation is needed. Provider sign-in authorization and actual deployment verification remain outstanding. See DEPLOYMENT.md for exact settings.

## 1.1.1 temporary HTTPS connection update

The Railway account was created through the browser with the owner authorizing GitHub sign-in and accepting the provider agreement. Its dashboard then reported new-account trials paused. No paid upgrade was made. The owner selected a free temporary HTTPS link from this computer.

The shared launcher and official checksum-verified portable cloudflared helper were exercised locally. Occupied-port protection was verified. The final HTTPS session passed registration/login, image upload, real pretrained inference and source-linked output. The backend reported ai_available=true. Website sign-in uses the same local database. Eight automated tests passed again, including current-origin web configuration. The Android 1.1.1 build is configured with the tested session URL; its connection can be updated without rebuilding after the temporary URL changes.

Keep the host computer awake and the shared launcher running. This is temporary development sharing, with no uptime guarantee or hosted-data migration. Physical Android hardware testing remains outstanding. Read TEMPORARY-SHARING.md for restart/stop instructions.
