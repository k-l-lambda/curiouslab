# Sprite pair expansion — 6 to 50

The item list for growing `assets/js/pairings.js` from six pairings to fifty.
Nothing here is drawn yet. `../levels/prompts.md` is the sibling brief for level
covers and clips.

## Why

Not levels — the ladder is five and its bottleneck is rules and video. Fifty pairs
buy **variety inside one run**. `pickPairing` shows the level's own pair about half
the time and draws the rest from what is unlocked; with six pairs, level five's
twenty-five questions cycle through five scenes and the picture stops being looked
at. Most of these fifty will never be a level's face. They are the pool.

## Rules a pair must satisfy

- **The wanting reads without narration.** This figure wants that thing. A bunch
  of grapes is out on a related point: the counted unit must be unarguable.
- **The silhouette survives ten copies at card size.** Ten round things are a
  smear; corners stay countable. Already spent: elongated, dumbbell, oval, star.
- **Contrast is within-pair, not global.** Two pairs never share a scene, so a
  target only needs to separate from its own actor and from `--sky` / `--panel` /
  `--slot`. Keep 40+ RGB units: `sp-rabbit` sits 16.3 from `--sky` and is the
  cautionary case. Violet, red and cool grey-blue are open; the warm band is full.

## The fifty

Rows 0–5 are drawn. Rows 6–49 are the work.

| # | pairing | actor | target | silhouette |
|---|---|---|---|---|
| 0 | `cat-fish` | cat | fish | oval |
| 1 | `monkey-banana` | monkey | banana | crescent |
| 2 | `dog-bone` | dog | bone | dumbbell |
| 3 | `rabbit-carrot` | rabbit | carrot | tapered |
| 4 | `bird-seed` | bird | seed | oval, small |
| 5 | `lamp-star` | lamp | star | star |
| 6 | `pig-apple` | pig | apple | sphere + stem and leaf |
| 7 | `mouse-cheese` | mouse | cheese | wedge with holes |
| 8 | `hen-egg` | hen | egg | ovoid |
| 9 | `sheep-clover` | sheep | clover | three-lobe |
| 10 | `cow-haybale` | cow | hay bale | bound cylinder |
| 11 | `horse-horseshoe` | horse | horseshoe | U |
| 12 | `duck-snail` | duck | snail | spiral |
| 13 | `bee-flower` | bee | flower | rosette |
| 14 | `goat-cabbage` | goat | cabbage | layered sphere |
| 15 | `hamster-corn` | hamster | corn cob | segmented spindle |
| 16 | `squirrel-acorn` | squirrel | acorn | cap + nut |
| 17 | `elephant-peanut` | elephant | peanut | double lobe |
| 18 | `panda-bamboo` | panda | bamboo | vertical segmented |
| 19 | `frog-lotus` | frog | lotus pad | notched disc |
| 20 | `giraffe-leaf` | giraffe | leaf | teardrop with vein |
| 21 | `hedgehog-mushroom` | hedgehog | mushroom | dome on stalk |
| 22 | `fox-plum` | fox | plum | ovoid with seam |
| 23 | `bear-honeypot` | bear | honey pot | pot |
| 24 | `owl-feather` | owl | feather | plume |
| 25 | `deer-pear` | deer | pear | gourd, necked |
| 26 | `turtle-strawberry` | turtle | strawberry | seeded heart |
| 27 | `beaver-log` | beaver | log | cylinder end-on |
| 28 | `otter-shell` | otter | scallop shell | ribbed fan |
| 29 | `dolphin-hoop` | dolphin | hoop | ring |
| 30 | `seal-ball` | seal | ball | banded sphere |
| 31 | `crab-pebble` | crab | pebble | rounded triangle |
| 32 | `penguin-icecube` | penguin | ice cube | cube, translucent |
| 33 | `whale-bubble` | whale | bubble | circle with highlight |
| 34 | `shark-tooth` | shark | tooth | triangle |
| 35 | `seahorse-coral` | seahorse | coral sprig | branching |
| 36 | `hummingbird-nectardrop` | hummingbird | nectar drop | teardrop |
| 37 | `parrot-chilli` | parrot | chilli | curved cone |
| 38 | `toucan-fig` | toucan | fig | gourd, squat |
| 39 | `flamingo-shrimp` | flamingo | shrimp | segmented crescent |
| 40 | `kangaroo-boomerang` | kangaroo | boomerang | V |
| 41 | `koala-gumnut` | koala | gumnut | ribbed cup |
| 42 | `hippo-watermelon` | hippo | watermelon | striped sphere |
| 43 | `gorilla-coconut` | gorilla | coconut | sphere, three dots |
| 44 | `truck-crate` | truck | crate | cube, grained |
| 45 | `train-barrel` | train | barrel | bulged cylinder |
| 46 | `crane-brick` | crane | brick | rectangle |
| 47 | `boat-buoy` | boat | buoy | sphere in standoff ring |
| 48 | `plane-suitcase` | plane | suitcase | rounded rect + handle |
| 49 | `robot-bolt` | robot | bolt | hex head |

44 new actors and 44 new targets. Row 13 reuses `sp-flower`, already drawn as
garden decoration, which makes `bee-flower` the cheapest row on the list.

## Shapes that need a deliberate difference

- **32 ice cube / 44 crate** — translucent with a highlight against opaque with grain.
- **10 hay bale / 27 log / 45 barrel** — bound crosswise, rings end-on, bulged.
- **8 egg / 22 plum / 31 pebble** — separated by colour, which is legal here
  because they never share a scene. Plum takes the violet; egg goes brown rather
  than cream so it does not vanish on `--slot`.
- **25 pear / 38 fig** — tall and necked against squat and stemmed.
- **30 ball / 42 watermelon / 47 buoy** — the buoy's ring must stand clear of the
  silhouette, not be painted on it.
- **8 egg, 32 ice cube, 33 bubble** are pale objects on pale backgrounds and need
  an outline or cast shadow drawn into the sprite.

## `container` is null on every new row

The field is dead: nobody reads `.container`, and the only reference to a
container sprite outside `art.js` is `map.js` reusing `sp-glow` for the miss
effect. `tint` has no consumer either. Skipping containers takes the job from 132
sprites to **87**.

## Draw order

0. **No new art.** `lamp-star` is drawn and unused — a cover brief turns it into
   level six. Fill the two holes in `../levels/prompts.md` while there: the
   Character reference table stops at bird and seed, and the container paragraph
   lists only three. That table is the palette contract every prompt inherits.
1. **Rows 6–15, farm and house.** Do `pig-apple` completely first as the template.
2. **Rows 16–25, woodland.** Where the interesting silhouettes are; build the
   7-band on it.
3. **Rows 26–35, water.** Ring, cube, triangle, fan — the corner-heavy shapes the
   10-band needs.
4. **Rows 36–43, the loud ones.** Held late on purpose; spending them early makes
   everything drawn before them look drab.
5. **Rows 44–49, machines.** The only rows where the wanting is loading rather
   than eating, and the cleanest countable shapes in the set.

## Two code consequences, out of scope here

- **The familiarity gate does not scale.** `scheduler.js` and `main.js` both use
  `floor(answered / 4)`. At fifty pairs row 49 waits about 196 correct answers —
  possibly right, currently an accident of a divisor chosen when there were six.
- **The uniform pick gets thin.** Uniform over six feels varied; uniform over
  fifty makes the level's own pair the only familiar thing on screen. Weighting
  toward neighbouring familiarity would give a run a neighbourhood.
