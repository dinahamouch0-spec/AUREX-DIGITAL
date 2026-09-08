# Ya 7kayti — video

[Remotion](https://www.remotion.dev) project for Ya 7kayti's promo video. It is
a self-contained sub-project with its own `package.json` and TypeScript config;
the storefront build only reads `../src`, so the two never interfere.

## Commands

Run these from this `video/` directory.

```bash
npm install                 # first time only
npm run dev                 # Remotion Studio at http://localhost:3000
npm run lint                # eslint + tsc
npm run music               # regenerate the music bed
npm run render              # → out/ya7kayti-reel.mp4
```

`out/` is git-ignored, so rendered video never lands in the repo.

## The reel

`Ya7kaytiReel` — 1080×1920, 30fps, 30 seconds. Vertical for Instagram Reels,
TikTok and WhatsApp Status.

A girl talks about her own personalised story in Lebanese Arabic and the
captions carry what she says, burned in, RTL, with the spoken word lifted as it
lands. Six scenes, one 14-frame cross-dissolve between each:

| Scene | Frames | What it does |
|---|---|---|
| `Hook` | 0–104 | She reacts, before the product is ever shown |
| `Reveal` | 104–260 | The book rises in, with a sheen across the page |
| `Personal` | 260–430 | Rings drawn around the child's name and photo |
| `Hero` | 430–580 | The emotional beat — spotlight and sparkle orbit |
| `Quality` | 580–740 | Three reasons to trust the product |
| `Outro` | 740–900 | Logo, promise, and the one action to take |

The script and every caption timing live in `src/ya7kayti/script.ts`. Change the
words there and the presenter's mouth, the highlight and the scene timings all
follow.

## What is real and what is a slot

- **The presenter is an illustration**, `src/ya7kayti/Girl.tsx` — flat vector in
  the brand palette, blinking on her own schedule with her mouth driven by the
  caption track. She is drawn rather than filmed on purpose: a shop selling
  personalised products for children should not put a real child's face in an ad
  it did not shoot. To use real footage instead, drop a clip in `public/` and
  render it with `<OffthreadVideo>` in place of `<Presenter>`.
- **There is no voiceover.** The captions deliver the lines. To add a real
  voice, record `public/audio/vo.mp3` and set the composition's `voiceover` prop
  to `"audio/vo.mp3"` — the music ducks to 35% on its own.
- **The music is original.** `scripts/make-music.mjs` synthesises it sample by
  sample — marimba over a soft pad, glockenspiel, brushed shaker, F major at
  96 BPM — so nothing here is licensed from anyone. Edit the arrangement at the
  bottom of that file and re-run `npm run music`.
- **The photograph** is the supplied product shot, cropped to the book at
  `public/img/story.jpg`. `story-full.jpg` is the untouched original; re-crop
  from it rather than from the crop.

## Notes on this setup

- **No Tailwind.** The Remotion starter ships with it; it was removed because
  nothing used it. Styling is inline, like the rest of the project.
- **Brand tokens** in `src/ya7kayti/theme.ts` mirror the storefront's
  `01-tokens.css`, and the fonts in `public/fonts/` are the same self-hosted
  Cairo and Baloo Bhaijaan 2 subsets the site serves.
- **Rendering in a headless container.** Remotion downloads its own Chrome
  Headless Shell on first render. Where one already exists — a Claude Code web
  session, for instance — point at it:

  ```bash
  npx remotion render Ya7kaytiReel out/ya7kayti-reel.mp4 \
    --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
  ```

  Plain Chromium will not do: it has dropped the old headless mode Remotion
  expects, and the render fails at browser launch.

## Docs

[Fundamentals](https://www.remotion.dev/docs/the-fundamentals) ·
[CLI](https://www.remotion.dev/docs/cli)

## License

Remotion is free for individuals and teams of up to three people; larger
companies need a licence. [Read the terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
