import { readWriteups } from "../../lib/localStore.mjs";

export async function GET() {
  const writeups = await readWriteups();
  const topItems = writeups.slice(0, 50);

  const rssItemsXml = topItems
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title || "Untitled Security Writeup"}]]></title>
      <link>${item.url || "https://hunter-archive.vercel.app"}</link>
      <guid isPermaLink="false">${item.id || item.url}</guid>
      <pubDate>${item.published_at ? new Date(item.published_at).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${item.summary || "Security vulnerability writeup and walkthrough."}]]></description>
      <author><![CDATA[${item.author || "Security Researcher"}]]></author>
      <category><![CDATA[${(item.tags || []).join(", ") || "Security"}]]></category>
    </item>`
    )
    .join("");

  const rssFeedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Hunter Archive — Security Writeups &amp; Walkthroughs</title>
    <link>https://hunter-archive.vercel.app</link>
    <description>Searchable security research archive aggregating bug bounty writeups and CTF walkthroughs. Developed by JOJIN JOHN.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://hunter-archive.vercel.app/feed.xml" rel="self" type="application/rss+xml" />
    ${rssItemsXml}
  </channel>
</rss>`;

  return new Response(rssFeedXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
