import { cp, mkdir, writeFile } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await cp("frontend", "dist", { recursive: true });
const api = process.env.PUBLIC_API_URL || "";
if (api && !api.startsWith("https://"))
  throw new Error("PUBLIC_API_URL must use HTTPS");
await writeFile(
  "dist/config.js",
  `window.BALLIGHNI_CONFIG = ${JSON.stringify({ apiUrl: api })};\n`,
);
console.log("Web assets built in dist/. Android uses the same frontend.");
