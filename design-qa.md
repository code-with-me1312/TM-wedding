**Source visual truth**

- Path: `/Users/mostafamarey/Desktop/Screenshot 2026-10-29 at 12.34.02 AM.png`
- Source pixels: 2048 × 1100
- Reference state: invitation vow chapter, desktop, partially revealed title

**Implementation evidence**

- URL: `http://127.0.0.1:4200/preview#our-invitation`
- Browser: Codex in-app browser
- Desktop capture: 2048 × 1100 CSS px at browser density; watermark computed at 770px with a 1014.86 × 770px bounding box. Document scroll width remained 2048px.
- Mobile capture: 390 × 844 CSS px at browser density; watermark computed at 241.8px with a 318.7 × 241.8px bounding box. Document scroll width remained 390px.
- State: invitation opened, “Skip to invitation” used, vow chapter pinned in view
- Primary interactions tested: open invitation and skip to invitation
- Console errors checked: none

**Full-view comparison evidence**

- At 2048 × 1100, the watermark preserves the reference composition: it remains oversized, faint, top-right aligned, and intentionally cropped by the chapter viewport.
- At 390 × 844, the watermark scales from the limiting viewport axis and remains within the composition without causing horizontal page overflow.

**Focused region comparison evidence**

- A separate crop was not needed because the requested surface—the large background “TM”—is clearly readable in both full-view captures. Its computed bounding box and document overflow were checked directly at each breakpoint.

**Findings**

- No remaining P0/P1/P2 issues in the requested background watermark behavior.
- Typography: Lora, weight, line height, letter spacing, opacity, and monogram crop remain consistent with the reference.
- Spacing/layout: desktop placement is unchanged; mobile width now constrains the monogram without horizontal overflow.
- Colors/tokens: the existing camel watermark color and low opacity are unchanged.
- Image quality: not applicable; the watermark is live text, as in the existing implementation.
- Copy/content: “TM” is unchanged.

**Comparison history**

- Earlier P2 finding: `70svh` used height alone, so a tall/narrow viewport could produce a watermark substantially wider than the screen.
- Fix: changed the font size to `min(70svh, 62vw)` and added `white-space: nowrap`.
- Post-fix evidence: desktop retains a 770px watermark at 2048 × 1100; mobile scales to 241.8px at 390 × 844; neither viewport gains document-level horizontal overflow.

**Implementation checklist**

- [x] Preserve desktop visual scale and crop.
- [x] Constrain the watermark on narrow screens.
- [x] Prevent line wrapping.
- [x] Verify desktop and mobile browser rendering.
- [x] Verify no console errors.

**Follow-up polish**

- None required for this scoped change.

final result: passed
