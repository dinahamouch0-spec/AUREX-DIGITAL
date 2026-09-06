// Root-level fallback. Required because this app has no shared
// app/layout.tsx — [locale] and admin each define their own <html>/<body>
// (Next.js "multiple root layouts" pattern) — so an unmatched top-level
// path (e.g. a malformed locale) still needs somewhere to render.
import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffaf3",
          color: "#241b4e",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, opacity: 0.7 }}>404</p>
          <h1 style={{ fontSize: 24, margin: "8px 0" }}>Page not found</h1>
          <Link href="/ar" style={{ color: "#ec4899" }}>
            العودة إلى يا حكايتي
          </Link>
          {" · "}
          <Link href="/en" style={{ color: "#ec4899" }}>
            Back to Ya 7kayti
          </Link>
        </div>
      </body>
    </html>
  );
}
