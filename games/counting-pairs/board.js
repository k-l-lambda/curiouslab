/**
 * board.js — renders one question and owns the four animation families
 * (entrance, selection, success, retry).
 *
 * Nothing in here writes a word into the play surface. The task is carried by
 * arrangement, object count, numerals, arithmetic symbols and motion.
 */

import {sprite, spriteBox} from '../../assets/js/art.js';
import {pairingById} from '../../assets/js/pairings.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A first-guess column count, good enough to lay out before measuring.
 * fitPanel() and fitMinis() replace it with whatever the real box can afford.
 */
function columnsFor (n) {
	if (n <= 3)
		return n;
	if (n <= 6)
		return 3;
	if (n <= 8)
		return 4;

	return 5;
}

/**
 * Lay a grid out in `n` equal tracks and publish the count to CSS.
 * @param {HTMLElement} el
 * @param {number} n
 * @param {string} track
 */
function setColumns (el, n, track) {
	el.style.gridTemplateColumns = `repeat(${n}, ${track})`;
	el.style.setProperty('--cols', String(n));
}

/* An object smaller than this stops being countable, so overflow is preferred. */
const MIN_OBJ_PX = 22;

/* Two measurements are enough to place a straight line, and panel width and
   height are very nearly affine in object size. These are the two probes. */
const PROBE_A = 40;
const PROBE_B = 80;

/**
 * Arrangements worth considering for `n` objects, widest row first.
 *
 * A group is not obliged to keep the arrangement columnsFor() suggested. A tall
 * narrow panel — a phone held upright — can show ten objects far larger as 3x4
 * than as 5x2, because five columns waste height it has and claim width it
 * doesn't. So offer every plausible arrangement and let the caller measure
 * which one actually buys the most size.
 */
function columnCandidates (n) {
	if (n <= 2)
		return [n];

	const out = [];
	for (let c = Math.min(5, n); c >= 2; --c)
		out.push(c);

	return out;
}

/** Every way to pick one entry from each list. */
function combinations (lists) {
	return lists.reduce(
		(acc, list) => acc.flatMap(prefix => list.map(v => [...prefix, v])),
		[[]],
	);
}

/**
 * What an arrangement is worth. Size, mostly — but a last row holding a single
 * object reads as a stray rather than as part of the group, so a layout that
 * leaves one behind has to be noticeably bigger to be worth it.
 */
function arrangementScore (size, n, cols) {
	return n > cols && n % cols === 1 ? size * .9 : size;
}

/**
 * The largest an object is allowed to get, whatever the space allows.
 *
 * `--obj-size` is a min() of that ideal and what one column can afford, so
 * handing the panel an unreachable column width leaves the ideal behind.
 */
function idealObjectSize (panel, grid) {
	const obj = grid.querySelector('.obj');
	panel.style.setProperty('--group-w', '9999px');
	const px = parseFloat(getComputedStyle(obj).width);
	panel.style.removeProperty('--group-w');

	// The stylesheet's ceiling is a width, but the sprites are not square: a lamp
	// is 1.4 times as tall as it is wide, so capping its width alone would let it
	// grow half again as large as a fish allowed the same ceiling. Cap the larger
	// side instead, so "this big and no bigger" means the same for every sprite.
	const ar = parseFloat(obj.style.getPropertyValue('--ar')) || 1;

	return px * Math.min(1, ar);
}

/**
 * Choose how each group is arranged and how big its objects are, so the groups
 * fill the panel they landed in.
 *
 * The stylesheet can only guess: it knows the column count but not the panel's
 * real shape, the operator sign's width, the number labels' height or where a
 * plate hits its own clamp. So measure instead. For each candidate arrangement,
 * lay the panel out at two probe sizes and read the box; width and height are
 * affine in object size, so two readings give the size that exactly fills the
 * tighter axis. The plate clamp puts a small kink in that line, so the chosen
 * size is then relaxed against real measurements until it settles.
 * @param {HTMLElement} panel
 */
