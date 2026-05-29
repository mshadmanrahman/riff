# Inputs: Riff JSON payloads

One file per source LinkedIn post or thread. The Riff Chrome extension produces these JSON payloads; paste them here verbatim.

## Naming

`YYYY-MM-DD-NN.json` where NN is a 2-digit counter for the day (01, 02, ...).

Example: `2026-04-22-01.json`

## What each file should contain

The full JSON payload from the Riff extension popup. Includes:

- `mode`: `REPLY` or `COMMENT`
- `post`: `{ author, headline, text, type, url }`
- `comments`: array of `{ author, headline, text, timestamp, likes, replies }`
- `engagement`: `{ likes, comments }`

## Where to source these

- Past months of LinkedIn replies you have actually sent or rejected
- Live captures from the Riff extension going forward
- `_scratch/content/linkedin/` may contain related draft material

## What NOT to do

- Do not edit the payload to make it "cleaner." Use the raw extension output.
- Do not synthesize fake payloads. Real failures only.
- Do not commit personal data to a public repo. This folder lives under `_work/` precisely so it stays workspace-private.
