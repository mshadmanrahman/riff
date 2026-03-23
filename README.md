<p align="center">
  <img src="icons/riff-icon.svg" width="120" height="120" alt="Riff Logo">
</p>

<h1 align="center">Riff</h1>

<p align="center">
  <strong>Read the room before you comment.</strong>
</p>

<p align="center">
  <a href="https://chrome.google.com/webstore/detail/riff"><img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"></a>
  <a href="https://youtu.be/FrJWA9N00C4"><img src="https://img.shields.io/badge/Watch%20Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube Demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="MIT License"></a>
</p>

<p align="center">
  <a href="#how-it-works">How It Works</a> ·
  <a href="#features">Features</a> ·
  <a href="#install">Install</a> ·
  <a href="#privacy">Privacy</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

**Riff** is a Chrome extension that extracts LinkedIn posts and comments into clean, structured markdown. One click. Copy to clipboard. Paste into any AI tool to draft thoughtful replies that actually reference what people said.

The best LinkedIn comments add unique value. But with 30+ comments on every post, most people either skip reading them or end up saying what someone already said. Riff gives you the full conversation context so your reply stands out.

<p align="center">
  <a href="https://youtu.be/FrJWA9N00C4">
    <img src="https://img.shields.io/badge/▶%20Watch%20the%2060s%20demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo">
  </a>
</p>

## How It Works

```
LinkedIn Post (47 comments) → Click Riff → Structured Markdown → Paste into AI → Thoughtful Reply
```

1. Navigate to any LinkedIn post or scroll your feed
2. Click the Riff icon (purple speech bubble)
3. **"Extract Post + Comments"**
4. **"Copy to Clipboard"**
5. Paste into Claude, ChatGPT, or any AI tool
6. Get a draft that references specific points from the conversation

## Features

### Two Modes

| Mode | When | What It Does |
|------|------|-------------|
| **REPLY** | Your own posts | Extracts all comments so you can draft replies |
| **COMMENT** | Others' posts | Extracts post + comments so you can add unique value |

### What Gets Extracted

- Post author, headline, and full text
- All visible comments with author names, headlines, and timestamps
- Nested replies and threads
- Post type detection (text, image, video, article, poll, document)
- Engagement metrics

### Technical Highlights

- **Dual extraction engine**: Class-based selectors for single post pages, semantic selectors (`role`, `aria-label`, `data-testid`) for the feed page
- **9-strategy author detection**: Follow button labels, profile link text, aria-labels, URL slug parsing, text-based "Name · You" parsing
- **Feed-resilient**: LinkedIn uses hashed CSS classes on the feed that change every deploy. Riff uses semantic DOM anchors that survive these changes
- **Comment parsing**: Top-down extraction from LazyColumn children with timestamp-based text splitting and UI chrome stripping

## Install

### Chrome Web Store (recommended)

<a href="https://chrome.google.com/webstore/detail/riff">
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

Works in any Chromium-based browser: Chrome, Edge, Brave, Arc, Vivaldi, Opera, Dia.

## Output Format

Riff copies structured markdown to your clipboard:

```markdown
## LinkedIn Post [COMMENT MODE]
**Author:** Si Conroy | Ex-SaaS CEO, PwC
**Type:** image | **Engagement:** 142 likes, 47 comments
**URL:** https://www.linkedin.com/feed/update/...

### Post Content
Most people are looking for the wrong early warning sign...
The first sign that AI is changing work may not be layoffs...

### Comments (47 extracted)
1. **@Marcus** - Product Lead at Stripe (2 likes)
   > The 94% feasibility vs 33% adoption gap is the real story here.
2. **@Sarah** - CEO, Acme Labs
   > Seeing this in our hiring pipeline already...
...

---
**Instructions for Claude:** Draft a comment for this post...
```

## Privacy

**Zero data collection.** Period.

- All processing happens locally in your browser
- No data is sent to any server
- No analytics, no tracking, no cookies
- Content only exists in your clipboard after you copy it
- No background processes or persistent storage

[Full privacy policy](PRIVACY.md)

### Permissions Explained

| Permission | Why |
|-----------|-----|
| `activeTab` | Read the current LinkedIn page when you click the icon |
| `clipboardWrite` | Copy extracted content to your clipboard |
| `scripting` | Inject the extraction script into LinkedIn tabs |
| `host_permissions` | Only works on `linkedin.com` |

## Architecture

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

## Contributing

Contributions welcome! LinkedIn changes their DOM frequently, so selector updates are always needed.

**Common contributions:**
- Selector updates when LinkedIn changes their DOM
- New extraction strategies for edge cases
- UI improvements to the popup
- Bug reports with diagnostic output (click "Diagnose DOM" in the popup)

```bash
# Development workflow
git clone https://github.com/mshadmanrahman/riff.git
cd riff
# Load unpacked in chrome://extensions
# Make changes → refresh extension → test on LinkedIn
```

## Why "Riff"?

In music, a **riff** is a short, repeated phrase that forms the foundation of a song. On LinkedIn, your comment is your riff on someone else's melody. Riff (the extension) gives you the sheet music: the full post, every comment, all the context. So your riff actually adds to the song instead of repeating what's already been played.

## License

[MIT](LICENSE) - Use it, fork it, build on it.

---

<p align="center">
  Built by <a href="https://github.com/mshadmanrahman">Shadman Rahman</a>
</p>
