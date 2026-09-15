/**
 * questions.js — the question data model, item generation and validation.
 *
 * A question is fully described by mode, tier, pairing, operands, answer,
 * option list and the difficulty knobs. Nothing about presentation text lives
 * here: the child-facing board renders numbers, symbols and objects only.
 */

export const MODES = ['count', 'add', 'sub'];

/** Timeout bands in ms. Index is stored per skill family. */
export const TIMEOUT_BANDS = [25000, 16000, 10000];

/**
 * Difficulty tiers, easiest first within each mode. `max` is a ceiling, not a
 * requirement: a tier draws across its whole range.
 *
 * For `sub`, `subMax` caps how many actors may already be paired.
 */
export const TIERS = {
	count: [
		{id: 'c1', min: 1, max: 3},
		{id: 'c2', min: 1, max: 5},
		{id: 'c3', min: 2, max: 7},
		{id: 'c4', min: 3, max: 10},
	],
	add: [
		{id: 'a1', max: 3, addendMax: 1},
		{id: 'a2', max: 5, addendMax: 3},
		{id: 'a3', max: 7, addendMax: 4},
		{id: 'a4', max: 10, addendMax: 6},
	],
	sub: [
		{id: 's1', max: 3, subMax: 1},
		{id: 's2', max: 5, subMax: 3},
		{id: 's3', max: 7, subMax: 4},
		{id: 's4', max: 10, subMax: 6},
	],
};

export const OPTION_COUNT = 4;
export const MAX_QUANTITY = 10;

export const skillKey = (mode, tierId) => `${mode}:${tierId}`;

/**
 * One concrete question, independent of where it was drawn from: `count:3`,
 * `add:1+2`, `sub:5-2`.
 *
 * Deliberately tier-free. `2+3` is the same piece of arithmetic whether it was
 * drawn from a tier or asked by a level, and mastery of it should accumulate in
 * one record rather than splitting by the route that produced it. Operand order
 * is kept: `1+2` and `2+1` look different on the board, so a child can know one
 * and not the other.
 */
export const itemId = (mode, operands) => mode === 'sub'
	? `sub:${operands[0]}-${operands[1]}`
	: `${mode}:${operands.join('+')}`;

export const itemKey = q => itemId(q.mode, q.operands);

/**
 * How many objects the child is dealing with on this question.
 *
 * Not the same as the answer: in the missing-addend task the board shows all
 * `operands[0]` figures and the answer is only the shortfall. This is what a
 * fair time expectation has to scale with, since counting seven of something
 * takes longer than counting two however well it is known.
 */
export const quantityOf = (mode, operands) => mode === 'sub'
	? operands[0]
	: operands.reduce((sum, n) => sum + n, 0);

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];

/** Default knobs; the scheduler overrides them one factor at a time. */
export const defaultKnobs = () => ({
	density: 'sparse',
	distractor: 'far',
	preview: 'objects',
});

/**
 * Build the option list: the answer plus distractors at the requested
 * distance, all inside 0..MAX_QUANTITY, all distinct, sorted ascending.
 */
export function buildOptions (answer, distance) {
	const options = new Set([answer]);
	const offsets = distance === 'near' ? [1, -1, 2, -2] : [2, -2, 3, -3, 1, -1];
	const ordered = offsets.slice().sort(() => Math.random() - 0.5);

	for (const offset of ordered) {
		if (options.size >= OPTION_COUNT)
			break;

		const value = answer + offset;
		// Zero is only ever offered when it is the actual answer, so an empty
		// target group never appears without an explanation.
		if (value < 1 || value > MAX_QUANTITY)
			continue;

		options.add(value);
	}

	// Range too tight to fill from offsets alone (small answers near the floor).
	for (let value = 1; options.size < OPTION_COUNT && value <= MAX_QUANTITY; ++value)
		options.add(value);

	return [...options].slice(0, OPTION_COUNT).sort((a, b) => a - b);
}

