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
  <path d="M68 80 q22 2 20 -18" fill="none" stroke="#e79a44" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="46" cy="72" rx="24" ry="22" fill="#f7b264"/>
  <path d="M28 32 L24 9 L43 22 Z" fill="#f7b264"/>
  <path d="M64 32 L68 9 L49 22 Z" fill="#f7b264"/>
  <path d="M30 29 L28 16 L39 23 Z" fill="#f8d6ae"/>
  <path d="M62 29 L64 16 L53 23 Z" fill="#f8d6ae"/>
  <circle cx="46" cy="36" r="21" fill="#ffc478"/>
  <circle cx="38" cy="34" r="3.6" fill="#33291f"/>
  <circle cx="54" cy="34" r="3.6" fill="#33291f"/>
  <path d="M46 41 l-4.5 4.5 h9 Z" fill="#e8825f"/>
  <path d="M41 48 q5 5 10 0" fill="none" stroke="#33291f" stroke-width="2.4" stroke-linecap="round"/>
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
  <path d="M70 78 q20 -1 16 -20" fill="none" stroke="#a9723f" stroke-width="6" stroke-linecap="round"/>
  <circle cx="23" cy="40" r="9.5" fill="#a9723f"/>
  <circle cx="73" cy="40" r="9.5" fill="#a9723f"/>
  <ellipse cx="48" cy="74" rx="21" ry="20" fill="#c98a58"/>
  <ellipse cx="48" cy="76" rx="13" ry="13" fill="#efd0a9"/>
  <circle cx="48" cy="40" r="23" fill="#c98a58"/>
  <ellipse cx="48" cy="48" rx="17" ry="14" fill="#efd0a9"/>
  <circle cx="40" cy="35" r="3.6" fill="#33291f"/>
  <circle cx="56" cy="35" r="3.6" fill="#33291f"/>
  <circle cx="44" cy="45" r="1.9" fill="#8a5c33"/>
  <circle cx="52" cy="45" r="1.9" fill="#8a5c33"/>
  <path d="M41 52 q7 6 14 0" fill="none" stroke="#8a5c33" stroke-width="2.4" stroke-linecap="round"/>
</symbol>

<symbol id="sp-banana" viewBox="0 0 100 100">
  <path d="M27 18 q-9 42 25 58 q17 8 24 -4 q5 -9 -7 -12 q-27 -7 -31 -42 q-1 -9 -6 -7 q-5 1 -5 7 Z" fill="#f7d84a"/>
  <path d="M33 24 q-4 34 22 48" fill="none" stroke="#e0b92c" stroke-width="3" stroke-linecap="round"/>
  <path d="M25 15 q6 -4 9 2" fill="none" stroke="#7c6420" stroke-width="5" stroke-linecap="round"/>
  <path d="M74 76 q6 -1 6 4" fill="none" stroke="#7c6420" stroke-width="4" stroke-linecap="round"/>
</symbol>

<symbol id="sp-dog" viewBox="0 0 100 100">
  <path d="M70 78 q18 -6 12 -22" fill="none" stroke="#a2724f" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="48" cy="74" rx="23" ry="20" fill="#c08f6a"/>
  <ellipse cx="22" cy="44" rx="9" ry="17" fill="#a2724f"/>
  <ellipse cx="74" cy="44" rx="9" ry="17" fill="#a2724f"/>
  <circle cx="48" cy="40" r="22" fill="#d6a479"/>
  <ellipse cx="48" cy="52" rx="15" ry="11.5" fill="#f4e0c8"/>
  <ellipse cx="48" cy="47" rx="5.5" ry="4.4" fill="#3a2f28"/>
  <circle cx="39" cy="33" r="3.6" fill="#33291f"/>
  <circle cx="57" cy="33" r="3.6" fill="#33291f"/>
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
  <ellipse cx="36" cy="26" rx="8" ry="20" fill="#e6e1d8" transform="rotate(-12 36 26)"/>
  <ellipse cx="60" cy="26" rx="8" ry="20" fill="#e6e1d8" transform="rotate(12 60 26)"/>
  <ellipse cx="36" cy="27" rx="4" ry="14" fill="#f2b8c0" transform="rotate(-12 36 27)"/>
  <ellipse cx="60" cy="27" rx="4" ry="14" fill="#f2b8c0" transform="rotate(12 60 27)"/>
  <ellipse cx="48" cy="74" rx="22" ry="20" fill="#f3f0ea"/>
  <circle cx="48" cy="52" r="21" fill="#fbf9f4"/>
  <circle cx="40" cy="49" r="3.6" fill="#33291f"/>
  <circle cx="56" cy="49" r="3.6" fill="#33291f"/>
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
  <path d="M74 56 L96 44 q-4 14 -8 20 Z" fill="#4a8fc9"/>
  <ellipse cx="46" cy="58" rx="27" ry="22" fill="#5ba8e0"/>
  <path d="M40 52 q20 -6 26 14 q-18 8 -26 -14 Z" fill="#4a8fc9"/>
  <circle cx="34" cy="36" r="17" fill="#7cc0ef"/>
  <path d="M18 36 L4 41 L18 46 Z" fill="#f5a24a"/>
  <circle cx="30" cy="33" r="3.8" fill="#28323c"/>
  <circle cx="31.4" cy="32" r="1.3" fill="#fff"/>
  <g stroke="#f5a24a" stroke-width="3.4" stroke-linecap="round">
    <path d="M40 79 L38 90"/><path d="M54 79 L56 90"/>
  </g>
