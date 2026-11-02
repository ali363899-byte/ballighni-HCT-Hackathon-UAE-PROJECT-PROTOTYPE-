import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../backend/ai.mjs";
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
