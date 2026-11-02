import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../backend/ai.mjs";
test("pretrained detections retain evidence provenance and model identity", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          model: "damagelens-yolo-2b9ae06",
          detections: [
            { label: "damage", confidence: 0.72, box: [0.1, 0.2, 0.4, 0.6] },
          ],
        }),
        { status: 200 },
      ),
  );
  const result = await analyze(
    { narrative: "Unverified example", location: "Synthetic place" },
    [{ id: "photo-42", bytes: Buffer.from("example") }],
    { AI_PROVIDER: "damage", BALLIGHNI_AI_TOKEN: "test-only" },
  );
  assert.equal(result.mode, "ai");
  assert.equal(result.model, "damagelens-yolo-2b9ae06");
  assert.equal(result.findings[0].source_id, "photo-42");
  assert.equal(result.findings[0].confidence, 0.72);
  assert.match(result.findings[0].uncertainty, /Human inspection/);
});
test("malformed damage findings fail back to an honest manual draft", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          model: "damagelens-yolo-2b9ae06",
          detections: [
            { label: "driver at fault", confidence: 1, box: [0, 0, 1, 1] },
          ],
        }),
        { status: 200 },
      ),
  );
  const result = await analyze(
    { narrative: "Unverified example", location: "Synthetic place" },
    [{ id: "photo-42", bytes: Buffer.from("example") }],
    { AI_PROVIDER: "damage" },
  );
  assert.equal(result.mode, "manual");
  assert.deepEqual(result.findings, []);
  assert.ok(result.warning);
});
test("no-photo reports do not invent damage findings", async () => {
  const result = await analyze(
    { narrative: "A witness description only", location: "Synthetic location" },
    [],
    { AI_PROVIDER: "ollama" },
  );
  assert.equal(result.mode, "manual");
  assert.equal(result.findings.length, 0);
  assert.match(result.missing[0], /No photos/);
});
test("AI outage retains an honest manual fallback", async () => {
  const result = await analyze(
    {
      narrative: "Unverified driver description",
      location: "Synthetic location",
    },
    [{ id: "evidence-test", bytes: Buffer.from("synthetic") }],
    { AI_PROVIDER: "ollama", OLLAMA_URL: "http://127.0.0.1:1" },
  );
  assert.equal(result.mode, "manual");
  assert.equal(result.findings.length, 0);
  assert.match(result.warning, /unavailable/);
});
