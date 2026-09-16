# Level art briefs

Copy for the generated art behind each level: **one cover still** and **one 5-second
clear video** per level. These briefs are what to send to the generators, and they
live here so the brief and its output end up in the same directory.

`assets/js/levels.js` stores only the file names. Everything below is for the
generator and for whoever reviews what comes back — nothing here is read at
runtime.

## Two pipelines now, not one

Earlier drafts of this file assumed a still-image API only, so the clear
"animation" was one held frame with CSS moving it. That constraint is gone: the
clear moment is now a **generated 5-second video**, which is what makes an actual
story possible — a turn, a surprise, a resolution. Covers stay stills.

What that changes:

- Each level names two assets: `lN-cover.webp` and `lN-clear.mp4`.
- The transparent per-part layers the old briefs asked for (a gate to swing, two
  banana piles to slide) are **no longer needed**. The video does that motion.
- A video generator takes a *prompt plus a start frame*. **Every clear video starts
  from its own level's cover image, without exception.** This is the standing rule
  for all future levels too, not a per-brief choice: the celebration grows out of
  the picture the child has been looking at on the map, so the cover stops being a
  thumbnail and becomes the first frame of the story. Generate the cover first,
  then feed it in as frame one.

  In practice that means sending the cover PNG as a second `content` entry
  alongside the prompt text, and **dropping `--ratio` from the prompt**: the
  service takes the output ratio from the first frame and rejects a request that
  also states one. `--resolution` is still needed.

## Story rules for a 5-second clip

Five seconds is roughly **beat / turn / landing** and nothing more. Each brief
below is written as three beats with a second-count, because a story prompt
without timing comes back as one continuous drift.

The surprise has to be legible to a 3–6 year old with **no words and no sound**,
which rules out most twists. Five that work at this age, one per level, and they
escalate:

1. **The thing you gave them does something back** — the objects the child just
   delivered act on their own. Funny because it breaks the rule that food sits
   still, and it needs no setup.
2. **The objects do the work themselves** — the same trick raised: they rearrange
   without being carried.
3. **The objects build something** — they do not just move, they become a
   structure that was not there before, and the characters use it.
4. **What looked like the end was a door** — the goal opens onto more.
5. **The thing they never did, they finally do** — a capability held back across
   the whole ladder, spent here.

### Drama: resistance before release

The first drafts of these clips were flat, and the reason was structural rather
than a matter of degree: the surprise arrived immediately and then simply
continued. A thing that starts happening at 1.5s and keeps happening until 5.0s
has no shape, however charming the thing is.

So every clip below is built on **resistance, then release**:

- **Beat one is a try that does not work.** The characters reach and the objects
  do not move; the gate is pushed and it sticks. About a second, and it is what
  makes the rest legible as a reversal instead of an event.
- **Beat two overshoots.** When the release comes it is bigger than the setup
  asked for — a fountain rather than a slide, a burst rather than a swing.
- **Beat three lands, with a wobble.** Something teeters and settles. This is
  where a young child's held breath is let out, and a clip without it reads as
  merely pleasant.

The wobble must never resolve into loss. Nothing that teeters actually falls,
nothing breaks, and nobody's things are taken — see the hard rule below. The
tension is *will it work*, always answered yes, and never *is something bad about
to happen*.

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
- All covers must read as one set: same light direction (upper left), same outline
  weight, same background sky.
- Cover: square, at least 1024×1024. Video: square, 5s, loop not required, hold
  the final pose for the last ~0.5s so the ending does not feel cut off.
