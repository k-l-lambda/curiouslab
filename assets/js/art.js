/**
 * art.js — vector sprite library.
 *
 * Every pairing object, container and UI icon is a <symbol> with a 0 0 100 100
 * viewBox so the same asset can be placed, scaled and animated anywhere.
 * Anchor convention: the visual mass of a sprite sits inside the central
 * 80x80 box, so a plain `transform: scale()` never clips it.
 */

const SPRITES = `
<symbol id="sp-cat" viewBox="0 0 100 100">
  <!-- Each moving part reads one custom property, defaulting to the resting
       pose, so the drawing is unchanged until a rule outside sets one. A
       positive --ear or --tail means perked and raised whatever the animal, so
       one keyframe reads the same on all of them; each drawing absorbs its own
       geometry's sign here rather than in the stylesheet. -->
  <path d="M68 80 q22 2 20 -18" fill="none" stroke="#e79a44" stroke-width="7" stroke-linecap="round"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 68px 80px"/>
  <ellipse cx="46" cy="72" rx="24" ry="22" fill="#f7b264"/>
  <g style="rotate: var(--ear, 0deg); transform-origin: 32px 32px">
    <path d="M28 32 L24 9 L43 22 Z" fill="#f7b264"/>
    <path d="M30 29 L28 16 L39 23 Z" fill="#f8d6ae"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 60px 32px">
    <path d="M64 32 L68 9 L49 22 Z" fill="#f7b264"/>
    <path d="M62 29 L64 16 L53 23 Z" fill="#f8d6ae"/>
  </g>
  <circle cx="46" cy="36" r="21" fill="#ffc478"/>
  <!-- Open eyes and happy eyes are two drawings that cross-fade, because an arc
       is not a circle squashed: a closed-up smiling eye curves the other way. -->
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="38" cy="34" r="3.6" fill="#33291f"/>
    <circle cx="54" cy="34" r="3.6" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M34 35 q4 -5 8 0"/>
    <path d="M50 35 q4 -5 8 0"/>
  </g>
  <path d="M46 41 l-4.5 4.5 h9 Z" fill="#e8825f"/>
  <path d="M41 48 q5 5 10 0" fill="none" stroke="#33291f" stroke-width="2.4" stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 46px 48px"/>
  <g stroke="#33291f" stroke-width="1.8" stroke-linecap="round" opacity=".8">
    <path d="M25 40 L12 36"/><path d="M25 44 L13 46"/>
    <path d="M67 40 L80 36"/><path d="M67 44 L79 46"/>
  </g>
</symbol>

<symbol id="sp-fish" viewBox="0 0 100 100">
  <path d="M70 50 L96 30 q-7 20 0 40 Z" fill="#2f96c4"/>
  <path d="M44 34 q10 -13 19 -1 Z" fill="#2f96c4"/>
  <path d="M46 66 q9 12 18 2 Z" fill="#2f96c4"/>
  <ellipse cx="44" cy="50" rx="32" ry="19" fill="#5cc3e8"/>
  <path d="M30 40 q10 10 0 20" fill="none" stroke="#2f96c4" stroke-width="3" stroke-linecap="round"/>
  <circle cx="24" cy="46" r="4.6" fill="#fff"/>
  <circle cx="23" cy="46" r="2.3" fill="#22333f"/>
  <path d="M13 54 q6 3 11 1" fill="none" stroke="#2f96c4" stroke-width="2.6" stroke-linecap="round"/>
</symbol>

<symbol id="sp-monkey" viewBox="0 0 100 100">
  <path d="M70 78 q20 -1 16 -20" fill="none" stroke="#a9723f" stroke-width="6" stroke-linecap="round"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 70px 78px"/>
  <!-- The ears swivel about the head's edge rather than their own middles, so a
       small angle carries them up and out instead of spinning them in place. -->
  <circle cx="23" cy="40" r="9.5" fill="#a9723f"
    style="rotate: var(--ear, 0deg); transform-origin: 32px 40px"/>
  <circle cx="73" cy="40" r="9.5" fill="#a9723f"
    style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 64px 40px"/>
  <ellipse cx="48" cy="74" rx="21" ry="20" fill="#c98a58"/>
  <ellipse cx="48" cy="76" rx="13" ry="13" fill="#efd0a9"/>
  <circle cx="48" cy="40" r="23" fill="#c98a58"/>
  <ellipse cx="48" cy="48" rx="17" ry="14" fill="#efd0a9"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="40" cy="35" r="3.6" fill="#33291f"/>
    <circle cx="56" cy="35" r="3.6" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M36 36 q4 -5 8 0"/>
    <path d="M52 36 q4 -5 8 0"/>
  </g>
  <circle cx="44" cy="45" r="1.9" fill="#8a5c33"/>
  <circle cx="52" cy="45" r="1.9" fill="#8a5c33"/>
  <path d="M41 52 q7 6 14 0" fill="none" stroke="#8a5c33" stroke-width="2.4" stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 52px"/>
</symbol>

<symbol id="sp-banana" viewBox="0 0 100 100">
  <path d="M27 18 q-9 42 25 58 q17 8 24 -4 q5 -9 -7 -12 q-27 -7 -31 -42 q-1 -9 -6 -7 q-5 1 -5 7 Z" fill="#f7d84a"/>
  <path d="M33 24 q-4 34 22 48" fill="none" stroke="#e0b92c" stroke-width="3" stroke-linecap="round"/>
  <path d="M25 15 q6 -4 9 2" fill="none" stroke="#7c6420" stroke-width="5" stroke-linecap="round"/>
  <path d="M74 76 q6 -1 6 4" fill="none" stroke="#7c6420" stroke-width="4" stroke-linecap="round"/>
</symbol>

<symbol id="sp-dog" viewBox="0 0 100 100">
  <path d="M70 78 q18 -6 12 -22" fill="none" stroke="#a2724f" stroke-width="7" stroke-linecap="round"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 70px 78px"/>
  <ellipse cx="48" cy="74" rx="23" ry="20" fill="#c08f6a"/>
  <!-- Long hanging ears: they pivot at the top, where they meet the head. -->
  <ellipse cx="22" cy="44" rx="9" ry="17" fill="#a2724f"
    style="rotate: var(--ear, 0deg); transform-origin: 28px 30px"/>
  <ellipse cx="74" cy="44" rx="9" ry="17" fill="#a2724f"
    style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 68px 30px"/>
  <circle cx="48" cy="40" r="22" fill="#d6a479"/>
  <ellipse cx="48" cy="52" rx="15" ry="11.5" fill="#f4e0c8"/>
  <!-- Behind the muzzle, so it reads as coming out from under it. -->
  <path d="M43 58 q5 13 10 0 Z" fill="#e8748a"
    style="scale: 1 var(--tongue, 0); transform-origin: 48px 58px"/>
  <ellipse cx="48" cy="47" rx="5.5" ry="4.4" fill="#3a2f28"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="39" cy="33" r="3.6" fill="#33291f"/>
    <circle cx="57" cy="33" r="3.6" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M35 34 q4 -5 8 0"/>
    <path d="M53 34 q4 -5 8 0"/>
  </g>
  <path d="M44 58 q4 7 8 0" fill="#e8748a"/>
</symbol>

<symbol id="sp-bone" viewBox="0 0 100 100">
  <rect x="26" y="42" width="48" height="16" rx="8" fill="#f2ead6"/>
  <circle cx="26" cy="40" r="11" fill="#f2ead6"/>
  <circle cx="26" cy="60" r="11" fill="#f2ead6"/>
  <circle cx="74" cy="40" r="11" fill="#f2ead6"/>
  <circle cx="74" cy="60" r="11" fill="#f2ead6"/>
  <path d="M34 50 h32" fill="none" stroke="#d8cdb2" stroke-width="3" stroke-linecap="round"/>
</symbol>

<symbol id="sp-rabbit" viewBox="0 0 100 100">
  <circle cx="76" cy="72" r="10" fill="#f3f0ea"/>
  <!-- Each ear is one group so its lining travels with it, pivoting at the base
       where it meets the head. The ellipses keep their own tilt; the group's
       rotation is added on top of it. -->
  <g style="rotate: var(--ear, 0deg); transform-origin: 40px 44px">
    <ellipse cx="36" cy="26" rx="8" ry="20" fill="#e6e1d8" transform="rotate(-12 36 26)"/>
    <ellipse cx="36" cy="27" rx="4" ry="14" fill="#f2b8c0" transform="rotate(-12 36 27)"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 56px 44px">
    <ellipse cx="60" cy="26" rx="8" ry="20" fill="#e6e1d8" transform="rotate(12 60 26)"/>
    <ellipse cx="60" cy="27" rx="4" ry="14" fill="#f2b8c0" transform="rotate(12 60 27)"/>
  </g>
  <ellipse cx="48" cy="74" rx="22" ry="20" fill="#f3f0ea"/>
  <circle cx="48" cy="52" r="21" fill="#fbf9f4"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="40" cy="49" r="3.6" fill="#33291f"/>
    <circle cx="56" cy="49" r="3.6" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M36 50 q4 -5 8 0"/>
    <path d="M52 50 q4 -5 8 0"/>
  </g>
  <path d="M48 57 l-4 4 h8 Z" fill="#e88a9a"/>
  <g stroke="#b7ae9e" stroke-width="1.8" stroke-linecap="round">
    <path d="M28 58 L14 55"/><path d="M28 62 L15 65"/>
    <path d="M68 58 L82 55"/><path d="M68 62 L81 65"/>
  </g>
</symbol>

<symbol id="sp-carrot" viewBox="0 0 100 100">
  <!-- Wide enough to survive a 20px answer-card preview: a carrot drawn at its
       true slenderness shrinks to a few pixels across and reads as nothing. -->
  <path d="M50 90 L28 46 q22 -11 44 0 Z" fill="#f0862f"/>
  <path d="M50 90 L61 68 q7 -12 11 -22 q-11 -5 -22 -1 Z" fill="#e0741f"/>
  <g stroke="#c9611a" stroke-width="3" stroke-linecap="round">
    <path d="M36 55 L47 59"/>
    <path d="M40 68 L52 72"/>
    <path d="M45 79 L55 82"/>
  </g>
  <path d="M50 46 q-10 -19 -29 -21 q4 17 23 25 Z" fill="#54a84b"/>
  <path d="M50 46 q10 -19 29 -21 q-4 17 -23 25 Z" fill="#63bd57"/>
  <path d="M50 46 q-6 -21 0 -32 q10 15 6 32 Z" fill="#4a9a42"/>
</symbol>

<symbol id="sp-bird" viewBox="0 0 100 100">
  <path d="M74 56 L96 44 q-4 14 -8 20 Z" fill="#4a8fc9"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 74px 56px"/>
  <ellipse cx="46" cy="58" rx="27" ry="22" fill="#5ba8e0"/>
  <!-- The wing beats about the shoulder, where it joins the body. -->
  <path d="M40 52 q20 -6 26 14 q-18 8 -26 -14 Z" fill="#4a8fc9"
    style="rotate: calc(-1 * var(--wing, 0deg)); transform-origin: 40px 52px"/>
  <circle cx="34" cy="36" r="17" fill="#7cc0ef"/>
  <!-- The beak opens by spreading about its tip, so the point stays put. -->
  <path d="M18 36 L4 41 L18 46 Z" fill="#f5a24a"
    style="scale: 1 calc(1 + var(--beak, 0)); transform-origin: 4px 41px"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="30" cy="33" r="3.8" fill="#28323c"/>
    <circle cx="31.4" cy="32" r="1.3" fill="#fff"/>
  </g>
  <path d="M26 34 q4 -5 8 0" fill="none" stroke="#28323c" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)"/>
  <g stroke="#f5a24a" stroke-width="3.4" stroke-linecap="round">
    <path d="M40 79 L38 90"/><path d="M54 79 L56 90"/>
  </g>
</symbol>

<symbol id="sp-seed" viewBox="0 0 100 100">
  <path d="M50 18 q23 24 23 42 a23 23 0 0 1 -46 0 q0 -18 23 -42 Z" fill="#d9a94f"/>
  <path d="M50 30 q13 18 13 31 a13 13 0 0 1 -13 13" fill="none" stroke="#f0cf90" stroke-width="4" stroke-linecap="round"/>
</symbol>

<symbol id="sp-lamp" viewBox="0 0 100 100">
  <!-- A lamp has no face, so light is the whole of its expression: --glow
       brightens the bulb and throws rays, --dim takes the light out of it, and
       --tilt bows the shade the way an animal turns its head away. The rays
       rest at zero scale so they add nothing to the drawing until they are
       asked for, and stay inside the shade's own width when they arrive. -->
  <rect x="46" y="44" width="8" height="36" rx="3" fill="#8a6a5a"/>
  <ellipse cx="50" cy="84" rx="22" ry="8" fill="#7a5b4c"/>
  <g stroke="#ffd469" stroke-width="3.4" stroke-linecap="round"
    style="opacity: var(--glow, 0); scale: var(--glow, 0); transform-origin: 50px 50px">
    <path d="M36 58 L26 66"/>
    <path d="M64 58 L74 66"/>
    <path d="M31 50 L21 50"/>
    <path d="M69 50 L79 50"/>
  </g>
  <circle cx="50" cy="50" r="10" fill="#ffe9a8"/>
  <circle cx="50" cy="50" r="10" fill="#fff6d0" style="opacity: var(--glow, 0)"/>
  <circle cx="50" cy="50" r="10" fill="#9a9083" style="opacity: var(--dim, 0)"/>
  <g style="rotate: var(--tilt, 0deg); transform-origin: 50px 44px">
    <path d="M22 44 L78 44 L64 14 L36 14 Z" fill="#e0574f"/>
    <path d="M22 44 L78 44 L74 50 L26 50 Z" fill="#c8443d"/>
  </g>
</symbol>

<symbol id="sp-star" viewBox="0 0 100 100">
  <polygon points="50,8 60,36.2 89.9,37 66.2,55.3 74.7,84 50,67 25.3,84 33.8,55.3 10.1,37 40,36.2" fill="#ffd44d"/>
  <polygon points="50,22 57,40 74,41 60,52 65,70 50,59 35,70 40,52 26,41 43,40" fill="#ffe796"/>
</symbol>

<symbol id="sp-pig" viewBox="0 0 100 100">
  <!-- The tail is the pig's own version of the shared --tail: a corkscrew, so
       raising it tightens the curl rather than swinging a line. It scales about
       the rump, which keeps the root attached while the tip travels. -->
  <path d="M74 74 q12 -2 8 -10 q-4 -7 -10 -2" fill="none" stroke="#f0a0ae" stroke-width="5"
    stroke-linecap="round"
    style="scale: calc(1 + var(--tail, 0deg) / 90deg); transform-origin: 74px 74px"/>
  <g style="rotate: var(--ear, 0deg); transform-origin: 34px 34px">
    <path d="M30 34 L22 12 L44 24 Z" fill="#f7bcc6"/>
    <path d="M31 31 L27 19 L38 25 Z" fill="#f7bcc6"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 62px 34px">
    <path d="M66 34 L74 12 L52 24 Z" fill="#f7bcc6"/>
    <path d="M65 31 L69 19 L58 25 Z" fill="#f7bcc6"/>
  </g>
  <ellipse cx="48" cy="72" rx="25" ry="21" fill="#f0a0ae"/>
  <circle cx="48" cy="40" r="22" fill="#f7bcc6"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="39" cy="35" r="3.4" fill="#33291f"/>
    <circle cx="57" cy="35" r="3.4" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M35 36 q4 -5 8 0"/>
    <path d="M53 36 q4 -5 8 0"/>
  </g>
  <!-- The snout is the pig's whole face: a flat disc with two nostrils, set low
       so the eyes above it still have room. -->
  <ellipse cx="48" cy="50" rx="13" ry="10" fill="#f7bcc6"/>
  <ellipse cx="43" cy="50" rx="2.6" ry="3.4" fill="#33291f"/>
  <ellipse cx="53" cy="50" rx="2.6" ry="3.4" fill="#33291f"/>
  <path d="M40 60 q8 6 16 0" fill="none" stroke="#33291f" stroke-width="2.4" stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 60px"/>
  <g fill="#f0a0ae">
    <rect x="34" y="86" width="9" height="10" rx="4"/>
    <rect x="53" y="86" width="9" height="10" rx="4"/>
  </g>
</symbol>

<symbol id="sp-apple" viewBox="0 0 100 100">
  <!-- A sphere with a dip at the top, not a circle: the dip and the stem are
       what keep ten of these countable where ten plain circles would smear. -->
  <path d="M50 26 q26 -4 30 26 q4 30 -30 40 q-34 -10 -30 -40 q4 -30 30 -26 Z" fill="#d6453f"/>
  <path d="M50 26 q26 -4 30 26 q3 22 -16 34 q10 -30 -14 -60 Z" fill="#c5332b"/>
  <path d="M38 40 q6 -8 14 -7" fill="none" stroke="#c5332b" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 28 q-2 -12 4 -18" fill="none" stroke="#7c6420" stroke-width="5" stroke-linecap="round"/>
  <path d="M54 16 q16 -6 20 6 q-16 8 -20 -6 Z" fill="#54a84b"/>
</symbol>

<symbol id="sp-mouse" viewBox="0 0 100 100">
  <!-- A long bare tail: it lifts as one curve about the rump. -->
  <path d="M70 78 q22 4 18 -16" fill="none" stroke="#f2b8c0" stroke-width="4.4"
    stroke-linecap="round"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 70px 78px"/>
  <!-- Ears far larger than the head is wide, which is the mouse's silhouette.
       They swivel about the head's edge so a small angle carries them out. -->
  <g style="rotate: var(--ear, 0deg); transform-origin: 40px 40px">
    <circle cx="28" cy="30" r="15" fill="#aebbc6"/>
    <circle cx="28" cy="30" r="9" fill="#f2b8c0"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 60px 40px">
    <circle cx="72" cy="30" r="15" fill="#aebbc6"/>
    <circle cx="72" cy="30" r="9" fill="#f2b8c0"/>
  </g>
  <ellipse cx="50" cy="72" rx="23" ry="20" fill="#aebbc6"/>
  <!-- The head tapers to the nose, so the muzzle is a separate wedge rather
       than a circle: a round-headed mouse reads as a bear cub. -->
  <circle cx="50" cy="48" r="19" fill="#aebbc6"/>
  <path d="M50 40 q16 6 14 16 q-8 6 -14 -2 Z" fill="#aebbc6"/>
  <circle cx="65" cy="55" r="3.2" fill="#f2b8c0"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="45" cy="44" r="3.4" fill="#33291f"/>
    <circle cx="58" cy="42" r="3.4" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.6" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M41 45 q4 -5 8 0"/>
    <path d="M54 43 q4 -5 8 0"/>
  </g>
  <g stroke="#9aa7b0" stroke-width="1.6" stroke-linecap="round" opacity=".85">
    <path d="M62 58 L78 56"/><path d="M62 61 L77 64"/>
    <path d="M60 55 L74 49"/>
  </g>
</symbol>

<symbol id="sp-cheese" viewBox="0 0 100 100">
  <!-- A wedge, and the holes are the point: they make it unmistakably cheese at
       card size, where a plain yellow triangle would read as a tent. -->
  <path d="M14 74 L14 40 L86 62 L86 78 q0 6 -6 6 L20 84 q-6 0 -6 -6 Z" fill="#e0a832"/>
  <path d="M14 40 L86 62 L86 66 L14 52 Z" fill="#e0a832"/>
  <path d="M18 72 L18 46 L82 66 L82 76 q0 4 -4 4 L22 79 q-4 0 -4 -4 Z" fill="#f2c94c"/>
  <g fill="#c98f22">
    <circle cx="34" cy="66" r="5.2"/>
    <circle cx="52" cy="72" r="4"/>
    <circle cx="68" cy="72" r="3"/>
    <circle cx="44" cy="57" r="2.6"/>
  </g>
</symbol>

<symbol id="sp-hen" viewBox="0 0 100 100">
  <!-- The comb and wattle are what say hen rather than bird, and they are the
       one place a red this saturated appears on the figure — so they stay put
       while the shared parts (--wing, --beak, --tail) do the moving. -->
  <path d="M70 62 L92 46 q0 18 -4 26 Z" fill="#c9563f"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 70px 62px"/>
  <ellipse cx="46" cy="62" rx="27" ry="24" fill="#c9563f"/>
  <path d="M40 56 q20 -6 26 16 q-18 8 -26 -16 Z" fill="#c9563f"
    style="rotate: calc(-1 * var(--wing, 0deg)); transform-origin: 40px 56px"/>
  <path d="M42 58 q14 -3 18 11" fill="none" stroke="#e8a882" stroke-width="3" stroke-linecap="round"
    style="rotate: calc(-1 * var(--wing, 0deg)); transform-origin: 40px 56px"/>
  <circle cx="34" cy="34" r="16" fill="#e8a882"/>
  <!-- Three lobes, drawn as one path so the whole comb sits as a unit. -->
  <path d="M24 20 q2 -12 10 -6 q4 -10 12 -2 q6 -6 8 4 q-14 6 -30 4 Z" fill="#e0574f"/>
  <path d="M22 44 q-4 8 2 10 q6 -2 4 -10 Z" fill="#e0574f"/>
  <path d="M18 34 L4 39 L18 44 Z" fill="#f5a24a"
    style="scale: 1 calc(1 + var(--beak, 0)); transform-origin: 4px 39px"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="31" cy="31" r="3.6" fill="#33291f"/>
    <circle cx="32.3" cy="30" r="1.2" fill="#fff"/>
  </g>
  <path d="M27 32 q4 -5 8 0" fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)"/>
  <g stroke="#f5a24a" stroke-width="3.4" stroke-linecap="round">
    <path d="M40 85 L38 95"/><path d="M54 85 L56 95"/>
  </g>
</symbol>

<symbol id="sp-egg" viewBox="0 0 100 100">
  <!-- Brown, not cream: a pale egg on --panel or --slot loses its own outline,
       and this one has to be countable on both. Rounder and fatter than
       sp-seed, whose teardrop is the shape it must not be confused with. -->
  <path d="M50 12 q20 18 20 40 a20 24 0 0 1 -40 0 q0 -22 20 -40 Z" fill="#d9b48c"/>
  <path d="M50 12 q20 18 20 40 a20 24 0 0 1 -8 18 q8 -34 -12 -58 Z" fill="#c19a6b"/>
  <ellipse cx="42" cy="40" rx="5" ry="8" fill="#c19a6b" opacity=".8" transform="rotate(-16 42 40)"/>
</symbol>

<symbol id="sp-sheep" viewBox="0 0 100 100">
  <!-- The wool is a ring of circles rather than one outline, because the bumpy
       edge is the whole silhouette: at card size a smooth oval reads as a cloud
       and ten of them smear together. -->
  <path d="M76 78 q12 -4 8 -12" fill="none" stroke="#f2e6cf" stroke-width="9"
    stroke-linecap="round"
    style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 76px 78px"/>
  <g fill="#4a4a52">
    <rect x="33" y="84" width="8" height="14" rx="4"/>
    <rect x="55" y="84" width="8" height="14" rx="4"/>
  </g>
  <!-- The same wool shapes, 2.5 units larger and dark, sitting behind: this is the
       sheep's outline. It has to exist. The wool #f2e6cf is 12.5 RGB units from
       --slot, so on an answer card an unoutlined sheep is a sheep-shaped piece of
       card -- which is exactly what sp-rabbit does at 16.3 and what the expansion
       plan names as the case not to repeat. Drawn as an offset layer rather than a
       stroke on each circle, because stroking them individually draws seams
       everywhere the bumps overlap. -->
  <g fill="#4a4a52">
    <circle cx="26" cy="62" r="13.5"/><circle cx="29" cy="80" r="12.5"/>
    <circle cx="48" cy="86" r="13.5"/><circle cx="67" cy="80" r="12.5"/>
    <circle cx="70" cy="62" r="13.5"/><circle cx="60" cy="50" r="12.5"/>
    <circle cx="36" cy="50" r="12.5"/>
    <ellipse cx="48" cy="68" rx="27.5" ry="23.5"/>
  </g>
  <g fill="#f2e6cf">
    <circle cx="26" cy="62" r="11"/><circle cx="29" cy="80" r="10"/>
    <circle cx="48" cy="86" r="11"/><circle cx="67" cy="80" r="10"/>
    <circle cx="70" cy="62" r="11"/><circle cx="60" cy="50" r="10"/>
    <circle cx="36" cy="50" r="10"/>
    <ellipse cx="48" cy="68" rx="25" ry="21"/>
  </g>
  <g fill="#dcc9a8">
    <circle cx="70" cy="62" r="11"/><circle cx="67" cy="80" r="10"/>
  </g>
  <g style="rotate: var(--ear, 0deg); transform-origin: 34px 34px">
    <ellipse cx="28" cy="33" rx="9" ry="5" fill="#3d3d44" transform="rotate(-18 28 33)"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 62px 34px">
    <ellipse cx="68" cy="33" rx="9" ry="5" fill="#3d3d44" transform="rotate(18 68 33)"/>
  </g>
  <ellipse cx="48" cy="38" rx="14" ry="15" fill="#4a4a52"/>
  <!-- Features in paper, not ink: the face is #4a4a52 and an ink eye on it is
       one dark shape with no eye in it. Every other figure in the set has a pale
       face and takes the ink; this one inverts for the same reason. -->
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="42" cy="35" r="3.4" fill="#fffdf8"/>
    <circle cx="54" cy="35" r="3.4" fill="#fffdf8"/>
    <circle cx="42" cy="35" r="1.6" fill="#23303a"/>
    <circle cx="54" cy="35" r="1.6" fill="#23303a"/>
  </g>
  <g fill="none" stroke="#fffdf8" stroke-width="2.6" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M38 36 q4 -5 8 0"/>
    <path d="M50 36 q4 -5 8 0"/>
  </g>
  <path d="M42 46 q6 5 12 0" fill="none" stroke="#fffdf8" stroke-width="2.4"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 46px"/>
</symbol>

<symbol id="sp-clover" viewBox="0 0 100 100">
  <!-- Three lobes around one point, each a rounded wedge pointing at the centre.
       One lobe is the pale #63bd57 so the three read as three at card size --
       a single flat green three-lobe collapses into one blob. -->
  <path d="M50 46 q-12 -30 -22 -44" fill="none" stroke="#4f9a34" stroke-width="5"
    stroke-linecap="round" transform="rotate(180 50 46)"/>
  <g>
    <path d="M50 46 q-15 -5 -13 -17 q2 -11 13 -9 q11 -2 13 9 q2 12 -13 17 Z" fill="#63bd57"/>
    <path d="M50 46 q-15 -5 -13 -17 q2 -11 13 -9 q11 -2 13 9 q2 12 -13 17 Z" fill="#4f9a34"
      transform="rotate(120 50 46)"/>
    <path d="M50 46 q-15 -5 -13 -17 q2 -11 13 -9 q11 -2 13 9 q2 12 -13 17 Z" fill="#4f9a34"
      transform="rotate(240 50 46)"/>
  </g>
</symbol>

<symbol id="sp-haybale" viewBox="0 0 100 100">
  <!-- A round bale end-on: the pale flat face is the straw ends, and the two
       cords crossing it are what separate this from every other sphere in the
       set. Without them it is a ball. -->
  <circle cx="50" cy="52" r="31" fill="#e0b455"/>
  <circle cx="50" cy="52" r="22" fill="#f0cf90"/>
  <g fill="none" stroke="#c98a1f" stroke-width="4" stroke-linecap="round">
    <path d="M36 24 q-4 28 2 56"/>
    <path d="M64 24 q4 28 -2 56"/>
  </g>
  <g fill="none" stroke="#c98a1f" stroke-width="2.4" stroke-linecap="round" opacity=".8">
    <path d="M42 36 q8 -4 16 0"/>
    <path d="M42 68 q8 4 16 0"/>
  </g>
</symbol>

<symbol id="sp-cow" viewBox="0 0 100 100">
  <!-- The tail is a rope with a tuft, so --tail swings the whole line from the
       rump rather than scaling it the way the pig's corkscrew does. -->
  <g style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 73px 70px">
    <path d="M73 70 q11 6 9 18" fill="none" stroke="#8a5a3c" stroke-width="4"
      stroke-linecap="round"/>
    <ellipse cx="82" cy="91" rx="5" ry="7" fill="#f2e6cf"/>
  </g>
  <g fill="#4a4a52">
    <rect x="32" y="86" width="9" height="12" rx="4"/>
    <rect x="55" y="86" width="9" height="12" rx="4"/>
  </g>
  <ellipse cx="48" cy="74" rx="26" ry="18" fill="#8a5a3c"/>
  <ellipse cx="36" cy="76" rx="10" ry="8" fill="#f2e6cf"/>
  <ellipse cx="62" cy="70" rx="8" ry="6" fill="#f2e6cf"/>
  <!-- Blunt and short: a cow horn drawn long reads as a goat's. -->
  <g fill="#e0c9a0">
    <path d="M36 24 q-6 -8 0 -11 q6 2 5 11 Z"/>
    <path d="M60 24 q6 -8 0 -11 q-6 2 -5 11 Z"/>
  </g>
  <g style="rotate: var(--ear, 0deg); transform-origin: 32px 36px">
    <ellipse cx="26" cy="35" rx="8" ry="5.5" fill="#8a5a3c" transform="rotate(-20 26 35)"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 64px 36px">
    <ellipse cx="70" cy="35" rx="8" ry="5.5" fill="#8a5a3c" transform="rotate(20 70 35)"/>
  </g>
  <ellipse cx="48" cy="38" rx="18" ry="17" fill="#8a5a3c"/>
  <path d="M48 21 q9 4 8 14 q-8 4 -8 -14 Z" fill="#f2e6cf"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="40" cy="34" r="3.6" fill="#33291f"/>
    <circle cx="56" cy="34" r="3.6" fill="#33291f"/>
    <circle cx="41.2" cy="33" r="1.2" fill="#fff"/>
    <circle cx="57.2" cy="33" r="1.2" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M36 35 q4 -5 8 0"/>
    <path d="M52 35 q4 -5 8 0"/>
  </g>
  <ellipse cx="48" cy="52" rx="13" ry="10" fill="#f2b8c0"/>
  <ellipse cx="43" cy="51" rx="2.4" ry="3.2" fill="#33291f"/>
  <ellipse cx="53" cy="51" rx="2.4" ry="3.2" fill="#33291f"/>
  <path d="M41 59 q7 5 14 0" fill="none" stroke="#33291f" stroke-width="2.4"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 59px"/>
</symbol>

<symbol id="sp-horse" viewBox="0 0 100 100">
  <!-- A pony, not a horse: the head is large against the body and the legs are
       short, which is the proportion every other figure in the set is drawn to. -->
  <g style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 72px 68px">
    <path d="M72 68 q14 8 10 26 q-8 -2 -14 -8 Z" fill="#7a4a2a"/>
  </g>
  <g fill="#4a4a52">
    <rect x="33" y="86" width="9" height="12" rx="4"/>
    <rect x="55" y="86" width="9" height="12" rx="4"/>
  </g>
  <ellipse cx="48" cy="74" rx="24" ry="18" fill="#b4663a"/>
  <g style="rotate: var(--ear, 0deg); transform-origin: 36px 26px">
    <path d="M36 28 q-4 -14 2 -16 q6 4 4 16 Z" fill="#b4663a"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 60px 26px">
    <path d="M60 28 q4 -14 -2 -16 q-6 4 -4 16 Z" fill="#b4663a"/>
  </g>
  <ellipse cx="48" cy="40" rx="17" ry="18" fill="#b4663a"/>
  <!-- The mane is a scalloped band over the crown, which is the one part that
       says pony at a glance once the ears are shared with every other animal. -->
  <path d="M33 32 q4 -12 15 -13 q11 1 15 13 q-6 -5 -15 -5 q-9 0 -15 5 Z" fill="#7a4a2a"/>
  <path d="M44 22 q4 -12 10 -10 q-2 6 -4 11 Z" fill="#7a4a2a"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="40" cy="37" r="3.4" fill="#33291f"/>
    <circle cx="56" cy="37" r="3.4" fill="#33291f"/>
    <circle cx="41.1" cy="36" r="1.1" fill="#fff"/>
    <circle cx="57.1" cy="36" r="1.1" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M36 38 q4 -5 8 0"/>
    <path d="M52 38 q4 -5 8 0"/>
  </g>
  <ellipse cx="48" cy="54" rx="11" ry="9" fill="#e8c9a8"/>
  <ellipse cx="44" cy="53" rx="2.2" ry="3" fill="#33291f"/>
  <ellipse cx="52" cy="53" rx="2.2" ry="3" fill="#33291f"/>
  <path d="M42 60 q6 5 12 0" fill="none" stroke="#33291f" stroke-width="2.2"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 60px"/>
</symbol>

<symbol id="sp-horseshoe" viewBox="0 0 100 100">
  <!-- Opening downward, with the nail holes drawn through: a plain U is a magnet
       and the holes are what make it a shoe. -->
  <path d="M22 58 a28 28 0 0 1 56 0 L78 76 q0 8 -7 8 q-7 0 -7 -8 L64 58
           a14 14 0 0 0 -28 0 L36 76 q0 8 -7 8 q-7 0 -7 -8 Z" fill="#8fa3b2"/>
  <path d="M36 58 a14 14 0 0 1 28 0" fill="none" stroke="#6b7d8a" stroke-width="3"/>
  <g fill="#566672">
    <circle cx="27" cy="60" r="2.6"/><circle cx="30" cy="72" r="2.6"/>
    <circle cx="73" cy="60" r="2.6"/><circle cx="70" cy="72" r="2.6"/>
    <circle cx="34" cy="44" r="2.6"/><circle cx="66" cy="44" r="2.6"/>
  </g>
</symbol>

<symbol id="sp-duck" viewBox="0 0 100 100">
  <g style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 72px 66px">
    <path d="M72 66 q14 -2 16 8 q-10 6 -16 -8 Z" fill="#e0bd4a"/>
  </g>
  <g fill="#f0862f">
    <path d="M34 88 q-8 6 0 8 q10 0 12 -8 Z"/>
    <path d="M62 88 q8 6 0 8 q-10 0 -12 -8 Z"/>
  </g>
  <ellipse cx="48" cy="70" rx="26" ry="21" fill="#f5d76e"/>
  <!-- The wing is one flat paddle, hinged at the shoulder, so --wing reads as a
       flap and not as a whole side of the bird moving. -->
  <path d="M28 62 q20 -8 26 14 q-18 10 -26 -14 Z" fill="#e0bd4a"
    style="rotate: var(--wing, 0deg); transform-origin: 28px 62px"/>
  <circle cx="48" cy="34" r="17" fill="#f5d76e"/>
  <!-- The bill opens by scaling down from its hinge, which is the same trick the
       hen's beak uses -- one shape, no second drawing for the open state. -->
  <g style="scale: 1 calc(1 + var(--beak, 0)); transform-origin: 48px 44px">
    <ellipse cx="48" cy="48" rx="13" ry="6" fill="#f0862f"/>
    <path d="M35 48 q13 5 26 0" fill="none" stroke="#c96a20" stroke-width="1.8"/>
  </g>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="41" cy="31" r="3.4" fill="#33291f"/>
    <circle cx="55" cy="31" r="3.4" fill="#33291f"/>
    <circle cx="42.1" cy="30" r="1.1" fill="#fff"/>
    <circle cx="56.1" cy="30" r="1.1" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M37 32 q4 -5 8 0"/>
    <path d="M51 32 q4 -5 8 0"/>
  </g>
</symbol>

<symbol id="sp-snail" viewBox="0 0 100 100">
  <!-- The spiral is drawn as a stroke over the shell disc rather than as nested
       shapes: at card size a filled spiral fills in, and the line is what
       survives. -->
  <path d="M14 76 q-6 6 2 8 q14 2 26 -2 l30 0 q10 0 10 -6 q0 -6 -10 -6 l-44 0 Z"
    fill="#c9c0cc"/>
  <g style="rotate: var(--ear, 0deg); transform-origin: 20px 72px">
    <g fill="none" stroke="#c9c0cc" stroke-width="3.4" stroke-linecap="round">
      <path d="M20 72 q-4 -14 -10 -20"/>
      <path d="M26 72 q0 -16 4 -22"/>
    </g>
    <circle cx="10" cy="50" r="3.4" fill="#33291f"/>
    <circle cx="30" cy="48" r="3.4" fill="#33291f"/>
  </g>
  <circle cx="58" cy="52" r="26" fill="#8a63c0"/>
  <path d="M58 30 a22 22 0 1 1 -15.6 37.6 a16 16 0 1 1 21.6 -23.6 a10 10 0 1 1 -12 15"
    fill="none" stroke="#6b4a99" stroke-width="4.4" stroke-linecap="round"/>
</symbol>

<symbol id="sp-bee" viewBox="0 0 100 100">
  <!-- Wings behind the body, both driven by one --wing: a bee's tell is that they
       blur together rather than beating in opposition like a bird's. -->
  <g style="rotate: var(--wing, 0deg); transform-origin: 34px 40px">
    <ellipse cx="24" cy="32" rx="15" ry="9" fill="#dff0f7" transform="rotate(-26 24 32)"/>
  </g>
  <g style="rotate: calc(-1 * var(--wing, 0deg)); transform-origin: 66px 40px">
    <ellipse cx="76" cy="32" rx="15" ry="9" fill="#dff0f7" transform="rotate(26 76 32)"/>
  </g>
  <ellipse cx="50" cy="62" rx="23" ry="21" fill="#f0b429"/>
  <g fill="#3a2f28">
    <path d="M31 52 q19 -6 38 0 q1 4 1 6 q-20 -6 -40 0 q0 -2 1 -6 Z"/>
    <path d="M29 68 q21 6 42 0 q-1 5 -3 9 q-18 5 -36 0 q-2 -4 -3 -9 Z"/>
  </g>
  <g fill="none" stroke="#3a2f28" stroke-width="2.6" stroke-linecap="round">
    <path d="M42 22 q-4 -8 -8 -10"/>
    <path d="M58 22 q4 -8 8 -10"/>
  </g>
  <circle cx="50" cy="32" r="15" fill="#f0b429"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="44" cy="30" r="3.4" fill="#33291f"/>
    <circle cx="56" cy="30" r="3.4" fill="#33291f"/>
    <circle cx="45.1" cy="29" r="1.1" fill="#fff"/>
    <circle cx="57.1" cy="29" r="1.1" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M40 31 q4 -5 8 0"/>
    <path d="M52 31 q4 -5 8 0"/>
  </g>
  <path d="M44 39 q6 5 12 0" fill="none" stroke="#33291f" stroke-width="2.4"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 50px 39px"/>
</symbol>

<symbol id="sp-goat" viewBox="0 0 100 100">
  <g style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 71px 70px">
    <path d="M71 70 q10 -2 10 -10" fill="none" stroke="#c9bfae" stroke-width="6"
      stroke-linecap="round"/>
  </g>
  <g fill="#4a4a52">
    <rect x="33" y="86" width="9" height="12" rx="4"/>
    <rect x="55" y="86" width="9" height="12" rx="4"/>
  </g>
  <ellipse cx="48" cy="74" rx="23" ry="17" fill="#c9bfae"/>
  <!-- Horns sweep back over the crown. A goat drawn with the cow's blunt stubs
       reads as a cow, and these two figures sit four levels apart. -->
  <g fill="none" stroke="#f2e6cf" stroke-width="6" stroke-linecap="round">
    <path d="M38 24 q-8 -10 -2 -16"/>
    <path d="M58 24 q8 -10 2 -16"/>
  </g>
  <g style="rotate: var(--ear, 0deg); transform-origin: 33px 36px">
    <ellipse cx="27" cy="37" rx="9" ry="5" fill="#c9bfae" transform="rotate(-24 27 37)"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 63px 36px">
    <ellipse cx="69" cy="37" rx="9" ry="5" fill="#c9bfae" transform="rotate(24 69 37)"/>
  </g>
  <ellipse cx="48" cy="40" rx="16" ry="17" fill="#c9bfae"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="41" cy="36" r="3.4" fill="#33291f"/>
    <circle cx="55" cy="36" r="3.4" fill="#33291f"/>
    <circle cx="42.1" cy="35" r="1.1" fill="#fff"/>
    <circle cx="56.1" cy="35" r="1.1" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M37 37 q4 -5 8 0"/>
    <path d="M51 37 q4 -5 8 0"/>
  </g>
  <ellipse cx="48" cy="51" rx="10" ry="8" fill="#e8dcc9"/>
  <ellipse cx="44" cy="50" rx="2.2" ry="2.8" fill="#33291f"/>
  <ellipse cx="52" cy="50" rx="2.2" ry="2.8" fill="#33291f"/>
  <path d="M43 57 q5 4 10 0" fill="none" stroke="#33291f" stroke-width="2.2"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 57px"/>
  <!-- The beard hangs from the chin and is the second thing that says goat. -->
  <path d="M43 58 q5 16 10 0 q-2 12 -5 14 q-3 -2 -5 -14 Z" fill="#4a4a52"/>
</symbol>

<symbol id="sp-cabbage" viewBox="0 0 100 100">
  <!-- Layers, not a ball: the two arcs and the pale heart are what keep this from
       reading as the same sphere as an apple or a bale. -->
  <circle cx="50" cy="52" r="30" fill="#7fb069"/>
  <path d="M22 46 q14 -12 28 -10 q14 -2 28 10" fill="none" stroke="#5c8f4a" stroke-width="3.4"/>
  <path d="M24 62 q13 10 26 10 q13 0 26 -10" fill="none" stroke="#5c8f4a" stroke-width="3.4"/>
  <path d="M50 34 q14 4 12 18 q-12 8 -24 0 q-2 -14 12 -18 Z" fill="#a8cc8a"/>
  <path d="M50 40 q6 6 0 12" fill="none" stroke="#7fb069" stroke-width="3" stroke-linecap="round"/>
</symbol>

<symbol id="sp-squirrel" viewBox="0 0 100 100">
  <!-- The tail is most of the animal and it stands over the back, so --tail
       sweeps it about the rump: raising it fills the top right of the box, which
       is why this drawing is the widest of the actors. -->
  <g style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 62px 76px">
    <path d="M62 76 q26 -4 24 -30 q-2 -22 -20 -22 q14 8 12 24 q-2 18 -16 20 Z"
      fill="#a85a28"/>
  </g>
  <g fill="#c4703a">
    <rect x="30" y="84" width="8" height="12" rx="4"/>
    <rect x="48" y="84" width="8" height="12" rx="4"/>
  </g>
  <ellipse cx="42" cy="72" rx="20" ry="19" fill="#c4703a"/>
  <ellipse cx="42" cy="76" rx="12" ry="13" fill="#f2e6cf"/>
  <!-- Tufted, not round: the tuft is what separates a squirrel from a mouse at
       this size, and both are in the set. -->
  <g style="rotate: var(--ear, 0deg); transform-origin: 32px 30px">
    <path d="M32 32 q-5 -14 1 -15 q6 3 5 15 Z" fill="#c4703a"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 52px 30px">
    <path d="M52 32 q5 -14 -1 -15 q-6 3 -5 15 Z" fill="#c4703a"/>
  </g>
  <circle cx="42" cy="40" r="16" fill="#c4703a"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="36" cy="37" r="3.4" fill="#33291f"/>
    <circle cx="49" cy="37" r="3.4" fill="#33291f"/>
    <circle cx="37.1" cy="36" r="1.1" fill="#fff"/>
    <circle cx="50.1" cy="36" r="1.1" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.8" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M32 38 q4 -5 8 0"/>
    <path d="M45 38 q4 -5 8 0"/>
  </g>
  <ellipse cx="42" cy="48" rx="7" ry="5" fill="#f2e6cf"/>
  <circle cx="42" cy="46" r="2" fill="#33291f"/>
  <path d="M37 51 q5 4 10 0" fill="none" stroke="#33291f" stroke-width="2.2"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 42px 51px"/>
</symbol>

<symbol id="sp-acorn" viewBox="0 0 100 100">
  <!-- Cap and nut in two clearly different colours: the cap is the whole
       silhouette cue, and a tonal cap turns this into a plain ovoid -- which the
       egg already is. -->
  <path d="M28 44 q22 -5 44 0 q-2 32 -22 40 q-20 -8 -22 -40 Z" fill="#e8c9a0"/>
  <path d="M50 44 q22 -3 22 0 q-2 32 -22 40 q10 -18 0 -40 Z" fill="#d9b48c"/>
  <path d="M24 44 q26 -24 52 0 q-26 9 -52 0 Z" fill="#6b4a24"/>
  <path d="M50 22 q1 -8 5 -10" fill="none" stroke="#6b4a24" stroke-width="4.4"
    stroke-linecap="round"/>
</symbol>

<symbol id="sp-elephant" viewBox="0 0 100 100">
  <!-- The trunk is this figure's own moving part and no existing shared property
       fits it: --tail is behind, --ear is the ears, and a trunk curls rather than
       swinging. So it reads --trunk, registered beside the others. -->
  <g fill="#9aa8b4">
    <rect x="30" y="84" width="11" height="13" rx="4"/>
    <rect x="55" y="84" width="11" height="13" rx="4"/>
  </g>
  <g fill="#f2e6cf">
    <circle cx="33" cy="95" r="1.8"/><circle cx="38" cy="95" r="1.8"/>
    <circle cx="58" cy="95" r="1.8"/><circle cx="63" cy="95" r="1.8"/>
  </g>
  <ellipse cx="48" cy="72" rx="25" ry="17" fill="#9aa8b4"/>
  <!-- Big flat ears, hinged where they meet the head. -->
  <g style="rotate: var(--ear, 0deg); transform-origin: 32px 40px">
    <ellipse cx="21" cy="42" rx="14" ry="16" fill="#9aa8b4"/>
    <ellipse cx="22" cy="42" rx="8" ry="10" fill="#c9b2b8"/>
  </g>
  <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 64px 40px">
    <ellipse cx="75" cy="42" rx="14" ry="16" fill="#9aa8b4"/>
    <ellipse cx="74" cy="42" rx="8" ry="10" fill="#c9b2b8"/>
  </g>
  <ellipse cx="48" cy="40" rx="19" ry="18" fill="#9aa8b4"/>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="40" cy="36" r="3.2" fill="#33291f"/>
    <circle cx="56" cy="36" r="3.2" fill="#33291f"/>
    <circle cx="41" cy="35" r="1.1" fill="#fff"/>
    <circle cx="57" cy="35" r="1.1" fill="#fff"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="2.6" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M36 37 q4 -5 8 0"/>
    <path d="M52 37 q4 -5 8 0"/>
  </g>
  <!-- At rest it hangs; --trunk rolls the tip up. The curl is drawn into the
       path and the property rotates it about the brow, so one drawing covers
       both the droop and the raised salute. -->
  <path d="M48 48 q-3 16 3 24 q6 8 12 2" fill="none" stroke="#9aa8b4" stroke-width="9"
    stroke-linecap="round"
    style="rotate: calc(-1 * var(--trunk, 0deg)); transform-origin: 48px 48px"/>
</symbol>

<symbol id="sp-peanut" viewBox="0 0 100 100">
  <!-- Two lobes with a real waist. The waist has to cut in far enough to survive
       ten copies at card size, where a gentle one reads as one long bean. -->
  <path d="M50 12 q19 0 19 19 q0 9 -6 13 q6 4 6 13 q0 19 -19 19 q-19 0 -19 -19
           q0 -9 6 -13 q-6 -4 -6 -13 q0 -19 19 -19 Z" fill="#d9a86b"/>
  <g fill="none" stroke="#b8813f" stroke-width="2.4" stroke-linecap="round">
    <path d="M38 24 q4 6 0 12"/>
    <path d="M62 24 q-4 6 0 12"/>
    <path d="M38 52 q4 8 0 16"/>
    <path d="M62 52 q-4 8 0 16"/>
    <path d="M37 44 q13 4 26 0"/>
  </g>
</symbol>

<symbol id="sp-panda" viewBox="0 0 100 100">
  <!-- The worst contrast case in the set: the fur #fbf9f4 is 4 RGB units from
       --panel, so nothing about the shape can be left to the fill. Every white
       part carries an ink outline, and the black patches, arms and legs are most
       of the silhouette. Drawn any lighter this figure disappears on its own
       answer card. -->
  <g fill="#33291f">
    <circle cx="30" cy="26" r="10"/><circle cx="66" cy="26" r="10"/>
    <rect x="26" y="76" width="14" height="20" rx="7"/>
    <rect x="56" y="76" width="14" height="20" rx="7"/>
  </g>
  <ellipse cx="48" cy="72" rx="25" ry="21" fill="#fbf9f4" stroke="#33291f" stroke-width="3"/>
  <!-- Arms as one dark band across the body: it reads as two arms holding
       something and keeps a third of the figure dark. -->
  <path d="M24 66 q10 12 24 12 q14 0 24 -12 q2 10 -6 16 q-18 8 -36 0 q-8 -6 -6 -16 Z"
    fill="#33291f"/>
  <circle cx="48" cy="40" r="21" fill="#fbf9f4" stroke="#33291f" stroke-width="3"/>
  <g fill="#33291f" style="opacity: calc(1 - var(--joy, 0))">
    <ellipse cx="39" cy="37" rx="6.5" ry="7.5" transform="rotate(-12 39 37)"/>
    <ellipse cx="57" cy="37" rx="6.5" ry="7.5" transform="rotate(12 57 37)"/>
  </g>
  <g fill="#fff" style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="40" cy="35" r="1.6"/><circle cx="58" cy="35" r="1.6"/>
  </g>
  <!-- The patches stay when the eyes turn to arcs, or the face loses the mask
       that makes it a panda at exactly the happiest moment. -->
  <g style="opacity: var(--joy, 0)">
    <ellipse cx="39" cy="37" rx="6.5" ry="7.5" fill="#33291f" transform="rotate(-12 39 37)"/>
    <ellipse cx="57" cy="37" rx="6.5" ry="7.5" fill="#33291f" transform="rotate(12 57 37)"/>
    <g fill="none" stroke="#fbf9f4" stroke-width="2.2" stroke-linecap="round">
      <path d="M35 38 q4 -4 8 0"/>
      <path d="M53 38 q4 -4 8 0"/>
    </g>
  </g>
  <ellipse cx="48" cy="50" rx="11" ry="8" fill="#f2e6cf"/>
  <ellipse cx="48" cy="47" rx="4" ry="2.8" fill="#33291f"/>
  <path d="M42 54 q6 5 12 0" fill="none" stroke="#33291f" stroke-width="2.4"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 48px 54px"/>
</symbol>

<symbol id="sp-bamboo" viewBox="0 0 100 100">
  <!-- Pale yellow-green on purpose, not leaf green: three greens among the level
       accents was already one too many, and the cane has to separate from the
       lotus pad and the clover, which are both green and both in this stretch. -->
  <rect x="38" y="14" width="24" height="76" rx="6" fill="#b5c94a"/>
  <g fill="none" stroke="#8a9a2f" stroke-width="3.4">
    <path d="M38 36 q12 4 24 0"/>
    <path d="M38 58 q12 4 24 0"/>
    <path d="M38 78 q12 4 24 0"/>
  </g>
  <ellipse cx="50" cy="14" rx="12" ry="5" fill="#d4e07a"/>
  <path d="M62 44 q16 -8 22 -2 q-8 10 -22 6 Z" fill="#8a9a2f"/>
</symbol>

<symbol id="sp-frog" viewBox="0 0 100 100">
  <!-- The eyes sit on top of the head rather than in the face, which is the whole
       frog silhouette. --joy closes them to arcs the way every other figure does,
       but the domes stay so the outline does not change shape. -->
  <g fill="#5aab4a">
    <path d="M18 78 q-10 4 -4 10 q10 4 18 -4 Z"/>
    <path d="M78 78 q10 4 4 10 q-10 4 -18 -4 Z"/>
  </g>
  <ellipse cx="50" cy="64" rx="30" ry="24" fill="#5aab4a"/>
  <ellipse cx="50" cy="72" rx="20" ry="14" fill="#8ecc6b"/>
  <!-- The throat balloons when it calls, and no shared property describes that:
       --beak is an opening jaw, --mouth is a curve's sign. So --throat, its own,
       registered beside the rest. -->
  <ellipse cx="50" cy="78" rx="13" ry="7" fill="#8ecc6b"
    style="scale: calc(1 + var(--throat, 0) * .5) calc(1 + var(--throat, 0));
      transform-origin: 50px 74px"/>
  <path d="M28 58 q22 16 44 0" fill="none" stroke="#33291f" stroke-width="2.8"
    stroke-linecap="round"
    style="scale: 1 var(--mouth, 1); transform-origin: 50px 58px"/>
  <g fill="#5aab4a">
    <circle cx="32" cy="36" r="14"/><circle cx="68" cy="36" r="14"/>
  </g>
  <g style="opacity: calc(1 - var(--joy, 0))">
    <circle cx="32" cy="36" r="8" fill="#fffdf8"/>
    <circle cx="68" cy="36" r="8" fill="#fffdf8"/>
    <circle cx="33" cy="37" r="4.4" fill="#33291f"/>
    <circle cx="67" cy="37" r="4.4" fill="#33291f"/>
  </g>
  <g fill="none" stroke="#33291f" stroke-width="3" stroke-linecap="round"
    style="opacity: var(--joy, 0)">
    <path d="M26 37 q6 -7 12 0"/>
    <path d="M62 37 q6 -7 12 0"/>
  </g>
</symbol>

<symbol id="sp-lotus" viewBox="0 0 100 100">
  <!-- Blue-green, not leaf green: a green frog on a green pad is one silhouette,
       and the frog is the actor this target is always drawn beside. The notch is
       cut from the disc rather than drawn on it, so it survives at card size. -->
  <path d="M50 50 L78.2 60.3 A30 30 0 1 1 78.2 39.7 Z" fill="#3f9e9d"/>
  <g fill="none" stroke="#2f7d7c" stroke-width="2.6" stroke-linecap="round">
    <path d="M50 50 L50 20"/>
    <path d="M50 50 L28 29"/>
    <path d="M50 50 L20 50"/>
    <path d="M50 50 L28 71"/>
    <path d="M50 50 L50 80"/>
    <path d="M50 50 L70 74"/>
    <path d="M50 50 L70 26"/>
  </g>
</symbol>

<symbol id="sp-giraffe" viewBox="0 0 100 100">
  <!-- The only tall figure in the set. The neck sways on --tilt about the
       shoulders, which is a rotation the shared vocabulary already has and which
       no other actor uses for its whole upper body. -->
  <g style="rotate: calc(-1 * var(--tail, 0deg)); transform-origin: 66px 78px">
    <path d="M66 78 q10 4 9 14" fill="none" stroke="#8a5a3c" stroke-width="3.4"
      stroke-linecap="round"/>
    <ellipse cx="76" cy="94" rx="4" ry="5.5" fill="#8a5a3c"/>
  </g>
  <g fill="#4a4a52">
    <rect x="36" y="86" width="8" height="12" rx="4"/>
    <rect x="54" y="86" width="8" height="12" rx="4"/>
  </g>
  <ellipse cx="49" cy="76" rx="22" ry="16" fill="#e0a84a"/>
  <g fill="#b06f28">
    <ellipse cx="38" cy="72" rx="6" ry="5"/>
    <ellipse cx="52" cy="80" rx="6.5" ry="5"/>
    <ellipse cx="61" cy="70" rx="5" ry="4.5"/>
  </g>
  <g style="rotate: var(--tilt, 0deg); transform-origin: 49px 66px">
    <path d="M42 66 q-2 -30 4 -42 q10 0 12 42 Z" fill="#e0a84a"/>
    <g fill="#b06f28">
      <ellipse cx="47" cy="54" rx="4.4" ry="4"/>
      <ellipse cx="52" cy="40" rx="4" ry="3.6"/>
      <ellipse cx="46" cy="32" rx="3.6" ry="3.2"/>
    </g>
    <path d="M45 28 q-3 14 -1 22" fill="none" stroke="#8a5a3c" stroke-width="4"
      stroke-linecap="round"/>
    <!-- Ossicones: short, blunt and always two, which is the giraffe tell that
         survives being shrunk to a card. -->
    <g fill="#8a5a3c">
      <path d="M44 14 q-2 -8 1 -9 q3 1 2 9 Z"/>
      <path d="M56 14 q2 -8 -1 -9 q-3 1 -2 9 Z"/>
    </g>
    <g style="rotate: var(--ear, 0deg); transform-origin: 40px 18px">
      <ellipse cx="35" cy="18" rx="7" ry="4" fill="#e0a84a" transform="rotate(-22 35 18)"/>
    </g>
    <g style="rotate: calc(-1 * var(--ear, 0deg)); transform-origin: 60px 18px">
      <ellipse cx="65" cy="18" rx="7" ry="4" fill="#e0a84a" transform="rotate(22 65 18)"/>
    </g>
    <ellipse cx="50" cy="20" rx="13" ry="12" fill="#e0a84a"/>
    <g style="opacity: calc(1 - var(--joy, 0))">
      <circle cx="44" cy="17" r="3" fill="#33291f"/>
      <circle cx="56" cy="17" r="3" fill="#33291f"/>
      <circle cx="44.9" cy="16.2" r="1" fill="#fff"/>
      <circle cx="56.9" cy="16.2" r="1" fill="#fff"/>
    </g>
    <g fill="none" stroke="#33291f" stroke-width="2.4" stroke-linecap="round"
      style="opacity: var(--joy, 0)">
      <path d="M41 18 q3 -4 6 0"/>
      <path d="M53 18 q3 -4 6 0"/>
    </g>
    <ellipse cx="50" cy="28" rx="8.5" ry="6.5" fill="#f2e6cf"/>
    <ellipse cx="47" cy="27" rx="1.8" ry="2.4" fill="#33291f"/>
    <ellipse cx="53" cy="27" rx="1.8" ry="2.4" fill="#33291f"/>
    <path d="M46 32 q4 4 8 0" fill="none" stroke="#33291f" stroke-width="2"
      stroke-linecap="round"
      style="scale: 1 var(--mouth, 1); transform-origin: 50px 32px"/>
  </g>
</symbol>

<symbol id="sp-leaf" viewBox="0 0 100 100">
  <!-- A teardrop with one strong centre vein and side veins off it. The vein is
       load-bearing: without it this is the same rounded wedge as a clover lobe. -->
  <path d="M50 12 q28 20 26 46 q-2 26 -26 30 q-24 -4 -26 -30 q-2 -26 26 -46 Z"
    fill="#4a8f5a"/>
  <path d="M50 16 L50 86" fill="none" stroke="#7fb069" stroke-width="3.4"
    stroke-linecap="round"/>
  <g fill="none" stroke="#7fb069" stroke-width="2.2" stroke-linecap="round">
    <path d="M50 32 q-12 4 -16 14"/>
    <path d="M50 32 q12 4 16 14"/>
    <path d="M50 52 q-12 4 -15 14"/>
    <path d="M50 52 q12 4 15 14"/>
    <path d="M50 70 q-9 3 -11 10"/>
    <path d="M50 70 q9 3 11 10"/>
  </g>
</symbol>

<symbol id="sp-bowl" viewBox="0 0 100 100">
  <ellipse cx="50" cy="40" rx="44" ry="11" fill="#bfe6f5"/>
  <path d="M6 40 q6 46 44 46 q38 0 44 -46 Z" fill="#7fc8e8"/>
  <path d="M16 46 q6 32 34 32" fill="none" stroke="#a8ddf2" stroke-width="5" stroke-linecap="round"/>
</symbol>

<symbol id="sp-bowl-dog" viewBox="0 0 100 100">
  <ellipse cx="50" cy="40" rx="44" ry="11" fill="#f0c9a0"/>
  <path d="M6 40 q6 46 44 46 q38 0 44 -46 Z" fill="#d99a63"/>
  <path d="M12 56 h76" fill="none" stroke="#c07f4c" stroke-width="6"/>
</symbol>

<symbol id="sp-basket" viewBox="0 0 100 100">
  <path d="M10 34 L90 34 L79 88 L21 88 Z" fill="#c98d4e"/>
  <g stroke="#a5702f" stroke-width="3.4">
    <path d="M14 50 H86"/><path d="M17 66 H83"/>
    <path d="M36 34 L32 88"/><path d="M64 34 L68 88"/>
  </g>
  <rect x="6" y="28" width="88" height="11" rx="5.5" fill="#a5702f"/>
</symbol>

<symbol id="sp-garden" viewBox="0 0 100 100">
  <rect x="4" y="52" width="92" height="36" rx="10" fill="#8b5e3c"/>
  <g fill="#54a84b">
    <path d="M14 52 q6 -16 12 0 Z"/><path d="M40 52 q6 -18 12 0 Z"/><path d="M68 52 q6 -16 12 0 Z"/>
  </g>
  <g stroke="#6f4a2e" stroke-width="3" stroke-linecap="round">
    <path d="M16 68 H40"/><path d="M56 76 H84"/>
  </g>
</symbol>

<symbol id="sp-nest" viewBox="0 0 100 100">
  <ellipse cx="50" cy="62" rx="46" ry="24" fill="#a9773f"/>
  <ellipse cx="50" cy="56" rx="34" ry="15" fill="#7d5528"/>
  <g stroke="#8c6231" stroke-width="3.2" stroke-linecap="round">
    <path d="M8 60 q20 -10 40 -6"/><path d="M52 72 q22 -6 40 -14"/>
  </g>
</symbol>

<symbol id="sp-glow" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="none" stroke="#ffd44d" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 10"/>
  <circle cx="50" cy="50" r="24" fill="none" stroke="#ffe796" stroke-width="5" stroke-dasharray="8 8"/>
</symbol>


<symbol id="sp-flower" viewBox="0 0 100 100">
  <path d="M50 94 V56" fill="none" stroke="#54a84b" stroke-width="6" stroke-linecap="round"/>
  <path d="M50 74 q-16 -6 -18 -18 q16 0 18 18 Z" fill="#63bd57"/>
  <g fill="#f27a9b">
    <circle cx="50" cy="34" r="13"/><circle cx="32" cy="46" r="13"/>
    <circle cx="68" cy="46" r="13"/><circle cx="39" cy="64" r="12"/><circle cx="61" cy="64" r="12"/>
  </g>
  <circle cx="50" cy="50" r="11" fill="#ffd44d"/>
</symbol>

<symbol id="ic-pause" viewBox="0 0 100 100">
  <rect x="28" y="22" width="16" height="56" rx="7" fill="currentColor"/>
  <rect x="56" y="22" width="16" height="56" rx="7" fill="currentColor"/>
</symbol>
<symbol id="ic-play" viewBox="0 0 100 100">
  <path d="M30 20 L80 50 L30 80 Z" fill="currentColor"/>
</symbol>
<symbol id="ic-hint" viewBox="0 0 100 100">
  <path d="M50 12 a26 26 0 0 1 16 46 v8 H34 v-8 A26 26 0 0 1 50 12 Z" fill="currentColor"/>
  <rect x="36" y="72" width="28" height="9" rx="4.5" fill="currentColor"/>
  <rect x="40" y="85" width="20" height="8" rx="4" fill="currentColor"/>
</symbol>
<symbol id="ic-undo" viewBox="0 0 100 100">
  <path d="M22 50 a28 28 0 1 1 28 28" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>
  <path d="M22 28 V52 H46" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
</symbol>
<symbol id="ic-check" viewBox="0 0 100 100">
  <path d="M22 54 L42 74 L80 28" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
</symbol>
<symbol id="ic-gear" viewBox="0 0 100 100">
  <path d="M50 8 l7 12 h14 l3 14 12 7 -5 13 5 13 -12 7 -3 14 H57 l-7 12 -7 -12 H29 l-3 -14 -12 -7 5 -13 -5 -13 12 -7 3 -14 h14 Z" fill="currentColor" opacity=".9"/>
  <circle cx="50" cy="50" r="14" fill="#fff"/>
</symbol>
<symbol id="ic-home" viewBox="0 0 100 100">
  <path d="M50 14 L90 48 H76 V84 H24 V48 H10 Z" fill="currentColor"/>
</symbol>
<symbol id="ic-close" viewBox="0 0 100 100">
  <path d="M26 26 L74 74 M74 26 L26 74" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
</symbol>
<symbol id="ic-arrow" viewBox="0 0 100 100">
  <path d="M8 50 H70" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
  <path d="M58 26 L92 50 L58 74 Z" fill="currentColor"/>
</symbol>
<!-- A closed padlock, for a level not yet open. The shackle is a separate path
     so a stylesheet can lift it off the body when the lock breaks. -->
<symbol id="ic-lock" viewBox="0 0 100 100">
  <path class="shackle" d="M32 46 V33 a18 18 0 0 1 36 0 V46" fill="none" stroke="currentColor"
    stroke-width="11" stroke-linecap="round"/>
  <rect x="22" y="44" width="56" height="44" rx="10" fill="currentColor"/>
  <circle cx="50" cy="62" r="6" fill="#fff"/>
  <rect x="47" y="64" width="6" height="14" rx="3" fill="#fff"/>
</symbol>
`;

