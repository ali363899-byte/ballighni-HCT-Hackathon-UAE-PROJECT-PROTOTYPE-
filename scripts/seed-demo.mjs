import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
const base = process.env.DEMO_API_URL || "http://127.0.0.1:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("The local demo seeder is restricted to the local backend.");
const health = await fetch(base + "/api/health").then((r) => r.json());
if (!health.ok) throw new Error("Start the local backend first.");
const dir = path.resolve(process.env.DATA_DIR || "data");
const file = path.join(dir, "ballighni.sqlite");
if (!existsSync(file))
  throw new Error("Local database not found. Run from the project root.");
const db = new DatabaseSync(file);
const suffix = Date.now().toString(36);
const accounts = {};
for (const [name, role] of [
  ["participant_a", "citizen"],
  ["participant_b", "citizen"],
  ["reviewer", "reviewer"],
]) {
  const username = `demo_${name}_${suffix}`;
  const password = randomBytes(18).toString("base64url");
  const salt = randomBytes(16).toString("hex");
  db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
    randomUUID(),
    username,
    `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
    role,
  );
  accounts[name] = { username, password, role };
}
db.close();
async function post(route, data, token) {
  const r = await fetch(base + "/api" + route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const value = await r.json();
  if (!r.ok) throw new Error(value.error);
  return value;
}
async function report(account, narrative, extra = {}) {
  const { token } = await post("/auth/login", account);
  let c = await post(
    "/cases",
    {
      safe: true,
      consent: true,
      reporter_role: "driver",
      location: "Al Jurf, Ajman — synthetic demonstration",
      event_time: new Date().toISOString(),
      narrative,
      ...extra,
    },
    token,
  );
  if (process.env.DEMO_PHOTO && account === accounts.participant_a) {
    const bytes = readFileSync(process.env.DEMO_PHOTO);
    await post(
      `/cases/${c.id}/evidence`,
      { base64: bytes.toString("base64"), consent: true },
      token,
    );
  }
  c = await post(`/cases/${c.id}/analyze`, {}, token);
  await post(
    `/cases/${c.id}/submit`,
    { confirm: true, report: c.analysis.narrative },
    token,
  );
  return {
    id: c.id,
    token,
    mode: c.analysis.mode,
    findings: c.analysis.findings.length,
  };
}
const a = await report(
  accounts.participant_a,
  "Synthetic account A: I believe my vehicle was stationary. My account differs from the other participant. This is a fictional demo, not a real incident.",
  {
    sharing_consent: true,
    self_reported_position: "affected_participant",
    support_request:
      "Synthetic support request: please give me extra time and use clear written communication.",
  },
);
const invite = await post(
  `/cases/${a.id}/invite`,
  { sharing_consent: true },
  a.token,
);
const b = await report(
  accounts.participant_b,
  "Synthetic account B: I also believe my vehicle was stationary. I disagree with account A. Both statements need human review; no cause or fault is determined.",
  { join_code: invite.code, sharing_consent: true },
);
await post("/auth/logout", {}, a.token);
await post("/auth/logout", {}, b.token);
mkdirSync(dir, { recursive: true });
writeFileSync(
  path.join(dir, "demo-accounts.json"),
  JSON.stringify(
    {
      warning:
        "LOCAL SYNTHETIC DEMO CREDENTIALS. Do not commit or share publicly.",
      accounts,
      cases: { participant_a: a.id, participant_b: b.id },
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
console.log(
  JSON.stringify(
    {
      message:
        "Synthetic accounts and separate statements created. Reviewer approval is intentionally left for the live demonstration.",
      private_credentials: path.join(dir, "demo-accounts.json"),
      cases: [a.id, b.id],
      ai_mode: a.mode,
      findings: a.findings,
    },
    null,
    2,
  ),
);