function fitPanel (panel) {
	// Addition has two groups, and they have to share one object size or the two
	// addends stop looking like the same kind of thing.
	const grids = [...panel.querySelectorAll('.objects, .pair-grid')];
	if (!grids.length)
		return;

	// The panel centres its content, so the budget is its content box.
	const style = getComputedStyle(panel);
	const availH = panel.clientHeight
		- parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
	const availW = panel.clientWidth
		- parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	if (availH <= 0 || availW <= 0)
		return;

	const content = panel.firstElementChild;
	const ideal = idealObjectSize(panel, grids[0]);
	const counts = grids.map(grid => grid.childElementCount);

	const apply = (cols, size) => {
		grids.forEach((grid, i) => {
			setColumns(grid, cols[i], 'auto');
			grid.style.setProperty('--obj-size', `${size}px`);
		});

		return content.getBoundingClientRect();
	};

	/** The size at which this arrangement just fills the tighter axis. */
	const sizeFor = cols => {
		const a = apply(cols, PROBE_A);
		const b = apply(cols, PROBE_B);
		const solve = (avail, va, vb) => {
			const slope = (vb - va) / (PROBE_B - PROBE_A);

			return slope > 0 ? PROBE_A + (avail - va) / slope : Infinity;
		};

		return Math.min(ideal, solve(availW, a.width, b.width), solve(availH, a.height, b.height));
	};

	let best = null;
	for (const cols of combinations(counts.map(columnCandidates))) {
		const size = sizeFor(cols);
		const score = cols.reduce(
			(worst, c, i) => Math.min(worst, arrangementScore(size, counts[i], c)),
			Infinity,
		);
		// Candidates arrive widest-row first, so a taller arrangement has to be
		// clearly better before it displaces the more conventional one.
		if (!best || score > best.score * 1.03)
			best = {cols, size, score};
	}

	let size = Math.min(ideal, Math.max(MIN_OBJ_PX, best.size));
	for (let pass = 0; pass < 5; ++pass) {
		const box = apply(best.cols, size);
		const ratio = Math.min(availH / box.height, availW / box.width);
		// Fits, with under 2% of a gap left over: settled.
		if (ratio >= 1 && ratio < 1.02)
			return;

		const next = Math.min(ideal, Math.max(MIN_OBJ_PX, size * Math.min(ratio, 1.5)));
		if (Math.abs(next - size) < 0.5)
			return;
		size = next;
	}
	apply(best.cols, size);
}

/**
 * Size the answer-card previews.
 *
 * All the cards get the same preview size, so the only thing that varies
 * between them is how many objects there are — which is the whole point of the
 * preview. The size is whatever the most crowded card can afford, and it stays
 * under the numeral's own size so the number keeps leading.
 * @param {HTMLElement} panel
 */
function fitMinis (panel) {
	const minis = [...panel.querySelectorAll('.mini')];
	if (!minis.length)
		return;

	const picks = minis.map(mini => {
		const card = mini.parentElement;
		const cs = getComputedStyle(card);
		const gap = parseFloat(cs.rowGap) || 0;
		const inner = parseFloat(getComputedStyle(mini).rowGap) || 0;
		const num = card.querySelector('.num').getBoundingClientRect().height;
		const availW = card.clientWidth
			- parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		const availH = card.clientHeight
			- parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - num - gap;
		const n = mini.childElementCount;
		// The preview is as wide as --mini-size and as tall as the sprite's own
		// shape makes it, so every budget below is expressed as a width.
		const ar = parseFloat(mini.querySelector('svg').style.getPropertyValue('--ar')) || 1;
		// The numeral has to stay the loudest thing on the card, so cap the
		// preview at equal visual area rather than equal width — otherwise a
		// wide sprite reads as bigger than a tall one at the same number.
		const cap = num * Math.sqrt(ar);

		let best = {size: 0, cols: n};
		for (const cols of columnCandidates(n)) {
			const rows = Math.ceil(n / cols);
			const size = Math.min(
				(availW - (cols - 1) * inner) / cols,
				(availH - (rows - 1) * inner) / rows * ar,
				cap,
			);
			// Widest row first again, so a taller grid needs a real advantage.
			if (size > best.size * 1.03)
				best = {size, cols};
		}

		return {mini, ...best};
	});

	const size = Math.max(4, Math.min(...picks.map(p => p.size)));
	for (const pick of picks)
		setColumns(pick.mini, pick.cols, 'minmax(0, 1fr)');
	panel.querySelector('.choices').style.setProperty('--mini-size', `${size}px`);
}

