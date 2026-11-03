let recognition;
let listening = false;
const language = () =>
  document.documentElement.lang === "ar" ? "ar-AE" : "en-AE";
let nativeBridge;
const native = () => {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  // Android injects nativePromise; registerPlugin belongs to the optional JS
  // core runtime and is not supplied by the injected bridge alone.
  if (typeof cap.nativePromise !== "function") return null;
  return (nativeBridge ||= Object.fromEntries(
    ["listen", "speak", "stop"].map((method) => [
      method,
      (options) => cap.nativePromise("BallighniVoice", method, options || {}),
    ]),
  ));
};

export function resolveVoiceCommand(value) {
  const text = String(value || "")
    .toLowerCase()
    .replace(/[.!?،؟]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const groups = {
    home: ["home", "go home", "open home", "الرئيسية", "افتح الرئيسية"],
    report: [
      "new report",
      "open new report",
      "open report",
      "بلاغ جديد",
      "افتح بلاغ جديد",
    ],
    witness: ["witness report", "open witness report", "بلاغ شاهد"],
    cases: ["my cases", "open my cases", "بلاغاتي", "افتح بلاغاتي"],
    accessibility: [
      "accessibility",
      "open accessibility",
      "إمكانية الوصول",
      "افتح إمكانية الوصول",
    ],
    settings: [
      "connection settings",
      "open connection settings",
      "إعدادات الاتصال",
    ],
    read: ["read page", "read this page", "اقرأ الصفحة"],
    stop: ["stop reading", "stop listening", "توقف", "إيقاف القراءة"],
  };
  return (
    Object.entries(groups).find(([, phrases]) => phrases.includes(text))?.[0] ||
    null
  );
}

export async function listenOnce(status) {
  if (listening)
    throw new Error("Already listening. Stop the current session first.");
  window.speechSynthesis?.cancel();
  listening = true;
  document.body.classList.add("voice-listening");
  status.textContent =
    "Listening once… Speak clearly, then pause. You can stop at any time.";
  try {
    const bridge = native();
    if (bridge) {
      await bridge.stop();
      const availability = await bridge.availability();
      if (!availability.available)
        throw new Error(
          "No Android speech service is installed. You can use keyboard dictation or type instead.",
        );
      return (await bridge.listen({ language: language() })).text;
    }
    const Constructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor)
      throw new Error(
        "Voice recognition is unavailable in this browser. Try Chrome, your keyboard's microphone, or the Android app.",
      );
    return await new Promise((resolve, reject) => {
      recognition = new Constructor();
      recognition.lang = language();
      recognition.continuous = false;
      recognition.interimResults = false;
      let finished = false;
      recognition.onresult = (event) => {
        finished = true;
        resolve(event.results[0][0].transcript);
      };
      recognition.onerror = (event) => {
        finished = true;
        reject(
          new Error(
            event.error === "not-allowed"
              ? "Microphone permission was not granted. You can still type."
              : event.error === "aborted"
                ? "Listening stopped."
                : "Speech could not be recognized. Check your device language and network, or type instead.",
          ),
        );
      };
      recognition.onend = () => {
        if (!finished)
          reject(
            new Error(
              "No clear speech was recognized. Try again or type instead.",
            ),
          );
      };
      recognition.start();
    });
  } finally {
    listening = false;
    recognition = null;
    document.body.classList.remove("voice-listening");
  }
}

export async function speakText(value, status) {
  const text = String(value || "")
    .trim()
    .slice(0, 6000);
  if (!text) throw new Error("There is no text to read yet.");
  const bridge = native();
  if (bridge) await bridge.speak({ text, language: language() });
  else {
    if (!window.speechSynthesis)
      throw new Error(
        "Read-aloud is unavailable here. Use your device screen reader.",
      );
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language();
    utterance.rate = 0.85;
    utterance.onerror = () => {
      if (status?.isConnected)
        status.textContent =
          "The device speech service could not finish reading. Written text remains available.";
    };
    speechSynthesis.speak(utterance);
  }
  if (status)
    status.textContent =
      "Reading with your device speech service. Use Stop voice / reading to stop.";
}

export function stopVoice() {
  // Optional speech services must never prevent routing or text entry.
  try {
    recognition?.abort();
  } catch {}
  try {
    window.speechSynthesis?.cancel();
  } catch {}
  try {
    Promise.resolve(native()?.stop()).catch(() => {});
  } catch {}
  document.body.classList.remove("voice-listening");
}

