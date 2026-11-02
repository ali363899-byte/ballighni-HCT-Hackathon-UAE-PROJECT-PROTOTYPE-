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
