# Android APK without Google Play

The Android app bundles the website in a native Capacitor container. Android 7.0 / API 24 or newer is required. The backend and damage model run on a computer/server, not inside the APK.

## Easiest shared build

1. Open the GitHub repository → **Actions → Build Android APK**.
2. Choose **Run workflow**. Optionally enter your shared backend's HTTPS URL.
3. After success, download the **Ballighni-Android-APK** artifact and unzip it.
4. Transfer `app-debug.apk` to your Android phone, open it and follow Android's installation prompts for that file source. You do not need Google Play.
5. Open Ballighni → **Connection settings**, enter the trusted HTTPS backend URL if it was not included in the build, then create/sign in to your account.

Do not enter `localhost:3000` as the phone's backend: localhost refers to the phone itself. The packaged app intentionally requires HTTPS for remote servers. The backend must allow `https://localhost` in `ALLOWED_ORIGINS`, which is included in the default configuration.

## Build locally from VS Code

Install Java 21+ and Android SDK platform 36 / build-tools 36.0.0 using official Android tools. Set `JAVA_HOME` and `ANDROID_HOME`. Then:

```sh
npm ci
npm run android:sync
# Windows:
cd android
.\gradlew.bat assembleDebug
# macOS/Linux: ./gradlew assembleDebug
```

The result is `android/app/build/outputs/apk/debug/app-debug.apk`. Generated native source is included, so both teammates can build the same project. Android Studio can open `android/` for native debugging; the web and backend code remain editable in VS Code.

## Debug vs release

The provided build is signed with a **debug key** for testing. For ongoing distribution, create and privately store a release signing key, generate a signed release APK, and preserve the same key for future updates. Never commit signing keys or passwords. A different signing key may require uninstalling an earlier version, which can clear the app's local settings. This project does not provide a production signing identity or Play Store deployment.

The APK's overview, safety guidance and synthetic example can open without a backend. Real accounts, stored cases, uploads and AI require the backend. Physical Android-device behavior must be tested separately from successful compilation.
