import { randomBytes } from "node:crypto";

// Participant accounts stay separate. Only an authorized reviewer can link and
// approve a combined packet. Dispatch below is a local simulator, never delivery
// to a government body or an insurance company.
export function createCaseWorkflow(ctx) {
  const {
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
  } = ctx;
  db.exec(`
    CREATE TABLE IF NOT EXISTS participant_invites(hash TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(id), expires INTEGER NOT NULL, consumed INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS packet_reviews(case_id TEXT PRIMARY KEY REFERENCES cases(id), fingerprint TEXT NOT NULL, packet TEXT NOT NULL, notes TEXT NOT NULL, approved_at TEXT NOT NULL, actor_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS deliveries(id TEXT PRIMARY KEY, root_case TEXT REFERENCES cases(id), destination TEXT NOT NULL, fingerprint TEXT NOT NULL, packet TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(root_case,destination,fingerprint));
    CREATE TABLE IF NOT EXISTS delivery_members(delivery_id TEXT REFERENCES deliveries(id), case_id TEXT REFERENCES cases(id), PRIMARY KEY(delivery_id,case_id));
  `);
  const destinations = {
    department_demo: "Demo department review desk",
    insurer_demo: "Demo insurance intake",
  };
  function peers(id, decisions = ["accepted"]) {
    return all("SELECT * FROM links WHERE a=? OR b=?", id, id)
      .filter((l) => decisions.includes(l.decision))
      .map((l) => {
        const other = q(
          "SELECT * FROM cases WHERE id=?",
          l.a === id ? l.b : l.a,
        );
        return other
          ? {
              ...JSON.parse(other.body),
              id: other.id,
              status: other.status,
              decision: l.decision,
            }
          : null;
      })
      .filter(Boolean);
  }
  function buildPacket(c) {
    const sources = [c, ...peers(c.id)].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const statements = sources.map((item, index) => ({
      source_case_id: item.id,
      participant_label:
        item.reporter_role === "witness"
          ? `Witness account ${index + 1}`
          : `Participant account ${index + 1}`,
      reporter_role: item.reporter_role,
      self_reported_position: item.self_reported_position || "unspecified",
      location: item.location,
      event_time: item.event_time,
      testimony: item.narrative,
      confirmed_report: item.confirmed_report || null,
      evidence: all(
        "SELECT id,hash,created_at FROM evidence WHERE case_id=? ORDER BY id",
        item.id,
      ),
      ai: item.analysis || null,
      human_corrections: item.review_corrections || [],
      additional_information: all(
        "SELECT reason,created_at FROM updates WHERE case_id=? AND action='information_provided' ORDER BY id",
        item.id,
      ),
      requested_support: item.support_request || null,
    }));
    const content = {
      prototype: true,
      official_report: false,
      liability: "Undetermined — no automated fault decision",
      statements,
    };
    const reportText = [
      "BALLIGHNI — PRELIMINARY JOINT EVIDENCE REPORT",
      "Prototype only. Independent accounts are preserved; disagreement is not resolved automatically.",
      ...statements.flatMap((s) => [
        `\n${s.participant_label.toUpperCase()} | ${s.source_case_id}`,
        `Entered location/time: ${s.location} | ${s.event_time}`,
        `Original entered testimony (unverified): ${s.testimony}`,
        `Reporter-confirmed preliminary draft: ${s.confirmed_report || "Not yet confirmed"}`,
        ...(s.ai?.findings || []).map(
          (f) =>
            `Unverified image observation [${f.source_id}]: ${f.observation}`,
        ),
        ...s.human_corrections.map(
          (n) => `Human review note [${n.source_id}]: ${n.correction}`,
        ),
        ...s.additional_information.map(
          (n) => `Additional reporter information: ${n.reason}`,
        ),
        s.requested_support
          ? `Requested communication/access support: ${s.requested_support}`
          : "",
      ]),
      "\nCONFLICTS / UNCERTAINTY",
      statements.length > 1
        ? "Compare the separate accounts above. Conflicts, cause, liability, injuries and roadworthiness require appropriate human assessment."
        : "No second account has been linked. Do not infer agreement from its absence.",
      "No government or insurance decision has been issued.",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      fingerprint: digest(JSON.stringify(content)),
      content,
      report_text: reportText,
      source_ids: sources.map((s) => s.id),
    };
  }
  function enrich(c, user) {
    const connected = peers(c.id, ["pending", "accepted", "rejected"]);
    const shared = connected.filter(
      (p) =>
        p.decision === "accepted" &&
        (user.role === "reviewer" || (c.sharing_consent && p.sharing_consent)),
    );
    const review = q("SELECT * FROM packet_reviews WHERE case_id=?", c.id);
    return {
      shared_reports: shared.map((p) => ({
        id: p.id,
        status: p.status,
        reporter_role: p.reporter_role,
        event_time: p.event_time,
        location: p.location,
        testimony: p.confirmed_report || p.narrative,
        findings: p.analysis?.findings || [],
      })),
      pending_connections: connected.filter((p) => p.decision === "pending")
        .length,
      explicit_matches:
        user.role === "reviewer"
          ? connected
              .filter((p) => p.decision === "pending" && p.status !== "draft")
              .map((p) => ({
                id: p.id,
                status: p.status,
                reporter_role: p.reporter_role,
                decision: "pending",
                reason:
                  "Another participant used a private invitation. Confirm the accounts describe the same incident before linking.",
              }))
          : [],
      dispatches: all(
        "SELECT d.id,d.destination,d.created_at FROM deliveries d JOIN delivery_members m ON d.id=m.delivery_id WHERE m.case_id=? ORDER BY d.created_at DESC",
        c.id,
      ).map((d) => ({
        ...d,
        destination_label: destinations[d.destination],
        mode: "simulation",
        externally_transmitted: false,
      })),
      packet_review: review
        ? {
            approved_at: review.approved_at,
            ...(user.role === "reviewer" ? { notes: review.notes } : {}),
            stale: review.fingerprint !== buildPacket(c).fingerprint,
          }
        : null,
    };
  }
  function connectOnCreate(c, b, user) {
    if (!b.join_code) return;
    if (b.sharing_consent !== true)
      fail(
        400,
        "Agree to share your confirmed account before joining a participant case.",
      );
    const invite = q(
      "SELECT * FROM participant_invites WHERE hash=? AND expires>? AND consumed=0",
      digest(String(b.join_code).trim()),
      Date.now(),
    );
    if (!invite)
      fail(
        400,
        "This participant invitation is invalid, expired or already used.",
      );
    const source = q("SELECT owner_id FROM cases WHERE id=?", invite.case_id);
    if (source.owner_id === user.id)
      fail(400, "A participant invitation must be used by the other account.");
    run("UPDATE participant_invites SET consumed=1 WHERE hash=?", invite.hash);
    const [a, bid] = [invite.case_id, c.id].sort();
    run("INSERT INTO links VALUES(?,?,?)", a, bid, "pending");
    audit(
      c.id,
      user,
      "participant_connection_requested",
      "Separate testimony saved. Link awaits authorized human review.",
    );
    audit(
      invite.case_id,
      user,
      "participant_connection_requested",
      "A separate participant account has requested a connection.",
    );
  }
  async function handle(req, url, user, readBody) {
    const match = url.pathname.match(
      /^\/api\/cases\/([A-Z0-9-]+)\/(invite|joint-report|review-packet|dispatch|sharing)$/,
    );
    if (!match) return { handled: false };
    const [, id, action] = match;
    const c = getCase(id, user);
    const reviewer = () => {
      if (user.role !== "reviewer") fail(403, "Reviewer access is required.");
    };
    if (action === "sharing" && req.method === "PATCH") {
      if (q("SELECT owner_id FROM cases WHERE id=?", id).owner_id !== user.id)
        fail(403, "Only the case owner can change sharing consent.");
      const b = await readBody(req);
      if (typeof b.sharing_consent !== "boolean")
        fail(400, "Choose whether to share your confirmed account.");
      transaction(() => {
        c.sharing_consent = b.sharing_consent;
        save(c);
        audit(
          id,
          user,
          "participant_sharing_changed",
          b.sharing_consent
            ? "Consented confirmed-account sharing enabled."
            : "Future confirmed-account sharing disabled. Reviewer access and the audit history remain.",
        );
      });
      return {
        handled: true,
        value: { ok: true, sharing_consent: c.sharing_consent },
      };
    }
    if (action === "invite" && req.method === "POST") {
      const owner =
        q("SELECT owner_id FROM cases WHERE id=?", id).owner_id === user.id;
      if (!owner || !["submitted", "review", "more_info"].includes(c.status))
        fail(
          403,
          "Only the owner of a submitted, active case can invite another participant.",
        );
      const b = await readBody(req);
      if (b.sharing_consent !== true)
        fail(400, "Explicit sharing consent is required.");
      const code = `BLG-JOIN-${randomBytes(10).toString("hex").toUpperCase()}`;
      transaction(() => {
        c.sharing_consent = true;
        save(c);
        run(
          "INSERT INTO participant_invites(hash,case_id,expires) VALUES(?,?,?)",
          digest(code),
          id,
          Date.now() + 24 * 3600000,
        );
        audit(
          id,
          user,
          "participant_invite_created",
          "Share confirmed testimony and AI observations only after reviewer-approved linking; private photos are not shared with the other participant.",
        );
      });
      return {
        handled: true,
        value: {
          code,
          expires_in_hours: 24,
          sharing:
            "Confirmed testimony and damage observations, after human-approved linking. Each original account remains separate.",
        },
      };
    }
    if (action === "joint-report" && req.method === "GET") {
      reviewer();
      return {
        handled: true,
        value: {
          ...buildPacket(c),
          review: enrich(c, user).packet_review,
          destinations,
        },
      };
    }
    if (action === "review-packet" && req.method === "POST") {
      reviewer();
      if (c.status !== "review")
        fail(409, "Start review before approving a packet.");
      const b = await readBody(req);
      if (b.confirm !== true)
        fail(
          400,
          "Confirm that you reviewed each independent account and its evidence.",
        );
      const notes = text(
        b.notes,
        "Review summary / unresolved conflicts",
        10,
        3000,
      );
      const sources = [c, ...peers(id)];
      if (
        sources.some(
          (s) =>
            !["submitted", "review"].includes(s.status) || !s.confirmed_report,
        )
      )
        fail(
          409,
          "All included accounts must be confirmed and submitted; resolve information requests first.",
        );
      transaction(() => {
        for (const item of sources) {
          if (item.status === "submitted") {
            item.status = "review";
            save(item);
          }
          audit(
            item.id,
            user,
            "joint_packet_reviewed",
            "Separate accounts and evidence reviewed. Private reviewer notes remain restricted. No official liability decision issued.",
          );
        }
        const packet = buildPacket(c);
        const snapshot = {
          ...packet.content,
          report_text: packet.report_text,
          reviewer_notes: notes,
          reviewed_at: now(),
        };
        run(
          "INSERT INTO packet_reviews VALUES(?,?,?,?,?,?) ON CONFLICT(case_id) DO UPDATE SET fingerprint=excluded.fingerprint,packet=excluded.packet,notes=excluded.notes,approved_at=excluded.approved_at,actor_id=excluded.actor_id",
          id,
          packet.fingerprint,
          JSON.stringify(snapshot),
          notes,
          now(),
          user.id,
        );
      });
      return {
        handled: true,
        value: { ok: true, review: enrich(c, user).packet_review },
      };
    }
    if (action === "dispatch" && req.method === "POST") {
      reviewer();
      const b = await readBody(req);
      if (!destinations[b.destination])
        fail(400, "Choose a configured demo destination.");
      const approved = q("SELECT * FROM packet_reviews WHERE case_id=?", id);
      const current = buildPacket(c);
      if (!approved || approved.fingerprint !== current.fingerprint)
        fail(
          409,
          "Review and approve the current packet before simulated routing. Source changes invalidate approval.",
        );
      const existing = q(
        "SELECT id,created_at FROM deliveries WHERE root_case=? AND destination=? AND fingerprint=?",
        id,
        b.destination,
        current.fingerprint,
      );
      if (existing)
        return {
          handled: true,
          value: {
            ...existing,
            mode: "simulation",
            externally_transmitted: false,
            destination_label: destinations[b.destination],
          },
        };
      const receipt = `SIM-${b.destination === "department_demo" ? "DEPT" : "INS"}-${randomBytes(5).toString("hex").toUpperCase()}`;
      transaction(() => {
        run(
          "INSERT INTO deliveries VALUES(?,?,?,?,?,?)",
          receipt,
          id,
          b.destination,
          current.fingerprint,
          approved.packet,
          now(),
        );
        for (const source of current.source_ids) {
          run("INSERT INTO delivery_members VALUES(?,?)", receipt, source);
          audit(
            source,
            user,
            "simulated_dispatch",
            `${destinations[b.destination]} | ${receipt} | Stored locally; nothing transmitted externally.`,
          );
        }
      });
      return {
        handled: true,
        value: {
          id: receipt,
          mode: "simulation",
          externally_transmitted: false,
          destination_label: destinations[b.destination],
          message:
            "Demo receiver recorded the reviewed packet locally. Nothing was sent to a real department or insurer.",
        },
      };
    }
    fail(405, "Method not allowed.");
  }
  return { enrich, connectOnCreate, handle };
}
