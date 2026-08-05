import { readWriteups } from "../../../lib/localStore.mjs";

export async function GET(request) {
  const format = new URL(request.url).searchParams.get("format") || "json";
  const rows = await readWriteups();
  if (format === "csv") {
    const fields = ["id", "title", "url", "source", "source_label", "author", "platform", "published_at", "summary", "tags"];
    const escape = (value) => `"${String(Array.isArray(value) ? value.join(" | ") : value ?? "").replaceAll('"', '""')}"`;
    const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => escape(row[field])).join(","))].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=the-hunter-archive.csv" } });
  }
  return new Response(JSON.stringify(rows, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=the-hunter-archive.json" } });
}
