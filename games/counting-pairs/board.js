/**
 * board.js — renders one question and owns the four animation families
 * (entrance, selection, success, retry).
 *
 * Nothing in here writes a word into the play surface. The task is carried by
 * arrangement, object count, numerals, arithmetic symbols and motion.
 */

import {sprite} from '../../assets/js/art.js';
import {pairingById} from '../../assets/js/pairings.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Column count that keeps a group countable at a glance. */
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
 * Build a group of object sprites.
 * @param {string} spriteId
 * @param {number} count
 * @param {'sparse'|'compact'} density
 */
function objectGroup (spriteId, count, density) {
	const grid = document.createElement('div');
	grid.className = `objects ${density}`;
	grid.style.gridTemplateColumns = `repeat(${columnsFor(count)}, auto)`;

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
	grid.style.gridTemplateColumns = `repeat(${columnsFor(total)}, auto)`;

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
		mini.style.gridTemplateColumns = `repeat(${columnsFor(value)}, auto)`;
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
	el.style.width = `${size}px`;
	el.style.height = `${size}px`;
	el.style.left = `${from.x - size / 2}px`;
	el.style.top = `${from.y - size / 2}px`;
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
		const size = Math.min(48, Math.max(24, dest.w * 0.42 || 34));
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
