# Playbook coverage · prototype 1.1.0

Reference: the supplied Ballighni Fantastic Four Hackathon Master Playbook. Product requirements are distinguished from official operational authorization.

| Requirement | Implementation | Evidence / limit |
|---|---|---|
| P0 safety and emergency handoff | Safely stopped reporting gate; red 999 / 997 / 998 calling guidance | UI and API checks; no dispatch |
| P0 guided capture | Driver/witness, time, location, narrative, consent, permitted images | API validation and browser journey |
| P0 preliminary report | Image-source citations, model ID, uncertainty, editable draft | Live pretrained inference and adapter tests; no validated accuracy claim |
| P0 explicit confirmation | User confirms edited draft before submission | API and browser verified |
| P0 tracking | Persistent references, timeline, periodic connected refresh | API lifecycle and browser verified |
| P0 reviewer dashboard | Queue, images, corrections, requests, status/reasons, audit | Access-control and lifecycle tests |
| P1 witness and matching | Separate statements; heuristic candidates and private invitations; reviewer decides relationship | Never auto-merges or determines fault; workflow tests |
| P1 confidence / missing evidence | Model scores, missing-image guidance, poor-image retake heuristic | Low-detail photo test skips inference; heuristic is not validated quality scoring |
| P1 bilingual controls | Core English/Arabic labels and RTL toggle | Browser checked; full explanatory prose localization remains |
| Accessibility improvement | Large text, contrast, reduced motion, communication card, optional reviewer support request | Preferences survive reload; no driving-control or fitness assessment |
| Joint review and routing demo | Separate original/confirmed accounts, approved snapshot, downloadable text, two simulated receipts | Consent/access/idempotency/invalidation tests; no external transmission |
| Secure evidence | Decode/type/size/pixel/count checks, metadata stripping, protected retrieval | API tests; automatic face/plate redaction remains |
| Phone app | Shared responsive frontend, touch navigation, native Android project/APK | Build and signature checks; physical-device testing remains |
| Official partnerships/integrations | Deliberately not represented as live | Require authorized agency/insurer endpoints and agreements |
| Measurements | Actual test results and model smoke-test scores recorded | No invented time savings, accuracy, injury or liability claims |

Node.js 24/SQLite implement the main API; Python provides isolated authenticated loopback inference. The playbook's suggested stacks are alternatives, not a mandate. A shared HTTPS backend is required for live phone and multi-device reporting; it has not been deployed under the prior GitHub/local-only instruction.
