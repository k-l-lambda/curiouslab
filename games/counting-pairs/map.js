/**
 * map.js — the level map and the end-of-run result screen.
 *
 * Symmetric with board.js: that renders one question, this renders everything
 * around them. The map is a winding path with a level sitting on it at each
 * stop, and stops past the child's progress are locked.
 *
 * Nothing here decides anything. Which levels are open, how many stars a level
 * is worth and what a run earned are all answered by `levels.js`; this module is
 * handed those answers and draws them.
 */

import {sprite} from '../../assets/js/art.js';
import {pairingById} from '../../assets/js/pairings.js';
import * as levels from '../../assets/js/levels.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * The path, in its own coordinates.
 *
 * One curve is the single source of truth for where the stops are: the nodes are
 * placed by measuring it, not by guessing percentages that happen to look close.
 * That is the same bargain `art.js` makes when it measures a sprite's ink rather
 * than trusting its viewBox, and it fails the same way if broken — silently, and
 * only on some screens.
 *
 * Two shapes, because a path that reads as a gentle stroll down a phone is a
 * cramped zigzag across a laptop.
 */
const PATHS = {
	portrait: {
		w: 100,
		h: 190,
		d: 'M 22 176 C 74 162, 82 140, 40 124 C 4 108, 12 86, 60 74'
			+ ' C 96 62, 92 40, 46 26 C 26 20, 20 14, 24 8',
	},
	landscape: {
		w: 200,
		h: 100,
		d: 'M 14 78 C 44 92, 58 40, 88 52 C 116 64, 122 16, 152 26'
			+ ' C 174 32, 182 52, 190 44',
	},
};

/**
 * Where along the path each stop sits, as a fraction of its length.
 *
 * Spread with a margin at each end so the first and last node are not half off
 * the edge, and so the path visibly continues past the last one — the ladder
 * stops at three levels for now, and the path saying "there is more this way" is
 * the cheapest possible promise.
 */
function stopsFor (count) {
	if (count === 1)
		return [0.5];

	const first = 0.06;
	const last = 0.82;

	return Array.from({length: count}, (_, i) => first + (last - first) * (i / (count - 1)));
}

const el = (tag, cls, parent) => {
	const node = document.createElement(tag);
	if (cls)
		node.className = cls;
	if (parent)
		parent.append(node);

	return node;
};

/* ------------------------------------------------------------------ ribbon */

function buildRibbon (shape) {
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('class', 'map-ribbon');
	svg.setAttribute('viewBox', `0 0 ${shape.w} ${shape.h}`);
	// The ribbon is decoration stretched to whatever box the map gets; the nodes
	// carry the meaning, and they are positioned in percentages of this same
	// viewBox, so they stay on the curve however it is stretched.
	svg.setAttribute('preserveAspectRatio', 'none');
	svg.setAttribute('aria-hidden', 'true');

	const under = document.createElementNS(SVG_NS, 'path');
	under.setAttribute('class', 'trail-under');
	under.setAttribute('d', shape.d);
	// Without this the stroke stretches with the box and the road gets fatter on
	// a wide screen than a tall one.
	under.setAttribute('vector-effect', 'non-scaling-stroke');

	const trail = document.createElementNS(SVG_NS, 'path');
	trail.setAttribute('class', 'trail');
	trail.setAttribute('d', shape.d);
	trail.setAttribute('vector-effect', 'non-scaling-stroke');

	svg.append(under, trail);

	return {svg, trail};
}

/* ------------------------------------------------------------------- nodes */

function starRow (stars, count = 3) {
	const row = el('div', 'node-stars');
	for (let i = 0; i < count; ++i) {
		const star = sprite('sp-star', i < stars ? 'lit' : '');
		row.append(star);
	}
	row.setAttribute('aria-hidden', 'true');

	return row;
}

function lockBadge () {
	const lock = el('div', 'node-lock');
	lock.append(sprite('ic-lock'));

	return lock;
}

function buildNode (level, view) {
	const open = view.unlocked.has(level.id);
	const stars = view.stars.get(level.id) ?? 0;

	// A real button, so the tap target floor, focus ring and disabled semantics
	// all come from the same place every other control in the game gets them.
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `level-node${open ? '' : ' locked'}${view.cleared.has(level.id) ? ' cleared' : ''}`;
	btn.dataset.level = level.id;
	btn.disabled = !open;
	// The map is wordless, so the accessible name is the one place the level's
	// range can be said outright.
	btn.setAttribute('aria-label',
		`level ${levels.levelIndex(level.id) + 1}, up to ${level.max}`
		+ (open ? `, ${stars} of 3 stars` : ', locked'));

	const art = el('div', 'node-art', btn);
	// Until the generated cover art exists, the level wears its own pair of
	// figures — the same two the brief for `level.cover` is written around, so
	// the map does not change character when the art lands.
	const pairing = pairingById(level.pairing);
	art.append(sprite(level.sprite, 'node-figure'));
	if (pairing)
		art.append(sprite(pairing.target, 'node-token'));

	btn.append(starRow(stars));

	if (!open)
		btn.append(lockBadge());

	if (open)
		btn.addEventListener('click', () => view.onPick(level.id));

	return btn;
}