- **Covers ship as WebP.** The image endpoint returns PNG, so converting is a step
  after generation: `Image.open(src).save(dst, 'WEBP', quality=95, method=6)`.
  It costs about 83% of the file size, and on flat vector fills q95 moves the
  closest pixel to a named hex by under 4/255 while leaving each colour family's
  area unchanged — invisible, and worth it for a page a phone has to load. The
  PNGs are not kept; regenerate from the prompt if an original is ever needed.
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
| Dog | `sp-dog` | body `#c08f6a`, head `#d6a479`, ears and tail `#a2724f`, muzzle `#f4e0c8`, nose `#3a2f28`, features `#33291f`, tongue `#e8748a` |
| Bone | `sp-bone` | body `#f2ead6`, shading `#d8cdb2` |
| Rabbit | `sp-rabbit` | body `#f3f0ea`, head `#fbf9f4`, ear outer `#e6e1d8`, ear lining `#f2b8c0`, nose `#e88a9a`, whiskers `#b7ae9e`, features `#33291f` |
| Carrot | `sp-carrot` | root `#f0862f`, shadow side `#e0741f`, ridges `#c9611a`, leaves `#54a84b` / `#63bd57` / `#4a9a42` |
| Bird | `sp-bird` | head `#7cc0ef`, body `#5ba8e0`, wing and tail `#4a8fc9`, beak and legs `#f5a24a`, eye `#28323c` |
| Seed | `sp-seed` | husk `#f0cf90`, shading `#d9a94f` |
| Lamp | `sp-lamp` | shade `#e0574f` / `#c8443d`, bulb `#ffe9a8`, lit `#fff6d0`, unlit `#9a9083`, rays `#ffd469`, stem `#8a6a5a`, base `#7a5b4c` |
| Star | `sp-star` | point `#ffd44d`, inner `#ffe796` |
| Pig | `sp-pig` | body `#f0a3ad`, head `#f4b3bc`, ear `#e894a0` with `#f6c2c9` lining, snout `#e88a9a` with `#b85f70` nostrils, trotters and tail `#e08b98`, features `#3a2830` |
| Apple | `sp-apple` | skin `#d6453f`, shaded side `#b8332e`, highlight `#f08a84`, stem `#7a4a2a`, leaf `#58a84b` |
| Mouse | `sp-mouse` | body `#a8adb5`, head `#b6bcc4`, muzzle `#c4c9d0`, ear lining and tail `#f0b8c0`, whiskers `#8f949b`, features `#2e2a2c` |
| Cheese | `sp-cheese` | face `#f2c94c`, rind `#e0ac30`, cut top `#f7dd8c`, holes `#dba82c` |
| Hen | `sp-hen` | body `#cf7a4a`, head `#dc8b58`, wing and tail `#b8613a`, wing bar `#f0d8b8`, comb and wattle `#d8443c`, beak and legs `#f2b03c`, eye `#2c2620` |
| Egg | `sp-egg` | shell `#d9b48c`, shaded side `#c39a70`, highlight `#f0dcc0` |

Containers, if a brief needs one: bowl `#7fc8e8` / `#a8ddf2` with `#bfe6f5`
water, dog bowl `#c07f4c` / `#d99a63` / `#f0c9a0`, basket `#a5702f` / `#c98d4e`,
garden bed `#8b5e3c` / `#6f4a2e` soil with `#54a84b` growth, nest `#7d5528` /
`#8c6231` / `#a9773f`, glow `#ffd44d` / `#ffe796`. Pairings from
`pig-apple` on carry no container at all — the board delivers to the figures
themselves, so there is nothing for a brief to place.

Every figure is drawn **facing the viewer or three-quarter**, upright, with a large
head relative to the body — the sprite proportions. Not naturalistic animals.

Two sprites have a silhouette worth stating outright, because a generator will
default away from it: the dog's **ears hang long and low** beside its face rather
than standing up, and the bird is drawn **side-on**, one visible wing, beak in
profile — it is the only figure in the set that is not front-facing.

## Level 1 — counting within 3 · cat and fish · accent `#5cc3e8`

**Cover** — `l1-cover.webp`

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

**Clear video** — `l1-clear.mp4`, 5s, starts from `l1-cover.webp`

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

**Cover** — `l2-cover.webp` *(already generated; unchanged)*

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

**Clear video** — `l2-clear.mp4`, 5s, **first frame is `l2-cover.webp`**

