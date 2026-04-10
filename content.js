// Riff - LinkedIn Content Extractor
// Extracts post content and comments from LinkedIn pages
// Supports both single post pages AND the feed page

(() => {
  "use strict";

  // ─── Guard: prevent duplicate listeners on re-injection ──────
  // When the popup re-injects content.js via chrome.scripting.executeScript,
  // a new IIFE runs and would register a SECOND onMessage listener.
  // The old (stale) listener would race with the new one, causing wrong/missing data.
  // This guard ensures only the latest injection is active.
  if (window.__riffContentScriptVersion) {
    // Already injected: bump version so the old listener knows to yield
    window.__riffContentScriptVersion++;
  } else {
    window.__riffContentScriptVersion = 1;
  }
  const MY_VERSION = window.__riffContentScriptVersion;

  // ─── Selectors (Single Post Pages) ────────────────────────
  // These work on linkedin.com/feed/update/... pages.
  // LinkedIn's feed page uses hashed classes that change every deploy,
  // so feed extraction uses semantic selectors instead (see Feed section below).

  const SELECTORS = {
    // Feed post containers (single post pages only)
    feedPost: '[data-urn*="urn:li:activity"], [data-id*="urn:li:activity"], .feed-shared-update-v2, .occludable-update, [data-urn*="urn:li:sponsored"]',
    singlePost: ".feed-shared-update-v2, .occludable-update, [data-urn*='urn:li:activity']",
    // Post author info
    actorLink: "a.update-components-actor__container-link, a.update-components-actor__meta-link",
    authorName: ".update-components-actor__name .visually-hidden, .update-components-actor__name span[aria-hidden='true'], .update-components-actor__title .visually-hidden",
    authorHeadline: ".update-components-actor__description .visually-hidden, .update-components-actor__description span[aria-hidden='true'], .update-components-actor__subtitle .visually-hidden",
    // Post content
    postText: ".feed-shared-update-v2__description, .update-components-text, .feed-shared-text",
    postSeeMore: '[data-test-id="see-more"], .feed-shared-inline-show-more-text button, button[aria-label*="see more"]',
    // Engagement metrics
    likeCount: ".social-details-social-counts__reactions-count, span.social-details-social-counts__reactions-count",
    commentCount: 'button[aria-label*="comment"], .social-details-social-counts__comments',
    repostCount: 'button[aria-label*="repost"]',
    // Comments section (single post pages)
    commentsSection: ".comments-comments-list, .social-details-social-activity",
    commentItem: 'article[data-id], .comments-comment-entity, .comments-comment-item',
    commentAuthorTitle: "h3.comments-comment-meta__description span.comments-comment-meta__description-title span",
    commentAuthorSubtitle: "div.comments-comment-meta__description-subtitle span",
    commentAuthorLink: "a.comments-comment-meta__description-container",
    commentImageLink: "a.comments-comment-meta__image-link",
    commentText: ".comments-comment-item__main-content, .comments-comment-texteditor--content, .update-components-text",
    commentTimestamp: "time.comments-comment-item__timestamp, time",
    commentReactions: ".comments-comment-social-bar__reactions-count, .social-details-social-counts__reactions-count",
    // Replies
    replyContainer: ".comments-reply-list, .comments-comment-item--nested",
    replyItem: ".comments-reply-item, .comments-comment-item--nested article",
    // Load more
    loadMoreComments: 'button[aria-label*="Load more comments"], button.comments-comments-list__load-more-comments-button, .show-prev-replies, button[aria-label*="load"]',
    // Post type indicators
    postImage: ".feed-shared-image, .update-components-image",
    postVideo: ".feed-shared-video, .update-components-linkedin-video",
    postArticle: ".feed-shared-article, .update-components-article",
    postPoll: ".feed-shared-poll, .update-components-poll",
    postDocument: ".feed-shared-document, .update-components-document",
  };

  // ─── Utilities ──────────────────────────────────────────────

  const cleanText = (text) => {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  };

  const getAllTextContent = (parent, selector) => {
    if (!parent) return "";
    const elements = parent.querySelectorAll(selector);
    for (const el of elements) {
      const text = cleanText(el.textContent);
      if (text.length > 0) return text;
    }
    return "";
  };

  const getEngagementCount = (parent, selector) => {
    const text = getAllTextContent(parent, selector);
    if (!text) return 0;
    const match = text.match(/[\d,]+/);
    if (!match) return 0;
    return parseInt(match[0].replace(/,/g, ""), 10) || 0;
  };

  // ─── Post Detection (Single Post Pages) ────────────────────

  const detectPostType = (postEl) => {
    if (postEl.querySelector(SELECTORS.postVideo)) return "video";
    if (postEl.querySelector(SELECTORS.postPoll)) return "poll";
    if (postEl.querySelector(SELECTORS.postDocument)) return "document/carousel";
    if (postEl.querySelector(SELECTORS.postArticle)) return "article";
    if (postEl.querySelector(SELECTORS.postImage)) return "image";
    return "text";
  };

  const isMyPost = (postEl) => {
    const actorMeta = postEl.querySelector(".update-components-actor__meta, .update-components-actor");
    if (actorMeta) {
      const metaText = cleanText(actorMeta.textContent);
      if (/\bYou\b/.test(metaText)) return true;
    }
    return false;
  };

  // ─── Post Author Extraction (Single Post Pages) ────────────

  const extractPostAuthor = (postEl) => {
    let name = getAllTextContent(postEl, SELECTORS.authorName);
    let headline = getAllTextContent(postEl, SELECTORS.authorHeadline);

    if (!name) {
      const actorLink = postEl.querySelector(SELECTORS.actorLink);
      if (actorLink) {
        const label = actorLink.getAttribute("aria-label") || "";
        const match = label.match(/^(?:View\s+)?(.+?)(?:'s\s+profile|$)/i);
        if (match) name = cleanText(match[1]);
      }
    }

    if (!name) {
      const nameEl = postEl.querySelector(".update-components-actor__name, .update-components-actor__title");
      if (nameEl) {
        const clone = nameEl.cloneNode(true);
        clone.querySelectorAll(".update-components-actor__supplementary-actor-info, .visually-hidden").forEach(el => el.remove());
        name = cleanText(clone.textContent);
      }
    }

    name = name.replace(/\s*[·•]\s*You\s*$/, "").trim();

    return { name, headline };
  };

  // ─── Comment Author Extraction (Single Post Pages) ─────────

  const extractCommentAuthor = (commentEl) => {
    let name = "";
    let headline = "";

    const imageLink = commentEl.querySelector(SELECTORS.commentImageLink);
    if (imageLink) {
      const label = imageLink.getAttribute("aria-label") || "";
      const stdMatch = label.match(/^View\s+(.+?)'s\s+(?:graphic\s+link|profile)/i);
      if (stdMatch) {
        name = cleanText(stdMatch[1]);
      } else {
        const authMatch = label.match(/^View\s+(.+?)\s+Author\b/i);
        if (authMatch) {
          name = cleanText(authMatch[1]);
        }
      }
    }

    const descLink = commentEl.querySelector(SELECTORS.commentAuthorLink);
    if (descLink) {
      const label = descLink.getAttribute("aria-label") || "";

      if (!name) {
        const nameMatch = label.match(/^View:\s*(.+?)\s*[·•]/);
        if (nameMatch) {
          name = cleanText(nameMatch[1]);
        } else {
          const simpleMatch = label.match(/^View:\s*(.+?)$/);
          if (simpleMatch) name = cleanText(simpleMatch[1]);
        }
      }

      if (!headline) {
        const headlineMatch = label.match(/[·•]\s*(?:(?:1st|2nd|3rd|\d+\w*)\s+)?(.+)$/);
        if (headlineMatch) headline = cleanText(headlineMatch[1]);
      }

      if (!headline && imageLink) {
        const imgLabel = imageLink.getAttribute("aria-label") || "";
        const authHeadline = imgLabel.match(/Author,\s*(.+)$/i);
        if (authHeadline) headline = cleanText(authHeadline[1]);
      }
    }

    if (!name) {
      name = getAllTextContent(commentEl, SELECTORS.commentAuthorTitle);
    }
    if (!headline) {
      headline = getAllTextContent(commentEl, SELECTORS.commentAuthorSubtitle);
    }

    return { name, headline };
  };

  // ─── Comment Extraction (Single Post Pages) ────────────────

  const extractComment = (commentEl) => {
    const { name: authorName, headline } = extractCommentAuthor(commentEl);
    const text = getAllTextContent(commentEl, SELECTORS.commentText);
    const timestamp = getAllTextContent(commentEl, SELECTORS.commentTimestamp);
    const likes = getEngagementCount(commentEl, SELECTORS.commentReactions);

    if (!text) return null;

    const replies = [];
    const replyContainer = commentEl.querySelector(SELECTORS.replyContainer);
    if (replyContainer) {
      const replyElements = replyContainer.querySelectorAll(SELECTORS.replyItem);
      for (const replyEl of replyElements) {
        const { name: replyAuthor, headline: replyHeadline } = extractCommentAuthor(replyEl);
        const reply = {
          author: replyAuthor,
          headline: replyHeadline,
          text: getAllTextContent(replyEl, SELECTORS.commentText),
          timestamp: getAllTextContent(replyEl, SELECTORS.commentTimestamp),
          likes: getEngagementCount(replyEl, SELECTORS.commentReactions),
        };
        if (reply.text) replies.push(reply);
      }
    }

    return {
      author: authorName,
      headline,
      text,
      timestamp,
      likes,
      replies,
    };
  };

  // ═══════════════════════════════════════════════════════════
  // ─── FEED PAGE EXTRACTION ─────────────────────────────────
  // LinkedIn's feed uses hashed CSS classes that change every deploy.
  // Instead, we use semantic anchors: role, aria-label, data-testid,
  // href patterns, and DOM structure (walking from known elements).
  // ═══════════════════════════════════════════════════════════

  const findFeedPosts = () => {
    const main = document.querySelector("main");
    if (!main) return [];

    // Feed posts are div[role="listitem"] inside main
    const listItems = main.querySelectorAll('div[role="listitem"]');
    if (listItems.length === 0) return [];

    // Filter: real posts have comment/reaction buttons or follow buttons
    const posts = [];
    for (const item of listItems) {
      const hasCommentBtn = item.querySelector('button[aria-label*="omment"]');
      const hasFollowBtn = item.querySelector('button[aria-label*="Follow"]');
      const hasProfileLink = item.querySelector('a[href*="/in/"]');
      const hasReactBtn = item.querySelector('button[aria-label*="React"], button[aria-label*="react"], button[aria-label*="Like"], button[aria-label*="like"]');

      if (hasCommentBtn || hasReactBtn || (hasFollowBtn && hasProfileLink)) {
        posts.push(item);
      }
    }

    return posts;
  };

  const findClosestToViewportCenter = (elements) => {
    if (elements.length === 0) return null;
    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let closestDist = Infinity;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = el;
      }
    }

    return closest;
  };

  const extractFeedPostAuthor = (postEl) => {
    let name = "";
    let headline = "";

    // Strategy 1: Follow button aria-label: "Follow [Name]"
    const followBtn = postEl.querySelector('button[aria-label*="Follow"]');
    if (followBtn) {
      const label = followBtn.getAttribute("aria-label") || "";
      const match = label.match(/^Follow\s+(.+)$/i);
      if (match) name = cleanText(match[1]);
    }

    // Strategy 2: Profile links (a[href*="/in/"]) outside comment area
    // Look for links with short, name-like text
    if (!name) {
      const profileLinks = postEl.querySelectorAll('a[href*="/in/"]');
      for (const link of profileLinks) {
        if (link.closest('[data-component-type="LazyColumn"]')) continue;
        const text = cleanText(link.textContent);
        if (text.length > 2 && text.length < 50 && !/follow|connect|view|verified/i.test(text)) {
          name = text;
          break;
        }
      }
    }

    // Strategy 3: aria-label on links: "View Name's profile"
    if (!name) {
      const links = postEl.querySelectorAll('a[aria-label]');
      for (const link of links) {
        if (link.closest('[data-component-type="LazyColumn"]')) continue;
        const label = link.getAttribute("aria-label") || "";
        const match = label.match(/(?:View\s+)?(.+?)'s\s+(?:profile|graphic)/i);
        if (match) {
          name = cleanText(match[1]);
          break;
        }
      }
    }

    // Strategy 4: Walk up from Follow button to find nearby text
    if (!name && followBtn) {
      let container = followBtn.parentElement;
      for (let i = 0; i < 4 && container; i++) {
        const links = container.querySelectorAll('a[href*="/in/"]');
        for (const link of links) {
          const text = cleanText(link.textContent);
          if (text.length > 2 && text.length < 50) {
            name = text;
            break;
          }
        }
        if (name) break;
        container = container.parentElement;
      }
    }

    // Strategy 5: For own posts (no Follow button), extract from the first
    // profile link's href: /in/username → look for nearby visible text
    if (!name) {
      const firstProfileLink = postEl.querySelector('a[href*="/in/"]');
      if (firstProfileLink && !firstProfileLink.closest('[data-component-type="LazyColumn"]')) {
        // The link might wrap an image (no text) but nearby siblings have the name
        let sibling = firstProfileLink.nextElementSibling;
        for (let i = 0; i < 3 && sibling; i++) {
          const text = cleanText(sibling.textContent);
          // Name: 2-50 chars, no pipes (headlines have pipes)
          if (text.length > 2 && text.length < 50 && !text.includes("|")) {
            name = text;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        // Try parent's text content if siblings didn't work
        if (!name && firstProfileLink.parentElement) {
          const parentText = cleanText(firstProfileLink.parentElement.textContent);
          // Take first line-like chunk (before bullet, pipe, or newline)
          const firstChunk = parentText.split(/[·•|\n]/)[0].trim();
          if (firstChunk.length > 2 && firstChunk.length < 50) {
            name = firstChunk;
          }
        }
      }
    }

    // Strategy 6: Extract from profile link href slug as last resort
    // /in/shadman-rahman-abc123 → "Shadman Rahman"
    if (!name) {
      const anyProfileLink = postEl.querySelector('a[href*="/in/"]');
      if (anyProfileLink && !anyProfileLink.closest('[data-component-type="LazyColumn"]')) {
        const href = anyProfileLink.getAttribute("href") || "";
        const slugMatch = href.match(/\/in\/([^/?]+)/);
        if (slugMatch) {
          const slug = slugMatch[1]
            .replace(/-[a-f0-9]{6,}$/i, "")
            .replace(/-\d{5,}$/, "")
            .replace(/-[a-z0-9]{8,}$/i, "");
          const parts = slug.split("-").filter(w => w.length > 0);
          if (parts.length >= 1 && parts.length <= 4) {
            name = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          }
        }
      }
    }

    // Strategy 7: Own post fallback — get name from the page's profile sidebar
    // LinkedIn always shows your name in the left sidebar on the feed page
    if (!name) {
      const sidebar = document.querySelector("aside, [data-test-id*='profile']");
      if (sidebar) {
        const sidebarLink = sidebar.querySelector('a[href*="/in/"]');
        if (sidebarLink) {
          const text = cleanText(sidebarLink.textContent);
          if (text.length > 2 && text.length < 50) {
            name = text;
          }
          if (!name) {
            const href = sidebarLink.getAttribute("href") || "";
            const slugMatch = href.match(/\/in\/([^/?]+)/);
            if (slugMatch) {
              const slug = slugMatch[1]
                .replace(/-[a-f0-9]{6,}$/i, "")
                .replace(/-\d{5,}$/, "")
                .replace(/-[a-z0-9]{8,}$/i, "");
              const parts = slug.split("-").filter(w => w.length > 0);
              if (parts.length >= 1 && parts.length <= 4) {
                name = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              }
            }
          }
        }
      }
    }

    // Strategy 8: Text-based extraction for own posts on the feed
    // The author name is VISIBLE TEXT at the top of the post, even if it's
    // not in an <a> tag. On the feed, own posts show: "[Name] · You · [time]"
    // or "[Name] · [time] · Edited". Extract from the container's first text.
    if (!name) {
      // Get the first ~300 chars of the post container text (before post body)
      const fullText = cleanText(postEl.textContent);
      // The post body text is long. Find it and take everything before it.
      const bodyText = cleanText(postEl.querySelector('[data-component-type="LazyColumn"]')?.textContent || "");
      let headerText = fullText;
      if (bodyText.length > 50) {
        const bodyIdx = fullText.indexOf(bodyText.substring(0, 50));
        if (bodyIdx > 0) headerText = fullText.substring(0, bodyIdx);
      }
      // If headerText is still the full text, just take the first 300 chars
      if (headerText.length > 300) headerText = headerText.substring(0, 300);

      // Strip hidden accessibility labels that LinkedIn injects
      // ("Feed post", "Promoted", etc.) and repost attribution text
      headerText = headerText
        .replace(/^(?:Feed post|Feed update|Promoted|Suggested|Sponsored|New post)\s*/i, "")
        .replace(/^.+?\s+reposted\s+this\s*/i, "")  // strip "Name reposted this" prefix
        .replace(/^.+?\s+reposted\s*/i, "")          // strip "Name reposted" prefix
        .trim();

      // Pattern: "Name · You · time" or "Name · connection · time · Edited"
      // The name is before the first "·" or "•"
      const nameMatch = headerText.match(/^(.+?)\s*[·•]/);
      if (nameMatch) {
        const candidate = cleanText(nameMatch[1]);
        // Valid name: 2-50 chars, not a known UI string
        if (candidate.length > 2 && candidate.length < 50 &&
            !/follow|comment|like|share|repost|report|send/i.test(candidate)) {
          name = candidate;
        }
      }

      // If no bullet separator, try: name is the first 2-4 words of the header
      if (!name && headerText.length > 5) {
        const words = headerText.split(/\s+/).slice(0, 4);
        const candidate = words.join(" ");
        // Check it looks name-like (starts with uppercase, short)
        if (candidate.length > 2 && candidate.length < 50 && /^[A-Z]/.test(candidate)) {
          name = candidate;
        }
      }
    }

    // Strategy 9: Search ALL /in/ links on the page outside posts
    // (sidebar, nav) as absolute last resort
    if (!name) {
      const allPageLinks = document.querySelectorAll('a[href*="/in/"]');
      for (const link of allPageLinks) {
        if (link.closest('[role="listitem"]')) continue;
        if (link.closest('[data-component-type="LazyColumn"]')) continue;
        const href = link.getAttribute("href") || "";
        const slugMatch = href.match(/\/in\/([^/?]+)/);
        if (slugMatch) {
          const text = cleanText(link.textContent);
          if (text.length > 2 && text.length < 50 && !/follow|connect|view|sign/i.test(text)) {
            name = text;
            break;
          }
          const slug = slugMatch[1]
            .replace(/-[a-f0-9]{6,}$/i, "")
            .replace(/-\d{5,}$/, "")
            .replace(/-[a-z0-9]{8,}$/i, "");
          const parts = slug.split("-").filter(w => w.length > 0);
          if (parts.length >= 1 && parts.length <= 4) {
            name = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          }
          break;
        }
      }
    }

    // ── Final cleanup: strip known contamination from ALL strategies ──
    if (name) {
      // Strip accessibility label prefixes
      name = name.replace(/^(?:Feed post|Feed update|Promoted|Suggested|Sponsored)\s*/i, "").trim();

      // If the name contains "reposted this", it means we captured the
      // reposter attribution instead of the actual post author.
      // For reposts, the ORIGINAL author's name appears AFTER "reposted this".
      if (/reposted\s+this/i.test(name)) {
        const afterRepost = name.replace(/^.+?reposted\s+this\s*/i, "").trim();
        // If there's text after "reposted this", that's the actual author
        if (afterRepost.length > 1 && afterRepost.length < 60) {
          name = afterRepost;
        } else {
          // Otherwise strip the "reposted this" suffix, leaving the reposter
          name = name.replace(/\s*reposted\s+this.*$/i, "").trim();
        }
      }
      // Also handle "Name reposted" (without "this")
      name = name.replace(/\s*reposted\s*$/i, "").trim();
    }

    return { name: name || "Unknown Author", headline };
  };

  // Patterns that indicate UI chrome, not post content
  // VIDEO_SETTINGS_FULL matches the entire concatenated caption settings blob
  // that LinkedIn renders inside the video player (no spaces between options).
  // It matches strings like "TextColorWhiteBlackRedGreen...OpaqueSemi-Transparent..."
  const VIDEO_SETTINGS_FULL = /TextColor.*?Opaque|Caption Area.*?Opaque|Font Size.*?400%|Text Edge.*?Drop shadow|Font Family.*?Small Caps|Proportional Sans-Serif.*?Small Caps/i;
  const VIDEO_SETTINGS_KEYWORD = /TextColor|Caption Area|Font Size|Text Edge|Font Family|Proportional Sans-Serif|Monospace Sans-Serif|Proportional Serif|Semi-Transparent/i;
  const UI_CHROME_PATTERN = /Report this post|Copy link to post|Send in a private message|Embed this post/i;
  const HEADLINE_PATTERN = /^[^.!?]{5,80}(?:\s*[|·•]\s*[^.!?]{5,80})*$/; // "Title | Role | Company" format

  const extractFeedPostText = (postEl) => {
    // The comment list is inside [data-component-type="LazyColumn"]
    // Post text is everything ABOVE that in the DOM tree.
    // Strategy: clone, remove non-content areas, find the best text block.

    // ── Strategy 0: "see more" expansion (before cloning) ──
    // LinkedIn truncates long posts with a "see more" button. Click it first
    // so the full text is in the DOM when we clone.
    const seeMoreBtns = postEl.querySelectorAll('button[aria-label*="see more"], button[aria-label*="See more"]');
    for (const btn of seeMoreBtns) {
      // Only click buttons that are NOT inside the comment area
      if (!btn.closest('[data-component-type="LazyColumn"]')) {
        try { btn.click(); } catch (e) { /* ignore */ }
      }
    }

    const clone = postEl.cloneNode(true);

    // Remove comment list
    clone.querySelectorAll('[data-component-type="LazyColumn"]').forEach(cl => cl.remove());

    // Remove buttons (action bar)
    clone.querySelectorAll("button").forEach(btn => btn.remove());

    // ── Video/media cleanup ──
    // Remove <video>, <track>, <iframe> elements
    clone.querySelectorAll("video, track, iframe").forEach(el => el.remove());

    // Remove the video caption settings blob. LinkedIn renders all video
    // player caption settings as a single concatenated text node like:
    // "TextColorWhiteBlackRedGreen...OpaqueSemi-Transparent...Small Caps"
    // This can be 300+ chars and pollutes post text extraction.
    // Strategy: walk all elements bottom-up. If an element's text matches
    // the full settings blob pattern, remove the SMALLEST ancestor that
    // contains ONLY video settings (not mixed with post text).
    clone.querySelectorAll("div, span, section").forEach(el => {
      const text = cleanText(el.textContent);
      // Match the full blob (multiple settings concatenated)
      if (VIDEO_SETTINGS_FULL.test(text)) {
        // Check if this element also contains non-settings text
        const stripped = text
          .replace(/TextColor.*?(?=Caption Area|Font Size|Text Edge|$)/gi, "")
          .replace(/Caption Area.*?(?=Font Size|Text Edge|$)/gi, "")
          .replace(/Font Size.*?(?=Text Edge|Font Family|$)/gi, "")
          .replace(/Text Edge.*?(?=Font Family|$)/gi, "")
          .replace(/Font Family.*?$/gi, "")
          .replace(/Opaque|Semi-Transparent|Transparent/gi, "")
          .replace(/\d+%/g, "")
          .trim();
        // If almost nothing is left after stripping, safe to remove
        if (stripped.length < 50) {
          el.remove();
          return;
        }
      }
      // Also catch individual settings fragments
      if (VIDEO_SETTINGS_KEYWORD.test(text) && text.length < 200 && el.children.length < 5) {
        el.remove();
      }
    });

    // Remove profile link areas (author section at top of post)
    clone.querySelectorAll('a[href*="/in/"]').forEach(a => a.remove());

    // Remove small UI fragments and hidden accessibility labels
    clone.querySelectorAll('a[href*="follow"]').forEach(el => {
      if (cleanText(el.textContent).length < 30) el.remove();
    });
    // Remove visually-hidden elements (screen reader labels like "Feed post",
    // "Promoted", "Suggested") that pollute text extraction
    clone.querySelectorAll('.visually-hidden, [class*="visually-hidden"], span[aria-hidden="true"]').forEach(el => {
      el.remove();
    });
    // Also remove elements with common LinkedIn a11y label patterns
    clone.querySelectorAll("span, div").forEach(el => {
      const text = cleanText(el.textContent);
      if (el.children.length === 0 && text.length < 30 &&
          /^(Feed post|Feed update|Promoted|Suggested|Sponsored|New post)$/i.test(text)) {
        el.remove();
      }
    });

    // ── Repost attribution: detect "reposted this" ──
    // Check the CLEANED clone text for repost signals.
    // LinkedIn shows "Name reposted this" or "Name reposted" at the top.
    let repostPrefix = "";
    let cleanedCloneText = cleanText(clone.textContent);
    // Strip any remaining "Feed post" / "Feed update" prefix artifacts
    cleanedCloneText = cleanedCloneText.replace(/^(?:Feed post|Feed update|Promoted|Suggested|Sponsored)\s*/i, "");

    const repostMatch = cleanedCloneText.match(/^(.+?)\s+reposted(?:\s+this)?/i);
    if (repostMatch) {
      const reposter = repostMatch[1].trim();
      if (reposter.length > 1 && reposter.length < 60 && !VIDEO_SETTINGS_KEYWORD.test(reposter)) {
        repostPrefix = `[Reposted by ${reposter}]\n\n`;
      }
    }

    // Find text blocks: leaf-ish elements with substantial content
    const candidates = [];
    const allEls = clone.querySelectorAll("div, span, p");
    for (const el of allEls) {
      if (el.querySelectorAll("div, span, p").length > 10) continue;
      const text = cleanText(el.textContent);
      if (text.length < 20) continue;

      // Skip video settings, UI chrome, and pure headline patterns
      if (VIDEO_SETTINGS_FULL.test(text)) continue;
      if (VIDEO_SETTINGS_KEYWORD.test(text) && text.length < 200) continue;
      if (UI_CHROME_PATTERN.test(text)) continue;

      // Skip repost attribution line itself
      if (/reposted this/i.test(text) && text.length < 60) continue;

      // Score: prefer longer text, penalize headline-like patterns
      let score = text.length;
      if (HEADLINE_PATTERN.test(text)) score *= 0.3; // Likely a headline, not post body
      if (text.includes("|") && text.length < 100) score *= 0.5; // Short text with pipes = headline

      candidates.push({ text, score });
    }

    candidates.sort((a, b) => b.score - a.score);

    // Return best candidate with repost prefix if applicable
    if (candidates.length > 0) {
      return repostPrefix + candidates[0].text;
    }

    return "";
  };

  const detectFeedPostType = (postEl) => {
    // Use aria-labels and generic patterns since classes are hashed
    if (postEl.querySelector('video, [aria-label*="video"], [data-testid*="video"]')) return "video";
    if (postEl.querySelector('[aria-label*="poll"], [data-testid*="poll"]')) return "poll";
    if (postEl.querySelector('[aria-label*="document"], [aria-label*="carousel"]')) return "document/carousel";
    if (postEl.querySelector('[aria-label*="article"]')) return "article";
    if (postEl.querySelector('img[src*="media"]')) return "image";
    return "text";
  };

  const isFeedMyPost = (postEl) => {
    // ── Check 1: Edit button is a strong signal ──
    const editBtn = postEl.querySelector('button[aria-label*="Edit"], button[aria-label*="edit post"]');
    if (editBtn) return true;

    // ── Check 2: "· You ·" text in the author header area ──
    // LinkedIn shows "Name · You · 2d" for your own posts
    // Only check the header area (above LazyColumn) to avoid matching
    // "You" in comment text
    const headerText = (() => {
      const fullText = cleanText(postEl.textContent);
      const commentArea = postEl.querySelector('[data-component-type="LazyColumn"]');
      if (commentArea) {
        const commentText = cleanText(commentArea.textContent);
        const idx = fullText.indexOf(commentText.substring(0, 50));
        if (idx > 0) return fullText.substring(0, idx);
      }
      return fullText.substring(0, 300);
    })();

    if (/[·•]\s*You\s*[·•]/i.test(headerText)) return true;

    // ── Check 3: No Follow button is suggestive but NOT conclusive ──
    // Company pages, connection posts, and promoted posts may also lack
    // a Follow button. Only treat as own post if we also found "You".
    const hasFollowBtn = postEl.querySelector('button[aria-label*="Follow"]');
    if (hasFollowBtn) return false;

    // Weaker signals: check for analytics/view count (only shown on own posts)
    const analyticsBtn = postEl.querySelector('button[aria-label*="analytics"], button[aria-label*="impression"], button[aria-label*="view"]');
    if (analyticsBtn) return true;

    // Default: if no Follow button and no strong signal either way,
    // default to COMMENT mode (safer: avoids showing "reply to all" for
    // posts that aren't actually yours)
    return false;
  };

  const extractFeedComments = (postEl) => {
    // Comments live inside [data-component-type="LazyColumn"]
    const commentList = postEl.querySelector('[data-component-type="LazyColumn"]');
    if (!commentList) return [];

    const comments = [];

    // Strategy 1: Standard comment selectors (single post page classes)
    const commentElements = commentList.querySelectorAll(SELECTORS.commentItem);
    if (commentElements.length > 0) {
      const seenIds = new Set();
      for (const commentEl of commentElements) {
        if (commentEl.closest(SELECTORS.replyContainer)) continue;
        const dataId = commentEl.getAttribute("data-id");
        if (dataId) {
          if (seenIds.has(dataId)) continue;
          seenIds.add(dataId);
        }
        const comment = extractComment(commentEl);
        if (comment) comments.push(comment);
      }
      if (comments.length > 0) return comments;
    }

    // Strategy 2: Top-down feed comment extraction
    // LinkedIn feed comments live as subtrees inside LazyColumn.
    // DOM structure (hashed classes, but stable shape):
    //
    //   LazyColumn
    //     └── wrapper-div
    //           └── comment-block  ← we want THIS level
    //                 ├── author-section (photo, name, headline, timestamp)
    //                 └── body-section (actual comment text)
    //                 └── action-bar (Like, Reply buttons)
    //
    // Previous approach walked UP from profile links and stopped too early
    // (at author-section, missing body-section). This approach walks DOWN
    // from LazyColumn, finding comment blocks by their profile links,
    // then extracts body text from within each block.

    // Find comment blocks: walk LazyColumn's descendants looking for
    // elements that contain exactly one profile link cluster + text.
    // We look for containers at an appropriate depth that have profile links.
    const allProfileLinks = commentList.querySelectorAll('a[href*="/in/"]');
    if (allProfileLinks.length === 0) return comments;

    // Group profile links by their comment-block ancestor.
    // A comment block is the highest ancestor (below LazyColumn) that
    // contains a profile link. We find it by walking up from each link.
    const commentBlocks = new Map(); // element → first profile link

    for (const link of allProfileLinks) {
      // Walk up to find the comment block boundary:
      // It's a direct child (or grandchild) of LazyColumn
      let el = link;
      let prevEl = link;
      while (el && el !== commentList && el.parentElement !== commentList) {
        prevEl = el;
        el = el.parentElement;
      }
      // el is now either commentList (link is direct child, unlikely)
      // or el.parentElement === commentList (el is the comment block)
      const block = (el === commentList) ? prevEl : el;

      if (!commentBlocks.has(block)) {
        commentBlocks.set(block, link);
      }
    }

    // Process each comment block
    const visited = new Set();

    for (const [block, firstLink] of commentBlocks) {
      const fullText = cleanText(block.textContent);

      // Skip tiny blocks (UI fragments) or huge blocks (nested comment lists)
      if (fullText.length < 10 || fullText.length > 3000) continue;

      // Dedup
      const key = fullText.substring(0, 100);
      if (visited.has(key)) continue;
      visited.add(key);

      // ── Extract author name ──
      let authorName = "";
      // Try ALL profile links in the block (not just the first one)
      const blockProfileLinks = block.querySelectorAll('a[href*="/in/"]');
      for (const authorLink of blockProfileLinks) {
        // Strategy A: aria-label "View Name's profile/graphic link"
        const label = authorLink.getAttribute("aria-label") || "";
        const ariaMatch = label.match(/(?:View\s+)?(.+?)(?:'s\s+(?:profile|graphic)|$)/i);
        if (ariaMatch && ariaMatch[1].length > 2 && ariaMatch[1].length < 50) {
          authorName = cleanText(ariaMatch[1]);
          break;
        }
        // Strategy B: link text, strip badges and connection info
        const linkText = cleanText(authorLink.textContent);
        if (linkText.length > 2 && linkText.length < 80) {
          const namePart = linkText.split(/\s*(?:Verified Profile|Premium Profile|[·•]|\d+(?:st|nd|rd|th)\+?)\s*/)[0];
          if (namePart.length > 2 && namePart.length < 50) {
            authorName = namePart.trim();
            break;
          }
        }
      }
      // Strategy C (last resort): extract from href: /in/first-last → "First Last"
      // This produces less reliable names so only use if A and B failed.
      // Also try the link's title attribute first.
      if (!authorName && blockProfileLinks.length > 0) {
        // Try title attribute (some LinkedIn links have title="Name · Headline")
        for (const link of blockProfileLinks) {
          const title = link.getAttribute("title") || "";
          if (title.length > 2 && title.length < 80) {
            const namePart = title.split(/\s*[·•|]\s*/)[0].trim();
            if (namePart.length > 2 && namePart.length < 50) {
              authorName = namePart;
              break;
            }
          }
        }

        // Fall back to slug parsing
        if (!authorName) {
          const href = blockProfileLinks[0].getAttribute("href") || "";
          const slugMatch = href.match(/\/in\/([^/?]+)/);
          if (slugMatch) {
            // Strip trailing identifiers: hex hash, numeric ID, or mixed alphanumeric
            // Examples: "john-doe-a1b2c3d4" → "john-doe"
            //           "jane-smith-123456789" → "jane-smith"
            const slug = slugMatch[1]
              .replace(/-[a-f0-9]{6,}$/i, "")   // hex hash
              .replace(/-\d{5,}$/, "")            // numeric ID
              .replace(/-[a-z0-9]{8,}$/i, "");    // mixed alphanumeric
            // Only use slug-derived names if they look like actual names (2-4 parts)
            const parts = slug.split("-").filter(w => w.length > 0);
            if (parts.length >= 1 && parts.length <= 4) {
              authorName = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            }
          }
        }
      }

      // Clean author name: strip trailing badges
      authorName = authorName
        .replace(/\s*(?:Premium|Verified)\s*(?:Profile)?\s*$/i, "")
        .trim();

      // ── Extract timestamp ──
      // LinkedIn concatenates timestamps directly to text: "Certified3dAnd then..."
      // Use a regex that doesn't require \b word boundaries
      let timestamp = "";
      const tsMatch = fullText.match(/(\d+[mhdws]+)(?=[A-Z\s]|Reaction|Like|Reply|$)/);
      if (tsMatch) timestamp = tsMatch[1];

      // ── Extract headline ──
      // Pattern: "Name • [degree] Headline [timestamp]"
      let authorHeadline = "";
      if (timestamp) {
        const hlMatch = fullText.match(/[·•]\s*(?:1st|2nd|3rd|\d+\w*\+?)\s*(.+?)(?=\d+[mhdws]+)/);
        if (hlMatch) {
          authorHeadline = cleanText(hlMatch[1]);
        }
      }

      // ── Extract actual comment text ──
      // The comment body follows the LAST timestamp in the fullText.
      // LinkedIn's comment metadata repeats the author name and headline,
      // ending with a timestamp like "3d" or "1w", then the actual comment text.
      let commentText = "";

      if (timestamp) {
        // Find all occurrences of the timestamp pattern
        const escapedTs = timestamp.replace(/([+*?.()\[\]{}|\\^$])/g, "\\$1");
        const tsRegex = new RegExp(escapedTs, "g");
        let lastTsEnd = -1;
        let match;
        while ((match = tsRegex.exec(fullText)) !== null) {
          lastTsEnd = match.index + timestamp.length;
        }

        if (lastTsEnd >= 0) {
          let afterTs = fullText.substring(lastTsEnd).trim();

          // Strip trailing UI chrome (reaction buttons, counts, action labels)
          afterTs = afterTs
            .replace(/\s*Reaction button state:\s*[^\n]*/gi, "")
            .replace(/\s*\d+\s*(?:reactions?|replies|reply)\s*/gi, " ")
            .replace(/\s*(?:Like|Reply|Report|Translate|Repost|Send)\s*/gi, " ")
            .replace(/\s+/g, " ")
            .trim();

          // Remove trailing numbers (reaction counts: "2 reactions2" → clean)
          afterTs = afterTs.replace(/\s*\d+\s*$/, "").trim();

          if (afterTs.length > 3) {
            commentText = afterTs;
          }
        }
      }

      // Fallback: clone-and-strip approach (when timestamp detection fails)
      if (!commentText) {
        const clone = block.cloneNode(true);
        // Remove all <a> tags (profile links = author area)
        clone.querySelectorAll("a").forEach(a => a.remove());
        // Remove all buttons (action bar)
        clone.querySelectorAll("button").forEach(b => b.remove());
        // Remove badge/chrome spans
        clone.querySelectorAll("span").forEach(s => {
          const t = cleanText(s.textContent);
          if (t.length < 25 && /^(Verified Profile|Premium Profile|\d+(?:st|nd|rd|th)\+?|[·•]|\d+[mhdws]+)$/i.test(t)) {
            s.remove();
          }
        });

        let remaining = cleanText(clone.textContent);
        // Strip author name, connection degree, headline patterns
        if (authorName) remaining = remaining.split(authorName).join("").trim();
        remaining = remaining
          .replace(/^\s*[·•]\s*/g, "")
          .replace(/^\s*\d+(?:st|nd|rd|th)\+?\s*/i, "")
          .replace(/\s*Reaction button state:\s*[^\n]*/gi, "")
          .replace(/\s*(?:Like|Reply|Report|Translate)\s*$/gi, "")
          .trim();

        if (remaining.length > 20) {
          if (authorHeadline && remaining.startsWith(authorHeadline)) {
            remaining = remaining.substring(authorHeadline.length).trim();
          }
          if (timestamp) {
            const escapedTs = timestamp.replace(/([+*?.()\[\]{}|\\^$])/g, "\\$1");
            remaining = remaining.replace(new RegExp(`^\\s*${escapedTs}\\s*`), "").trim();
          }
          if (remaining.length > 3) commentText = remaining;
        }
      }

      if (commentText && commentText.length > 3) {
        comments.push({
          author: authorName || "Unknown",
          headline: authorHeadline,
          text: commentText,
          timestamp,
          likes: 0,
          replies: [],
        });
      }
    }

    return comments;
  };

  // ─── Post URL Extraction ──────────────────────────────────
  // On single-post pages, window.location.href is the correct URL.
  // On the feed page, window.location.href is just /feed/ for ALL posts.
  // We extract the actual post permalink from the DOM element.

  const extractPostUrl = (postEl, isFeedPage) => {
    // Strategy 1: data-urn attribute → construct permalink
    const urn = postEl.getAttribute("data-urn") || postEl.getAttribute("data-id") || "";
    if (urn) {
      const activityMatch = urn.match(/urn:li:activity:(\d+)/);
      if (activityMatch) {
        return `https://www.linkedin.com/feed/update/urn:li:activity:${activityMatch[1]}/`;
      }
      const ugcMatch = urn.match(/urn:li:ugcPost:(\d+)/);
      if (ugcMatch) {
        return `https://www.linkedin.com/feed/update/urn:li:ugcPost:${ugcMatch[1]}/`;
      }
    }

    // Strategy 2: Find a permalink link in the post (timestamp links usually point to the post)
    const timeLink = postEl.querySelector('a[href*="/feed/update/"], a[href*="/posts/"]');
    if (timeLink) {
      const href = timeLink.getAttribute("href") || "";
      if (href.startsWith("http")) return href.split("?")[0];
      if (href.startsWith("/")) return `https://www.linkedin.com${href.split("?")[0]}`;
    }

    // Strategy 3: For feed posts, look for any link containing activity URN
    if (isFeedPage) {
      const allLinks = postEl.querySelectorAll("a[href]");
      for (const link of allLinks) {
        const href = link.getAttribute("href") || "";
        const match = href.match(/(\/feed\/update\/urn:li:(?:activity|ugcPost):\d+)/);
        if (match) return `https://www.linkedin.com${match[1]}/`;
      }
    }

    // Fallback: current page URL (correct for single-post pages)
    return window.location.href;
  };

  // ═══════════════════════════════════════════════════════════
  // ─── MAIN EXTRACTION (unified entry point) ─────────────────
  // ═══════════════════════════════════════════════════════════

  // ─── URN Extraction from URL ─────────────────────────────
  // LinkedIn URLs encode the post identity as a URN, e.g.:
  //   /feed/update/urn:li:activity:1234567890/
  //   /feed/update/urn:li:ugcPost:1234567890/
  // We use this to find the EXACT post element in the DOM,
  // avoiding stale elements from the feed behind an overlay.

  const extractUrnFromUrl = () => {
    const path = window.location.pathname;
    const activityMatch = path.match(/\/feed\/update\/urn:li:(?:activity|ugcPost):(\d+)/);
    if (activityMatch) return activityMatch[0].replace("/feed/update/", "");
    return null;
  };

  const findPostByUrn = (urn) => {
    if (!urn) return null;
    // Try exact data-urn match
    const byUrn = document.querySelector(`[data-urn="${urn}"], [data-urn*="${urn}"]`);
    if (byUrn) return byUrn;
    // Try data-id match
    const byId = document.querySelector(`[data-id="${urn}"], [data-id*="${urn}"]`);
    if (byId) return byId;
    // Extract numeric ID and search more broadly
    const idMatch = urn.match(/(\d+)$/);
    if (idMatch) {
      const numericId = idMatch[1];
      const byPartial = document.querySelector(`[data-urn*="${numericId}"], [data-id*="${numericId}"]`);
      if (byPartial) return byPartial;
    }
    return null;
  };

  // LinkedIn opens posts in modal/overlay containers when clicked from the feed.
  // The overlay sits on top of the feed, so we should extract from it first.
  const findOverlayPost = () => {
    // LinkedIn's modal overlays use role="dialog" or specific overlay classes
    const overlaySelectors = [
      '[role="dialog"] .feed-shared-update-v2',
      '[role="dialog"] .occludable-update',
      '[role="dialog"] [data-urn*="urn:li:activity"]',
      '.scaffold-layout-overlay .feed-shared-update-v2',
      '.scaffold-layout-overlay [data-urn*="urn:li:activity"]',
      '.artdeco-modal .feed-shared-update-v2',
      '.artdeco-modal [data-urn*="urn:li:activity"]',
      // LinkedIn's detail overlay uses this pattern
      '.scaffold-finite-scroll--infinite .feed-shared-update-v2',
    ];
    for (const sel of overlaySelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  };

  const extractPost = () => {
    let postEl = null;
    let isFeedPage = false;

    // Check if we're on a single post page
    const isSinglePostPage = window.location.pathname.includes("/feed/update/") ||
      window.location.pathname.includes("/posts/");

    if (isSinglePostPage) {
      // ── Single post page: find the CORRECT post ──
      // LinkedIn's SPA keeps old feed items in the DOM behind overlays.
      // We must find the specific post matching the current URL, not just
      // the first .feed-shared-update-v2 in DOM order.

      // Priority 1: Match by URN from URL (most reliable)
      const urn = extractUrnFromUrl();
      postEl = findPostByUrn(urn);

      // Priority 2: Check for overlay/modal container
      if (!postEl) {
        postEl = findOverlayPost();
      }

      // Priority 3: Fall back to generic selectors (original behavior)
      if (!postEl) {
        postEl = document.querySelector(SELECTORS.singlePost) ||
          document.querySelector(SELECTORS.feedPost);
      }
    } else {
      // ── Feed or other page: try class-based first, then feed strategy ──
      const posts = document.querySelectorAll(SELECTORS.feedPost);
      if (posts.length > 0) {
        postEl = findClosestToViewportCenter(Array.from(posts));
      }
    }

    // Fallback 1: actor-based detection (single post pages with odd containers)
    if (!postEl) {
      const actorEls = document.querySelectorAll(".update-components-actor");
      const viewportCenter = window.innerHeight / 2;
      let closestDistance = Infinity;
      for (const actor of actorEls) {
        let candidate = actor.parentElement;
        for (let i = 0; i < 5 && candidate; i++) {
          if (candidate.querySelector(".update-components-text, .feed-shared-text") &&
              candidate.querySelector(".social-details-social-counts, button[aria-label*='comment']")) {
            const rect = candidate.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const distance = Math.abs(center - viewportCenter);
            if (distance < closestDistance) {
              closestDistance = distance;
              postEl = candidate;
            }
            break;
          }
          candidate = candidate.parentElement;
        }
      }
    }

    // Fallback 2: FEED PAGE strategy (semantic selectors)
    if (!postEl) {
      const feedPosts = findFeedPosts();
      if (feedPosts.length > 0) {
        postEl = findClosestToViewportCenter(feedPosts);
        isFeedPage = true;
      }
    }

    if (!postEl) {
      return { error: "No LinkedIn post found on this page. Make sure you're viewing a post." };
    }

    // ── FEED PAGE extraction path ──
    if (isFeedPage) {
      const { name: authorName, headline: authorHeadline } = extractFeedPostAuthor(postEl);
      const postText = extractFeedPostText(postEl);
      const myPost = isFeedMyPost(postEl);
      const postType = detectFeedPostType(postEl);
      const comments = extractFeedComments(postEl);

      // ── Engagement counts (multi-strategy) ──
      // LinkedIn renders counts in different ways across feed variants:
      //   1. Button aria-labels: "Like: 42 reactions"
      //   2. Standalone text near the social bar: "42" next to a reaction icon
      //   3. Anchor text: "42 comments" as a clickable link
      //   4. Text content: "42 reactions · 5 comments · 2 reposts"
      let likeCount = 0;
      let commentCountNum = 0;

      // Strategy 1: button aria-labels (existing)
      const allBtns = postEl.querySelectorAll("button[aria-label]");
      for (const btn of allBtns) {
        if (btn.closest('[data-component-type="LazyColumn"]')) continue;
        const label = btn.getAttribute("aria-label") || "";
        const likeMatch = label.match(/(\d[\d,]*)\s*(?:reaction|like)/i);
        if (likeMatch) likeCount = parseInt(likeMatch[1].replace(/,/g, ""), 10);
        const commentMatch = label.match(/(\d[\d,]*)\s*comment/i);
        if (commentMatch) commentCountNum = parseInt(commentMatch[1].replace(/,/g, ""), 10);
      }

      // Strategy 2: text-based extraction from the social bar area
      // The social bar is between the post body and the comment list.
      // Look for text patterns like "42 reactions" or "5 comments"
      if (likeCount === 0 || commentCountNum === 0) {
        // Get text between action buttons and LazyColumn
        const socialBarText = (() => {
          const clone = postEl.cloneNode(true);
          // Remove comment list and post body (keep just the social bar)
          clone.querySelectorAll('[data-component-type="LazyColumn"]').forEach(el => el.remove());
          // Social bar is typically in the last section before comments
          const text = cleanText(clone.textContent);
          // Take the last 200 chars (social bar is near the bottom of the post)
          return text.slice(-200);
        })();

        if (likeCount === 0) {
          const match = socialBarText.match(/(\d[\d,]*)\s*(?:reaction|like)/i);
          if (match) likeCount = parseInt(match[1].replace(/,/g, ""), 10);
        }
        if (commentCountNum === 0) {
          const match = socialBarText.match(/(\d[\d,]*)\s*comment/i);
          if (match) commentCountNum = parseInt(match[1].replace(/,/g, ""), 10);
        }
      }

      // Strategy 3: aria-label on links/spans (LinkedIn sometimes wraps counts in links)
      if (likeCount === 0 || commentCountNum === 0) {
        const ariaEls = postEl.querySelectorAll("[aria-label]");
        for (const el of ariaEls) {
          if (el.closest('[data-component-type="LazyColumn"]')) continue;
          const label = el.getAttribute("aria-label") || "";
          if (likeCount === 0) {
            const m = label.match(/(\d[\d,]*)\s*(?:reaction|like)/i);
            if (m) likeCount = parseInt(m[1].replace(/,/g, ""), 10);
          }
          if (commentCountNum === 0) {
            const m = label.match(/(\d[\d,]*)\s*comment/i);
            if (m) commentCountNum = parseInt(m[1].replace(/,/g, ""), 10);
          }
        }
      }

      return {
        mode: myPost ? "REPLY" : "COMMENT",
        post: {
          author: authorName,
          headline: authorHeadline,
          text: postText,
          type: postType,
          url: extractPostUrl(postEl, true),
        },
        engagement: {
          likes: likeCount,
          comments: commentCountNum,
        },
        comments,
        extractedAt: new Date().toISOString(),
        _debug: { strategy: "feed", postsFound: findFeedPosts().length },
      };
    }

    // ── SINGLE POST PAGE extraction path (original logic) ──
    const { name: authorName, headline: authorHeadline } = extractPostAuthor(postEl);
    const postType = detectPostType(postEl);
    const myPost = isMyPost(postEl);

    const seeMoreBtn = postEl.querySelector(SELECTORS.postSeeMore);
    if (seeMoreBtn) {
      seeMoreBtn.click();
    }

    const postText = getAllTextContent(postEl, SELECTORS.postText);
    const likes = getEngagementCount(postEl, SELECTORS.likeCount);
    const commentCountNum = getEngagementCount(postEl, SELECTORS.commentCount);

    const comments = [];
    let commentElements = postEl.querySelectorAll(SELECTORS.commentItem);

    if (commentElements.length === 0) {
      commentElements = document.querySelectorAll(SELECTORS.commentItem);
    }

    const seenIds = new Set();
    for (const commentEl of commentElements) {
      if (commentEl.closest(SELECTORS.replyContainer)) continue;
      const dataId = commentEl.getAttribute("data-id");
      if (dataId) {
        if (seenIds.has(dataId)) continue;
        seenIds.add(dataId);
      }
      const comment = extractComment(commentEl);
      if (comment) comments.push(comment);
    }

    return {
      mode: myPost ? "REPLY" : "COMMENT",
      post: {
        author: authorName,
        headline: authorHeadline,
        text: postText,
        type: postType,
        url: extractPostUrl(postEl, false),
      },
      engagement: {
        likes,
        comments: commentCountNum,
      },
      comments,
      extractedAt: new Date().toISOString(),
      _debug: { strategy: "single-post" },
    };
  };

  // ─── Markdown Formatter ─────────────────────────────────────

  const formatAsMarkdown = (data) => {
    if (data.error) return `Error: ${data.error}`;

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
            lines.push(`   - **@${reply.author}**${replyLikes}: ${reply.text}`);
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

  // ─── Message Handler ────────────────────────────────────────
  // Version guard: if a newer content.js has been injected, this listener
  // silently yields so only the freshest code responds. This prevents
  // stale listeners from returning wrong/missing data after SPA navigation
  // or popup re-injection.

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (window.__riffContentScriptVersion !== MY_VERSION) {
      // A newer injection exists; let it handle the message
      return false;
    }

    if (request.action === "ping") {
      // Lightweight readiness check: verify the DOM has content matching
      // the current URL. Used by popup.js to poll until LinkedIn's SPA
      // has finished rendering after navigation.
      const urn = extractUrnFromUrl();
      if (urn) {
        // Single post page: ready when we can find the post by URN or in an overlay
        const found = findPostByUrn(urn) || findOverlayPost();
        sendResponse({ ready: !!found, url: window.location.href });
      } else {
        // Feed page or non-post page: always ready
        sendResponse({ ready: true, url: window.location.href });
      }
      return true;
    }
    if (request.action === "extract") {
      const data = extractPost();
      const markdown = formatAsMarkdown(data);
      sendResponse({ data, markdown });
    }
    if (request.action === "diagnose") {
      // ── Enhanced diagnostic: captures feed structure in detail ──

      const commentBtns = document.querySelectorAll('button[aria-label*="comment"], button[aria-label*="Comment"]');
      const postAncestors = [];

      for (const btn of Array.from(commentBtns).slice(0, 2)) {
        const ancestors = [];
        let el = btn.parentElement;
        for (let i = 0; i < 12 && el && el !== document.body; i++) {
          ancestors.push({
            tag: el.tagName.toLowerCase(),
            classes: (el.className || "").toString().split(" ").filter(c => c.length > 0 && c.length < 60).slice(0, 5),
            role: el.getAttribute("role"),
            dataAttrs: Array.from(el.attributes).filter(a => a.name.startsWith("data-")).map(a => `${a.name}=${a.value.substring(0, 40)}`).slice(0, 3),
            ariaLabel: (el.getAttribute("aria-label") || "").substring(0, 50),
          });
          el = el.parentElement;
        }
        postAncestors.push(ancestors);
      }

      // ── Feed post structure scan ──
      const main = document.querySelector("main");
      const feedPostScan = [];
      if (main) {
        const listItems = main.querySelectorAll('div[role="listitem"]');
        for (const item of Array.from(listItems).slice(0, 3)) {
          const scan = {
            hasCommentBtn: !!item.querySelector('button[aria-label*="omment"]'),
            hasFollowBtn: !!item.querySelector('button[aria-label*="Follow"]'),
            followLabel: (item.querySelector('button[aria-label*="Follow"]')?.getAttribute("aria-label") || "").substring(0, 60),
            profileLinks: Array.from(item.querySelectorAll('a[href*="/in/"]')).slice(0, 3).map(a => ({
              href: (a.getAttribute("href") || "").substring(0, 50),
              text: cleanText(a.textContent).substring(0, 40),
              ariaLabel: (a.getAttribute("aria-label") || "").substring(0, 60),
            })),
            hasLazyColumn: !!item.querySelector('[data-component-type="LazyColumn"]'),
            buttonLabels: Array.from(item.querySelectorAll("button[aria-label]"))
              .filter(b => !b.closest('[data-component-type="LazyColumn"]'))
              .slice(0, 8)
              .map(b => (b.getAttribute("aria-label") || "").substring(0, 60)),
            textPreview: cleanText(item.textContent).substring(0, 200),
          };
          feedPostScan.push(scan);
        }
      }

      const report = {
        url: window.location.href,
        commentBtns: commentBtns.length,
        likeBtns: document.querySelectorAll('button[aria-label*="Like"], button[aria-label*="like"]').length,
        reactBtns: document.querySelectorAll('button[aria-label*="React"], button[aria-label*="react"]').length,
        followBtns: document.querySelectorAll('button[aria-label*="Follow"]').length,
        timeEls: document.querySelectorAll("time").length,
        articles: document.querySelectorAll("article").length,
        mainEl: main ? "exists" : "none",
        listItemsInMain: main ? main.querySelectorAll('div[role="listitem"]').length : 0,
        lazyColumns: document.querySelectorAll('[data-component-type="LazyColumn"]').length,
        postAncestors,
        feedPostScan,
      };
      sendResponse({ report });
    }
    if (request.action === "loadMoreComments") {
      // Try standard selectors first, then generic feed buttons
      let buttons = document.querySelectorAll(SELECTORS.loadMoreComments);
      let clicked = 0;

      if (buttons.length === 0) {
        // Feed fallback: look for buttons with "load" or "more" in aria-label
        buttons = document.querySelectorAll('button[aria-label*="oad more"], button[aria-label*="previous"], button[aria-label*="more comment"]');
      }

      for (const btn of buttons) {
        btn.click();
        clicked++;
      }
      sendResponse({ clicked });
    }
    return true;
  });
})();