/**
 * Build a group of object sprites.
 * @param {string} spriteId
 * @param {number} count
 * @param {'sparse'|'compact'} density
 */
function objectGroup (spriteId, count, density) {
	const grid = document.createElement('div');
	grid.className = `objects ${density}`;
	// --cols lets the stylesheet work out how big a sprite can be: the tracks
	// are `auto`, so width multiplies by the column count.
	setColumns(grid, columnsFor(count), 'auto');

	for (let i = 0; i < count; ++i) {
		const el = sprite(spriteId, 'obj');
		// Compact groups sit closer and less regularly, so counting takes real
		// attention — but never so far that objects overlap or the count blurs.
		if (density === 'compact') {
			const dx = (Math.random() - .5) * 10;
			const dy = (Math.random() - .5) * 10;
			const rot = (Math.random() - .5) * 9;
			el.style.transform = `translate(${dx}%, ${dy}%) rotate(${rot}deg)`;
		}
		grid.append(el);
	}

	return grid;
}

/**
 * The subtraction layout: one column per source object, each with a plate
 * below it. The first `filled` plates already hold a target object; the rest
 * are visibly empty, and counting those gaps is the task.
 *
 * This keeps the same grammar as the other modes — the source group is always
 * the actor on the left — and turns "how many more are needed?" into something
 * the child can see rather than read.
 */
function pairGrid (pairing, total, filled, density) {
	const wrap = document.createElement('div');
	wrap.className = 'group';

	const label = document.createElement('div');
	label.className = 'count-label';
	label.textContent = String(total);
	wrap.append(label);

	const grid = document.createElement('div');
	grid.className = `pair-grid ${density}`;
	setColumns(grid, columnsFor(total), 'auto');

	for (let i = 0; i < total; ++i) {
		const col = document.createElement('div');
		col.className = 'pair-col';
		col.append(sprite(pairing.source, 'obj'));

		const slot = document.createElement('div');
		const isFilled = i < filled;
		slot.className = `slot ${isFilled ? 'filled' : 'empty'}`;
		if (isFilled)
			slot.append(sprite(pairing.target, 'obj slot-obj'));

		col.append(slot);
		grid.append(col);
	}

	wrap.append(grid);

	return wrap;
}

function labelledGroup (spriteId, count, density, showLabel) {
	const wrap = document.createElement('div');
	wrap.className = 'group';

	if (showLabel) {
		const label = document.createElement('div');
		label.className = 'count-label';
		label.textContent = String(count);
		wrap.append(label);
	}

	wrap.append(objectGroup(spriteId, count, density));

	return wrap;
}

function opSign (sign) {
	const el = document.createElement('div');
	el.className = 'op-sign';
	el.textContent = sign;

	return el;
}

/** One answer card: a numeral, optionally over a matching object preview. */
function choiceCard (value, pairing, preview) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'choice';
	btn.dataset.value = String(value);
	// Numerals only: no language in the accessible name either.
	btn.setAttribute('aria-label', String(value));

	const num = document.createElement('div');
	num.className = 'num';
	num.textContent = String(value);
	btn.append(num);

	if (preview === 'objects' && value > 0) {
		const mini = document.createElement('div');
		mini.className = 'mini';
		// A first guess only: fitMinis() re-picks this against the real card.
		setColumns(mini, columnsFor(value), 'minmax(0, 1fr)');
		for (let i = 0; i < value; ++i)
			mini.append(sprite(pairing.target));
		btn.append(mini);
	}

	return btn;
}