Twist: *the bananas do it themselves.* Revised for drama: the first version had
the bananas leave the ground almost immediately and then simply arrive, which is
an event and not a story. Now the monkeys try first and fail — they pull at
bananas that will not budge — and only then does the fruit go off like a fountain
and land in a tower that nearly topples.

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
> **0.0–1.2s** both monkeys lean down and grab at their own banana pile with both
> hands, and pull — the bananas do not move at all. The monkeys pull harder, feet
> braced, cheeks puffed, and still nothing shifts. One monkey glances at the other,
> puzzled, ears twitching.
> **1.2–1.6s** both monkeys let go and sit back on their heels. Beat of complete
> stillness. Then every banana in both piles gives one small twitch in place.
> **1.6–3.2s** all the bananas launch straight up off the ground at once like a
> fountain, far higher than the tree canopy, spinning end over end against the sky,
> then rain back down into the empty patch between the monkeys and clatter into one
> tall stack. Both monkeys' heads snap up to follow them and back down again, arms
> flung out, mouths open.
> **3.2–4.3s** the tall stack sways hard to the left, then hard to the right, on the
> edge of toppling; both monkeys throw their hands out toward it, tails rigid. It
> swings back upright and settles with a small bounce, perfectly stacked, and
> nothing falls.
> **4.3–5.0s** both monkeys collapse backward laughing, arms over their heads, tails
> curled up, eyes as two happy closed upward arcs. Hold: one neat stack between them.
> Playful and bouncy. No text, no numbers, no letters.

## Level 3 — addition and subtraction within 3 · dog and bone · accent `#c08f6a`

The first level with no counting to fall back on: everything here is arithmetic,
and it is where subtraction is introduced. Warmer and more physical than the two
before it — dogs are the loudest figures in the set and this is the level where
the child stops being shown quantities and starts being asked to work on them.

**Cover** — `l3-cover.webp` *(to generate)*

> Flat vector children's picture-book illustration, square. Two friendly dogs with
> large round heads and **long ears hanging down low beside their faces**, sitting
> upright and seen three-quarter from the front, thick rounded dark outlines,
> minimal shading. Bodies `#c08f6a`, heads `#d6a479`, ears and tails `#a2724f`, pale
> `#f4e0c8` muzzles, dark `#3a2f28` noses, `#33291f` dot eyes. In front of each dog
> sits its own shallow cream-coloured dish, and in the middle between them a loose
> heap of pale bones `#f2ead6` with `#d8cdb2` shading, overlapping and jumbled. A
> winding cream-coloured path runs from the lower left past the dogs and off to the
> upper right. Soft blue sky `#eaf4f7`, a few simple green tufts of grass `#3f9e6b`.
> Light from the upper left. No text, no numbers, no letters, and no plus, minus or
> equals sign.

Two dishes and one shared heap is the level's grammar drawn directly: each actor
has a place for something, and there is a supply that has to be worked out. The
heap must be **jumbled and uncountable** — this level's item set runs across every
sum and every take-away under three, so any countable number of bones would
contradict most of the questions the child may have just answered. The dishes,
being one per dog, are the only thing on the cover it is safe to be able to count.

**Clear video** — `l3-clear.mp4`, 5s, **first frame is `l3-cover.webp`**

Twist: *the objects build something.* The bones do not merely move — they assemble
into an arch the dogs then run through. It raises level 2's trick one step, and it
plants the shape that level 4 opens with: a thing you can go through.

Bone count is never stated and never changes: the same jumbled heap becomes the
arch, every bone still on screen. Both dogs stay.

