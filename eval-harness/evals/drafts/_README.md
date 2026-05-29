# Drafts: Riff skill outputs

One file per (input, draft) pair. These are the actual replies or comments the Riff skill produced when given the corresponding input payload.

## Naming

Match the input filename, with `.md` extension.

Example: input `inputs/2026-04-22-01.json` pairs with draft `drafts/2026-04-22-01.md`.

If the same input was processed multiple times (e.g., after a prompt change), suffix the draft: `2026-04-22-01-v2.md`. Keep both versions for comparison.

## Format

Markdown. Paste the Riff skill's raw output, including the `## Reply N:` headers, the `> quote` blocks, the drafted reply text, and the `**Why this works:**` lines.

For COMMENT mode, paste the single comment draft.

## What NOT to do

- Do not edit drafts after capture. Evals are run against the actual output.
- Do not skip the headers; some evals may want to scope by reply number.
