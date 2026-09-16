# Level art briefs

Copy for the generated art behind each level: **one cover still** and **one five- to six-second
clear video** per level. These briefs are what to send to the generators, and they
live here so the brief and its output end up in the same directory.

`assets/js/levels.js` stores only the file names. Everything below is for the
generator and for whoever reviews what comes back — nothing here is read at
runtime.

## Two pipelines now, not one

Earlier drafts of this file assumed a still-image API only, so the clear
"animation" was one held frame with CSS moving it. That constraint is gone: the
clear moment is now a **generated video of five to six seconds**, which is what makes an actual
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

## Story rules for a short clip

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

Levels six to ten continue the escalation, and their clips run **6 seconds rather
than 5** — the reversals below need a longer resistance beat to land, and by this
point a child has sat through five of these and will hold still for another
second. The five beats become roughly 1.5 / 0.5 / 2 / 1.2 / 0.8.

6. **The gift is given back, bigger** — the first twist that reverses the
   *direction* of the relation instead of the behaviour of the objects. The lamp
   lights the stars; the stars light the lamp.
7. **The objects become a ride** — they do not merely move themselves, they carry
   the characters, which is the first time a counted thing takes charge of an
   actor.
8. **The objects become a place** — past building a structure: what gets built is
   inhabited, and the characters go inside.
9. **The objects were alive** — the strongest surprise available at this age. It
   is legal under the counting rule because the transformation is strictly
   one-for-one and visible: each egg becomes exactly one chick, so the number on
   screen never changes even though what it is made of does.
10. **The world answers** — nothing is transformed at all; the whole meadow lights
    up around what the child counted. It closes the loop with level six, one lamp
    grown into a field of light, and it is the widest ending of the ten because
    the top of the ladder should feel like open country rather than a bigger
    trick.

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
| Lamp | `sp-lamp` | shade `#e0574f`, rim `#c8443d`, post `#8a6a5a`, base `#7a5b4c`, bulb `#ffe9a8` / `#fff6d0`, unlit `#9a9083`, rays `#ffd469` |
| Star | `sp-star` | outer `#ffd44d`, inner `#ffe796` |
| Pig | `sp-pig` | body `#f0a0ae`, snout and inner ear `#f7bcc6`, features `#33291f` |
| Apple | `sp-apple` | body `#d6453f`, shadow side `#c5332b`, stem `#7c6420`, leaf `#54a84b` |
| Mouse | `sp-mouse` | body `#aebbc6`, inner ear and nose `#f2b8c0`, tail `#9aa7b0`, features `#33291f` |
| Cheese | `sp-cheese` | body `#f2c94c`, rind `#e0a832`, holes `#c98f22` |
| Hen | `sp-hen` | body `#c9563f`, breast `#e8a882`, comb and wattle `#e0574f`, beak and legs `#f5a24a`, features `#33291f` |
| Egg | `sp-egg` | shell `#d9b48c`, shading `#c19a6b` |
| Chick | *clip only, no sprite* | body `#ffd96b`, beak and feet `#f5a24a`, eyes `#33291f` |
| Sheep | *`sp-sheep`, to draw* | wool `#f2e6cf`, wool shading `#dcc9a8`, face and legs `#4a4a52`, ears `#3d3d44` |
| Clover | *`sp-clover`, to draw* | leaf `#4f9a34`, pale lobe `#63bd57` |
| Cow | *`sp-cow`, to draw* | body `#8a5a3c`, patches `#f2e6cf`, muzzle `#f2b8c0`, horns `#e0c9a0`, hooves `#4a4a52`, features `#33291f` |
| Hay bale | *`sp-haybale`, to draw* | bale `#e0b455`, straw ends `#f0cf90`, cords `#c98a1f` |
| Pony | *`sp-horse`, to draw* | body `#b4663a`, mane and tail `#7a4a2a`, muzzle `#e8c9a8`, hooves `#4a4a52`, features `#33291f` |
| Horseshoe | *`sp-horseshoe`, to draw* | shoe `#8fa3b2`, inner edge `#6b7d8a`, nail holes `#566672` |
| Duck | *`sp-duck`, to draw* | body `#f5d76e`, wing `#e0bd4a`, bill and feet `#f0862f`, features `#33291f` |
| Snail | *`sp-snail`, to draw* | shell `#8a63c0`, spiral `#6b4a99`, body `#c9c0cc` |
| Bee | *`sp-bee`, to draw* | body `#f0b429`, stripes `#3a2f28`, wings `#dff0f7`, features `#33291f` |
| Flower | `sp-flower` | petals `#f27a9b`, centre `#ffd44d`, stem `#54a84b`, leaf `#63bd57` |
| Goat | *`sp-goat`, to draw* | body `#c9bfae`, horns `#f2e6cf`, beard and hooves `#4a4a52`, muzzle `#e8dcc9`, features `#33291f` |
| Cabbage | *`sp-cabbage`, to draw* | body `#7fb069`, outer edges `#5c8f4a`, heart `#a8cc8a` |
| Squirrel | *`sp-squirrel`, to draw* | body `#c4703a`, tail plume `#a85a28`, chest `#f2e6cf`, features `#33291f` |
| Acorn | *`sp-acorn`, to draw* | nut `#e8c9a0`, cap `#6b4a24` |
| Elephant | *`sp-elephant`, to draw* | body `#9aa8b4`, inner ear `#c9b2b8`, toenails `#f2e6cf`, features `#33291f` |
| Peanut | *`sp-peanut`, to draw* | shell `#d9a86b`, seam `#b8813f` |
| Panda | *`sp-panda`, to draw* | fur `#fbf9f4`, patches, arms and legs `#33291f`, muzzle `#f2e6cf` |
| Bamboo | *`sp-bamboo`, to draw* | cane `#b5c94a`, joint rings `#8a9a2f`, cut end `#d4e07a` |
| Frog | *`sp-frog`, to draw* | body `#5aab4a`, belly `#8ecc6b`, features `#33291f` |
| Lotus pad | *`sp-lotus`, to draw* | pad `#3f9e9d`, veins `#2f7d7c` |
| Giraffe | *`sp-giraffe`, to draw* | body `#e0a84a`, patches `#b06f28`, mane `#8a5a3c`, muzzle `#f2e6cf`, hooves `#4a4a52`, features `#33291f` |
| Leaf | *`sp-leaf`, to draw* | blade `#4a8f5a`, centre vein `#7fb069` |
| Butterfly | *clip only, no sprite* | wings `#7d5bb8` |

