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
| `assets/js/levels.js` | The level ladder: item sets, mastery grades, stars, runs |
| `assets/js/scheduler.js` | Adaptive selection, difficulty and timeout bands |
| `assets/js/storage.js` | Local progress, skill mastery, item history |
| `assets/levels/prompts.md` | Art briefs for the level covers and clear frames |

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
- **Three modes that alternate**, all sharing one visual grammar: the source
  group (cats, monkeys...) is always the actor on the left, the target group
  (fish, bananas...) is always what the child supplies.
  - *counting* — the source group is unlabelled, so the quantity has to be
    counted rather than read.
  - *addition* — two labelled source groups merge, and the child picks the
    total the combined group needs.
  - *subtraction* — a missing-addend task: `N` actors each have a plate, `k`
    plates already hold a target object, and the child counts the empty plates
    to say how many more are needed. `N − k = answer`, shown on success.
- **Quantities up to 10.** Zero is only ever offered when it is the real answer.
- **Difficulty factors raised independently** — quantity range, operation
  structure, visual density, pairing familiarity, distractor distance, number-label
  dependence, and the timeout band. At most two are raised per step, and the
  order rotates.
- **Timeout is its own dimension.** Bands are 25s / 16s / 10s. The clock starts
  only after the entrance animation. Tightening requires a run of comfortable
  first-try answers; a timeout gives time back immediately and is recorded
  separately from a wrong answer.
- **Wrong answers are never punished.** The card wobbles back, the things that
  need counting are highlighted one at a time (the empty plates in subtraction,
  the source objects otherwise), and after a second miss two distractors dim and
  a correspondence hint is drawn — the child still completes the last step.
  In free practice a miss queues one gentler question in the same family rather
  than a replay; inside a level run it does not, because an injected extra would
  either eat one of the level's own questions or make the run's length
  unpredictable. A missed question simply carries more weight into the next run.
- **Icons only.** Pause, hint, undo, confirm, grown-up panel and home are
  icons; the accessible names are numerals or single words for screen readers.
  Home means the map while a level is being played, and the site hub from the map
  — so leaving the game entirely is two taps from inside a question rather than
  one. Leaving a level part-way abandons that run's chance at clearing, but every
  answer already given is kept.
- **Grown-up panel** (gear icon) is the only text surface. It reports per-skill
  attempts, first-try counts, errors, timeouts, mastery and the current time
  band, plus a plain-language list of what needs practice.

### The level ladder

The game opens on a map: a winding path with a level at each stop. Levels past
the child's progress are locked. Picking one starts a **run** — a fixed number of
questions drawn from that level's own item set — which ends in a result screen.

| Level | Band | Content | Item set | Per run | Forms |
|---|---|---|---|---|---|
| 1 | 👌 up to 3 | counting | 3 | 3 | cartoon |
| 2 | 👌 up to 3 | counting, addition | 6 | 5 | cartoon |
| 3 | 🖐 up to 5 | counting, addition | 15 | 6 | cartoon, numeral cards |

The hand sign marks the number range a stretch of the path covers. An item set is
enumerated, not a random range: level 3's fifteen are `count 1..5` plus every
`a + b ≤ 5`. Because a run asks fewer questions than the set holds, coming back
is how a level is finished.

- **Which question comes next** is weighted by how well the child knows each one,
  weakest first, within what the level allows.
- **Every question is graded per presentation form**: unseen → tried → answered
  correctly → answered correctly and quickly. "Quickly" scales with how many
  objects are involved, so a larger question is not penalised for being larger.
- **Stars (0–3)** come from the level's whole item set, not from one run, so a
  replay can raise them. A level shows none until one run of it has been played
  through to a result: sets overlap, so level 2 would otherwise open already
  wearing a star earned by the counting it shares with level 1, and tapping into a
  level and leaving again would light it up just the same.
- **Clearing** — which plays the celebration — needs no timeout in the run *and*
  at least one question ending up better known than it had ever been. A wrong
  answer the child then corrects is not a miss.
- **The next level opens** once every question in the current one has been
  answered correctly at least once, accumulated across runs.
- **`?unlock`** opens every level. Debug only: it is never written to the save, so
  it cannot corrupt real progress, and the map shows a flag while it is on.

### Progress

`localStorage` key `curiouslab.counting-pairs.v1`, flushed on answer, tab hide
and page unload, so it survives a refresh. The grown-up panel can erase it.

The key keeps its `.v1` suffix — it names the storage slot, not the shape. The
shape is versioned inside the blob and is currently 2, which added per-question
answer times, per-form records and per-level progress. A v1 save is migrated on
load: counts and timestamps carry over, best times start empty, and
"answered correctly at least once" starts false rather than being guessed from
the old counters — so the unlock gate re-earns itself instead of opening on a
guess.

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the
repository root with `actions/deploy-pages`. One-time setup: in the repository,
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

`.nojekyll` is present so no path is skipped by Jekyll processing.
