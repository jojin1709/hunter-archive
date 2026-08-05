const intervalMs = 24 * 60 * 60 * 1000;

async function run() {
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [new URL("./scrape.mjs", import.meta.url)], { stdio: "inherit", env: process.env });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`scrape exited with ${code}`)));
  });
}

console.log("Scheduled scraper started; next run in 24 hours.");
await run();
setInterval(() => run().catch((error) => console.error("Scheduled scrape failed:", error)), intervalMs);
