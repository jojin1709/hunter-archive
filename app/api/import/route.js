import { replaceWriteups } from "../../../lib/localStore.mjs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const rows = Array.isArray(payload) ? payload : payload.writeups;
    if (!Array.isArray(rows)) return Response.json({ error: "Expected a writeup array" }, { status: 400 });
    const count = await replaceWriteups(rows);
    return Response.json({ imported: count });
  } catch (error) {
    return Response.json({ error: `Import failed: ${error.message}` }, { status: 400 });
  }
}
