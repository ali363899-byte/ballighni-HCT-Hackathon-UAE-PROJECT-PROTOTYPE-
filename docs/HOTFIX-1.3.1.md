# Ballighni 1.3.1 — native Android networking

A phone could open the website with Connected status while the APK could not reach the same backend. Enabled the bundled official CapacitorHttp fetch/XMLHttpRequest transport, moving remote requests through Android native networking. HTTPS and certificate validation remain enabled; backend origin controls are unchanged. The official configuration is documented at https://capacitorjs.com/docs/apis/http .

Install this APK over 1.3.0, fully close and reopen it, then Connection help → Test connection. The settings subtitle identifies build 1.3.1. Current endpoint: https://rise-gotta-long-providers.trycloudflare.com . Camera capture and YOLO11m remain included.

Verification: 21 automated reporting/camera/AI regression tests passed; Android build, signature, packaged native networking configuration and current HTTPS endpoint checked. The user's device is not attached, so this is a targeted repair pending confirmation on that phone, not a claim that its network behavior has been reproduced locally.

Also corrected transitive lockfile metadata inadvertently changed by earlier version replacements. npm ci --dry-run --ignore-scripts passes.
