/**
 * board.js — renders one question and owns the animation families
 * (entrance, selection, delivery, success, wrong reveal, retry).
 *
 * Nothing in here writes a word into the play surface. The task is carried by
 * arrangement, object count, numerals, arithmetic symbols and motion.
 *
 * Every answer, right or wrong, is played out the same way: the child's number
 * of target objects flies out of the card and onto the source figures, one
 * each. What happens next is the feedback — figures that got one celebrate,
 * figures that went without turn away, and objects with nobody to go to fall
 * over. The number is never contradicted; it is carried out and its
 * consequence is shown.
 */

import {sprite, spriteBox} from '../../assets/js/art.js';
import {pairingById} from '../../assets/js/pairings.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The turn-away animation's own length, and the budget the whole wave of them
   shares. Both are read by wrongReveal(); TURN_AWAY_MS must match the
   `.obj.let-down` animation in game.css or the last figure is cut off. */
const TURN_AWAY_MS = 720;
const TURN_AWAY_SPREAD = 260;

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
		// The figure sits in a perch rather than directly in the grid, because an
		// object delivered to it is appended inside that perch. Owning the object
		// rather than being positioned next to it means the two reflow, scale and
		// animate as one thing: a rotation between paints cannot separate them.
		const perch = document.createElement('div');
		perch.className = 'perch';
		perch.append(sprite(spriteId, 'obj'));
		// Compact groups sit closer and less regularly, so counting takes real
		// attention — but never so far that objects overlap or the count blurs.
		// On the perch, so whatever it is holding is carried along by the offset.
		if (density === 'compact') {
			const dx = (Math.random() - .5) * 10;
			const dy = (Math.random() - .5) * 10;
			const rot = (Math.random() - .5) * 9;
			perch.style.transform = `translate(${dx}%, ${dy}%) rotate(${rot}deg)`;
		}
		grid.append(perch);
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

/**
 * The question written out, as a list of numerals and symbols.
 *
 * Shared by the bare prompt and the answer reveal so the two cannot drift apart
 * — in particular over the minus sign, which is U+2212 and not a hyphen.
 */
function equationParts (q, withAnswer) {
	const head = q.mode === 'add'
		? [q.operands[0], '+', q.operands[1]]
		: q.mode === 'sub'
			? [q.operands[0], '−', q.operands[1]]
			: [];

	if (!head.length)
		return withAnswer ? [q.answer] : [];

	return withAnswer ? [...head, '=', q.answer] : [...head, '='];
}

/**
 * A question with no objects at all: the numerals are the question.
 *
 * The blank is dashed, borrowing the vocabulary the subtraction layout already
 * teaches with its empty plates — a dashed outline is the shape of something
 * missing. And the row of numerals itself is not new to the child: it is what
 * the board shows them after every correct answer, so by the time it becomes the
 * question it is already familiar.
 */
