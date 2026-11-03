# Ballighni 1.4 — appeal requests and document-based prototype login

- Residents can create an account and sign in with Emirates ID plus password. Tourists use passport number, issuing country and password. Existing username/team logins continue to work. New accounts still choose a public username to keep identity numbers out of the interface.
- Format validation is not identity verification. There is no UAE PASS, ICP, immigration or passport-system integration. Use fictional details for the prototype. Identity-login registration requires explicit consent.
- Full identity numbers are not stored: a keyed HMAC lookup is stored separately from report data; numbers are not included in sessions, case exports or shared testimonies. The server key is private in data/identity-lookup.key. Back it up with the SQLite database; losing it prevents document-based lookup. Username/password login still works. Data/ and its keys are ignored by Git.
- The owner of a submitted or closed case can request another human review. One pending appeal per case; the reviewer accepts/reopens for review or declines with a reason. Original testimony and confirmed report remain unchanged. Appeals are visible only to the owner and authorized reviewers, not connected participants. This is not an official police or insurer appeal.

Validation: 24 automated tests passed, including identity password checks, issuing-country separation, raw-number non-disclosure, owner-only appeals, duplicate requests, reviewer-only decisions and unchanged original reports. Android build/signature and packaged endpoint/assets verified. Resident/tourist form switching checked in the live website. Physical Android device testing remains necessary.

Install Ballighni-Android.apk over the existing app. Choose Sign in → sign-in method, or Create account for a new resident/tourist account. Existing username-only accounts must continue using Username; identity linking for existing accounts is not implemented. Open a submitted case → Appeal / request another review.

Website/backend: https://rise-gotta-long-providers.trycloudflare.com . Keep the host laptop awake with backend and sharing running. No new payment, government connection or real insurance transmission was enabled.