export function installVoiceTools(root = document.querySelector("#main")) {
  if (!root) return;
  for (const input of root.querySelectorAll("textarea:not([readonly])")) {
    if (input.dataset.voiceTools) continue;
    input.dataset.voiceTools = "true";
    const tools = document.createElement("div");
    tools.className = "dictation-tools";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary voice-dictate";
    button.textContent = "Dictate into this field";
    const stop = document.createElement("button");
    stop.type = "button";
    stop.className = "text-button";
    stop.textContent = "Stop listening";
    const status = document.createElement("span");
    status.className = "voice-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    tools.append(button, stop, status);
    // Keep buttons outside the textarea's label so dictation never triggers form submission.
    (input.closest("label") || input).after(tools);
    stop.onclick = () => {
      stopVoice();
      status.textContent = "Listening stopped.";
    };
    button.onclick = async () => {
      button.disabled = true;
      try {
        const text = await listenOnce(status);
        if (!input.isConnected) return;
        const limit = input.maxLength > 0 ? input.maxLength : 6000;
        const combined = `${input.value}${input.value.trim() ? " " : ""}${text}`;
        input.value = combined.slice(0, limit);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        status.textContent =
          combined.length > limit
            ? "The field character limit was reached. Check the shortened text before confirming or saving."
            : "Speech added. Check and edit the words before confirming or saving.";
        input.focus();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
  }
}

export function voicePanel(root) {
  const panel = document.createElement("section");
  panel.className = "panel voice-panel";
  panel.innerHTML = `<div class="eyebrow">VOICE & READING SUPPORT</div><h2>Your voice. Your pace.</h2><p>Use one spoken command at a time, or dictate directly into a report field. Your device or browser speech service handles audio; language and network support vary.</p><div class="button-row"><button class="primary" type="button" data-voice-action="navigation">Speak a navigation command</button><button class="secondary" type="button" data-voice-action="read">Read this page aloud</button><button class="secondary" type="button" data-voice-action="stop">Stop voice / reading</button></div><p data-voice-status class="voice-status" role="status" aria-live="polite"></p><details><summary>Commands you can say</summary><div class="voice-command-list"><span>Home / الرئيسية</span><span>New report / بلاغ جديد</span><span>My cases / بلاغاتي</span><span>Accessibility / إمكانية الوصول</span><span>Connection settings / إعدادات الاتصال</span><span>Read page / اقرأ الصفحة</span><span>Stop reading / إيقاف القراءة</span></div></details><p class="tiny">Speech remains editable. Review and confirm reports using the confirmation form. Emergency calling links are always available on screen.</p>`;
  root.append(panel);
  const status = panel.querySelector("[data-voice-status]");
  const read = () =>
    speakText(document.querySelector("#main").innerText, status);
  panel.querySelector('[data-voice-action="read"]').onclick = () =>
    read().catch((error) => (status.textContent = error.message));
  panel.querySelector('[data-voice-action="stop"]').onclick = () => {
    stopVoice();
    status.textContent = "Voice and reading stopped.";
  };
  panel.querySelector('[data-voice-action="navigation"]').onclick = async (
    event,
  ) => {
    event.target.disabled = true;
    try {
      const transcript = await listenOnce(status);
      const command = resolveVoiceCommand(transcript);
      status.textContent = `Heard: “${transcript}”. ${command ? "Command recognized." : "Use one of the listed navigation commands, or dictate into a field."}`;
      if (command === "read") await read();
      else if (command === "stop") stopVoice();
      else if (command) {
        panel.closest("dialog")?.close();
        location.hash = command;
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      event.target.disabled = false;
    }
  };
}

export function setupVoiceDialog() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "text-button";
  button.id = "voice-shortcut";
  button.textContent = "Voice";
  button.setAttribute("aria-label", "Voice navigation and reading controls");
  document.querySelector(".access-shortcut").after(button);
  const dialog = document.createElement("dialog");
  dialog.id = "voice-dialog";
  dialog.setAttribute("aria-label", "Voice navigation and reading controls");
  dialog.innerHTML =
    '<button type="button" class="close" aria-label="Close voice controls">×</button>';
  voicePanel(dialog);
  document.body.append(dialog);
  button.onclick = () => dialog.showModal();
  dialog.querySelector(".close").onclick = () => {
    stopVoice();
    dialog.close();
  };
  dialog.addEventListener("cancel", stopVoice);
}