Containers, if a brief needs one: bowl `#7fc8e8` / `#a8ddf2` with `#bfe6f5`
water, dog bowl `#c07f4c` / `#d99a63` / `#f0c9a0`, basket `#a5702f` / `#c98d4e`,
garden bed `#8b5e3c` / `#6f4a2e` soil with `#54a84b` growth, nest `#7d5528` /
`#8c6231` / `#a9773f`, glow `#ffd44d` / `#ffe796`. Pairings from `pig-apple`
onward carry no container at all — see `../sprites/expansion-plan.md`.

**Rows marked *to draw* invert the usual direction.** Everywhere else the brief
copies a colour out of `assets/js/art.js`; for these the brief is written first
and `art.js` is drawn to match it, because the cover has to exist before the level
does. The hex values in those rows are therefore a commitment, not a description:
whoever draws `sp-sheep` reads them off this table.

Pig, apple, mouse, cheese, hen and egg were drawn that way and are now drawn:
their rows describe `art.js` again, and the values are the ones the level six to
ten art was generated from. They were reconciled once, in that direction — the
covers and clips are generated files that already carry these colours, so where a
sprite disagreed with its own brief the sprite was corrected.

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

## Levels six to ten — the second five

These five have no entries in `assets/js/levels.js` yet and their sprites are not
drawn. The art is being made first on purpose: a cover is the slowest thing in a
level's chain and the only one that cannot be written in an afternoon, so it is
the thing worth having ready before the rules that use it. Band assignment below
is the intended shape — six to eight in the seven band, nine and ten in the ten
band — and it is a plan, not something the code agrees to yet.

Full prompts as sent are in `prompts/lN-cover.txt` and `prompts/lN-clear.txt`.
Each clip is **6 seconds** and starts from its own cover.

## Level 6 — counting within 7 · lamp and star · accent `#ffd44d`

The first level of the seven band, and counting returns the way it did at level
four: six and seven are new quantities and the child has never counted them.

It is also the first pairing in the set with no animal in it, which is why it sits
here rather than later. A lamp and a star are the two things a small child already
understands as *the same kind of thing* without being told — both are lights — and
that shared understanding is what makes the clip's reversal readable with no words.

**Cover** — `l6-cover.webp`

> One small table lamp standing in a low grassy meadow at dusk, seen straight on:
> trapezoid shade `#e0574f` with `#c8443d` rim, post `#8a6a5a`, oval base
> `#7a5b4c`, round bulb `#ffe9a8` with a `#fff6d0` centre and four short golden
> rays `#ffd469`. Small five-pointed stars `#ffd44d` with `#ffe796` inner points
> scattered loosely and unevenly across the whole upper sky, overlapping in places
> so they form no countable row. Sky pale `#eaf4f7` at the horizon, up through
> `#d9ecf2`, deepening to dusk blue `#9fc4d4` at the very top. The winding cream
> path, a few `#3f9e6b` grass tufts. Light from the upper left. No text, numerals
> or letters.

The first cover in the set that is not full daylight. It has to be, because stars
are the counted thing and stars do not read at noon — but the sky stays pale at the
horizon and only darkens at the top, so on the map it sits beside the other nine as
the same world in the evening rather than a different palette.

**Clear video** — `l6-clear.mp4`, 6s, **first frame is `l6-cover.webp`**

Twist: *the gift is given back, bigger.* Every reversal so far has been the objects
changing their behaviour. This one changes the direction of the relation: the lamp
spends the whole first beat straining its light upward and falling short, and then
the stars answer, pouring far more light back down than the lamp ever managed. A
three-year-old reads that as *they said thank you*, and it needs no words at all.

The stars may not move from their places in the sky, because they are the counted
set — they brighten and throw beams, and that is all.