/**
 * Render a question into the board.
 * @returns handles the game loop needs to animate and score the round
 */
export function render (board, q, opts = {}) {
	const pairing = pairingById(q.pairingId);
	const enterScale = opts.enterScale ?? 1;
	board.textContent = '';

	const left = document.createElement('div');
	left.className = 'panel source-panel';

	const action = document.createElement('div');
	action.className = 'action';

	const right = document.createElement('div');
	right.className = 'panel choices-panel';

	let sourceGroups = [];

	if (q.mode === 'count') {
		// The source stays unlabelled by design: the quantity must be
		// established by counting, not read off a label.
		const g = labelledGroup(pairing.source, q.operands[0], q.knobs.density, false);
		left.append(g);
		sourceGroups = [g];
	}
	else if (q.mode === 'add') {
		const row = document.createElement('div');
		row.className = 'add-source';
		const a = labelledGroup(pairing.source, q.operands[0], q.knobs.density, true);
		const b = labelledGroup(pairing.source, q.operands[1], q.knobs.density, true);
		row.append(a, opSign('+'), b);
		left.append(row);
		// Two groups share the panel width, so each may only claim half of it.
		left.style.setProperty('--groups', '2');
		sourceGroups = [a, b];
	}
	else {
		// Subtraction as a missing-addend task: the source group is the actor,
		// some of its members already have their target object, and the child
		// supplies the rest.
		const g = pairGrid(pairing, q.operands[0], q.operands[1], q.knobs.density);
		left.append(g);
		sourceGroups = [g];
	}

	// Centre: the action area.
	if (q.mode === 'sub') {
		// Only the sign and the numeral: the fish themselves are already on the
		// plates, so repeating them here would contradict the visible count.
		const have = document.createElement('div');
		have.className = 'have';
		have.append(opSign('−'));
		const n = document.createElement('div');
		n.className = 'count-label';
		n.textContent = String(q.operands[1]);
		have.append(n);
		action.append(have);
	}
	else {
		action.append(sprite('ic-arrow', 'arrow'));
		if (pairing.container)
			action.append(sprite(pairing.container, 'container-art'));
	}

	// Right: answer cards.
	const choices = document.createElement('div');
	choices.className = 'choices';
	const buttons = q.options.map(value => {
		const btn = choiceCard(value, pairing, q.knobs.preview);
		choices.append(btn);

		return btn;
	});
	right.append(choices);

	board.append(left, action, right);

	// The stylesheet gets object size close from the column count alone; this
	// corrects it against the panel it actually landed in. It runs before the
	// entrance classes, so nothing is transformed yet and nothing has been
	// painted: no visible resize.
	fitPanel(left);
	fitMinis(right);

	// ---- entrance animation ----
	const dur = REDUCED ? 0.01 : 0.5 * enterScale;
	left.style.setProperty('--enter', `${dur}s`);
	right.style.setProperty('--enter', `${dur}s`);
	left.classList.add('enter-left');
	right.classList.add('enter-right');
	action.style.setProperty('--enter', `${dur}s`);
	action.style.setProperty('--d', `${dur * 0.45}s`);
	action.classList.add('enter-pop');

	// Number labels settle in after the objects, so the count is seen first.
	const labels = board.querySelectorAll('.count-label');
	labels.forEach((label, i) => {
		label.style.setProperty('--enter', `${dur * 0.7}s`);
		label.style.setProperty('--d', `${dur * (0.7 + i * 0.12)}s`);
		label.classList.add('enter-fade');
	});
	buttons.forEach((btn, i) => {
		btn.style.setProperty('--enter', `${dur * 0.8}s`);
		btn.style.setProperty('--d', `${dur * (0.35 + i * 0.09)}s`);
		btn.classList.add('enter-pop');
	});

	const entranceMs = REDUCED ? 20 : dur * 1000 * 1.5;

	return {
		pairing,
		left,
		action,
		right,
		buttons,
		sourceGroups,
		container: action.querySelector('.container-art'),
		entranceMs,
		// Only the actors, never the target objects already on the plates.
		sourceObjects: () => [...left.querySelectorAll('.pair-col > .obj, .objects > .obj')],
		emptySlots: () => [...left.querySelectorAll('.slot.empty')],
	};
}

