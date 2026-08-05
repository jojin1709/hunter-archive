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
        alert("Scrape completed successfully!");
        window.location.reload();
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
    <label className="search-box">
      <span>⌕</span>
      <input
        ref={searchRef}
        aria-label="Search the archive"
        placeholder="Search IDOR, JWT, SSRF, RCE, author, target..."
        value={q}
        onChange={(event) => reset(() => setQ(event.target.value))}
      />
      <span className="search-kbd">⌘K</span>
    </label>
  );

  return (
    <main>
      <video className="bg-video" src="/prisma.mp4" autoPlay muted playsInline preload="auto" aria-hidden="true" />
      <div className="scrim" />
      <div className="vignette" />

      <section className="hero" id="top">
        <nav className="nav rise">
          <a href="#archive">The archive</a>
          <a href="#sources">Sources</a>
          <a href="#archive">Walkthroughs</a>
          <a href="#about">About</a>
          <button className="nav-button" onClick={() => setDark(!dark)}>
            {dark ? "Light" : "Dark"}
          </button>
        </nav>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow rise">For the curious · case archive</span>
            <h1 className="rise">The Hunter Archive</h1>
          </div>
          <div className="hero-side rise">
            <p>Bug bounty writeups, CTF walkthroughs, and security research — collected for the people who keep asking how.</p>
            <div className="hero-actions">
              <button className="cta" onClick={randomWriteup}>
                Surprise me <span>↗</span>
              </button>
              <a className="cta" href="#search">
                Explore the archive <span>↗</span>
              </a>
            </div>
          </div>
        </div>
        <a className="scroll-cue rise" href="#about">
          <span>↓</span> scroll to investigate
        </a>
      </section>

      <section className="section intro reveal" id="about">
        <div className="section-heading">
          <span className="eyebrow">01 · What this is</span>
          <h2>A place for the trail, not just the answer.</h2>
          <p>One quiet index for the experiments, mistakes, and clever turns that make security worth studying.</p>
        </div>
        <div className="card-grid">
          <article className="info-card">
            <span>01</span>
            <h3>Find the signal</h3>
            <p>Search across writeups, reports, and walkthroughs from the people doing the work.</p>
          </article>
          <article className="info-card">
            <span>02</span>
            <h3>Follow the method</h3>
            <p>Keep the context around each discovery — the dead ends are often the useful part.</p>
          </article>
          <article className="info-card">
            <span>03</span>
            <h3>Keep going deeper</h3>
            <p>Bookmark useful trails, mark what you’ve read, and return when you need a new angle.</p>
          </article>
        </div>
      </section>

      <section className="discovery section reveal">
        <div className="section-heading compact">
          <span className="eyebrow">Fresh from the field</span>
          <h2>Start somewhere interesting.</h2>
        </div>
        <div className="discovery-grid">
          <div>
            <small>Recently added</small>
            {discover.recent.slice(0, 3).map((item) => (
              <a key={item.id} href={`/writeups/${item.id}`}>
                {item.title}
              </a>
            ))}
          </div>
          <div>
            <small>Trending signals</small>
            {discover.trending.slice(0, 3).map((item) => (
              <a key={item.id} href={`/writeups/${item.id}`}>
                {item.title}
              </a>
            ))}
          </div>
          <div>
            <small>Vulnerability timeline</small>
            <div className="timeline">
              {discover.timeline.slice(0, 6).map((item) => (
                <span key={item.month}>
                  {item.month} <b>{item.count}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="quote-band reveal">
        <p>“The best writeups leave you with a better question than the one you started with.”</p>
      </section>

      <section className="section archive-section reveal" id="search">
        <div className="section-heading compact" id="sources">
          <span className="eyebrow">02 · The archive</span>
          <h2>Read the thinking.</h2>
          <p>Search by vulnerability, technique, company, author, platform, or source.</p>
        </div>

        <div className="archive-tools">
          <div className="view-tabs">
            <button className={`tab-button ${viewTab === "all" ? "active" : ""}`} onClick={() => setViewTab("all")}>
              All Entries ({total})
            </button>
            <button className={`tab-button ${viewTab === "bookmarks" ? "active" : ""}`} onClick={() => setViewTab("bookmarks")}>
              ★ Bookmarks ({bookmarks.length})
            </button>
            <button className={`tab-button ${viewTab === "unread" ? "active" : ""}`} onClick={() => setViewTab("unread")}>
              Unread
            </button>
          </div>

          <div className="controls">
            {searchField}

            <div className="vuln-chips">
              <span className="vuln-label">Quick Vuln:</span>
              {QUICK_VULNS.map((vuln) => (
                <button
                  key={vuln}
                  className={`vuln-chip ${q.toLowerCase() === vuln.toLowerCase() ? "active" : ""}`}
                  onClick={() => reset(() => setQ(q.toLowerCase() === vuln.toLowerCase() ? "" : vuln))}
                >
                  {vuln}
                </button>
              ))}
            </div>

            <div className="filters">
              {SOURCES.map((item) => (
                <button
                  key={item.id}
                  className={`filter-chip ${source === item.id ? "active" : ""}`}
                  onClick={() => reset(() => setSource(item.id))}
                >
                  {item.label}
                </button>
              ))}

              <select className="sort-select" value={sort} onChange={(e) => reset(() => setSort(e.target.value))}>
                <option value="relevance">Sort: Most Relevant</option>
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="bounty">Sort: Highest Bounty 💰</option>
              </select>
            </div>
          </div>

          <div className="tool-row">
            <button className="tool-btn" onClick={() => setShowCommand(true)}>
              ⌘ Command Palette
            </button>
            <button className={`tool-btn ${scraping ? "highlight" : ""}`} onClick={triggerScrape} disabled={scraping}>
              {scraping ? "⚡ Scraping..." : "⚡ Live Scrape"}
            </button>
            <button className="tool-btn" onClick={loadStatus}>
              ◌ Source Health
            </button>
            <button className="tool-btn" onClick={() => setShowAdvanced(!showAdvanced)}>
              ⚙ Advanced Filters
            </button>
            <button className="tool-btn" onClick={() => setShowRequest(true)}>
              ＋ Request Feed
            </button>
            <button className="tool-btn" onClick={loadRequests}>
              📋 View Requests
            </button>
            <button className="tool-btn" onClick={() => setShowSources(!showSources)}>
              ⓘ Source Notes
            </button>
            <a className="tool-btn" href="/api/export?format=json">
              ↓ Export JSON
            </a>
            <a className="tool-btn" href="/api/export?format=csv">
              ↓ Export CSV
            </a>
            <label className="tool-btn">
              ↑ Import JSON
              <input type="file" accept="application/json" onChange={importArchive} hidden />
            </label>
          </div>
        </div>

        {showAdvanced && (
          <div className="advanced-filters">
            <input placeholder="Tag: ssrf" value={filters.tag} onChange={(e) => reset(() => setFilters({ ...filters, tag: e.target.value }))} />
            <input placeholder="Author" value={filters.author} onChange={(e) => reset(() => setFilters({ ...filters, author: e.target.value }))} />
            <input placeholder="Platform: web" value={filters.platform} onChange={(e) => reset(() => setFilters({ ...filters, platform: e.target.value }))} />
            <input type="date" value={filters.from} onChange={(e) => reset(() => setFilters({ ...filters, from: e.target.value }))} />
            <input type="date" value={filters.to} onChange={(e) => reset(() => setFilters({ ...filters, to: e.target.value }))} />
          </div>
        )}

        {showSources && (
          <div className="status-panel">
            <strong>Source notes</strong>
            <p>Feeds are pulled directly from public RSS, GitHub Search API, and Pentester.land writeups index. Original author links and attribution are preserved.</p>
            <button className="text-button" onClick={() => setShowRequest(true)}>
              Suggest another public feed →
            </button>
          </div>
        )}

        {showStatus && (
          <div className="status-panel">
            <div>
              <strong>Source health</strong>
              <button className="close-button" onClick={() => setShowStatus(false)}>
                ×
              </button>
            </div>
            <small>Last run: {status?.updatedAt ? new Date(status.updatedAt).toLocaleString() : "not yet recorded"}</small>
            {(status?.sources || []).map((item) => (
              <div className="source-status" key={item.label}>
                <span className={`health-dot ${item.ok ? "good" : "bad"}`} />
                {item.label}
                <span>{item.ok ? `${item.count} items` : item.error}</span>
              </div>
            ))}
          </div>
        )}

        <p className="status-line">
          {loading && page === 1
            ? "searching the archive..."
            : error
            ? `error: ${error}`
            : `${total} entries found · ${bookmarks.length} saved · ${read.length} read`}
        </p>

        {!loading && !error && filteredResults.length === 0 && (
          <div className="empty-state">
            <span>no match found</span>
            <p>Try a broader search term, clear active filters, or click "Run Live Scrape" to refresh the archive.</p>
          </div>
        )}

        <div className="case-list">
          {filteredResults.map((item, index) => {
            const isSaved = bookmarks.some((saved) => (typeof saved === "string" ? saved === item.id : saved.id === item.id));
            const isRead = read.some((r) => (typeof r === "string" ? r === item.id : r.id === item.id));

            return (
              <article className={`case-card ${isRead ? "is-read" : ""}`} key={item.id || item.url}>
                <span className="case-number">No. {String(index + 1).padStart(4, "0")}</span>
                <div className="case-meta">
                  <span className="source-tag">{item.source_label || item.source}</span>
                  <span>{formatDate(item.published_at)}</span>
                  {item.author && <span>{item.author}</span>}
                  {item.bounty && <span className="bounty-badge">💰 {item.bounty}</span>}
                  {isRead && <span>read</span>}
                </div>
                <a className="case-link" href={`/writeups/${item.id}`} onClick={() => toggle(item, read, setRead, "hunter-archive-read")}>
                  <h3>{highlight(item.title, q)}</h3>
                </a>
                {item.summary && <p>{highlight(item.summary, q)}</p>}
                <div className="case-footer">
                  <div className="case-tags">
                    {(item.tags || []).slice(0, 6).map((tag) => (
                      <span key={tag}>{highlight(tag, q)}</span>
                    ))}
                  </div>
                  <button className={`bookmark-button ${isSaved ? "saved" : ""}`} onClick={() => toggle(item, bookmarks, setBookmarks, "hunter-archive-bookmarks")}>
                    {isSaved ? "★ Saved" : "☆ Save"}
                  </button>
                  <button className="read-link" onClick={() => copyLink(item)}>
                    Copy link
                  </button>
                  <a className="read-link" href={item.url} target="_blank" rel="noopener noreferrer">
                    Original ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {hasMore && (
          <button className="load-more" onClick={() => setPage((current) => current + 1)} disabled={loading}>
            {loading ? "Loading..." : "Load more writeups"}
          </button>
        )}

        <div className="archive-footer-actions">
          <button className="text-button" onClick={exportBookmarks}>
            ↓ Export bookmarks
          </button>
          <button className="text-button" onClick={() => setShowRequest(true)}>
            Suggest a public source
          </button>
        </div>
      </section>

      <section className="closing reveal">
        <span className="eyebrow">03 · Keep looking</span>
        <h2>Stay curious.</h2>
        <p>The archive grows every time someone shares how they got there.</p>
        <a className="cta" href="#search">
          Return to the archive <span>↗</span>
        </a>
      </section>

      <footer>
        <span>The Hunter Archive</span>
        <small>
          Built for the curious · <a href="#top">Back to top ↑</a> · <a href="/manifest.webmanifest">Install app</a>
        </small>
      </footer>

      {showCommand && (
        <div className="modal-backdrop" onClick={() => setShowCommand(false)}>
          <div className="command-palette" onClick={(event) => event.stopPropagation()}>
            <input
              autoFocus
              placeholder="Search command palette..."
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
            />
            {commandActions.map((cmd) => (
              <button
                key={cmd.label}
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
          <form className="request-form" onSubmit={submitSource} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-button" onClick={() => setShowRequest(false)}>
              ×
            </button>
            <span className="eyebrow">Suggest a public source</span>
            <h3>What should we follow next?</h3>
            <input name="url" type="url" required placeholder="https://example.com/feed.xml" />
            <textarea name="note" placeholder="Why is this feed useful?" />
            <button className="cta" type="submit">
              Submit request <span>↗</span>
            </button>
          </form>
        </div>
      )}

      {showRequestsList && (
        <div className="modal-backdrop" onClick={() => setShowRequestsList(false)}>
          <div className="request-form" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-button" onClick={() => setShowRequestsList(false)}>
              ×
            </button>
            <span className="eyebrow">Submitted Sources</span>
            <h3>Community Requested Feeds</h3>
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {sourceRequests.length === 0 ? (
                <p style={{ color: "var(--dim)" }}>No source requests submitted yet.</p>
              ) : (
                sourceRequests.map((req, i) => (
                  <div key={i} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                    <a href={req.url} target="_blank" rel="noreferrer" style={{ color: "var(--cream)", fontWeight: 500 }}>
                      {req.url}
                    </a>
                    {req.note && <p style={{ margin: "4px 0 0", color: "var(--soft)", fontSize: "12px" }}>{req.note}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
