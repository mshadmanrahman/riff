<p align="center">
  <img src="icons/riff-icon.svg" width="120" height="120" alt="Riff Logo">
</p>

<h1 align="center">Riff</h1>

<p align="center">
  <a href="https://github.com/mshadmanrahman/riff/stargazers"><img src="https://img.shields.io/github/stars/mshadmanrahman/riff?style=social" alt="GitHub stars" /></a>
</p>

<p align="center">
  <strong>Read the room before you comment.</strong>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/riff-linkedin-engagement/hbbgiicapcnfcamdpinhkgkjljpnfffn"><img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"></a>
  <a href="https://youtu.be/FrJWA9N00C4"><img src="https://img.shields.io/badge/Watch%20Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube Demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="MIT License"></a>
</p>

<p align="center">
  <a href="#-how-to-use-step-by-step">How to Use</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-install">Install</a> ·
  <a href="#-privacy">Privacy</a> ·
  <a href="#-contributing">Contributing</a>
</p>

---

<p align="center">
  <img src="riff-demo.gif" alt="Riff Demo" width="720">
</p>

**Riff** is a Chrome extension that extracts a LinkedIn post and every one of its comments into clean, structured markdown, then hands it to Claude, ChatGPT or Gemini with the message box already filled. One click on LinkedIn, one press of Enter in your AI. Or copy to clipboard and paste wherever you like.

The best LinkedIn comments add unique value. But with 30+ comments on every post, most people either skip reading them or end up saying what someone already said. Riff gives you the full conversation context so your reply stands out.

---

## 🎯 How to Use (Step by Step)

### Step 1: Install Riff

<a href="https://chromewebstore.google.com/detail/riff-linkedin-engagement/hbbgiicapcnfcamdpinhkgkjljpnfffn">
  <img src="https://img.shields.io/badge/Get%20Riff-Chrome%20Web%20Store-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Install from Chrome Web Store">
</a>

Click the link above, then click **"Add to Chrome"**. That's it.

> **Tip:** Pin Riff to your toolbar for easy access. Click the puzzle icon (Extensions) in Chrome's toolbar, then click the pin icon next to Riff.

### Step 2: Go to LinkedIn

