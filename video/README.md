# Ya 7kayti — video

[Remotion](https://www.remotion.dev) project for Ya 7kayti's promo and social
video. It is a **self-contained sub-project**: its own `package.json`,
`node_modules` and TypeScript config. Nothing here is part of the storefront
build (`npm run build` at the repo root only reads `src/`), so the two never
interfere.

## Commands

Run all of these from this `video/` directory.

```bash
npm install        # first time only
npm run dev        # Remotion Studio at http://localhost:3000
npm run lint       # eslint + tsc
npm run build      # bundle for @remotion/renderer or Remotion Lambda
```

Render a composition to a file:

```bash
npx remotion render HelloWorld out/hello.mp4
```

`out/` is git-ignored, so rendered video never lands in the repo.

## Compositions

| ID | Component | Size | Duration |
|---|---|---|---|
| `HelloWorld` | `src/HelloWorld.tsx` | 1920×1080 @ 30fps | 150 frames (5s) |
| `OnlyLogo` | `src/HelloWorld/Logo.tsx` | 1920×1080 @ 30fps | 150 frames (5s) |

Both come from Remotion's starter template and are placeholders — replace them
with real Ya 7kayti scenes. Compositions are registered in `src/Root.tsx`;
the `defaultProps` there are overridable per render via
[parametrized rendering](https://www.remotion.dev/docs/parametrized-rendering).

## Notes on this setup

- **No Tailwind.** The starter ships with it; it was removed because no
  component used a single class. Styling stays plain CSS, like the storefront —
  components use inline styles, and `src/index.css` is loaded globally by
  `src/Root.tsx` for anything shared.
- **Fonts.** The storefront self-hosts Cairo, Baloo Bhaijaan 2 and Nunito in
  `../src/assets/fonts/`. Load those (or `@remotion/google-fonts`) rather than
  introducing a fourth typeface.
- **Rendering in a headless container.** Remotion downloads its own Chrome
  Headless Shell on first render. Where one is already present — such as a
  Claude Code web session — point at it instead:

  ```bash
  npx remotion render HelloWorld out/hello.mp4 \
    --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
  ```

  Plain Chromium will not do: it has dropped the old headless mode Remotion
  expects, and the render fails at browser launch.

## Docs

[Fundamentals](https://www.remotion.dev/docs/the-fundamentals) ·
[CLI](https://www.remotion.dev/docs/cli) ·
[Discord](https://discord.gg/6VzzNDwUwV)

## License

Remotion is free for individuals and teams of up to three people; larger
companies need a license. [Read the terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
