"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SOURCES = [
  { id: "all", label: "All sources" },
  { id: "medium", label: "Medium" },
  { id: "walkthroughs", label: "Walkthroughs" },
  { id: "ctf", label: "CTF writeups" },
  { id: "bugbounty", label: "Bug bounty" },
  { id: "blogs", label: "Security blogs" },
  { id: "research", label: "Research blogs" },
  { id: "github", label: "GitHub READMEs" },
  { id: "pentesterland", label: "Pentester Land" },
];

const QUICK_VULNS = [
  "RCE", "SSRF", "IDOR", "XSS", "OAuth", "SQLi", "LFI", "Account Takeover", "JWT", "Authentication bypass"
];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "undated";

const highlight = (text, query) => {
  if (!query || !text) return text;
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : part
  );
};

export default function Page() {
  const searchRef = useRef(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [viewTab, setViewTab] = useState("all"); // 'all' | 'bookmarks' | 'unread'
  const [sort, setSort] = useState("relevance");
  const [filters, setFilters] = useState({ tag: "", author: "", platform: "", from: "", to: "" });

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [read, setRead] = useState([]);
  const [discover, setDiscover] = useState({ recent: [], trending: [], timeline: [] });
  const [status, setStatus] = useState(null);
  const [sourceRequests, setSourceRequests] = useState([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [showRequestsList, setShowRequestsList] = useState(false);
  const [dark, setDark] = useState(true);

  const reset = (fn) => {
    fn();
    setPage(1);
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ source, page: String(page), pageSize: "40", sort });
    if (q.trim()) params.set("q", q.trim());
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params;
  }, [q, source, filters, page, sort]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") || "");
    setSource(params.get("source") || "all");
    try {
      setBookmarks(JSON.parse(localStorage.getItem("hunter-archive-bookmarks") || "[]"));
      setRead(JSON.parse(localStorage.getItem("hunter-archive-read") || "[]"));
      setDark(localStorage.getItem("hunter-archive-theme") !== "light");
    } catch {}
    fetch("/api/discover").then((res) => res.json()).then(setDiscover).catch(() => {});
  }, []);

  useEffect(() => {
    const url = queryString.toString();
    window.history.replaceState({}, "", url === "source=all&page=1&pageSize=40&sort=relevance" ? window.location.pathname : `?${url}`);
  }, [queryString]);

  useEffect(() => {
    document.body.classList.toggle("light-mode", !dark);
    localStorage.setItem("hunter-archive-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?${queryString}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Search failed");
        if (!cancelled) {
          setResults((current) => (page === 1 ? data.results : [...current, ...data.results]));
          setTotal(data.total);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [queryString, page]);

  useEffect(() => {
    const video = document.querySelector(".bg-video");
    let animationFrame;
    let currentY = 0;
    let targetY = 0;

    // Ensure video plays continuously at full native HD resolution without seek pixelation
    if (video && video.paused) {
      video.play().catch(() => {});
    }

    const updateParallax = () => {
      targetY = window.scrollY * 0.14;
      currentY += (targetY - currentY) * 0.1;
      if (video) {
        video.style.transform = `translate3d(0, ${-currentY.toFixed(2)}px, 0) scale(1.08)`;
      }
      animationFrame = requestAnimationFrame(updateParallax);
    };

    animationFrame = requestAnimationFrame(updateParallax);

    const observer = new IntersectionObserver(
      (entries, obs) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [results]);

  useEffect(() => {
    const keydown = (event) => {
      if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        if (event.key.toLowerCase() === "k") setShowCommand(true);
        else searchRef.current?.focus();
      }
      if (event.key === "?" && document.activeElement?.tagName !== "INPUT") setShowCommand(true);
      if (event.key.toLowerCase() === "r" && document.activeElement?.tagName !== "INPUT") randomWriteup();
      if (event.key === "Escape") {
        setShowCommand(false);
        setShowRequest(false);
        setShowRequestsList(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  const randomWriteup = async () => {
    const response = await fetch("/api/random");
    const data = await response.json();
    if (data.writeup) window.location.href = `/writeups/${data.writeup.id}`;
  };

  const toggle = (item, list, setList, key) => {
    const isSaved = list.some((existing) => (typeof existing === "string" ? existing === item.id : existing.id === item.id));
    let next;
    if (isSaved) {
      next = list.filter((existing) => (typeof existing === "string" ? existing !== item.id : existing.id !== item.id));
    } else {
      next = [...list, item.id ? item : { id: item.id || item.url, title: item.title, url: item.url }];
    }
    setList(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const copyLink = async (item) => {
    await navigator.clipboard?.writeText(`${window.location.origin}/writeups/${item.id}`);
    alert("Link copied to clipboard!");
  };

  const loadStatus = async () => {
    const response = await fetch("/api/status");
    setStatus(await response.json());
    setShowStatus(true);
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const searchRes = await fetch(`/api/search?${queryString}`);
        const searchData = await searchRes.json();
        setResults(searchData.items || []);
        setTotal(searchData.total || 0);
        alert(`Scrape completed! Total writeups in archive updated to ${searchData.total}`);
      } else {
        alert(`Scrape error: ${data.error}`);
      }
    } catch (e) {
      alert(`Scrape failed: ${e.message}`);
    } finally {
      setScraping(false);
    }
  };

  const loadRequests = async () => {
    const res = await fetch("/api/source-requests/list");
    const data = await res.json();
    setSourceRequests(data.requests || []);
    setShowRequestsList(true);
  };

  const submitSource = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/source-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (response.ok) {
      alert("Source request submitted!");
      setShowRequest(false);
    } else alert("Please enter a valid HTTP(S) source URL.");
  };

  const importArchive = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await file.text(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(`Imported ${data.imported} writeups`);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
    event.target.value = "";
  };

  const exportBookmarks = () => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hunter-archive-bookmarks.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = useMemo(() => {
    if (viewTab === "bookmarks") {
      const savedIds = new Set(bookmarks.map((b) => (typeof b === "string" ? b : b.id)));
      return results.filter((item) => savedIds.has(item.id));
    }
    if (viewTab === "unread") {
      const readIds = new Set(read.map((r) => (typeof r === "string" ? r : r.id)));
      return results.filter((item) => !readIds.has(item.id));
    }
    return results;
  }, [results, viewTab, bookmarks, read]);

  const commandActions = [
    { label: "Surprise me with a writeup", action: () => randomWriteup(), hint: "R" },
    { label: "Focus search bar", action: () => searchRef.current?.focus(), hint: "/" },
    { label: "View saved bookmarks", action: () => setViewTab("bookmarks"), hint: "Saved" },
    { label: "Trigger live background scrape", action: () => triggerScrape(), hint: "⚡ Scrape" },
    { label: "Check source health & status", action: () => loadStatus(), hint: "Status" },
    { label: "View submitted source requests", action: () => loadRequests(), hint: "Requests" },
    { label: "Export bookmarks (JSON)", action: () => exportBookmarks(), hint: "Export" },
    { label: `Toggle theme (${dark ? "Light" : "Dark"})`, action: () => setDark(!dark), hint: "Theme" },
  ].filter((cmd) => cmd.label.toLowerCase().includes(commandQuery.toLowerCase()));  const searchField = (
    <label className="search-bar">
      <span className="search-icon">⌕</span>
      <input
        ref={searchRef}
        className="search-input"
        aria-label="Search security writeups"
        placeholder="Search vulnerability, technique, author, program (e.g., RCE, SSRF, Uber, OAuth)..."
        value={q}
        onChange={(event) => reset(() => setQ(event.target.value))}
      />
      <span className="search-kbd">⌘K</span>
    </label>
  );

  return (
    <main>
      <div className="app-bg-glow" />

      {/* Top Navbar */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand-logo">
            <span>HUNTER ARCHIVE</span>
            <span className="brand-badge">{total} WRITEUPS</span>
          </div>
          <div className="nav-actions">
            <button className="btn-secondary" onClick={() => setShowCommand(true)}>
              ⌘ K
            </button>
            <button className={`btn-secondary ${scraping ? "highlight" : ""}`} onClick={triggerScrape} disabled={scraping}>
              {scraping ? "⚡ Scraping..." : "⚡ Live Scrape"}
            </button>
            <button className="btn-secondary" onClick={() => setDark(!dark)}>
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </nav>

      <div className="app-container">
        {/* Search-First Hero Header */}
        <section className="hero-banner">
          <div className="hero-pill">⚡ Security Intelligence Archive</div>
          <h1>Read the Thinking.</h1>
          <p>Search over {total ? total.toLocaleString() : "7,490"}+ bug bounty writeups, CTF walkthroughs, and vulnerability reports from top researchers.</p>

          <div className="search-wrapper">
            {searchField}
          </div>

          <div className="vuln-bar">
            {QUICK_VULNS.map((vuln) => (
              <button
                key={vuln}
                className={`vuln-tag ${q.toLowerCase() === vuln.toLowerCase() ? "active" : ""}`}
                onClick={() => reset(() => setQ(q.toLowerCase() === vuln.toLowerCase() ? "" : vuln))}
              >
                {vuln}
              </button>
            ))}
          </div>
        </section>

        {/* Toolbar & Filters */}
        <section className="toolbar">
          <div className="toolbar-top">
            <div className="tab-group">
              <button className={`tab-btn ${viewTab === "all" ? "active" : ""}`} onClick={() => setViewTab("all")}>
                All Writeups ({total})
              </button>
              <button className={`tab-btn ${viewTab === "bookmarks" ? "active" : ""}`} onClick={() => setViewTab("bookmarks")}>
                ★ Bookmarks ({bookmarks.length})
              </button>
              <button className={`tab-btn ${viewTab === "unread" ? "active" : ""}`} onClick={() => setViewTab("unread")}>
                Unread
              </button>
            </div>

            <div className="source-group">
              {SOURCES.map((item) => (
                <button
                  key={item.id}
                  className={`source-btn ${source === item.id ? "active" : ""}`}
                  onClick={() => reset(() => setSource(item.id))}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <select className="sort-select" value={sort} onChange={(e) => reset(() => setSort(e.target.value))}>
              <option value="relevance">Sort: Most Relevant</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="bounty">Sort: Highest Bounty 💰</option>
            </select>
          </div>

          <div className="tool-row">
            <button className="btn-secondary" onClick={() => setShowCommand(true)}>
              ⌘ Command Palette
            </button>
            <button className="btn-secondary" onClick={loadStatus}>
              ◌ Source Health
            </button>
            <button className="btn-secondary" onClick={() => setShowAdvanced(!showAdvanced)}>
              ⚙ Advanced Filters
            </button>
            <button className="btn-secondary" onClick={() => setShowRequest(true)}>
              ＋ Request Source
            </button>
            <button className="btn-secondary" onClick={loadRequests}>
              📋 View Requests
            </button>
            <button className="btn-secondary" onClick={() => setShowSources(!showSources)}>
              ⓘ Source Notes
            </button>
            <a className="btn-secondary" href="/api/export?format=json">
              ↓ Export JSON
            </a>
            <a className="btn-secondary" href="/api/export?format=csv">
              ↓ Export CSV
            </a>
            <label className="btn-secondary">
              ↑ Import JSON
              <input type="file" accept="application/json" onChange={importArchive} hidden />
            </label>
          </div>

          {showAdvanced && (
            <div className="advanced-panel">
              <input placeholder="Filter tag (e.g. ssrf)" value={filters.tag} onChange={(e) => reset(() => setFilters({ ...filters, tag: e.target.value }))} />
              <input placeholder="Author name" value={filters.author} onChange={(e) => reset(() => setFilters({ ...filters, author: e.target.value }))} />
              <input placeholder="Platform (e.g. web)" value={filters.platform} onChange={(e) => reset(() => setFilters({ ...filters, platform: e.target.value }))} />
              <input type="date" value={filters.from} onChange={(e) => reset(() => setFilters({ ...filters, from: e.target.value }))} />
              <input type="date" value={filters.to} onChange={(e) => reset(() => setFilters({ ...filters, to: e.target.value }))} />
            </div>
          )}

          {showSources && (
            <div className="advanced-panel">
              <div>
                <strong>Source notes:</strong> Feeds are pulled directly from public RSS, GitHub Search API, and Pentester.land writeups index.
              </div>
            </div>
          )}

          {showStatus && (
            <div className="advanced-panel">
              <div>
                <strong>Source health status:</strong>
                {(status?.sources || []).map((item) => (
                  <div key={item.label} style={{ fontSize: 11, marginTop: 4 }}>
                    • {item.label}: {item.ok ? `${item.count} items` : item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="feed-status">
          <span>
            {loading && page === 1
              ? "Searching archive..."
              : error
              ? `Error: ${error}`
              : `Showing ${filteredResults.length} of ${total} entries · ${bookmarks.length} saved`}
          </span>
        </div>

        {!loading && !error && filteredResults.length === 0 && (
          <div className="empty-state">
            <span>No matching writeups found</span>
            <p>Try a different keyword or clear active filters.</p>
          </div>
        )}

        {/* Clean Writeups Feed */}
        <section className="writeup-feed">
          {filteredResults.map((item) => {
            const isSaved = bookmarks.some((saved) => (typeof saved === "string" ? saved === item.id : saved.id === item.id));
            const isRead = read.some((r) => (typeof r === "string" ? r === item.id : r.id === item.id));

            return (
              <article className={`card-item ${isRead ? "is-read" : ""}`} key={item.id || item.url}>
                <div className="card-header">
                  <span className="card-source">{item.source_label || item.source}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span>{formatDate(item.published_at)}</span>
                    {item.author && <span>by {item.author}</span>}
                    {item.bounty && <span className="bounty-pill">💰 {item.bounty}</span>}
                  </div>
                </div>

                <h3 className="card-title">
                  <a href={`/writeups/${item.id}`} onClick={() => toggle(item, read, setRead, "hunter-archive-read")}>
                    {highlight(item.title, q)}
                  </a>
                </h3>

                {item.summary && <p className="card-summary">{highlight(item.summary, q)}</p>}

                {item.tags && item.tags.length > 0 && (
                  <div className="card-tags">
                    {item.tags.slice(0, 6).map((tag) => (
                      <span className="tag-badge" key={tag}>
                        {highlight(tag, q)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="card-footer">
                  <div className="card-actions">
                    <button className={`action-link ${isSaved ? "saved" : ""}`} onClick={() => toggle(item, bookmarks, setBookmarks, "hunter-archive-bookmarks")}>
                      {isSaved ? "★ Saved" : "☆ Save"}
                    </button>
                    <button className="action-link" onClick={() => copyLink(item)}>
                      Copy citation
                    </button>
                  </div>
                  <a className="read-more-link" href={item.url} target="_blank" rel="noopener noreferrer">
                    View Original ↗
                  </a>
                </div>
              </article>
            );
          })}
        </section>

        {hasMore && (
          <button className="load-more-btn" onClick={() => setPage((current) => current + 1)} disabled={loading}>
            {loading ? "Loading..." : "Load More Writeups"}
          </button>
        )}
      </div>

      <footer>
        <p>The Hunter Archive — Developed by <strong>JOJIN JOHN</strong></p>
      </footer>

      {showCommand && (
        <div className="modal-backdrop" onClick={() => setShowCommand(false)}>
          <div className="command-modal" onClick={(event) => event.stopPropagation()}>
            <input
              autoFocus
              placeholder="Search command palette..."
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
            />
            {commandActions.map((cmd) => (
              <button
                key={cmd.label}
                className="command-option"
                onClick={() => {
                  setShowCommand(false);
                  cmd.action();
                }}
              >
                <span>{cmd.label}</span>
                <small>{cmd.hint}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {showRequest && (
        <div className="modal-backdrop" onClick={() => setShowRequest(false)}>
          <form className="request-modal" onSubmit={submitRequest}>
            <h3>Suggest a Source</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Enter a security blog, RSS feed, or GitHub repo URL to ingest writeups from.</p>
            <input
              required
              type="url"
              placeholder="https://example.com/rss.xml"
              value={requestForm.url}
              onChange={(e) => setRequestForm({ ...requestForm, url: e.target.value })}
            />
            <textarea
              placeholder="Optional notes about this source..."
              value={requestForm.notes}
              onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
            />
            <button className="load-more-btn" type="submit" style={{ margin: 0, width: "100%" }}>
              Submit Source
            </button>
          </form>
        </div>
      )}
      {showRequestsList && (
        <div className="modal-backdrop" onClick={() => setShowRequestsList(false)}>
          <div className="command-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Submitted Source Requests</h3>
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginTop: 10 }}>
              {sourceRequests.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No source requests submitted yet.</p>
              ) : (
                sourceRequests.map((req, i) => (
                  <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <a href={req.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-indigo)", fontWeight: 500 }}>
                      {req.url}
                    </a>
                    {req.note && <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "12px" }}>{req.note}</p>}
                  </div>
                ))
              )}
            </div>
            <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setShowRequestsList(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
