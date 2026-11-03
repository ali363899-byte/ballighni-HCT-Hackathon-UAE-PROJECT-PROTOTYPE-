import { icon } from "./interface.js";
export async function mountCaseWorkflow({
  c,
  user,
  api,
  post,
  escape,
  date,
  refresh,
  toast,
}) {
  const host = document.querySelector(".detail-grid > div");
  if (!host) return;
  const node = document.createElement("section");
  node.className = "panel participant-panel";
  const active = ["submitted", "review", "more_info"].includes(c.status);
  const shared = c.shared_reports || [];
  const statement = (title, original, confirmed, reference, own = false) =>
    `<article class="testimony-card ${own ? "own" : "peer"}"><div class="eyebrow">${own ? "THIS REPORT" : "CONNECTED REPORT"}</div><h3>${escape(title)}</h3><p class="narrative">${escape(original || confirmed || "No confirmed statement is available.")}</p>${confirmed ? `<details><summary>View confirmed preliminary report</summary><p class="narrative">${escape(confirmed)}</p></details>` : ""}<small>${escape(reference)}</small></article>`;
  node.innerHTML = `<div class="section-head"><div><div class="eyebrow">CONNECTED TESTIMONIES</div><h2>Participant statements</h2></div>${icon("people")}</div><p>Different accounts stay separate. Connecting a report never changes either person's original testimony or determines fault.</p><div class="sync-status">${icon("shield")}<div><strong>${shared.length ? `${shared.length + 1} independent accounts available for review` : c.pending_connections ? "Connection requested · awaiting reviewer approval" : "Your account is saved independently"}</strong><small>Last checked ${date(new Date().toISOString())}. Private photos and support requests are not shared with the other participant.</small></div></div><div class="testimony-grid">${statement(user.role === "reviewer" ? "This participant’s account" : "Your account", c.narrative, c.confirmed_report, c.id, true)}${shared.map((p) => statement(`${p.reporter_role === "witness" ? "Witness" : "Other participant"} account`, p.original_testimony, p.testimony, p.id)).join("")}</div>${c.pending_connections ? '<div class="notice">The other statement stays private until the reviewer accepts the connection and both people consent.</div>' : ""}<button class="text-button" id="refresh-statements">Check for statement updates ↻</button>${user.role !== "reviewer" && active ? `<div class="connect-options"><h3>Connect another participant</h3><p>Both people can finish their own reports first. Exchange a private code, then ask your reviewer to approve the relationship.</p><details><summary>Create an invitation for the other person</summary><form id="participant-invite"><label class="checkbox"><input name="agree" type="checkbox" required><span>I agree to share my confirmed account and damage observations after reviewer approval. Private photos and support requests stay private.</span></label><button class="secondary">Create private participant invitation →</button><div id="participant-code" role="status"></div></form></details><details><summary>I already have the other participant’s code</summary><form id="participant-join"><label>Other participant’s private invitation code<input name="join_code" class="connection-code" required minlength="10" maxlength="40" placeholder="BLG-JOIN-…" autocomplete="off" spellcheck="false"></label><label class="checkbox"><input name="agree" type="checkbox" required><span>I agree to connect this submitted report and share my confirmed statement after reviewer approval. My original testimony stays unchanged.</span></label><button class="primary">Request connection for this report →</button><p class="form-error" role="alert" id="join-error"></p></form></details></div>` : ""}<h3>Routing history</h3><p>Demo receipts only. Nothing is sent to a real department or insurer.</p><div class="routing-grid">${(c.dispatches || []).map((d) => `<article class="finding"><span class="demo-pill">SIMULATION · NOT TRANSMITTED</span><p>${escape(d.destination_label)}</p><strong>${escape(d.id)}</strong><p class="muted">${date(d.created_at)}</p></article>`).join("") || '<p class="muted">No simulated routing has been recorded.</p>'}</div>`;
  host.prepend(node);
  node.querySelector("#refresh-statements").onclick = refresh;
  const join = node.querySelector("#participant-join");
  if (join)
    join.onsubmit = async (e) => {
      e.preventDefault();
      const button = e.submitter;
      button.disabled = true;
      node.querySelector("#join-error").textContent = "";
      try {
        await post(`/cases/${c.id}/join`, {
          join_code: new FormData(join).get("join_code").trim(),
          sharing_consent: true,
        });
        toast(
          "Connection requested. Both statements stay separate until reviewer approval.",
        );
        await refresh();
      } catch (error) {
        node.querySelector("#join-error").textContent = error.message;
        button.disabled = false;
      }
    };
  if (user.role !== "reviewer" && c.sharing_consent) {
    const stop = document.createElement("button");
    stop.className = "text-button";
    stop.textContent =
      "Stop sharing my confirmed account with linked participants";
    stop.onclick = async () => {
      stop.disabled = true;
      try {
        await api(`/cases/${c.id}/sharing`, {
          method: "PATCH",
          body: JSON.stringify({ sharing_consent: false }),
        });
        toast(
          "Future participant sharing stopped. Reviewer access and the history remain.",
        );
        await refresh();
      } catch (error) {
        toast(error.message, true);
        stop.disabled = false;
      }
    };
    node.append(stop);
  }
  const invite = node.querySelector("#participant-invite");
  if (invite)
    invite.onsubmit = async (e) => {
      e.preventDefault();
      const button = e.submitter;
      button.disabled = true;
      try {
        const result = await post(`/cases/${c.id}/invite`, {
          sharing_consent: true,
        });
        node.querySelector("#participant-code").innerHTML =
          `<div class="notice"><p>Share this single-use code privately with the other participant. It expires in 24 hours.</p><label>Participant code<input class="connection-code" readonly value="${escape(result.code)}"></label><p>The other person creates their own report and enters this code. A reviewer still has to approve the relationship.</p></div>`;
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
      }
    };
  if (user.role !== "reviewer") return;
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML =
    "<h2>Joint review & report packet</h2><p>Preparing separate statements for review…</p>";
  host.append(panel);
  try {
    const packet = await api(`/cases/${c.id}/joint-report`);
    panel.innerHTML = `<div class="eyebrow">HUMAN REVIEW REQUIRED</div><h2>Review both sides, preserve both accounts.</h2><label>Preliminary joint report<textarea readonly class="joint-report-text">${escape(packet.report_text)}</textarea></label><div class="notice warning">This is a prototype report. Cause, liability, injuries and roadworthiness remain undetermined. Differences between accounts must be reviewed, not silently resolved.</div>${packet.review ? `<div class="notice ${packet.review.stale ? "warning" : ""}">${packet.review.stale ? "Source information changed. Review the packet again before routing." : `Current packet reviewed: ${date(packet.review.approved_at)}`}</div>` : ""}${c.status === "review" ? '<form id="packet-review"><label>Review summary / unresolved disagreements<textarea name="notes" required minlength="10" maxlength="3000" placeholder="Record what is supported, what conflicts and what remains uncertain."></textarea></label><label class="checkbox"><input type="checkbox" required><span>I checked each included statement and its evidence, and I am not issuing an official liability or insurance decision.</span></label><button class="primary">Approve this prototype packet →</button></form>' : '<p class="muted">Start review using the review action panel. Information requests must be resolved before packet approval.</p>'}<div class="button-row"><button id="download-joint" class="secondary">Download report text ↓</button><button id="route-department" class="secondary" ${!packet.review || packet.review.stale ? "disabled" : ""}>Simulate department intake</button><button id="route-insurance" class="secondary" ${!packet.review || packet.review.stale ? "disabled" : ""}>Simulate insurance intake</button></div><p class="muted">The demo receivers save a receipt locally. No real agency, insurer, email or external system is contacted.</p>`;
    const compare = document.createElement("section");
    compare.className = "comparison-ai";
    panel.querySelector(".joint-report-text").closest("label").before(compare);
    const drawComparison = (data) => {
      const review = data.ai_comparison;
      compare.innerHTML = `<div class="eyebrow">AI TESTIMONY REVIEW</div><h3>Compare the accounts, without choosing a side.</h3><p>Only the authorized reviewer sees this comparison. Exact source quotations are checked against each original account.</p>${review?.status === "queued" ? '<div class="analysis-progress" role="status"><span class="loading-ring" aria-hidden="true"></span><strong>Comparison is queued / running…</strong></div>' : review?.status === "complete" ? `<div class="testimony-grid">${review.result.summaries.map((s) => `<article class="testimony-card"><small>${escape(s.source_id)}</small><p>${escape(s.summary)}</p><blockquote>${escape(s.quote)}</blockquote></article>`).join("")}</div>${review.result.differences.map((d) => `<article class="finding"><strong>Question for human review</strong><p>${escape(d.question)}</p><small>${escape(d.source_a)}</small><blockquote>${escape(d.quote_a)}</blockquote><small>${escape(d.source_b)}</small><blockquote>${escape(d.quote_b)}</blockquote></article>`).join("") || "<p>No supported cross-account difference was identified. This does not prove agreement.</p>"}<div class="notice warning">${escape(review.result.warning)}</div>` : review?.status === "unavailable" ? `<div class="notice warning">AI comparison unavailable: ${escape(review.message)}. The original statements remain available for manual review.</div>` : ""}<button type="button" class="secondary" id="compare-ai" ${review?.status === "queued" || data.content.statements.length < 2 ? "disabled" : ""}>Compare separate testimonies with AI ↗</button>`;
      compare.querySelector("#compare-ai").onclick = async (event) => {
        event.target.disabled = true;
        try {
          await post(`/cases/${c.id}/ai-compare`);
          await refresh();
        } catch (error) {
          toast(error.message, true);
          event.target.disabled = false;
        }
      };
    };
    drawComparison(packet);
    if (packet.ai_comparison?.status === "queued") {
      const check = async () => {
        if (!compare.isConnected) return;
        try {
          const latest = await api(`/cases/${c.id}/joint-report`);
          if (!compare.isConnected) return;
          if (latest.ai_comparison?.status !== packet.ai_comparison?.status)
            drawComparison(latest);
          if (latest.ai_comparison?.status !== "queued") {
            panel.querySelector(".joint-report-text").value =
              latest.report_text;
            if (!latest.review || latest.review.stale) {
              panel.querySelector("#route-department").disabled = true;
              panel.querySelector("#route-insurance").disabled = true;
            }
            return;
          }
        } catch {}
        setTimeout(check, 4000);
      };
      setTimeout(check, 2000);
    }
    const form = panel.querySelector("#packet-review");
    if (form)
      form.onsubmit = async (e) => {
        e.preventDefault();
        e.submitter.disabled = true;
        try {
          await post(`/cases/${c.id}/review-packet`, {
            notes: new FormData(e.currentTarget).get("notes"),
            confirm: true,
          });
          await refresh();
        } catch (error) {
          toast(error.message, true);
          e.submitter.disabled = false;
        }
      };
    for (const [id, destination] of [
      ["route-department", "department_demo"],
      ["route-insurance", "insurer_demo"],
    ])
      panel.querySelector("#" + id).onclick = async (e) => {
        e.target.disabled = true;
        try {
          const receipt = await post(`/cases/${c.id}/dispatch`, {
            destination,
          });
          toast(
            `Simulation receipt ${receipt.id}. Nothing transmitted externally.`,
          );
          await refresh();
        } catch (error) {
          toast(error.message, true);
          e.target.disabled = false;
        }
      };
    panel.querySelector("#download-joint").onclick = () => {
      const link = document.createElement("a");
      const url = URL.createObjectURL(
        new Blob([packet.report_text], { type: "text/plain;charset=utf-8" }),
      );
      link.href = url;
      link.download = `${c.id}-joint-report.txt`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  } catch (error) {
    panel.innerHTML = `<h2>Joint packet unavailable</h2><p>${escape(error.message)}</p>`;
  }
}
