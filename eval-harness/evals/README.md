# Riff Skill Evals

Failure-mode-first evaluation harness for the `riff` skill (LinkedIn reply and comment drafter).

Method: Teresa Torres' Interview Coach evals approach. Reject golden datasets. Find real failures in real drafts. Write the simplest possible check for each.

This is parallel scaffolding to `_work/discovery/evals/`, adapted for Riff's domain.

## Why this exists

Riff drafts go straight onto LinkedIn under your name. A bad draft is publicly visible. Vibes-based prompt iteration ("does this sound like me?") gets you to local maxima and stops there. Evals give you a baseline that every prompt change after today can be measured against.

## Directory layout

```
_work/riff/evals/
├── README.md                 # this file
├── runner.py                 # runs all evals on all traces, prints summary
├── buckets.md                # named failure categories (fill AFTER error analysis, not before)
├── inputs/                   # raw Riff JSON payloads (one per source post or thread)
│   └── _README.md
├── drafts/                   # Riff skill outputs paired to inputs
│   └── _README.md
├── traces/                   # one annotated trace per (input, draft) pair
│   ├── _TEMPLATE.md
│   └── 2026-04-XX-trace-NN.md
└── evals/                    # one eval per failure bucket
    └── no_em_dashes.py       # starter eval, the dumbest one that already works
```

## The 3-step loop

### Step 1: Error analysis (do this BEFORE writing more evals)

Per Teresa: "You have to do the error analysis to figure out what to measure."

1. Gather 20-25 real Riff drafts. You already have several months of LinkedIn replies in `_scratch/content/linkedin/` and elsewhere. Start there. Do not synthesize new ones.
2. For each draft, copy the source payload to `inputs/`, the rendered draft to `drafts/`, and create a trace file from `_TEMPLATE.md`.
3. Annotate each trace with one sentence: "what is wrong with this draft?" Examples:
   - "Used a generic opener ('Great point!')"
   - "Reply was 11 lines long, way over the 8-line cap"
   - "Inserted an em dash"
   - "Lost the warmth on a disagreement reply, sounded snarky"
   - "Missed the chance to quote their best line"
   - "Nothing wrong"
4. After ~20 traces, read all annotations side by side. Cluster the wrong ones into 3-7 named buckets. Write them in `buckets.md` with counts.

Do not skip this step. Buckets written from the skill's "Don't" list are golden-dataset thinking dressed up.

### Step 2: One eval per bucket, start with the dumbest

Teresa's quote: "Start with the simplest, dumbest eval because it might work."

For each bucket:

- **Can code express this?** Write a code assertion (regex, keyword match, line count, emoji count). Target 7 to 15 lines.
- **Can code not express this?** Write a 3-line LLM-as-judge prompt.

The starter eval `evals/no_em_dashes.py` is the reference implementation. It is the dumbest possible check: regex for em dash characters and the double-hyphen substitute. That single check would have caught a real failure mode you have flagged repeatedly.

Naming convention: `evals/<failure_bucket_name>.py`. Snake_case. One eval per file. Keep it tiny.

Likely future evals based on what is already documented as Riff failure modes (do NOT pre-write these, validate from real traces first):

- `no_generic_openers.py` (regex: "Great question", "Great point", "Thanks for sharing", "Love this")
- `no_corporate_filler.py` ("leverage", "synergy", "excited to", "circle back")
- `length_under_eight_lines.py`
- `max_one_emoji.py`
- `no_hashtags.py`
- `no_engagement_bait.py` ("Thoughts?", "What do you think?", "Curious to hear")

### Step 3: Run, validate, iterate

```bash
cd _work/riff/evals
python3 runner.py
```

Output format:

```
Riff evals on 5 traces, 1 eval modules
------------------------------------------------------------
no_em_dashes                  4/5 PASS   (1 fails)
------------------------------------------------------------
Overall: 4/5 eval invocations passed (80%)
```

Then do Teresa's validation step:

1. For each eval verdict, compare against the human annotation in `traces/`.
2. Disagreements are diagnostic:
   - Eval says PASS, you said FAIL → the eval missed something. Tighten it.
   - Eval says FAIL, you said PASS → the eval was wrong, OR your rubric was sloppy. Teresa found her rubric was often at fault. Revise the rubric, not the eval.

Ship with known issues. Review production drafts manually alongside automated evals. Let the trace dataset grow.

## Anti-patterns (enforce strictly)

- **No golden datasets.** Do not write "the ideal Riff reply for this post" and compare. You will over-anchor on your own hypothesis.
- **No off-the-shelf eval frameworks first.** They measure generic problems. You don't have generic problems. You have the ones you just discovered.
- **No pre-written buckets.** The skill's "Don't" list looks tempting but is the same anti-pattern as a golden dataset. Real annotation comes first.
- **No eval-for-the-eval.** LLM-as-judge does not need its own LLM-as-judge validator. Human review is the anchor.

## What to run first

Do not write more evals. Do this instead:

1. Pull 20 real Riff drafts you have actually used or rejected over the last 2 months.
2. Run them through `_TEMPLATE.md` and write the one-sentence annotation.
3. Run `runner.py` against the partial trace set so the em-dash eval gives you a baseline number today, with whatever traces you have.
4. After 20 annotated traces, fill `buckets.md`.

The em-dash baseline number is the floor. Every prompt change after today gets measured against it.

## Reference

- Teresa Torres, "How I Designed and Implemented Evals for My Interview Coach": https://www.producttalk.org/interview-coach-evals/
- Sibling harness: `_work/discovery/evals/README.md`
- Skill being evaluated: `~/.claude/context-snapshot/skills/riff/SKILL.md`
- Voice spec: `~/.claude/context-snapshot/skills/riff/references/voice-linkedin.md`
