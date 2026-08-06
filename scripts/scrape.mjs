import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { RSS_FEEDS, GITHUB_QUERIES, PENTESTERLAND_API_URL, PENTESTERLAND_URL, DEVTO_TAGS } from "../lib/sources.js";
import { upsertWriteups, writeSourceStatus } from "../lib/localStore.mjs";
import { fetchWithTimeout, safeHttpUrl } from "../lib/security.mjs";

const rss = new Parser();
const clean = (s = "") =>
  s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500);
const extractCVEs = (text = "") => {
  const matches = String(text).match(/CVE-\d{4}-\d{4,7}/gi) || [];
  return [...new Set(matches.map((c) => c.toUpperCase()))];
};

const sourceReport = [];
const record = (label, ok, count = 0, error = null) => sourceReport.push({ label, ok, count, error });

async function upsert(rows) {
  if (!rows.length) return;
  const enriched = rows.map((r) => {
    const textToScan = `${r.title || ""} ${r.summary || ""}`;
    const cves = extractCVEs(textToScan);
    const existingTags = Array.isArray(r.tags) ? r.tags : [];
    const mergedTags = [...new Set([...existingTags, ...cves])];
    return {
      ...r,
      tags: mergedTags.slice(0, 10),
      cve: cves[0] || r.cve || null,
    };
  });
  const total = await upsertWriteups(enriched);
  console.log(`  saved ${rows.length} rows (${total} total locally)`);
}

// ---------- 1. RSS feeds (Medium tags, InfoSec Writeups, security blogs) ----------
async function scrapeRSS() {
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`RSS: ${feed.label}`);
      const feedResponse = await fetchWithTimeout(feed.url, { headers: { "User-Agent": "The-Hunter-Archive/1.0" } });
      if (!feedResponse.ok) throw new Error(`HTTP ${feedResponse.status}`);
      const parsed = await rss.parseString(await feedResponse.text());
      const rows = (parsed.items || []).map((item) => ({
        url: safeHttpUrl(item.link),
        title: clean(item.title || "Untitled"),
        summary: clean(item.contentSnippet || item.content || ""),
        source: feed.source || "blogs",
        source_label: feed.label,
        tags: (item.categories || []).slice(0, 8),
        author: clean(item.creator || item.author || ""),
        platform: feed.label.toLowerCase().includes("medium") ? "medium" : "web",
        published_at: item.isoDate || item.pubDate || null,
      }));
      await upsert(rows.filter((r) => r.url));
      record(feed.label, true, rows.length);
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      record(feed.label, false, 0, err.name === "AbortError" ? "timed out" : err.message);
    }
  }
}

// ---------- 2. GitHub — repos tagged as writeup collections ----------
async function scrapeGitHub() {
  const token = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== "your_optional_github_pat_here" ? process.env.GITHUB_TOKEN : null;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "The-Hunter-Archive/1.0",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  for (const q of GITHUB_QUERIES) {
    try {
      console.log(`GitHub: ${q}`);
      let res = await fetchWithTimeout(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&per_page=25`,
        { headers }
      );
      if (!res.ok && token) {
        res = await fetchWithTimeout(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&per_page=25`,
          { headers: { Accept: "application/vnd.github+json", "User-Agent": "The-Hunter-Archive/1.0" } }
        );
      }

      if (!res.ok) {
        console.error(`  failed: ${res.status}`);
        record(`GitHub: ${q}`, false, 0, `HTTP ${res.status}`);
        continue;
      }

      const body = await res.json();
      const rows = (body.items || []).map((repo) => ({
        url: safeHttpUrl(repo.html_url),
        title: `${repo.owner?.login}/${repo.name}`,
        summary: clean(repo.description || "GitHub security writeups repository"),
        source: "github",
        source_label: "GitHub Repos",
        tags: (repo.topics || ["writeup"]).slice(0, 8),
        author: repo.owner?.login || null,
        platform: repo.language ? repo.language.toLowerCase() : "github",
        published_at: repo.updated_at || repo.pushed_at,
      }));
      await upsert(rows.filter((r) => r.url));
      record(`GitHub: ${q}`, true, rows.length);
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      record(`GitHub: ${q}`, false, 0, err.name === "AbortError" ? "timed out" : err.message);
    }
  }
}

