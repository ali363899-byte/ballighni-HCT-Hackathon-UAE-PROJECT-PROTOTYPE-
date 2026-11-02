# Playbook coverage

Reference: Ballighni Fantastic Four Hackathon Master Playbook, supplied by the project owner. This is a prototype implementation, not an official reporting service.

| Playbook requirement | Implementation | Verification / limits |
|---|---|---|
| P0 safety prompt and emergency handoff | Safety question before capture; injury/danger branch shows police/ambulance calling links | Browser tested; API rejects reports without safe=true |
| P0 guided capture | Driver/witness details, time, approximate location, permitted photo upload, consent | Browser-tested text journey; API-tested image decoding, duplicate detection and access |
| P0 structured preliminary report | Source-linked findings, model ID, uncertainty, missing-evidence prompts and editable reporter narrative | Model inference smoke-tested separately; no accuracy benchmark claimed |
| P0 user confirmation | Draft is saved first; explicit checkbox and edited report required to submit | API and browser tested |
| P0 case tracking | Unique prototype reference, persistent SQLite case and timeline | API and browser tested; user refreshes updates |
| P0 reviewer dashboard | Protected queue, original evidence, review/request/close with required reason | Full lifecycle API tested |
| P1 witness mode | Text-only witness report is supported | API tested |
| P1 possible matching | Same entered location and within 30 minutes; reviewer accepts or rejects | API tested; heuristic, no automatic merge |
| P1 confidence / missing photos | Model scores, source IDs, missing-image prompts, no invented findings on failure | AI adapter and API tested; confidence is not calibrated certainty |
| P1 bilingual interface | Arabic brand mark; application labels are currently English | Full Arabic localization is not implemented |
| Secure uploads | JPEG/PNG/WebP decoding, size/pixel/count limits, metadata stripping, protected retrieval | API tested; no automatic face/plate redaction |
| Audit and permissions | Salted password hashing, hashed expiring sessions, owner/reviewer checks, transactional append-only audit events | API tested; database administrator is still trusted |
| Phone app | Responsive layout, mobile bottom navigation, safe-area spacing, touch targets, native Android project | Web viewport tested; APK compilation/signature verification tracked in delivery report |
| Official integrations | None | No dispatch, official police report, insurance decision or government routing |
| Measurements | No invented time savings, injury diagnosis, fault verdict, cost estimate or model accuracy claims | User studies and domain validation remain future work |

The architecture uses Node.js 24 + SQLite rather than the playbook's optional FastAPI/Firebase examples. The playbook permits choosing a practical team stack. The optional inference worker is Python, isolated behind an authenticated loopback endpoint.

The ONNX checkpoint available from the linked upstream model has **one generic damage class**. Ballighni therefore shows possible visible damage regions, not fabricated damage subtypes or severity. A separate pinned YOLOv8n adapter is included for future evaluation if its larger runtime is installed.
