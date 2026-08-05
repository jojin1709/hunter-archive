import { readWriteups } from "../../../lib/localStore.mjs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const source = searchParams.get("source") || "all";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 40, 1), 100);
  const tag = searchParams.get("tag")?.trim().toLowerCase() || "";
  const author = searchParams.get("author")?.trim().toLowerCase() || "";
  const platform = searchParams.get("platform")?.trim().toLowerCase() || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const sort = searchParams.get("sort") || "relevance";
  const bountyOnly = searchParams.get("bountyOnly") === "true";

  const parseBountyNum = (b) => {
    if (!b) return 0;
    const num = String(b).replace(/[^0-9.]/g, "");
    return Number(num) || 0;
  };

  const rows = await readWriteups();
  const query = q.toLowerCase();
  const results = rows
    .filter((row) => source === "all" || row.source === source)
    .filter((row) => !bountyOnly || Boolean(row.bounty && row.bounty !== "$0" && row.bounty !== "-"))
    .filter((row) => !tag || (row.tags || []).some((item) => item.toLowerCase().includes(tag)))
    .filter((row) => !author || (row.author || "").toLowerCase().includes(author))
    .filter((row) => !platform || (row.platform || "").toLowerCase().includes(platform))
    .filter((row) => !from || (row.published_at || "") >= from)
    .filter((row) => !to || (row.published_at || "") <= `${to}T23:59:59.999Z`)
    .filter((row) => {
      if (!query) return true;
      return [row.title, row.summary, ...(row.tags || []), row.author, row.platform]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .map((row) => {
      if (!query) return { ...row, _score: 0 };
      const title = (row.title || "").toLowerCase();
      const summary = (row.summary || "").toLowerCase();
      const _score = (title === query ? 100 : 0) + (title.includes(query) ? 40 : 0) + (summary.includes(query) ? 10 : 0) + ((row.tags || []).some((tag) => tag.toLowerCase().includes(query)) ? 25 : 0);
      return { ...row, _score };
    })
    .sort((a, b) => {
      if (sort === "newest") return (b.published_at || b.fetched_at || "").localeCompare(a.published_at || a.fetched_at || "");
      if (sort === "oldest") return (a.published_at || a.fetched_at || "").localeCompare(b.published_at || b.fetched_at || "");
      if (sort === "bounty") return parseBountyNum(b.bounty) - parseBountyNum(a.bounty);
      // default relevance sort
      if (query) return b._score - a._score || (b.published_at || "").localeCompare(a.published_at || "");
      return (b.published_at || b.fetched_at || "").localeCompare(a.published_at || a.fetched_at || "");
    });

  const total = results.length;
  const start = (page - 1) * pageSize;

  return Response.json({ items: results.slice(start, start + pageSize).map(({ _score, ...row }) => row), results: results.slice(start, start + pageSize).map(({ _score, ...row }) => row), total, page, pageSize, hasMore: start + pageSize < total });
}
