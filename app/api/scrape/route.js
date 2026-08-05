import { runScraper } from "../../../scripts/scrape.mjs";

export async function POST() {
  try {
    const statusObj = await runScraper();
    return Response.json({ success: true, message: "Live scrape completed successfully", status: statusObj });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