function bandMarker (band) {
	const mark = el('div', 'band-marker');
	mark.dataset.band = band.id;
	const sign = el('span', 'band-sign', mark);
	sign.textContent = band.sign;
	// An emoji's own screen-reader name is not the thing it means here, so the
	// range is stated for anyone who cannot see the hand.
	mark.setAttribute('aria-label', `numbers up to ${band.max}`);

	return mark;
}

/* ------------------------------------------------------------------ render */

/**
 * Draw the map.
 *
 * @param {HTMLElement} host
 * @param {object} view
 *   `unlocked`  Set of open level ids
 *   `stars`     Map of level id -> 0..3
 *   `cleared`   Set of level ids already cleared
 *   `unlockAll` true when the debug override is on, so it can be shown
 *   `onPick`    called with a level id
 */
export function render (host, view) {
	host.textContent = '';

	const map = el('div', 'level-map', host);

	// Shape chosen from the box the map actually got, not from a media query about
	// the window. The map fills its host, so the curve is stretched to that box
	// either way — measuring it means the stretch lands on the path drawn closer to
	// that shape, instead of a tablet getting the tall path squashed sideways.
	const box = host.getBoundingClientRect();
	const shape = box.height >= box.width ? PATHS.portrait : PATHS.landscape;

	const {svg, trail} = buildRibbon(shape);
	map.append(svg);

	// Measure once, here, and store the result as percentages of the viewBox.
	// After this the browser does all the work on a resize: a percentage of a
	// stretched box is still the same point of the curve, so a node cannot drift
	// off the path and there is nothing to recompute.
	const total = trail.getTotalLength();
	const stops = stopsFor(levels.LEVELS.length);
	const seen = new Set();

	levels.LEVELS.forEach((level, i) => {
		const point = trail.getPointAtLength(total * stops[i]);
		const left = `${(point.x / shape.w) * 100}%`;
		const top = `${(point.y / shape.h) * 100}%`;

		const node = buildNode(level, view);
		node.style.left = left;
		node.style.top = top;
		map.append(node);

		// The band marker sits with the first level of its band: the sign labels
		// a stretch of the path, and this is where that stretch starts.
		if (!seen.has(level.band)) {
			seen.add(level.band);
			const band = levels.bandById(level.band);
			if (band) {
				const mark = bandMarker(band);
				mark.style.left = left;
				mark.style.top = top;
				map.append(mark);
			}
		}
	});

	if (view.unlockAll) {
		// Say so on screen. A debug session that looks identical to real progress
		// is how a wrong conclusion gets drawn from it later.
		const flag = el('div', 'debug-flag', map);
		flag.textContent = 'unlock';
	}

	return map;
}

/**
 * How far each node's centre sits from the curve it should be on, in pixels.
 *
 * This exists because the failure it catches is invisible: if the viewBox and
 * the container's aspect ratio disagree, every node drifts off the path by an
 * amount that depends on the screen, and it still looks broadly right. Reported
 * rather than asserted, so a harness can decide what to do with it.
 *
 * @returns {{levelId: string, off: number}[]}
 */
export function placementError (host) {
	const map = host.querySelector('.level-map');
	const trail = map?.querySelector('.trail');
	if (!map || !trail)
		return [];

	const total = trail.getTotalLength();
	const ctm = trail.getScreenCTM();
	const stops = stopsFor(levels.LEVELS.length);

	return [...map.querySelectorAll('.level-node')].map((node, i) => {
		const box = node.getBoundingClientRect();
		const centre = {x: box.left + box.width / 2, y: box.top + box.height / 2};
		const p = trail.getPointAtLength(total * stops[i]);
		// The path's own coordinates mean nothing on screen until they go through
		// the same transform the browser painted it with.
		const onScreen = new DOMPoint(p.x, p.y).matrixTransform(ctm);

		return {
			levelId: node.dataset.level,
			off: Math.hypot(centre.x - onScreen.x, centre.y - onScreen.y),
		};
	});
}

/* ------------------------------------------------------------- the result */

/**
 * One improvement, written the way the rest of the game writes things: numerals
 * and arithmetic symbols, no words.
 *
 * A faster time is shown as the old time and the new one; a new rung is shown as
 * a star appearing. Both are the same claim — this got better — said in whichever
 * way the child can actually see.
 */
