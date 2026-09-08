/**
 * Brand tokens, mirrored from the storefront's src/assets/css/01-tokens.css so
 * the video and the site cannot drift apart.
 */
export const color = {
  ink: "#10103a",
  inkSoft: "#4b4a72",
  pink: "#ee2e86",
  pinkCta: "#f0609f",
  pinkDeep: "#c4185f",
  blush: "#fdeef6",
  blushDeep: "#fbdcec",
  purple: "#50418f",
  sky: "#3fa3d4",
  mint: "#2fbe84",
  gold: "#f5b915",
  bg: "#fffcf8",
  surface: "#ffffff",
} as const;

export const font = {
  display: "'Baloo Bhaijaan 2', 'Cairo', system-ui, sans-serif",
  body: "'Cairo', system-ui, sans-serif",
} as const;

/** The reel is 1080×1920 — Instagram Reels, TikTok and WhatsApp Status. */
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_IN_FRAMES = 900; // 30s, matching the music bed

/** One dissolve length for the whole piece. Consistency reads as intent. */
export const DISSOLVE = 14;

/** The house spring: settles without wobbling. */
export const SOFT = { damping: 200, stiffness: 110, mass: 0.9 } as const;
export const SNAPPY = { damping: 26, stiffness: 190, mass: 0.7 } as const;
