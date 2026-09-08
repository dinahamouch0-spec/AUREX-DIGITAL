import { loadFont } from "@remotion/fonts";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/**
 * The storefront's self-hosted subsets, reused verbatim. Arabic and Latin are
 * separate files registered under one family, so a mixed line renders in a
 * single typeface. Rendering is held until the faces are ready — otherwise the
 * first frames would go out in a fallback font.
 */
const faces = [
  { family: "Cairo", url: "fonts/Cairo-arabic.woff2", weight: "400 700" },
  { family: "Cairo", url: "fonts/Cairo-latin.woff2", weight: "400 700" },
  { family: "Baloo Bhaijaan 2", url: "fonts/Baloo-arabic.woff2", weight: "400 800" },
  { family: "Baloo Bhaijaan 2", url: "fonts/Baloo-latin.woff2", weight: "400 800" },
];

const handle = delayRender("Loading Ya 7kayti fonts");

Promise.all(
  faces.map(({ family, url, weight }) =>
    loadFont({ family, url: staticFile(url), weight, format: "woff2" }),
  ),
)
  .then(() => continueRender(handle))
  .catch((error) => cancelRender(error));
