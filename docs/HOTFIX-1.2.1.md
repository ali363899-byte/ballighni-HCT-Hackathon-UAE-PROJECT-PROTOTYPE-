# Ballighni 1.2.1 interaction hotfix

- Fixed a language observer that continually rewrote the page.
- Case actions become available without waiting for evidence photos or reviewer details; photos load independently with retry.
- Stable case-section navigation works across interface languages.
- Registration displays username and password errors and reopens in sign-in mode.
- Stale navigation responses are ignored.
- Saved outdated temporary backend URLs migrate to the current shared endpoint; permanent custom servers remain configured.

Validation: all 14 reporting, AI and access tests passed, plus a new language-observer regression test. Browser account creation, safety checkbox, report form, expandable options and involvement selection passed. Android build, APK signature and packaged HTTPS endpoint verified. Physical Android device testing remains necessary.
