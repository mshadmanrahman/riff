// Riff - composer filler
// Injected into claude.ai, chatgpt.com or gemini.google.com after the tab
// finishes loading. Reads the payload Riff stored, finds the chat composer,
// inserts the text, and leaves the send button to the user.
//
// The core is a plain function so it can be exercised in a devtools console:
//   riffFillComposer("hello", "claude").then(console.log)

(() => {
  "use strict";

  const COMPOSER_SELECTORS = {
    claude: [
      'div.ProseMirror[contenteditable="true"]',
      '[data-testid="chat-input"]',
      'div[contenteditable="true"]',
      "textarea",
    ],
    chatgpt: [
      "#prompt-textarea",
      'div.ProseMirror[contenteditable="true"]',
      "textarea",
      'div[contenteditable="true"]',
    ],
    gemini: [
      '.ql-editor[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"]',
      "textarea",
    ],
    generic: ["textarea", 'div[contenteditable="true"]', '[contenteditable="true"]'],
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const isVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
  };

  const findComposer = (target) => {
    const list = [...(COMPOSER_SELECTORS[target] || []), ...COMPOSER_SELECTORS.generic];
    for (const sel of list) {
      const el = Array.from(document.querySelectorAll(sel)).find(isVisible);
      if (el) return el;
    }
    return null;
  };

  const waitForComposer = async (target, timeoutMs = 20000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const el = findComposer(target);
      if (el) return el;
      await sleep(250);
    }
    return null;
  };

  const setTextareaValue = (el, text) => {
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, text);
    else el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Rich editors drop newlines from textContent, so compare with all
  // whitespace stripped on both sides.
  const squash = (str) => (str || "").replace(/\s+/g, "");
  const contains = (el, text) => squash(el.value || el.textContent).includes(squash(text).slice(0, 40));

  const insertIntoEditable = async (el, text) => {
    el.focus();
    // 1. Synthetic paste: ProseMirror (Claude, ChatGPT) and Quill (Gemini)
    //    both parse text/plain paste data and keep the paragraphs.
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const evt = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
      el.dispatchEvent(evt);
      await sleep(150);
      if (contains(el, text)) return "paste";
    } catch (e) {}

    // 2. execCommand insertText, which the editors treat as typing.
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("insertText", false, text);
      await sleep(150);
      if (contains(el, text)) return "insertText";
    } catch (e) {}

    // 3. Raw DOM write with an input event. Last resort.
    el.textContent = text;
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    await sleep(100);
    return contains(el, text) ? "textContent" : null;
  };

  const toast = (message, ok) => {
    try {
      const existing = document.getElementById("riff-toast");
      if (existing) existing.remove();
      const el = document.createElement("div");
      el.id = "riff-toast";
      el.textContent = message;
      el.style.cssText = [
        "position:fixed", "left:50%", "bottom:24px", "transform:translateX(-50%)",
        "z-index:2147483647", "padding:10px 16px", "border-radius:8px",
        "font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif",
        "color:#fff", `background:${ok ? "#1f6f43" : "#8a2f2f"}`,
        "box-shadow:0 4px 16px rgba(0,0,0,.35)", "max-width:80vw",
      ].join(";");
      document.body.appendChild(el);
      setTimeout(() => el.remove(), ok ? 5000 : 9000);
    } catch (e) {}
  };

  const riffFillComposer = async (text, target) => {
    const el = await waitForComposer(target);
    if (!el) return { ok: false, reason: "composer not found" };
    let method;
    if (el.tagName === "TEXTAREA") {
      setTextareaValue(el, text);
      method = contains(el, text) ? "textarea" : null;
    } else {
      method = await insertIntoEditable(el, text);
    }
    el.focus();
    return method ? { ok: true, method, selector: el.tagName + (el.id ? "#" + el.id : "") } : { ok: false, reason: "insert failed" };
  };

  window.riffFillComposer = riffFillComposer;

  // ── Entry point when injected by background.js ──
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.session) {
    chrome.storage.session.get("riffPayload").then(async ({ riffPayload }) => {
      if (!riffPayload || !riffPayload.text) return;
      if (Date.now() - (riffPayload.createdAt || 0) > 5 * 60 * 1000) return;
      await chrome.storage.session.remove("riffPayload");
      const result = await riffFillComposer(riffPayload.text, riffPayload.target);
      if (result.ok) {
        toast("Riff pasted the post and comments. Read it over, then press Enter to send.", true);
      } else {
        toast("Riff couldn't find the message box. The text is on your clipboard, paste it with Cmd+V / Ctrl+V.", false);
      }
    }).catch(() => {});
  }
})();
