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
 * Where the generated level art lives, relative to this module's page.
 *
 * The level table stores bare file names, so the directory is stated once, here.
 * `levels.js` deliberately knows nothing about paths — it is loadable outside a
 * browser, and a URL is the one thing in it that could not be checked there.
 */
const ART = '../../assets/levels/';

/**
 * A cover still, revealed only once it has actually loaded.
 *
 * The fallback matters more than the image. These files are Git LFS objects, so a
 * clone without LFS gets a few lines of pointer text where the PNG should be, and
 * the browser reports that as a broken image — silently, in the one place a child
 * would have seen the level's face. Hiding the <img> until `load` fires means the
 * sprites underneath simply stay visible, which is the same picture the map wore
 * before the art existed.
 *
 * @returns {HTMLImageElement}
 */
function coverImage (level, cls) {
	const img = document.createElement('img');
	img.className = cls;
	img.alt = '';
	img.decoding = 'async';
	img.hidden = true;
	img.addEventListener('load', () => {
		img.hidden = false;
		img.parentElement?.classList.add('has-cover');
	});
	// No error handler on purpose: `hidden` is already the failure state, so there
	// is nothing to undo. An onerror that removed the element would be the same
	// outcome reached less obviously.
	img.src = ART + level.cover;

	return img;
}

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
 * ends where it ends, and the path saying "there is more this way" is the
 * cheapest possible promise.
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
	// The generated cover, with the level's own pair of figures underneath it. The
	// brief for `level.cover` is written around those two figures, so the map does
	// not change character depending on which of the two is showing.
	const pairing = pairingById(level.pairing);
	art.append(sprite(level.sprite, 'node-figure'));
	if (pairing)
		art.append(sprite(pairing.target, 'node-token'));
	if (level.cover)
		art.append(coverImage(level, 'node-cover'));

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

/* ------------------------------------------------------------- the cover */

/**
 * The level's cover, shown before its first question.
 *
 * A beat between tapping a level and being asked something. The child gets to
 * look at where they are going, and the picture they have been seeing as a small
 * circle on the map opens up into the whole screen — which is what makes the
 * clear video afterwards read as the same place rather than a cut to somewhere
 * new.
 *
 * The whole sheet is the start button, not just the play badge. A three-year-old
 * aiming at a 3.6rem target on a phone misses it; the badge is there to say what
 * happens, and anywhere on the picture does it.
 *
 * @param {HTMLElement} host the overlay to fill
 * @param {object} level
 * @param {{onStart: Function, onBack: Function}} actions
 */
export function renderCover (host, level, actions) {
	host.textContent = '';
	const sheet = el('div', 'sheet cover-sheet', host);

	const start = document.createElement('button');
	start.type = 'button';
	start.className = 'cover-start';
	start.setAttribute('aria-label',
		`start level ${levels.levelIndex(level.id) + 1}, up to ${level.max}`);

	const art = el('div', 'cover-art', start);
	// Same fallback as the map node, for the same reason: without LFS the PNG is
	// pointer text. Here the stand-in is the pair of figures at cover size.
	const pairing = pairingById(level.pairing);
	art.append(sprite(level.sprite, 'cover-figure'));
	if (pairing)
		art.append(sprite(pairing.target, 'cover-token'));
	if (level.cover)
		art.append(coverImage(level, 'cover-still'));

	const badge = el('div', 'cover-play', start);
	badge.append(sprite('ic-play'));
	start.addEventListener('click', actions.onStart);
	sheet.append(start);

	const actionRow = el('div', 'cover-actions', sheet);
	const back = document.createElement('button');
	back.type = 'button';
	back.className = 'icon-btn';
	back.setAttribute('aria-label', 'back to the map');
	back.append(sprite('ic-close'));
	back.addEventListener('click', actions.onBack);
	actionRow.append(back);

	return sheet;
}

/* --------------------------------------------------------- celebrations */

/** Stars thrown outward: the fallback celebration, and the reduced-motion one. */
function starBurst (host) {
	const burst = el('div', 'clear-burst', host);
	const count = 9;
	for (let i = 0; i < count; ++i) {
		const star = sprite('sp-star', 'burst-star');
		star.style.setProperty('--angle', `${(360 / count) * i}deg`);
		star.style.animationDelay = `${i * 40}ms`;
		burst.append(star);
	}

	return burst;
}

