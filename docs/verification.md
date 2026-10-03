# Verification — 26 September 2026

- Angular 22.2 production build passed. Initial entry is approximately 70 KB compressed; invitation/Firebase code is loaded in lazy chunks (additional transfer is required for the guest route).
- 15 unit tests passed: token format/entropy generation, invalid tokens, invitation loading, RSVP validation/persistence, countdown, statistics, admin allowlisting and authorization failures.
- 6 Firestore emulator tests passed: exact capability reads, missing tokens, denied list/filtered queries, constrained RSVP writes, invalid counts/messages/timestamps, and administrator CRUD.
- 5 Chrome browser tests passed: keyboard envelope opening; preview RSVP save/change/reopen; invalid links/protected routes; mobile reduced motion; 320/390/768/1440px width checks; full Auth/Firestore emulator host-to-guest flow including create, edit, delete, RSVP persistence, share URL encoding and revoked links.
- Desktop envelope, mobile/full invitation and admin dashboard screenshots inspected. No horizontal overflow in tested widths.
- Production dependency audit: zero known vulnerabilities. The initial full install reported five moderate findings in development tooling; no forced major-version changes were applied.
- No production Firebase project configuration, real guest data, passwords, live Hosting deployment or music recording was supplied. Those production integrations/assets are therefore not verified. Photos/music remain optional, documented placeholders.

Run commands and configuration steps are in the main README. The demo emulator is isolated under `demo-tm-wedding`; it cannot address a live Firebase project.

## Autumn palette and scroll-animation update

- Production build passes with the expanded motion scenes; initial entry remains approximately 70 KB compressed, and the invitation feature is approximately 12 KB compressed (Firebase/shared chunks are additional).
- 19 unit tests pass, including scroll-range clamping, final-state readability and reversible choreography.
- 7 guest/motion browser tests pass, covering 320/390/768/1440px layouts, envelope zoom that exceeds the viewport, intermediate/final paper reveal, reverse scrolling, message/date stages, route-preserving anchors, RSVP save/change/reopen, keyboard operation, and reduced motion.
- Inspected desktop welcome plus mobile paper extraction, message and date screenshots. Fixed overlapping name motion, initial reduced-motion envelope positioning and zoom calculations based on a rotated bounding box.
- Firestore/admin logic was not changed in this visual update; the security verification above is from the initial implementation.

## Photorealistic stationery update

- Generated original transparent envelope and wax-seal artwork with the built-in image generation tool; exact prompts are in `docs/stationery-prompts.json`.
- Optimized WebP assets preserve transparency. Mobile loads a 121 KB envelope plus a 62 KB seal; desktop envelope is 385 KB. Image bytes are additional to the JavaScript/CSS build sizes listed above.
- The photographed surfaces remain separate moving layers, preserving flap opening, seal movement, full-screen zoom, extraction and reverse scrolling.
- Production build and all 3 motion browser tests pass, including actual image loading, mobile asset selection, desktop/mobile animation, and reduced-motion behavior. Desktop closed and mobile opened views were inspected.