/* ---------------------------------------------------------------- helpers */

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const centreOf = el => {
	const r = el.getBoundingClientRect();

	return {x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height};
};

/** Animate a temporary sprite from one point to another along a gentle arc. */
function fly (spriteId, from, to, size, delay, duration) {
	const el = sprite(spriteId, 'flyer');
	// The sprite carries its own proportions, so a square flyer would letterbox.
	const box = spriteBox(spriteId);
	const height = box ? size * box.h / box.w : size;
	el.style.width = `${size}px`;
	el.style.height = `${height}px`;
	el.style.left = `${from.x - size / 2}px`;
	el.style.top = `${from.y - height / 2}px`;
	document.body.append(el);

	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const lift = Math.min(90, Math.abs(dx) * 0.35 + 30);

	const anim = el.animate([
		{transform: 'translate(0, 0) scale(.7)', opacity: 0},
		{transform: `translate(${dx * .5}px, ${dy * .5 - lift}px) scale(1.15)`, opacity: 1, offset: .55},
		{transform: `translate(${dx}px, ${dy}px) scale(.85)`, opacity: 1},
	], {
		duration: REDUCED ? 1 : duration,
		delay: REDUCED ? 0 : delay,
		easing: 'cubic-bezier(.3,.7,.3,1)',
		fill: 'both',
	});

	return anim.finished.then(() => el.remove());
}

/* ------------------------------------------------------------ animations */

/** Selection: scale, thick ring and a breathing motion — never colour alone. */
export function select (btn, buttons) {
	buttons.forEach(b => b.classList.remove('selected'));
	btn.classList.add('selected');
}

export function deselect (buttons) {
	buttons.forEach(b => b.classList.remove('selected'));
}

/** Retry: the card returns with a wobble, nothing is marked as failure. */
export async function retry (btn) {
	btn.classList.remove('selected');
	btn.classList.add('wobble');
	await wait(REDUCED ? 10 : 520);
	btn.classList.remove('wobble');
}

/**
 * Counting hint: highlight the things that actually have to be counted — the
 * empty plates in subtraction, the source objects otherwise.
 */
export async function countingHint (handles) {
	const empty = handles.emptySlots();
	const objects = empty.length ? empty : handles.sourceObjects();
	for (const el of objects) {
		el.classList.add('counting');
		await wait(REDUCED ? 5 : 260);
		el.classList.remove('counting');
	}
}

/** Show a one-to-one line between the source objects and a card. */
export async function correspondenceHint (handles, btn) {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('class', 'hint-svg');
	document.body.append(svg);

	const to = centreOf(btn);
	const empty = handles.emptySlots();
	const objects = empty.length ? empty : handles.sourceObjects();

	for (const el of objects) {
		const from = centreOf(el);
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', from.x);
		line.setAttribute('y1', from.y);
		line.setAttribute('x2', to.x);
		line.setAttribute('y2', to.y);
		svg.append(line);
		el.classList.add('counting');
		await wait(REDUCED ? 5 : 200);
		el.classList.remove('counting');
	}

	await wait(REDUCED ? 10 : 500);
	svg.remove();
}

/**
 * Success: make the arithmetic visible before any celebration.
 * count/add — the answer's worth of targets travels into the container;
 * add     — the two source groups merge first;
 * sub     — the removed items leave the group and the remainder stays put.
 */
