import { copyFile, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { safeHttpUrl } from "./security.mjs";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "writeups.json");
const statusFile = path.join(dataDir, "source-status.json");
const backupDir = path.join(dataDir, "backups");

async function persist(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temp, file);
}

async function backupData() {
  try {
    await mkdir(backupDir, { recursive: true });
    const backup = path.join(backupDir, `writeups-${new Date().toISOString().replaceAll(":", "-")}.json`);
    await copyFile(dataFile, backup);
    const files = (await readdir(backupDir)).sort().reverse();
    await Promise.all(files.slice(10).map((file) => unlink(path.join(backupDir, file))));
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Backup skipped:", error.message);
  }
}

export async function readWriteups() {
  try {
    const contents = await readFile(dataFile, "utf8");
    const rows = JSON.parse(contents);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function upsertWriteups(rows) {
  if (!rows.length) return 0;
  await mkdir(dataDir, { recursive: true });
  const current = await readWriteups();
  const byUrl = new Map(current.map((row) => [row.url, row]));

  for (const row of rows) {
    const url = safeHttpUrl(row?.url);
    if (!url) continue;
    const previous = byUrl.get(url);
    byUrl.set(url, {
      ...previous,
      ...row,
      url,
      id: previous?.id || row.id || crypto.randomUUID(),
      fetched_at: new Date().toISOString(),
    });
  }

  const result = [...byUrl.values()];
  await backupData();
  await persist(dataFile, result);
  return result.length;
}

export async function getWriteup(id) {
  const rows = await readWriteups();
  return rows.find((row) => row.id === id) || null;
}

export async function getRelatedWriteups(id, tags = [], limit = 4) {
  const rows = await readWriteups();
  const lowerTags = (tags || []).map((t) => String(t).toLowerCase());
  return rows
    .filter((r) => r.id !== id)
    .map((r) => {
      const matches = (r.tags || []).filter((t) => lowerTags.includes(String(t).toLowerCase())).length;
      return { ...r, _matches: matches };
    })
    .sort((a, b) => b._matches - a._matches || (b.published_at || "").localeCompare(a.published_at || ""))
    .slice(0, limit);
}

export async function replaceWriteups(rows) {
  await mkdir(dataDir, { recursive: true });
  const byUrl = new Map();
  for (const row of rows) {
    const url = safeHttpUrl(row?.url);
    if (!url) continue;
    byUrl.set(url, { ...row, url, id: row.id || crypto.randomUUID() });
  }
  const result = [...byUrl.values()];
  await backupData();
  await persist(dataFile, result);
  return result.length;
}

export async function readSourceStatus() {
  try {
    return JSON.parse(await readFile(statusFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { updatedAt: null, sources: [] };
    throw error;
  }
}

export async function writeSourceStatus(report) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(statusFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
