import { icon } from "./interface.js";
export function mountAIWorkflow({ c, api, escape, toast, user }) {
  if (!c.analysis?.workflow) return;
  const panel = document.createElement("section");
  panel.className = "panel ai-workflow-panel";
  const host = document.querySelector(".detail-grid > div");
  const confirmation = host?.querySelector("#confirm-form")?.closest(".panel");
  if (confirmation) confirmation.before(panel);
  else host?.append(panel);
  function draw(report) {
    const workflow = report.analysis.workflow;
    const stages = workflow.stages || {};
    const waiting = ["queued", "running"].includes(workflow.status);
    const cost = workflow.repair_reference;
    const cards = [
      ["detector", "01", "Visible damage", "camera"],
      ["assessment", "02", "Assessment & AED references", "spark"],
      ["testimony", "03", "Your testimony", "people"],
      ["report", "04", "Report drafting", "file"],
    ];
    panel.innerHTML = `<div class="section-head"><div><div class="eyebrow">YOUR AI ASSISTANTS</div><h2>From photos to a clearer report.</h2></div>${icon("spark")}</div><p>One damage detector and separate local language-model roles. Every output is preliminary; your original words are preserved.</p>${waiting ? '<div class="analysis-progress" role="status"><span class="loading-ring" aria-hidden="true"></span><div><strong>The AI assistants are working…</strong><p>Your saved draft is safe. Results appear here without replacing what you are typing.</p></div></div>' : ""}<div class="ai-stage-grid">${cards
      .map(([key, n, title, i]) => {
        const stage = stages[key];
        const ready =
          key === "detector"
            ? report.analysis.mode === "ai"
            : stage?.status === "complete";
        return `<article class="ai-stage"><span class="ai-stage-number">${n}</span>${icon(i)}<h3>${title}</h3><span class="badge ${ready ? "" : "draft"}">${ready ? "Ready for review" : waiting ? "Queued / working" : "Manual review needed"}</span><p>${key === "detector" ? `${report.analysis.findings.length} source-linked image observations.` : stage?.status === "complete" ? escape(key === "assessment" ? stage.overview : key === "testimony" ? stage.summaries?.[0]?.summary || "Statement organized with source quotations." : stage.overview) : "Unverified output is never substituted for a missing AI result."}</p></article>`;
      })
      .join(
        "",
      )}</div>${stages.assessment?.status === "complete" ? `<div class="notice"><strong>Visible extent: ${escape(stages.assessment.visible_extent.replaceAll("_", " "))}</strong><p>${escape(stages.assessment.warning)}</p>${stages.assessment.follow_up_questions.map((q) => `<p>○ ${escape(q)}</p>`).join("")}</div>` : ""}${cost ? `<section class="cost-reference"><div class="eyebrow">PRELIMINARY AED REPAIR REFERENCES</div><h3>Know the basis behind the number.</h3><p>${escape(cost.note)}</p>${cost.scenarios.map((s) => `<article class="cost-scenario"><div><strong>${escape(s.category)}</strong><p>${escape(s.assumption)}</p><a href="${escape(s.source_url)}" target="_blank" rel="noopener noreferrer">Published workshop pricing ↗</a></div><span>AED ${s.low.toLocaleString()}–${s.high.toLocaleString()}</span></article>`).join("") || '<div class="notice">Workshop quote required. These observations do not establish a specific repair or price.</div>'}${cost.unpriced.length ? `<p>${cost.unpriced.length} observation(s) need a vehicle-specific quote; they are excluded from the ranges.</p>` : ""}<p class="muted">${escape(cost.disclaimer)}</p></section>` : ""}${stages.report?.status === "complete" ? `<details class="ai-report-preview"><summary>Read the AI-written report draft</summary><p class="narrative">${escape(stages.report.overview)}</p><p class="narrative">${escape(stages.report.evidence_summary)}</p>${stages.report.next_steps.map((q) => `<p>○ ${escape(q)}</p>`).join("")}</details>${report.status === "draft" ? '<button type="button" class="primary" id="use-ai-draft">Use AI-written draft in my confirmation form →</button>' : ""}` : ""}<p class="tiny">AI cannot decide cause, legal fault, injuries, roadworthiness or an insurance outcome. Published prices are conditional guidance, not a quote.</p>`;
    if (waiting && report.status === "draft" && user?.role !== "reviewer") {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "text-button";
      cancel.textContent =
        "Continue with my saved draft without waiting for text AI";
      cancel.onclick = async () => {
        cancel.disabled = true;
        try {
          const updated = await api(`/cases/${report.id}/ai-cancel`, {
            method: "POST",
            body: "{}",
          });
          draw(updated);
          toast(
            "Text AI stopped. Your photo findings and editable draft remain saved.",
          );
        } catch (error) {
          toast(error.message, true);
          cancel.disabled = false;
        }
      };
      panel.append(cancel);
    }
    const use = panel.querySelector("#use-ai-draft");
    if (use)
      use.onclick = () => {
        const textarea = document.querySelector(
          '#confirm-form [name="report"]',
        );
        if (!textarea) return;
        const draft = stages.report;
        textarea.value =
          `${report.analysis.narrative}\n\nAI-WRITTEN PRELIMINARY DRAFT — CHECK BEFORE CONFIRMING\n${draft.overview}\n${draft.evidence_summary}\n\nFollow-up:\n${draft.next_steps.join("\n")}`.slice(
            0,
            6000,
          );
        textarea.focus();
        textarea.scrollIntoView({ block: "center" });
        toast(
          "AI draft added. Check every statement and edit it before confirming.",
        );
      };
  }
  draw(c);
  let lastSnapshot = JSON.stringify(c.analysis.workflow);
  if (["queued", "running"].includes(c.analysis.workflow.status)) {
    let attempts = 0;
    const poll = async () => {
      if (!panel.isConnected || ++attempts > 225) return;
      try {
        const latest = await api(`/cases/${c.id}`);
        if (!panel.isConnected) return;
        const snapshot = JSON.stringify(latest.analysis?.workflow);
        if (snapshot !== lastSnapshot) {
          draw(latest);
          lastSnapshot = snapshot;
        }
        if (!["queued", "running"].includes(latest.analysis?.workflow?.status))
          return;
      } catch {
        /* Keep the saved draft and allow the next connection attempt. */
      }
      setTimeout(poll, 4000);
    };
    setTimeout(poll, 2000);
  }
}
