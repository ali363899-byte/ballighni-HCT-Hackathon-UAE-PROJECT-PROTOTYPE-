import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { inspectImage } from "../backend/image-quality.mjs";
import { analyze } from "../backend/ai.mjs";
test("flat low-detail image prompts a retake without invoking damage inference", async (t) => {
  const bytes = await sharp({
    create: { width: 640, height: 480, channels: 3, background: "#777777" },
  })
    .jpeg()
    .toBuffer();
  const quality = await inspectImage(bytes);
  assert.equal(quality.assessment, "heuristic");
  assert.equal(quality.usable_for_ai, false);
  assert.ok(quality.flags.some((x) => x.includes("detail")));
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Must not be called for an unusable photo");
  });
  const result = await analyze(
    {
      narrative: "Synthetic low-detail example",
      location: "Synthetic location",
    },
    [{ id: "flat-photo", bytes, quality }],
    { AI_PROVIDER: "damage" },
  );
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(result.mode, "manual");
  assert.deepEqual(result.findings, []);
  assert.match(result.warning, /clearer image/);
});
test("a detailed image passes the bounded quality heuristic", async () => {
  const raw = Buffer.alloc(640 * 480 * 3);
  for (let i = 0; i < raw.length; i++)
    raw[i] = (i * 73 + Math.floor(i / 640) * 19) % 256;
  const bytes = await sharp(raw, {
    raw: { width: 640, height: 480, channels: 3 },
  })
    .jpeg()
    .toBuffer();
  const quality = await inspectImage(bytes);
  assert.equal(quality.width, 640);
  assert.equal(quality.height, 480);
  assert.equal(quality.usable_for_ai, true);
});
