# Ballighni · Fantastic Four · Prototype

This release includes the Android APK, a source-code archive and a detailed delivery report. The private repository contains all frontend, backend, AI adapters, Android project, VS Code settings, tests and guides.

## Install the APK

Download `Ballighni-Android.apk`, transfer it to an Android phone and follow Android's normal installation prompts. Google Play is not required. Android 7.0+ is required.

This is a debug-signed test build. The bundled overview and synthetic example can open without a server. Accounts, reporting, evidence and AI require your shared HTTPS backend, entered through **Connection settings**. No backend hosting has been deployed; the owner requested GitHub and local use only.

## Start the code

Open `ballighni.code-workspace` in Visual Studio Code. Install Node.js 24, then run `npm ci` and `npm start`. Open `http://localhost:3000`. Follow the README for the optional pretrained damage AI setup.

The source archive excludes `.env`, runtime databases, private images, credentials, signing keys and third-party model weights. Pinned, checksum-verified model downloaders are included instead. The live AI path was tested locally.

## Work together

`abdulrahmanabuseedo` has a pending write invitation. Accept it at https://github.com/ali363899-byte/ballighni/invitations, then clone the private repository. Read `docs/TEAM-GUIDE.md` and `docs/PDF-CHECKLIST.md`.

Five regression tests pass; the dependency audit reports zero vulnerabilities. Local Android compilation and APK signature verification passed. Phone layouts were inspected at 320px and 390px without horizontal overflow. No physical Android device was available, so hardware testing is still required.

This is a hackathon prototype, not an official reporting service. AI outputs are unverified damage observations, never fault, injury, roadworthiness, claim or official police decisions.
