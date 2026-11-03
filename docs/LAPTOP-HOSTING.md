# Host Ballighni on your Windows laptop

## This laptop is already prepared

If the supplied current website link already says Connected, hosting is already running; do not start a second server on the same port. The steps below are for starting it later.

1. Keep the laptop plugged in, connected to the internet and awake while sharing. The Android phones can use any internet connection.
2. Open the Ballighni folder in Visual Studio Code: open ballighni.code-workspace, or File → Open Folder → this repository.
3. Make sure Ollama is running. The selected local text model is recorded in .env as TEXT_AI_MODEL. The detector Python path is recorded as AI_PYTHON. Keep .env private.
4. Close an older Ballighni terminal with Ctrl+C. Double-click START-SHARED-BALLIGHNI.cmd, or run npm run start:shared in the VS Code terminal. Do not run both local and shared launchers at once on the same port.
5. Wait for the printed SHARE THIS WEBSITE address. Open it and check the connection bar. The detector may need a short warmup. AI text stages run in the background and show individual progress in the saved case.
6. On both phones install the latest Ballighni-Android.apk from the private GitHub release. Google Play is not required. Sign in to GitHub to download if prompted. This is a debug-signed prototype; physical-device testing is still required.
7. In the Android app, open Connection settings. Enter the exact current HTTPS address, Test connection, then Save connection. The release APK has its build-time address prefilled; update it after every sharing restart. Sign in with separate app accounts.

## Try both testimonies

1. Person A creates a report after the safety check. Add permitted photos, prepare analysis, read the four AI stages and edit/confirm the report.
2. Person B creates their own report with their own account, even if their recollection differs. Both original testimonies remain separate.
3. From A's submitted case, open Participant statements → Connect another participant → Create an invitation. Consent and share the private code with B.
4. From B's submitted case, choose I already have the other participant's code. Enter the code and consent. A reviewer must still approve the relationship before peer statements are shared.
5. A team reviewer signs in to Review desk, opens the possible related report and accepts/rejects the relationship with a reason. The private reviewer setup code is printed by the local backend when needed to create a reviewer account; never publish it or send it to ordinary app users.
6. The reviewer can request AI comparison. It uses exact source quotations and frames disagreements as review questions. Neither account is silently changed and AI does not select a truthful side or determine fault.
7. Start human review, inspect evidence, record unresolved disagreements and approve the exact packet. Demo department/insurance buttons create local simulation receipts visible to both accounts. They do not transmit anything to real agencies or insurers.

## Stop, restart and preserve data

Press Ctrl+C in the shared launcher terminal to stop that launcher's own app, AI and tunnel children. Sleep/shutdown also disconnects the phones. A new launch creates a different temporary URL; share the new website link and update both phone Connection settings. The same local cases remain in data/ballighni.sqlite. Do not delete data/ if you want to preserve cases. Back it up only while the app is stopped, and keep it private.

The current link is saved in data/temporary-link.json. Cloudflare's portable helper is downloaded into data/tools/ and SHA-256 checked before use; no Cloudflare account, paid host or Windows service is required. GitHub shares the code, not the runtime database. Do not commit data/, .env, account passwords, private photos or model weights.

## First setup on a different laptop

Install Node.js 24, Python 3.12 and Ollama from their official websites. Clone the private repository using VS Code's Clone Repository command; the teammate already has access. In its terminal:

```powershell
npm ci
py -3.12 -m venv .venv-ai
.venv-ai\Scripts\python.exe -m pip install -r ai/requirements.txt
node scripts/download-model.mjs
Copy-Item .env.example .env
```

Set AI_PYTHON in .env to the new .venv-ai/Scripts/python.exe path. Run `ollama pull qwen3.5:9b`. In .env set `TEXT_AI_ENABLED=true`, `TEXT_AI_MODEL=qwen3.5:9b` and `TEXT_AI_TIMEOUT_MS=240000`. Start Ollama before starting Ballighni. The trained image detector works separately; a missing text model must appear as unavailable, not a successful AI result.

Then use START-SHARED-BALLIGHNI.cmd. No Android SDK is required to run the server or install the already-built APK. Building your own APK is a separate developer task in ANDROID.md.

Voice support: open Voice in the app header, choose a navigation command or read-aloud, or use Dictate into this field below a text area. Allow microphone access only when you choose to start listening. Check transcribed testimony before submitting. Android needs a compatible installed speech service; a device keyboard microphone and TalkBack remain alternatives.
