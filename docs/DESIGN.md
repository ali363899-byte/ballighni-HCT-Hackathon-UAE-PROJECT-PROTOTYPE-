# Ballighni visual identity

The shared web/Android interface uses dark navy (#102C4A), white (#FFFFFF), soft mint (#BFE8D0) and a pale blue background (#F4F7FB). Emergency guidance keeps its red treatment. Contrast and larger-text preferences override decorative styling where needed.

frontend/logo.svg is the original vector mark: two overlapping speech forms for independent accounts, with a check for the confirmation/review journey. It does not represent an official government seal or approval. scripts/generate-icons.mjs generates Android launcher assets from that one vector. frontend/design.css contains the current shared design system; frontend/style.css provides the base layouts and accessibility rules.

Home prioritizes a safely stopped report, witness journey and case tracking. Capture groups personal observations, photo previews and optional support/connection fields. Saved cases show progress, source-linked damage, four AI roles, separate testimonies and an explicit editable confirmation. Voice controls open without replacing an in-progress form.

Phone layouts were inspected at 320px and 390px, including Arabic RTL. Full Arabic explanatory prose remains incomplete. Android native audio and physical-device interaction must be checked on real hardware; a browser layout preview is not a hardware test.
