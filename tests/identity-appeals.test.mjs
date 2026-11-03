import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
const dir = mkdtempSync(path.join(os.tmpdir(), "ballighni-identity-appeals-"));
process.env.DATA_DIR = dir;
process.env.REVIEWER_SETUP_CODE = "test-only-reviewer-code";
process.env.AI_PROVIDER = "manual";
const { server } = await import("../backend/server.mjs");
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/api`;
async function call(route, method = "GET", body, token) {
  const r = await fetch(url + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  return { status: r.status, data };
}
async function account(username, reviewer_code) {
  assert.equal(
    (
      await call("/auth/register", "POST", {
        username,
        password: "long-enough-test-password",
        reviewer_code,
      })
    ).status,
    201,
  );
  return (
    await call("/auth/login", "POST", {
      username,
      password: "long-enough-test-password",
    })
  ).data.token;
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
test("resident and tourist identity logins require passwords and do not expose document numbers", async () => {
  const resident = {
    username: "resident_sample",
    password: "synthetic-long-password",
    login_method: "resident",
    identity_number: "784190000000001",
    identity_consent: true,
  };
  assert.equal((await call("/auth/register", "POST", resident)).status, 201);
  const signed = await call("/auth/login", "POST", {
    ...resident,
    username: "",
  });
  assert.equal(signed.status, 200);
  assert.ok(!JSON.stringify(signed.data).includes(resident.identity_number));
  assert.equal(
    (await call("/auth/login", "POST", { ...resident, password: "wrong" }))
      .status,
    401,
  );
  assert.equal(
    (
      await call("/auth/register", "POST", {
        ...resident,
        username: "duplicate_sample",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("/auth/register", "POST", {
        ...resident,
        username: "bad_id",
        identity_number: "123",
      })
    ).status,
    400,
  );
  const tourist = {
    username: "tourist_sample",
    password: "synthetic-long-password",
    login_method: "tourist",
    identity_number: "TESTP12345",
    issuing_country: "ZZ",
    identity_consent: true,
  };
  assert.equal((await call("/auth/register", "POST", tourist)).status, 201);
  assert.equal(
    (await call("/auth/login", "POST", { ...tourist, username: "" })).status,
    200,
  );
  assert.equal(
    (await call("/auth/login", "POST", { ...tourist, issuing_country: "YY" }))
      .status,
    401,
  );
  assert.equal(
    (
      await call("/auth/register", "POST", {
        ...tourist,
        username: "tourist_other",
        issuing_country: "YY",
      })
    ).status,
    201,
  );
  const { readFileSync } = await import("node:fs");
  const bytes = readFileSync(path.join(dir, "ballighni.sqlite"));
  assert.equal(bytes.includes(Buffer.from(resident.identity_number)), false);
  assert.equal(bytes.includes(Buffer.from(tourist.identity_number)), false);
});

test("owner appeals are private, duplicate-safe and reviewer-controlled; accepting reopens without changing testimony", async () => {
  const owner = await account("appeal_owner"),
    outsider = await account("appeal_outsider"),
    reviewer = await account("appeal_reviewer", "test-only-reviewer-code");
  const made = await call(
    "/cases",
    "POST",
    {
      safe: true,
      consent: true,
      reporter_role: "driver",
      location: "Synthetic appeals test",
      event_time: new Date().toISOString(),
      narrative: "Original independent testimony remains unchanged.",
    },
    owner,
  );
  const id = made.data.id;
  const request = {
    confirm: true,
    reason:
      "Please reconsider the photographed damage and the reviewer response.",
  };
  assert.equal(
    (await call(`/cases/${id}/appeal-request`, "POST", request, owner)).status,
    409,
  );
  await call(`/cases/${id}/analyze`, "POST", {}, owner);
  await call(
    `/cases/${id}/submit`,
    "POST",
    {
      confirm: true,
      report: "Confirmed original report for a synthetic appeal test.",
    },
    owner,
  );
  await call(
    `/cases/${id}/status`,
    "PATCH",
    { status: "review", reason: "Reviewing the synthetic case." },
    reviewer,
  );
  await call(
    `/cases/${id}/status`,
    "PATCH",
    { status: "closed", reason: "Synthetic review has finished." },
    reviewer,
  );
  assert.equal(
    (await call(`/cases/${id}/appeal-request`, "POST", request, outsider))
      .status,
    404,
  );
  const appealed = await call(
    `/cases/${id}/appeal-request`,
    "POST",
    request,
    owner,
  );
  assert.equal(appealed.status, 200);
  assert.equal(appealed.data.status, "closed");
  assert.equal(
    (await call(`/cases/${id}/appeal-request`, "POST", request, owner)).status,
    409,
  );
  const decision = {
    appeal_id: appealed.data.appeals[0].id,
    decision: "accepted",
    response: "Accepted for another human review of the evidence.",
  };
  assert.equal(
    (await call(`/cases/${id}/appeal-decision`, "POST", decision, owner))
      .status,
    403,
  );
  const accepted = await call(
    `/cases/${id}/appeal-decision`,
    "POST",
    decision,
    reviewer,
  );
  assert.equal(accepted.status, 200);
  assert.equal(accepted.data.status, "review");
  assert.equal(
    accepted.data.narrative,
    "Original independent testimony remains unchanged.",
  );
  assert.equal(
    accepted.data.confirmed_report,
    "Confirmed original report for a synthetic appeal test.",
  );
  assert.equal(accepted.data.appeals[0].status, "accepted");
  assert.equal(
    (await call(`/cases/${id}/appeal-decision`, "POST", decision, reviewer))
      .status,
    409,
  );
  const again = await call(
    `/cases/${id}/appeal-request`,
    "POST",
    request,
    owner,
  );
  const rejected = await call(
    `/cases/${id}/appeal-decision`,
    "POST",
    {
      appeal_id: again.data.appeals[1].id,
      decision: "rejected",
      response: "No additional review is required for this test.",
    },
    reviewer,
  );
  assert.equal(rejected.data.appeals[1].status, "rejected");
  assert.equal(rejected.data.status, "review");
});
