import {
  applyAccessibility,
  accessibilityPage,
  communicationCard,
} from "./accessibility.js";
import { mountCaseWorkflow } from "./case-workflow.js";
import { setupLanguage } from "./language.js";
applyAccessibility();
setupLanguage();
const $ = (s) => document.querySelector(s);
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (value) =>
  new Date(value).toLocaleString("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const label = (value) =>
  ({
    draft: "Draft",
    submitted: "Submitted",
    review: "Under review",
    more_info: "More information",
    closed: "Closed",
  })[value] || value.replaceAll("_", " ");
let user = null,
  token = sessionStorage.getItem("ballighni-token") || "",
  current = null,
  register = false,
  pendingRoute = null,
  imageUrls = [];
let apiUrl =
  localStorage.getItem("ballighni-api") ||
  window.BALLIGHNI_CONFIG?.apiUrl ||
  "";
let workspaceConnected = false;
async function refreshConnection() {
  const status = $("#connection-status");
  if (!status) return;
  try {
    const health = await api("/health", { signal: AbortSignal.timeout(6000) });
    workspaceConnected = true;
    status.textContent = health.ai_available
      ? "Connected · Damage AI ready"
      : "Connected · Manual draft available" +
        (health.ai_provider === "damage"
          ? " · AI starting or unavailable"
          : "");
    $("#connection-bar").classList.remove("disconnected");
    if (token && !user) {
      try {
        user = await api("/me");
        updateAccount();
      } catch {}
    }
  } catch {
    workspaceConnected = false;
    status.textContent = window.Capacitor?.isNativePlatform?.()
      ? "Connect a shared HTTPS backend to use live reports."
      : "Backend not connected · start the server or check the saved address.";
    $("#connection-bar").classList.add("disconnected");
  }
}
const demo = {
  id: "BLG-DEMO-0042",
  status: "review",
  reporter_role: "driver",
  location: "Al Jurf, Ajman — synthetic example",
  event_time: "2026-11-02T08:30:00Z",
  created_at: "2026-11-02T08:35:00Z",
  narrative:
    "Synthetic scenario: two vehicles were involved in a minor collision. This illustration does not contain real evidence.",
  confirmed_report:
    "Synthetic example only. The driver describes rear-bumper damage and two vehicles at the scene. No real image has been analyzed. Cause, fault, injury status and roadworthiness remain undetermined.",
  evidence: [],
  analysis: {
    mode: "manual",
    model: null,
    findings: [],
    missing: ["No real photographs supplied."],
    limitation:
      "This is a read-only synthetic demonstration. No real incident has been submitted.",
  },
  updates: [
    {
      action: "submitted",
      reason: "Synthetic driver report confirmed.",
      created_at: "2026-11-02T08:35:00Z",
    },
    {
      action: "status_review",
      reason: "Synthetic reviewer started reviewing the case.",
      created_at: "2026-11-02T08:40:00Z",
    },
  ],
  matches: [],
};
async function api(path, options = {}) {
  if (!apiUrl && window.Capacitor?.isNativePlatform?.())
    throw new Error(
      "Connect this Android app to your shared backend in Connection settings. The phone cannot use the computer’s localhost address.",
    );
  let response;
  try {
    response = await fetch(`${apiUrl}/api${path}`, {
      ...options,
      signal:
        options.signal ||
        AbortSignal.timeout(path.endsWith("/analyze") ? 200000 : 20000),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the backend. Check Connection settings or ask your team to start the server.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The backend is unavailable at this address. Check Connection settings.",
    );
  }
  if (!response.ok) {
    if (response.status === 401) {
      user = null;
      token = "";
      sessionStorage.removeItem("ballighni-token");
      updateAccount();
    }
    throw new Error(result.error || "Request failed.");
  }
  return result;
}
const post = (path, data = {}) =>
  api(path, { method: "POST", body: JSON.stringify(data) });
let toastTimer;
function toast(message, error = false) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").className = error ? "error" : "";
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 6500);
}
function updateAccount() {
  $("#account-button").textContent = user
    ? `${user.username} · Sign out`
    : "Sign in ↗";
}
function showAuth(route) {
  pendingRoute = route || null;
  $("#auth-error").textContent = "";
  $("#auth-dialog").showModal();
}
function requireUser(route) {
  if (user) return true;
  showAuth(route);
  return false;
}
function badge(status) {
  return `<span class="badge ${escape(status)}">${escape(label(status))}</span>`;
}
const safety = `<div class="safety-banner emergency-guidance" role="note"><span class="safety-icon" aria-hidden="true">△</span><div><strong>Safety is the main priority.</strong><p>If anyone has been injured, a fire has occurred, or there is immediate danger, urgently call the official emergency channels. Do not wait for a report.</p><div class="emergency-links"><a href="tel:999">Police · 999</a><a href="tel:997">Fire / Civil Defence · 997</a><a href="tel:998">Ambulance · 998</a></div></div></div>`;
function heading(title, description, eyebrow = "YOUR REPORTING SPACE") {
  return `<div class="topline"><div class="page-intro"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div></div>`;
}
function home() {
  $("#main").innerHTML =
    `<div class="topline"><div><div class="eyebrow">ONE CONNECTED INCIDENT JOURNEY</div><h1>A little clarity, when it matters.</h1><p>Capture the facts. Bring the evidence together. Know what comes next.</p></div><span class="today">${new Date().toLocaleDateString("en-AE", { weekday: "long", month: "short", day: "numeric" })}</span></div>
  <section class="hero"><div class="hero-copy"><div class="eyebrow">LESS FRICTION. MORE CLARITY.</div><h2>One report.<br>A clearer way<br><em>forward.</em></h2><p>From your first photo to human review, keep every part of the story in one place.</p><a class="primary" href="#report">Report an incident <span>↗</span></a><div class="hero-foot">◇ &nbsp; Your evidence. Your confirmation. Human oversight.</div></div><img src="scene.svg" alt="Illustration of a vehicle with an evidence review marker; not an actual damage analysis"></section>
  <div class="section-head"><h2>How can we help?</h2><span>Choose the path that fits your situation</span></div><section class="action-grid" aria-label="Reporting options"><a class="action-card" href="#report"><span class="card-icon">＋</span><span class="card-arrow">↗</span><h3>I was involved</h3><p>Start a guided incident report and organize your evidence.</p></a><a class="action-card" href="#witness"><span class="card-icon">◎</span><span class="card-arrow">↗</span><h3>I witnessed an incident</h3><p>Add your perspective safely. Photos are always optional.</p></a><a class="action-card" href="#cases"><span class="card-icon">▤</span><span class="card-arrow">↗</span><h3>Follow my case</h3><p>See your report, review requests and the latest updates.</p></a></section>
  <div class="lower-grid"><section class="panel"><h3>A simpler journey, from the start.</h3><div class="steps-row"><div><span class="step-num">01</span><h4>Capture once</h4><p>Share the details and permitted evidence.</p></div><div><span class="step-num">02</span><h4>Review your draft</h4><p>Check what is known and what is missing.</p></div><div><span class="step-num">03</span><h4>Stay informed</h4><p>Follow human review in one timeline.</p></div></div></section><section class="panel trust-panel"><div class="eyebrow">BUILT AROUND TRUST</div><h3>AI assists.<br>People decide.</h3><p>Every finding stays linked to its source. Final decisions always remain with people.</p><p class="tiny"><a href="#demo">Explore a synthetic example ↗</a></p></section></div>${safety}`;
}
function report(role = "driver") {
  $("#main").innerHTML =
    `<div class="wizard">${heading(role === "witness" ? "Your perspective matters." : "Let’s start with safety.", "A few clear steps to organize what happened.", role === "witness" ? "WITNESS REPORT" : "DRIVER REPORT")}<div class="progress"><span class="current">01 / Safety</span><span>02 / Details & evidence</span><span>03 / Review & confirm</span></div><section class="panel"><h2>Is anyone injured or in immediate danger?</h2><p>Ballighni is a prototype for routine evidence reporting. Never approach danger, photograph victims, or delay urgent help.</p><div class="button-row"><button class="danger-button" id="danger-yes">Yes / I’m not sure</button><button class="secondary" id="safe-no">No immediate danger →</button></div><div id="safety-next"></div></section>${safety}</div>`;
  const stationary = document.createElement("label");
  stationary.className = "checkbox stationary-confirmation";
  stationary.innerHTML =
    '<input id="stationary" type="checkbox"><span>I am safely stopped and can report without distraction. I will not use this app while driving.</span>';
  $("#safe-no").parentElement.before(stationary);
  $("#danger-yes").onclick = () => {
    $("#safety-next").innerHTML =
      `<div class="emergency"><h2>Pause this report. Get urgent help.</h2><p>Move to safety if possible and follow official instructions. Do not use this routine case queue for an emergency.</p><a class="danger-button" href="tel:999">Call police · 999</a><a class="danger-button" href="tel:997">Call Fire / Civil Defence · 997</a><a class="danger-button" href="tel:998">Call ambulance · 998</a></div>`;
  };
  $("#safe-no").onclick = () => {
    if (!$("#stationary").checked) {
      toast("Please stop safely before using the reporting flow.", true);
      $("#stationary").focus();
      return;
    }
    if (requireUser(role === "witness" ? "witness" : "report")) capture(role);
  };
}
function capture(role) {
  $("#main").innerHTML =
    `<div class="wizard">${heading("Tell us what you observed.", "Record only what you know. Avoid names, number plates, victim images and unnecessary personal details.", role === "witness" ? "WITNESS REPORT" : "DRIVER REPORT")}<div class="progress"><span>01 / Safety ✓</span><span class="current">02 / Details & evidence</span><span>03 / Review & confirm</span></div><form id="capture-form" class="panel"><div class="form-grid"><label>Approximate location<input name="location" required minlength="3" maxlength="200" placeholder="e.g. Al Jurf, Ajman"></label><label>When did it happen?<input name="event_time" type="datetime-local" required></label><label class="wide">What happened?<textarea name="narrative" minlength="10" maxlength="3000" required placeholder="Describe what you directly observed. Distinguish facts from assumptions."></textarea></label></div><div class="upload-zone"><label>Photos <small>Optional · JPEG, PNG or WebP · up to 6 files, 8 MB each</small><input type="file" id="photos" accept="image/jpeg,image/png,image/webp" multiple></label><p>Use a safe wide view and an additional damage angle. Do not include people, plates or documents. Embedded metadata is removed by the server.</p><div id="photo-count" class="muted"></div></div><label class="checkbox"><input type="checkbox" name="consent" required><span>I have permission to submit this information and any photos. I understand this is a hackathon prototype, and agree to storage and authorized human review.</span></label><div class="form-error" id="capture-error" role="alert"></div><div class="button-row"><button class="primary" type="submit">Save & prepare draft →</button><a class="text-button" href="#home">Cancel</a></div></form></div>`;
  const extra = document.createElement("section");
  extra.className = "capture-support";
  extra.innerHTML = `<h3>Support and connected accounts</h3><label>Your involvement <small>Self-described only; this is not a legal determination.</small><select name="self_reported_position"><option value="${role === "witness" ? "witness" : "participant"}">${role === "witness" ? "Witness" : "Involved participant"}</option>${role === "witness" ? "" : '<option value="affected_participant">I consider myself an affected participant</option>'}</select></label><label>Communication / access support request <small>Optional. Visible to authorized reviewers. Do not enter a diagnosis or unnecessary personal details.</small><textarea name="support_request" maxlength="500" placeholder="For example: Please give me extra time. I prefer written communication."></textarea></label><button class="text-button" id="use-support-card" type="button">Use my saved communication card</button><label>Other participant’s private invitation code <small>Optional. Each person still submits a separate testimony.</small><input name="join_code" maxlength="40" placeholder="BLG-JOIN-…" autocomplete="off"></label><label class="checkbox"><input name="sharing_consent" type="checkbox"><span>I agree to share my confirmed account and damage observations with the connected participant after reviewer approval. Private photos and support requests are not shared with that person.</span></label>`;
  $("#capture-form .upload-zone").before(extra);
  $("#use-support-card").onclick = () => {
    $('[name="support_request"]').value = communicationCard();
    if (!communicationCard())
      toast("Save a communication card in Accessibility & support first.");
  };
  const input = $('[name="event_time"]');
  input.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  $("#photos").onchange = () => {
    $("#photo-count").textContent =
      `${$("#photos").files.length} photo(s) selected`;
  };
  $("#capture-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    $("#capture-error").textContent = "";
    try {
      const files = [...$("#photos").files];
      if (files.length > 6 || files.some((f) => f.size > 8 * 1024 * 1024))
        throw new Error("Choose up to six photos, each no larger than 8 MB.");
      const values = Object.fromEntries(new FormData(form));
      if (values.join_code && !form.elements.sharing_consent.checked)
        throw new Error(
          "Agree to share your confirmed account before using a participant invitation.",
        );
      current = null;
      current = await post("/cases", {
        ...values,
        event_time: new Date(values.event_time).toISOString(),
        reporter_role: role,
        safe: true,
        consent: true,
        sharing_consent: form.elements.sharing_consent.checked,
      });
      button.textContent = "Uploading evidence…";
      for (const file of files) await upload(current.id, file);
      button.textContent = "Preparing report…";
      current = await post(`/cases/${current.id}/analyze`);
      location.hash = `case/${current.id}`;
    } catch (error) {
      $("#capture-error").textContent =
        error.message +
        (current?.status === "draft"
          ? ` Your saved draft is in My cases (${current.id}).`
          : "");
      button.disabled = false;
      button.textContent = "Save & prepare draft →";
    }
  };
}
async function upload(id, file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return post(`/cases/${id}/evidence`, { base64, consent: true });
}
async function cases(reviewer = false) {
  if (!requireUser(reviewer ? "review" : "cases")) return;
  if (reviewer && user.role !== "reviewer") {
    $("#main").innerHTML = heading(
      "Reviewer access required.",
      "Create a reviewer account using the private setup code from the backend owner. Citizen accounts cannot open the review queue.",
    );
    return;
  }
  const list = await api("/cases");
  $("#main").innerHTML =
    `${heading(reviewer ? "The review desk." : "Your reports, in one place.", reviewer ? "Check the evidence, review possible matches and record the next step." : "Every draft, request and update stays with your case.", reviewer ? "HUMAN REVIEW" : "CASE TRACKING")}<div class="metric-row"><div class="metric"><strong>${list.length}</strong><span>${reviewer ? "CASES IN QUEUE" : "YOUR CASES"}</span></div><div class="metric"><strong>${list.filter((c) => c.status === "more_info").length}</strong><span>INFORMATION REQUESTED</span></div><div class="metric"><strong>${list.filter((c) => c.status === "closed").length}</strong><span>CLOSED</span></div></div><label class="search">Find a case<input id="case-search" placeholder="Search reference or location"></label><div class="case-list" id="case-list"></div>`;
  const draw = () => {
    const term = $("#case-search").value.toLowerCase();
    const filtered = list.filter((c) =>
      (c.id + " " + c.location).toLowerCase().includes(term),
    );
    $("#case-list").innerHTML = filtered.length
      ? filtered
          .map(
            (c) =>
              `<a class="case-row" href="#case/${c.id}"><div><strong>${escape(c.id)}</strong><small>${escape(c.reporter_role)} report · ${date(c.created_at)}</small></div><span class="location"><strong>${escape(c.location)}</strong></span>${badge(c.status)}</a>`,
          )
          .join("")
      : `<div class="empty"><h2>${list.length ? "No matching cases." : "A clear space for your next step."}</h2><p>${list.length ? "Try another reference or location." : reviewer ? "Submitted reports will appear here." : "Start a driver or witness report to see its timeline here."}</p><a href="#report" class="primary">Start a report →</a></div>`;
  };
  draw();
  $("#case-search").oninput = draw;
}
async function detail(id, synthetic = false) {
  if (!synthetic && !requireUser(`case/${id}`)) return;
  const c = synthetic ? structuredClone(demo) : await api(`/cases/${id}`);
  current = c;
  const reviewer = !synthetic && user?.role === "reviewer";
  $("#main").innerHTML =
    `<div class="topline"><div><div class="eyebrow">${synthetic ? "SYNTHETIC EXAMPLE · READ ONLY" : "CASE FILE"}</div><h1>${escape(c.id)}</h1><p>${escape(c.location)}</p></div>${badge(c.status)}</div>${synthetic ? '<div class="notice warning">This example contains fictional text only. No live AI was run and no official report has been created. <a href="#report">Start your own report →</a></div>' : ""}<div class="detail-grid"><div><section class="panel"><dl class="meta"><div><dt>REPORT TYPE</dt><dd>${escape(c.reporter_role)}</dd></div><div><dt>INCIDENT TIME</dt><dd>${date(c.event_time)}</dd></div><div><dt>RECEIVED</dt><dd>${date(c.created_at)}</dd></div></dl><h3>Reporter’s account</h3><p class="narrative">${escape(c.narrative)}</p><h3>Evidence</h3><div id="evidence" class="evidence-grid"></div>${!c.evidence.length ? '<p class="muted">No photos attached. Visual damage cannot be established.</p>' : ""}${!synthetic && ((c.status === "draft" && !reviewer) || (c.status === "more_info" && !reviewer)) ? '<label class="upload-zone">Add permitted evidence<input type="file" id="additional-photo" accept="image/jpeg,image/png,image/webp"></label>' : ""}</section><section class="panel"><div class="section-head"><h3>Evidence findings</h3><span>${c.analysis?.mode === "ai" ? "AI observations · unverified" : "Manual drafting mode"}</span></div>${c.analysis?.warning ? `<div class="notice warning">${escape(c.analysis.warning)}</div>` : ""}${(c.analysis?.findings || []).map((f) => `<article class="finding"><p>${escape(f.observation)}</p><small>Source: ${escape(f.source_id)}${f.confidence !== undefined ? ` · Model score: ${Math.round(f.confidence * 100)}% (not calibrated certainty)` : ""}</small><p class="muted">${escape(f.uncertainty)}</p></article>`).join("") || "<p>No automated damage observation is available. This does not mean the vehicle is undamaged.</p>"}${c.analysis?.model ? `<p class="muted">Model: ${escape(c.analysis.model)}</p>` : ""}<div class="notice">${escape(c.analysis?.limitation || "Prepare a draft to organize known and missing information. AI does not decide fault, injuries or roadworthiness.")}</div>${(c.analysis?.missing || []).map((m) => `<p class="muted">○ ${escape(m)}</p>`).join("")}${!synthetic && c.status === "draft" && !reviewer ? '<button class="secondary" id="analyze">Prepare / retry analysis ↗</button>' : ""}</section><section class="panel"><h3>${c.status === "draft" ? "Check and confirm your draft" : "Confirmed report"}</h3>${c.status === "draft" && !synthetic && !reviewer ? `<form id="confirm-form"><label>Edit the report before submitting<textarea name="report" required minlength="10" maxlength="6000">${escape(c.analysis?.narrative || "")}</textarea></label><label class="checkbox"><input type="checkbox" required><span>I checked this draft and understand that it is a preliminary account for human review.</span></label><button class="primary" ${!c.analysis ? "disabled" : ""}>Confirm & submit →</button></form>` : `<p class="narrative">${escape(c.confirmed_report || c.analysis?.narrative || "Draft has not been confirmed.")}</p>`}</section>${reviewer ? `<section class="panel"><h3>Possible related reports</h3><p>Suggestions use entered location and time. Accepting a link preserves both reports; it does not merge accounts or determine fault.</p>${(c.matches || []).map((m) => `<div class="finding"><a href="#case/${m.id}"><strong>${escape(m.id)} ↗</strong></a><p>${escape(m.reason)}</p><span class="badge">${escape(m.decision)}</span>${m.decision === "pending" ? `<div class="button-row"><button class="secondary link-action" data-other="${m.id}" data-decision="accepted">Accept link</button><button class="secondary link-action" data-other="${m.id}" data-decision="rejected">Reject link</button></div>` : ""}</div>`).join("") || '<p class="muted">No same-location reports within 30 minutes were found.</p>'}<label>Reason for a match decision<input id="link-reason" minlength="5" maxlength="2000" placeholder="Record why these accounts may or may not relate"></label></section>` : ""}</div><aside><section class="panel"><h3>Case timeline</h3><ol class="timeline">${c.updates.map((u) => `<li><strong>${escape(label(u.action))}</strong><p>${escape(u.reason)}</p><time>${date(u.created_at)}</time></li>`).join("")}</ol>${!synthetic ? '<button class="text-button" id="refresh-case">Refresh updates ↻</button>' : ""}</section>${reviewer && c.status !== "closed" ? `<section class="panel"><h3>Next review action</h3><form id="status-form"><label>Next status<select name="status" required>${({ submitted: ["review", "more_info"], review: ["more_info", "closed"], more_info: ["review"] }[c.status] || []).map((s) => `<option value="${s}">${label(s)}</option>`).join("")}</select></label><label>Reason / request<textarea name="reason" required minlength="5" maxlength="2000" placeholder="Explain the action. Requests are visible to the reporter."></textarea></label><button class="primary">Save review action →</button></form></section>` : ""}${!synthetic && !reviewer && c.status === "more_info" ? '<section class="panel"><h3>Respond to the request</h3><p>Read the reviewer’s request in your timeline. Add photos if needed, then reply.</p><form id="response-form"><label>Your response<textarea name="message" required minlength="5" maxlength="2000"></textarea></label><button class="primary">Send for review →</button></form></section>' : ""}<section class="panel trust-panel"><h3>Keep a copy.</h3><p>Your case export includes the structured report and timeline. Images remain in the protected case.</p><button class="secondary" id="export-case">Export case JSON ↓</button></section></aside></div>${safety}`;
  for (const url of imageUrls) URL.revokeObjectURL(url);
  imageUrls = [];
  const findingsPanel = [...document.querySelectorAll(".panel")].find(
    (p) => p.querySelector("h3")?.textContent === "Evidence findings",
  );
  if (findingsPanel) {
    const notes = document.createElement("div");
    notes.innerHTML = (c.review_corrections || [])
      .map(
        (n) =>
          `<article class="finding"><strong>Human review note</strong><p>${escape(n.correction)}</p><small>Source: ${escape(n.source_id)} · ${date(n.created_at)}</small></article>`,
      )
      .join("");
    if (
      reviewer &&
      ["review", "more_info"].includes(c.status) &&
      c.evidence.length
    )
      notes.innerHTML += `<form id="correction-form"><h3>Correct or qualify a finding</h3><label>Evidence source<select name="source_id">${c.evidence.map((e) => `<option value="${escape(e.id)}">${escape(e.id)}</option>`).join("")}</select></label><label>Human review note<textarea name="correction" required minlength="5" maxlength="2000" placeholder="Explain what the original evidence supports or does not support."></textarea></label><button class="secondary">Save human correction →</button></form>`;
    findingsPanel.append(notes);
  }
  if (!synthetic)
    for (const e of c.evidence) {
      const response = await fetch(
        `${apiUrl}/api/cases/${id}/evidence/${e.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) continue;
      const src = URL.createObjectURL(await response.blob());
      imageUrls.push(src);
      const fig = document.createElement("figure");
      fig.className = "evidence-card";
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Evidence photo ${e.id}`;
      const caption = document.createElement("figcaption");
      caption.textContent = e.id;
      const frame = document.createElement("div");
      frame.className = "photo-frame";
      frame.append(img);
      for (const finding of c.analysis?.findings || []) {
        if (finding.source_id !== e.id || !finding.box) continue;
        const [x1, y1, x2, y2] = finding.box;
        const mark = document.createElement("span");
        mark.className = "damage-box";
        mark.style.left = `${x1 * 100}%`;
        mark.style.top = `${y1 * 100}%`;
        mark.style.width = `${(x2 - x1) * 100}%`;
        mark.style.height = `${(y2 - y1) * 100}%`;
        mark.title = finding.observation;
        frame.append(mark);
      }
      fig.append(frame, caption);
      if (e.quality?.flags?.length) {
        const quality = document.createElement("p");
        quality.className = "image-quality-note";
        quality.textContent =
          "Photo guidance (heuristic): " + e.quality.flags.join(" ");
        fig.append(quality);
      }
      $("#evidence")?.append(fig);
    }
  const act = async (button, fn) => {
    button.disabled = true;
    try {
      await fn();
      await detail(id);
    } catch (e) {
      toast(e.message, true);
      button.disabled = false;
    }
  };
  if (!synthetic)
    await mountCaseWorkflow({
      c,
      user,
      api,
      post,
      escape,
      date,
      refresh: () => detail(id),
      toast,
    });
  if ($("#correction-form"))
    $("#correction-form").onsubmit = (e) => {
      e.preventDefault();
      act(e.submitter, () =>
        api(`/cases/${id}/findings`, {
          method: "PATCH",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        }),
      );
    };
  if ($("#analyze"))
    $("#analyze").onclick = (e) =>
      act(e.currentTarget, () => post(`/cases/${id}/analyze`));
  if ($("#confirm-form"))
    $("#confirm-form").onsubmit = (e) => {
      e.preventDefault();
      act(e.submitter, () =>
        post(`/cases/${id}/submit`, {
          confirm: true,
          report: new FormData(e.currentTarget).get("report"),
        }),
      );
    };
  if ($("#status-form"))
    $("#status-form").onsubmit = (e) => {
      e.preventDefault();
      act(e.submitter, () =>
        api(`/cases/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        }),
      );
    };
  if ($("#response-form"))
    $("#response-form").onsubmit = (e) => {
      e.preventDefault();
      act(e.submitter, () =>
        post(
          `/cases/${id}/respond`,
          Object.fromEntries(new FormData(e.currentTarget)),
        ),
      );
    };
  if ($("#additional-photo"))
    $("#additional-photo").onchange = (e) => {
      if (e.target.files[0]) act(e.target, () => upload(id, e.target.files[0]));
    };
  document.querySelectorAll(".link-action").forEach(
    (button) =>
      (button.onclick = () =>
        act(button, () =>
          post(`/cases/${id}/link`, {
            other_id: button.dataset.other,
            decision: button.dataset.decision,
            reason: $("#link-reason").value,
          }),
        )),
  );
  if ($("#refresh-case"))
    $("#refresh-case").onclick = () =>
      detail(id).catch((e) => toast(e.message, true));
  $("#export-case").onclick = () => {
    const blob = new Blob([JSON.stringify(c, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
function settings() {
  $("#main").innerHTML =
    `<div class="wizard">${heading("Connect your workspace.", "Use the same backend for the website and Android app.")}<form id="settings-form" class="panel"><label>Backend URL <small>Leave empty when this website is served by your backend. Android requires your hosted HTTPS backend.</small><input type="url" id="api-url" value="${escape(apiUrl)}" placeholder="https://your-backend.example.com"></label><p>Only connect to a server you trust. Your account credentials and permitted evidence will be sent to this address. Changing servers signs you out.</p><div class="button-row"><button class="primary">Save connection →</button><button type="button" class="secondary" id="test-connection">Test connection</button></div><div id="connection-result" class="notice" hidden></div></form></div>`;
  $("#settings-form").onsubmit = (e) => {
    e.preventDefault();
    const value = $("#api-url").value.trim().replace(/\/$/, "");
    if (value) {
      const parsed = new URL(value);
      if (
        window.Capacitor?.isNativePlatform?.() &&
        ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
      ) {
        toast(
          "On Android, localhost is the phone. Use the shared HTTPS backend address.",
          true,
        );
        return;
      }
      if (
        parsed.protocol !== "https:" &&
        !["localhost", "127.0.0.1"].includes(parsed.hostname)
      ) {
        toast("Use HTTPS for a hosted backend.", true);
        return;
      }
      if (parsed.username || parsed.password || parsed.search || parsed.hash) {
        toast(
          "Enter a plain backend URL without credentials or query parameters.",
          true,
        );
        return;
      }
    }
    apiUrl = value || window.BALLIGHNI_CONFIG?.apiUrl || "";
    localStorage.setItem("ballighni-api", value);
    token = "";
    user = null;
    sessionStorage.removeItem("ballighni-token");
    updateAccount();
    toast("Connection saved. Sign in to this backend.");
    refreshConnection();
  };
  $("#test-connection").onclick = async () => {
    const result = $("#connection-result");
    result.hidden = false;
    try {
      const candidate =
        $("#api-url").value.trim().replace(/\/$/, "") ||
        window.BALLIGHNI_CONFIG?.apiUrl ||
        "";
      if (!$("#settings-form").reportValidity()) return;
      if (!candidate && window.Capacitor?.isNativePlatform?.())
        throw new Error(
          "Enter the shared backend HTTPS address. The APK does not contain the reporting server.",
        );
      if (candidate) {
        const parsed = new URL(candidate);
        if (parsed.username || parsed.password || parsed.search || parsed.hash)
          throw new Error(
            "Use a plain backend URL without credentials or query parameters.",
          );
        if (
          parsed.protocol !== "https:" &&
          !["localhost", "127.0.0.1"].includes(parsed.hostname)
        )
          throw new Error("Remote backends must use HTTPS.");
        if (
          window.Capacitor?.isNativePlatform?.() &&
          ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
        )
          throw new Error(
            "The computer’s localhost cannot be reached from the phone.",
          );
      }
      const response = await fetch(`${candidate}/api/health`, {
        signal: AbortSignal.timeout(8000),
      });
      const h = await response.json();
      if (!response.ok || h.app !== "Ballighni")
        throw new Error("This address is not a healthy Ballighni backend.");
      result.textContent = `Connection verified. ${h.ai_available ? "Damage AI is ready." : "Manual reporting is available; AI is not ready."} Save this address to use it.`;
    } catch (e) {
      result.textContent = e.message;
    }
  };
}
function about() {
  $("#main").innerHTML =
    `<div class="prose">${heading("One connected case.", "A practical prototype by Fantastic Four, built for a clearer evidence-to-review journey.", "ABOUT BALLIGHNI")}<section class="panel"><h2>Capture once. Review clearly.</h2><p>Ballighni helps drivers and witnesses organize incident details, permitted photographs and preliminary findings. A reviewer checks the original evidence, requests missing information, reviews possible related reports and updates the case timeline.</p><h2>AI is an assistant.</h2><p>Automated observations are preliminary, source-linked and open to correction. The app cannot decide liability, diagnose injuries, establish accident cause or certify a vehicle as safe to drive. A missing detection does not prove an absence of damage.</p><h2>Your information</h2><p>Only your account and authorized team reviewers can access your cases. Evidence is stored on the connected backend, with image metadata removed. Use synthetic or explicitly permitted data for this prototype. The backend owner controls data retention; accounts and reports are not automatically deleted in this version.</p><h2>Prototype boundaries</h2><p>This is not an official government, police, emergency or insurance reporting service. Status updates and case references belong to this prototype. There is no live dispatch or official report issuance.</p><a class="primary" href="#demo">Explore the synthetic case →</a></section>${safety}</div>`;
}
async function route() {
  const hash = location.hash.slice(1) || "home";
  const section = hash.split("/")[0];
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) => a.classList.toggle("active", a.dataset.nav === section));
  $("#page-title").textContent =
    {
      home: "Overview",
      report: "New report",
      witness: "Witness report",
      cases: "My cases",
      review: "Review desk",
      case: "Case file",
      about: "About",
      settings: "Connection",
      demo: "Synthetic example",
      accessibility: "Accessibility & support",
    }[section] || "Overview";
  $("#main").innerHTML =
    '<div class="loading" role="status">Preparing your workspace…</div>';
  try {
    if (section === "home") home();
    else if (["report", "witness"].includes(section))
      report(section === "witness" ? "witness" : "driver");
    else if (section === "cases" || section === "review")
      await cases(section === "review");
    else if (section === "case") await detail(hash.split("/")[1]);
    else if (section === "demo") await detail(demo.id, true);
    else if (section === "settings") settings();
    else if (section === "accessibility") accessibilityPage($("#main"));
    else if (section === "about") about();
    else home();
  } catch (e) {
    $("#main").innerHTML =
      `${heading("Let’s reconnect.", "Your saved cases remain on the backend.")}<div class="notice warning">${escape(e.message)}</div><div class="button-row"><a class="primary" href="#settings">Connection settings →</a><a class="secondary" href="#home">Back to overview</a></div>`;
  }
  window.scrollTo(0, 0);
}
$("#account-button").onclick = async () => {
  if (user) {
    try {
      await post("/auth/logout");
    } catch {}
    token = "";
    user = null;
    sessionStorage.removeItem("ballighni-token");
    updateAccount();
    location.hash = "home";
    toast("Signed out.");
  } else showAuth();
};
$(".close").onclick = () => $("#auth-dialog").close();
$("#auth-toggle").onclick = () => {
  register = !register;
  $("#auth-title").textContent = register
    ? "Make space for clarity."
    : "Welcome back.";
  $("#auth-submit").textContent = register ? "Create account →" : "Sign in →";
  $("#auth-toggle").textContent = register
    ? "Already registered? Sign in"
    : "New here? Create an account";
  $("#reviewer-code-label").hidden = !register;
  $('[name="password"]').minLength = register ? 12 : 1;
  $('[name="password"]').autocomplete = register
    ? "new-password"
    : "current-password";
  $("#auth-error").textContent = "";
};
$("#auth-form").onsubmit = async (e) => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.currentTarget));
  $("#auth-submit").disabled = true;
  $("#auth-error").textContent = "";
  try {
    if (register) {
      await post("/auth/register", b);
      toast("Account created. Signing you in…");
    }
    const result = await post("/auth/login", b);
    token = result.token;
    user = result.user;
    sessionStorage.setItem("ballighni-token", token);
    updateAccount();
    $("#auth-dialog").close();
    $("#auth-form").reset();
    const target = pendingRoute;
    pendingRoute = null;
    if (target) {
      if (location.hash === `#${target}`) route();
      else location.hash = target;
    } else route();
  } catch (e) {
    $("#auth-error").textContent = e.message;
  } finally {
    $("#auth-submit").disabled = false;
  }
};
window.addEventListener("hashchange", route);
if (token) {
  try {
    user = await api("/me");
  } catch {
    // A temporary network failure must not erase a still-valid session.
  }
}
updateAccount();
route();
refreshConnection();
setInterval(async () => {
  if (document.hidden) return;
  await refreshConnection();
  if (
    workspaceConnected &&
    user?.role === "citizen" &&
    location.hash.startsWith("#case/") &&
    current &&
    ["submitted", "review", "closed"].includes(current.status) &&
    !document.querySelector("dialog[open]") &&
    !document.activeElement?.matches("input,textarea,select")
  ) {
    const scroll = window.scrollY;
    try {
      await detail(current.id);
      window.scrollTo(0, scroll);
    } catch {}
  }
}, 20000);