## Level 7 — counting and addition within 7 · pig and apple · accent `#d6453f`

Addition arrives in the seven band. Sums to seven over a set the child has just
learned to count, which is the same step level two made inside the three band.

**Cover** — `l7-cover.webp`

> Three round pigs in an orchard clearing, front-facing and three-quarter, large
> round heads, bodies `#f0a0ae`, snouts and inner ears `#f7bcc6`, `#33291f`
> features, small curly tails, overlapping so they form no countable row. Round red
> apples `#d6453f` with `#c5332b` shadow sides, `#7c6420` stems and `#54a84b`
> leaves, scattered loosely on the grass. Behind them one round-canopied apple tree,
> `#8a6a5a` trunk and broad `#3f9e6b` canopy, with open sky `#eaf4f7` to `#d9ecf2`
> around it. The winding cream path. Light from the upper left. No text, numerals
> or letters.

**Clear video** — `l7-clear.mp4`, 6s, **first frame is `l7-cover.webp`**

Twist: *the objects become a ride.* The apples refuse to be pushed, then lift off
the grass, whirl into a ring, and scoop the pigs up to ride round in the air. First
time in the set a counted thing takes charge of an actor rather than the other way
round, and the funniest of the ten by a distance — a pig with its trotters out is
worth more to a four-year-old than any amount of elegance.

Every apple that starts on the grass ends on the grass. The three carrying pigs put
them down; nothing is eaten, which would be the obvious thing for a pig to do and is
forbidden, because an eaten apple is a smaller count.

## Level 8 — addition and subtraction within 7 · mouse and cheese · accent `#f2c94c`

Arithmetic only, no counting to fall back on: the seven band's answer to level
three. Subtraction is new at this width.

**Cover** — `l8-cover.webp`

> Three round mice on a warm pale wood floor `#f0e9db`, front-facing and
> three-quarter, big round ears, bodies `#aebbc6`, inner ears and noses `#f2b8c0`,
> tails `#9aa7b0`, `#33291f` features, overlapping so they form no countable row.
> Thick triangular cheese wedges `#f2c94c` with `#e0a832` rinds and round `#c98f22`
> holes punched through each face, lying at different angles in a loose scatter. A
> plain soft wall behind in `#eaf4f7` to `#d9ecf2`, empty across the upper two
> thirds. Light from the upper left. No text, numerals or letters.

The only interior in the set. It is worth the break in setting because the twist
needs a floor and a wall — a house built out on open grass would have nothing to be
a house against.

**Clear video** — `l8-clear.mp4`, 6s, **first frame is `l8-cover.webp`**

Twist: *the objects become a place.* Level three had bones build an arch and the
dogs ran through it; this goes one further — the wedges stack into a crooked house,
the holes light up into rows of glowing windows, a doorway forms, and the mice go
**inside**. The structure is not just used, it is inhabited.

Each wedge stays a whole wedge with its own holes all the way through, because the
wedges are the counted set and a wall of undifferentiated cheese would erase the
answer the child just gave.

## Level 9 — counting, addition and subtraction within 10 · hen and egg · accent `#d9b48c`

The first level of the ten band, and everything is in play at once. Ten is where
the item set gets large enough that a run stops being finishable in one sitting.

**Cover** — `l9-cover.webp`

> Three plump round hens in a straw nest hollow, front-facing and three-quarter,
> large round heads, bodies `#c9563f`, breast and cheek feathers `#e8a882`, combs
> and wattles `#e0574f`, beaks and legs `#f5a24a`, `#33291f` features, overlapping
> so they form no countable row. Smooth oval eggs `#d9b48c` with `#c19a6b` shading
> scattered loosely in the straw, which is `#f0cf90` with `#d9a94f` strands. Open
> sky `#eaf4f7` to `#d9ecf2` across the upper two thirds, clear of any object. The
> winding cream path, `#3f9e6b` grass tufts. Light from the upper left. No text,
> numerals or letters.

**Clear video** — `l9-clear.mp4`, 6s, **first frame is `l9-cover.webp`**

Twist: *the objects were alive.* The strongest surprise available at this age, and
held until ninth of ten for exactly that reason. The hens fuss over eggs that will
not budge, everything goes still, a crack appears — and every egg opens and lets out
one fluffy chick `#ffd96b`.