</symbol>

<symbol id="sp-seed" viewBox="0 0 100 100">
  <path d="M50 18 q23 24 23 42 a23 23 0 0 1 -46 0 q0 -18 23 -42 Z" fill="#d9a94f"/>
  <path d="M50 30 q13 18 13 31 a13 13 0 0 1 -13 13" fill="none" stroke="#f0cf90" stroke-width="4" stroke-linecap="round"/>
</symbol>

<symbol id="sp-lamp" viewBox="0 0 100 100">
  <rect x="46" y="44" width="8" height="36" rx="3" fill="#8a6a5a"/>
  <ellipse cx="50" cy="84" rx="22" ry="8" fill="#7a5b4c"/>
  <circle cx="50" cy="50" r="10" fill="#ffe9a8"/>
  <path d="M22 44 L78 44 L64 14 L36 14 Z" fill="#e0574f"/>
  <path d="M22 44 L78 44 L74 50 L26 50 Z" fill="#c8443d"/>
</symbol>

<symbol id="sp-star" viewBox="0 0 100 100">
  <polygon points="50,8 60,36.2 89.9,37 66.2,55.3 74.7,84 50,67 25.3,84 33.8,55.3 10.1,37 40,36.2" fill="#ffd44d"/>
  <polygon points="50,22 57,40 74,41 60,52 65,70 50,59 35,70 40,52 26,41 43,40" fill="#ffe796"/>
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
`;

/**
 * Each object sprite's own box, in the coordinates it was drawn in.
 * Filled once by measureSprites(); empty for icons, which are left square.
 * @type {Map<string, {x: number, y: number, w: number, h: number}>}
 */
const BOXES = new Map();

/** The box a sprite actually occupies, or undefined for an unmeasured one. */
export const spriteBox = id => BOXES.get(id);

/** viewBox attribute value for a measured box. */
const boxAttr = b => `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.w.toFixed(2)} ${b.h.toFixed(2)}`;

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
	probe.setAttribute('viewBox', '0 0 100 100');
	probe.setAttribute('width', '100');
	probe.setAttribute('height', '100');
	probe.style.cssText = 'position:absolute;left:-9999px;top:0';
	document.body.append(probe);

	for (const sym of sheet.querySelectorAll('symbol[id^="sp-"]')) {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		for (const child of sym.children)
			g.append(child.cloneNode(true));
		probe.append(g);

		let box = null;
		try {
			box = g.getBBox();
		}
		catch {
			// A browser that will not measure gets the sprite as drawn.
		}

		// getBBox describes geometry, but a stroked path paints half its width
		// outside that. Pad by the widest stroke so nothing lands outside the
		// cropped viewBox and gets clipped.
		let pad = 0;
		for (const el of g.querySelectorAll('*')) {
			const cs = getComputedStyle(el);
			if (cs.stroke && cs.stroke !== 'none')
				pad = Math.max(pad, parseFloat(cs.strokeWidth) / 2 || 0);
		}
		g.remove();

		if (!box || !box.width || !box.height)
			continue;

		const cropped = {
			x: box.x - pad,
			y: box.y - pad,
			w: box.width + pad * 2,
			h: box.height + pad * 2,
		};
		BOXES.set(sym.id, cropped);
		sym.setAttribute('viewBox', boxAttr(cropped));
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
	svg.setAttribute('viewBox', boxAttr(box));
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
	svg.setAttribute('class', `sprite ${extraClass}`.trim());
	svg.setAttribute('aria-hidden', 'true');

	const box = BOXES.get(id);
	if (box)
		applyBox(svg, box);

	const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	use.setAttribute('href', `#${id}`);
	svg.append(use);

	return svg;
}
