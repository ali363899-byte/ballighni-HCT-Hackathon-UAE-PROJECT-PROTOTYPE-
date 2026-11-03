import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { analyze } from "./ai.mjs";
import { createCaseWorkflow } from "./case-workflow.mjs";
import { inspectImage } from "./image-quality.mjs";
import { runCaseStages, repairReference, queueAI } from "./ai-workflow.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = () => new Date().toISOString();
const digest = (value) => createHash("sha256").update(value).digest("hex");
const setupCode =
  process.env.REVIEWER_SETUP_CODE || randomBytes(18).toString("base64url");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, "data"));
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "ballighni.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id), status TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(id), hash TEXT NOT NULL, bytes BLOB NOT NULL, created_at TEXT NOT NULL, UNIQUE(case_id, hash));
 CREATE TABLE IF NOT EXISTS updates(id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT REFERENCES cases(id), actor_id TEXT, action TEXT, reason TEXT, created_at TEXT);
 CREATE TABLE IF NOT EXISTS links(a TEXT REFERENCES cases(id), b TEXT REFERENCES cases(id), decision TEXT NOT NULL, PRIMARY KEY(a,b));
 CREATE TRIGGER IF NOT EXISTS immutable_updates_update BEFORE UPDATE ON updates BEGIN SELECT RAISE(ABORT,'Audit events are immutable'); END;
 CREATE TRIGGER IF NOT EXISTS immutable_updates_delete BEFORE DELETE ON updates BEGIN SELECT RAISE(ABORT,'Audit events are immutable'); END;`);
if (
  !db
    .prepare("PRAGMA table_info(evidence)")
    .all()
    .some((c) => c.name === "quality")
)
  db.exec("ALTER TABLE evidence ADD COLUMN quality TEXT");
const q = (sql, ...args) => db.prepare(sql).get(...args);
const all = (sql, ...args) => db.prepare(sql).all(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
function text(value, field, min = 1, max = 3000) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max
  )
    fail(400, `${field} must contain ${min}-${max} characters.`);
  return value.trim();
}
function audit(id, user, action, reason = "") {
  run(
    "INSERT INTO updates(case_id,actor_id,action,reason,created_at) VALUES(?,?,?,?,?)",
    id,
    user.id,
    action,
    reason,
    now(),
  );
}
function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = fn();
    db.exec("COMMIT");
    return value;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
const allowedOrigins = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,https://localhost"
  ).split(","),
);
if (process.env.PUBLIC_ORIGIN) {
  const origin = new URL(process.env.PUBLIC_ORIGIN);
  if (
    origin.protocol !== "https:" ||
    origin.origin !== process.env.PUBLIC_ORIGIN.replace(/\/$/, "")
  )
    throw new Error("PUBLIC_ORIGIN must be a plain HTTPS origin.");
  allowedOrigins.add(origin.origin);
}
const limits = new Map();
function rate(key, max) {
  const time = Date.now();
  let bucket = limits.get(key);
  if (!bucket || time - bucket.time > 60000) {
    bucket = { time, count: 0 };
    limits.set(key, bucket);
  }
  if (++bucket.count > max)
    fail(429, "Too many requests. Please wait one minute.");
  if (limits.size > 10000)
    for (const [k, b] of limits) if (time - b.time > 60000) limits.delete(k);
}
async function body(req) {
  if (!(req.headers["content-type"] || "").startsWith("application/json"))
    fail(415, "Use application/json.");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 12 * 1024 * 1024) fail(413, "Request exceeds 12 MB.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    fail(400, "Invalid JSON.");
  }
}
function auth(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const user = q(
    "SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?",
    digest(token),
    Date.now(),
  );
  if (!user) fail(401, "Please sign in.");
  return user;
}
function getCase(id, user) {
  const row = q("SELECT * FROM cases WHERE id=?", id);
  if (!row || (row.owner_id !== user.id && user.role !== "reviewer"))
    fail(404, "Case not found.");
  return {
    ...JSON.parse(row.body),
    id: row.id,
    status: row.status,
    created_at: row.created_at,
  };
}
function save(c) {
  run(
    "UPDATE cases SET body=?,status=? WHERE id=?",
    JSON.stringify(c),
    c.status,
    c.id,
  );
}
const evidenceList = (id) =>
  all("SELECT id,created_at,quality FROM evidence WHERE case_id=?", id).map(
    (e) => ({ ...e, quality: e.quality ? JSON.parse(e.quality) : null }),
  );
function fullCase(c, user) {
  const result = {
    ...c,
    evidence: evidenceList(c.id),
    updates: all(
      "SELECT action,reason,created_at FROM updates WHERE case_id=? ORDER BY id",
      c.id,
    ),
  };
  if (user.role === "reviewer")
    result.matches = all(
      "SELECT * FROM cases WHERE id<>? AND status<>'draft'",
      c.id,
    )
      .map((row) => ({
        ...JSON.parse(row.body),
        id: row.id,
        status: row.status,
      }))
      .filter(
        (other) =>
          other.location.toLowerCase() === c.location.toLowerCase() &&
          Math.abs(Date.parse(other.event_time) - Date.parse(c.event_time)) <=
            30 * 60000,
      )
      .map((other) => ({
        id: other.id,
        reporter_role: other.reporter_role,
        status: other.status,
        reason:
          "Same entered location and time within 30 minutes. This is a heuristic, not a confirmed match.",
        decision:
          q(
            "SELECT decision FROM links WHERE a=? AND b=?",
            ...[c.id, other.id].sort(),
          )?.decision || "pending",
      }));
  const extra = workflow.enrich(c, user);
  result.shared_reports = extra.shared_reports;
  result.pending_connections = extra.pending_connections;
  result.dispatches = extra.dispatches;
  result.packet_review = extra.packet_review;
  if (user.role === "reviewer")
    result.matches = [
      ...extra.explicit_matches,
      ...(result.matches || []).filter(
        (m) => !extra.explicit_matches.some((existing) => existing.id === m.id),
      ),
    ];
  return result;
}
const activeAnalysis = new Set();
const workflow = createCaseWorkflow({
  db,
  q,
  all,
  run,
  fail,
  text,
  audit,
  transaction,
  getCase,
  save,
  now,
  digest,
});
// Background model jobs cannot survive a server restart; leave an honest retry state.
for (const row of all("SELECT id,body FROM cases")) {
  const saved = JSON.parse(row.body);
  if (["queued", "running"].includes(saved.analysis?.workflow?.status)) {
    saved.analysis.workflow.status = "interrupted";
    saved.analysis.workflow.warning =
      "The server restarted. Retry analysis on your draft to restart the AI roles.";
    transaction(() => {
      save(saved);
      audit(
        row.id,
        { id: null },
        "ai_workflow_interrupted",
        "Background AI was interrupted by server restart; original testimony preserved.",
      );
    });
  }
}
async function api(req, url, res) {
  const route = url.pathname;
  const method = req.method;
  rate(`ip:${req.socket.remoteAddress}`, 180);
  if (route === "/api/health") {
    let aiAvailable = false;
    if (process.env.AI_PROVIDER === "damage")
      try {
        const health = await fetch(
          `${process.env.DAMAGE_AI_URL || "http://127.0.0.1:8787"}/health`,
          {
            headers: {
              Authorization: `Bearer ${process.env.BALLIGHNI_AI_TOKEN || ""}`,
            },
            signal: AbortSignal.timeout(1200),
          },
        );
        aiAvailable = health.ok;
      } catch {}
    return {
      ok: true,
      app: "Ballighni",
      prototype: true,
      ai_provider: process.env.AI_PROVIDER || "manual",
      ai_available: aiAvailable,
    };
  }
  if (route === "/api/auth/register" && method === "POST") {
    rate(`register:${req.socket.remoteAddress}`, 10);
    const b = await body(req);
    const username = text(b.username, "Username", 3, 50).toLowerCase();
    if (!/^[a-z0-9_.-]+$/.test(username))
      fail(
        400,
        "Use letters, numbers, dots, underscores or hyphens for your username.",
      );
    const password = text(b.password, "Password", 12, 128);
    const salt = randomBytes(16).toString("hex");
    const role = b.reviewer_code
      ? b.reviewer_code === setupCode
        ? "reviewer"
        : fail(403, "Invalid reviewer setup code.")
      : "citizen";
    if (q("SELECT id FROM users WHERE username=?", username))
      fail(409, "That username is taken.");
    run(
      "INSERT INTO users VALUES(?,?,?,?)",
      randomUUID(),
      username,
      `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
      role,
    );
    res.statusCode = 201;
    return { message: "Account created. Please sign in." };
  }
  if (route === "/api/auth/login" && method === "POST") {
    rate(`login:${req.socket.remoteAddress}`, 12);
    const b = await body(req);
    const user = q(
      "SELECT * FROM users WHERE username=?",
      text(b.username, "Username", 3, 50).toLowerCase(),
    );
    const password = text(b.password, "Password", 1, 128);
    const [salt, hash] = (
      user?.password || `${"0".repeat(32)}:${"0".repeat(128)}`
    ).split(":");
    if (
      !timingSafeEqual(
        scryptSync(password, salt, 64),
        Buffer.from(hash, "hex"),
      ) ||
      !user
    )
      fail(401, "Incorrect username or password.");
    const token = randomBytes(32).toString("base64url");
    run("DELETE FROM sessions WHERE expires<?", Date.now());
    run(
      "INSERT INTO sessions VALUES(?,?,?)",
      digest(token),
      user.id,
      Date.now() + 12 * 3600000,
    );
    return {
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
  const user = auth(req);
  const workflowResult = await workflow.handle(req, url, user, body);
  if (workflowResult.handled) return workflowResult.value;
  if (route === "/api/auth/logout" && method === "POST") {
    run(
      "DELETE FROM sessions WHERE token=?",
      digest((req.headers.authorization || "").replace(/^Bearer /, "")),
    );
    return { ok: true };
  }
  if (route === "/api/me")
    return { id: user.id, username: user.username, role: user.role };
  if (route === "/api/cases" && method === "GET")
    return all(
      user.role === "reviewer"
        ? "SELECT * FROM cases WHERE status<>'draft' ORDER BY created_at DESC"
        : "SELECT * FROM cases WHERE owner_id=? ORDER BY created_at DESC",
      ...(user.role === "reviewer" ? [] : [user.id]),
    ).map((row) => ({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      ...JSON.parse(row.body),
    }));
  if (route === "/api/cases" && method === "POST") {
    rate(`create:${user.id}`, 15);
    const b = await body(req);
    if (b.safe !== true)
      fail(
        400,
        "Routine reports require confirmation of no immediate danger. Use official emergency channels if needed.",
      );
    if (b.consent !== true) fail(400, "Consent is required.");
    if (!["driver", "witness"].includes(b.reporter_role))
      fail(400, "Select driver or witness.");
    const time = Date.parse(b.event_time);
    if (
      !Number.isFinite(time) ||
      time > Date.now() + 300000 ||
      time < Date.now() - 365 * 86400000
    )
      fail(400, "Enter an incident time within the past year.");
    const c = {
      id: `BLG-${new Date().getFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`,
      status: "draft",
      reporter_role: b.reporter_role,
      location: text(b.location, "Location", 3, 200),
      event_time: new Date(time).toISOString(),
      narrative: text(b.narrative, "Description", 10, 3000),
      support_request: b.support_request
        ? text(b.support_request, "Requested support", 1, 500)
        : null,
      self_reported_position: [
        "participant",
        "affected_participant",
        "witness",
      ].includes(b.self_reported_position)
        ? b.self_reported_position
        : b.reporter_role === "witness"
          ? "witness"
          : "participant",
      sharing_consent: b.sharing_consent === true,
      consent: true,
      safe: true,
      analysis: null,
      created_at: now(),
    };
    transaction(() => {
      run(
        "INSERT INTO cases VALUES(?,?,?,?,?)",
        c.id,
        user.id,
        c.status,
        JSON.stringify(c),
        c.created_at,
      );
      workflow.connectOnCreate(c, b, user);
      audit(c.id, user, "draft_created");
    });
    res.statusCode = 201;
    return fullCase(c, user);
  }
  const match = route.match(
    /^\/api\/cases\/([A-Z0-9-]+)(?:\/(evidence|analyze|ai-cancel|submit|status|link|respond|export|findings)(?:\/([a-f0-9-]+))?)?$/,
  );
  if (!match) fail(404, "Endpoint not found.");
  const [, id, action, eid] = match;
  let c = getCase(id, user);
  const owner =
    q("SELECT owner_id FROM cases WHERE id=?", id).owner_id === user.id;
  if (!action && method === "GET") return fullCase(c, user);
  if (action === "export" && method === "GET") {
    res.setHeader("Content-Disposition", `attachment; filename="${id}.json"`);
    return fullCase(c, user);
  }
  if (action === "evidence" && method === "GET" && eid) {
    const file = q(
      "SELECT bytes FROM evidence WHERE id=? AND case_id=?",
      eid,
      id,
    );
    if (!file) fail(404, "Evidence not found.");
    res.setHeader("Content-Type", "image/jpeg");
    res.end(Buffer.from(file.bytes));
    return;
  }
  if (action === "evidence" && method === "POST") {
    if (activeAnalysis.has(id))
      fail(409, "Wait for analysis to finish before adding evidence.");
    if (!owner || !["draft", "more_info"].includes(c.status))
      fail(
        403,
        "Evidence can be added only to your draft or when information is requested.",
      );
    if (evidenceList(id).length >= 6)
      fail(400, "A maximum of six photos is allowed.");
    const b = await body(req);
    if (b.consent !== true) fail(400, "Photo consent required.");
    if (
      typeof b.base64 !== "string" ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(b.base64)
    )
      fail(400, "Invalid photo encoding.");
    const input = Buffer.from(b.base64, "base64");
    if (input.length > 8 * 1024 * 1024 || input.length < 20)
      fail(413, "Upload a valid image up to 8 MB.");
    let bytes;
    try {
      const image = sharp(input, {
        limitInputPixels: 40000000,
        failOn: "warning",
      });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format))
        fail(415, "Use JPEG, PNG, or WebP.");
      bytes = await image
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (e) {
      if (e.status) throw e;
      fail(400, "The image cannot be decoded. Try another photo.");
    }
    const quality = await inspectImage(bytes);
    const hash = digest(bytes);
    if (q("SELECT id FROM evidence WHERE case_id=? AND hash=?", id, hash))
      fail(409, "This photo is already attached.");
    // Recheck after asynchronous decoding, before making a state change.
    c = getCase(id, user);
    if (!["draft", "more_info"].includes(c.status) || activeAnalysis.has(id))
      fail(409, "Case changed or analysis started. Refresh before uploading.");
    if (evidenceList(id).length >= 6)
      fail(400, "A maximum of six photos is allowed.");
    const evidenceId = randomUUID();
    transaction(() => {
      run(
        "INSERT INTO evidence(id,case_id,hash,bytes,created_at,quality) VALUES(?,?,?,?,?,?)",
        evidenceId,
        id,
        hash,
        bytes,
        now(),
        JSON.stringify(quality),
      );
      c.analysis = null;
      save(c);
      audit(id, user, "evidence_added", evidenceId);
    });
    return fullCase(c, user);
  }
  if (action === "ai-cancel" && method === "POST") {
    if (!owner || c.status !== "draft")
      fail(403, "Only the draft owner can stop its text AI workflow.");
    if (!c.analysis?.workflow)
      fail(409, "There is no text AI workflow to stop.");
    c.analysis.workflow = {
      ...c.analysis.workflow,
      status: "cancelled",
      job_id: randomUUID(),
      warning:
        "Text AI stopped by the owner. Detector findings and the editable draft remain saved.",
    };
    transaction(() => {
      save(c);
      audit(
        id,
        user,
        "ai_workflow_cancelled",
        "Owner chose to keep the saved detector/manual draft. Original testimony unchanged.",
      );
    });
    return fullCase(c, user);
  }
  if (action === "analyze" && method === "POST") {
    if (!owner || c.status !== "draft")
      fail(403, "Only the owner can analyze a draft.");
    if (["queued", "running"].includes(c.analysis?.workflow?.status))
      fail(
        409,
        "The AI assistants are already working. Keep the saved case open for stage updates.",
      );
    rate(`ai:${user.id}`, 3);
    if (activeAnalysis.has(id)) fail(409, "Analysis is already running.");
    activeAnalysis.add(id);
    try {
      const ev = all(
        "SELECT id,bytes,quality FROM evidence WHERE case_id=?",
        id,
      ).map((e) => ({
        ...e,
        bytes: Buffer.from(e.bytes),
        quality: e.quality ? JSON.parse(e.quality) : null,
      }));
      const finding = await analyze(c, ev);
      c = getCase(id, user);
      if (c.status !== "draft") fail(409, "Case changed during analysis.");
      c.analysis = { ...finding, created_at: now() };
      if (process.env.TEXT_AI_ENABLED === "true") {
        const jobId = randomUUID();
        c.analysis.workflow = {
          job_id: jobId,
          status: "queued",
          repair_reference: repairReference(finding.findings),
        };
        const snapshot = structuredClone(c);
        queueAI(async () => {
          if (getCase(id, user).analysis?.workflow?.job_id !== jobId) return;
          const result = await runCaseStages(
            snapshot,
            finding,
            process.env,
            (progress) => {
              const partial = getCase(id, user);
              if (partial.analysis?.workflow?.job_id !== jobId)
                throw new Error("This AI job was superseded or cancelled.");
              partial.analysis.workflow = {
                ...progress,
                job_id: jobId,
                status: "running",
              };
              save(partial);
            },
          );
          const fresh = getCase(id, user);
          if (fresh.analysis?.workflow?.job_id !== jobId) return;
          fresh.analysis.workflow = {
            ...result,
            job_id: jobId,
            status: "complete",
          };
          transaction(() => {
            save(fresh);
            audit(
              id,
              user,
              "ai_workflow_completed",
              "Separate assessment, testimony and report roles completed; original account unchanged.",
            );
          });
        }).catch((error) =>
          console.error("Text AI workflow failed:", error.message),
        );
      }
      transaction(() => {
        save(c);
        audit(id, user, "draft_prepared", finding.mode);
      });
      return fullCase(c, user);
    } finally {
      activeAnalysis.delete(id);
    }
  }
  if (action === "submit" && method === "POST") {
    if (!owner || c.status !== "draft")
      fail(403, "Only your draft can be submitted.");
    if (activeAnalysis.has(id)) fail(409, "Wait for analysis to finish.");
    const b = await body(req);
    if (b.confirm !== true) fail(400, "Confirm the draft first.");
    if (!c.analysis) fail(400, "Prepare the report draft first.");
    c.confirmed_report = text(b.report, "Report", 10, 6000);
    c.status = "submitted";
    transaction(() => {
      save(c);
      audit(id, user, "submitted", "Reporter confirmed the draft.");
    });
    return fullCase(c, user);
  }
  if (action === "respond" && method === "POST") {
    if (!owner || c.status !== "more_info")
      fail(403, "No information request is open for this case.");
    const b = await body(req);
    const response = text(b.message, "Response", 5, 2000);
    c.status = "review";
    transaction(() => {
      save(c);
      audit(id, user, "information_provided", response);
    });
    return fullCase(c, user);
  }
  if (action === "findings" && method === "PATCH") {
    if (user.role !== "reviewer") fail(403, "Reviewer access is required.");
    if (!["review", "more_info"].includes(c.status))
      fail(
        409,
        "Start review before recording a correction. Closed cases cannot change.",
      );
    const b = await body(req);
    if (!evidenceList(id).some((e) => e.id === b.source_id))
      fail(400, "Select an evidence source from this case.");
    const correction = text(b.correction, "Human correction", 5, 2000);
    c.review_corrections = [
      ...(c.review_corrections || []),
      {
        source_id: b.source_id,
        correction,
        created_at: now(),
        actor_role: "reviewer",
      },
    ];
    transaction(() => {
      save(c);
      audit(id, user, "finding_corrected", `${b.source_id}: ${correction}`);
    });
    return fullCase(c, user);
  }
  if (action === "status" && method === "PATCH") {
    if (user.role !== "reviewer") fail(403, "Reviewer access is required.");
    const b = await body(req);
    const transitions = {
      submitted: ["review", "more_info"],
      review: ["more_info", "closed"],
      more_info: ["review"],
      closed: [],
    };
    if (!transitions[c.status]?.includes(b.status))
      fail(409, "That status transition is not allowed.");
    const reason = text(b.reason, "Review reason", 5, 2000);
    c.status = b.status;
    transaction(() => {
      save(c);
      audit(id, user, `status_${b.status}`, reason);
    });
    return fullCase(c, user);
  }
  if (action === "link" && method === "POST") {
    if (user.role !== "reviewer") fail(403, "Reviewer access is required.");
    const b = await body(req);
    if (!["accepted", "rejected"].includes(b.decision))
      fail(400, "Choose accepted or rejected.");
    if (
      b.other_id === id ||
      !fullCase(c, user).matches.some((m) => m.id === b.other_id)
    )
      fail(400, "Only a suggested match can be reviewed.");
    const reason = text(b.reason, "Match reason", 5, 2000);
    const [a, d] = [id, b.other_id].sort();
    transaction(() => {
      run(
        "INSERT INTO links VALUES(?,?,?) ON CONFLICT(a,b) DO UPDATE SET decision=excluded.decision",
        a,
        d,
        b.decision,
      );
      audit(id, user, `link_${b.decision}`, `${b.other_id}: ${reason}`);
      audit(b.other_id, user, `link_${b.decision}`, `${id}: ${reason}`);
    });
    return fullCase(c, user);
  }
  fail(405, "Method not allowed.");
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
export const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; frame-ancestors 'none'; base-uri 'self'",
  );
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  }
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      if (origin && !allowedOrigins.has(origin))
        fail(403, "This website origin is not allowed.");
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }
      const result = await api(req, url, res);
      if (!res.writableEnded) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      }
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) fail(405, "Method not allowed.");
    // Websites served by this API always use their own origin. A URL baked into
    // an Android build must not pin the website to an expired temporary tunnel.
    if (url.pathname === "/config.js") {
      res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      res.end(
        req.method === "HEAD"
          ? undefined
          : 'window.BALLIGHNI_CONFIG = { apiUrl: "" };\n',
      );
      return;
    }
    const web = existsSync(path.join(root, "dist/index.html"))
      ? path.join(root, "dist")
      : path.join(root, "frontend");
    const file = path.resolve(
      web,
      `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`,
    );
    if (!file.startsWith(web + path.sep)) fail(404, "File not found.");
    if (!existsSync(file)) fail(404, "File not found.");
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(req.method === "HEAD" ? undefined : readFileSync(file));
  } catch (e) {
    if (!res.writableEnded) {
      res.statusCode = e.status || 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: e.status
            ? e.message
            : "Something went wrong. Please try again.",
        }),
      );
      if (!e.status) console.error(e);
    }
  }
});
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  server.listen(
    Number(process.env.PORT || 3000),
    process.env.HOST || "127.0.0.1",
    () => {
      console.log(
        `Ballighni: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3000}`,
      );
      if (!process.env.REVIEWER_SETUP_CODE)
        console.log(`Reviewer setup code (keep private): ${setupCode}`);
    },
  );
}