Open [linkedin.com](https://www.linkedin.com) and find a post you want to engage with. This works on:

- **Your feed** (scroll to any post)
- **A single post page** (click into a specific post)
- **Your own posts** (to reply to comments)

### Step 3: Click Riff

Click the **Riff icon** (purple speech bubble with music notes) in your Chrome toolbar.

You'll see a popup with a big button:

**➡️ Click "Extract Post + Comments"**

On a post page Riff expands the comment thread for you: it clicks "Load more comments" and "load previous replies" until the count matches the post's comment counter, then reads everything. Up to about 15 seconds on a busy post. It then shows you:
- A **mode badge** (COMMENT or REPLY)
- How many comments were found, against the total the post reports
- A preview of the extracted content

### Step 4: Send to your AI

1. Pick **Claude**, **ChatGPT**, **Gemini** or **Clipboard only** in the "Send to" dropdown. Riff remembers your choice.
2. Click **"Send to Claude"** (or whichever you picked).
3. The first time, Chrome asks whether Riff may access that site. Say yes. Riff needs it to type into the message box, nothing else.
4. Riff opens the AI in a new tab, pastes the post and comments into the message box, and stops. You read it over and press Enter.
5. If the message box cannot be found, the text is already on your clipboard as a fallback.

### That's it! Your workflow:

```
See interesting post → Click Riff → Extract → Send to AI → Press Enter → Post your reply
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| "No LinkedIn post found" | Make sure you're on linkedin.com |
| Fewer comments than the post reports | Click "Re-extract"; LinkedIn sometimes loads the thread slowly. On the feed page Riff reads what is visible, so open the post first |
| "Send to Claude" copied to clipboard instead | Chrome's permission prompt was declined, or the AI's message box has changed. Paste with Cmd+V / Ctrl+V and open an issue |
| Wrong post extracted | Scroll so the post you want is centered on screen, then try again |
| Extension not responding | Refresh the LinkedIn page (Cmd+R / Ctrl+R) and try again |
| "Receiving end does not exist" | Refresh the LinkedIn page |

---

## ✨ Features

### Two Modes (Automatic)

| Mode | When | What It Does |
|------|------|-------------|
| **COMMENT** | On someone else's post | Extracts post + comments so you can draft a comment that adds unique value |
| **REPLY** | On your own post | Extracts all comments so you can draft replies to each one |

Riff detects the mode automatically. No configuration needed.

### What Gets Extracted

- Post author name and headline
- Full post text (including "see more" content)
- All visible comments with author names, headlines, and timestamps
- Nested replies and threads
- Repost attribution (who reposted what)
- Post type detection (text, image, video, article, poll, document)
- Engagement metrics (likes, comments count)

### Works Everywhere on LinkedIn

- **Feed page**: Extracts the post closest to the center of your screen
- **Single post pages**: Full extraction with all comments, expanded automatically
- **Reposts**: Shows original author + repost attribution
- **Video posts**: Extracts text without video player UI contamination

### Send to your AI

Pick Claude, ChatGPT or Gemini once. From then on one click opens the AI with the full thread already in the message box. Riff never sends anything itself: you read it and press Enter. Nothing goes to any server other than the AI you chose to open.

---

## 📦 Install

### Chrome Web Store (Recommended)

<a href="https://chromewebstore.google.com/detail/riff-linkedin-engagement/hbbgiicapcnfcamdpinhkgkjljpnfffn">
  <img src="https://img.shields.io/badge/Get%20Riff-Chrome%20Web%20Store-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Install from Chrome Web Store">
</a>

### Manual Install (Developer Mode)

```bash
git clone https://github.com/mshadmanrahman/riff.git
```

1. Open `chrome://extensions` in Chrome, Edge, Brave, or Arc
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the cloned `riff` folder

Works in any Chromium-based browser: Chrome, Edge, Brave, Arc, Vivaldi, Opera.

---

## 📋 Output Format

Riff copies structured markdown to your clipboard:

```markdown
## LinkedIn Post [COMMENT MODE]
**Author:** Felix Haas | CEO at Lovable
**Type:** image | **Engagement:** 142 likes, 29 comments
**URL:** https://www.linkedin.com/feed/update/...

### Post Content
[Reposted by Lovable]

Hot take: marketers are more technical than they think.
They know exactly what they want to build...

### Comments (29 extracted)
1. **@JJ Englert** - Growing the #1 AI Builder Community (2 likes)
   > Thanks for sharing! The skillset that marketers needed...
2. **@Sarah** - CEO, Acme Labs
   > Seeing this in our hiring pipeline already...

---
**Instructions for Claude:** Draft a comment for this post...
```

The AI instructions at the bottom are pre-written so you can paste and get a draft immediately.

---

## 🔒 Privacy

**Zero data collection.** Period.

- All processing happens locally in your browser
- No data is sent to any server
- No analytics, no tracking, no cookies
- Content only exists in your clipboard, or in the AI tab you asked Riff to open
- The only stored setting is which AI you picked in the dropdown
- **Open source**: You can read every line of code

[Full privacy policy](PRIVACY.md)

### Permissions Explained

| Permission | Why |
|-----------|-----|
| `activeTab` | Read the current LinkedIn page when you click the icon |
| `clipboardWrite` | Copy extracted content to your clipboard |
| `scripting` | Inject the extraction script into LinkedIn tabs, and the paste script into the AI tab you chose |
| `storage` | Remember which AI you picked |
| `host_permissions` | Always on for `linkedin.com` only |
| optional `claude.ai`, `chatgpt.com`, `gemini.google.com` | Asked for on first use of "Send to", one site at a time, so Riff can fill the message box there |

---

## 🏗 Architecture

```
riff/
├── manifest.json          # MV3 extension config
├── content.js             # DOM scraper (dual extraction paths)
│   ├── Single post path   # Class-based selectors, expands the comment thread first
│   └── Feed page path     # Semantic selectors (role, aria-label, data-testid)
├── background.js          # Opens the AI tab and injects the filler once it has loaded
├── ai-fill.js             # Finds the composer on claude.ai / chatgpt.com / gemini and pastes
├── popup.html/js/css      # Dark theme popup UI
├── content-styles.css     # Injected page styles
└── icons/                 # Custom SVG + PNG at 16/48/128px
```

### How It Handles LinkedIn's Anti-Scraping

LinkedIn uses **hashed CSS classes** on the feed page that change with every deploy. Riff uses two extraction strategies:

1. **Single post pages** (`/feed/update/...`): Class-based selectors that are stable
2. **Feed page**: Semantic DOM anchors (`role="listitem"`, `aria-label`, `data-component-type`) that survive class name changes

This dual-path architecture means Riff keeps working even when LinkedIn changes their frontend.

---

## 🤝 Contributing

Contributions welcome! LinkedIn changes their DOM frequently, so selector updates are always needed.

**Common contributions:**
- Selector updates when LinkedIn changes their DOM
- New extraction strategies for edge cases
- UI improvements to the popup
- Bug reports with diagnostic output (click **"Diagnose DOM"** in the popup)

```bash
# Development workflow
git clone https://github.com/mshadmanrahman/riff.git
cd riff
# Load unpacked in chrome://extensions
# Make changes → refresh extension → test on LinkedIn
```

---

## 🎵 Why "Riff"?

In music, a **riff** is a short, repeated phrase that forms the foundation of a song. On LinkedIn, your comment is your riff on someone else's melody. Riff (the extension) gives you the sheet music: the full post, every comment, all the context. So your riff actually adds to the song instead of repeating what's already been played.

---

## Support

If this saved you time, give it a star -- it helps others find it and keeps development going.

## See Also

- **[pm-pilot](https://github.com/mshadmanrahman/pm-pilot)** -- Claude Code configured for PMs. Meeting prep, PRDs, market sizing -- 25 skills, ready to install.
- **[root-kg](https://github.com/mshadmanrahman/root-kg)** -- Personal knowledge graph. Ask questions across all your notes, meetings, and emails.
- **[morning-digest](https://github.com/mshadmanrahman/morning-digest)** -- Morning briefing automation. Calendar, email, news in one digest.
- **[discovery-md](https://github.com/mshadmanrahman/discovery-md)** -- AI product discovery for PMs.
- **[ceremonies](https://github.com/mshadmanrahman/ceremonies)** -- Agile ceremonies that don't suck.
- **[claudecode-guide](https://github.com/mshadmanrahman/claudecode-guide)** -- Friendly guide to Claude Code. Also at [claudecodeguide.dev](https://claudecodeguide.dev).

## 📜 License

[MIT](LICENSE) - Use it, fork it, build on it.

---

<p align="center">
  Built by <a href="https://github.com/mshadmanrahman">Shadman Rahman</a>
</p>
