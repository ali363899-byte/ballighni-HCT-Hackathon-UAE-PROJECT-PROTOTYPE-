# Architecture and API

```text
Website / Android app (frontend/)
          | HTTPS + expiring bearer session
Node.js backend (backend/server.mjs)
          | SQLite: accounts, sessions, cases, evidence, updates, links
          | optional authenticated loopback request
Python pretrained YOLO damage service (ai/service.py)
```

The frontend uses HTML, CSS and native JavaScript modules. This keeps the screens easy to inspect and edit in VS Code and avoids a second Android UI codebase. Capacitor packages the same assets for Android. Node.js 24 supplies the HTTP server, crypto and SQLite runtime; Sharp decodes images, strips metadata and limits pixel dimensions.

## API

All request bodies are JSON. Protected routes require `Authorization: Bearer <session-token>`; tokens expire after 12 hours and only their SHA-256 hashes are stored. Passwords are salted and hashed with scrypt.

| Method | Route                                    | Access / behavior                                     |
| ------ | ---------------------------------------- | ----------------------------------------------------- |
| GET    | `/api/health`                            | Service status and AI provider                        |
| POST   | `/api/auth/register`                     | Citizen account, or reviewer with private setup code  |
| POST   | `/api/auth/login`                        | Issue expiring session                                |
| POST   | `/api/auth/logout`                       | Invalidate session                                    |
| GET    | `/api/me`                                | Current user                                          |
| POST   | `/api/cases`                             | Create draft after safety + consent validation        |
| GET    | `/api/cases`                             | Own cases; reviewers see submitted cases              |
| GET    | `/api/cases/{id}`                        | Owner or reviewer only                                |
| POST   | `/api/cases/{id}/evidence`               | Base64 photo, consent, size and image validation      |
| GET    | `/api/cases/{id}/evidence/{evidence_id}` | Protected normalized JPEG                             |
| POST   | `/api/cases/{id}/analyze`                | Owner prepares a draft; AI can fail to manual mode    |
| POST   | `/api/cases/{id}/submit`                 | Owner confirms edited report                          |
| PATCH  | `/api/cases/{id}/status`                 | Reviewer-only transition with reason                  |
| PATCH  | `/api/cases/{id}/findings`               | Audited human correction linked to an evidence source |
| POST   | `/api/cases/{id}/respond`                | Owner responds to information request                 |
| POST   | `/api/cases/{id}/link`                   | Reviewer accepts/rejects heuristic suggestion         |
| GET    | `/api/cases/{id}/export`                 | Authorized case JSON export                           |

## Lifecycle

`draft → submitted → review → closed`

`submitted` or `review` can move to `more_info`; an owner response returns it to `review`. Closed cases cannot be reopened in this version. Photos can be added to drafts or information-requested cases, with up to six per case and 8 MB per input. JPEG, PNG and WebP are decoded and normalized; metadata is not retained.

Possible matches require the exact same entered location, case insensitive, and incident times within 30 minutes. This deliberately simple heuristic can miss spelling variants or flag unrelated incidents. Reviewers decide; records are never silently merged. Reviewers inspect matching case details. After an accepted link and both participants' explicit consent, participants can see the other confirmed statement and AI observations, but not private photos or reviewer-only notes.

Audit events are append-only through API behavior and SQLite triggers. Case mutations and their events are transactional. A database administrator can still alter the database or triggers: this is not a cryptographic or external tamper-proof audit system.

## Deployment limits

The SQLite file needs persistent disk and backups. Image bytes are stored as database BLOBs in this prototype. Rate limits are per process and reset on restart. Sessions are stored in the browser session storage, so shared devices should sign out. TLS, disk encryption, backup policy, retention/deletion tools, account recovery, reviewer revocation, production monitoring and independent security testing are deployment responsibilities, not completed production features.


## Participant and report workflow (1.1)

backend/case-workflow.mjs owns invitation, consent, packet review and simulated receipt storage. frontend/case-workflow.js renders those controls. Invitations are hashed, expire after 24 hours and are single use. Private invitation candidates take priority over location/time heuristics; reviewer approval is still required.

| Method | Route suffix under /api/cases/{id} | Access / behavior |
|---|---|---|
| POST | /invite | Owner, active submitted case, explicit consent; returns private code once |
| PATCH | /sharing | Owner changes future peer-summary sharing consent |
| GET | /joint-report | Reviewer-only combined evidence packet; sources remain separate |
| POST | /review-packet | Reviewer approves exact fingerprint with notes and confirmation |
| POST | /dispatch | Reviewer-only local department_demo / insurer_demo simulation; matching approval required |

The packet includes independently attributed original testimony, confirmed drafts, evidence-linked observations and corrections. Private support requests and reviewer notes are restricted. New information changes the fingerprint and prevents routing under stale approval. Receipts are idempotent for the same destination/snapshot and appear on all included case histories. No external transmission code is present.

backend/image-quality.mjs provides bounded image-quality heuristics, not a validated classifier. The frontend accessibility and language modules store device preferences separately from case data; communication cards are only added to cases by an explicit user action.
