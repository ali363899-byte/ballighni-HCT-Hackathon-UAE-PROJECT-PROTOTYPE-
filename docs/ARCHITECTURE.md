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

| Method | Route                                    | Access / behavior                                    |
| ------ | ---------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/health`                            | Service status and AI provider                       |
| POST   | `/api/auth/register`                     | Citizen account, or reviewer with private setup code |
| POST   | `/api/auth/login`                        | Issue expiring session                               |
| POST   | `/api/auth/logout`                       | Invalidate session                                   |
| GET    | `/api/me`                                | Current user                                         |
| POST   | `/api/cases`                             | Create draft after safety + consent validation       |
| GET    | `/api/cases`                             | Own cases; reviewers see submitted cases             |
| GET    | `/api/cases/{id}`                        | Owner or reviewer only                               |
| POST   | `/api/cases/{id}/evidence`               | Base64 photo, consent, size and image validation     |
| GET    | `/api/cases/{id}/evidence/{evidence_id}` | Protected normalized JPEG                            |
| POST   | `/api/cases/{id}/analyze`                | Owner prepares a draft; AI can fail to manual mode   |
| POST   | `/api/cases/{id}/submit`                 | Owner confirms edited report                         |
| PATCH  | `/api/cases/{id}/status`                 | Reviewer-only transition with reason                 |
| POST   | `/api/cases/{id}/respond`                | Owner responds to information request                |
| POST   | `/api/cases/{id}/link`                   | Reviewer accepts/rejects heuristic suggestion        |
| GET    | `/api/cases/{id}/export`                 | Authorized case JSON export                          |

## Lifecycle

`draft → submitted → review → closed`

`submitted` or `review` can move to `more_info`; an owner response returns it to `review`. Closed cases cannot be reopened in this version. Photos can be added to drafts or information-requested cases, with up to six per case and 8 MB per input. JPEG, PNG and WebP are decoded and normalized; metadata is not retained.

Possible matches require the exact same entered location, case insensitive, and incident times within 30 minutes. This deliberately simple heuristic can miss spelling variants or flag unrelated incidents. Reviewers decide; records are never silently merged. Only the reviewer sees another reporter's matching case details.

Audit events are append-only through API behavior and SQLite triggers. Case mutations and their events are transactional. A database administrator can still alter the database or triggers: this is not a cryptographic or external tamper-proof audit system.

## Deployment limits

The SQLite file needs persistent disk and backups. Image bytes are stored as database BLOBs in this prototype. Rate limits are per process and reset on restart. Sessions are stored in the browser session storage, so shared devices should sign out. TLS, disk encryption, backup policy, retention/deletion tools, account recovery, reviewer revocation, production monitoring and independent security testing are deployment responsibilities, not completed production features.
