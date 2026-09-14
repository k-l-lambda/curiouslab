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
	let removedGroup = null;

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
		// Subtraction: the left panel holds the full target quantity, and the
		// centre tray holds the actors that take some away.
		const g = labelledGroup(pairing.target, q.operands[0], q.knobs.density, true);
		left.append(g);
		sourceGroups = [g];
	}

	// Centre: the action area.
	if (q.mode === 'sub') {
		const tray = document.createElement('div');
		tray.className = 'tray';
		tray.append(opSign('−'));
		removedGroup = labelledGroup(pairing.source, q.operands[1], 'sparse', true);
		tray.append(removedGroup);
		action.append(tray);
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
		removedGroup,
		container: action.querySelector('.container-art'),
		entranceMs,
		sourceObjects: () => [...left.querySelectorAll('.obj')],
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

/** Counting hint: highlight source objects one at a time. */
export async function countingHint (handles) {
	const objects = handles.sourceObjects();
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
	const objects = handles.sourceObjects();

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
		// The removed items visibly go to the actors; the rest stay in place.
		const objects = handles.sourceObjects();
		const removed = objects.slice(0, q.operands[1]);
		const dest = centreOf(handles.removedGroup ?? handles.action);
		const flights = removed.map((el, i) => {
			const from = centreOf(el);
			el.classList.add('leaving');

			return fly(pairing.target, from, dest, from.w, i * 110, 620);
		});
		await Promise.all(flights);

		// Highlight what is left, which is the answer.
		for (const el of objects.slice(q.operands[1])) {
			el.classList.add('counting');
			await wait(REDUCED ? 4 : 130);
		}
		objects.slice(q.operands[1]).forEach(el => el.classList.remove('counting'));
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
