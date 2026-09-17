# CuriousLab

Small, self-contained learning games. Every page is static: no build step, no
framework, no server, no analytics. Progress is stored in the visitor's own
browser via IndexedDB.

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
| `assets/js/storage.js` | Local progress in IndexedDB, skill mastery, item history |
| `assets/levels/prompts.md` | Art briefs for the level covers and clear videos |
| `assets/levels/*.png`, `*.mp4` | Generated level covers and five- to six-second clear videos (Git LFS) |
| `assets/levels/prompts/` | The exact prompts each asset was generated from |
| `tools/genimage.py` | Generates images through the gpt-image-2 endpoint |
| `tools/genvideo.py` | Generates video clips through the Dreamina Seedance endpoint |

## Running locally

ES modules need a real HTTP origin, so `file://` will not work. Any static
server does:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

The level covers and clear videos are stored with [Git LFS](https://git-lfs.com).
A clone without it gets small pointer text files where the images and videos
should be, and the level map will show broken art:

```bash
git lfs install
git lfs pull
```

The Pages workflow passes `lfs: true` to `actions/checkout`, which is what keeps
the deployed site serving real files rather than pointers.

## Counting Pairs, phase one

A text-free game for children who may not read yet. The task is carried by
object arrangement, counts, numerals, arithmetic symbols and motion. There is
no voice and no sound effects in this phase.

- **Nine pairings** — cat/fish, monkey/banana, dog/bone, rabbit/carrot,
  bird/seed, lamp/star, pig/apple, mouse/cheese, hen/egg, each with its own
  container art and success interaction. Which of them a level may draw from is
  the level's own `cast` ceiling, so a pairing added for a late level cannot
  appear in an early one — see the ladder below.
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
  separately from a wrong answer. A spent error budget does not give time back:
  time was not what ran out.
- **Wrong answers are never punished.** The card wobbles back, the things that
  need counting are highlighted one at a time (the empty plates in subtraction,
  the source objects otherwise), and after a second miss two distractors dim and
  a correspondence hint is drawn — the child still completes the last step.
  In free practice a miss queues one gentler question in the same family rather
  than a replay, and the next question follows. Inside a level run there is no next
  question: the miss ends the attempt. A missed question carries more weight into
  the next run.
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

| Level | Band | Content | Item set | Per run | Where each mode starts |
|---|---|---|---|---|---|
| 1 | 👌 up to 3 | counting | 3 | 3 | counting: cartoon |
| 2 | 👌 up to 3 | counting, addition | 6 | 5 | both: cartoon |
| 3 | 👌 up to 3 | addition, subtraction | 6 | 8 | addition: numeral cards · subtraction: cartoon |
| 4 | 🖐 up to 5 | counting, addition | 15 | 10 | counting: cartoon · addition: numeral cards |
| 5 | 🖐 up to 5 | counting, addition, subtraction | 25 | 10 | counting and subtraction: cartoon · addition: numeral cards |
| 6 | ☝️✊ up to 10 | counting | 6 | 12 | counting: cartoon |
| 7 | ☝️✊ up to 10 | counting to 10, addition to 8 | 38 | 12 | counting: numeral cards · addition: numeral cards |
| 8 | ☝️✊ up to 10 | addition, subtraction within 8 | 56 | 12 | both: numeral cards |
| 9 | ☝️✊ up to 10 | addition, subtraction within 10 | 90 | 12 | both: numeral cards |
| 10 | ☝️✊ up to 10 | addition, subtraction within 10 | 90 | 12 | addition: numbers only · subtraction: numeral cards |

The hand sign marks the number range a stretch of the path covers. Ten is spelled
with two signs because no single hand shape says it: a raised finger and a fist read
as the digits 1 and 0, which keeps the whole set hands rather than mixing in a
numeral the child may not read yet.

The last two levels share one item set of ninety and differ only in how addition is
posed: level 9 opens a sum with the objects, level 10 with the numbers alone. Twelve
questions against ninety items means neither is finishable in a sitting, which is the
shape of the top of the ladder rather than an oversight — a run is as long as a child's
attention, and that does not grow because the item set did.

Level 10's addition has no cartoon rung to start from, but a sum left eight seconds
unanswered still softens to one. The softening is keyed to the form, not to the level's
ladder, and it earns no credit; with one try a question it is the only thing between a
stuck child and a dead end. What the level withholds is the objects in the question as
posed, not the hand held out afterwards.

An item set is enumerated, not a random range: level 5's twenty-five are
`count 1..5`, every `a + b ≤ 5`, and every take-away under five. Because a run
usually asks fewer questions than the set holds, coming back is how a level is
finished.

**A level may work in two ranges at once.** Level 7 counts to ten and adds to eight,
because they are different skills at different stages: the counting is what level 6
just drilled, and the arithmetic is the new thing, so capping the sums keeps the
addends inside numbers the child has only just learned to count. One range for the
whole level would have had to be wrong in one direction or the other — sums to ten
over quantities met a level ago, or counting held back to eight for no reason visible
on screen. A level names only the ceilings that differ from its own; everything
unnamed reads the level's own bounds, and the mode's ceiling — not the level's — is
also what decides which skill an answer is filed under.

By the time a child reaches level 7 the counting is largely mastered, so the
weighting draws it rarely: counting is about a twentieth of the pull there, and many
runs ask none of it at all. That is the intended behaviour of "weakest first" and not
a level failing to ask what it declares — the questions are in the set, and a child
who is still shaky on counting to ten will meet them.

Levels 3 and 6 go the other way and ask *more* questions than they have items.
Level 3 asks eight of six, because there is no way to ask eight distinct sums and
take-aways under three; it repeats two, deliberately, since a small set is what
makes repetition useful. Level 6 asks twelve of six because its six items each have
two presentation forms, and twelve is exactly the number of item-forms — a clean run
can meet every one of them once before anything repeats.

**Presentation is declared per mode, not per level**, which is the level table's
difficulty knob. A mode's forms are a ladder — cartoon objects with previews,
then numeral-only answer cards, then bare numerals — and a level says where each
of its modes joins that ladder. Level 3 starts addition at numeral cards because
level 2 already had the child answering those same sums with the objects in view,
while starting its brand-new subtraction at the bottom. A rung above the entry
opens only once the one below it has been answered correctly.

**Arithmetic is drawn more often than counting** where a level has both, by a
per-mode weight rather than by whatever proportion the enumeration happens to
produce. Counting is the ground the levels stand on and is mostly known by the
time a level pairs the two.

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
- **A question stuck for eight seconds gives back its pictures.** The presentation
  forms withhold things — `prompt` keeps the objects off the answer cards, `bare`
  keeps them off the question too — and after eight seconds with nothing answered
  the withheld half is put back: `bare` gains the objects in the question, `prompt`
  gains the previews on the cards. One step only, and `full` has nothing left to
  give. The clock keeps running and the cards do not move, so a child mid-thought
  loses nothing.

  **A softened question earns no grade.** Its form's record is not written at all —
  not written and then discounted — so it cannot raise a grade, beat a best time,
  count as the improvement a clear needs, lift the level's star fluency, or open the
  next rung of the form ladder. The one thing it does record is that it happened, so
  "never answered this form" can be told from "kept needing it made easier". What
  still counts is coverage: the child did produce the right number, and coverage asks
  only that, so a question answered with help is still a question answered — it fills
  a coverage pip on the result sheet, though the stars that open the next level are
  unmoved by it, since those read the form records a softened answer never writes. Eight seconds is measured on the answer stopwatch rather than the countdown,
  because the countdown varies with the child's recent pace and restarts at half
  length on a retry.

  The same applies to a wrong tap on a `bare` question, which already revealed the
  objects so the counting walkthrough had something to walk over. Otherwise tapping
  any card would be a faster way to get the objects than waiting for them, and would
  still earn the harder form's grade.
- **A question can be lost two ways**: the clock runs out, or the level's error
  budget does — `maxErrors`, counted per question rather than per run. Both mean
  the same thing, that the child never reached the answer, and both raise the same
  encouragement screen. A wrong answer the child then corrects is not a miss; that
  is what the whole feedback sequence is for.
- **A lost question ends the attempt.** The encouragement screen plays and the
  child is returned to the map, with the attempt recorded as a failure — no result
  sheet, because a failed run has no stars gained or questions improved to read,
  and putting a panel up to say so would only be something to dismiss. It used to
  carry on through the remaining questions, which taught the wrong thing: the
  clear was already gone by then and nothing later in the run could earn it back.
  What failure does **not** do is take back what was learned — every answer is
  written as it lands, so correct answers still count and the stars on the map can
  rise because of them. What it does cost is the next level: stars alone used to
  open it, so a lost attempt could unlock on the strength of the questions answered
  before the miss. **The gate now wants the run finished as well**, so a failed
  attempt opens nothing and the child plays the level again. The stars it earned are
  still shown, and they count the moment a run gets to the end. An unlock still
  plays on the map once, on the run that earns it, and not again on every later run
  of a level already finished.
- **The error budget only ever tightens**: three tries a question on levels 1 to 3,
  two from level 4, and one from level 8. It began as a property of the band — the
  5-band asks about sums the child has already met below it, so two tries leaves room
  for a slip without leaving room for working through the four cards one at a time —
  but level 8 allows one try while sitting in the same band as levels 6 and 7, so what
  holds is the direction rather than the band: a level never hands back a try the level
  below it did not have.

  One try means the first wrong tap ends the question. It does not mean the child is
  told less: a spent try plays the whole feedback sequence — the objects revealed, the
  tapped number shown against them, the counting walkthrough — before the budget is
  checked. Being shown why an answer was wrong is not the same as being given another
  go at it, and only the second is what level 8 withholds.
- **Clearing** — which plays the celebration — needs a run with nothing lost *and*
  at least one question ending up better known than it had ever been. **At three
  stars the second half is dropped**: most of the set is already fluent, so the only
  way left to improve is beating a personal best already near the floor a child can
  physically produce, and without this the celebration would become permanently
  unreachable on exactly the levels a child knows best. Mastery buys the story back,
  and losing nothing is enough. A miss still ends it at any star count.
- **The next level opens** once the current one has earned a star — the same star
  the map is showing, not a second quantity computed behind it. The gate used to be
  coverage, every question in the level answered correctly at least once, and that
  was a genuinely different measure: stars are a *mean* over the item set while
  coverage is an *and* over it, so a handful of fluent questions could carry the mean
  to three stars while two questions had never been answered at all. The level then
  sat on the map wearing three stars with the next one locked and nothing on screen
  able to explain the difference. Reading the gate off the number the child can see
  is what stops the map contradicting itself.

  A level shows no stars until a run of it has been played to an outcome — a lost
  attempt counts for this, since its correct answers were still given. The gate reads
  that same played-gated number, which is what keeps one level's work from opening
  two: item sets overlap, so mastering level 1 alone already scores level 2 a star
  against its own items, and a gate reading the raw score would open level 3 as well.
  On top of that the gate wants the run **finished** — reaching the last question
  without losing one. Playing and losing is therefore enough to show a star and not
  enough to open anything.

  So the rule in full is: finish a run of a level, earn a star on it, and the next
  level opens. Because of the overlap some levels are already at one star from the
  ladder below before any of their own new questions is answered, which makes the gate
  on those levels effectively "get through a run of it without losing a question" — a
  low bar on purpose, since being stuck behind a level is worse for a small child than
  arriving at the next one early.
- **Cover and celebration art** is briefed in `assets/levels/prompts.md` and
  generated into `assets/levels/`: one still cover per level, and one five- to six-second
  clear video with a small story in it — a surprise the child can read without
  words or sound. No clip may change how many of anything is on screen, because the
  count the child just made is still fresh.
- **The cover opens the level and the clip closes it.** Tapping a level shows its
  cover full-screen before the first question; clearing it plays that level's clip
  over the result. The clip starts from the cover frame, so the two read as one
  place. **The last frame is then held for two seconds**, paused on the clip's own
  final pose rather than cut away from it, and a tap inside that beat goes straight
  back to the map — the child has finished looking, and the result sheet only offers
  replaying or leaving. A skipped clip is not held — it was skipped because the child
  had seen enough — and neither is a broken one, which has already been replaced by
  the star burst. A clip that stalls past the nine-second ceiling *is* held, on
  whatever frame it reached. A cover or clip that will not load degrades rather than
  breaks — sprites for the cover, the star burst for the clip — and under
  `prefers-reduced-motion` the cover is held as a still instead of the clip playing,
  since that query does not reach a `<video>` on its own.
- **The clip is fetched while the level is being played**, starting the moment its
  cover opens rather than when the celebration begins. These files run from three
  to seven megabytes, so on a slow connection a download that starts at the
  celebration either stutters through the clip or is still arriving when
  the nine-second ceiling gives up on it — a child who answered everything right
  would get the fallback star burst. One level's clip is held at a time, and it is
  released when the level is left without earning it: backing out of the cover,
  walking out part-way, losing the run, or finishing one that did not clear. Under
  `prefers-reduced-motion` nothing is fetched at all, since the clip will not
  play.
- **A lost question gets its own screen**: the level's character, a pulse and three
  arrows running the way the map's path runs. Vector art from the existing sprite
  sheet, wordless, and it waits for a tap rather than timing out. This screen is
  where a run ends, and a screen that leaves on its own would take that moment away
  from the child before they had read it. Its figure loops for the same reason — a
  still frame with no motion on it reads as finished rather than as waiting, and
  there is no text here to say which it is. Escape counts as the tap, so a keyboard
  is not stranded behind it.
- **The map scrolls once there are more levels than fit.** Its height is a
  per-level allowance rather than the height of the window, so beyond a certain
  count the path grows downward and the map is dragged or wheeled instead of being
  squeezed — squeezing it would put the nodes on top of each other. A map that
  scrolls always draws the climbing portrait curve, whatever shape its box measures,
  because the scroller only runs vertically. It opens centred on the furthest level
  the child has open rather than at the top: the path climbs, so the top is the
  locked far end, and a beginner would otherwise arrive at a screen of locks with
  the one playable level below the fold.
- **`?unlock`** opens every level. Debug only: it is never written to the save, so
  it cannot corrupt real progress, and the map shows a flag while it is on.

### Progress

Stored in **IndexedDB** — database `curiouslab`, object store `progress`, record
key `curiouslab.counting-pairs.v1` — with a `localStorage` mirror under the same
key. Flushed on answer, tab hide and page unload, so it survives a refresh. The
grown-up panel can erase it. Nothing leaves the device.

Both copies are written on every flush, and that is not redundancy for its own
sake. IndexedDB has the room to grow: per-item, per-form history is already the
biggest thing here and it grows with every question the child meets, while
localStorage is a few megabytes shared across the whole origin. But IndexedDB
writes are asynchronous and a closing tab need not wait for a transaction, so the
last answer of a session — the one that just earned the star — is the write most
likely to be dropped; `localStorage.setItem` is synchronous and has landed when it
returns. On load the copy with the later `updated` wins, which is also what moves
an existing player's localStorage-only history into IndexedDB with no separate
import step.

If IndexedDB is unavailable — private browsing, a locked-down profile — the game
runs on the mirror alone rather than failing.

The key keeps its `.v1` suffix — it names the storage slot, not the shape. The
shape is versioned inside the blob and is currently 2, which added per-question
answer times, per-form records and per-level progress. A v1 save is migrated on
load: counts and timestamps carry over, best times start empty, and
"answered correctly at least once" starts false rather than being guessed from
the old counters — so progress re-earns itself instead of resting on a guess.

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the
repository root with `actions/deploy-pages`. One-time setup: in the repository,
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

`.nojekyll` is present so no path is skipped by Jekyll processing.
