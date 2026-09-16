# Level art briefs

Copy for the generated art behind each level: **one cover still** and **one 5-second
clear video** per level. The files are not in the repository yet; these briefs are
what to send to the generators, and they live here so the brief and its output end
up in the same directory.

`assets/js/levels.js` stores only the file names. Everything below is for the
generator and for whoever reviews what comes back — nothing here is read at
runtime.

## Two pipelines now, not one

Earlier drafts of this file assumed a still-image API only, so the clear
"animation" was one held frame with CSS moving it. That constraint is gone: the
clear moment is now a **generated 5-second video**, which is what makes an actual
story possible — a turn, a surprise, a resolution. Covers stay stills.

What that changes:

- Each level names two assets: `lN-cover.png` and `lN-clear.mp4`.
- The transparent per-part layers the old briefs asked for (a gate to swing, two
  banana piles to slide) are **no longer needed**. The video does that motion.
- A video generator takes a *prompt plus a start frame*. Every clear video below
  is written to **start from that level's own cover image**, so the celebration
  grows out of the picture the child has been looking at on the map instead of
  cutting to a new scene. Generate the cover first; feed it in as frame one.

## Story rules for a 5-second clip

Five seconds is roughly **beat / turn / landing** and nothing more. Each brief
below is written as three beats with a second-count, because a story prompt
without timing comes back as one continuous drift.

The surprise has to be legible to a 3–6 year old with **no words and no sound**,
which rules out most twists. Three that work at this age, one per level:

1. **The thing you gave them does something back** — the objects the child just
   delivered act on their own. Funny because it breaks the rule that food sits
   still, and it needs no setup.
2. **The objects do the work themselves** — the same trick raised: they rearrange
   without being carried.
3. **What looked like the end was a door** — the goal opens onto more.

**One constraint that cuts across all three: the clip may not change how many of
anything there are.** The child has just built a one-to-one correspondence — three
cats, three fish — and the celebration plays with that answer still fresh. An extra
fish arriving as a friendly surprise reads to a four-year-old as *the count was
short*, because at this age they count what is on screen and do not privilege the
moment the question was asked. So no figure that belongs to a counted set may enter
or leave during a clip. A character from **neither** set (a passing bird, a
butterfly) is safe, because it is never what the child was asked to supply.

Hard rule: **the surprise is never a threat, a loss, or a trick on the child.**
Nothing chases anyone, nothing breaks, nobody's things get taken. The reversal is
always *better than expected*, because this clip plays at the exact moment a child
has just succeeded and it is the reward for it. A scare here would teach them that
finishing is risky.

## House style — put this on every prompt, still and video

- Flat vector illustration, thick rounded outlines, minimal shading. Friendly
  picture-book register, not glossy 3D, not Pixar-style rendering.
- Palette from `games/counting-pairs/game.css` `:root`, so art and UI are one
  world: ink `#23303a`, sky `#eaf4f7` and `#d9ecf2`, paper `#fffdf8`, green
  `#3f9e6b`, warm amber `#e8a33d`, teal ring `#2f8f9d`.
- **No text, numerals, or letters anywhere.** The game is wordless, and a number
  painted into the art would sit beside a question about numbers and contradict
  it. This applies to every frame of video, including any signage or decoration.
- Subject centred, generous margins. A cover is cropped to a circle on the map,
  so nothing that matters may sit near a corner.
- The three covers must read as one set: same light direction (upper left), same
  outline weight, same background sky.
- Cover: square, at least 1024×1024. Video: square, 5s, loop not required, hold
  the final pose for the last ~0.5s so the ending does not feel cut off.
- **Character designs must match the in-game sprites** — the child has just spent
  a whole level with these figures and a different-looking cat is a different cat.
  Exact colours are given per level below, taken from `assets/js/art.js`.
- **Camera stays still.** No pans, no zooms, no dolly. The characters move; the
  frame does not. A moving camera makes the cover-to-video match read as a cut.

### Character reference, from the sprites