/**
 * The clip already on its way, if any: `{id, video}` for one level at a time.
 *
 * One entry rather than one per level. A child is inside one level when the clip
 * is wanted, and these files run from three to seven megabytes — holding every
 * level's would spend tens of megabytes of a phone's memory to save a download the
 * child may never reach.
 */
let buffered = null;

/**
 * Start fetching a level's clear clip, so it is ready if the run earns it.
 *
 * Called when the cover opens, which is the earliest moment the level is known
 * and the longest possible head start: the whole run happens between here and
 * the clip being wanted. Without it the download begins at the celebration
 * itself, and a file of several megabytes over a slow link either stutters through
 * its six seconds or is still arriving when `CLIP_LIMIT_MS` gives up on it — the
 * child answers everything right and the reward is a star burst.
 *
 * The element is kept, not just the bytes. A detached <video> is a plausible
 * candidate for the browser to discard along with whatever it had buffered, and
 * the HTTP cache is not a promise either; holding the element that did the
 * fetching is what makes the buffer survive to `playClear`, which then plays
 * this very element rather than a fresh one pointed at the same URL.
 *
 * Never throws and never waits: an unreachable or undecodable clip has to fail
 * at the celebration, where there is already a star burst to fall back on.
 *
 * @param {object} [level] the level whose cover just opened
 */
export function prefetchClear (level) {
	// Reduced motion shows the cover still instead of the clip, so fetching
	// megabytes of video would be spending a data plan on something this
	// browser has been told not to play.
	if (REDUCED || !level?.clear)
		return;

	if (buffered?.id === level.id)
		return;

	// Whatever was held is for a level the child is no longer entering.
	releaseClear();

	const video = document.createElement('video');
	video.className = 'clear-video';
	video.muted = true;
	video.playsInline = true;
	video.setAttribute('playsinline', '');
	video.preload = 'auto';
	if (level.cover)
		video.poster = ART + level.cover;
	// Deliberately not autoplay: this element may be played later, and an
	// element that starts playing while detached would arrive at the
	// celebration already part-way through its own story.
	video.src = ART + level.clear;
	// An error here is not handled and must not be: the celebration path listens
	// for it and has the star burst. Swallowing it now would only mean the same
	// failure is discovered later.
	video.load();

	buffered = {id: level.id, video};
}

/**
 * Drop the buffered clip and let the browser reclaim what it held.
 *
 * Exported because leaving a level without earning the clip has to say so:
 * backing out of a cover, losing a run, finishing one that did not clear. Without
 * that, a few megabytes stay held for a level the child has walked away from and
 * the next level's prefetch is the only thing that would ever clear it. Safe to
 * call when nothing is held, which is the common case.
 */
export function releaseClear () {
	if (!buffered)
		return;

	const {video} = buffered;
	buffered = null;
	// Clearing the source is what actually frees the buffer; dropping the last
	// reference is not enough while a src is still set on it.
	video.removeAttribute('src');
	video.load();
}

/**
 * The buffered element for this level, handed over for playing, or null.
 *
 * Handing it over ends the buffering: whoever takes it owns it, and a second
 * caller would otherwise get an element already playing somewhere else.
 */
function takeBuffer (level) {
	if (!buffered || buffered.id !== level.id)
		return null;

	const {video} = buffered;
	buffered = null;

	return video;
}

/**
 * How long to wait for a clip that has stopped telling us anything.
 *
 * A video that neither plays nor errors is a real state — a codec the browser
 * lists but will not decode, a file still arriving over a slow link — and without
 * a ceiling the result screen would sit behind it forever. Comfortably longer
 * than the longest clip — six seconds from level six on — so a clip that is
 * merely slow to start still gets to finish. It stands well clear of the held
 * frame too, which begins only once the clip is genuinely over.
 */
const CLIP_LIMIT_MS = 9000;

/**
 * How long the last frame is held after the clip ends.
 *
 * The clip's final pose is the reward and it needs a beat to be looked at — a
 * video that cuts to a result sheet on its own last frame reads as the celebration
 * being taken away. Two seconds, and a tap inside them means the child is done
 * looking and goes straight back to the map.
 */
