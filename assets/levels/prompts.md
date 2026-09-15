# Level art briefs

Copy for the generated art behind each level. One cover and one clear frame per
level. The images are not in the repository yet; these briefs are what to send to
the image API, and they live here so the brief and its output end up in the same
directory.

`assets/js/levels.js` stores only the file names. The prose below is for the
generator and for whoever reviews what comes back — nothing here is read at
runtime.

## What the pipeline can and cannot give us

The image API returns **still images**. So a level's "clear animation" is a
single held celebration frame, and the movement is CSS on top of it: opacity,
translate, scale, rotate. Real frame-by-frame animation is not on the table, and
every brief below is written for that constraint — each one names the still to
generate, then what CSS does with it.

Where a brief asks for a part to move on its own (a gate swinging, two piles
sliding together), that part needs to come back as its **own file with a
transparent background**, because CSS can only move a layer, not a region of a
flat image. Those extra layers are called out per level.

## House style — put this on every prompt

- Flat vector illustration, thick rounded outlines, minimal shading. Friendly
  picture-book register, not glossy 3D.
- Palette from `games/counting-pairs/game.css` `:root`, so the art and the UI are
  the same world: ink `#23303a`, sky `#eaf4f7` and `#d9ecf2`, paper `#fffdf8`,
  green `#3f9e6b`, warm amber `#e8a33d`, teal ring `#2f8f9d`.
- Subject centred with generous margins. A cover gets cropped to a circle on the
  map, so nothing that matters may sit near a corner.
- **No text, numerals, or letters anywhere in the image.** The whole game is
  wordless, and a number painted into the art would sit next to a question about
  numbers and contradict it.
- The three covers must read as one set: same light direction (upper left), same
  outline weight, same background sky.
- Square, at least 1024×1024, transparent background where a layer is named.

## Level 1 — counting within 3

Cat and fish. Accent `#5cc3e8`.

**Cover** — `l1-cover.png`

> An orange tabby cat sitting at the start of a winding cream-coloured path,
> facing three small blue fish swimming in a shallow pool in front of it. The
> path curves from the lower left toward the upper right and out of frame. Soft
> blue sky background, a few simple flowers along the path edge. Flat vector,
> thick rounded outlines, upper-left light. Calm and quiet — this is a beginning,
> not a party.

Cat colours follow the `sp-cat` sprite: `#f7b264` body, `#ffc478` face,
`#33291f` features.

**Clear frame** — `l1-clear.png`

> The same cat and the same framing, now with its tail raised, ears forward and
> eyes closed in a contented squint. All three fish have come to rest at its
> feet. The flowers along the path are fully open.

Same camera as the cover, so the two can cross-fade in place.

**Layers**: none. Also generate `l1-clear-flowers.png` — just the flowers on
transparent — if the staggered bloom below is wanted.

**CSS movement**: cover cross-fades out, clear frame in; the three flowers pop in
80ms apart; the whole frame drifts up a few pixels and settles. Short and
restrained — no confetti.

## Level 2 — counting and addition within 3

Monkey and banana. Accent `#f7d84a`.

**Cover** — `l2-cover.png`

> Two small monkeys sitting on either side of a low tree, with a small pile of
> yellow bananas under each of them and an empty patch of ground between the two
> piles. The winding path passes behind the tree. Soft blue sky, tree canopy in
> green `#3f9e6b`. Flat vector, thick rounded outlines, upper-left light.

The gap between the piles is the whole idea — it is where "put them together"
happens. Do not draw a plus sign; the gap says it.

**Clear frame** — `l2-clear.png`

> The same two monkeys and the same tree, the two banana piles now merged into a
> single pile in the middle. Both monkeys have their arms raised and tails
> curled up.

**Layers**: `l2-clear-pile-left.png` and `l2-clear-pile-right.png` — each banana
pile alone on transparent, so the two can be slid together.

**CSS movement**: the two pile layers translate inward and stop; the merged pile
takes one small bounce as they meet. Same length and restraint as level 1.

## Level 3 — counting and addition within 5

Rabbit and carrot. Accent `#f0862f`.

**Cover** — `l3-cover.png`

> A white rabbit standing in front of a closed wooden gate. Behind the gate is a
> carrot patch with a few orange carrot tops showing above the soil. The winding
> path runs through the gate and away into the distance. Soft blue sky, warm
> wood-toned fence. Flat vector, thick rounded outlines, upper-left light.

The gate is doing narrative work: this is the first level of the 🖐 within-five
region, so the cover should read as arriving somewhere new.

**Clear frame** — `l3-clear.png`

> The same scene with the gate standing open, the rabbit just inside holding an
> armful of carrots with its ears up, and the path visible running further into
> the distance behind it.

The longer stretch of path is a promise that there is more after this — worth
keeping even though the ladder stops here for now.

**Layers**: `l3-clear-gate.png` — the gate alone on transparent, pivoting on its
left edge.

**CSS movement**: the gate layer rotates open about its left edge; the rabbit
takes two small hops and lands; the far stretch of path fades in last.

## Before the images exist

Level nodes wear the existing sprites — `sp-cat`, `sp-monkey`, `sp-rabbit`,
each with its pairing's target object tucked into the corner — rather than an
empty frame or a broken link. `levels.js` already names both the sprite and the
eventual file for every level, so nothing here has to be renamed or re-decided
when the art lands.

What is *not* wired yet: `map.js` reads `level.sprite` and ignores `level.cover`,
and the clear animation is a CSS star burst rather than the held frame described
above. Both are deliberate — there is no art to point at — but they mean dropping
the files into this directory is not on its own enough. Two changes are owed at
that point: `buildNode` should prefer `cover` and keep the sprite as the fallback
for a file that has not arrived, and `playClear` should show `clear` for the level
just played instead of the generic burst.
