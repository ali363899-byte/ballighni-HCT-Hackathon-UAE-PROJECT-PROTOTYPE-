import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
const dir = mkdtempSync(path.join(os.tmpdir(), "ballighni-workflow-"));
process.env.DATA_DIR = dir;
process.env.REVIEWER_SETUP_CODE = "workflow-reviewer-test";
process.env.AI_PROVIDER = "manual";
const { server } = await import("../backend/server.mjs");
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/api`;
async function call(route, method = "GET", data, token) {
  const r = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
async function account(username, reviewer = false) {
  const data = {
    username,
    password: "workflow-test-password-2026",
    ...(reviewer ? { reviewer_code: "workflow-reviewer-test" } : {}),
  };
  assert.equal((await call("/auth/register", "POST", data)).status, 201);
  return (await call("/auth/login", "POST", data)).data.token;
}
async function submit(token, extra = {}) {
  const created = await call(
    "/cases",
    "POST",
    {
      safe: true,
      consent: true,
      reporter_role: "driver",
      location: "Synthetic A location",
      event_time: new Date().toISOString(),
      narrative:
        "Independent account A: I was stationary when I observed the scene.",
      ...extra,
    },
    token,
  );
  assert.equal(created.status, 201);
  const id = created.data.id;
  const analysis = await call(`/cases/${id}/analyze`, "POST", {}, token);
  assert.equal(
    (
      await call(
        `/cases/${id}/submit`,
        "POST",
        { confirm: true, report: analysis.data.analysis.narrative },
        token,
      )
    ).status,
    200,
  );
  return id;
}
after(
  () =>
    new Promise((resolve) =>
      server.close(() => {
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {}
        resolve();
      }),
    ),
);
test("independent testimony, consent, reviewer approval and simulated dual routing", async () => {
  const a = await account("participant_a");
  const b = await account("participant_b");
  const outsider = await account("outsider");
  const reviewer = await account("packet_reviewer", true);
  const aid = await submit(a, {
    support_request: "Please allow extra time. I prefer written communication.",
  });
  assert.equal(
    (await call(`/cases/${aid}/invite`, "POST", { sharing_consent: false }, a))
      .status,
    400,
  );
  const invite = await call(
    `/cases/${aid}/invite`,
    "POST",
    { sharing_consent: true },
    a,
  );
  assert.equal(invite.status, 200);
  const bid = await submit(b, {
    location: "Synthetic differently-worded location",
    narrative:
      "Independent account B: I disagree with the first account. The available facts need review.",
    join_code: invite.data.code,
    sharing_consent: true,
    support_request: "PRIVATE SUPPORT REQUEST B",
  });
  assert.equal(
    (await call(`/cases/${aid}`, "GET", null, a)).data.shared_reports.length,
    0,
  );
  assert.equal(
    (await call(`/cases/${aid}/joint-report`, "GET", null, a)).status,
    403,
  );
  assert.equal(
    (await call(`/cases/${aid}`, "GET", null, outsider)).status,
    404,
  );
  const reviewing = await call(`/cases/${aid}`, "GET", null, reviewer);
  assert.ok(reviewing.data.matches.some((m) => m.id === bid));
  assert.equal(
    (
      await call(
        `/cases/${aid}/link`,
        "POST",
        {
          other_id: bid,
          decision: "accepted",
          reason: "Private invitation and both accounts reviewed as related.",
        },
        reviewer,
      )
    ).status,
    200,
  );
  const shared = (await call(`/cases/${aid}`, "GET", null, a)).data;
  assert.equal(shared.shared_reports[0].id, bid);
  assert.match(shared.shared_reports[0].testimony, /Independent account B/);
  assert.ok(!JSON.stringify(shared).includes("PRIVATE SUPPORT REQUEST B"));
  assert.equal(
    (
      await call(
        `/cases/${aid}/dispatch`,
        "POST",
        { destination: "insurer_demo" },
        a,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/cases/${aid}/dispatch`,
        "POST",
        { destination: "insurer_demo" },
        reviewer,
      )
    ).status,
    409,
  );
  await call(
    `/cases/${aid}/status`,
    "PATCH",
    { status: "review", reason: "Start independent evidence review." },
    reviewer,
  );
  const packet = (
    await call(`/cases/${aid}/joint-report`, "GET", null, reviewer)
  ).data;
  assert.equal(packet.content.statements.length, 2);
  assert.match(packet.report_text, /Independent account A/);
  assert.match(packet.report_text, /Independent account B/);
  assert.match(packet.report_text, /disagree/);
  assert.equal(
    (
      await call(
        `/cases/${aid}/review-packet`,
        "POST",
        {
          confirm: true,
          notes:
            "PRIVATE_REVIEW_NOTE: Both accounts preserved; conflict is unresolved and liability is undetermined.",
        },
        reviewer,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(`/cases/${bid}`, "GET", null, b)).data.status,
    "review",
  );
  const department = await call(
    `/cases/${aid}/dispatch`,
    "POST",
    { destination: "department_demo" },
    reviewer,
  );
  const insurance = await call(
    `/cases/${aid}/dispatch`,
    "POST",
    { destination: "insurer_demo" },
    reviewer,
  );
  for (const receipt of [department, insurance]) {
    assert.equal(receipt.status, 200);
    assert.equal(receipt.data.externally_transmitted, false);
    assert.equal(receipt.data.mode, "simulation");
  }
  assert.equal(
    (
      await call(
        `/cases/${aid}/dispatch`,
        "POST",
        { destination: "department_demo" },
        reviewer,
      )
    ).data.id,
    department.data.id,
  );
  assert.equal(
    (await call(`/cases/${bid}`, "GET", null, b)).data.dispatches.length,
    2,
  );
  await call(
    `/cases/${bid}/status`,
    "PATCH",
    { status: "more_info", reason: "Please clarify the independent account." },
    reviewer,
  );
  await call(
    `/cases/${bid}/respond`,
    "POST",
    { message: "New independent information changes the reviewed packet." },
    b,
  );
  assert.equal(
    (
      await call(
        `/cases/${aid}/dispatch`,
        "POST",
        { destination: "insurer_demo" },
        reviewer,
      )
    ).status,
    409,
  );
  assert.equal(
    (await call(`/cases/${aid}`, "GET", null, reviewer)).data.packet_review
      .stale,
    true,
  );
  assert.ok(
    !JSON.stringify(
      (await call(`/cases/${aid}`, "GET", null, a)).data,
    ).includes("PRIVATE_REVIEW_NOTE"),
  );
  const reused = await call(
    "/cases",
    "POST",
    {
      safe: true,
      consent: true,
      reporter_role: "driver",
      location: "Synthetic place",
      event_time: new Date().toISOString(),
      narrative: "Trying to reuse a consumed private invitation.",
      join_code: invite.data.code,
      sharing_consent: true,
    },
    outsider,
  );
  assert.equal(reused.status, 400);
  assert.equal(
    (
      await call(
        `/cases/${aid}/sharing`,
        "PATCH",
        { sharing_consent: false },
        a,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(`/cases/${bid}`, "GET", null, b)).data.shared_reports.length,
    0,
  );
  assert.equal(
    (
      await call(
        `/cases/${aid}/sharing`,
        "PATCH",
        { sharing_consent: true },
        outsider,
      )
    ).status,
    404,
  );
});