export async function success (handles, q, btn) {
	const {pairing} = handles;
	btn.classList.add('correct');
	handles.buttons.forEach(b => b.classList.remove('selected'));

	if (q.mode === 'add') {
		// Merge the two groups so "these and these together" is seen.
		const [a, b] = handles.sourceGroups;
		const ca = centreOf(a);
		const cb = centreOf(b);
		const mid = (ca.x + cb.x) / 2;
		const opts = {duration: REDUCED ? 1 : 480, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both'};
		a.animate([{transform: 'translateX(0)'}, {transform: `translateX(${mid - ca.x - ca.w * .1}px)`}], opts);
		b.animate([{transform: 'translateX(0)'}, {transform: `translateX(${mid - cb.x + cb.w * .1}px)`}], opts);
		await wait(REDUCED ? 10 : 420);
	}

	if (q.mode === 'sub') {
		// The missing target objects arrive and fill the empty plates, so the
		// child sees the correspondence complete itself one plate at a time.
		const from = centreOf(btn);
		const slots = handles.emptySlots();
		const flights = slots.map((slot, i) => {
			const dest = centreOf(slot);
			const size = Math.max(20, dest.w * 0.82);

			return fly(pairing.target, from, dest, size, i * 120, 620).then(() => {
				slot.classList.remove('empty');
				slot.classList.add('filled', 'just-filled');
				slot.append(sprite(pairing.target, 'obj slot-obj'));
			});
		});
		await Promise.all(flights);

		// Now every actor has one: cheer down the row.
		handles.sourceObjects().forEach((el, i) => {
			el.style.animationDelay = `${i * 55}ms`;
			el.classList.add('cheer');
		});
		await wait(REDUCED ? 10 : 420);
	}
	else {
		// The chosen quantity of targets travels into the container.
		const from = centreOf(btn);
		const target = handles.container ?? handles.action;
		const dest = centreOf(target);
		// Proportional to the container it lands in, so the flight reads as the
		// same objects arriving rather than as smaller tokens of them.
		const size = Math.min(72, Math.max(28, dest.w * 0.42 || 34));
		const flights = [];
		for (let i = 0; i < q.answer; ++i)
			flights.push(fly(pairing.target, from, {
				x: dest.x + (Math.random() - .5) * dest.w * .5,
				y: dest.y + (Math.random() - .5) * dest.h * .35,
			}, size, i * 95, 600));

		if (handles.container)
			handles.container.classList.add('glow');

		await Promise.all(flights);
		handles.sourceObjects().forEach((el, i) => {
			el.style.animationDelay = `${i * 60}ms`;
			el.classList.add('cheer');
		});
		await wait(REDUCED ? 10 : 420);
	}

	showEquation(handles.left, q);
	await wait(REDUCED ? 20 : 900);
}

/** Numbers and symbols only. */
function showEquation (host, q) {
	const eq = document.createElement('div');
	eq.className = 'equation';

	const parts = q.mode === 'add'
		? [q.operands[0], '+', q.operands[1], '=', q.answer]
		: q.mode === 'sub'
			? [q.operands[0], '−', q.operands[1], '=', q.answer]
			: [q.answer];

	eq.textContent = parts.join(' ');
	eq.setAttribute('aria-label', parts.join(' '));
	host.append(eq);
}

/** Dim two wrong options so one more counting attempt is realistic. */
export function scaffold (handles, q) {
	const wrong = handles.buttons.filter(b => Number(b.dataset.value) !== q.answer);
	// Keep one distractor: the child still has to choose, not just tap what is left.
	wrong.slice(0, Math.max(0, wrong.length - 1)).forEach(b => {
		b.classList.add('dimmed');
		b.disabled = true;
	});
}

export function lockChoices (handles) {
	handles.buttons.forEach(b => {
		b.disabled = true;
	});
}
