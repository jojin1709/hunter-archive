// Add or remove sources here. No code changes needed elsewhere for a new RSS feed.

export const RSS_FEEDS = [
  // Major Community & Publishing Platforms
  { url: "https://infosecwriteups.com/feed", label: "infosecwriteups.com", source: "blogs" },
  { url: "https://medium.com/feed/tag/bug-bounty", label: "medium.com/tag/bug-bounty", source: "medium" },
  { url: "https://medium.com/feed/tag/bugbounty-writeup", label: "medium.com/tag/bugbounty-writeup", source: "medium" },
  { url: "https://medium.com/feed/tag/penetration-testing", label: "medium.com/tag/penetration-testing", source: "medium" },
  { url: "https://medium.com/feed/tag/ctf-writeup", label: "medium.com/tag/ctf-writeup", source: "ctf" },
  { url: "https://medium.com/feed/tag/infosec", label: "medium.com/tag/infosec", source: "medium" },

  // Elite Hacker & Researcher Personal Blogs
  { url: "https://samcurry.net/feed.xml", label: "samcurry.net", source: "research" },
  { url: "https://shubh.am/rss/", label: "shubh.am", source: "research" },
  { url: "https://brutelogic.com.br/blog/feed/", label: "brutelogic.com.br", source: "xss" },
  { url: "https://0xdf.gitlab.io/feed.xml", label: "0xdf.gitlab.io", source: "walkthroughs" },

  // Top Offensive Security & Pentesting Firms
  { url: "https://bishopfox.com/blog/rss.xml", label: "bishopfox.com", source: "pentest" },
  { url: "https://rhinosecuritylabs.com/feed/", label: "rhinosecuritylabs.com", source: "pentest" },
  { url: "https://praetorian.com/blog/rss.xml", label: "praetorian.com", source: "pentest" },
  { url: "https://gosecure.ai/blog/feed/", label: "gosecure.ai", source: "pentest" },
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
  { url: "https://blog.crowdstrike.com/feed/", label: "blog.crowdstrike.com", source: "research" },
  { url: "https://blog.sucuri.net/feed", label: "blog.sucuri.net", source: "websec" },

  // News, Advisories & Disclosure Platforms
  { url: "https://thehackernews.com/feeds/posts/default", label: "thehackernews.com", source: "news" },
  { url: "https://www.bleepingcomputer.com/feed/", label: "bleepingcomputer.com", source: "news" },
  { url: "https://portswigger.net/daily-swig/rss", label: "portswigger.net/daily-swig", source: "news" },
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