> Start from the provided image and keep the same camera, same style, same colours;
> the camera does not move.
> **0.0–1.2s** both dogs lean forward and nose their dishes toward the heap of
> bones in the middle, then push at the bones themselves with a paw. Nothing moves.
> They sit back, heads tilting, long ears swinging forward, and look at each other.
> **1.2–1.5s** stillness. One bone at the top of the heap rocks once, by itself.
> **1.5–3.2s** the whole heap lifts off the ground at once and the bones swing up
> and around each other, clicking together end to end, rising into a tall rounded
> archway standing over the path between the two dogs — built entirely of the same
> pale bones. Both dogs scramble backward onto their haunches, ears flying up off
> their heads, eyes wide, tails going.
> **3.2–4.2s** the finished arch sways once to the left and once to the right, bones
> creaking apart at the joints as if it might come down; both dogs freeze mid-crouch.
> It rocks back, clicks tight, and stands firm. Nothing falls.
> **4.2–5.0s** both dogs bolt through the arch together, leap off the ground on the
> far side and land facing the viewer, front paws up, tongues `#e8748a` out, eyes as
> two happy closed upward arcs, tails a blur. Hold: the two dogs mid-celebration
> with the bone arch standing behind them and the path running on through it.
> Boisterous and warm. No text, no numbers, no letters.

## Level 4 — counting and addition within 5 · rabbit and carrot · accent `#f0862f`

**Cover** — `l4-cover.webp` *(already generated as the old level 3 cover; unchanged
art, renamed file)*

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
region, so the cover should read as arriving somewhere new. That is why this art
moved here from level 3 when the ladder was restructured — the "somewhere new"
it promises is the new number range, and level 3 no longer starts one.

**Clear video** — `l4-clear.mp4`, 5s, **first frame is `l4-cover.webp`**

Twist: *what looked like the end was a door.* Revised for drama: the gate used to
simply swing open, which gave the clip no cost to pay before its reward. Now it is
stuck, and the rabbit has to throw itself at the thing twice before it bursts.

The carrot count here must be **deliberately unreadable**: a bundled armful, roots
overlapping, no clean silhouette to count. Levels 1 and 2 pin their counts because
each has one small answer on screen; level 4's item set spans `count 1..5` and every
`a + b ≤ 5`, so *any* countable number of carrots would contradict most of the
questions the child might have just answered. Ambiguity is the correct choice here.

> Start from the provided image and keep the same camera, same style, same colours;
> the camera does not move.
> **0.0–1.3s** the rabbit puts both front paws on the wooden gate and pushes. The
> gate gives a finger's width and stops, stuck. The rabbit pushes again, shoulder
> down, back legs digging in, ears flattening back with the effort — the gate creaks
> but does not open.
> **1.3–1.6s** the rabbit steps back, drops its ears, and looks at the gate. Beat.
> **1.6–3.0s** it throws itself forward and the gate bursts wide open, swinging fast
> on its left edge and rebounding off the fence post; the rabbit tumbles through in a
> roll, ears flying, and comes up on its feet in the carrot patch. Loose soil and a
> few green tops fly up around it.
> **3.0–4.0s** the rabbit pulls up an armful of carrots, orange roots `#f0862f` with
> green tops sticking out every direction, hugs them to its chest and turns to face
> the viewer, ears straight up, eyes as two happy closed upward arcs. It looks like
> the ending.
> **4.0–4.7s** behind it the gate, still swinging, comes all the way round and
> reveals that the path does not stop here: it winds far away into the distance past
> two more small wooden gates, getting smaller toward the horizon, the sky opening
> up wider and warmer above it. The rabbit's ears tip forward and it turns its head
> to look down the long path.
> **4.7–5.0s** hold: rabbit holding its carrots, looking down the open road.
> Effortful at the start, expansive at the end rather than triumphant. No text, no
> numbers, no letters.

## Level 5 — counting, addition and subtraction within 5 · bird and seed · accent `#5ba8e0`

The top of the ladder as it stands: every mode, the widest item set, and the level
that takes the most returning to finish. Its clip has to be the biggest of the
five, because it is the one a child arrives at last.

**Cover** — `l5-cover.webp` *(to generate)*

> Flat vector children's picture-book illustration, square. Three small round
> songbirds drawn **side-on in profile, each with one visible wing**, standing on
> the ground among a wide scatter of pale seeds, large round heads, thick rounded
> dark outlines, minimal shading. Heads `#7cc0ef`, bodies `#5ba8e0`, wings and tails
> `#4a8fc9`, orange `#f5a24a` beaks and legs, `#28323c` eyes with a small white
> highlight. The birds overlap each other so they do not form a countable row. Pale
> gold seeds `#f0cf90` with `#d9a94f` shading scattered loosely across the ground.
> A winding cream-coloured path runs from the lower left away to the upper right and
> off toward a low horizon, under a tall open sky `#eaf4f7` shading to `#d9ecf2` at
> the top, with room above the birds. A few simple green tufts `#3f9e6b`. Light from
> the upper left. No text, no numbers, no letters.

