import Link from "next/link";

export const metadata = {
  title: "404 — Target Not Found | The Hunter Archive",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08090a",
        color: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          padding: "0.4rem 1rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "9999px",
          color: "#f87171",
          fontSize: "0.875rem",
          fontWeight: "600",
          marginBottom: "1.5rem",
        }}
      >
        404 — Target Not Found
      </div>
      <h1 style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "1rem", color: "#ffffff" }}>
        Target Lost in the Archive
      </h1>
      <p style={{ maxWidth: "480px", color: "#9ca3af", lineHeight: "1.6", marginBottom: "2rem", fontSize: "0.95rem" }}>
        The security writeup or endpoint you requested does not exist, was relocated, or was filtered by safety policies.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          href="/"
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#ffffff",
            borderRadius: "0.5rem",
            fontWeight: "600",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          ← Return to Archive Search
        </Link>
      </div>
    </div>
  );
}