const CLEAR_HOLD_MS = 2000;

/**
 * The clear celebration: the level's own video, or stars if it cannot play.
 *
 * The video is what carries the story — a beat, a turn, a landing — and it only
 * plays on a run that got better, so it stays something a child is glad to see
 * again. Tapping skips it: the same clip on a replayed level is the one thing
 * here that could become a wait.
 *
 * Every path out resolves. That is load-bearing rather than tidy: `main.js` awaits
 * this before showing an unlock on the map, so a promise that never settled would
 * strand a child who had just opened a new level on the result screen.
 *
 * @param {HTMLElement} host the overlay to play over
 * @param {object} [level] the level just cleared; without it, stars
 * @returns {Promise<boolean>} true if the child tapped during the held last
 *   frame, meaning they want to be back on the map rather than on the result
 *   sheet. False on every path with no held frame to tap.
 */
export async function playClear (host, level) {
	// Reduced motion covers CSS animation, not a <video>, so the clip has to be
	// declined here by hand. The cover still is the celebration instead: same
	// scene, no motion. The star burst is skipped for the same reason it always
	// was, and `starBurst` is left unreachable on this path deliberately.
	if (REDUCED) {
		if (!level?.cover)
			return false;

		const hold = el('div', 'clear-still', host);
		hold.append(coverImage(level, 'clear-frame'));
		// One window rather than a show and then a hold: there is no motion here to
		// wait out, so the whole of it is the beat, and a tap ends it early the same
		// way it ends the held frame after a clip.
		const tapped = await holdForTap(hold, 1200 + CLEAR_HOLD_MS);
		hold.remove();

		return tapped;
	}

	if (!level?.clear) {
		const burst = starBurst(host);
		await wait(900);
		burst.remove();

		return false;
	}

	const stage = el('div', 'clear-stage', host);
	// The clip the cover started fetching, if it is this level's and still held.
	// Falling back to a fresh element rather than requiring the buffer keeps this
	// working when the level was reached without a cover, when reduced motion
	// declined the prefetch, and in the tests that call this directly.
	const video = takeBuffer(level) ?? document.createElement('video');
	video.className = 'clear-video';
	video.muted = true;
	video.autoplay = true;
	video.playsInline = true;
	video.setAttribute('playsinline', '');
	video.preload = 'auto';
	// The cover is the clip's first frame by construction — every brief in
	// `assets/levels/prompts.md` is written to start from it — so as a poster it is
	// the one image that cannot flash as a different picture.
	if (level.cover)
		video.poster = ART + level.cover;
	if (video.src !== new URL(ART + level.clear, location.href).href)
		video.src = ART + level.clear;
	// A buffered element may have been left part-way through by an earlier
	// celebration on this same level, and a clip that starts at its end shows
	// nothing at all.
	if (video.currentTime)
		video.currentTime = 0;
	stage.append(video);

	// `held` distinguishes the two ways the clip can be over. Only a clip that ran
	// to its own end has a final pose worth holding: a skipped one was skipped
	// because the child had seen enough, and a broken one has already been replaced
	// by the star burst and has nothing left on screen to hold.
	let held = false;
	await new Promise(resolve => {
		let done = false;
		const finish = end => {
			if (done)
				return;

			done = true;
			held = end === 'ended';
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(() => finish('ended'), CLIP_LIMIT_MS);
		// The star burst, and the only way out for a clip that cannot play.
		const giveUpOnClip = () => {
			if (done)
				return;

			video.remove();
			const burst = starBurst(stage);
			setTimeout(() => {
				burst.remove();
				finish('error');
			}, 900);
		};

		// A prefetched clip may have already failed, long before this screen
		// existed: an `error` event does not replay for a listener added later, so
		// a buffered element that is already broken has to be recognised by its
		// state rather than waited on. This is the ordinary case in a clone
		// without Git LFS, where every clip is a pointer file and the fetch that
		// began at the cover has failed by the time the run ends. Without this the
		// celebration would sit through `CLIP_LIMIT_MS` and then show nothing.
		if (video.error) {
			giveUpOnClip();

			return;
		}

		video.addEventListener('ended', () => finish('ended'));
		// An LFS pointer file, a missing asset and an undecodable clip all arrive
		// here. Stars instead, so the run that earned a celebration still gets one.
		video.addEventListener('error', giveUpOnClip);
		stage.addEventListener('click', () => finish('skip'));
		// `autoplay` is refused often enough to be worth asking twice; muted
		// playback is allowed everywhere, so a rejection here means something else
		// went wrong and the timeout will collect it.
		video.play?.().catch(() => {});
	});

	// The clip is paused rather than left to loop or blank: the element stays in
	// place for the hold, so what is on screen through it is the frame the clip
	// actually ended on.
	video.pause?.();
	const tapped = held ? await holdForTap(stage, CLEAR_HOLD_MS) : false;
	stage.remove();

	return tapped;
}

/**
 * Hold a screen for `ms`, or until it is tapped.
 *
 * @returns {Promise<boolean>} true if a tap ended it, false if the time did.
 */
function holdForTap (host, ms) {
	return new Promise(resolve => {
		let done = false;
		const end = tapped => {
			if (done)
				return;

			done = true;
			clearTimeout(timer);
			host.removeEventListener('click', onClick);
			resolve(tapped);
		};
		const onClick = () => end(true);
		const timer = setTimeout(() => end(false), ms);

		host.addEventListener('click', onClick);
	});
}

/* ------------------------------------------------------- keeping going */

/**
 * The encouragement screen, after a question the child never reached the end of.
 *
 * Shown for a miss — the clock ran out, or the tries did — and drawn rather than
 * written, because the child cannot read and the one thing this screen must not
 * be is ambiguous. It says: that one got away, the road still goes on, here comes
 * the next.
 *
 * Vector art, and all of it already in the sprite sheet. The figure is the
 * level's own character, so the screen belongs to the level the child is in; it
 * hops rather than droops, and the arrows run lower-left to upper-right, the same
 * direction as the map's path. Nothing here is sad and nothing is a reprimand:
 * the run continues either way, and this is the half-second that says so.
 *
 * @param {HTMLElement} host the overlay to fill
 * @param {object} level
 * @param {string} cause `'timeout'` or `'error'`, for the accessible name only
 */
export function renderMiss (host, level, cause) {
	host.textContent = '';
	const sheet = el('div', 'sheet miss-sheet', host);

	const scene = el('div', 'miss-scene', sheet);
	scene.append(sprite('sp-glow', 'miss-glow'));
	scene.append(sprite(level.sprite, 'miss-figure'));

	const trail = el('div', 'miss-trail', scene);
	for (let i = 0; i < 3; ++i) {
		const arrow = sprite('ic-arrow', 'miss-arrow');
		arrow.style.animationDelay = `${i * 120}ms`;
		trail.append(arrow);
	}

	// The overlay is wordless, so this is the only place the two causes can be
	// told apart at all — and a screen reader is the one audience that can read it.
	sheet.setAttribute('aria-label', cause === 'timeout'
		? 'out of time, keep going'
		: 'that one was tricky, keep going');
	sheet.setAttribute('role', 'status');

	return sheet;
}

/**
 * Show it, and resolve when it is done.
 *
 * Tappable, like the clear clip: a child who is ready to carry on should not be
 * made to watch a screen about carrying on.
 */
export async function playMiss (host, level, cause) {
	renderMiss(host, level, cause);
	host.hidden = false;

	// No timer. This screen leaves the level, and a screen that leaves on its own
	// takes the decision away from the child at the one moment they most need to
	// have been told what happened: a run ends here. So it waits, and the tap is
	// how they say they have seen it.
	//
	// That is also why `.miss-figure` and the trail loop rather than settle — a
	// still frame with no motion on it reads as finished rather than as waiting,
	// and there is no text here to say otherwise.
	await new Promise(resolve => {
		const finish = () => {
			// Removed rather than left to be garbage: the overlay element outlives
			// every screen shown in it, so a listener added and forgotten here would
			// still be attached on the next miss, and the one after that.
			host.removeEventListener('click', finish);
			resolve();
		};
		host.addEventListener('click', finish);
	});

	host.hidden = true;
	host.textContent = '';
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
