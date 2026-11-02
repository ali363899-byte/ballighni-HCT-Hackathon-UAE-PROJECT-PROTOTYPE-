import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
const dir = mkdtempSync(path.join(os.tmpdir(), "ballighni-test-"));
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
test("complete reporting and human review lifecycle; access and validation", async () => {
  const owner = await account("driver_one");
  const other = await account("witness_two");
  const reviewer = await account("reviewer_three", "test-only-reviewer-code");
  const report = {
    safe: true,
    consent: true,
    reporter_role: "driver",
    location: "Al Jurf, Ajman",
    event_time: new Date(Date.now() - 60000).toISOString(),
    narrative: "Two vehicles were at the scene. Rear bumper appeared dented.",
  };
  assert.equal(
    (await call("/cases", "POST", { ...report, safe: false }, owner)).status,
    400,
  );
  assert.equal(
    (await call("/cases", "POST", { ...report, consent: false }, owner)).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/cases",
        "POST",
        { ...report, reporter_role: "forged" },
        owner,
      )
    ).status,
    400,
  );
  const created = await call("/cases", "POST", report, owner);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await call(`/cases/${id}`, "GET", null, other)).status, 404);
  assert.equal((await call(`/cases/${id}`)).status, 401);
  assert.equal(
    (
      await call(
        `/cases/${id}/status`,
        "PATCH",
        { status: "closed", reason: "Fake close" },
        owner,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/cases/${id}/evidence`,
        "POST",
        {
          base64: Buffer.from("not a valid image format").toString("base64"),
          consent: true,
        },
        owner,
      )
    ).status,
    400,
  );
  const image = await sharp({
    create: { width: 48, height: 48, channels: 3, background: "#7c8b6b" },
  })
    .jpeg()
    .toBuffer();
  const upload = { base64: image.toString("base64"), consent: true };
  assert.equal(
    (await call(`/cases/${id}/evidence`, "POST", upload, owner)).status,
    200,
  );
  assert.equal(
    (await call(`/cases/${id}/evidence`, "POST", upload, owner)).status,
    409,
  );
  const analysis = await call(`/cases/${id}/analyze`, "POST", {}, owner);
  assert.equal(analysis.data.analysis.mode, "manual");
  assert.deepEqual(analysis.data.analysis.findings, []);
  assert.equal(
    (
      await call(
        `/cases/${id}/submit`,
        "POST",
        { confirm: false, report: "An unconfirmed account" },
        owner,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        `/cases/${id}/submit`,
        "POST",
        { confirm: true, report: analysis.data.analysis.narrative },
        owner,
      )
    ).data.status,
    "submitted",
  );
  assert.equal(
    (
      await call(
        `/cases/${id}/status`,
        "PATCH",
        { status: "closed", reason: "Cannot skip review" },
        reviewer,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await call(
        `/cases/${id}/status`,
        "PATCH",
        { status: "review", reason: "Checking original evidence" },
        reviewer,
      )
    ).data.status,
    "review",
  );
  const witness = await call(
    "/cases",
    "POST",
    { ...report, reporter_role: "witness" },
    other,
  );
  const wid = witness.data.id;
  const wa = await call(`/cases/${wid}/analyze`, "POST", {}, other);
  await call(
    `/cases/${wid}/submit`,
    "POST",
    { confirm: true, report: wa.data.analysis.narrative },
    other,
  );
  const viewed = await call(`/cases/${id}`, "GET", null, reviewer);
  assert.equal(viewed.data.matches[0].id, wid);
  assert.equal(
    (
      await call(
        `/cases/${id}/link`,
        "POST",
        {
          other_id: wid,
          decision: "accepted",
          reason: "Time and entered place are consistent",
        },
        reviewer,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(`/cases/${wid}`, "GET", null, other)).data.updates.at(-1)
      .action,
    "link_accepted",
  );
  await call(
    `/cases/${id}/status`,
    "PATCH",
    { status: "more_info", reason: "Please add the second viewpoint" },
    reviewer,
  );
  assert.equal(
    (
      await call(
        `/cases/${id}/respond`,
        "POST",
        { message: "I do not have additional permitted images." },
        owner,
      )
    ).data.status,
    "review",
  );
  assert.equal(
    (
      await call(
        `/cases/${id}/status`,
        "PATCH",
        {
          status: "closed",
          reason: "Prototype review complete; no official verdict issued",
        },
        reviewer,
      )
    ).data.status,
    "closed",
  );
  const final = await call(`/cases/${id}/export`, "GET", null, owner);
  assert.ok(final.data.updates.length >= 8);
  assert.equal(final.data.status, "closed");
  await call("/auth/logout", "POST", {}, owner);
  assert.equal((await call(`/cases/${id}`, "GET", null, owner)).status, 401);
});
