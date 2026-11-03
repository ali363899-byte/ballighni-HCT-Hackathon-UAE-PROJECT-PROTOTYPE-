# Ballighni 1.2.2 Android startup repair

## Fixes
- Corrected Android voice calls to use the injected Capacitor nativePromise bridge. The injected bridge does not provide registerPlugin; calling it during navigation prevented the main screen from rendering.
- Voice cleanup failures cannot block navigation.
- Render the home interface immediately without waiting for a saved-session network request.
- Connection status distinguishes a missing APK backend address from an unreachable host.

## Server verification
The backend process had stopped while the Cloudflare tunnel was still active. Restarted reporting and trained damage AI without changing the shared URL. Verified externally with Android origin https://localhost: CORS preflight, AI health, account registration, login, synthetic report save and read-back all passed on 3 November 2026.

## Validation
All 18 automated tests passed, including three new Android bridge/offline-startup regressions. Android version 1.2.2, version code 6 built successfully. APK signature and actual packaged voice code and backend URL verified. A physical phone was not connected; microphone and touch behavior need a device check.

## Install and connect
Download Ballighni-Android.apk from this release and install over the previous version. Do not use the 1.2.0 or 1.2.1 APK. Open Overview; the main content must appear even offline. With this laptop awake and the server and sharing processes running, the connection bar should say Connected. The current temporary backend is https://rise-gotta-long-providers.trycloudflare.com . If needed, open Connection help, paste that address, Save connection, then Test connection.

The free temporary server requires this laptop to stay awake and online. Stopping the backend breaks live reports; restarting sharing can change the URL. There is no always-on hosting in this setup. Department/insurance routing remains a simulation.
