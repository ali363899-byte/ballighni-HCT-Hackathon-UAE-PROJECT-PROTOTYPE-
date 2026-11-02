import { mkdir, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
const url =
  "https://huggingface.co/junaid17/Yolo_Model/resolve/2b9ae0653850790caf83018107f655663f5b6cf7/damage_detector.onnx";
const expected =
  "90db4bb34d758ec152cbfe86d4e428c621447802395bddfaf09e4589c194a71b";
const response = await fetch(url, { signal: AbortSignal.timeout(300000) });
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const sha = createHash("sha256").update(bytes).digest("hex");
if (sha !== expected)
  throw new Error("Checkpoint hash mismatch. Refusing to use changed weights.");
await mkdir("ai/models", { recursive: true });
await writeFile("ai/models/damage-detector.onnx.tmp", bytes);
await rename(
  "ai/models/damage-detector.onnx.tmp",
  "ai/models/damage-detector.onnx",
);
console.log(`Pretrained ONNX checkpoint verified: ${sha}`);
