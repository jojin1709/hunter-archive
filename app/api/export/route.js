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

  if (format === "obsidian" || format === "markdown" || format === "md") {
    const mdHeader = `# ⚡ The Hunter Archive — Security Research Binder\n> Exported on ${new Date().toLocaleDateString()} · Developed by JOJIN JOHN\n\n---\n\n`;
    const mdBody = rows
      .slice(0, 500)
      .map((row) => {
        const tags = (row.tags || []).map((t) => `#${t}`).join(" ");
        const bounty = row.bounty ? `💰 **Bounty:** ${row.bounty}` : "";
        const author = row.author ? `**Author:** ${row.author}` : "";
        return `## [${row.title}](${row.url})\n- **Source:** ${row.source_label || row.source} ${author ? `· ${author}` : ""} ${bounty ? `· ${bounty}` : ""}\n- **Date:** ${row.published_at || "Undated"}\n${row.summary ? `- **Summary:** ${row.summary}\n` : ""}- **Tags:** ${tags || "#security"}\n`;
      })
      .join("\n---\n\n");

    return new Response(mdHeader + mdBody, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "attachment; filename=hunter-archive-obsidian-binder.md",
      },
    });
  }

  return new Response(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=the-hunter-archive.json",
    },
  });
}
