---
created: 2026-10-31
type: plan
status: complete
tags: [riff, long-task]
---

```text
TASK:   One click on Riff, from the LinkedIn feed or a post page, puts the post and every comment on the clipboard as clean text ready to paste into Claude Code.
OUTPUT: _opensource/riff (content.js, popup.js), loaded unpacked in Shadman's Chrome; no Store upload
CHECKS: 1. Feed run on a post with 20+ comments: Riff's comment count = LinkedIn's count (±2 for deleted or hidden ones)
        2. Post-page run on the same post gives the same count
        3. Clipboard text has no UI junk ("Like", "Reply", "Load more", follower counts, timestamps-only lines)
        4. Each run finishes in 15 seconds or less, timed live
        5. node --check passes on every changed .js file
SCOPE:  _opensource/riff only; memory and handoff files allowed; everything else read-only
LIMIT:  3 hours or 4 failed live attempts; ask before any commit, push or Store submission
```

Started 2026-10-31T15:44:54Z.

## Log

- Baseline: check 5 passes (node --check, 4 files). Check 1 known failing from code: feed path never calls expandComments (content.js ~1500). Checks 1-4 live baseline next.
- 15:55Z Finding: single-post pages also moved to LinkedIn's new layout (LazyColumn, 0 matches for old .comments-comment-item). expandComments counts via those classes, so expansion is blind on post pages too, not just the feed. Delegated live DOM mapping to a subagent; next: rewrite expansion + extraction on the new shape.
- 16:20Z Step: added new-layout path to content.js (expandSdui: opens feed comments, clicks 'See N more comments', scrolls the last comment; parseSduiBlock: author, headline, timestamp, body, reply by 40px indent; ping commentsReady true on new layout). Check 5: node --check passes on 4 files. Next: live test in foreground tab.
- 16:55Z Live post page (activity:7522312247403065344, fresh load, tab in front): 54 of 54 (34 top + 20 replies) in 7.5 s, 0 missing author/text/headline. Fixes found live: 'Most relevant' sort hides comments (30 of 53) so expandSdui switches to 'Most recent'; list is empty after re-sort until its tail is scrolled; author is in the 2nd link. Next: feed run.
- 17:10Z Live feed (21-comment post, comments closed at start): 21 of 21 (6 top + 15 replies) in 4.9 s, sortedRecent true, 0 missing fields. Junk check on 64 extracted lines: 0 junk. Checks 1, 2, 4, 5 pass at the parsing layer; check 3 passes on comment text. Next: Shadman reloads the unpacked extension and runs Riff end to end (popup, markdown, clipboard).
- 17:35Z Shadman's first end-to-end feed run: right post, 0 comments (correct, post has none), but the author came out as his own name. Cause: the whole feed is a LazyColumn, so the "skip comment links" check skipped every link on every card, and company posts have no /in/ links at all. Fix: inPostComments() only skips links in a LazyColumn inside the post; new company/showcase strategy; strip "• 1st". Live on 43 feed posts: 41 named correctly, 0 resolve to Shadman, 2 left to later strategies. Next: Shadman reloads and reruns.
- 17:50Z Shadman's second feed run (Omar Al-Smadi post): author right, 1 of 1 comment, no junk. Flaw: paragraph breaks lost ("AI.It was") because the feed path reads textContent from a detached clone. Fix: SDUI override clicks the post's "… more" and reads the live expandable-text-box innerText. Tested live on one feed post: 243 to 236 chars, "… more" gone, breaks kept. node --check ok. Next: Shadman reruns.
- 18:05Z Third run (Håkan Samuelsson EX60 post): 10 of 10 comments, paragraph breaks right. Two flaws: author "H%C3%A5kan" (link text "Håkan Samuelsson • Following" was rejected for containing "follow", then the slug fallback kept URL encoding and cut the surname), and a company commenter's headline "137 followers". Fixes: strip "• Following" before the test, decode slugs, add follower counts to SDUI_JUNK. Unit-tested in node; node --check ok. Open question for Shadman: per-comment "_1m_" timestamp lines vs CHECK 3.
- 18:15Z Shadman asked for a recommendation; dropped the per-comment timestamp line from both formatters (content.js, popup.js) per CHECK 3, and multi-line comments now stay inside the blockquote. node --check ok.
- 18:25Z Fourth run (EX60 post, full popup to clipboard): author "Håkan Samuelsson", 10 of 10 comments, paragraph breaks kept, no time lines, no follower headline, multi-line comment kept in its quote. Feed checks 1, 3, 4, 5 pass end to end; check 2 passes at the parsing layer (54 of 54) with no clipboard run on a post page yet. Next: commit on approval.
- 16:22Z Post-page run end to end (Francis Wolff post, popup to clipboard): 57 extracted (34 top + 23 replies) against LinkedIn's 55, inside ±2. Breaks kept, no junk, post URL right. All five checks pass. Long task closed; rebrand and Store update move to a new chat. Open: feed URL shows /feed/ not the post link, heading counts top-level only, popup is hardcoded dark (no light theme).