Two things this cover has to do that the others do not. The birds must **overlap
into a clump** rather than line up — this level's item set is every count to five
and every sum and take-away under five, the widest of the ladder, so a countable
group would contradict more questions here than anywhere else. And it needs
**empty sky in the upper two thirds**, because the clip's payoff happens up there
and the camera cannot move to find room.

**Clear video** — `l5-clear.mp4`, 5s, **first frame is `l5-cover.webp`**

Twist: *the thing they never did, they finally do.* Every figure across the whole
ladder has stayed on the ground — cats sat, monkeys sat, dogs ran, the rabbit
hopped. These are birds, and they have wings that have not once been used. Level 5
spends that: they fly. It is the only twist in the set that pays off something the
child has been looking at since level 1 without knowing it was loaded.

The birds must stay **in frame** — rising, wheeling, overlapping — and not leave.
A bird flying out of shot reads as one fewer bird, which is the one thing these
clips may not say. The seeds stay on the ground, untouched and uncounted.

> Start from the provided image and keep the same camera, same style, same colours;
> the camera does not move.
> **0.0–1.3s** the three birds peck at the seeds on the ground, hop a step, and one
> crouches and gives a small flap — a hop that gets nowhere, feet never leaving the
> ground. It tries again, wing beating hard, and stays down. It settles and looks at
> the others.
> **1.3–1.6s** all three go completely still at once and turn their heads to look
> straight up at the open sky.
> **1.6–3.4s** all three launch upward together, wings opening wide for the first
> time, and climb into the empty sky above the seed patch — bodies overlapping and
> crossing each other, wings at full stretch, far bigger in the frame than they were
> on the ground. The scattered seeds and the path stay exactly where they were below.
> **3.4–4.4s** the three wheel round together in one wide turn high in the frame,
> one bird dipping and catching itself, and the sky behind them warms from pale blue
> into a soft amber `#e8a33d` glow along the low horizon, the path below lit up and
> running away to it.
> **4.4–5.0s** hold: the three birds hanging in the bright sky, wings spread, eyes
> as happy closed arcs, the lit path running to the horizon far below them.
> Soaring and wide open — the biggest moment of the five. No text, no numbers, no
> letters.

## Continuity across the five clips

The five are not independent. Read in order they should feel like the same world
opening up: a quiet pool, then a noisy game, then something built, then a road out,
then the sky.

- The **path** appears in all five and always runs the same direction, lower left
  to upper right. It is the same path as the map's ribbon.
- **Light stays upper-left** in every frame of every clip. A generator will drift
  on this; check it on delivery.
- Each clip ends **wider than it started** — one more fish, one merged pile, an
  arch to run through, a long road, open sky — because the reward for finishing a
  level should feel like more, not like a door closing.
- The **scale of the reversal grows** with the ladder: food that wiggles, then food
  that flies, then food that builds, then a wall that turns out to be a door, then
  the ground itself let go of. A child replaying level 1 after level 5 should feel
  level 1 as small, and that is correct.
- **Every clip starts from its own cover.** Frame one of each video is the still
  the child taps on the map, all five of them, measured at 3.0 to 3.9 mean abs
  diff from the cover file.

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
- The clip needs a run that lost nothing *and* improved something — except at three
  stars, where improving is no longer asked for. Worth knowing when judging how
  often a clip will be seen: early on, nearly every run plays it; on a level being
  mastered it becomes rare; on a mastered one it returns for every clean run.

Worth keeping in mind when writing any further level: the board dims all but one
distractor after two errors, so with `maxErrors: 3` the last try is a choice
between two cards. The budget is reachable, but it is not a likely ending — which
is the right way round for a game a small child is playing.