function improvementRow (entry) {
	const row = el('div', 'improve-row');
	const label = el('div', 'improve-item numerals', row);
	// The item id is the question, so it can be shown directly — with the same
	// U+2212 minus the board uses, since the hyphen in the id is only there
	// because an id has to be typeable.
	const [mode, expr] = entry.itemId.split(':');
	label.textContent = mode === 'count'
		? expr
		: expr.replace('+', ' + ').replace('-', ' \u2212 ');

	if (entry.bestMsAfter && entry.bestMsBefore && entry.bestMsAfter < entry.bestMsBefore) {
		const from = el('span', 'was', row);
		from.textContent = (entry.bestMsBefore / 1000).toFixed(1);
		row.append(sprite('ic-arrow', 'improve-arrow'));
		const to = el('span', 'now', row);
		to.textContent = (entry.bestMsAfter / 1000).toFixed(1);
	}
	else {
		const gained = el('div', 'improve-grade', row);
		gained.append(sprite('sp-star', 'lit'));
	}

	return row;
}

/**
 * The end of a run.
 *
 * @param {HTMLElement} host the overlay to fill
 * @param {object} result from `levels.finishRun`
 * @param {{onReplay: Function, onMap: Function}} actions
 */
export function renderResult (host, result, actions) {
	host.textContent = '';
	const sheet = el('div', 'sheet result-sheet', host);

	const row = el('div', 'result-stars', sheet);
	for (let i = 0; i < 3; ++i) {
		const earned = i < result.stars;
		// A star won just now arrives with a pop; one already held is simply
		// there. The difference is the whole point of showing them again.
		const isNew = earned && i >= result.stars - result.starsGained;
		const star = sprite('sp-star', `${earned ? 'lit' : ''}${isNew ? ' gained' : ''}`.trim());
		if (isNew)
			star.style.animationDelay = `${(i - (result.stars - result.starsGained)) * 220}ms`;
		row.append(star);
	}
	row.setAttribute('aria-label', `${result.stars} of 3 stars`);

	// How much of the level has ever been answered correctly. This is the thing
	// the next level is waiting on, so it is worth showing even though it is not
	// a score.
	const cover = el('div', 'result-coverage', sheet);
	for (let i = 0; i < result.total; ++i)
		el('span', `cov-pip${i < result.covered ? ' done' : ''}`, cover);
	cover.setAttribute('aria-label', `${result.covered} of ${result.total} answered correctly`);

	if (result.improvements.length) {
		const list = el('div', 'improve-list', sheet);
		// A run can improve the same question twice; only the best is worth
		// showing, and a long list would bury it.
		const best = new Map();
		for (const entry of result.improvements)
			best.set(`${entry.itemId}#${entry.form}`, entry);
		[...best.values()].slice(0, 4).forEach(entry => list.append(improvementRow(entry)));
	}

	const actionRow = el('div', 'result-actions', sheet);
	const replay = document.createElement('button');
	replay.type = 'button';
	replay.className = 'icon-btn';
	replay.setAttribute('aria-label', 'play again');
	replay.append(sprite('ic-play'));
	replay.addEventListener('click', actions.onReplay);

	const back = document.createElement('button');
	back.type = 'button';
	back.className = 'icon-btn';
	back.setAttribute('aria-label', 'back to the map');
	back.append(sprite('ic-close'));
	back.addEventListener('click', actions.onMap);

	actionRow.append(replay, back);

	return sheet;
}

/* --------------------------------------------------------- celebrations */

/**
 * The clear animation: a burst of stars over the result sheet.
 *
 * Held deliberately short. It marks getting better, and it plays on every run
 * that does — so it has to be the kind of thing a child is glad to see again
 * rather than something they start waiting out.
 */
export async function playClear (host) {
	if (REDUCED)
		return;

	const burst = el('div', 'clear-burst', host);
	const count = 9;
	for (let i = 0; i < count; ++i) {
		const star = sprite('sp-star', 'burst-star');
		star.style.setProperty('--angle', `${(360 / count) * i}deg`);
		star.style.animationDelay = `${i * 40}ms`;
		burst.append(star);
	}

	await wait(900);
	burst.remove();
}

/**
 * The lock coming off a level that has just opened.
 *
 * Played on the map rather than in the result sheet: the point is to show the
 * child where to go next, and that only means anything in the place they are
 * going.
 *
 * The lock is put back for the length of the animation. By the time the map is
 * drawn the level is genuinely open — `unlockedLevels` reads the records, and the
 * records already say so — so there is no lock left on the node to break. Adding
 * it here keeps that honest: the node is open and tappable throughout, and what
 * plays over it is a picture of what just happened, not a state it is still in.
 */
export async function playUnlock (host, levelId) {
	const node = host.querySelector(`.level-node[data-level="${levelId}"]`);
	if (!node || node.disabled)
		return;

	const lock = lockBadge();
	node.append(lock);
	// A frame between insertion and the class, so the animation has a start state
	// to run from rather than being composited from nothing.
	await new Promise(resolve => requestAnimationFrame(resolve));
	node.classList.add('unlocking');

	await wait(REDUCED ? 20 : 1100);
	node.classList.remove('unlocking');
	lock.remove();
}
