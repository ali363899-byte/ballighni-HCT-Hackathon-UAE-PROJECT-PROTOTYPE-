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
  node.className = "panel";
  node.innerHTML = `<div class="eyebrow">ONE INCIDENT · SEPARATE ACCOUNTS</div><h2>Participant statements</h2><p>Each person's testimony stays separate. A reviewer compares the accounts; Ballighni does not label a person as the cause or determine who is legally at fault.</p>${c.pending_connections ? '<div class="notice">A participant connection is waiting for authorized review. Private testimony is not shared before approval.</div>' : ""}${(c.shared_reports || []).map((p) => `<article class="finding"><h3>${escape(p.id)} · ${escape(p.reporter_role)}</h3><span class="badge">${escape(p.status)}</span><p class="narrative">${escape(p.testimony)}</p><small>Entered time: ${date(p.event_time)}</small></article>`).join("") || '<p class="muted">No consented, reviewer-approved participant statement is available yet.</p>'}${user.role !== "reviewer" && ["submitted", "review", "more_info"].includes(c.status) ? '<form id="participant-invite"><label class="checkbox"><input name="agree" type="checkbox" required><span>I agree to share my confirmed account and damage observations with a linked participant after a reviewer approves the link. Private photos and my support request are not shared with that participant.</span></label><button class="secondary">Create private participant invitation →</button><div id="participant-code" role="status"></div></form>' : ""}<h3>Routing history</h3><p>Demo receipts record a local simulation. Nothing is sent to a real department or insurer.</p>${(c.dispatches || []).map((d) => `<article class="finding"><span class="demo-pill">SIMULATION · NOT TRANSMITTED</span><p>${escape(d.destination_label)}</p><strong>${escape(d.id)}</strong><p class="muted">${date(d.created_at)}</p></article>`).join("") || '<p class="muted">No simulated routing has been recorded.</p>'}`;
  host.append(node);
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
          `<div class="notice"><p>Share this single-use code privately with the other participant. It expires in 24 hours.</p><label>Participant code<input readonly value="${escape(result.code)}"></label><p>The other person creates their own report and enters this code. A reviewer still has to approve the relationship.</p></div>`;
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
