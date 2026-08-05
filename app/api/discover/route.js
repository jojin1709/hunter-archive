import { readWriteups } from "../../../lib/localStore.mjs";

export async function GET() {
  const rows = await readWriteups();
  const recent = [...rows].sort((a, b) => (b.published_at || b.fetched_at || "").localeCompare(a.published_at || a.fetched_at || "")).slice(0, 6);
  const counts = new Map();
  rows.forEach((row) => (row.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  const trending = [...rows].sort((a, b) => {
    const score = (row) => (row.tags || []).reduce((sum, tag) => sum + (counts.get(tag) || 0), 0);
    return score(b) - score(a);
  }).slice(0, 6);
  const timeline = [...new Set(rows.map((row) => (row.published_at || row.fetched_at || "").slice(0, 7)).filter(Boolean))].sort().reverse().slice(0, 12);
  return Response.json({ recent, trending, timeline: timeline.map((month) => ({ month, count: rows.filter((row) => (row.published_at || row.fetched_at || "").startsWith(month)).length })) });
}
