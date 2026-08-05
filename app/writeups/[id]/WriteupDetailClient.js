"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WriteupDetailClient({ item, related = [] }) {
  const [saved, setSaved] = useState(false);
  const [read, setRead] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("hunter-archive-bookmarks") || "[]");
      const readList = JSON.parse(localStorage.getItem("hunter-archive-read") || "[]");
      setSaved(bookmarks.some((b) => (typeof b === "string" ? b === item.id : b.id === item.id)));
      setRead(readList.some((r) => (typeof r === "string" ? r === item.id : r.id === item.id)));
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

  const copyCitation = async () => {
    const markdown = `[${item.title}](${item.url}) - ${item.author || item.source_label || "Security Writeup"}`;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main>
      <div className="app-bg-glow" />

      {/* Top Navbar */}
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
          </div>

          <h1 className="detail-title">{item.title}</h1>

          <div className="tool-row" style={{ paddingTop: 0, borderTop: 0, marginBottom: 24 }}>
            <button className={`btn-secondary ${saved ? "highlight" : ""}`} onClick={toggleSave}>
              {saved ? "★ Saved in Bookmarks" : "☆ Save Bookmark"}
            </button>
            <button className="btn-secondary" onClick={toggleRead}>
              {read ? "✓ Marked as Read" : "○ Mark as Read"}
            </button>
            <button className="btn-secondary" onClick={copyCitation}>
              {copied ? "✓ Citation Copied!" : "📋 Copy Citation (Markdown)"}
            </button>
            {item.url && (
              <a className="btn-primary" href={item.url} target="_blank" rel="noopener noreferrer">
                Open Original Article ↗
              </a>
            )}
          </div>

          {item.summary && <div className="detail-summary">{item.summary}</div>}

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
