import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
const python =
  process.env.AI_PYTHON ||
  (process.platform === "win32"
    ? ".venv-ai/Scripts/python.exe"
    : ".venv-ai/bin/python");
const token = randomBytes(32).toString("base64url");
const configDir = path.resolve("data/ai-config");
mkdirSync(configDir, { recursive: true });
const env = {
  ...process.env,
  BALLIGHNI_AI_TOKEN: token,
  AI_PROVIDER: "damage",
  DAMAGE_AI_URL: "http://127.0.0.1:8787",
  YOLO_CONFIG_DIR: configDir,
};
const ai = spawn(
  python,
  ["-m", "uvicorn", "ai.service:app", "--host", "127.0.0.1", "--port", "8787"],
  { env, stdio: "inherit", windowsHide: true },
);
ai.on("error", (e) => {
  console.error(
    "Cannot start AI Python. Install ai/requirements.txt in .venv-ai or set AI_PYTHON.",
    e.message,
  );
  process.exitCode = 1;
});
let ready = false;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const r = await fetch(env.DAMAGE_AI_URL + "/health", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1000),
    });
    if (r.ok) {
      ready = true;
      break;
    }
  } catch {}
  if (ai.exitCode !== null) break;
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) {
  ai.kill();
  throw new Error(
    "Damage model did not become ready. Check the Python environment and downloaded checkpoint.",
  );
}
const backend = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "backend/server.mjs"],
  { env, stdio: "inherit", windowsHide: true },
);
const stop = () => {
  backend.kill();
  ai.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
backend.on("exit", (code) => {
  ai.kill();
  process.exitCode = code || 0;
});
ai.on("exit", () => backend.kill());
