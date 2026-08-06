// Add or remove sources here. No code changes needed elsewhere for a new RSS feed.

export const RSS_FEEDS = [
  // Major Community & Publishing Platforms
  { url: "https://infosecwriteups.com/feed", label: "infosecwriteups.com", source: "blogs" },
  { url: "https://medium.com/feed/tag/bug-bounty", label: "medium.com/tag/bug-bounty", source: "medium" },
  { url: "https://medium.com/feed/tag/bugbounty-writeup", label: "medium.com/tag/bugbounty-writeup", source: "medium" },
  { url: "https://medium.com/feed/tag/penetration-testing", label: "medium.com/tag/penetration-testing", source: "medium" },
  { url: "https://medium.com/feed/tag/ctf-writeup", label: "medium.com/tag/ctf-writeup", source: "ctf" },
  { url: "https://medium.com/feed/tag/infosec", label: "medium.com/tag/infosec", source: "medium" },

  // Dev.to & Hashnode Security Writeups & Articles
  { url: "https://dev.to/feed/tag/bugbounty", label: "dev.to/tag/bugbounty", source: "devto" },
  { url: "https://dev.to/feed/tag/security", label: "dev.to/tag/security", source: "devto" },
  { url: "https://dev.to/feed/tag/ctf", label: "dev.to/tag/ctf", source: "ctf" },
  { url: "https://dev.to/feed/tag/cybersecurity", label: "dev.to/tag/cybersecurity", source: "devto" },
  { url: "https://dev.to/feed/tag/infosec", label: "dev.to/tag/infosec", source: "devto" },

  // Elite Hacker & Researcher Personal Blogs
  { url: "https://samcurry.net/rss.xml", label: "samcurry.net", source: "research" },
  { url: "https://shubh.am/rss/", label: "shubh.am", source: "research" },
  { url: "https://labs.watchtowr.com/rss/", label: "labs.watchtowr.com", source: "research" },
  { url: "https://0xdf.gitlab.io/feed.xml", label: "0xdf.gitlab.io", source: "walkthroughs" },

  // Top Offensive Security & Pentesting Firms
  { url: "https://bishopfox.com/blog/rss.xml", label: "bishopfox.com", source: "pentest" },
  { url: "https://rhinosecuritylabs.com/feed/", label: "rhinosecuritylabs.com", source: "pentest" },
  { url: "https://www.praetorian.com/feed/", label: "praetorian.com", source: "pentest" },
  { url: "https://blog.payatu.com/feed/", label: "payatu.com", source: "pentest" },
  { url: "https://blog.trailofbits.com/feed/", label: "blog.trailofbits.com", source: "research" },
  { url: "https://blog.assetnote.io/feed.xml", label: "blog.assetnote.io", source: "research" },
  { url: "https://blog.projectdiscovery.io/rss/", label: "blog.projectdiscovery.io", source: "research" },

  // Giant Tech Security & Vulnerability Disclosures
  { url: "https://portswigger.net/research/rss", label: "portswigger.net/research", source: "research" },
  { url: "https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss", label: "googleprojectzero.blogspot.com", source: "research" },
  { url: "https://securitylab.github.com/feed.xml", label: "securitylab.github.com", source: "research" },
  { url: "https://wiz.io/blog/rss.xml", label: "wiz.io/blog", source: "research" },
  { url: "https://blog.cloudflare.com/rss/", label: "blog.cloudflare.com", source: "research" },
  { url: "https://blog.qualys.com/feed", label: "blog.qualys.com", source: "research" },
  { url: "https://unit42.paloaltonetworks.com/feed/", label: "unit42.paloaltonetworks.com", source: "research" },
  { url: "https://securelist.com/feed/", label: "securelist.com", source: "research" },
  { url: "https://specterops.io/feed/", label: "specterops.io", source: "research" },
  { url: "https://snyk.io/blog/feed/", label: "snyk.io/blog", source: "research" },
  { url: "https://research.checkpoint.com/feed/", label: "research.checkpoint.com", source: "research" },

  // News, Advisories & Disclosure Platforms
  { url: "https://hackerone.com/hacktivity.rss", label: "hackerone.com", source: "bugbounty" },
  { url: "https://0x00sec.org/c/exploit/13.rss", label: "0x00sec.org", source: "research" },
  { url: "https://offsec.substack.com/feed", label: "offsec.substack.com", source: "blogs" },
  { url: "https://thehackernews.com/feeds/posts/default", label: "thehackernews.com", source: "news" },
  { url: "https://www.bleepingcomputer.com/feed/", label: "bleepingcomputer.com", source: "news" },
  { url: "https://krebsonsecurity.com/feed/", label: "krebsonsecurity.com", source: "news" },
  { url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", label: "cisa.gov/advisories", source: "advisories" },
];

// GitHub repo search queries — each pulls repos whose README we index.
export const GITHUB_QUERIES = [
  "bug-bounty-writeups in:topics",
  "ctf-writeups in:topics",
  "pentest-writeups in:topics",
  "security-writeups in:topics",
  "hacking-writeups in:topics",
  "bug bounty writeup in:name,description,readme",
  "ctf walkthrough in:name,description,readme",
  "penetration testing report in:name,description,readme",
  "awesome bug bounty in:name,description,readme",
  "exploit-poc in:topics",
  "vulnerability-research in:topics",
];

// Pentester Land's handpicked writeups directory (JSON API endpoint)
export const PENTESTERLAND_API_URL = "https://pentester.land/writeups.json";
export const PENTESTERLAND_URL = "https://pentester.land/writeups/";

// Dev.to security article tags
export const DEVTO_TAGS = ["bugbounty", "security", "ctf", "cybersecurity", "infosec", "pentesting"];
