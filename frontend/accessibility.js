import {
  speakText,
  stopVoice,
  voicePanel,
  installVoiceTools,
} from "./voice.js";
const escaped = (v) =>
  String(v || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const read = () => {
  try {
    return JSON.parse(localStorage.getItem("ballighni-accessibility") || "{}");
  } catch {
    return {};
  }
};
export function applyAccessibility() {
  const p = read();
  document.documentElement.classList.toggle("large-text", !!p.large);
  document.documentElement.classList.toggle("high-contrast", !!p.contrast);
  document.documentElement.classList.toggle("reduce-motion", !!p.motion);
  document.documentElement.classList.toggle("comfortable-controls", !!p.touch);
  document.documentElement.classList.toggle("reading-space", !!p.reading);
}
export const communicationCard = () => read().card || "";
export function accessibilityPage(root) {
  const p = read();
  root.innerHTML = `<div class="wizard"><div class="eyebrow">PEOPLE OF DETERMINATION</div><h1>Support that adapts to you.</h1><p>Use Ballighni only when safely stopped. These tools help you communicate and report; they do not control a vehicle or assess fitness to drive.</p><section class="panel"><h2>Make the interface comfortable</h2><form id="accessibility-form"><label class="checkbox"><input name="large" type="checkbox" ${p.large ? "checked" : ""}>Larger, easier-to-read text</label><label class="checkbox"><input name="contrast" type="checkbox" ${p.contrast ? "checked" : ""}>High-contrast view</label><label class="checkbox"><input name="motion" type="checkbox" ${p.motion ? "checked" : ""}>Reduce animation and motion</label><label class="checkbox"><input name="touch" type="checkbox" ${p.touch ? "checked" : ""}>Extra large touch targets</label><label class="checkbox"><input name="reading" type="checkbox" ${p.reading ? "checked" : ""}>More space between lines and paragraphs</label><label>My communication card <small>Optional. Stored on this device. No diagnosis or identity details are needed. Add it to a report only when you choose.</small><textarea name="card" maxlength="500" placeholder="For example: Please give me extra time. I prefer written communication. I may need accessible assistance.">${escaped(p.card)}</textarea></label><div class="button-row"><button class="primary">Save my preferences →</button><button type="button" class="secondary" id="read-card">Read my card aloud</button><button type="button" class="secondary" id="stop-reading">Stop reading</button></div><p id="speech-status" role="status" class="muted"></p></form></section><section class="panel"><h2>A calmer reporting journey</h2><ul class="accessible-list"><li>Large buttons, labeled controls and keyboard focus indicators.</li><li>Text-only witness reports and optional photos.</li><li>Drafts saved on the backend before confirmation.</li><li>Separate accounts, clear requests and a readable case timeline.</li><li>An optional support request visible to the authorized reviewer.</li></ul><a class="primary" href="#report">Start a safely stopped report →</a></section><section class="panel emergency"><h2>Injuries, fire or immediate danger?</h2><p>Urgently use the official emergency channels. Do not wait for a Ballighni report or a helper.</p><div class="button-row"><a href="tel:999" class="danger-button">Police · 999</a><a href="tel:997" class="danger-button">Fire / Civil Defence · 997</a><a href="tel:998" class="danger-button">Ambulance · 998</a></div><p>If voice calling is inaccessible, use your established official accessible emergency arrangement or ask a nearby trusted person to call. Ballighni cannot dispatch help.</p></section></div>`;
  root.querySelector("#accessibility-form").onsubmit = (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    localStorage.setItem(
      "ballighni-accessibility",
      JSON.stringify({
        large: f.elements.large.checked,
        contrast: f.elements.contrast.checked,
        motion: f.elements.motion.checked,
        touch: f.elements.touch.checked,
        reading: f.elements.reading.checked,
        card: f.elements.card.value.trim(),
      }),
    );
    applyAccessibility();
    root.querySelector("#speech-status").textContent =
      "Preferences saved on this device.";
  };
  root.querySelector("#read-card").onclick = async () => {
    const status = root.querySelector("#speech-status");
    try {
      await speakText(
        root.querySelector('[name="card"]').value.trim() ||
          "Please give me extra time. I prefer clear, written communication.",
        status,
      );
    } catch (error) {
      status.textContent = error.message;
    }
  };
  root.querySelector("#stop-reading").onclick = () => {
    stopVoice();
    root.querySelector("#speech-status").textContent = "Reading stopped.";
  };
  voicePanel(root);
  installVoiceTools(root);
}
