# Shared backend deployment package

`Dockerfile.prototype` packages the website, Node/SQLite API and local CPU damage model into one service. It does not make a paid account, deploy itself or create an official integration.

Example after choosing a host and reviewing its costs/terms:

```sh
docker build -f Dockerfile.prototype -t ballighni-prototype .
docker run --rm -p 3000:7860 -v ballighni-data:/app/data \
  -e PUBLIC_ORIGIN=https://YOUR-CHOSEN-HOST \
  -e REVIEWER_SETUP_CODE=YOUR-PRIVATE-RANDOM-CODE \
  ballighni-prototype
```

Use persistent storage for `/app/data`; otherwise accounts and evidence can disappear on a host rebuild/restart. The host must provide HTTPS and enough CPU/RAM for PyTorch inference. The model service stays on loopback and uses a per-start private token. Do not expose port 8787 publicly.

Set `PUBLIC_ORIGIN` to the host's exact HTTPS origin so the same-origin website can call the API. Keep `https://localhost` in `ALLOWED_ORIGINS` for Android. Build the APK with `PUBLIC_API_URL` set to that host or enter the URL in the app's Connection settings.

The existing `Dockerfile` is a smaller manual-mode backend; the full damage-inference image is `Dockerfile.prototype`. The new full image must be built and tested on the selected host before claiming deployment verification. It has not been deployed merely by being committed.

Only use synthetic or explicitly permitted data during prototype evaluation. This package does not provide production security certification, commercial model/data rights or authorization to transmit information to real agencies or insurers.

## Hosted deployment selected (2 November 2026)

The owner has now authorized a shared hosted HTTPS backend, with no paid service or upgrade without approval. Railway was selected for account connection and an eligibility check, not yet claimed as deployed. A Railway account must be connected before account resources can be inspected or created. Browser-only setup is supported: no desktop software or ChatGPT plugin installation is required. The owner prefers the browser path; the GitHub sign-in authorization is awaiting confirmation.

### Concrete service settings

| Setting             | Value                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| Source              | Private GitHub repository ali363899-byte/ballighni, main                              |
| Dockerfile          | Dockerfile.prototype (not the manual-only Dockerfile)                                 |
| Public service      | One replica; website and API on the same generated HTTPS domain                       |
| Target port         | 7860, or the platform-provided PORT                                                   |
| Health path         | /api/health                                                                           |
| Persistent volume   | Mount at /app/data before first live use                                              |
| DATA_DIR            | /app/data                                                                             |
| PUBLIC_ORIGIN       | Exact generated https:// domain, with no path or trailing slash                       |
| REVIEWER_SETUP_CODE | Privately generated random secret stored in provider variables                        |
| OMP_NUM_THREADS     | 1 for the small CPU prototype                                                         |
| Paid upgrade        | Not authorized; stop and explain the exact price if trial is unavailable/insufficient |

The container initializes the volume's top-level ownership, then runs the API and AI as the unprivileged node user. Inference config also uses DATA_DIR. Do not upload the local data folder or .env: the host starts with an empty prototype database. Existing local synthetic cases are not migrated automatically.

Railway's current documentation lists 1 GB RAM and 0.5 GB volume storage for Trial, versus 0.5 GB RAM on Free. PyTorch/Node memory use must be measured during actual trial deployment; no free-tier reliability promise is made. Credits can expire or be exhausted. Do not enable a paid fallback. Render Free has no persistent disks, so it is unsuitable for this existing SQLite application without a storage migration.

Current Railway docs deprecate railway.json / railway.toml for new services. Configure through the connected provider's current tools/settings; do not add an obsolete config file. References: https://docs.railway.com/pricing/plans, https://docs.railway.com/volumes/reference, https://docs.railway.com/config-as-code, https://render.com/docs/free.

### Acceptance checks after browser sign-in

1. Verify plan, remaining trial eligibility/credit and spending behavior before creation. Obtain approval before any paid plan.
2. Create one service and persistent volume. Keep the private repository private and never expose inference port 8787.
3. Wait for successful build/start, confirm HTTPS website and /api/health with ai_available=true.
4. Use separate synthetic app accounts to upload a permitted evaluation image and verify AI findings, participant linking, human review and both local simulation receipts.
5. Restart the service and verify the same saved accounts/cases still exist on the volume.
6. Build a new APK with the tested HTTPS URL and verify its manifest/signature. Test on physical Android hardware when available.
7. Record the actual website URL, plan limits, AI result, persistence check and APK release. Until those checks pass, do not mark hosted phone support complete.

## Final choice: temporary sharing

The actual Railway account dashboard reported that new-account trials are paused and required an upgrade. No upgrade/payment was made. The owner selected free temporary HTTPS sharing while this computer stays on. See TEMPORARY-SHARING.md. The shared launcher starts the existing Node/SQLite and Python AI locally, allows only the generated public origin, and forwards only the web/API port. This supersedes the uncompleted Railway deployment path above; it is not a persistent cloud host.
