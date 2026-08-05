"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log exception silently for telemetry without exposing stack trace to user
    console.error("Protected exception caught by security layer:", error?.message || error);
  }, [error]);

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
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "9999px",
          color: "#fbbf24",
          fontSize: "0.875rem",
          fontWeight: "600",
          marginBottom: "1.5rem",
        }}
      >
        500 — Protected Exception
      </div>
      <h1 style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "1rem", color: "#ffffff" }}>
        An Unexpected Error Occurred
      </h1>
      <p style={{ maxWidth: "480px", color: "#9ca3af", lineHeight: "1.6", marginBottom: "2rem", fontSize: "0.95rem" }}>
        Our security layer intercepted an unhandled runtime error. Sensitive system information and stack traces have been hidden for your protection.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ↻ Retry Request
        </button>
        <Link
          href="/"
          style={{
            padding: "0.75rem 1.5rem",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#d1d5db",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "0.5rem",
            fontWeight: "600",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
