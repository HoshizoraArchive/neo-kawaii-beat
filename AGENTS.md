# AGENTS.md

## Project

NEO KAWAII BEAT is a mobile-first browser rhythm game that will become part of the 星空Village game line.

## Read only when relevant

- Chart or difficulty changes: `docs/chart-format.md`
- Game-loop, audio-sync, renderer, or engine changes: `docs/architecture.md`
- Adding or replacing songs: `docs/adding-a-song.md`
- Manual release checks: `docs/manual-test-matrix.md`

## Boundaries

- Keep React responsible for screens/UI and Canvas 2D responsible for gameplay rendering.
- Gameplay timing and judgment must stay based on the Web Audio / `AudioClock` song clock, not requestAnimationFrame timing, DOM position, timers, or `HTMLAudioElement.currentTime`.
- Keep the MVP mobile-first and usable with touch; PC keyboard support must continue to work.
- Do not add Phaser, PixiJS, Three.js, Howler.js, external CDN assets, auth, Supabase, analytics, monetization, or unrelated platform features unless the task requires them.
- Do not deploy or merge as a side effect of ordinary implementation work.

## Validation

Use the smallest relevant checks first. Before handing off a completed code change, run:

```sh
npm run lint
npm run test
npm run build
```

For chart changes, also confirm notes remain time-sorted, lane values stay within 0-3, holds do not overlap illegally on the same lane, and the intended difficulty separation is visible from note density/patterns.
