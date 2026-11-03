# People of Determination support

Open **Accessibility** from the app header.

- Larger text, higher contrast and reduced-motion preferences are saved on the device.
- A local communication card can say, for example, “Please give me extra time. I prefer written communication.” No diagnosis is needed.
- Read-aloud is started only by the user and uses the device speech service; it has a clear fallback when unsupported.
- The report form has an optional communication/access support request, visible to authorized reviewers. The user explicitly chooses whether to add a saved card.
- Photos are optional for text-only reporting. Labels, focus indicators and mobile touch targets are retained.
- A safely-stopped confirmation is required by the reporting interface. This feature supports reporting and communication, not vehicle control or fitness-to-drive assessment.

Emergency guidance is red and includes Police 999, Fire/Civil Defence 997 and Ambulance 998, verified against the [UAE Government emergency contacts](https://u.ae/en/Media/Emergencies). If calling is inaccessible, users should rely on their established official accessible emergency arrangement or a trusted nearby caller; Ballighni has no emergency dispatch connection.

This is an accessibility-focused prototype, not a claim of full accessibility certification. Test it with actual screen readers, Android devices and People of Determination before relying on it operationally.

## Voice and reading support (1.2)

The Voice header button opens a dialog without discarding an in-progress form. It offers one-utterance navigation commands in English/Arabic, read-page aloud and Stop controls. Navigation recognizes a small explicit whitelist. Dictation buttons append recognized speech into editable report, support and reviewer text fields. Review the words before confirmation; speech does not submit reports or call emergency numbers.

Android has a custom Capacitor bridge for the system SpeechRecognizer and TextToSpeech. The microphone permission is requested only when the user starts listening. Recognition is canceled when the activity pauses. The app needs an installed compatible speech service/language; the service may need network access. Web browsers use Web Speech where supported and show an honest unavailable/permission-denied message otherwise. The device/browser speech provider processes audio; Ballighni does not record audio into its case database.

Extra large touch targets and spacious reading preferences are saved on the device. Larger text, high contrast, reduced motion, keyboard labels and the optional communication card remain available. Native speech code is compile-checked; an actual Android device must still verify microphone permission, installed speech provider/language, recognition and TTS. Browser screenshots and command-parser tests do not establish hardware audio behavior.
