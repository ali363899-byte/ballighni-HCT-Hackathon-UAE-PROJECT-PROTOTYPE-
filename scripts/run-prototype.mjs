import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
const python =
  process.env.AI_PYTHON ||
  (process.platform === "win32"
    ? ".venv-ai/Scripts/python.exe"
    : ".venv-ai/bin/python");
const configDir = path.resolve("data/ai-config");
mkdirSync(configDir, { recursive: true });
const env = {
  ...process.env,
  BALLIGHNI_AI_TOKEN: randomBytes(32).toString("base64url"),
  AI_PROVIDER: "damage",
  DAMAGE_AI_URL: "http://127.0.0.1:8787",
  YOLO_CONFIG_DIR: configDir,
};
let backend,
  ai,
  stopping = false;
const stop = () => {
  stopping = true;
  backend?.kill();
  ai?.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
// Accounts and reporting do not depend on model warmup or availability.
backend = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "backend/server.mjs"],
  { env, stdio: "inherit", windowsHide: true },
);
backend.on("error", (error) => {
  console.error("Cannot start the reporting server:", error.message);
  stop();
  process.exitCode = 1;
});
backend.on("exit", (code) => {
  ai?.kill();
  process.exitCode = code || 0;
});
ai = spawn(
  python,
  ["-m", "uvicorn", "ai.service:app", "--host", "127.0.0.1", "--port", "8787"],
  { env, stdio: "inherit", windowsHide: true },
);
ai.on("error", (error) =>
  console.warn(
    "AI Python could not start. Reporting stays available with an explicit manual fallback. Check AI_PYTHON and ai/requirements.txt.",
    error.message,
  ),
);
ai.on("exit", () => {
  if (!stopping)
    console.warn(
      "AI service stopped. Reporting remains available; the connection bar shows AI availability.",
    );
});