/** @returns {string[]} list of problems; empty means the question is usable. */
export function validate (q) {
	const problems = [];

	if (!q.operands.every(n => Number.isInteger(n) && n >= 0 && n <= MAX_QUANTITY))
		problems.push('operand outside 0..10');

	if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > MAX_QUANTITY)
		problems.push('answer outside 0..10');

	if (!q.options.includes(q.answer))
		problems.push('answer missing from options');

	if (new Set(q.options).size !== q.options.length)
		problems.push('duplicate options');

	if (q.options.length !== OPTION_COUNT)
		problems.push(`expected ${OPTION_COUNT} options`);

	if (q.mode === 'add' && q.operands[0] + q.operands[1] !== q.answer)
		problems.push('addition operands disagree with answer');

	if (q.mode === 'sub') {
		if (q.operands[0] - q.operands[1] !== q.answer)
			problems.push('subtraction operands disagree with answer');
		if (q.operands[1] >= q.operands[0])
			problems.push('as many already paired as there are actors');
		if (q.operands[1] < 1)
			problems.push('missing-addend task needs at least one already paired');
	}

	if (q.mode === 'count' && q.operands[0] !== q.answer)
		problems.push('count operand disagrees with answer');

	return problems;
}

function generateOnce (mode, tier, pairing, knobs) {
	let operands;
	let answer;

	if (mode === 'count') {
		answer = randInt(tier.min, tier.max);
		operands = [answer];
	}
	else if (mode === 'add') {
		const b = randInt(1, Math.min(tier.addendMax, tier.max - 1));
		const a = randInt(1, Math.max(1, tier.max - b));
		answer = a + b;
		operands = [a, b];
	}
	else {
		// Missing addend: `total` actors, `present` of them already paired, and
		// the child supplies the difference. present >= 1 and < total, so the
		// answer is never zero and the task is never already complete.
		const total = randInt(2, tier.max);
		const present = randInt(1, Math.min(tier.subMax, total - 1));
		answer = total - present;
		operands = [total, present];
	}

	const q = {
		mode,
		tierId: tier.id,
		pairingId: pairing.id,
		operands,
		answer,
		options: buildOptions(answer, knobs.distractor),
		knobs,
		skill: skillKey(mode, tier.id),
		timeoutMs: TIMEOUT_BANDS[0],
		band: 0,
		quantity: quantityOf(mode, operands),
	};
	q.key = itemKey(q);

	return q;
}

/**
 * Generate one validated question. Retries a bounded number of times so a
 * malformed draw can never reach the board.
 */
export function generate (mode, tier, pairing, knobs = defaultKnobs()) {
	for (let attempt = 0; attempt < 24; ++attempt) {
		const q = generateOnce(mode, tier, pairing, knobs);
		const problems = validate(q);
		if (!problems.length)
			return q;

		if (attempt === 23)
			console.warn('question rejected after retries', problems, q);
	}

	// Guaranteed-valid fallback so play never stalls.
	const q = generateOnce('count', TIERS.count[0], pairing, defaultKnobs());

	return q;
}

/**
 * A gentler question in the same skill family, used for reinforcement after a
 * miss. Always scaffolded knobs, and it avoids reproducing the missed item
 * itself — at the lowest tier there is no easier tier to fall back to, so the
 * operands are re-drawn instead.
 */
export function siblingOf (q, pairing) {
	const tiers = TIERS[q.mode];
	const index = tiers.findIndex(t => t.id === q.tierId);
	const easier = tiers[Math.max(0, index - 1)];
	const knobs = {density: 'sparse', distractor: 'far', preview: 'objects'};

	let sibling = generate(q.mode, easier, pairing, knobs);
	for (let attempt = 0; attempt < 8 && sibling.key === q.key; ++attempt)
		sibling = generate(q.mode, easier, pairing, knobs);

	sibling.reinforcement = true;

	return sibling;
}

export const tierIndex = (mode, tierId) => TIERS[mode].findIndex(t => t.id === tierId);
export const tierOf = (mode, tierId) => TIERS[mode].find(t => t.id === tierId);
export {pick, randInt};