This is the one twist that needed checking against the counting rule rather than
just obeying it. It is legal, and narrowly: the transformation is **strictly
one-for-one and visible**. One chick per egg, no chick added or hidden afterwards,
and the empty shell halves stay in the straw beside each chick so the child can see
where each one came from. Three eggs become three chicks and the number on screen
never changes — only what it is made of. Written any looser (a nest that "fills with
chicks") it would break the rule outright.

## Level 10 — counting, addition and subtraction within 10 · sheep and clover · accent `#4f9a34`

The top of the ladder. Widest item set, every mode, and the level a child arrives at
last after the most returning.

**Cover** — `l10-cover.webp`

> Three round woolly sheep in a wide open meadow, front-facing and three-quarter,
> large round heads, wool `#f2e6cf` as a soft bumpy cloud outline with `#dcc9a8`
> shading, faces and legs `#4a4a52`, ears `#3d3d44`, `#33291f` features,
> overlapping so they form no countable row. Small three-lobed clover leaves
> `#4f9a34` with one paler `#63bd57` lobe each, scattered loosely in the `#3f9e6b`
> grass. The winding cream path to a very low horizon, tall open sky `#eaf4f7` to
> `#d9ecf2` across the upper two thirds. Light from the upper left. No text,
> numerals or letters.

The horizon sits lower here than on any other cover, and the sky is taller. That is
the whole composition brief: this is the one the child reaches last and it should
look like the most open place in the game.

Note for whoever draws `sp-sheep`: the wool `#f2e6cf` is only 12.5 from `--slot`
`#f0e9db`, the same trap `sp-rabbit` sits in. On the cover it is fine because it
sits against grass and sky, but the sprite needs its dark outline to carry it on the
answer cards.

**Clear video** — `l10-clear.mp4`, 6s, **first frame is `l10-cover.webp`**

Twist: *they solve it by standing on each other.* One violet butterfly drifts in
over the clover, all three sheep want it and all three miss it, it settles out of
reach — and they climb into a wobbling three-sheep tower to reach it, whereupon it
lands on the top sheep's nose and the tower folds laughing into the grass.

This replaced a first version, kept in git history, that had the sheep chase a patch
of evening sunlight until it slipped away, dusk fall, and then hundreds of fireflies
light the whole meadow. It generated badly, and the reason is worth recording
because it applies to any clip written from here on: it asked for too many things at
once. Fourteen named colours, three separate lighting changes in six seconds — dusk
descending, sparks igniting, a horizon warming — a want whose object was a moving
patch of light that cannot be nosed or carried, and a payoff of hundreds of
identical small glowing dots. A generator given that many simultaneous instructions
satisfies some and drops others, and there is no way to tell it which ones matter.

What the rebuild does instead: one new figure on stage instead of hundreds, and it
is an ordinary solid object a sheep can chase. One lighting change instead of three,
at the very end, the same amber horizon every other clip closes on. The sky never
changes at all. Twelve named colours. The want is physical from the first frame —
three animals lunging at something and missing — and the payoff is a pose rather
than a light show, which is the one kind of thing these models render reliably.

Two things this clip must not do. The clover may not move, bloom, spread or
multiply, however tempting a flowering meadow is at the top of a ladder — the leaves
are the counted set and the same ones must be in the grass at 6.0s as at 0.0s, in
the same places. The sheep act above and around them, never on them. And there is
exactly one butterfly, never a second: one is unmistakably not a quantity, and a
pair invites the child to count the wrong thing at the top of a counting ladder.

## Levels eleven to twenty — the third and fourth five

Nothing in `assets/js/levels.js` yet, same as levels six to ten were when their art
was written. The art goes first for the same reason: a cover is the slowest link in
a level's chain.

The clips get longer again — **7 seconds for levels eleven to fifteen, 8 seconds for
sixteen to twenty**. Two things pay for the extra time. The resistance beat is
carrying more weight now: by level eleven a child has seen ten of these and knows
the objects are going to do something, so the *trying and failing* has to last long
enough to stop being a formality. And the last frame is now held on screen after the
clip ends — `playClear` pauses on it for two seconds waiting for a tap — so the
closing pose is looked at rather than glimpsed. Beats become roughly
1.8 / 0.5 / 2.3 / 1.3 / 1.1 at seven seconds and 2.0 / 0.5 / 2.7 / 1.5 / 1.3 at
eight.

Band assignment is a plan and not something the code agrees to yet: twelve for
eleven to thirteen, fifteen for fourteen and fifteen, twenty for sixteen to
eighteen, and the last two on doubles and then everything at once. It keeps the
3/2/3/2 shape the first twenty levels have had.

### Ten twists, and what makes them different from the first ten

The first ten escalated by *what the objects do* — they wiggle, they fly, they
build, they carry, they turn out to be alive. That line is spent; a child who has
seen level nine is not surprised by an object moving. These ten escalate along two
different axes at once.

**The objects acquire intent toward the actor.** Not motion but attitude: the bale
offers itself as a seat, the horseshoe dresses the pony, the flower turns to watch,
the acorn raises its cap, the bamboo catches the panda. In the first ten the objects
acted; here they *behave*, and a three-year-old reads behaviour as personality
without being told.

**The world gets bigger than the pair.** Levels eleven to fifteen stay in the
farmyard grammar the child knows. Sixteen to twenty leave it: woodland, then
savanna, then the first weather in the whole game, then a tree that bends. Level
nineteen is the only clip with rain in it and level twenty is the only one where
something larger than an animal moves.

Both axes land on the same closing note. Level twenty's twist is not a bigger
trick than level ten's — it is a quieter one. What the child could not reach comes
down.

Everything below inherits the rebuilt-brief rule that came out of level ten's first
version: few named colours, **one** lighting change and it is the amber horizon at
the end, at most one new figure on stage, a want whose object is a solid graspable
thing, and a payoff that is a **pose** rather than a light show.

Full prompts as sent are in `prompts/lN-cover.txt` and `prompts/lN-clear.txt`.
Each clip starts from its own cover.

## Level 11 — counting within 12 · cow and hay bale · accent `#c98a1f`

First level of the twelve band, and counting returns the way it did at four and six.
It opens the third five deliberately slowly: a cow is the most placid figure in the
set and the clip's joke is about weight, which is a good place to start after level
ten's tower.

**Cover** — `l11-cover.webp`

> Three round cows in a mown hayfield, front-facing and three-quarter, large round
> heads, bodies `#8a5a3c` with cream `#f2e6cf` patches, muzzles `#f2b8c0`, blunt
> horns `#e0c9a0`, hooves `#4a4a52`, `#33291f` features with long lashes,
> overlapping so they form no countable row. Small round hay bales `#e0b455` with
> paler `#f0cf90` straw ends and two darker `#c98a1f` cords bound crosswise,
> scattered loosely on the stubble. The winding cream path, open sky `#eaf4f7` to
> `#d9ecf2` across the upper two thirds. Light from the upper left. No text,
> numerals or letters.

**Clear video** — `l11-clear.mp4`, 7s, **first frame is `l11-cover.webp`**

Twist: *the heavy thing wants to be furniture.* The cows shove at bales that will
not move an inch, and then the bales roll to them, bump their legs twice — plainly
an invitation — and the cows climb up and sit on them.

The nudge is the whole clip. An object that moves is level two; an object that
*asks* is new, and it is the cheapest possible way to give a bale a personality.

Every bale stays whole and bound. Nothing may unroll: loose hay would be an
uncountable mass where a countable set used to be, which is the same fault a wall of
undifferentiated cheese would have been at level eight.

## Level 12 — counting and addition within 12 · pony and horseshoe · accent `#8fa3b2`

Addition in the twelve band. The first cool-grey object in the set — the warm band
was full by level nine, and a metal grey-blue is the widest gap left in it.

**Cover** — `l12-cover.webp`

> Three sturdy round ponies in a green paddock, front-facing and three-quarter,
> large round heads, bodies `#b4663a`, manes and tails `#7a4a2a`, muzzles
> `#e8c9a8`, hooves `#4a4a52`, `#33291f` features, overlapping so they form no
> countable row. Open U-shaped horseshoes `#8fa3b2` with `#6b7d8a` inner edges and
> four `#566672` nail holes each, lying flat in a loose scatter on the grass. The
> winding cream path, open sky `#eaf4f7` to `#d9ecf2` across the upper two thirds.
> Light from the upper left. No text, numerals or letters.

**Clear video** — `l12-clear.mp4`, 7s, **first frame is `l12-cover.webp`**

Twist: *the objects dress the actors.* Hooves scrape uselessly over shoes that stay
flat in the grass; then the shoes stand on their arms, spin like wheels, and one
clicks onto each pony's raised hoof. The payoff is three ponies discovering they can
prance.

The one-to-one is exact and it matters: **one** shoe onto **one** hoof of **one**
pony, and the rest stay in the grass. Four shoes on one pony is the anatomically
obvious reading and it would state a four-to-one correspondence the game never
teaches — the same reason level one keeps the fish in their pool.

## Level 13 — addition and subtraction within 12 · duck and snail · accent `#8a63c0`

Arithmetic only, the twelve band's answer to levels three and eight. The snail's
violet shell is the second use of violet, after level ten's butterfly; legal because
the two never share a scene, and it is the only cold colour on a warm-bodied actor
in the set.

**Cover** — `l13-cover.webp`

> Three small round ducks on a pond bank, front-facing and three-quarter, large
> round heads, bodies `#f5d76e`, folded wings `#e0bd4a`, bills and webbed feet
> `#f0862f`, `#33291f` features, overlapping so they form no countable row. Small
> snails with spiral shells `#8a63c0` marked by a darker `#6b4a99` spiral, pale grey
> `#c9c0cc` bodies and two stalk eyes each, in a loose scatter on the bank. Pale
> blue pond water `#bfe6f5` along the lower right, the winding cream path, open sky
> `#eaf4f7` to `#d9ecf2`. Light from the upper left. No text, numerals or letters.

**Clear video** — `l13-clear.mp4`, 7s, **first frame is `l13-cover.webp`**

Twist: *the slowest one sets the pace.* The ducks bustle, stamp and flap trying to
hurry the snails along, and get nowhere. Then the snails set off — at a magnificent
crawl — and take the lead, and the ducks have to go this slowly too. One duck's foot
hangs frozen in the air for a long comic moment before it can put it down.

This is the only clip in twenty whose joke is *timing* rather than event, and it is
the one a four-year-old will imitate. The held foot is the shot.

The snails may not withdraw into their shells, however natural that is: a snail out
of sight reads as one fewer snail. They also stay out of the water — the pond is
scenery, and a counted object floating away is a counted object leaving.

## Level 14 — counting and addition within 15 · bee and flower · accent `#f27a9b`

First level of the fifteen band. The cheapest level in the set to draw: `sp-flower`
already exists in `art.js` as garden decoration, at exactly these colours, so this
row needs one new actor and no new target.

**Cover** — `l14-cover.webp`

> Three plump round bees hovering just above a low flower meadow, front-facing and
> three-quarter, large round heads, bodies `#f0b429` with two broad `#3a2f28`
> stripes, pale translucent wings `#dff0f7`, `#33291f` features, overlapping so they
> form no countable row. Simple round flowers rooted in the grass with five broad
> `#f27a9b` petals, a `#ffd44d` centre disc and `#54a84b` stems with one `#63bd57`
> leaf each, at slightly different heights in a loose scatter. Green `#3f9e6b`
> meadow, the winding cream path, open sky `#eaf4f7` to `#d9ecf2`. Light from the
> upper left. No text, numerals or letters.

**Clear video** — `l14-clear.mp4`, 7s, **first frame is `l14-cover.webp`**

Twist: *the quiet things were watching.* The bees waggle and tap and loop and the
flowers ignore them completely — then every flower head swings round at once to
face them. A bee darts left and the whole meadow snaps round after it; it darts
right and they all follow. Then the flowers bow, and the bees land on them.

Rooted flowers are the safest counted set in the twenty: they physically cannot
drift, so the only rule to state is that they turn on their stems without their
bases moving. Nothing may be picked, closed, or shed — a fallen petal is a change in
what is on screen.

## Level 15 — counting, addition and subtraction within 15 · goat and cabbage · accent `#7fb069`

Everything in play at the top of the fifteen band, and the last level before the
setting leaves the farm.

**Cover** — `l15-cover.webp`

> Three round goats on a low grassy slope, front-facing and three-quarter, large
> round heads, bodies `#c9bfae`, short curved horns `#f2e6cf`, beards and hooves
> `#4a4a52`, muzzles `#e8dcc9`, `#33291f` features with rectangular pupils,
> overlapping so they form no countable row. Round layered cabbages `#7fb069` with
> darker `#5c8f4a` curling outer leaf edges and a paler `#a8cc8a` heart, in a loose
> scatter on the grass. The winding cream path, open sky `#eaf4f7` to `#d9ecf2`.
> Light from the upper left. No text, numerals or letters.

**Clear video** — `l15-clear.mp4`, 7s, **first frame is `l15-cover.webp`**

Twist: *the animal famous for eating everything chooses to hold it instead.* Three
goats lunge and every cabbage rolls clear just in time. Then the cabbages roll
*back*, up against their chests and under their chins, and each goat opens its mouth
to bite — and stops. The payoff is three goats holding a cabbage under the chin with
visible enormous effort, one tongue lolling out from the strain.

The forbidden thing is the point here, which is new. Level seven had to say *no pig
eats an apple* as a constraint fighting the scene; here the restraint **is** the
joke, so the counting rule and the comedy want the same thing for once. Nothing may
be bitten, and no leaf may come off — an unwrapped cabbage is one object becoming
many, which reads as *more*.

## Level 16 — counting within 20 · squirrel and acorn · accent `#6b4a24`

First level of the twenty band, and the first level outside the farm. Counting
returns one last time, over the widest set in the game.

**Cover** — `l16-cover.webp`

> Three small round squirrels in an open woodland clearing, front-facing and
> three-quarter, large round heads, bodies `#c4703a`, big curled tail plumes
> `#a85a28`, chest fur `#f2e6cf`, `#33291f` features with buck teeth, overlapping so
> they form no countable row. Acorns with a pale `#e8c9a0` nut and a deep textured
> `#6b4a24` cap, in a loose scatter on the ground. One broad `#8a6a5a` trunk rising
> out of frame at one side with `#3f9e6b` canopy in the top corner only, the winding
> cream path, open sky `#eaf4f7` to `#d9ecf2`. Light from the upper left. No text,
> numerals or letters.

**Clear video** — `l16-clear.mp4`, 8s, **first frame is `l16-cover.webp`**

Twist: *the things being gathered have manners.* The squirrels cannot hold more than
one acorn at a time — pick up the second, drop the first — and then every acorn in
the clearing **lifts its cap** like a hat being raised, bows, and rolls into the
squirrels' curled-up tails.

The raised cap is doing real work. It is a gesture rather than a transformation, so
it costs nothing against the counting rule, and a cap that comes back down is
readable as politeness to a child who has never been told what politeness is.

Burying was the obvious squirrel joke and it is unusable: a buried acorn is a hidden
acorn, which is the one thing the rule forbids outright. Every cap stays on its own
nut.

## Level 17 — counting and addition within 20 · elephant and peanut · accent `#e07a52`

Addition in the twenty band. The largest actor in the set paired with the smallest
target, which is the entire reason this row sits here.

**Cover** — `l17-cover.webp`

> Three round baby elephants in a wide clearing, front-facing and three-quarter,
> large round heads, bodies `#9aa8b4`, big round ears with `#c9b2b8` inner ear, short
> curled trunks, toenails `#f2e6cf`, `#33291f` features with long lashes, overlapping
> so they form no countable row. Peanuts in the shell `#d9a86b`, each a double-lobed
> pod pinched in the middle with a fine `#b8813f` seam, in a loose scatter on the
> ground. The winding cream path, open sky `#eaf4f7` to `#d9ecf2`. Light from the
> upper left. No text, numerals or letters.

**Clear video** — `l17-clear.mp4`, 8s, **first frame is `l17-cover.webp`**

Twist: *the biggest animal turns out to be capable of enormous gentleness.* Trunks
swat, squeeze and blow peanuts skidding across the grass; then the last inch of each
trunk opens, closes on exactly one peanut, and lifts it high, balanced on the tip.
The payoff is three elephants gone cross-eyed at their own trunks.

This is the one clip where the actor changes and the objects do not, which is why it
belongs in the second half — after nine clips of objects taking initiative, an actor
solving it by *being careful* is the surprise.

Balanced, not held: one peanut on each trunk tip, the rest in the grass, no shell
cracked. A shelled peanut is one object becoming two.

## Level 18 — addition and subtraction within 20 · panda and bamboo · accent `#b5c94a`

Arithmetic only at the full width, the last of the three levels that drop counting
as a fallback.

Bamboo takes a pale yellow-green rather than a leaf green, which is mature cane and
is what a panda actually eats. It is also the only value that separates from level
ten's clover and level twenty's leaf on the map: three greens in twenty accents is
already one more than the palette comfortably holds.

**Cover** — `l18-cover.webp`

> Three round baby pandas in a low grassy clearing, front-facing and three-quarter,
> large round heads, fur `#fbf9f4` with `#33291f` ear patches, eye patches, arms and
> legs, muzzles `#f2e6cf`, overlapping so they form no countable row. Short lengths
> of bamboo cane `#b5c94a`, each a straight segmented pole with darker `#8a9a2f`
> joint rings and a paler `#d4e07a` cut end, lying flat in a loose scatter. The
> winding cream path, open sky `#eaf4f7` to `#d9ecf2`. Light from the upper left. No
> text, numerals or letters.

Note for whoever draws `sp-panda`: the fur `#fbf9f4` is **4** from `--panel` and 25
from `--slot`, the worst case in the whole set — worse than `sp-rabbit` and
`sp-sheep`. On the cover it sits against grass and is fine. On an answer card only
the dark outline and the black patches carry it, so both have to be drawn heavy.

**Clear video** — `l18-clear.mp4`, 8s, **first frame is `l18-cover.webp`**

Twist: *the thing they were leaning on catches them.* The pandas keep trying to stand
on their hind legs and keep toppling; a cane used as a walking stick slides flat and
drops one straight back down. Then every cane stands up in a ring around them, and
when the pandas fall the canes **bend inward and hold them**, bowing deeply, and
bounce them upright.

Resistance-then-release is doing something specific here: the wobble is the *whole
middle of the clip* rather than a beat near the end, and it is safe because the
catch is established before the last fall. Nothing may snap, however far it bends —
a broken cane would be both a loss and a change in the count.

## Level 19 — doubles and near doubles within 20 · frog and lotus pad · accent `#3f9e9d`

Second from the top, and the only structural idea in the ladder that is not just a
wider band: pairs of the same number. It earns its own level because *two the same*
is the first thing a child notices without counting.

**Cover** — `l19-cover.webp`

> Three small round frogs at the edge of a calm shallow pond, front-facing and
> three-quarter, large round heads, bodies `#5aab4a` with paler `#8ecc6b` bellies,
> wide webbed feet, `#33291f` features with big round eyes set high, overlapping so
> they form no countable row. Round lotus pads `#3f9e9d` with one deep notch and fine
> darker `#2f7d7c` veins, floating flat on pale blue `#bfe6f5` water in a loose
> scatter. Green `#3f9e6b` bank, the winding cream path, open sky `#eaf4f7` to
> `#d9ecf2`. Light from the upper left. No text, numerals or letters.

The pad takes a blue-green rather than a leaf green because a green frog on a green
pad is one silhouette. Teal is already in the UI palette as `--ring`, so it costs
the set nothing.

**Clear video** — `l19-clear.mp4`, 8s, **first frame is `l19-cover.webp`**

Twist: *the thing they sat beside becomes a roof.* The first and only rain in the
whole game. The frogs try to get out of the wet — hunched shoulders, one foot held
uselessly overhead, a hop to a spot where it is raining just as hard — and then the
pads lift off the water and hover above them, one to each frog, with the rain
running off the notched edges.

Rain is the widest new element in the twenty and it needed a rule of its own: **a
few large well-separated drops, never a dense curtain.** Level ten's first version
died on hundreds of identical small glowing dots, and rain is the same failure
waiting to happen.

The sky does **not** darken for it. That looks like a mistake and is not: a
rainstorm sky plus the closing amber horizon is two lighting changes in eight
seconds, and one lighting change per clip is the rule the level ten rebuild bought.
Rain against a pale sky reads as a shower rather than weather, which is also the
right register for a reward.

## Level 20 — everything within 20 · giraffe and leaf · accent `#4a8f5a`

The top of the ladder. Every mode, the widest set, and the level a child arrives at
after the most returning.

**Cover** — `l20-cover.webp`

> Three tall round-headed baby giraffes in a wide open savanna clearing,
> front-facing and three-quarter, long necks, large round heads, bodies `#e0a84a`
> with `#b06f28` patches, manes `#8a5a3c`, muzzles `#f2e6cf`, small ossicones, hooves
> `#4a4a52`, `#33291f` features, overlapping so they form no countable row. Hanging
> from one broad low `#8a6a5a` branch reaching in from the upper right, large single
> teardrop leaves `#4a8f5a` with one paler `#7fb069` centre vein, each drawn
> separately with clear space around it, in a loose scatter along the branch. The
> canopy above is one solid `#3f9e6b` mass with **no individual leaves drawn in it**.
> The winding cream path to a very low horizon, the tallest open sky in the set.
> Light from the upper left. No text, numerals or letters.

The canopy rule is a counting rule, not a style note. Everywhere else the counted
set sits against something that is not made of the same shape — clover in grass,
eggs in straw. Leaves against a tree full of leaves is the one pairing where the
background *is* the target, so the canopy has to be a silhouette and the counted
leaves have to be large, separate and veined.

**Clear video** — `l20-clear.mp4`, 8s, **first frame is `l20-cover.webp`**

Twist: *what they could not reach comes down to meet them.* Necks at full stretch,
onto the tips of the front hooves, a hopeful little hop — and still a clear gap
short. Then the branch creaks, and the whole limb bows down in a long slow arc, the
canopy leaning after it, until it curves right around the three of them and the
leaves are at their faces.

**This is deliberately not the biggest trick in the twenty.** Level ten answered its
ladder with a tower and level nine with something alive; if twenty tries to beat them
it becomes a fireworks display, which is exactly the failure the level ten rebuild
was written to avoid. So the widest ending is the quietest one: nothing transforms,
nothing multiplies, one thing moves and it is the largest thing on screen. A child
who has climbed twenty levels gets bowed to.

Nothing is eaten, which at the top of the ladder takes some discipline — three
giraffes at a branch of leaves and not one leaf picked. They press their cheeks
against them instead, and every leaf is still on the branch at 8.0s. The branch
carries them down; they never leave it.

## Continuity across the clips

They are not independent. Read in order they should feel like the same world
opening up: a quiet pool, then a noisy game, then something built, then a road out,
then the sky — and past that, dusk and a light answering, a fairground, a house
with its windows lit, a nest that turns out to be full of life, and three animals
standing on each other to reach one butterfly. Then the objects start having
opinions — a bale that offers itself as a seat, a shoe that dresses a pony, a snail
that sets the pace, a meadow that turns to watch, a cabbage that would rather be
held — and then the world itself gets bigger than the pair: woodland, savanna, the
first rain in the whole game, and a tree that bows.

- The **path** appears in every clip and always runs the same direction, lower left
  to upper right. It is the same path as the map's ribbon.
- **Light stays upper-left** in every frame of every clip. A generator will drift
  on this; check it on delivery.
- **One lighting change per clip, and it is the amber `#e8a33d` horizon at the
  end.** This is the rule the level ten rebuild bought and every clip from eleven on
  inherits it. Level six is the one standing exception — it opens at dusk, keeping
  the sky pale `#eaf4f7` at the horizon and only deepening to `#9fc4d4` at the top,
  so it reads as the same sky late rather than a different palette. Level ten used
  to fall to dusk as well and no longer does; that cost the closing rhyme with level
  six, deliberately, because a sky that changes colour is among the hardest things
  to ask a generator for. Level nineteen has rain in it and still does not darken,
  for the same reason.
- Each clip ends **wider than it started** — one more fish, one merged pile, an
  arch to run through, a long road, open sky — because the reward for finishing a
  level should feel like more, not like a door closing.
- **The axis of escalation changes at level eleven.** The first ten grow by what the
  objects *do*: food that wiggles, then flies, then builds, then carries, then turns
  out to be alive. That line is spent by level ten — a child who has seen an egg
  hatch is not surprised by a rolling apple. The second ten grow by what the objects
  *mean toward the actor*, and by how much of the world is on stage. A child
  replaying level 1 after level 20 should feel level 1 as small, and that is correct.
- **The top is quiet on purpose.** Level twenty is not a bigger trick than level ten
  or nine; it is a smaller one done to the largest thing on screen. Trying to beat a
  tower of sheep and a nest full of chicks is how a clip becomes a fireworks
  display, which is the specific failure the level ten rebuild was written to avoid.
- **Every clip starts from its own cover.** Frame one of each video is the still the
  child taps on the map. The ten that exist measure **2.8 to 4.5** mean abs diff
  from their cover file; anything much above that band is a clip that drifted off
  its first frame and is worth looking at. Measure frame zero with `-vframes 1`, not
  with an `fps=` filter — `fps=4` resamples the timeline and hands back a frame from
  about t=0.125 instead, which reads 1.7 higher on level ten and would look like
  drift that is not there.
- **Clip length grows with the ladder**: 5s for levels one to five, 6s for six to
  ten, 7s for eleven to fifteen, 8s for sixteen to twenty. The resistance beat is
  what the extra time buys — by level eleven a child knows the objects are going to
  do something, so the trying and failing has to last long enough to stop being a
  formality. The closing hold grows too, because `playClear` now pauses on the last
  frame for two seconds waiting for a tap: the final pose is looked at, not
  glimpsed.

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
