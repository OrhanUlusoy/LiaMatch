"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sv">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, backgroundColor: "#0f0d1a", color: "#f0eef5" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Något gick fel</h1>
          <p style={{ color: "#a8a3b8", marginBottom: "2rem" }}>Ett kritiskt fel uppstod.</p>
          <button
            onClick={reset}
            style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", backgroundColor: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
          >
            Försök igen
          </button>
        </div>
      </body>
    </html>
  );
}
