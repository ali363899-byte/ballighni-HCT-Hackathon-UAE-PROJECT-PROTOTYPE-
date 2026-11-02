import { mkdir, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
const revision = "e4879d4fa6736e89bb22572cd8993d7bd56416c7";
const expected =
  "f1cff663ce47e1ac615da6f7a9b034a5ebbf7bedf75cf38f34d2c85fc6b761ce";
const url = `https://raw.githubusercontent.com/artemxdata/Car-Damage-Assessment-AI/${revision}/models/best.pt`;
const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const sha = createHash("sha256").update(bytes).digest("hex");
if (sha !== expected)
  throw new Error("Checkpoint hash mismatch. Refusing to use changed weights.");
await mkdir("ai/models", { recursive: true });
await writeFile("ai/models/damage-yolov8n.pt.tmp", bytes);
await rename("ai/models/damage-yolov8n.pt.tmp", "ai/models/damage-yolov8n.pt");
console.log(`Pinned pretrained checkpoint verified: ${sha}`);
