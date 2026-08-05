import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync("node scripts/scrape.mjs", {
      cwd: process.cwd(),
      timeout: 120000,
    });
    return Response.json({ success: true, message: "Scrape job completed successfully", stdout, stderr });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
