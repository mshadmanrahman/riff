// Riff - Popup Logic

(() => {
  "use strict";

  // ─── State ──────────────────────────────────────────────────

  let extractedData = null;
  let extractedMarkdown = "";

  // ─── Markdown Formatter (popup-side, uses cleaned data) ────

  const formatDataAsMarkdown = (data) => {
    const lines = [];
    const mode = data.mode;

    lines.push(`## LinkedIn Post [${mode} MODE]`);
    lines.push(`**Author:** ${data.post.author}${data.post.headline ? ` | ${data.post.headline}` : ""}`);
    lines.push(`**Type:** ${data.post.type} | **Engagement:** ${data.engagement.likes} likes, ${data.engagement.comments} comments`);
    lines.push(`**URL:** ${data.post.url}`);
    lines.push("");
    lines.push("### Post Content");
    lines.push(data.post.text || "(Could not extract post text)");
    lines.push("");

    if (data.comments.length > 0) {
      lines.push(`### Comments (${data.comments.length} extracted)`);
      data.comments.forEach((comment, i) => {
        const likesStr = comment.likes > 0 ? ` (${comment.likes} likes)` : "";
        lines.push(`${i + 1}. **@${comment.author}**${comment.headline ? ` - ${comment.headline}` : ""}${likesStr}`);
        lines.push(`   > ${comment.text}`);
        if (comment.timestamp) {
          lines.push(`   _${comment.timestamp}_`);
        }
        if (comment.replies.length > 0) {
          comment.replies.forEach((reply) => {
            const replyLikes = reply.likes > 0 ? ` (${reply.likes} likes)` : "";
            lines.push(`   - **@${reply.author}**${reply.headline ? ` - ${reply.headline}` : ""}${replyLikes}: ${reply.text}`);
          });
        }
        lines.push("");
      });
    } else {
      lines.push("### Comments");
      const hasCommentCount = data.engagement?.comments > 0;
      if (hasCommentCount) {
        lines.push(`No comments loaded in DOM yet (${data.engagement.comments} exist). Click the comments section on the post to expand them, then re-extract.`);
      } else {
        lines.push("No comments found. Try clicking 'Load more comments' on the post first.");
      }
      lines.push("");
    }

    if (mode === "REPLY") {
      lines.push("---");
      lines.push("**Instructions for Claude:** Draft replies to the comments above. Match my writing style: direct, conversational, technically precise. No generic responses. Each reply should add value or continue the conversation.");
    } else {
      lines.push("---");
      lines.push("**Instructions for Claude:** Draft a comment for this post. Match my writing style: direct, conversational, technically precise. Add unique value that nobody in the existing comments has mentioned. Keep it concise (2-4 sentences max).");
    }

    return lines.join("\n");
  };

  // ─── DOM Refs ───────────────────────────────────────────────

  const states = {
    notLinkedin: document.getElementById("not-linkedin"),
    ready: document.getElementById("ready"),
    loading: document.getElementById("loading"),
    result: document.getElementById("result"),
    error: document.getElementById("error"),
  };

  const extractBtn = document.getElementById("extract-btn");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const diagnoseBtn = document.getElementById("diagnose-btn");
  const copyBtn = document.getElementById("copy-btn");
  const copyJsonBtn = document.getElementById("copy-json-btn");
  const reExtractBtn = document.getElementById("re-extract-btn");
  const retryBtn = document.getElementById("retry-btn");
  const modeBadge = document.getElementById("mode-badge");
  const commentCount = document.getElementById("comment-count");
  const preview = document.getElementById("preview");
  const copyFeedback = document.getElementById("copy-feedback");
  const errorMessage = document.getElementById("error-message");

  // ─── State Management ───────────────────────────────────────

  const showState = (stateName) => {
    Object.entries(states).forEach(([key, el]) => {
      if (key === stateName) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });
  };

  // ─── Tab Check ──────────────────────────────────────────────

  const checkCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.includes("linkedin.com")) {
      showState("notLinkedin");
      return null;
    }
    return tab;
  };

  // ─── Extraction ─────────────────────────────────────────────

  const doExtract = async () => {
    const tab = await checkCurrentTab();
    if (!tab) return;

    showState("loading");

    try {
      // Always re-inject content.js to get the freshest code.
      // The version guard inside content.js ensures old listeners yield
      // to this new injection, preventing stale data races.
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (injectErr) {
        // Script may already be injected, that's fine
      }

      // Smart wait: poll until content script confirms the DOM matches
      // the current tab URL. LinkedIn's SPA may not have finished rendering
      // the new post's DOM, so a fixed timeout is unreliable.
      // We send a lightweight "ping" that returns the URL the content script
      // sees, and compare it against tab.url.
      const maxWaitMs = 3000;
      const pollIntervalMs = 150;
      const startTime = Date.now();

      // Initial short wait for the script to register its listener
      await new Promise((resolve) => setTimeout(resolve, 150));

      // For single post pages, verify the DOM has the right content loaded
      const isSinglePost = tab.url.includes("/feed/update/") || tab.url.includes("/posts/");
      if (isSinglePost) {
        while (Date.now() - startTime < maxWaitMs) {
          try {
            const ping = await chrome.tabs.sendMessage(tab.id, { action: "ping" });
            if (ping && ping.ready) break;
          } catch (e) {
            // Content script not ready yet, keep polling
          }
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: "extract" });

      if (!response) {
        throw new Error("No response from content script. Refresh the LinkedIn page and try again.");
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      extractedData = response.data;

      // Post-process: clean author names that include "Author" badge and headline
      // LinkedIn's aria-label for your own comments includes badge text
      // e.g. "Shadman Rahman Author, Product Lead | ..." -> "Shadman Rahman"
      const decodeHtmlEntities = (str) => {
        if (!str) return str;
        const el = document.createElement("textarea");
        el.innerHTML = str;
        return el.value;
      };

      const cleanAuthorName = (raw) => {
        if (!raw) return raw;
        const authorMatch = raw.match(/^(.+?)\s+Author\b/i);
        if (authorMatch) return authorMatch[1].trim();
        return raw.replace(/\s*[·•]\s*You\s*$/, "").trim();
      };

      const extractHeadlineFromRaw = (raw) => {
        if (!raw) return "";
        const match = raw.match(/Author,\s*(.+)$/i);
        return match ? decodeHtmlEntities(match[1].trim()) : "";
      };

      for (const comment of extractedData.comments) {
        const rawAuthor = comment.author;
        if (!comment.headline) {
          comment.headline = extractHeadlineFromRaw(rawAuthor);
        }
        comment.headline = decodeHtmlEntities(comment.headline);
        comment.author = cleanAuthorName(rawAuthor);

        for (const reply of comment.replies) {
          const rawReply = reply.author;
          if (!reply.headline) {
            reply.headline = extractHeadlineFromRaw(rawReply);
          }
          reply.headline = decodeHtmlEntities(reply.headline);
          reply.author = cleanAuthorName(rawReply);
        }
      }

      // Regenerate markdown with cleaned data
      extractedMarkdown = formatDataAsMarkdown(extractedData);

      // Update UI
      const mode = extractedData.mode;
      modeBadge.textContent = `${mode} MODE`;
      modeBadge.className = `badge ${mode.toLowerCase()}`;
      commentCount.textContent = `${extractedData.comments.length} comments`;

      // Build preview
      const postExcerpt = extractedData.post.text
        ? extractedData.post.text.substring(0, 150) + (extractedData.post.text.length > 150 ? "..." : "")
        : "(Post text not captured)";

      let previewHtml = `
        <div class="post-author">${escapeHtml(extractedData.post.author)}</div>
        <div class="post-excerpt">${escapeHtml(postExcerpt)}</div>
      `;

      // Show first 3 comments as preview
      const previewComments = extractedData.comments.slice(0, 3);
      for (const comment of previewComments) {
        const excerpt = comment.text.substring(0, 80) + (comment.text.length > 80 ? "..." : "");
        previewHtml += `
          <div class="comment-preview">
            <span class="author">${escapeHtml(comment.author)}:</span>
            ${escapeHtml(excerpt)}
          </div>
        `;
      }

      if (extractedData.comments.length > 3) {
        previewHtml += `<div class="comment-preview" style="color:#525252">+${extractedData.comments.length - 3} more...</div>`;
      }

      preview.innerHTML = previewHtml;
      showState("result");

    } catch (err) {
      const msg = err.message.includes("Receiving end does not exist")
        ? "Refresh the LinkedIn page (Cmd+R) and try again."
        : err.message;
      errorMessage.textContent = msg;
      showState("error");
    }
  };

  // ─── Load More Comments ─────────────────────────────────────

  const doLoadMore = async () => {
    const tab = await checkCurrentTab();
    if (!tab) return;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "loadMoreComments" });
      const clicked = response?.clicked || 0;

      if (clicked > 0) {
        loadMoreBtn.textContent = `Loaded! (clicked ${clicked} buttons) - Now Extract`;
      } else {
        loadMoreBtn.textContent = "No 'load more' buttons found";
      }

      // Reset button text after 2 seconds
      setTimeout(() => {
        loadMoreBtn.textContent = "Load More Comments First";
      }, 2000);

    } catch (err) {
      loadMoreBtn.textContent = "Failed - refresh LinkedIn page";
      setTimeout(() => {
        loadMoreBtn.textContent = "Load More Comments First";
      }, 2000);
    }
  };

  // ─── Clipboard ──────────────────────────────────────────────

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback.classList.remove("hidden");
      setTimeout(() => copyFeedback.classList.add("hidden"), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      copyFeedback.classList.remove("hidden");
      setTimeout(() => copyFeedback.classList.add("hidden"), 2000);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  // ─── Event Listeners ───────────────────────────────────────

  extractBtn.addEventListener("click", doExtract);
  loadMoreBtn.addEventListener("click", doLoadMore);
  reExtractBtn.addEventListener("click", doExtract);
  retryBtn.addEventListener("click", doExtract);

  diagnoseBtn.addEventListener("click", async () => {
    const tab = await checkCurrentTab();
    if (!tab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch (e) { /* ignore */ }
    await new Promise((r) => setTimeout(r, 100));
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "diagnose" });
      if (response && response.report) {
        await navigator.clipboard.writeText(JSON.stringify(response.report, null, 2));
        diagnoseBtn.textContent = "Copied! Paste into Claude Code";
        setTimeout(() => { diagnoseBtn.textContent = "Diagnose DOM"; }, 3000);
      }
    } catch (err) {
      diagnoseBtn.textContent = "Failed: " + err.message.substring(0, 30);
      setTimeout(() => { diagnoseBtn.textContent = "Diagnose DOM"; }, 3000);
    }
  });

  copyBtn.addEventListener("click", () => {
    if (extractedMarkdown) copyToClipboard(extractedMarkdown);
  });

  copyJsonBtn.addEventListener("click", () => {
    if (extractedData) copyToClipboard(JSON.stringify(extractedData, null, 2));
  });

  // ─── Init ───────────────────────────────────────────────────

  checkCurrentTab().then((tab) => {
    if (tab) showState("ready");
  });
})();
