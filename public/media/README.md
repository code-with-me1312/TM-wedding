# Wedding media

This intentionally photo-free layout works before personal assets are supplied.
Place one or two optimized couple photos here (e.g. couple.webp), ideally under 200 KB each. Set `wedding.photos` in src/app/config/wedding.config.ts with a `/media/…` path and meaningful alt text. The public site shows only the first two.

Music is a documented empty placeholder: `wedding.music = null`. No remote music is downloaded or played. To enable it, add a licensed/royalty-free instrumental MP3 here and set `music: '/media/our-song.mp3'`. Confirm the recording's license (a public-domain composition does not imply its recording is free). The audio element is created only after a gesture; volume is 25%, looping. Playback failure never blocks the invitation.

## Photorealistic invitation stationery

`stationery/envelope-paper.webp` and `stationery/wax-seal-tm.webp` are original generated photographic-style assets made with the built-in image generation tool. The envelope is split across independent front/flap layers so its opening animation remains physical. The seal has real-looking pooled edges and a relief TM impression rather than an overlaid font.

Phones up to 640px use `stationery/envelope-paper-mobile.webp` (about 121 KB); the transparent seal is about 62 KB. Desktop paper is about 385 KB. The CSS surfaces and the visible image share the same cached asset URL. Transparent alpha is preserved in the WebP assets. Exact generation prompts are saved in `docs/stationery-prompts.json`.
