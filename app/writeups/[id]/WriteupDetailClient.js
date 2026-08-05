"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function generateAttackBreakdown(item) {
  const text = `${item.title || ""} ${item.summary || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
  
  let vulnType = "Web Security Vulnerability";
  let fix = "Implement strict input validation, contextual output encoding, and enforce least-privilege authorization controls.";

  if (text.includes("ssrf") || text.includes("server-side request forgery")) {
    vulnType = "Server-Side Request Forgery (SSRF)";
    fix = "Enforce URL whitelisting, block private IP ranges (10.0.0.0/8, 169.254.169.254), and mandate AWS IMDSv2 headers.";
  } else if (text.includes("idor") || text.includes("insecure direct object")) {
    vulnType = "Insecure Direct Object Reference (IDOR)";
    fix = "Enforce object-level access control checks (ABAC/RBAC) on the server side for every API request.";
  } else if (text.includes("rce") || text.includes("remote code execution") || text.includes("command injection")) {
    vulnType = "Remote Code Execution (RCE)";
    fix = "Avoid executing shell commands via system(). Use parameterized APIs and strict input sanitization.";
  } else if (text.includes("xss") || text.includes("cross-site scripting")) {
    vulnType = "Cross-Site Scripting (XSS)";
    fix = "Enforce Context-Aware Output Encoding, strict Content-Security-Policy (CSP), and HttpOnly cookie flags.";
  } else if (text.includes("sqli") || text.includes("sql injection")) {
    vulnType = "SQL Injection (SQLi)";
    fix = "Use Parameterized Prepared Statements (ORM) for all database queries and disable verbose error messages.";
  } else if (text.includes("oauth") || text.includes("jwt")) {
    vulnType = "OAuth 2.0 / JWT Authentication Bypass";
    fix = "Strictly verify JWT signatures on the backend, enforce state parameter validation, and reject 'alg: none'.";
  }

  return { vulnType, fix };
}

export default function WriteupDetailClient({ item, related = [] }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const breakdown = generateAttackBreakdown(item);
  const cveMatch = (item.title || "").match(/CVE-\d{4}-\d{4,7}/i) || (item.summary || "").match(/CVE-\d{4}-\d{4,7}/i);

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("hunter-archive-bookmarks") || "[]");
      setSaved(bookmarks.some((b) => (typeof b === "string" ? b === item.id : b.id === item.id)));
    } catch {}
  }, [item.id]);

  const toggleSave = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("hunter-archive-bookmarks") || "[]");
      let next;
      if (saved) {
        next = bookmarks.filter((b) => (typeof b === "string" ? b !== item.id : b.id !== item.id));
      } else {
        next = [...bookmarks, item];
      }
      localStorage.setItem("hunter-archive-bookmarks", JSON.stringify(next));
      setSaved(!saved);
    } catch {}
  };

  const copyReport = async () => {
    const fullText = `# ${item.title}\n\n` +
      `**Source:** ${item.source_label || item.source} | **Author:** ${item.author || "Security Researcher"}\n` +
      `**Date:** ${item.published_at || "Undated"} ${item.bounty ? `| **Bounty:** ${item.bounty}` : ""}\n` +
      `**URL:** ${item.url}\n\n` +
      `## Overview & Technical Summary\n${item.summary || "Security vulnerability analysis report."}\n\n` +
      `**Vulnerability:** ${breakdown.vulnType}\n` +
      `**Remediation:** ${breakdown.fix}\n\n` +
      `---\n*Collected from The Hunter Archive — Developed by JOJIN JOHN*`;

    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main>
      <div className="app-bg-glow" />

      <nav className="top-nav">
        <div className="nav-container">
          <Link className="btn-secondary" href="/">
            ← Back to Archive
          </Link>
          <div className="brand-logo">
            <span>HUNTER ARCHIVE</span>
          </div>
        </div>
      </nav>

      <div className="detail-container">
        <article className="detail-card">
          <div className="detail-meta">
            <span className="card-source">{item.source_label || item.source || "Security Research"}</span>
            {item.published_at && (
              <span>· {new Date(item.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            )}
            {item.author && <span>· by {item.author}</span>}
            {item.bounty && <span className="bounty-pill">💰 Bounty: {item.bounty}</span>}
            {cveMatch && (
              <a
                href={`https://nvd.nist.gov/vuln/detail/${cveMatch[0]}`}
                target="_blank"
                rel="noreferrer"
                className="brand-badge"
                style={{ textDecoration: "none", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.1)" }}
              >
                🔍 {cveMatch[0].toUpperCase()}
              </a>
            )}
          </div>

          <h1 className="detail-title">{item.title}</h1>

          {/* Clean 3-Action Header */}
          <div className="tool-row" style={{ paddingTop: 0, borderTop: 0, marginBottom: 24, gap: 10 }}>
            {item.url && (
              <a className="btn-primary" href={item.url} target="_blank" rel="noopener noreferrer">
                Open Original Article ↗
              </a>
            )}
            <button className="btn-secondary" onClick={copyReport}>
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Report"}
            </button>
            <button className={`btn-secondary ${saved ? "highlight" : ""}`} onClick={toggleSave}>
              {saved ? "★ Saved" : "☆ Save Bookmark"}
            </button>
          </div>

          {/* Clean Report Summary */}
          <div className="detail-summary" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
            {item.summary || "Click 'Open Original Article ↗' above to read the full technical disclosure."}
          </div>

          {/* Minimal 2-Line Vulnerability Note */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <strong style={{ color: "var(--text-primary)" }}>🎯 Vulnerability: </strong>
              <span style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>{breakdown.vulnType}</span>
            </div>
            <div>
              <strong style={{ color: "var(--text-primary)" }}>💡 Defense Fix: </strong>
              <span style={{ color: "var(--text-secondary)" }}>{breakdown.fix}</span>
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="card-tags" style={{ marginTop: 20 }}>
              {item.tags.map((tag) => (
                <span className="tag-badge" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="related-section">
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px", color: "var(--text-primary)" }}>
              More Writeups Like This
            </h3>
            <div className="related-grid">
              {related.map((rel) => (
                <a key={rel.id} href={`/writeups/${rel.id}`} className="related-card">
                  <div>
                    <span className="card-source" style={{ fontSize: 10 }}>{rel.source_label || rel.source}</span>
                    <h4>{rel.title}</h4>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                    {rel.author ? `by ${rel.author}` : "Security Research"}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer>
        <p>The Hunter Archive — Developed by <strong>JOJIN JOHN</strong></p>
      </footer>
    </main>
  );
}
