# Share Ballighni temporarily with phones

The owner selected free temporary HTTPS sharing instead of a paid host. The backend, SQLite cases, evidence and trained AI remain on the host computer. Cloudflare forwards only the reporting web/API port over HTTPS. This is not an always-on cloud deployment.

## Start on the host Windows computer

1. Install project dependencies and set up the AI as described in START-HERE.md / AI-MODEL.md.
2. Stop an already-running local Ballighni server before starting shared mode. The launcher refuses to replace an occupied port.
3. Double-click START-SHARED-BALLIGHNI.cmd, or run npm run start:shared from the repository.
4. On first use the launcher downloads Cloudflare's official portable Windows x64 helper into ignored data/tools/. Its pinned SHA-256 must match before it runs. No installer, administrator change, Cloudflare account or ChatGPT plugin is required. A portable helper process does run on this computer.
5. Keep the terminal open and computer awake. Wait for the app connection bar to show Connected and Damage AI ready.
6. Share the printed HTTPS website URL with your teammate. The current URL is also in ignored data/temporary-link.json. Keep app passwords and the reviewer setup code private.

## On both Android phones

Install the APK directly. The 1.1.1 test APK is prefilled with the URL active when it was built. In Connection settings, use the current printed HTTPS URL, Test connection, Save connection and sign in with separate accounts. If the URL changes, update it on both phones; rebuilding the APK is unnecessary.

Both clients now use the same SQLite database. Private participant invitations and reviewer approval connect independently confirmed statements. GitHub collaborator permission does not create an app account. Department and insurance receipts remain simulations.

## Stop / restart

Press Ctrl+C in the shared launcher terminal to stop its own tunnel and app/AI process tree. Stopping sharing removes public access. It does not delete saved cases in data/. Restarting produces a new URL, while the same local cases remain. Update Connection settings on each phone. The website served by the backend always uses its current origin, avoiding an expired APK build URL.

Do not launch two shared sessions on the same port. The launcher does not install a Windows service or change firewall rules. Sleep, shutdown, network loss or a closed terminal disconnects phones. Quick Tunnels have no uptime guarantee and are for testing, not official emergency reporting.

## Other computers / systems

The automatic helper downloader currently supports Windows x64. On another OS, get cloudflared from Cloudflare's official downloads, run cloudflared tunnel --url http://127.0.0.1:3000, and set PUBLIC_ORIGIN to the resulting exact HTTPS origin before starting the backend. Keep inference port 8787 private. Share only synthetic/permitted prototype data and preserve application sign-in/access controls.

Reference: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/.
