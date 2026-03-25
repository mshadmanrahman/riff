<p align="center">
  <img src="icons/riff-icon.svg" width="120" height="120" alt="Riff Logo">
</p>

<h1 align="center">Riff</h1>

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

**Riff** is a Chrome extension that extracts LinkedIn posts and comments into clean, structured markdown. One click. Copy to clipboard. Paste into any AI tool to draft thoughtful replies that actually reference what people said.

The best LinkedIn comments add unique value. But with 30+ comments on every post, most people either skip reading them or end up saying what someone already said. Riff gives you the full conversation context so your reply stands out.

<p align="center">
  <a href="https://youtu.be/FrJWA9N00C4">
    <img src="https://img.shields.io/badge/▶%20Watch%20the%2060s%20demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo">
  </a>
</p>

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

### Step 3: Expand Comments (Important!)

**Before extracting, make sure comments are visible on the page:**

1. Click the **"Comments"** section on the post to expand it
2. If you see a **"Load more comments"** button, click it a few times
3. The more comments visible on screen, the more Riff can extract

> **Why?** LinkedIn doesn't load comments until you open them. Riff reads what's on screen, not what's hidden. If you see "0 comments extracted" but the post has comments, this is why.

### Step 4: Click Riff

Click the **Riff icon** (purple speech bubble with music notes) in your Chrome toolbar.

You'll see a popup with a big button:

**➡️ Click "Extract Post + Comments"**

Riff will scan the post and show you:
- A **mode badge** (COMMENT or REPLY)
- How many comments were found
- A preview of the extracted content

### Step 5: Copy and Paste

1. Click **"Copy Markdown"** (copies structured text to your clipboard)
2. Open your AI tool of choice:
   - [Claude](https://claude.ai) (recommended)
   - [ChatGPT](https://chatgpt.com)
   - Any AI that accepts text input
3. **Paste** (Ctrl+V / Cmd+V)
4. The AI now has the full context: post, author, all comments, timestamps
5. Ask it to draft your reply or comment

### That's it! Your workflow:

```
See interesting post → Expand comments → Click Riff → Extract → Copy → Paste into AI → Post your reply
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| "No LinkedIn post found" | Make sure you're on linkedin.com |
| "0 comments extracted" | Click to expand comments on the post first, then re-extract |
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
- **Single post pages**: Full extraction with all comments
- **Reposts**: Shows original author + repost attribution
- **Video posts**: Extracts text without video player UI contamination

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
- Content only exists in your clipboard after you copy it
- No background processes or persistent storage
- **Open source**: You can read every line of code

[Full privacy policy](PRIVACY.md)

### Permissions Explained

| Permission | Why |
|-----------|-----|
| `activeTab` | Read the current LinkedIn page when you click the icon |
| `clipboardWrite` | Copy extracted content to your clipboard |
| `scripting` | Inject the extraction script into LinkedIn tabs |
| `host_permissions` | Only works on `linkedin.com` |

---

## 🏗 Architecture

```
riff/
├── manifest.json          # MV3 extension config
├── content.js             # DOM scraper (dual extraction paths)
│   ├── Single post path   # Class-based selectors (.feed-shared-update-v2)
│   └── Feed page path     # Semantic selectors (role, aria-label, data-testid)
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

## 📜 License

[MIT](LICENSE) - Use it, fork it, build on it.

---

<p align="center">
  Built by <a href="https://github.com/mshadmanrahman">Shadman Rahman</a>
</p>
