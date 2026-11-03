# Ballighni 1.3.0 delivery report

Fantastic Four · 3 November 2026

Private repository: https://github.com/ali363899-byte/ballighni-HCT-Hackathon-UAE-PROJECT-PROTOTYPE-. Owner ali363899-byte and accepted collaborator abdulrahmanabuseedo can work together in Visual Studio Code. Open ballighni.code-workspace. START-HERE.md maps the code and guides.

## Delivered in this update

- A redesigned dark navy, white and soft mint interface, original two-account/check logo, Android launcher icons and matching splash background.
- A clearer reporting journey: safety gate, grouped observation fields, thumbnail previews, optional support/connection controls, real upload/analysis progress, case stages and section navigation.
- Four visible AI stages: trained YOLOv8n damage detection; local assessment with conditional AED repair references; attributed testimony summarization/comparison; preliminary report drafting. The three text roles use separate local Ollama calls to qwen3.5:9b, not three separately trained accident models.
- Serialized background text-AI jobs, individual status updates, bounded CPU use, honest unavailable/interrupted states and an option to keep the saved draft without waiting. Background updates do not replace the editable confirmation form. The user explicitly chooses an AI-written draft and confirms it.
- Existing submitted reports can now connect using a private invitation, explicit consent and reviewer acceptance. Differing original testimonies remain separately attributed. Private photos/support requests and reviewer-only notes are not shared with another participant.
- Reviewer-only AI comparison validates exact quotations against both original sources. New AI/source information invalidates stale packet approval. A reviewed packet includes independent statements, evidence, uncertainty and the source-quoted comparison.
- Department and insurance receivers remain local simulations with receipts on both accounts. No real transmission, official police report, liability decision, insurance valuation or emergency dispatch occurs.
- Voice navigation and dictation controls, read-page/card aloud, stop controls, extra-large touch targets and spacious reading preferences. Android has an original native SpeechRecognizer/TextToSpeech bridge with user-started microphone permission. Browser speech uses supported device/browser services and explains unavailable support.
- Core English/Arabic controls and RTL, larger text, contrast, reduced motion, optional communication card and red police 999 / fire 997 / ambulance 998 guidance remain available.
- Current APK/source archives, pinned model downloaders, repository map, team guide, AI workflow and Windows laptop hosting instructions.

## Verification results

| Check                 | Result                                                                                                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automated checks      | 14 tests passed: API/access lifecycle, image/AI fallback, separate role calls, grounded cost references, exact-quote validation, consent, original-statement preservation, existing-report connection and voice-command whitelist |
| Real damage inference | Uploaded/normalized evaluation image produced an evidence-linked possible dislocated-part finding at model score 0.5371; not an accuracy benchmark                                                                                |
| Real text roles       | Assessment, testimony and report stages all completed using the actual local model for two independent synthetic accounts                                                                                                         |
| Live joint workflow   | Two existing submitted reports connected; AI identified one possible difference with exact source quotations; human approval and two simulated destinations completed; each participant saw both receipts                         |
| Browser reporting     | Safety confirmation → details → photo chooser/thumbnail → saved case with real AI observation verified                                                                                                                            |
| Edited text           | Opening/closing voice controls preserved a manually edited report field; stage polling targets its own panel                                                                                                                      |
| Responsive layout     | 320px and 390px layouts inspected with equal document/client widths; Arabic RTL inspected at 320px                                                                                                                                |
| Android build         | Local 1.2.0 / version code 4 build compiled successfully, including native speech bridge; final APK signature/manifest verified with delivery artifacts                                                                           |
| Physical audio/device | Not tested on a connected Android phone. Permission, installed speech provider/language, recognition, TTS playback, keyboard/photo picker and native navigation still need real-device acceptance                                 |

The live synthetic end-to-end test used cases BLG-2026-1A26214E88 and BLG-2026-AD21D4F0CD. Test counts are not production certification. Browser frames do not prove Android hardware behavior. Local CPU text inference can take several minutes; the saved draft and per-stage progress remain available while it runs.

## Estimation basis and limits

The language model does not generate prices. A deterministic reference engine uses published workshop scenarios checked on 3 November 2026: localized minor dent/scratch guidance at https://bodyshop.ae/accident-repair/ and repairable-panel reshaping/repaint guidance at https://autorepairuae.com/services/car-dent-repair-dubai/. VAT treatment, eligibility and exclusions are shown with assumptions. Repeated photo detections are not added as separate repair charges; alternatives are not totaled. Displaced/missing parts, glass, lamps and other unsupported observations require a vehicle-specific quote.

