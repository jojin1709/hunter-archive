> [!NOTE]
> **[The Hunter Archive is officially live on Vercel](https://hunter-archive.vercel.app/)**

<div align="center">

# ⚡ The Hunter Archive

### Searchable Security Intelligence, Bug Bounty Writeups & CTF Walkthroughs

Searchable, high-density security research hub indexing 7,490+ writeups, vulnerability reports, and CTF walkthroughs from top security researchers and platforms.

**Collected for the people who keep asking how.**

---

<a href="https://hunter-archive.vercel.app/"><img src="https://img.shields.io/badge/Live_App-hunter--archive.vercel.app-6366f1?style=for-the-badge&logo=vercel" height="40" alt="Visit Live App"></a>
<a href="https://github.com/jojin1709/hunter-archive"><img src="https://img.shields.io/badge/GitHub-jojin1709%2Fhunter--archive-10b981?style=for-the-badge&logo=github" height="40" alt="GitHub Repository"></a>

---
</div>

> [!TIP]
> **Quick Start:** Search across 7,490+ indexed reports instantly by vulnerability (`RCE`, `SSRF`, `IDOR`, `XSS`, `OAuth`), target program (`Uber`, `Google`, `Meta`), or researcher name.

## Table of Contents

- [What is The Hunter Archive?](#what-is-the-hunter-archive)
- [Key Features](#key-features)
- [Architecture & Data Pipeline](#architecture--data-pipeline)
- [Quick Start & Local Setup](#quick-start--local-setup)
- [Sources & Feed Coverage](#sources--feed-coverage)
- [Automated Scraping (GitHub Actions)](#automated-scraping-github-actions)
- [Deployment on Vercel](#deployment-on-vercel)
- [License & Open Source](#license--open-source)

---

## What is The Hunter Archive?

**The Hunter Archive** is a high-speed, searchable security research platform developed for bug bounty hunters, penetration testers, and security engineers. It continuous ingests, categorizes, and indexes public security writeups, vulnerability disclosures, and CTF walkthroughs from across the web.

Instead of hunting through scattered RSS feeds, Medium blogs, and GitHub repositories, **The Hunter Archive** provides a single unified search engine with 1-click vulnerability filters, bounty badges (`💰 $5,000`), offline bookmarks, and automated markdown citations.

---

## Key Features

- ⚡ **7,490+ Indexed Writeups**: Ingests reports from Pentester.land, Medium, PortSwigger, Google Project Zero, 0xdf, Wiz, Qualys, Unit 42, and GitHub repos.
- 🎯 **1-Click Vulnerability Filters**: Instant filter chips for `RCE`, `SSRF`, `IDOR`, `XSS`, `OAuth`, `SQLi`, `LFI`, `Account Takeover`, `JWT`, and `Auth Bypass`.
- 💰 **Bounty Badges & Sort**: Identify high-value vulnerability payouts with dollar badges (`💰 $5,000`) and sort by highest bounty.
- 🎨 **Clean Vercel/Linear Design System**: Hardware-accelerated 60fps scrolling, high-contrast typography, and full Dark Mode / Light Mode toggle.
- ⌨ **Keyboard-First Navigation**: `⌘K` Command Palette for quick search and navigation.
- 📁 **Bookmarks & Read Tracking**: Save reports to local bookmarks and track read status without accounts or login.
- 🤖 **Automated Daily Scraping**: GitHub Actions cron job (`.github/workflows/scrape.yml`) runs daily to auto-discover new writeups and auto-commit updates.
- 🚀 **Zero Database Overhead**: Portable local JSON store with OS `/tmp` fallback for seamless serverless execution on Vercel.

---

## Architecture & Data Pipeline

```text
        ┌──────────────────────────────────────────────────────────┐
        │                 Automated Ingestion Pipeline             │
        └────────────────────────────┬─────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│ PentesterLand│              │ Security RSS │              │ GitHub Repos │
│  JSON API    │              │    Feeds     │              │  Search API  │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       └─────────────────────────────┼─────────────────────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────────┐
        │             Normalizer & Security Sanitizer              │
        │          (Deduplication, Tags, Bounty Extraction)        │
        └────────────────────────────┬─────────────────────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────────┐
        │         Local JSON Engine / Vercel Serverless Store      │
        └────────────────────────────┬─────────────────────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────────┐
        │             Next.js 14 Responsive UI & API               │
        └──────────────────────────────────────────────────────────┘
```

---

## Quick Start & Local Setup

### Prerequisites

- **Node.js 18+**
- **npm** or **pnpm**

### 1. Clone & Install

```bash
git clone https://github.com/jojin1709/hunter-archive.git
cd hunter-archive
npm install
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env.local
# GITHUB_TOKEN is optional but recommended to raise GitHub API rate limits
```

### 3. Run the Scraper (Populate Writeups)

```bash
npm run scrape
```

### 4. Launch Local Dev Server

```bash
npm run dev
# Open http://localhost:3000 in your browser
```

---

## Sources & Feed Coverage

| Source | Description | Type |
| --- | --- | --- |
| **Pentester.land** | 6,400+ curated bug bounty writeups with bounty amounts | JSON API |
| **InfoSec Writeups** | Medium's premier security publication | RSS Feed |
| **PortSwigger Research** | Web security academy & research disclosures | RSS Feed |
| **Google Project Zero** | 0-day vulnerability research | RSS Feed |
| **0xdf HackTheBox** | CTF walkthroughs and machine writeups | RSS Feed |
| **ProjectDiscovery** | Tool releases and exploit analysis | RSS Feed |
| **Wiz / Qualys / Unit 42** | Enterprise threat intelligence & vulnerability reports | RSS Feed |
| **GitHub Repositories** | Public writeup collections & security portfolios | GitHub Search API |

---

## Automated Scraping (GitHub Actions)

The scraper runs as an automated GitHub Action (`.github/workflows/scrape.yml`) daily at **03:17 UTC**.

1. It fetches all RSS feeds, GitHub search queries, and Pentester.land JSON.
2. It deduplicates entries by URL and updates `data/writeups.json`.
3. It commits the updated JSON back to GitHub.
4. Vercel detects the new commit and automatically redeploys your live app!

---

## Deployment on Vercel

1. Push your repository to GitHub.
2. Import your repository at **[https://vercel.com/new](https://vercel.com/new)**.
3. Keep default settings (**Framework Preset:** Next.js).
4. Click **Deploy**.

---

## License & Open Source

Licensed under the **MIT License**. Free for personal and commercial use.

<p align="center">
  <b>Built for Security Researchers & Bug Bounty Hunters</b>
</p>
