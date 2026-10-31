# Chrome Web Store Listing

## Short Description (132 chars max)
The whole thread, not LinkedIn's sample. One click loads every comment on the post you're viewing, as clean text for your AI.

## Detailed Description

LinkedIn shows you a sample of the comments. The default view picks the "most relevant" ones, the rest load ten at a time, and replies hide behind their own buttons. So most people copy-paste the whole page into Claude or ChatGPT, and the AI gets the nav bar, ads, "Promoted" labels and reaction counts mixed in with the comments.

Riff does it in one click. It loads every comment and reply, drops the page junk, and gives you the post plus the full thread as clean markdown. Then it opens Claude, ChatGPT or Gemini with the message box already filled. You add your question and press Enter.

**How it works:**

1. Open any LinkedIn post
2. Click the Riff icon
3. Hit "Get post + every comment". Riff loads the whole thread for you, replies included
4. Click "Send to Claude" (or ChatGPT, Gemini, or Clipboard only)
5. Type your question under the thread and press Enter

**Ask it anything:**

- What objections keep coming up, and who raised them?
- Where do the replies disagree with the post?
- Which questions did nobody answer?

Riff adds no instructions of its own and never writes a comment for you. It gives your AI the full conversation and leaves the question to you.

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

Built for founders, researchers and anyone who reads a LinkedIn thread to learn what people actually think.

## Category
Productivity

## Language
English

## Store images (in store-assets/)
1. 01-problem.png: the problem, a whole LinkedIn page pasted into an AI next to Riff's clean output
2. 02-popup-light.png: the popup after a run, light theme
3. 03-popup-dark.png: the same popup in dark theme
4. 04-markdown.png: the clean markdown Riff produces
5. promo-tile-440x280.png: small promo tile

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
