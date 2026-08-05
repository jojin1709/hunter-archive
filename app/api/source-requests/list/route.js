import { readFile } from "node:fs/promises";
import path from "node:path";

const file = path.join(process.cwd(), "data", "source-requests.json");

export async function GET() {
  try {
    const contents = await readFile(file, "utf8");
    const requests = JSON.parse(contents);
    return Response.json({ requests: Array.isArray(requests) ? requests : [] });
  } catch (error) {
    if (error.code === "ENOENT") return Response.json({ requests: [] });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