// ---------- 3. Pentester.land API ----------
async function scrapePentesterLand() {
  try {
    console.log(`Pentester Land: ${PENTESTERLAND_API_URL}`);
    const res = await fetchWithTimeout(PENTESTERLAND_API_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; writeup-scraper/1.0)" },
    });
    if (!res.ok) {
      console.error(`  failed: ${res.status}`);
      record("Pentester Land", false, 0, `HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.data || [];
    const rows = [];

    for (const item of items) {
      const primaryLink = (item.Links || item.links)?.[0];
      const url = safeHttpUrl(primaryLink?.Link || primaryLink?.url);
      const title = clean(primaryLink?.Title || primaryLink?.title || item.title || "Untitled Writeup");
      if (!url || !title) continue;

      const authors = Array.isArray(item.Authors || item.authors) ? (item.Authors || item.authors).join(", ") : clean(item.Authors || item.authors || "");
      const programs = Array.isArray(item.Programs || item.programs) ? (item.Programs || item.programs).join(", ") : clean(item.Programs || item.programs || "");
      const bugs = Array.isArray(item.Bugs || item.bugs) ? (item.Bugs || item.bugs) : [];
      const bounty = item.Bounty || item.bounty || null;
      const pubDate = item.PublicationDate || item.publication_date || item.AddedDate || item.added_date || null;

      rows.push({
        url,
        title,
        summary: programs ? `Target Program: ${programs}` : null,
        source: "pentesterland",
        source_label: "pentester.land",
        tags: bugs.slice(0, 8),
        author: authors,
        platform: programs || "bugbounty",
        bounty: bounty && bounty !== "-" ? bounty : null,
        published_at: pubDate,
      });
    }

    await upsert(rows);
    record("Pentester Land", true, rows.length);
  } catch (err) {
    console.error(`  failed: ${err.message}`);
    record("Pentester Land", false, 0, err.name === "AbortError" ? "timed out" : err.message);
  }
}

// ---------- 4. Dev.to REST API ----------
async function scrapeDevToAPI() {
  for (const tag of DEVTO_TAGS) {
    try {
      console.log(`Dev.to API: tag=${tag}`);
      const res = await fetchWithTimeout(`https://dev.to/api/articles?tag=${tag}&per_page=30`, {
        headers: { "User-Agent": "The-Hunter-Archive/1.0" },
      });
      if (!res.ok) {
        record(`Dev.to: tag=${tag}`, false, 0, `HTTP ${res.status}`);
        continue;
      }
      const articles = await res.json();
      const rows = (Array.isArray(articles) ? articles : []).map((art) => ({
        url: safeHttpUrl(art.url),
        title: clean(art.title || "Untitled"),
        summary: clean(art.description || ""),
        source: "devto",
        source_label: "dev.to",
        tags: (art.tag_list || [tag]).slice(0, 8),
        author: art.user?.username || art.user?.name || null,
        platform: "dev.to",
        published_at: art.published_at || art.created_at,
      }));
      await upsert(rows.filter((r) => r.url));
      record(`Dev.to: tag=${tag}`, true, rows.length);
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      record(`Dev.to: tag=${tag}`, false, 0, err.name === "AbortError" ? "timed out" : err.message);
    }
  }
}

export async function runScraper() {
  sourceReport.length = 0;
  console.log("=== writeup-scraper run started:", new Date().toISOString(), "===");
  await scrapeRSS();
  await scrapeGitHub();
  await scrapePentesterLand();
  await scrapeDevToAPI();
  const statusObj = { updatedAt: new Date().toISOString(), sources: sourceReport };
  await writeSourceStatus(statusObj);
  console.log("=== run complete ===");
  return statusObj;
}

if (process.argv[1] && process.argv[1].endsWith("scrape.mjs")) {
  runScraper().then(() => process.exit(0));
}