| Figure | Sprite | Colours |
|---|---|---|
| Cat | `sp-cat` | body `#f7b264`, face `#ffc478`, inner ear `#f8d6ae`, tail stroke `#e79a44`, features `#33291f`, nose `#e8825f` |
| Fish | `sp-fish` | body `#5cc3e8`, fins and tail `#2f96c4`, eye `#22333f` on white |
| Monkey | `sp-monkey` | limbs and ears `#a9723f`, body `#c98a58`, muzzle and belly `#efd0a9`, features `#33291f`, mouth `#8a5c33` |
| Banana | `sp-banana` | peel `#f7d84a`, crease `#e0b92c`, stem `#7c6420` |
| Rabbit | `sp-rabbit` | body `#f3f0ea`, head `#fbf9f4`, ear outer `#e6e1d8`, ear lining `#f2b8c0`, nose `#e88a9a`, whiskers `#b7ae9e` |
| Carrot | `sp-carrot` | root `#f0862f`, shadow side `#e0741f`, ridges `#c9611a`, leaves `#54a84b` / `#63bd57` / `#4a9a42` |

Containers, if a brief needs one: bowl `#7fc8e8` with `#bfe6f5` water, basket
`#a5702f` / `#c98d4e`, garden bed `#8b5e3c` soil with `#54a84b` growth.

Every figure is drawn **facing the viewer or three-quarter**, upright, with a large
head relative to the body — the sprite proportions. Not naturalistic animals.

## Level 1 — counting within 3 · cat and fish · accent `#5cc3e8`

**Cover** — `l1-cover.png`

> Flat vector children's picture-book illustration, square. An orange tabby cat
> sitting upright at the start of a winding cream-coloured path, seen three-quarter
> from the front, large round head, thick rounded dark outlines, minimal shading.
> Body `#f7b264`, face `#ffc478`, inner ears `#f8d6ae`, simple dark `#33291f` dot
> eyes, small `#e8825f` triangle nose. In front of the cat, a shallow round pool of
> pale blue water `#bfe6f5` with three small blue fish `#5cc3e8` with `#2f96c4`
> fins. The path curves from lower left toward upper right and leaves the frame.
> Soft blue sky background `#eaf4f7`, a few simple closed flower buds along the
> path edge. Light from the upper left. Calm and quiet — a beginning, not a party.
> No text, no numbers, no letters.

**Clear video** — `l1-clear.mp4`, 5s, starts from `l1-cover.png`

Twist: *the fish splash the cat.* The cat leans out over the water to say hello, and
all three fish flip their tails at once and splash it in the face. The cat sits there
dripping, blinks — then breaks into a laugh and pats the water back. The reversal is
leaning in gently and getting soaked, which is the reliable joke at this age.

**Three fish throughout, start to finish.** No fish enters, leaves, or hides.

And the fish are **never delivered to the cat** — they stay in their pool and the cat
plays with them over the edge of it. This matters because the cover has one cat and
three fish: in the game's grammar the child counts the *cats* and supplies one fish
per cat, so showing three fish handed to one cat would state a correspondence the
game never teaches. As pond fish the cat is visiting, they make no such claim. The
scene is a cat at a pond, not a cat being fed.

> Start from the provided image and keep the same camera, same style, same colours;
> the camera does not move.
> **0.0–1.5s** the three blue fish swim up to the near edge of the pool; the cat's
> ears tip forward and it leans out over the water to look at them, tail lifting,
> one front paw reaching toward the surface.
> **1.5–3.0s** all three fish flick their tails up at the same moment and throw an
> arc of pale blue water `#bfe6f5` droplets into the cat's face. The cat rocks back
> on its haunches, eyes wide, a few droplets sitting on its head and whiskers.
> **3.0–4.5s** the cat's eyes become two happy closed upward arcs and its mouth
> curves up — it is laughing, not upset. Its tail swishes and it pats the water back
> at them once. The three fish bob up and down in the pool. The closed flower buds
> along the path open into simple round flowers one after another, left to right, as
> the droplets fall on them.
> **4.5–5.0s** hold: cat laughing and dripping, three fish bobbing in the pool,
> flowers open.
> Gentle and playful, never startling — the splash is soft and slow, not a shock.
> No text, no numbers, no letters.