function equationPrompt (q) {
	const wrap = document.createElement('div');
	wrap.className = 'equation prompt';

	for (const part of equationParts(q, false)) {
		const el = document.createElement('span');
		el.textContent = String(part);
		wrap.append(el);
	}

	const blank = document.createElement('span');
	blank.className = 'blank';
	wrap.append(blank);
	wrap.setAttribute('aria-label', `${equationParts(q, false).join(' ')} ?`);

	return wrap;
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
	// Delivery leaves flying objects parked on <body>, outside the board, so
	// emptying the board does not take them with it. A round can also end while
	// they are still on screen — a pause, a timeout — so clear them here rather
	// than trusting every path out of an animation to tidy up after itself.
	clearOverlaySprites();

	const left = document.createElement('div');
	left.className = 'panel source-panel';

	const action = document.createElement('div');
	action.className = 'action';

	const right = document.createElement('div');
	right.className = 'panel choices-panel';

	let sourceGroups = [];

	if (q.form === 'bare') {
		// Nothing to count: the question is the arithmetic itself. The panel keeps
		// the height it would have had with objects in it, so that materialising
		// them later cannot shift the answer cards under the child's finger.
		left.classList.add('bare-panel');
		left.append(equationPrompt(q));
	}
	else if (q.mode === 'count') {
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
	if (q.form === 'bare')
		// The prompt already carries the operator, so a second sign here would say
		// it twice. The arrow still points from the question to the cards.
		action.append(sprite('ic-arrow', 'arrow'));
	else if (q.mode === 'sub') {
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
		// The arrow alone. The objects are delivered to the figures themselves
		// now, so a bowl in the middle would show a destination they never go to.
		action.append(sprite('ic-arrow', 'arrow'));
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
		entranceMs,
		// Only the actors, never the target objects already on the plates.
		sourceObjects: () => [...left.querySelectorAll('.pair-col > .obj, .perch > .obj')],
		emptySlots: () => [...left.querySelectorAll('.slot.empty')],
		/**
		 * Where the answer's objects are supposed to land, in order: one place
		 * per object the correct answer calls for.
		 *
		 * In counting and addition every actor is waiting for one, so the actors
		 * are the anchors. In subtraction the actors with a full plate are
		 * already served, so only the columns with an empty plate are, and each
		 * anchor carries the plate its object drops into.
		 */
		anchors: () => q.mode === 'sub'
			? [...left.querySelectorAll('.pair-col')]
				.map(col => ({actor: col.querySelector('.obj'), host: col.querySelector('.slot.empty')}))
				.filter(a => a.host)
			: [...left.querySelectorAll('.objects > .perch')]
				.map(perch => ({actor: perch.querySelector('.obj'), host: perch})),
	};
}

/* ---------------------------------------------------------------- helpers */

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const centreOf = el => {
	const r = el.getBoundingClientRect();

	return {x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height};
};

/** The height a sprite wants at this width, from its own proportions. */
function heightAt (spriteId, width) {
	const box = spriteBox(spriteId);

	return box ? width * box.h / box.w : width;
}

/** Position a fixed-position sprite so its centre lands on a point. */
function placeAt (el, point, width, height) {
	el.style.width = `${width}px`;
	el.style.height = `${height}px`;
	el.style.left = `${point.x - width / 2}px`;
	el.style.top = `${point.y - height / 2}px`;
}

/**
 * Animate a temporary sprite from one point to another along a gentle arc.
 * @returns {{el: SVGElement, done: Promise<void>}} the flyer and its landing.
 *   It is left on screen: whoever asked for the flight decides how it ends.
 */
function fly (spriteId, from, to, size, delay, duration) {
	const el = sprite(spriteId, 'flyer');
	// The sprite carries its own proportions, so a square flyer would letterbox.
	const height = heightAt(spriteId, size);
	placeAt(el, from, size, height);
	document.body.append(el);

	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const lift = Math.min(90, Math.abs(dx) * 0.35 + 30);

	const anim = el.animate([
		{transform: 'translate(0, 0) scale(.7)', opacity: 0},
		{transform: `translate(${dx * .5}px, ${dy * .5 - lift}px) scale(1.15)`, opacity: 1, offset: .55},
		{transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1},
	], {
		duration: REDUCED ? 1 : duration,
		delay: REDUCED ? 0 : delay,
		easing: 'cubic-bezier(.3,.7,.3,1)',
		fill: 'both',
	});

	return {el, done: anim.finished.then(() => {})};
}

/** Everything delivery parks on <body>, gone. */
function clearOverlaySprites () {
	document.querySelectorAll('.flyer').forEach(el => el.remove());
}

/**
 * Put the object where it is going to end up, invisibly, and hand back the
 * controls for revealing it.
 *
 * The resting object is a child of the figure that receives it — the plate in
 * subtraction, the perch around the figure otherwise — and the stylesheet
 * places it there. So its resting position is a layout fact rather than a pair
 * of viewport coordinates: it survives a resize, a rotation and any reflow
 * during the celebration, and it moves with the figure when the figure moves.
 *
 * It is created before the flight so the flight can be aimed at its measured
 * box. Landing is then a swap between two sprites in the same place at the
 * same size, with nothing to line up by hand.
 */
function seat (anchor, spriteId) {
	const slot = anchor.host.classList.contains('slot');
	const el = sprite(spriteId, slot ? 'obj slot-obj landing' : 'held landing');
	anchor.host.append(el);

	return {
		el,
		slot,
		/** The flyer has arrived: this is what it turns into. */
		show () {
			el.classList.remove('landing');
			if (slot) {
				anchor.host.classList.remove('empty');
				anchor.host.classList.add('filled', 'just-filled');
			}
		},
		/** Never mind: a wrong answer leaves the picture as it found it. */
		undo () {
			el.remove();
			if (slot) {
				anchor.host.classList.add('empty');
				anchor.host.classList.remove('filled', 'just-filled');
			}
		},
	};
}

/**
 * Carry `count` target objects out of the card and onto the source figures,
 * one each, in order.
 *
 * This is the part that is the same whether the answer was right or wrong: the
 * number the child chose is taken at face value and acted out. Objects with an
 * anchor waiting land on it. Objects past the last anchor have nowhere to go
 * and fall over below the card, which is what "too many" looks like.
 *
 * @param pace `{step, flight}` in ms: how far apart the objects leave and how
 *   long each one is in the air.
 * @returns the anchors that received an object and now hold it, the anchors
 *   that went without, and the surplus flyers left lying on screen.
 */
async function deliver (handles, count, btn, pace) {
	const {pairing} = handles;
	const from = centreOf(btn);
	const anchors = handles.anchors();
	const strays = Math.max(0, count - anchors.length);
	const row = strayRow(handles, btn, strays);
	const flights = [];
	const landed = [];
	const spare = [];

	for (let i = 0; i < count; ++i) {
		const anchor = anchors[i];
		if (anchor) {
			const held = seat(anchor, pairing.target);
			const box = centreOf(held.el);
			const flight = fly(pairing.target, from, box, box.w, i * pace.step, pace.flight);
			// Each object hands over as it lands rather than waiting for the wave
			// to finish, so a figure has what it was given the moment it arrives.
			flights.push(flight.done.then(() => {
				held.show();
				flight.el.remove();
			}));
			landed.push({anchor, held});
		}
		else {
			const {point, size} = row(i - anchors.length);
			const flight = fly(pairing.target, from, point, size, i * pace.step, pace.flight * .93);
			flights.push(flight.done);
			spare.push({el: flight.el, size});
		}
	}

	await Promise.all(flights);

	return {
		anchors,
		landed,
		spare,
		unserved: anchors.slice(Math.min(count, anchors.length)),
	};
}

/**
 * Where the objects nobody could use come to rest: a row just clear of the card
 * that asked for them, so they stay in the answer's own half of the screen.
 *
 * They are spread across the whole card row rather than across the one card,
 * because five strays over one card would land on top of each other and read as
 * a single object instead of as the surplus they are.
 * @returns {(index: number) => {point: {x: number, y: number}, size: number}}
 */
function strayRow (handles, btn, strays) {
	const card = centreOf(btn);
	const panel = centreOf(handles.right);
	const size = Math.max(18, Math.min(card.w * 0.42, 54));
	const spread = Math.min(panel.w * 0.86, size * 1.25 * Math.max(1, strays));
	// Clear of the card's top edge, so the numeral the child chose stays legible
	// underneath its own surplus.
	const y = card.y - card.h / 2 - size * 0.55;

	return i => ({
		size,
		point: {
			x: panel.x - spread / 2 + spread * (strays <= 1 ? .5 : i / (strays - 1)),
			y,
		},
	});
}

/** Lay a stray object down where it stopped: nobody had a use for it. */
function tipOver (el, size, delay) {
	const dir = Math.random() < .5 ? -1 : 1;
	el.animate([
		{transform: `translate(0, 0) rotate(0deg)`, filter: 'grayscale(0)'},
		{transform: `translate(${dir * size * .1}px, ${size * .34}px) rotate(${dir * 84}deg)`,
			filter: 'grayscale(.55)'},
	], {
		duration: REDUCED ? 1 : 420,
		delay: REDUCED ? 0 : delay,
		easing: 'cubic-bezier(.4,1.6,.6,1)',
		fill: 'forwards',
		composite: 'add',
	});
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

/**
 * Put countable objects into a `bare` panel.
 *
 * The number-only form has nothing on screen to count, so every hint that
 * follows a mistake is silently a no-op there: `countingHint` walks
 * `sourceObjects()`, `correspondenceHint` draws lines from them, and both get an
 * empty list. A child who has just got it wrong is exactly the child who needs
 * the objects, so the first miss brings them out — the question becomes the
 * cartoon form for the rest of the round.
 *
 * Idempotent: a second miss must not double the group.
 *
 * @returns {boolean} true if this call is what revealed them
 */
export function revealObjects (handles, q) {
	const left = handles.left;
	if (!left.classList.contains('bare-panel') || left.dataset.revealed === '1')
		return false;

	left.dataset.revealed = '1';
	const pairing = handles.pairing;
	// The prompt stays: it is the question, and taking it away mid-round would
	// change what was asked. The objects join it.
	const objects = document.createElement('div');
	objects.className = 'bare-objects';

	if (q.mode === 'add') {
		const row = document.createElement('div');
		row.className = 'add-source';
		row.append(
			labelledGroup(pairing.source, q.operands[0], q.knobs.density, true),
			opSign('+'),
			labelledGroup(pairing.source, q.operands[1], q.knobs.density, true));
		objects.append(row);
		left.style.setProperty('--groups', '2');
	}
	else if (q.mode === 'sub')
		objects.append(pairGrid(pairing, q.operands[0], q.operands[1], q.knobs.density));
	else
		objects.append(labelledGroup(pairing.source, q.operands[0], q.knobs.density, false));

	left.append(objects);
	// Same correction the first render makes: the objects have to fit the panel
	// they actually landed in, not the one the stylesheet guessed.
	fitPanel(left);

	return true;
}

/**
 * Leave the board.
 *
 * Delivery parks flyers on <body> and the correspondence hint parks an <svg>
 * there, so neither is inside the board element — emptying it would leave them
 * floating over whatever comes next. Called when the view changes.
 */
export function teardown () {
	clearOverlaySprites();
	document.querySelectorAll('.hint-svg').forEach(el => el.remove());
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
 * Success: carry the answer out, then let the figures show what it did.
 *
 * The objects fly one to each figure — into the empty plate in subtraction,
 * onto the figure itself otherwise — and only once every figure has its own
 * does the celebration start. The order matters: the child sees the
 * correspondence complete before being told it was right.
 *
 * The groups are deliberately left where they are. Addition used to slide the
 * two groups together here, which moved the very objects the child had just
 * counted while they were still looking at them.
 */
export async function success (handles, q, btn) {
	btn.classList.add('correct');
	handles.buttons.forEach(b => b.classList.remove('selected'));

	// A bare question has no figures to deliver to and none to cheer. Delivery
	// would read every object as surplus and pile them under the card — the very
	// picture a wrong answer makes. So it gets its own quieter ending: the blank
	// fills in, and that is the whole reward.
	//
	// Quieter is right rather than merely simpler. This is the form for a child
	// who no longer needs the objects, and they do not need a parade either.
	if (!handles.anchors().length) {
		const blank = handles.left.querySelector('.equation.prompt .blank');
		if (blank) {
			blank.textContent = String(q.answer);
			blank.classList.add('filled');
		}
		await wait(REDUCED ? 20 : 700);

		return;
	}

	// Unhurried: this flight is the correspondence being completed, one at a time.
	await deliver(handles, q.answer, btn, {step: 85, flight: 560});

	// Everyone has one now: cheer down the row, each in its own way. Two layers,
	// on two elements, because they would otherwise contend for one property:
	// the bounce goes on the cell, so a figure and what it was just given move
	// together instead of one under the other, and the figure's own parts — a
	// tail, an ear, a face — go on the figure. What each part does is the
	// stylesheet's business; all this needs to know is which figure it is, and
	// the sprite already carries that as a class.
	const cheering = [];
	handles.sourceObjects().forEach((el, i) => {
		const cell = el.closest('.perch, .pair-col') || el;
		const delay = REDUCED ? '0s' : `${i * 60}ms`;
		cell.style.animationDelay = delay;
		cell.classList.add('cheer');
		el.style.animationDelay = delay;
		el.classList.add('rejoice');
		cheering.push({cell, el});
	});
	await wait(REDUCED ? 10 : 620);

	showEquation(handles.left, q);
	await wait(REDUCED ? 20 : 900);
	// The board is about to be replaced, but a wrong answer on the next question
	// renders into the same panel: leaving a figure mid-gesture would carry that
	// pose into a question it has nothing to do with.
	cheering.forEach(({cell, el}) => {
		cell.classList.remove('cheer');
		cell.style.removeProperty('animation-delay');
		el.classList.remove('rejoice');
		el.style.removeProperty('animation-delay');
	});
	clearOverlaySprites();
}

/**
 * A wrong answer, played out: the number the child chose is delivered, and the
 * figures and objects show why it does not work.
 *
 * Too few, and some figures are left with nothing — they turn away, briefly.
 * Too many, and the objects nobody could use fall over below the card. Either
 * way it is over in about a second and the board is handed back untouched, so
 * the next attempt starts from the same picture the child was counting.
 */
export async function wrongReveal (handles, value, btn) {
	// Brisker than the success flight: the retry wobble and the counting hint
	// still follow this, and on ten plates the whole chain is what the child
	// waits through before they can count again.
	const {landed, spare, unserved} = await deliver(handles, value, btn, {step: 52, flight: 440});

	// The turn-away is a wave down the row, but the wave shares a fixed budget
	// however long the row is — a per-figure delay would put the last figure's
	// animation past the wait below, and it would be cut off mid-turn.
	const spread = unserved.length > 1 ? TURN_AWAY_SPREAD / (unserved.length - 1) : 0;
	spare.forEach(({el, size}, i) => tipOver(el, size, i * spread));
	unserved.forEach(({actor}, i) => {
		actor.style.animationDelay = REDUCED ? '0s' : `${Math.round(i * spread)}ms`;
		actor.classList.add('let-down');
	});

	// Long enough for the last figure in the wave to finish turning back.
	await wait(REDUCED ? 10 : TURN_AWAY_MS + TURN_AWAY_SPREAD);

	// Put the picture back exactly as it was: the objects were never really
	// given, and the figures have another try coming.
	unserved.forEach(({actor}) => {
		actor.classList.remove('let-down');
		actor.style.removeProperty('animation-delay');
	});
	landed.forEach(({held}) => held.undo());
	spare.forEach(({el}) => el.remove());
	clearOverlaySprites();
}

/**
 * Numbers and symbols only.
 *
 * A `bare` panel that grew its objects after a miss already has the question
 * written in it, so the answer fills that blank instead of arriving as a second
 * equation underneath — otherwise the child ends the round looking at `2 + 3 = ?`
 * above `2 + 3 = 5`, and has to work out that both are the same question.
 */
function showEquation (host, q) {
	const blank = host.querySelector('.equation.prompt .blank');
	if (blank) {
		blank.textContent = String(q.answer);
		blank.classList.add('filled');

		return;
	}

	const eq = document.createElement('div');
	eq.className = 'equation';
	// Shared with the prompt so the two can never disagree about the operator.
	const parts = equationParts(q, true);
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