/**
 * Each object sprite's own box, in the coordinates it was drawn in.
 * Filled once by measureSprites(); empty for icons, which are left square.
 * @type {Map<string, {x: number, y: number, w: number, h: number}>}
 */
const BOXES = new Map();

/* The square every sprite above was hand-drawn in. */
const SPRITE_UNITS = 100;

/** The box a sprite actually occupies, or undefined for an unmeasured one. */
export const spriteBox = id => BOXES.get(id);

/** The box, as a viewBox attribute in the coordinates the sprite was drawn in. */
const boxAttr = b => `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.w.toFixed(2)} ${b.h.toFixed(2)}`;

/**
 * The same box as a viewBox for an <svg> that shows the sprite through a <use>.
 *
 * It starts at the origin, not at the crop offset, and that is the whole trick:
 * a <use> whose symbol carries a viewBox maps that viewBox onto the use's own
 * viewport, so the symbol has already moved the drawing to (0,0) by the time the
 * outer <svg> sees it. Repeating the offset out here would scroll the drawing up
 * and to the left by exactly the margin that was cropped, cutting off its corner.
 */
const originAttr = b => `0 0 ${b.w.toFixed(2)} ${b.h.toFixed(2)}`;

/**
 * Crop every object sprite's viewBox to the drawing inside it.
 *
 * The sprites were drawn by hand in a shared 100x100 square, and each ended up
 * with its own margin — the bone used 70 units across, the seed 46. Worse, a
 * fish is 84 wide and 45 tall: no margin trimming can make a fish square, so a
 * square cell must leave 45% of itself empty and the fish arrives looking half
 * the size the cell suggests.
 *
 * So let each sprite carry its own proportions. Measure the drawing, crop the
 * symbol's viewBox to it, and record the box so `sprite()` can give the element
 * the same aspect ratio. The layout then reserves a fish-shaped cell for a fish,
 * and every pixel of that cell is drawing.
 *
 * Icons keep the square: they share a stroke weight and an optical padding, and
 * cropping each to its own ink would break both.
 */
