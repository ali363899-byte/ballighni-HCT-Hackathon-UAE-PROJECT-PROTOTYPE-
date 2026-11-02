# Connection troubleshooting

## Why the old APK said the backend did not work

The APK contained the interface, not a continuously hosted backend. The local server was stopped when the work was paused. Also, `localhost` on an Android phone refers to the phone itself, not the developer's computer. A phone needs a reachable backend address.

## Local website on this computer

After `npm ci` and the AI setup from the README, double-click `START-BALLIGHNI.cmd` or run `npm run start:ai`. Keep that terminal running. Open `http://localhost:3000`. Without AI installed, `npm start` still provides manual drafting.

The runner now starts the reporting backend immediately. A slow, unavailable or crashed AI service no longer shuts down accounts and case reporting. The connection bar tells you whether damage AI is ready. Manual fallbacks are explicitly labeled.

## Android / two separate devices

Both devices must use the **same reachable HTTPS backend URL** in Connection settings. Enter the exact address, use **Test connection**, then **Save connection** and sign in. The test now checks the address currently entered, not a previously saved address. Android rejects a computer-localhost address with a clear explanation.

The website can be served by the backend itself, avoiding a separate frontend host. If the website is hosted separately, add its exact origin to `ALLOWED_ORIGINS`; keep `https://localhost` for the Android wrapper. Store the SQLite database on persistent disk.

Use separate app accounts for the participants. GitHub collaborator permission is for the source repository; it is not an app account or access to someone else's case.

## Temporary disconnection

Network errors do not erase a still-valid session. Confirmed case views refresh while connected; active draft editing is not overwritten. Reports already saved on the backend remain there. A stopped computer, expired temporary URL or unavailable hosting service still needs to be brought back online; the app cannot fix that from the phone.

Real emergency calling links and the written emergency guidance remain available in the bundled interface. The app does not dispatch emergency services.

## Selected free sharing setup

Use START-SHARED-BALLIGHNI.cmd on the host Windows computer. It prints a temporary HTTPS address for both phones and the website. Follow TEMPORARY-SHARING.md. When sharing restarts the address changes; enter the new URL in both phones. Saved local cases remain in data/. The 1.1.1 APK is prefilled for the session active at release time.
