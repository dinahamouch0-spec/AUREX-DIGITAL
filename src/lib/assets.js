// Content-hashed asset paths.
//
// Assets are served with a one-year immutable cache, which is only safe when
// the filename changes with the content. The build fills this manifest, and
// every reference to an asset goes through asset() so a changed file always
// produces a new URL and reaches returning visitors immediately.

let manifest = {};

/** Called by the build once hashed filenames are known. */
export function setManifest(m) { manifest = m || {}; }

/** Map an original asset path to its hashed one, or return it unchanged. */
export function asset(p) { return manifest[p] || p; }