function measureSprites (sheet) {
	// A <symbol> is never rendered and has no box to measure, and its children
	// have no computed style either. A rendered copy has both.
	const probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	probe.setAttribute('viewBox', `0 0 ${SPRITE_UNITS} ${SPRITE_UNITS}`);
	// The pixel size is pinned inline, and to the same number as the viewBox, so
	// one drawn unit is one pixel: the measurement below reads pixels and records
	// user units. Inline so no stylesheet rule for `svg` can rescale it.
	probe.style.cssText = 'position:absolute;left:-9999px;top:0;'
		+ `width:${SPRITE_UNITS}px;height:${SPRITE_UNITS}px`;
	document.body.append(probe);

	for (const sym of sheet.querySelectorAll('symbol[id^="sp-"]')) {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		for (const child of sym.children)
			g.append(child.cloneNode(true));
		probe.append(g);

		// What the sprite actually paints, in the units it was drawn in.
		//
		// getBBox() describes geometry and excludes stroke, and in Chromium
		// getBoundingClientRect() excludes it too (a 10-wide stroked line reports
		// height 0), while getBBox({stroke: true}) is ignored. So the stroke has
		// to be added by hand: each shape's own box, grown by half its own stroke
		// width. Per shape, not one widest-stroke pad for the whole sprite — the
		// cat's 7-unit tail stroke would otherwise be spent on all four sides of a
		// drawing that is unstroked everywhere else, and give back 8% of the box.
		//
		// getBBox() ignores the element's own transform, so each box is mapped
		// into the group's coordinates before being unioned: the rabbit's ears are
		// rotated ellipses, and their untransformed boxes are in the wrong place.
		let painted = null;
		const grow = (x1, y1, x2, y2) => {
			painted = painted ? {
				x1: Math.min(painted.x1, x1), y1: Math.min(painted.y1, y1),
				x2: Math.max(painted.x2, x2), y2: Math.max(painted.y2, y2),
			} : {x1, y1, x2, y2};
		};

		try {
			// Geometry union, transform-correct: the floor this can never go under.
			const geo = g.getBBox();
			if (geo.width || geo.height)
				grow(geo.x, geo.y, geo.x + geo.width, geo.y + geo.height);

			const toGroup = g.getCTM()?.inverse();
			for (const el of g.querySelectorAll('*')) {
				const b = el.getBBox();
				if (!b.width && !b.height)
					continue;

				const cs = getComputedStyle(el);
				// Every stroke in this sheet is a round- or butt-capped line or
				// curve, so half the width is the exact painted overhang. A mitred
				// join on a sharp corner could reach further, and none are stroked.
				const pad = cs.stroke && cs.stroke !== 'none'
					? (parseFloat(cs.strokeWidth) || 0) / 2
					: 0;

				const m = toGroup && el.getCTM() ? toGroup.multiply(el.getCTM()) : null;
				const corners = [
					[b.x - pad, b.y - pad], [b.x + b.width + pad, b.y - pad],
					[b.x - pad, b.y + b.height + pad],
					[b.x + b.width + pad, b.y + b.height + pad],
				];
				for (const [cx, cy] of corners) {
					const x = m ? m.a * cx + m.c * cy + m.e : cx;
					const y = m ? m.b * cx + m.d * cy + m.f : cy;
					grow(x, y, x, y);
				}
			}
		}
		catch {
			// A browser that will not measure gets the sprite as drawn.
			painted = null;
		}
		g.remove();

		if (!painted)
			continue;

		const box = {
			x: painted.x1, y: painted.y1,
			w: painted.x2 - painted.x1, h: painted.y2 - painted.y1,
		};
		if (!box.w || !box.h)
			continue;

		BOXES.set(sym.id, box);
		sym.setAttribute('viewBox', boxAttr(box));
	}

	probe.remove();
}

