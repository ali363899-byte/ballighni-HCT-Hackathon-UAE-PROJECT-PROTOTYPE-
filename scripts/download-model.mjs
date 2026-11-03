import { mkdir, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
const revision = "cd1cb118b5111634b49e02b3dc790f2636d49d82";
const expected =
  "40d324e82d8a9cef052d747bba1b65ba70e66fa2153cc832570370128d2c3818";
const url = `https://media.githubusercontent.com/media/ReverendBayes/YOLO11m-Car-Damage-Detector/${revision}/trained.pt`;
const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const sha = createHash("sha256").update(bytes).digest("hex");
if (sha !== expected)
  throw new Error("Checkpoint hash mismatch. Refusing to use changed weights.");
await mkdir("ai/models", { recursive: true });
await writeFile("ai/models/damage-yolo11m.pt.tmp", bytes);
await rename("ai/models/damage-yolo11m.pt.tmp", "ai/models/damage-yolo11m.pt");
console.log(`Pinned pretrained checkpoint verified: ${sha}`);
