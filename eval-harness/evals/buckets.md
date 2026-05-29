# Riff failure buckets

Fill this AFTER you have annotated ~20 traces in `traces/`. Do not pre-populate it from the skill's "Don't" list. That is golden-dataset thinking and will bias your error analysis.

## Method

1. Read every annotated trace where `human_verdict: fail` or `partial`.
2. Cluster the one-liner annotations into 3-7 named buckets.
3. Note the count per bucket. The biggest bucket is your first eval target.
4. Once you have buckets, write one eval per bucket in `evals/`, starting with whichever can be expressed as code most cheaply.

## Format

When you fill this in, use:

```
### bucket_name (count)

One-line definition of what failed.
Example traces: 2026-04-XX-trace-NN, 2026-04-XX-trace-MM
Eval candidate: regex | keyword | length-check | LLM-as-judge
```

## Buckets (empty until error analysis)

_Run error analysis first. Do not fill this in from intuition._
