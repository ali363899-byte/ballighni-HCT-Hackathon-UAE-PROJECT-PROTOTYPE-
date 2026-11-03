# Work together without confusion

## Owner and collaborator

Repository: https://github.com/ali363899-byte/ballighni-HCT-Hackathon-UAE-PROJECT-PROTOTYPE-

Owner: `ali363899-byte`. Collaborator: `abdulrahmanabuseedo`. The invitation has been accepted; both developers have access.

Both developers use **Visual Studio Code**. VS Code edits the project; GitHub shares and versions it. Android Studio is optional for native debugging; VS Code and Gradle can build the APK.

## Daily workflow

1. Open the project in VS Code and use Source Control to fetch/pull `main`.
2. Create a short branch, such as `feature/witness-form` or `fix/photo-upload`.
3. Make one focused change and run `npm test` and `npm run build`.
4. Commit with a plain description, push your branch and open a GitHub pull request.
5. Ask your teammate to review, then merge. Pull again before starting the next change.

Suggested ownership: one teammate owns `frontend/` and UI; the other owns `backend/` and `ai/`. Both review API changes and integrate frequently. Keep endpoint contracts in `docs/ARCHITECTURE.md` current.

Each local checkout has its own database. To see the same live cases, both clients must connect to one shared HTTPS backend. GitHub synchronizes source code, not the runtime database.

## Five-minute synthetic demo

1. Create separate citizen and reviewer accounts.
2. As the citizen, report a synthetic minor incident and pass the safety gate.
3. Enter `Al Jurf, Ajman`, a recent time and an explicitly fictional description. Use only permitted photos, or leave photos empty.
4. Prepare a draft, inspect findings and limitations, edit the narrative and submit.
5. Submit a separate witness report at exactly the same entered location and within 30 minutes.
6. Sign in as reviewer. Open the driver case, inspect evidence and accept or reject the possible witness link with a reason.
7. Start review, request information, return to the citizen and respond, then close through the reviewer account.
8. Export the case JSON. No official verdict is issued.

## Protect private files

Never commit `.env`, `data/`, personal evidence, passwords, AI service tokens or signing keys. GitHub repository access is separate from app account access.
