# Privacy Policy for Riff - LinkedIn Engagement Assistant

**Last updated:** September 7, 2026

## Overview

Riff is a browser extension that extracts text content from LinkedIn pages and either copies it to your clipboard or pastes it into the message box of an AI chat you choose (Claude, ChatGPT or Gemini). It runs entirely in your browser.

## Data Collection

Riff does **not** collect, store, transmit, or share any data. Specifically:

- **No data is sent to any server.** All processing happens locally in your browser.
- **No analytics or tracking.** Riff does not use cookies, telemetry, or analytics services.
- **No personal information is collected.** Riff does not access your LinkedIn credentials, login tokens, or account information.
- **No data persistence.** Extracted content exists only in your browser's memory until you close the popup, or for a few minutes in the browser's session storage while it is handed to the AI tab you asked for, after which it is deleted. The only setting saved to disk is which AI you picked in the dropdown.

## What Riff Does

1. Reads the visible text content of LinkedIn posts and comments on the current page.
2. Formats the extracted text as structured markdown.
3. Copies the formatted text to your system clipboard when you click "Copy to Clipboard."
4. When you click "Send to Claude / ChatGPT / Gemini", opens that site in a new tab and types the text into its message box. Riff never presses send. You decide whether the message goes to that AI provider, and their privacy policy applies from that point.

That's it. Nothing leaves your browser except what you choose to send to the AI you picked.

## Permissions Explained

- **activeTab**: Allows Riff to read the current LinkedIn page when you click the extension icon.
- **clipboardWrite**: Allows Riff to copy extracted content to your clipboard.
- **scripting**: Allows Riff to inject the content extraction script into LinkedIn pages.
- **storage**: Remembers which AI you picked in the dropdown.
- **host_permissions (linkedin.com)**: Always on, so Riff can read LinkedIn pages.
- **optional host permissions (claude.ai, chatgpt.com, gemini.google.com)**: Requested the first time you use "Send to" for that site, and only for that site. Needed to fill the message box. Decline and Riff falls back to the clipboard.

## Third-Party Services

Riff has no backend and calls no APIs. The AI sites are opened in your own browser, under your own login. Riff places text in the message box and stops.

## Changes to This Policy

If this privacy policy changes, the updated version will be published with the extension update.

## Contact

For questions about this privacy policy, open an issue at: https://github.com/mshadmanrahman/riff
