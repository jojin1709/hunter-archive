import { readWriteups } from "../../../lib/localStore.mjs";

export async function GET() {
  const rows = await readWriteups();
  if (!rows.length) return Response.json({ error: "The archive is empty" }, { status: 404 });
  return Response.json({ writeup: rows[Math.floor(Math.random() * rows.length)] });
}
