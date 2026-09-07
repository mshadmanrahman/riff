# Chrome Web Store Listing

## Short Description (132 chars max)
Extract LinkedIn posts and all their comments, then send them straight to Claude, ChatGPT or Gemini to draft your reply.

## Detailed Description

Riff extracts a LinkedIn post and every one of its comments into clean, structured markdown, then opens Claude, ChatGPT or Gemini with the message box already filled. You read it and press Enter.

**How it works:**

1. Open any LinkedIn post
2. Click the Riff icon
3. Hit "Extract Post + Comments". Riff expands the whole comment thread for you
4. Click "Send to Claude" (or ChatGPT, Gemini, or Clipboard only)
5. Press Enter in the AI tab
6. Get a draft reply that matches the conversation context

**Two modes:**

- REPLY mode: Detected on your own posts. Extracts all comments so you can draft replies.
- COMMENT mode: Detected on others' posts. Extracts the post and comments so you can draft a comment that adds unique value.

**What gets extracted:**

- Post author and headline
- Full post text (including "see more" content)
- All visible comments with author names, headlines, and timestamps
- Nested replies
- Post type detection (text, image, video, article, poll)

**Privacy first:**

- Zero data collection. Everything runs locally in your browser.
- No analytics, no tracking, no servers.
- Content goes only to your clipboard or to the AI tab you chose to open.
- Open source: https://github.com/mshadmanrahman/riff

**Works on:**
- LinkedIn feed page
- Individual post pages
- Posts with expanded comments

Built for creators, founders, and professionals who want to engage authentically on LinkedIn without spending 30 minutes per comment.

## Category
Productivity

## Language
English

## Screenshots needed (1280x800 or 640x400)
1. Riff popup showing extracted post with COMMENT mode badge
2. Riff popup showing extracted post with REPLY mode badge and comments
3. The markdown output pasted into an AI tool
4. Before/after: LinkedIn post → Riff extraction → AI-drafted comment

## Privacy practices tab (copy each box as written)

**Single purpose description**
Riff extracts one LinkedIn post and its comments into markdown and hands that text to the AI chat site the user picks, with the message box pre-filled. It does nothing else.

**activeTab**
Reads the LinkedIn page the user is looking at when they click the Riff icon, so the post and comments on that page can be extracted.

**scripting**
Injects the extraction script into the LinkedIn tab, and injects a small script into the AI tab the user chose (claude.ai, chatgpt.com or gemini.google.com) that pastes the extracted text into the message box. The script does not press send.

**storage**
Stores one setting: which AI site the user picked in the "Send to" dropdown, so it is preselected next time. No content is stored.

**clipboardWrite**
Copies the extracted markdown to the clipboard when the user clicks Copy, or as a fallback when the AI message box cannot be found.

**Host permission: linkedin.com**
The extraction script runs only on LinkedIn pages. The extension has no function anywhere else.

**Optional host permissions: claude.ai, chatgpt.com, gemini.google.com**
Requested one site at a time, on the first click of "Send to", so the paste script can fill the message box on that site. The user can decline and use the clipboard instead.

**Remote code**
No. All code ships in the package.

**Data usage**
No user data is collected, transmitted or sold. Everything runs locally in the browser. The only data leaving the browser is the text the user chooses to send to the AI site they opened, and that goes through the user's own session on that site.
