import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const file = path.join(process.cwd(), "data", "source-requests.json");
export async function POST(request) {
  const body = await request.json();
  if (!body?.url || !/^https?:\/\//i.test(body.url)) return Response.json({ error: "A valid http(s) URL is required" }, { status: 400 });
  let requests = [];
  try { requests = JSON.parse(await readFile(file, "utf8")); } catch {}
  requests.push({ url: body.url, note: String(body.note || "").slice(0, 300), createdAt: new Date().toISOString() });
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(requests, null, 2)}\n`, "utf8");
  return Response.json({ submitted: true });
}