## Level 2 — counting and addition within 3 · monkey and banana · accent `#f7d84a`

**Cover** — `l2-cover.png`

> Flat vector children's picture-book illustration, square. Two small monkeys
> sitting on either side of a low round-canopied tree, seen three-quarter from the
> front, large round heads, thick rounded dark outlines, minimal shading. Limbs and
> ears `#a9723f`, bodies `#c98a58`, muzzles and bellies `#efd0a9`, dark `#33291f`
> dot eyes. Under each monkey a small pile of yellow bananas `#f7d84a` with
> `#e0b92c` creases, and a clear empty patch of bare ground between the two piles.
> A winding cream-coloured path passes behind the tree. Tree canopy green `#3f9e6b`
> with a warm brown trunk. Soft blue sky `#eaf4f7`. Light from the upper left.
> No text, no numbers, no letters, and no plus sign or other symbol.

The gap between the piles is the whole idea — it is where "put them together"
happens. Do not draw an operator; the gap says it.

**Clear video** — `l2-clear.mp4`, 5s, starts from `l2-cover.png`

Twist: *the bananas do it themselves.* The monkeys reach for the piles, and the
bananas hop into the middle on their own and stack themselves before either monkey
gets there. Both monkeys sit back, look at each other, then laugh. The joke is that
the food did the addition — funny at this age precisely because it breaks the rule
that food sits still, and it mirrors what the child just did without lecturing.

This clip **moves** bananas but never adds or removes one: every banana in the two
piles ends up in the merged pile. Both monkeys stay too.

The bananas are the monkeys' **own fruit that they are pooling**, not fruit the child
supplied — same reasoning as level 1. In addition mode the child counts the two
source groups and supplies one target object per actor, so two monkeys means two
bananas; a pile of five under each would state a correspondence the game never
teaches. Framing the piles as the monkeys' own harvest lets them stay pile-sized and
keeps the picture honest. Keep each pile **visibly small and roughly equal**, and do
not make either pile a clean countable row: what should read is *two piles becoming
one*, which is the shape of addition, not any particular sum.

> Start from the provided image and keep the same camera, same style, same colours;
> the camera does not move.
> **0.0–1.5s** both monkeys lean toward their own banana pile and reach out an arm.
> **1.5–3.0s** before either can pick anything up, all the bananas hop up off the
> ground on their own, arc through the air toward the empty patch between them, and
> land stacked into one neat pile in the middle. Small dust puffs where they land.
> Both monkeys freeze mid-reach with their arms still out.
> **3.0–4.5s** the two monkeys sit back, turn their heads to look at each other,
> then throw both arms up over their heads and curl their tails up; eyes become two
> happy closed upward arcs. The merged pile gives one small bounce in place.
> **4.5–5.0s** hold: both arms raised, one pile between them.
> Playful and bouncy. No text, no numbers, no letters.

## Level 3 — counting and addition within 5 · rabbit and carrot · accent `#f0862f`

**Cover** — `l3-cover.png`

> Flat vector children's picture-book illustration, square. A white rabbit standing
> upright in front of a closed wooden gate, seen three-quarter from the front, large
> round head, long upright ears, thick rounded dark outlines, minimal shading. Body
> `#f3f0ea`, head `#fbf9f4`, ear outsides `#e6e1d8` with `#f2b8c0` linings, dark
> `#33291f` dot eyes, small `#e88a9a` nose, pale whiskers. Behind the gate, a
> carrot patch in dark brown soil `#8b5e3c` with a few green carrot tops `#54a84b`
> showing above the ground. A winding cream-coloured path runs up to the gate and
> continues out of sight behind it. Warm wood-toned fence `#a5702f`. Soft blue sky
> `#eaf4f7`. Light from the upper left. No text, no numbers, no letters.

