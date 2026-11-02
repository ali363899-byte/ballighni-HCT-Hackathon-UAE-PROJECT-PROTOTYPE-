import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Official portable executable, pinned and verified. No installer or account.
const release = "2026.10.7";
const checksum =
  "2493dbc168923bb3e59e5e7716f71deced92992eea9acd6e9d74f84ac7751343";
if (process.platform !== "win32" || process.arch !== "x64")
  throw new Error(
    "This launcher supports Windows x64. See docs/TEMPORARY-SHARING.md for other systems.",
  );
const port = Number(process.env.PORT || 3000);
// Refuse to expose an unrelated service or interrupt an existing local app.
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () =>
    reject(
      new Error(
        `Port ${port} is already in use. Stop the existing Ballighni server first, then retry.`,
      ),
    ),
  );
  probe.listen(port, "127.0.0.1", () => probe.close(resolve));
});
const dir = path.resolve(process.env.DATA_DIR || "data");
const tools = path.join(dir, "tools");
const binary = path.join(tools, "cloudflared.exe");
await mkdir(tools, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
let bytes;
try {
  bytes = await readFile(binary);
} catch {}
if (!bytes || hash(bytes) !== checksum) {
  console.log("Downloading Cloudflare's official portable tunnel helper…");
  const response = await fetch(
    `https://github.com/cloudflare/cloudflared/releases/download/${release}/cloudflared-windows-amd64.exe`,
    { signal: AbortSignal.timeout(120000) },
  );
  if (!response.ok)
    throw new Error(`Cloudflare download failed (${response.status}).`);
  bytes = Buffer.from(await response.arrayBuffer());
  if (hash(bytes) !== checksum)
    throw new Error("Tunnel helper checksum mismatch; refusing to run it.");
  await writeFile(binary, bytes);
}
console.log(
  "Starting a temporary HTTPS link. Only Ballighni's web/API port is forwarded.",
);
const tunnel = spawn(
  binary,
  [
    "tunnel",
    "--url",
    `http://127.0.0.1:${port}`,
    "--protocol",
    "http2",
    "--no-autoupdate",
  ],
  { windowsHide: true },
);
let app;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(deadline);
  // These are only children created by this launcher, never unrelated servers.
  for (const child of [app, tunnel]) {
    if (child?.pid && child.exitCode === null)
      spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
  }
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
const deadline = setTimeout(() => {
  console.error(
    "The tunnel did not provide a URL. Check your internet connection and retry.",
  );
  stop(1);
}, 60000);
let buffer = "";
let starting = false;
async function receive(chunk) {
  buffer = (buffer + chunk.toString()).slice(-16000);
  const found = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!found || starting || stopping) return;
  starting = true;
  clearTimeout(deadline);
  const url = found[0];
  try {
    await writeFile(
      path.join(dir, "temporary-link.json"),
      JSON.stringify(
        {
          url,
          created_at: new Date().toISOString(),
          warning:
            "Temporary link; works only while this launcher and computer remain running.",
        },
        null,
        2,
      ),
    );
    console.log(
      `\nSHARE THIS WEBSITE: ${url}\nANDROID CONNECTION: ${url}\nKeep this terminal open. Stop with Ctrl+C. The next start creates a different URL.\n`,
    );
    app = spawn(
      process.execPath,
      ["--env-file-if-exists=.env", "scripts/start-with-ai.mjs"],
      {
        env: {
          ...process.env,
          HOST: "127.0.0.1",
          PORT: String(port),
          PUBLIC_ORIGIN: url,
        },
        stdio: "inherit",
        windowsHide: true,
      },
    );
    app.once("error", (error) => {
      console.error(error.message);
      stop(1);
    });
    app.once("exit", (code) => stop(code || 0));
  } catch (error) {
    console.error(error.message);
    stop(1);
  }
}
tunnel.stdout.on("data", receive);
tunnel.stderr.on("data", receive);
tunnel.once("error", (error) => {
  console.error(error.message);
  stop(1);
});
tunnel.once("exit", (code) => {
  if (!stopping)
    console.error(
      "Temporary sharing stopped. Restart this launcher to create a new link.",
    );
  stop(code || 0);
});
