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

---

# Long task 2: rebrand + 1.4.0 (started 2026-10-31)

```text
TASK:   Riff 1.4.0 is ready to submit: new icon, popup that follows light/dark, problem-first copy, new Store images, two small fixes, plus a launch post draft.
OUTPUT: _opensource/riff/riff-v1.4.0.zip, _opensource/riff/store-assets/, _scratch/content/posts/2026-10-31-riff-1-4-launch/linkedin-post.md
CHECKS: 1. Zip unzips with manifest "version": "1.4.0" and icons 16/32/48/128 at the right pixel size
        2. Popup computed background differs under light vs dark, body text contrast >= 4.5:1 in both
        3. Live feed run: post URL is /feed/update/urn:li:..., heading count = top-level + replies
        4. Problem line in README, STORE_LISTING.md, popup.html; sloptrim <= 40 on README, listing, post
        5. Store images: 1280x800 screenshots and a 440x280 promo tile, from the real extension
SCOPE:  _opensource/riff, plus the post folder under _scratch/content/posts/
LIMIT:  Ask before push, Store submit, anything public. Stop if one check fails 3 times.
```

## Log

- Baseline: 1 fail (1.3.2, no 32px icon), 2 fail (popup.css hardcoded #0a0a0a), 3 fail (known from 1.3.2 run), 4 fail (old copy), 5 fail (no store-assets/).
- Step: fixes in content.js + popup.js (sduiPostUrl from comment ids, heading = comments + replies), popup.css on tokens with prefers-color-scheme, new icon SVGs + 16/32/48/128 PNGs, manifest 1.4.0 + 32px, copy in README/listing/popup/manifest. node --check ok, sloptrim README 32, listing 25. Next: live check 3, browser check 2.
- 16:50Z Check 3: live LinkedIn feed, comment ids carry the post id (TechCrunch post -> urn:li:activity:7522330650016825344). Zero-comment feed posts expose no id anywhere, even with the menu open, so URL now says "open the post for its link" instead of /feed/. Heading/count logic unit-tested in node (3 comments + 3 replies -> 6). Full popup run still needs Shadman's reload.
- 16:55Z Check 2 PASS: light min contrast 5.18 (primary button), dark min 5.18; bg #fbfaf8 vs #121110. Measured after the 0.15s button transition settles.
- 16:58Z Shadman rejected the bubble icon: wants a musical note or the letter R. Drew both (scratchpad options.png), waiting on his pick.
- 18:07Z Icon: Shadman picked the banded deep-drop block R (vector, solid blue bands, navy drop and outline). Installed riff-icon.svg + 16/32/48/128 PNGs (128 = 96px art + 16px padding). Popup accent orange -> blue (#0a66c2 light, #5ab4ff dark). Check 2 re-run PASS: light min 5.45, dark min 7.75. README icon text updated.
- 18:07Z Scope grows (Shadman): rebrand everything, including OG image, Store images and promo video. All Store art and videos come from promo-video/ (Remotion, gitignored, purple palette in src/styles.ts + public/riff-logo.svg). Next: new palette + logo in promo-video, re-render stills, tile, marquee and videos.
- 18:12Z Promo rebrand started. promo-video: npm install + @remotion/google-fonts 4.0.438; styles.ts on the blue ramp (old COLORS keys remapped, new BRAND, chunkyText, panel; fonts Lilita One + Nunito); public/riff-logo.svg = icons/riff-icon.svg (old one in scratchpad); new RetroScene.tsx (sky, outlined clouds, sun, hills, dirt) + WoodSign. Screenshot1 rebuilt as the style sample, tsc clean, rendered to screenshot-1-preview.png. Waiting on Shadman's OK before the rest.
- 18:36Z Shadman: hand-drawn SVG scene looked ugly, try Codex. Codex image_gen made two text-free backgrounds: public/bg-retro.png (flat 16-bit vector, checkered hills, floating blue blocks) and public/bg-painted.png (painterly platformer). Screenshot1 now takes a bg prop and lays logo, wood sign and pitch panel over the art. Previews preview-A-retro.png and preview-B-painted.png in repo root; waiting on his pick.
- 19:08Z Shadman asked if the landscape even fits Riff; it doesn't (no story, and check 5 wants real UI). New direction, samples: (1) preview-screenshot.png = real popup (headless Chrome capture, public/popup-real.png) + real markdown format in a retro frame; (2) preview-marquee.png = Codex scene public/scene-rblock.png (junk bricks crumble, blue R block pops comment cards) + headline. Waiting on his OK.
- 19:14Z Shadman rejected the R-block scene as generic (Clash of Clans / Angry Birds look). Codex made three flat 2D arcade-flyer concepts (block puzzle, claw machine, fishing; preview-concepts.jpg). He picked the CLAW MACHINE: public/scene-claw.png (1536x1024, R-shaped claw lifts a chain of comment cards out of a heap of junk tokens, empty sky on the left third for the headline). scene-tetris.png kept as runner-up. Style prompt for any new Codex art: flat 2D game poster, 1990s arcade flyer redrawn by an indie studio, thick #0E1A33 outlines, flat fills with one hard shade, light dither, NOT 3D/glossy/Clash/Angry Birds, no wood/stone/grass; blue ramp hero + #FFD23F and #FF5A4E accents on #D9F0FF; icon via -i public/icon-512.png. Screenshot2 (real popup + real markdown) is approved in principle but still sits on the old checkered-hills strip: swap that strip for the claw style. Next: roll out to all assets.
- 19:16Z Claw rollout, stills: MarqueeTile (art full-height right, sky extends left), PromoTile (cover crop keeps the claw, no native Codex version needed), Screenshot1 (real popup + 3 points, claw on right 600px), Screenshot2 (claw heap strip replaces checkered hills), new SocialPreview 1280x640. Rendered to promo-video/out/<Id>.png, sizes checked. Waiting on Shadman's OK before videos.
- 19:18Z Shadman caught the second popup button clipped in both screenshots. Cause: public/popup-real.png was a 680x292 capture cut through 'Just load all comments'. Recaptured popup.html headless at 2x (340 wide), cropped at row 318 (button ends 294, the 'Diagnose DOM' debug button starts 327 and stays out). Screenshot1 + 2 re-rendered. Old capture in scratchpad.
- 19:21Z Videos: Shadman's current YouTube promo (youtu.be/FrJWA9N00C4, 50 s) = ReadTheRoom. First re-theme pass done in src/: GradientBg is now claw sky + dither + clouds; scenes/ and reel-scenes/ mapped white text -> ink, purple -> blue ramp, translucent cards -> white; CLAW_SKY moved to styles.ts. tsc clean. Sheet at scratchpad frames2/sheet-rr.jpg. Gaps: headlines not chunky yet, clouds read as flat bars, no claw art on end cards, stale 1.1 copy ('Read the room before you comment', 'Extract Post + Comments', AI-comment 'Craft' scene). Src backup of pre-theme state in session scratchpad src-backup/. Open question to Shadman: re-skin only, or rewrite the story to the 1.4 pitch.

- 2026-10-31: ReadTheRoom rewritten for 1.4 (concept A, "Your AI read 2 of 47 comments"). Scenes in promo-video/src/scenes14/Launch.tsx, rendered to out/riff-promo-landscape-v14.mp4 (50 s). Old scenes/ untouched. Waiting on approval before Reel, CleanDemo, GIF.
- 2026-10-31: Value reframed to "read the whole thread, then say something new" (LinkedIn feed update, Apr 2026: favors substantive debate, suppresses comment automation; the "2x/15x comments" figures were dropped as unsourced). Music is now public/music-claw.mp3 (starostin comedy cartoon, track 3). AI finds the gap but never writes the comment.
