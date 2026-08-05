import { readWriteups } from "../lib/localStore.mjs";

export default async function sitemap() {
  const baseUrl = "https://hunter-archive.vercel.app";
  let items = [];
  try {
    items = await readWriteups();
  } catch {}

  const writeupEntries = items.slice(0, 5000).map((item) => ({
    url: `${baseUrl}/writeups/${item.id}`,
    lastModified: item.published_at ? new Date(item.published_at).toISOString() : new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...writeupEntries,
  ];
}
