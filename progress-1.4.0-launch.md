---
created: 2026-10-31
type: plan
status: complete
tags: [riff, launch, long-task]
---

# Riff 1.4.0 launch kit

TASK:   Riff 1.4.0 launch kit, ready for Shadman to upload himself; video ends on a founder asking "What objections keep coming up?"
OUTPUT: promo-video/out/riff-promo-landscape-v14.mp4 + youtube.md + thumbnail-v14.png; riff-v1.4.0.zip + store/*.png; _scratch/content/posts/2026-11-01-riff-1-4-launch/linkedin-post.md
CHECKS: 1 video ending, 4 of 60, no 2 of 47, ffprobe 1920x1080 / 2 zip 1.4.0, no Diagnose or badge, clean-profile load / 3 stills fresh popup + value line / 4 sloptrim <= 40, no banned words
SCOPE:  _opensource/riff, the post folder
LIMIT:  no upload, submit, post or push; script shown before render; stop after 3 fails on one check

## Baseline (start)
1 FAIL: Launch.tsx ends "Then say something new", shows "2 of 47"
2 FAIL: no riff-v1.4.0.zip
3 FAIL: stills say "Junk out. Every comment in.", Screenshot2 shows [COMMENT MODE]
4 FAIL: post and descriptions not written

## Log
- Launch.tsx rewritten (InMail founder post, 4 of 60, founder question ending). tsc clean, grep finds no 47. Awaiting script OK before render.
- Zip built (14 files, all 4 icon sizes; first build missed riff-32.png, fixed). Clean Chrome for Testing 150 profile: Riff worker 1.4.0 running, popup ready state, Diagnose hidden, no MODE text, 0 errors. CHECK 2 PASS.
- Fresh popup captured over CDP into public/popup-real.png. Store stills re-rendered with value line, [COMMENT MODE] removed: 1280x800 x2, 440x280, 1400x560. CHECK 3 PASS.
- linkedin-post.md and youtube.md written. sloptrim 25 and 25, banned-word grep empty. CHECK 4 PASS.
- Next: render video after OK, ffprobe, thumbnail from end frame.
- Script approved. Rendered out/riff-promo-landscape-v14.mp4: ffprobe 1920x1080, 30/1 fps, 50.048 s. Frames at 5.5/12.5/25/43.5/49.5 s checked: 4 of 60, 56 never copied, 4 to 60 counter, founder question, end card. CHECK 1 PASS. Old render kept as riff-promo-landscape-v14-old.mp4.
- Thumbnail out/thumbnail-v14.png (1280x720) from the 5.5 s hook frame.
- ALL CHECKS PASS. Nothing uploaded, submitted, posted, committed or pushed.
