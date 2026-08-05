import { runScraper } from "../../../scripts/scrape.mjs";

export async function POST() {
  try {
    const statusObj = await runScraper();

    // Trigger GitHub Action background sync if token is available
    const token = process.env.GH_PAT || (process.env.GITHUB_TOKEN !== "your_optional_github_pat_here" ? process.env.GITHUB_TOKEN : null);
    if (token) {
      fetch("https://api.github.com/repos/jojin1709/hunter-archive/actions/workflows/scrape.yml/dispatches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Hunter-Archive-AutoSync",
        },
        body: JSON.stringify({ ref: "main" }),
      }).catch((e) => console.warn("GitHub dispatch trigger warning:", e.message));
    }

    return Response.json({ success: true, message: "Live scrape completed successfully and synced across all devices", status: statusObj });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