The gate is doing narrative work: this is the first level of the 🖐 within-five
region, so the cover should read as arriving somewhere new.

**Clear video** — `l3-clear.mp4`, 5s, starts from `l3-cover.png`

Twist: *what looked like the end was a door.* The rabbit gathers its carrots and
the clip looks finished — then the gate keeps swinging and reveals that the path
runs on much further, with more gates along it going into the distance. The reward
is not the carrots; it is finding out there is more ahead. This is the last level
that exists, so the clip is also the honest promise that the ladder continues.

The carrot count here must be **deliberately unreadable**: a bundled armful, roots
overlapping, no clean silhouette to count. Levels 1 and 2 pin their counts because
each has one small answer on screen; level 3's item set spans `count 1..5` and every
`a + b ≤ 5`, so *any* countable number of carrots would contradict most of the
questions the child might have just answered. Ambiguity is the correct choice here,
and it is the only place in the three clips where that is true.

> Start from the provided image and keep the same camera, same style, same colours;
> the camera does not move.
> **0.0–1.5s** the wooden gate swings open toward the viewer, pivoting on its left
> edge; the rabbit's ears go up and it hops through into the carrot patch.
> **1.5–3.0s** the rabbit pulls up carrots and gathers an armful of them, orange
> roots `#f0862f` with green tops sticking out, then turns to face the viewer with
> its ears straight up and eyes as two happy closed upward arcs. It looks like the
> ending.
> **3.0–4.5s** the gate keeps swinging further open and reveals that the path does
> not stop here — it winds far away into the distance past two more small wooden
> gates, getting smaller toward the horizon. The rabbit turns its head to look down
> the long path, ears tipping forward with interest.
> **4.5–5.0s** hold: rabbit holding its carrots, looking down the open path.
> Warm and expansive at the end rather than triumphant. No text, no numbers, no
> letters.

## Continuity across the three clips

The three are not independent. Read in order they should feel like the same world
opening up: a quiet pool, then a noisy game, then a road out.

- The **path** appears in all three and always runs the same direction, lower left
  to upper right. It is the same path as the map's ribbon.
- **Light stays upper-left** in every frame of every clip. A generator will drift
  on this; check it on delivery.
- Each clip ends **wider than it started** — one more fish, one merged pile, one
  long road — because the reward for finishing a level should feel like more, not
  like a door closing.

## How the code uses these files

All of it is wired up. Recorded here because every one of these was a way the art
could have landed in the repository and still not reached a child.

- `map.js` `buildNode` puts the cover over the level node, with the level's own
  sprites underneath it. `coverImage` reveals the `<img>` only on `load`, so a
  file that is not really there leaves the sprites showing rather than a broken
  image. That is the Git LFS case, not a hypothetical one: a clone without LFS
  serves a few lines of pointer text under a `.png` name.
- The cover is also a screen of its own, shown between tapping a level and its
  first question — `renderCover`. It is why the clip afterwards reads as the same
  place: every clip starts from this exact frame, so the cover is also its poster.
- `playClear` plays the level's own `clear` file: a muted, `playsinline` `<video>`
  with no controls, awaited by `endRun` so an unlock cannot cut it short. The star
  burst is still there as the fallback for a clip that will not load.
- `@media (prefers-reduced-motion: reduce)` does not cover a `<video>`, so
  `playClear` declines the clip by hand under that query and holds the cover still
  instead. Same scene, no motion.
- A lost question gets its own screen — `renderMiss` — drawn from sprites already
  in the sheet, because it has to say "that one got away, keep going" to a child
  who cannot read. There are two ways to lose one now: the clock, or the level's
  `maxErrors` budget.

Worth keeping in mind when writing a fourth level: the board dims all but one
distractor after two errors, so with `maxErrors: 3` the last try is a choice
between two cards. The budget is reachable, but it is not a likely ending — which
is the right way round for a game a small child is playing.
