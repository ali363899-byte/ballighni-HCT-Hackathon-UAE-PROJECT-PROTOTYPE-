export function mountAppeals({ c, user, post, escape, date, refresh, toast }) {
  const host = document.querySelector(".detail-grid > div");
  if (!host) return;
  const panel = document.createElement("section");
  panel.className = "panel";
  const pending = (c.appeals || []).some((a) => a.status === "pending");
  panel.innerHTML = `<h2>Appeal / request another review</h2><p>Ask the prototype reviewer to reconsider your case. This is not an official police or insurance appeal. Your original testimony and confirmed report remain unchanged.</p>${(c.appeals || []).map((a) => `<article class="finding"><strong>${escape(a.status)} · ${date(a.created_at)}</strong><p>${escape(a.reason)}</p>${a.response ? `<p><strong>Reviewer response:</strong> ${escape(a.response)}</p>` : ""}${user.role === "reviewer" && a.status === "pending" ? `<form data-appeal="${escape(a.id)}"><label>Decision<select name="decision"><option value="accepted">Accept — open another review</option><option value="rejected">Decline request</option></select></label><label>Explain the decision<textarea name="response" required minlength="10" maxlength="2000"></textarea></label><button class="secondary">Save appeal decision</button></form>` : ""}</article>`).join("")}${user.role !== "reviewer" && c.status !== "draft" && !pending ? `<form id="appeal-request"><label>Why should the case be reviewed again?<textarea name="reason" required minlength="20" maxlength="3000" placeholder="Explain what needs reconsideration. Avoid identity numbers or unnecessary personal details."></textarea></label><label class="checkbox"><input name="confirm" type="checkbox" required><span>I understand this request goes to the prototype's human reviewer.</span></label><button class="primary">Request appeal review</button></form>` : pending ? '<p class="notice">Appeal awaiting human review.</p>' : c.status === "draft" ? "<p>Submit your report first to request an appeal.</p>" : ""}`;
  host.append(panel);
  for (const form of panel.querySelectorAll("form"))
    form.onsubmit = async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        const b = Object.fromEntries(new FormData(form));
        if (form.dataset.appeal)
          await post(`/cases/${c.id}/appeal-decision`, {
            ...b,
            appeal_id: form.dataset.appeal,
          });
        else
          await post(`/cases/${c.id}/appeal-request`, {
            reason: b.reason,
            confirm: true,
          });
        toast("Appeal update saved.");
        await refresh();
      } catch (error) {
        toast(error.message, true);
        button.disabled = false;
      }
    };
}
