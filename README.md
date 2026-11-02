# Ballighni · Fantastic Four

One report. One platform. A smarter response.

An accident-evidence **hackathon prototype** with driver and witness reporting, source-linked damage findings, user-confirmed drafts, protected cases, human review and a status timeline. No official police, insurer or emergency integration is claimed.

## Start here in VS Code

1. Clone this repository, then open `ballighni.code-workspace` in **Visual Studio Code**.
2. Install Node.js 24 LTS. In VS Code's terminal run:

```sh
npm ci
npm start
```

3. Open `http://localhost:3000`. Create a citizen account using **Sign in → Create an account**. Passwords require at least 12 characters.
4. For a reviewer account, use the random **reviewer setup code** printed by the backend at startup. Enter it in the optional reviewer-code field while registering a separate account. Keep it private.

Use `npm run dev` during backend development. VS Code tasks are available under **Terminal → Run Task**.

## Which folder is which?

| Folder / file        | Purpose                                                        | Main files to edit                  |
| -------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `frontend/`          | Website and Android screens                                    | `app.js`, `style.css`, `index.html` |
| `backend/`           | Accounts, API, case database, evidence, review and audit       | `server.mjs`, `ai.mjs`              |
| `ai/`                | Optional pretrained vehicle-damage inference service           | `service.py`, `requirements.txt`    |
| `android/`           | Native Android app project generated with Capacitor            | `app/`, Gradle files                |
| `tests/`             | Access, validation, report lifecycle and AI failure tests      | `api.test.mjs`, `ai.test.mjs`       |
| `scripts/`           | Web build, model download and AI startup                       | JavaScript scripts                  |
| `docs/`              | Architecture, Android, AI and team guides                      | Start with `TEAM-GUIDE.md`          |
| `.github/workflows/` | Automatic checks and downloadable APK build                    | `checks.yml`, `android.yml`         |
| `.vscode/`           | Shared editor tasks and extension suggestions                  | `tasks.json`                        |
| `data/`              | Local SQLite database and AI configuration, created at runtime | **Private; never commit**           |
| `.env`               | Local settings based on `.env.example`                         | **Private; never commit**           |

## Enable the pretrained damage model

The project integrates the trained YOLOv8n checkpoint from [artemxdata/Car-Damage-Assessment-AI](https://github.com/artemxdata/Car-Damage-Assessment-AI), pinned to a source revision and SHA-256 checksum. It detects possible visible damage classes; it does not reconstruct accidents or determine liability. See [AI-MODEL.md](docs/AI-MODEL.md) for provenance, limitations and licensing.

Use **Python 3.12** for the AI environment:

```sh
python -m venv .venv-ai
# Windows:
.venv-ai\Scripts\python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
.venv-ai\Scripts\python -m pip install -r ai/requirements.txt
# macOS/Linux: replace .venv-ai\Scripts\python with .venv-ai/bin/python
node scripts/download-model.mjs
npm run start:ai
```

Stop the plain `npm start` server before starting AI mode. The runner starts a private loopback inference service and the app together. If Python is elsewhere, set `AI_PYTHON` in `.env`. Without the model, `npm start` works with honest manual drafts and no fabricated damage findings. An optional Ollama adapter is also included; it requires explicit `AI_PROVIDER=ollama`, Ollama and a downloaded vision model.

## Android APK — no Google Play required

Open [ANDROID.md](docs/ANDROID.md). The same frontend is bundled as a native Android app. It needs a reachable **HTTPS backend** for accounts, reports and AI. The website and APK connect to the same backend; the backend does not run inside the phone.

GitHub → **Actions → Build Android APK** builds a debug APK. Download the workflow artifact, unzip it and open the APK on Android. You can also build locally with Android SDK 36 and Java 21+.

## Work together

The repository owner invites the teammate through **Settings → Collaborators**. The teammate must accept the invitation. Both developers clone the same repository, create separate feature branches, commit, push and open pull requests. Do not share an account or password. See [TEAM-GUIDE.md](docs/TEAM-GUIDE.md).

## Verify

```sh
npm test
npm run build
npm audit
```

Tests cover emergency/consent validation, upload format and duplicate rejection, private case access, user confirmation, status transitions, witness linking, information requests, audit history, session invalidation and honest AI fallback. They do not establish damage-model accuracy.

## Hosting

The full app runs on a Node.js 24 server or the included Docker image. Mount persistent storage at `/app/data`, terminate HTTPS at your host, set `REVIEWER_SETUP_CODE` to a strong private random value, and configure exact `ALLOWED_ORIGINS` for the website and `https://localhost` for the Android wrapper. The included Docker image runs manual mode; damage mode needs the separate Python service.

The static frontend can be hosted separately, then connected through **Connection settings**. A static website host alone cannot run the SQLite backend. Public deployment requires a chosen backend host and persistent storage. Use synthetic or permitted data until security, retention and operational review are complete.
