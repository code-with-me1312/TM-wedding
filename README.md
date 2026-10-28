# TM Wedding

A mobile-first Angular invitation for **Mostafa & Tasneem**, 27 November 2026 at 6 PM, Mountain Rose Hotel, 6 October City, Egypt. Creamy ivory stationery, a burnt-orange envelope with a chocolate-brown TM seal, a responsive invitation, live countdown, private RSVP links, and a protected host guestbook.

## Run locally

Use Node **24.15+** (Node 24 LTS recommended) and a current npm (11+).

```sh
npm ci
npm start
```

Open http://localhost:4200. `/` is the public invitation with no guest information; `/preview` demonstrates personalization and RSVP using this tab's sessionStorage only. The preview is explicitly labeled and never writes to Firebase. `/invite/{64-character-token}` is a real guest invitation. `/admin` is protected and redirects to `/admin/login`.

```sh
npm test                 # model, countdown, validation and token tests
npm run build            # production → dist/tm-wedding/browser
npm run test:rules        # Firestore rules integration tests (Java 21+)
```

The app is configured for Firebase project `tm-wedding-95636`. Normal development and production builds use this real project; `npm run start:emulators` remains isolated on `demo-tm-wedding`. `/preview` still uses sessionStorage and never writes guest responses to Firebase. Cloud Firestore, Email/Password Auth, security rules, indexes, and both host allowlist entries are deployed. No demonstration admin bypass is shipped.

## Architecture

Angular 22.2 standalone components, strict TypeScript, signals, reactive forms, lazy feature routes, Tailwind CSS 4 and component CSS. Angular's default zoneless change detection is used. The modular Firebase SDK handles Firestore and email/password authentication; AngularFire is unnecessary for this small service layer. No Node backend, Cloud Functions, paid WhatsApp API, or Storage bucket is required.

```text
src/app/config/                  typed wedding content and Firebase configuration
src/app/core/                    models, utilities, Firebase/auth/data services, route guard
src/app/features/invitation/     full-screen envelope and scroll chapters
src/app/shared/                  scroll choreography and lifecycle-safe directive
src/app/features/admin/          login, dashboard, invitation CRUD and sharing
public/media/                    optional photos and music
firestore.rules                  actual authorization and validation boundary
firestore.indexes.json           no composite indexes; message indexing disabled
firebase.json                    Hosting routing, security headers, emulator ports
tests/                          unit, browser and Firestore rules tests
```

The invitation keeps tightly related sections in one standalone feature rather than creating a component for each decorative block. Data access and configuration remain separate. The admin feature is lazy-loaded; only exact document reads are used by guests. Firebase data is not persisted to disk by the application.

## Firebase project setup

The supplied web app configuration and local CLI default target `tm-wedding-95636`. On 2026-09-26, Firestore Standard Native `(default)` was provisioned in the Firebase CLI default location `nam5` (US multi-region), with the free-tier database enabled. Invitation rules and indexes were deployed. Email/Password Auth was enabled using the checked-in `auth.providers` configuration. Both requested hosts have enabled admin allowlist records, and their sign-in and allowlist reads were verified. Local domains `localhost` and `127.0.0.1` are authorized.

At `/admin/login`, enter your host email and select **Set or reset password** to request your own password link. No password is stored in this repository. `/preview` remains a demonstration; use `/admin` to create real guest links. Firebase Hosting was deployed on 2026-09-26 at `https://tm-wedding-95636.web.app`. Analytics is intentionally not initialized, even though the supplied configuration includes a measurement ID.

The following steps are retained as a reference for recreating the setup:

