# CuriousLab

Small, self-contained learning games. Every page is static: no build step, no
framework, no server, no analytics. Progress is stored in the visitor's own
browser via `localStorage`.

Live site: <https://k-l-lambda.github.io/curiouslab/>

## Contents

| Path | What it is |
|---|---|
| `index.html` | Hub page listing the games |
| `games/counting-pairs/` | Counting / addition / subtraction game for preschool children |
| `assets/js/art.js` | SVG sprite library (objects, containers, UI icons) |
| `assets/js/pairings.js` | The six object pairings |
| `assets/js/questions.js` | Question model, generation and validation |
| `assets/js/scheduler.js` | Adaptive selection, difficulty and timeout bands |
| `assets/js/storage.js` | Local progress, skill mastery, item history |

## Running locally

ES modules need a real HTTP origin, so `file://` will not work. Any static
server does:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Counting Pairs, phase one

A text-free game for children who may not read yet. The task is carried by
object arrangement, counts, numerals, arithmetic symbols and motion. There is
no voice and no sound effects in this phase.

- **Six pairings** — cat/fish, monkey/banana, dog/bone, rabbit/carrot,
  bird/seed, lamp/star, each with its own container art and success interaction.
- **Three modes that alternate** — counting (source group unlabelled, so the
  quantity has to be counted), addition (two labelled groups merge), and
  subtraction (items visibly leave the group; the remainder stays on screen).
- **Quantities up to 10.** Zero is only ever offered when it is the real answer.
- **Difficulty factors raised independently** — quantity range, operation
  structure, visual density, pairing familiarity, distractor distance, number-label
  dependence, and the timeout band. At most two are raised per step, and the
  order rotates.
- **Timeout is its own dimension.** Bands are 25s / 16s / 10s. The clock starts
  only after the entrance animation. Tightening requires a run of comfortable
  first-try answers; a timeout gives time back immediately and is recorded
  separately from a wrong answer.
- **Wrong answers are never punished.** The card wobbles back, source objects
  are highlighted one at a time, and after a second miss two distractors dim and
  a correspondence hint is drawn — the child still completes the last step.
  A miss queues one gentler question in the same family rather than a replay.
- **Icons only.** Pause, hint, undo, confirm, grown-up panel and home are
  icons; the accessible names are numerals or single words for screen readers.
- **Grown-up panel** (gear icon) is the only text surface. It reports per-skill
  attempts, first-try counts, errors, timeouts, mastery and the current time
  band, plus a plain-language list of what needs practice.

### Progress

`localStorage` key `curiouslab.counting-pairs.v1`, flushed on answer, tab hide
and page unload, so it survives a refresh. The grown-up panel can erase it.

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the
repository root with `actions/deploy-pages`. One-time setup: in the repository,
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

`.nojekyll` is present so no path is skipped by Jekyll processing.