These are conditional AED reference ranges, not a whole-vehicle estimate, insurer-approved quote or validated monetary prediction. The image assessment cannot establish mechanical severity or roadworthiness. Repair scope, vehicle details and hidden damage require workshop inspection. Model accuracy and cost accuracy have not been independently benchmarked on a representative UAE dataset.

## AI provenance

The detector remains pinned to artemxdata/Car-Damage-Assessment-AI commit e4879d4fa6736e89bb22572cd8993d7bd56416c7 with checksum-verified download. The text model was already installed locally as Ollama qwen3.5:9b (short model ID 6488c96fa5fa). The optional compact-model download was stopped; it is not required for this delivered configuration. No paid AI API was configured. See AI-MODEL.md and AI-WORKFLOW.md for provenance and separate source/framework/model/data license limits.

## Hosting and installation

The selected setup is a free temporary Cloudflare HTTPS link to this laptop. No Railway paid upgrade or persistent cloud host was purchased. The backend/SQLite database, evidence and inference remain local. Keep the host computer awake, internet connected and the sharing processes running. A new shared launch creates a new address; update Connection settings on both phones. The APK is prefilled with the address active at release time. The website uses its current origin automatically.

Install the debug-signed APK directly on Android 7+ without Google Play. It is a prototype certificate, not a verified production publisher. Both teammates need their own application accounts; GitHub collaboration does not create app logins. Follow LAPTOP-HOSTING.md for the ready laptop, a fresh laptop, separate statements and reviewer demo. Use only synthetic/permitted data during testing.

Full Arabic prose localization, automatic face/plate redaction, production retention/deletion, backups/account recovery, independent security review, domain validation, commercial model/data clearance and real agency/insurer integrations remain outside the completed prototype. PDF-CHECKLIST.md maps the supplied playbook; the new reference-cost feature follows the owner's explicit request and stays clearly preliminary.


# Ballighni 1.2.1 interaction hotfix

- Fixed a language observer that continually rewrote the page.
- Case actions become available without waiting for evidence photos or reviewer details; photos load independently with retry.
- Stable case-section navigation works across interface languages.
- Registration displays username and password errors and reopens in sign-in mode.
- Stale navigation responses are ignored.
- Saved outdated temporary backend URLs migrate to the current shared endpoint; permanent custom servers remain configured.

Validation: all 14 reporting, AI and access tests passed, plus a new language-observer regression test. Browser account creation, safety checkbox, report form, expandable options and involvement selection passed. Android build, APK signature and packaged HTTPS endpoint verified. Physical Android device testing remains necessary.


# Ballighni 1.2.2 Android startup repair

## Fixes
- Corrected Android voice calls to use the injected Capacitor nativePromise bridge. The injected bridge does not provide registerPlugin; calling it during navigation prevented the main screen from rendering.
- Voice cleanup failures cannot block navigation.
- Render the home interface immediately without waiting for a saved-session network request.
- Connection status distinguishes a missing APK backend address from an unreachable host.

## Server verification
The backend process had stopped while the Cloudflare tunnel was still active. Restarted reporting and trained damage AI without changing the shared URL. Verified externally with Android origin https://localhost: CORS preflight, AI health, account registration, login, synthetic report save and read-back all passed on 3 November 2026.

## Validation
All 18 automated tests passed, including three new Android bridge/offline-startup regressions. Android version 1.2.2, version code 6 built successfully. APK signature and actual packaged voice code and backend URL verified. A physical phone was not connected; microphone and touch behavior need a device check.

## Install and connect
Download Ballighni-Android.apk from this release and install over the previous version. Do not use the 1.2.0 or 1.2.1 APK. Open Overview; the main content must appear even offline. With this laptop awake and the server and sharing processes running, the connection bar should say Connected. The current temporary backend is https://rise-gotta-long-providers.trycloudflare.com . If needed, open Connection help, paste that address, Save connection, then Test connection.

The free temporary server requires this laptop to stay awake and online. Stopping the backend breaks live reports; restarting sharing can change the URL. There is no always-on hosting in this setup. Department/insurance routing remains a simulation.


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
