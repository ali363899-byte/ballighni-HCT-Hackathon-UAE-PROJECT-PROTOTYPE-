import { test } from "node:test";
import assert from "node:assert/strict";
import {
  repairReference,
  compareStatements,
  runCaseStages,
} from "../backend/ai-workflow.mjs";

test("repair references use cited ranges, never sum repeated photos or price unsupported parts", () => {
  const cost = repairReference([
    { source_id: "a", observation: "Possible visible dent." },
    { source_id: "b", observation: "Possible visible dent." },
    { source_id: "a", observation: "Possible visible dislocated part." },
  ]);
  assert.equal(cost.currency, "AED");
  assert.equal(cost.total, null);
  assert.equal(cost.scenarios.length, 1);
  assert.equal(cost.scenarios[0].low, 665);
  assert.equal(cost.scenarios[0].high, 2095);
  assert.deepEqual(cost.scenarios[0].source_ids, ["a", "b"]);
  assert.equal(cost.unpriced.length, 1);
  assert.match(cost.scenarios[0].source_url, /^https:/);
  assert.equal(repairReference([]).status, "workshop_quote_required");
});
test("testimony AI must quote both original sources exactly", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              summaries: [
                {
                  source_id: "A",
                  summary: "Account A reports being stopped.",
                  quote: "I was stopped.",
                },
                {
                  source_id: "B",
                  summary: "Account B reports movement.",
                  quote: "I saw movement.",
                },
              ],
              differences: [
                {
                  source_a: "A",
                  quote_a: "I was stopped.",
                  source_b: "B",
                  quote_b: "I saw movement.",
                  question: "Did the accounts describe the same point in time?",
                },
              ],
              follow_up_questions: [],
            }),
          },
        }),
      ),
  );
  const result = await compareStatements([
    { source_id: "A", testimony: "I was stopped." },
    { source_id: "B", testimony: "I saw movement." },
  ]);
  assert.equal(result.mode, "ai");
  assert.equal(result.differences[0].source_b, "B");
});
test("fabricated testimony quotations are rejected rather than merged into the report", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              summaries: [
                {
                  source_id: "A",
                  summary: "An invented account.",
                  quote: "Invented statement.",
                },
              ],
              differences: [],
              follow_up_questions: [],
            }),
          },
        }),
      ),
  );
  await assert.rejects(
    compareStatements([
      { source_id: "A", testimony: "My original statement remains unchanged." },
    ]),
    /original testimony/,
  );
});
test("assessment, testimony and report are separate model calls; prices remain outside model output", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = JSON.parse(options.body);
    calls.push(request);
    const input = JSON.parse(request.messages[1].content);
    let value;
    if (request.messages[0].content.includes("damage assessment assistant"))
      value = {
        overview:
          "The detector suggests a possible visible dent, subject to inspection.",
        visible_extent: "single_region",
        follow_up_questions: ["Can you supply another permitted photo angle?"],
      };
    else if (
      request.messages[0].content.includes("testimony comparison assistant")
    )
      value = {
        summaries: [
          {
            source_id: "CASE-A",
            summary: "The reporter says they were stopped.",
            quote: input.statements[0].testimony,
          },
        ],
        differences: [],
        follow_up_questions: [],
      };
    else
      value = {
        overview: "The reporter states they were stopped.",
        evidence_summary:
          "The detector suggested a possible visible dent; this is unverified.",
        next_steps: ["Review the original photo and confirm the draft."],
      };
    return new Response(
      JSON.stringify({ message: { content: JSON.stringify(value) } }),
    );
  });
  const result = await runCaseStages(
    { id: "CASE-A", narrative: "I was stopped." },
    {
      mode: "ai",
      model: "trained-detector",
      findings: [
        { source_id: "photo-A", observation: "Possible visible dent." },
      ],
      missing: [],
    },
    { TEXT_AI_ENABLED: "true", TEXT_AI_MODEL: "local-test-model" },
  );
  assert.equal(calls.length, 3);
  assert.equal(result.stages.assessment.status, "complete");
  assert.equal(result.stages.testimony.status, "complete");
  assert.equal(result.stages.report.status, "complete");
  assert.equal(result.repair_reference.scenarios[0].low, 665);
  assert.ok(
    calls.every((c) => c.stream === false && c.format.type === "object"),
  );
});
