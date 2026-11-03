const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  file: '<path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h6"/>',
  review:
    '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7 12 3 3 7-7"/>',
  camera: '<path d="m8 5 2-2h4l2 2h4v15H4V5z"/><circle cx="12" cy="12" r="4"/>',
  people:
    '<circle cx="8" cy="8" r="3"/><path d="M2 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M22 21v-3a6 6 0 0 0-5-6"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  shield:
    '<path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5z"/><path d="m8 12 3 3 5-6"/>',
};
export const icon = (name) =>
  `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;

export function homeScreen(safety) {
  return `<div class="overview-heading"><div><div class="eyebrow">YOUR REPORTING SPACE</div><h1>A little clarity, when it matters.</h1><p>A calmer way to capture, connect and move forward.</p></div><span class="workspace-tag">${icon("shield")} Human review at every step</span></div>
  <section class="welcome-hero"><div class="welcome-copy"><span class="hero-label">ONE INCIDENT. EVERY PERSPECTIVE.</span><h2>Clear facts.<br><em>A clearer way forward.</em></h2><p>Bring your photos and your account together. Let AI help organize the evidence, then check every detail yourself.</p><a href="#report" class="primary">Start an incident report ${icon("arrow")}</a><span class="hero-note">Safely stopped first. Your confirmation always.</span></div><div class="welcome-visual"><img src="scene.svg" alt="Illustration of a vehicle; not an actual AI damage analysis"><div class="visual-caption">${icon("camera")} Photos → AI observations → Your review</div></div></section>
  <section class="journey-strip" aria-label="Your reporting journey">${[
    ["01", "Stay safe", "Stop and check for danger"],
    ["02", "Capture", "Your account and photos"],
    ["03", "Analyze", "Evidence-linked AI observations"],
    ["04", "Confirm", "You check. A person reviews."],
  ]
    .map(
      ([n, t, d]) =>
        `<div><span>${n}</span><section><strong>${t}</strong><p>${d}</p></section></div>`,
    )
    .join("")}</section>
  <div class="section-head"><h2>What would you like to do?</h2><span>Choose your next step</span></div><section class="action-grid" aria-label="Reporting options">${[
    [
      "report",
      "plus",
      "I was involved",
      "Create your report with photos and a guided draft.",
      "Start a report",
    ],
    [
      "witness",
      "people",
      "I witnessed an incident",
      "Share what you saw. Photos are optional.",
      "Add a witness account",
    ],
    [
      "cases",
      "file",
      "Track or connect a report",
      "Follow updates or connect two separate testimonies.",
      "Open my cases",
    ],
  ]
    .map(
      ([route, i, t, d, cta]) =>
        `<a class="action-card" href="#${route}"><span class="card-icon">${icon(i)}</span><h3>${t}</h3><p>${d}</p><span class="action-cta">${cta} ${icon("arrow")}</span></a>`,
    )
    .join("")}</section>
  <section class="connected-callout"><div><div class="eyebrow">TWO ACCOUNTS. ONE COMPLETE PICTURE.</div><h2>Different stories deserve <br>their own space.</h2><p>Connect using a private invitation. Both testimonies stay separate, and a reviewer considers the disagreement alongside the evidence.</p><a href="#cases" class="text-button">Connect from your case ${icon("arrow")}</a></div><div class="account-diagram" aria-label="Separate accounts are connected for human review"><div>${icon("file")}<span>Your account<small>Original statement preserved</small></span></div><div>${icon("file")}<span>Their account<small>Original statement preserved</small></span></div><p>${icon("review")} Connected after reviewer approval</p></div></section>
  <a class="support-callout" href="#accessibility"><span class="support-symbol" aria-hidden="true">♿</span><div><h3>Support that adapts to you.</h3><p>Larger text, high contrast and a communication card for People of Determination.</p></div>${icon("arrow")}</a>${safety}`;
}

export function refreshIcons() {
  for (const [i, el] of [
    ...document.querySelectorAll("[data-nav] > span"),
  ].entries())
    el.innerHTML = icon(["home", "plus", "file", "review"][i]);
}

export function caseOverview(c, escape) {
  const stages = ["draft", "submitted", "review", "closed"];
  const position = c.status === "more_info" ? 2 : stages.indexOf(c.status);
  const stagesText = ["Your draft", "Submitted", "Human review", "Closed"];
  return `<section class="case-overview" aria-label="Case progress"><div class="case-stages">${stagesText.map((t, i) => `<div class="${i === position ? "active" : i < position ? "complete" : ""}" ${i === position ? 'aria-current="step"' : ""}><span>${i < position ? "✓" : i + 1}</span><strong>${t}</strong></div>`).join("")}</div><div class="case-facts"><span>${icon("camera")} <strong>${c.evidence.length}</strong> photos</span><span>${icon("spark")} <strong>${c.analysis?.findings?.length || 0}</strong> AI observations</span><span>${icon("people")} <strong>${c.shared_reports?.length || 0}</strong> connected accounts</span><small>${c.status === "more_info" ? "Your reviewer needs more information." : c.status === "draft" ? "Check your draft before submitting." : "Accounts stay separate throughout human review."}</small></div></section><div class="case-jumps" aria-label="Go to case section">${["Evidence", "AI analysis", "Your report", "Participant statements", "Timeline"].map((t, i) => `<button type="button" class="jump-pill" data-section="${i}">${escape(t)}</button>`).join("")}</div>`;
}
