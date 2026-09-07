// Riff - background service worker
// Owns the "send to AI" hand-off. The popup closes the moment a new tab takes
// focus, so the tab open + wait + inject sequence has to live here.

const AI_TARGETS = {
  claude: { url: "https://claude.ai/new", origin: "https://claude.ai/*", label: "Claude" },
  chatgpt: { url: "https://chatgpt.com/", origin: "https://chatgpt.com/*", label: "ChatGPT" },
  gemini: { url: "https://gemini.google.com/app", origin: "https://gemini.google.com/*", label: "Gemini" },
};

const waitForTabComplete = (tabId, timeoutMs = 20000) =>
  new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    };
    const onUpdated = (id, info) => {
      if (id === tabId && info.status === "complete") finish();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.get(tabId).then((tab) => {
      if (tab && tab.status === "complete") finish();
    }).catch(() => {});
    setTimeout(finish, timeoutMs);
  });

const sendToAI = async ({ target, text }) => {
  const cfg = AI_TARGETS[target];
  if (!cfg) throw new Error(`Unknown AI target: ${target}`);

  const granted = await chrome.permissions.contains({ origins: [cfg.origin] });
  if (!granted) throw new Error(`Permission for ${cfg.label} was not granted.`);

  await chrome.storage.session.set({
    riffPayload: { text, target, label: cfg.label, createdAt: Date.now() },
  });

  const tab = await chrome.tabs.create({ url: cfg.url, active: true });
  await waitForTabComplete(tab.id);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["ai-fill.js"],
  });
  return { tabId: tab.id };
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === "sendToAI") {
    sendToAI(request)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: String((err && err.message) || err) }));
    return true;
  }
  return false;
});
