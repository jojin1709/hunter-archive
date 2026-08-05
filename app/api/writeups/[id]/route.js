import { getWriteup } from "../../../../lib/localStore.mjs";

export async function GET(_request, { params }) {
  const writeup = await getWriteup(params.id);
  return writeup ? Response.json({ writeup }) : Response.json({ error: "Writeup not found" }, { status: 404 });
}
