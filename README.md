# The Hunter Archive — writeup archive

A searchable dashboard that aggregates bug bounty writeups, CTF walkthroughs,
and security tool READMEs from Medium, GitHub, and Pentester Land. Data is
stored locally in `data/writeups.json`, so no database account is required.

## 1. Configure environment variables

```bash
cp .env.example .env.local
# GITHUB_TOKEN is optional but recommended for GitHub API rate limits
```

A `GITHUB_TOKEN` (classic PAT, no scopes needed) raises the GitHub search
rate limit from 60/hr to 5,000/hr — worth creating one, it's free.

## 2. Run the scraper once to populate data

```bash
npm install
npm run scrape
```

This pulls from every source in `lib/sources.js` and upserts into
`data/writeups.json`. Re-running is safe and deduplicates by URL.

Use `npm run scrape:watch` to refresh the local archive every 24 hours. The
scraper also writes `data/source-status.json` for the source-health panel.

## 3. Run the dashboard locally

```bash
npm run dev
# open http://localhost:3000
```

The dashboard includes Load more pagination, advanced filters, bookmarks,
JSON/CSV export, JSON import, and a detail page for every writeup.

## 4. Keep it updating automatically (free)

The scraper also runs as a scheduled GitHub Action
(`.github/workflows/scrape.yml`, daily at 03:00 UTC). To enable it:

1. Push this repo to GitHub
2. Repo → Settings → Secrets and variables → Actions, add:
   - `GH_PAT` (your GitHub token, reused for the search API calls)
3. It'll also show up under the Actions tab so you can trigger a run manually

## 5. Deploy the dashboard (free)

Push to GitHub, then import the repo at https://vercel.com/new. The local JSON
store works for local use; hosted deployments need persistent storage if data
must survive redeploys.

The included GitHub Action refreshes and commits the JSON archive daily. Set
the `GH_PAT` repository secret before enabling it.

## Adding more sources

Everything lives in `lib/sources.js`:

- `RSS_FEEDS` — any blog or Medium tag with an RSS/Atom feed. Add a line,
  done — no other code changes needed.
- `GITHUB_QUERIES` — GitHub repo-search queries (topics, keywords).
- `PENTESTERLAND_URL` — HTML scrape target; if Pentester Land redesigns
  their page, adjust the cheerio selectors in `scripts/scrape.mjs`.

## Notes

- The Pentester Land scraper uses best-effort CSS selectors against their
  writeups table. If it comes back empty after a site redesign, inspect
  the page's current markup and adjust the selectors in `scrapePentesterLand()`.
- The dashboard and scraper share the local JSON store; no database credentials
  are required for local use.
