import { readSourceStatus } from "../../../lib/localStore.mjs";

export async function GET() {
  return Response.json(await readSourceStatus());
}