/** Inject the sprite sheet once, hidden, at the top of <body>. */
export function injectSprites () {
	if (document.getElementById('cl-sprites'))
		return;

	const holder = document.createElement('div');
	holder.id = 'cl-sprites';
	holder.setAttribute('aria-hidden', 'true');
	holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
	holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${SPRITES}</svg>`;
	document.body.prepend(holder);

	measureSprites(holder.querySelector('svg'));

	// A <use> already in the static HTML resolved against a symbol that did not
	// exist yet, and browsers do not retry on their own. Re-assign href so the
	// markup on the hub page picks up the sprites it references, and hand its
	// <svg> the cropped viewBox its symbol now uses.
	for (const use of document.querySelectorAll('use[href^="#sp-"], use[href^="#ic-"]')) {
		const href = use.getAttribute('href');
		use.removeAttribute('href');
		use.setAttribute('href', href);

		const box = BOXES.get(href.slice(1));
		const svg = use.closest('svg');
		if (box && svg)
			applyBox(svg, box);
	}
}

/**
 * Give an <svg> the viewBox of the sprite it shows, and publish the aspect
 * ratio so the stylesheet can derive height from width.
 */
function applyBox (svg, box) {
	svg.setAttribute('viewBox', originAttr(box));
	svg.style.setProperty('--ar', (box.w / box.h).toFixed(4));
}

/**
 * Build one sprite element.
 * @param {string} id symbol id, e.g. "sp-cat" or "ic-pause"
 * @param {string} [extraClass]
 */
export function sprite (id, extraClass = '') {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 100 100');
	// `s-cat`, `s-lamp`: which drawing this is, for the stylesheet.
	//
	// The parts of a sprite live inside a <symbol> reached through <use>, so no
	// document rule can select them. What does cross that boundary is an
	// inherited custom property, and the parts above read them — so a rule needs
	// only to know which kind of figure it is looking at to drive that figure's
	// own gesture. This class is how it knows.
	const kind = `s-${id.replace(/^(sp|ic)-/, '')}`;
	svg.setAttribute('class', `sprite ${kind} ${extraClass}`.trim());
	svg.setAttribute('aria-hidden', 'true');

	const box = BOXES.get(id);
	if (box)
		applyBox(svg, box);

	const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	use.setAttribute('href', `#${id}`);
	svg.append(use);

	return svg;
}
