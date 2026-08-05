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
    <main className="detail-page">
      <Link className="back-link" href="/">
        ← Back to archive
      </Link>

      <div style={{ marginTop: "30px" }}>
        <span className="eyebrow">
          {item.source_label || item.source} · {item.platform || "Security Research"}
        </span>
        <h1 style={{ marginTop: "12px" }}>{item.title}</h1>
      </div>

      <div className="detail-meta">
        <span>Author: {item.author || "Unknown author"}</span>
        <span>Date: {item.published_at ? new Date(item.published_at).toLocaleDateString("en-IN") : "Undated"}</span>
        {item.bounty && <span className="bounty-badge">💰 Bounty: {item.bounty}</span>}
      </div>

      <div className="action-bar">
        <button className="action-btn" onClick={toggleSave}>
          {saved ? "★ Saved in Bookmarks" : "☆ Save Bookmark"}
        </button>
        <button className="action-btn" onClick={toggleRead}>
          {read ? "✓ Marked as Read" : "○ Mark as Read"}
        </button>
        <button className="action-btn" onClick={copyCitation}>
          {copied ? "✓ Citation Copied!" : "📋 Copy Citation (Markdown)"}
        </button>
        {item.url && (
          <a className="action-btn" href={item.url} target="_blank" rel="noopener noreferrer">
            Open Original Article ↗
          </a>
        )}
      </div>

      {item.summary && <p className="detail-summary">{item.summary}</p>}

      <div className="case-tags">
        {(item.tags || []).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      {related.length > 0 && (
        <section className="related-section">
          <span className="eyebrow">Related signals</span>
          <h3 style={{ margin: "6px 0 0", font: "500 24px var(--font-display), Inter, sans-serif" }}>More Writeups Like This</h3>
          <div className="related-grid">
            {related.map((rel) => (
              <a key={rel.id} href={`/writeups/${rel.id}`} className="related-card">
                <span>{rel.source_label || rel.source}</span>
                <h4>{rel.title}</h4>
                <span>{rel.author ? `by ${rel.author}` : "Security Research"}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