1. In [Firebase Console](https://console.firebase.google.com/), create a project with display name **TM Wedding**. Choose an available project ID (it must be globally unique). Analytics is optional and is intentionally not integrated because invitation URLs are private capabilities.
2. Register a **Web app**, e.g. “TM Wedding invitation.” Copy the web configuration into `src/app/config/firebase.config.ts`: `apiKey`, `authDomain`, `projectId`, and `appId`. Firebase web configuration is public; it does not grant administrator rights. Never add service-account JSON/private keys, passwords, or OAuth secrets to source control.
3. Create **Cloud Firestore**, Native mode, in **production mode**. Choose a region near your guests (e.g. Europe); the database location is difficult to change later. Deploy the included rules before entering guest data. Do not use test-mode/open rules.
4. Under Authentication → Sign-in method, enable **Email/Password** only. Configure the Hosting domain under Authorized domains. Add localhost for development if needed.
5. Authentication → Users → Add user: create one account for **Mostafa** and one for **Tasneem**, each with a separate private email and strong password. Share credentials privately. Copy each Firebase Authentication UID.
6. In the Firestore Console, manually create `admins/{Mostafa_UID}` and `admins/{Tasneem_UID}`, each containing the boolean field `enabled: true`. These documents are an allowlist. A signed-in account without an enabled document is not an admin. Browser clients cannot create or edit this allowlist. To revoke access, set `enabled: false` or remove the document, and disable the Auth account.
7. Storage is not needed. Place the 1–2 photos and music in `public/media/` so Hosting serves them. No permissive Storage rules are required.
8. Install/login to the Firebase CLI via the local dependency, select your project, and deploy:

```sh
npx firebase login
npx firebase use --add
npm run build
npx firebase deploy --only firestore,auth,hosting
```

`.firebaserc` is ignored so a local project selection is not accidentally reused elsewhere. You can instead pass `--project YOUR_PROJECT_ID` to each Firebase command. The project selector and authenticated Firebase account must point to your own project. Cloud rules/Auth deployment and the two real host accounts are configured. Publishing Hosting is a separate deployment.

9. Visit the returned `https://YOUR_PROJECT_ID.web.app/admin`, sign in, create an invitation, and copy its link. Verify on another browser/device that the link loads and the RSVP can be changed. Verify an unallowlisted account cannot view the guestbook.

### Hosting and custom domains

`firebase.json` serves `dist/tm-wedding/browser` and rewrites client routes to `index.html`. Direct WhatsApp links such as `/invite/{token}` therefore work on reload. Security headers disable referrer sharing and framing, with a same-origin asset policy and Firebase connections. Keep photos/audio local, or update the CSP deliberately for a chosen external media provider. JS/CSS outputs are fingerprinted and cached; the HTML document is revalidated.

Later, Firebase Console → Hosting → Add custom domain, follow ownership verification and DNS instructions, and wait for Firebase's TLS certificate. Add the new domain in Authentication's Authorized domains. New shared links use the browser's current origin. Existing links on `web.app` remain valid while that site remains active.

## Content, date and visual settings

Edit `src/app/config/wedding.config.ts` to change names, date/time, venue, address, map link, messages, theme colors, WhatsApp template, photos or music. Date labels and the ISO countdown target are explicit so the presentation is fully controllable; update them together. The target is `2026-11-27T18:00:00+02:00` (16:00 UTC; Egypt winter time). The timer clamps at zero and changes its message after the wedding.

Photos: add up to two `.webp`/`.avif`/JPEG files to `public/media`, preferably under 200 KB each and about 800–1200 pixels wide. Set e.g. `photos: [{src: '/media/couple.webp', alt: 'Mostafa and Tasneem together'}]`. They load lazily. No stock couple is presented as the actual couple; the design is complete without photos.

Music: a documented empty placeholder is intentional. Add a licensed instrumental recording as `public/media/our-song.mp3` and set `music: '/media/our-song.mp3'`. See `public/media/README.md`. There is no audio request before the envelope tap. Playback starts at 25% volume, loops, and has a floating mute/play control. A browser/audio failure does not block the invitation.

System Georgia and Arial avoid font downloads and layout shifts. Custom locally hosted fonts can be added in `src/styles.css` with `font-display: swap`. Reduced-motion users receive the invitation immediately without the physical animation. The envelope is a keyboard-accessible button, opening transfers focus to the scroll/continue control (or directly to the heading in reduced-motion mode), controls use native labels/radio inputs, and section links work without animation support.

## Firestore model and security

```text
admins/{authUid}
  enabled: boolean

invitations/{token}              # cryptographically random 256-bit hex ID
  displayName: string           # 1–120 characters
  invitedCount: integer         # 1–100
  createdAt: timestamp
  updatedAt: timestamp
  rsvp:
    status: pending | attending | declined
    attendingCount: integer
    message: string             # at most 1,000 characters
    updatedAt: timestamp | null
```

The **token itself is the document ID**, generated with Web Crypto `crypto.getRandomValues` (32 random bytes). There is no public token-to-ID query or sequential ID. Creation is transactional and collision-safe. The token is never entered manually.

A private link is a **bearer capability**, like a private invitation delivered on paper. Anybody given that full URL can see that invitation and update its RSVP. It does not establish a person's legal identity, and cannot stop a guest forwarding their own link. The application never claims otherwise. Do not store email addresses, phone numbers, internal notes, or other administrative information in these guest-readable documents. To revoke a leaked link, delete the invitation and create a fresh one.

Security is enforced by **get vs. list separation**, not by an assumed query filter: `get` permits an exact 64-hex token; `list` and all collection queries require an enabled authenticated admin. Knowing one token provides no path to discover the other independent 256-bit tokens. Guests cannot create/delete invitations, modify names/counts/timestamps, grant themselves admin access, or list admin documents. A signed-in non-admin has no additional privileges. Guesses of a well-formed but nonexistent token return an empty result with no guest data. Malformed IDs are denied.

Guests can replace only the `rsvp` map and server-managed `updatedAt`. Rules strictly validate the field allowlist, response type, integer count bounded by the invitation, decline count of zero, message length, and server timestamps. The rest of the invitation must remain unchanged. Admin edits cannot reduce invited count below the existing confirmed headcount. Updates to the same document are idempotent; the submit button also blocks concurrent submits. Across devices, the most recent successful RSVP wins. Reopening retrieves the saved server response; failed/offline reads and writes display retry messages.

This capability model can be implemented securely with direct Firestore access, so **no Cloud Function is necessary**. If the requirements later change to verifying individual identity, one-time links, stronger rate limiting, or hidden administrative fields, use separately protected data and a narrowly scoped server/token-exchange flow. Do not weaken these rules. Firestore rules are not filters: see [Firestore secure queries](https://firebase.google.com/docs/firestore/security/rules-query) and [field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields).

No composite indexes are required: admins load the wedding-sized collection and search/filter locally. Invitation count, invited headcount, confirmed invitation count, and confirmed headcount are calculated separately. The message field is unindexed.

## Emulator workflow

Use Java **21+**, Node 24+, and the installed Firebase CLI. The dedicated emulator build replaces the Firebase configuration with `firebase.emulator.ts`, which contains only dummy demo settings; no production file editing is needed.

```sh
npm run emulators
# In a second terminal:
npm run start:emulators
```

Open http://127.0.0.1:4000 to create Auth users and their matching `admins/{uid}` allowlist documents. Alternatively, create users in the Auth emulator REST API, then add their UID documents in the emulator UI. Emulator data is separate from production. The default `npm run build` uses the production configuration, where `useEmulators` remains false.

`npm run test:rules` starts an isolated Firestore emulator and covers capability reads, missing/malformed links, denied collection enumeration, denied unauthenticated writes, count/message/timestamp validation, RSVP updates, and allowlisted admin create/edit/delete. Unit tests cover token generation, countdown, statistics, and client validation. Test data is synthetic.

## WhatsApp and operations

The dashboard creates an encoded `https://wa.me/?text=…` URL from `wedding.whatsappTemplate` using `{name}` and `{url}`. Opening it lets the host choose a recipient and send through WhatsApp; the app never sends messages automatically. Copy Link uses the browser clipboard, with the visible/selectable private URL as fallback.

Guest-facing screens handle initial load, missing invitations, transient errors, submitting and success. The admin dashboard offers create/edit/delete with explicit confirmation, search/filter, messages/dates, URL copy and WhatsApp links. It records an invitation as opened only when the guest taps the wax seal, then shows the first-open time and an aggregate opened count. Loading or previewing a link does not mark it opened. Use the Refresh/Retry action after connectivity problems. Guest records are rendered with Angular escaping, never HTML injection.

Before going live: configure Firebase, create the two allowlisted accounts, deploy rules/Hosting, add your chosen licensed music/photos if desired, and verify a real private link and RSVP from a separate browser. A live Firebase project and authenticated account are required to verify production connectivity; a successful local build does not substitute for that step.

## Browser verification

With the Auth/Firestore emulators and `npm run start:emulators` running, run `npm run test:e2e`. The suite uses installed Google Chrome, creates synthetic emulator-only accounts with random credentials, grants a local test allowlist entry, and checks admin CRUD, guest RSVP persistence, invalid links, keyboard opening, responsive layouts and reduced motion. It never contacts a production project or sends WhatsApp messages. Test screenshots are saved in ignored `test-results/`.

## Autumn palette and scroll choreography

The reference palette leads with **burnt orange** `#ab501c`, **creamy ivory** `#f8efdf`, **camel** `#d4c3a2`, and **chocolate brown** `#583426`. Terracotta, restrained mustard-gold and sage support the main colors. Edit the typed theme in `wedding.config.ts`; the legacy `burgundy` key now aliases terracotta for shared admin controls.

The opening is one continuous scene: tapping breaks the seal, unfolds the flap and zooms the physical envelope to fill the viewport. Scrolling then draws out the paper, levels it, expands it to the viewport and reveals the names/date. Subsequent pinned chapters resolve the invitation message line by line and bring the date card into place. The venue, countdown and closing use shorter scroll-linked reveals; the RSVP form remains directly usable.

`ScrollSceneDirective` uses passive scroll events and requestAnimationFrame outside Angular change detection, updating CSS variables for transform/opacity. Scroll position is the source of truth: all scenes reverse when scrolling back. There is no wheel interception, scroll-jacking, video download or animation dependency. ResizeObserver remeasures scene dimensions; listeners and frames are cleaned up on navigation. The scroll cue is also a keyboard-accessible Continue button, and “Skip to invitation” bypasses the envelope sequence. Page anchors retain the current private invitation path.

Reduced-motion preferences and viewports under 600px high use ordinary document flow, no long pinned distances, no camera zoom, and fully visible content. The unopened seal stays usable in these modes. Optional couple photos remain outside the pinned chapter so they cannot crowd a phone viewport.

Motion tests in `tests/scroll-motion.test.ts` verify timing boundaries, clamping and reversibility. Browser tests in `tests/e2e/motion.spec.ts` verify full-screen zoom, intermediate/final scroll states, reverse scrolling, preserved route anchors and reduced-motion behavior at desktop and mobile widths. Run the guest/motion checks without seeding admin data using `npm run test:e2e -- tests/e2e/guest.spec.ts tests/e2e/motion.spec.ts` against the running preview.
