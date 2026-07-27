"use client";

// Replaces the root layout entirely when the layout itself fails, so it can't
// rely on globals.css or the theme script — styles are inline on purpose.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1628",
          color: "#fff",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "16px",
        }}
      >
        <title>Something went wrong — Contrakr</title>
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              margin: "0 0 28px",
            }}
          >
            Contrakr
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94A3B8", lineHeight: 1.6, margin: "0 0 28px" }}>
            We hit an unexpected error. Try again in a moment.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              background: "#1E6FFF",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: "28px", fontSize: "11px", color: "#475569" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
