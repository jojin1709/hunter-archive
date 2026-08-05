import { copyFile, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { safeHttpUrl } from "./security.mjs";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "writeups.json");
const statusFile = path.join(dataDir, "source-status.json");
const backupDir = path.join(dataDir, "backups");

const tmpDataFile = path.join(os.tmpdir(), "writeups.json");
const tmpStatusFile = path.join(os.tmpdir(), "source-status.json");

// Persistent global memory cache for Vercel serverless runtime
if (!globalThis._hunterInMemoryWriteups) {
  globalThis._hunterInMemoryWriteups = null;
}
if (!globalThis._hunterInMemoryStatus) {
  globalThis._hunterInMemoryStatus = null;
}

async function persist(file, tmpFallbackFile, value) {
  try {
    await mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp`;
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temp, file);
  } catch (error) {
    if (error.code === "EROFS" || error.code === "EACCES") {
      try {
        await writeFile(tmpFallbackFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
      } catch (tmpErr) {
        console.warn("Tmp fallback write failed:", tmpErr.message);
      }
    } else {
      console.warn("File persist skipped:", error.message);
    }
  }
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
  if (globalThis._hunterInMemoryWriteups && globalThis._hunterInMemoryWriteups.length > 0) {
    return globalThis._hunterInMemoryWriteups;
  }

  // Check OS tmp file (populated during live scrape on Vercel)
  try {
    const tmpContents = await readFile(tmpDataFile, "utf8");
    const rows = JSON.parse(tmpContents);
    if (Array.isArray(rows) && rows.length > 0) {
      globalThis._hunterInMemoryWriteups = rows;
      return rows;
    }
  } catch {}

  try {
    const contents = await readFile(dataFile, "utf8");
    const rows = JSON.parse(contents);
    const result = Array.isArray(rows) ? rows : [];
    globalThis._hunterInMemoryWriteups = result;
    return result;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function upsertWriteups(rows) {
  if (!rows.length) return 0;
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
  globalThis._hunterInMemoryWriteups = result;
  await backupData();
  await persist(dataFile, tmpDataFile, result);
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
  const byUrl = new Map();
  for (const row of rows) {
    const url = safeHttpUrl(row?.url);
    if (!url) continue;
    byUrl.set(url, { ...row, url, id: row.id || crypto.randomUUID() });
  }
  const result = [...byUrl.values()];
  globalThis._hunterInMemoryWriteups = result;
  await backupData();
  await persist(dataFile, tmpDataFile, result);
  return result.length;
}

export async function readSourceStatus() {
  if (globalThis._hunterInMemoryStatus) {
    return globalThis._hunterInMemoryStatus;
  }

  try {
    const tmpContents = await readFile(tmpStatusFile, "utf8");
    const status = JSON.parse(tmpContents);
    globalThis._hunterInMemoryStatus = status;
    return status;
  } catch {}

  try {
    const status = JSON.parse(await readFile(statusFile, "utf8"));
    globalThis._hunterInMemoryStatus = status;
    return status;
  } catch (error) {
    if (error.code === "ENOENT") return { updatedAt: null, sources: [] };
    throw error;
  }
}

export async function writeSourceStatus(report) {
  globalThis._hunterInMemoryStatus = report;
  await persist(statusFile, tmpStatusFile, report);
}
