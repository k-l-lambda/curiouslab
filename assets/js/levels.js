/**
 * levels.js — the level ladder: what each level asks, how well the child knows
 * it, and what a run of it earned.
 *
 * Everything here is a pure function of records handed in by the caller. It
 * imports no storage and touches no DOM, deliberately: `storage.js` attaches
 * `window` listeners when it loads, so importing it would make this module
 * unloadable outside a browser — and these rules are exactly the part worth
 * asserting from a plain script.
 *
 * The record shapes this reads, owned by `storage.js`:
 *
 *   item  {everCorrect, seen, errors, timeouts, lastSeen, forms: {}}
 *   form  {seen, correct, firstTry, misses, bestMs, lastMs, lastSeen}
 *
 * Both are read defensively — `undefined` means "never seen", never an error.
 */

import {buildOptions, itemId, skillKey, TIERS, TIMEOUT_BANDS} from './questions.js';

/* ------------------------------------------------------------------ bands */

/**
 * Difficulty regions. The hand sign is the entire label: a child who cannot
 * read still sees that this stretch of the path is "the three ones" and the
 * next is "the five ones". `max` is the ceiling every quantity in the band
 * stays under.
 *
 * The variation selector (️) is not decoration — without it some platforms
 * render these as monochrome glyphs rather than emoji.
 */
export const BANDS = [
	{id: 'b3', sign: '\u{1F44C}\u{FE0F}', max: 3},
	{id: 'b5', sign: '\u{1F590}\u{FE0F}', max: 5},
];

export const bandById = id => BANDS.find(b => b.id === id);

/* ------------------------------------------------------------------ forms */

/**
 * How a question is presented. The child meets the same arithmetic three ways,
 * and knowing it one way does not mean knowing it another — so mastery is
 * recorded per form, not just per question.
 */
export const FORMS = {
	/** Cartoon objects to count, and answer cards carrying object previews. */
	FULL: 'full',
	/** Cartoon objects to count, but the answer cards are bare numerals. */
	PROMPT: 'prompt',
	/** No objects at all: the question is the numerals themselves. */
	BARE: 'bare',
};

/**
 * Which forms each mode can actually be asked in.
 *
 * Counting has no `bare`, and this is not a limitation but arithmetic: "how many
 * are there" written as a numeral *is* the answer. A bare counting question
 * would print its own solution.
 */
const FORMS_BY_MODE = {
	count: [FORMS.FULL, FORMS.PROMPT],
	add: [FORMS.FULL, FORMS.PROMPT, FORMS.BARE],
	sub: [FORMS.FULL, FORMS.PROMPT, FORMS.BARE],
};

/** The forms a level may ask for a mode: its own declaration, minus the impossible. */
export const allowedForms = (level, mode) =>
	level.forms.filter(form => FORMS_BY_MODE[mode].includes(form));

/** Does this form show countable objects? Drives the board's layout choice. */
export const showsObjects = form => form !== FORMS.BARE;

/** Does this form show object previews on the answer cards? */
export const showsPreviews = form => form === FORMS.FULL;

/* ----------------------------------------------------------------- levels */

/**
 * The ladder. `questions` is how many a single run asks; the item set is
 * usually larger, so full coverage takes several runs — which is what makes
 * replaying a level worth doing.
 *
 * `sprite` is the cover shown until the generated art exists; `cover` and
 * `clear` name the files it will be replaced by. The briefs for those are in
 * `assets/levels/prompts.md`.
 *
 * `pairing` is the level's face on the map, not a constraint on its questions:
 * the cover art is drawn around these two figures, so the map needs to know
 * which they are. Inside a run the figures still vary question to question —
 * `nextInRun` picks those, and variety there is the point.
 */
export const LEVELS = [
	{
		id: 'l1',
		band: 'b3',
		modes: ['count'],
		min: 1,
		max: 3,
		questions: 3,
		forms: [FORMS.FULL],
		sprite: 'sp-cat',
		pairing: 'cat-fish',
		cover: 'l1-cover.png',
		clear: 'l1-clear.png',
	},
	{
		id: 'l2',
		band: 'b3',
		modes: ['count', 'add'],
		min: 1,
		max: 3,
		questions: 5,
		forms: [FORMS.FULL],
		sprite: 'sp-monkey',
		pairing: 'monkey-banana',
		cover: 'l2-cover.png',
		clear: 'l2-clear.png',
	},
	{
		// Six questions against fifteen items: coverage needs three clean runs.
		// That is the intended shape — the gate is cumulative, so coming back is
		// how it opens.
		id: 'l3',
		band: 'b5',
		modes: ['count', 'add'],
		min: 1,
		max: 5,
		questions: 6,
		forms: [FORMS.FULL, FORMS.PROMPT],
		sprite: 'sp-rabbit',
		pairing: 'rabbit-carrot',
		cover: 'l3-cover.png',
		clear: 'l3-clear.png',
	},
];

export const levelById = id => LEVELS.find(l => l.id === id);
export const levelIndex = id => LEVELS.findIndex(l => l.id === id);

/**
 * The tier whose ceiling matches a level's range.
 *
 * Levels pick their own questions and do not need tiers, but the timeout band,
 * the per-skill mastery record and the grown-up panel are all keyed by skill —
 * so borrowing the matching tier id keeps all three working untouched rather
 * than growing a parallel set of records beside them.
 */
const TIER_BY_MAX = {3: 0, 5: 1, 7: 2, 10: 3};

export function tierIdFor (mode, max) {
	const tiers = TIERS[mode];
	const index = TIER_BY_MAX[max];

	return (tiers[index] ?? tiers[tiers.length - 1]).id;
}

/* -------------------------------------------------------------- item sets */

/**
 * Every concrete question a level can ask, in a stable order so a harness can
 * assert the set itself rather than only its size.
 *
 * `quantity` is how many objects the child ends up dealing with, which is what
 * a fair time limit has to scale with — counting five is slower than counting
 * two for reasons that have nothing to do with mastery.
 *
 * @returns {{id: string, mode: string, operands: number[], answer: number,
 *            quantity: number}[]}
 */
export function itemsOf (level) {
	const items = [];

	for (const mode of level.modes) {
		if (mode === 'count')
			for (let n = level.min; n <= level.max; ++n)
				items.push({id: itemId(mode, [n]), mode, operands: [n], answer: n, quantity: n});

		if (mode === 'add')
			for (let a = 1; a < level.max; ++a)
				for (let b = 1; a + b <= level.max; ++b)
					items.push({
						id: itemId(mode, [a, b]),
						mode,
						operands: [a, b],
						answer: a + b,
						quantity: a + b,
					});

		if (mode === 'sub')
			for (let total = 2; total <= level.max; ++total)
				for (let present = 1; present < total; ++present)
					items.push({
						id: itemId(mode, [total, present]),
						mode,
						operands: [total, present],
						answer: total - present,
						quantity: total,
					});
	}

	return items;
}

/* --------------------------------------------------------------- mastery */

/**
 * The line between working an answer out and simply knowing it, in
 * milliseconds. It scales with how many objects are involved, because a fixed
 * threshold would punish the larger questions for being larger: a child who
 * counts five fish deliberately is not slower than one who counts two, they
 * have more to count.
 */
export const FLUENT_BASE = 900;
export const FLUENT_PER_ITEM = 400;

export const fluentMs = quantity => FLUENT_BASE + FLUENT_PER_ITEM * quantity;

/**
 * How far the child has got on one question in one presentation of it.
 *
 * The rungs are the ones the ladder is actually made of: never met it, met it
 * but never cleanly, got it, got it quickly. `bestMs` is only ever written for
 * an unaided answer, so rung 3 cannot be reached with help.
 */
export const GRADE = {UNSEEN: 0, TRIED: 1, CORRECT: 2, FLUENT: 3};
export const GRADE_MAX = GRADE.FLUENT;

/**
 * @param {object|undefined} formRec
 * @param {number} quantity
 * @returns {number} 0..3
 */
export function gradeFor (formRec, quantity) {
	if (!formRec || !formRec.seen)
		return GRADE.UNSEEN;
	if (!formRec.correct)
		return GRADE.TRIED;
	if (!formRec.bestMs || formRec.bestMs >= fluentMs(quantity))
		return GRADE.CORRECT;

	return GRADE.FLUENT;
}

const formRecord = (itemRec, form) => itemRec && itemRec.forms
	? itemRec.forms[form]
	: undefined;

/**
 * The item's own grade: the best it has reached in any form this level allows.
 *
 * Best rather than average, because the forms are presentations of one fact. A
 * child who can do `2+3` from bare numerals has not got worse at `2+3`.
 */
export function itemGrade (item, level, records) {
	const itemRec = records[item.id];
	const forms = allowedForms(level, item.mode);

	return forms.reduce(
		(best, form) => Math.max(best, gradeFor(formRecord(itemRec, form), item.quantity)),
		GRADE.UNSEEN);
}

/** Fastest unaided answer across the allowed forms, or 0 if there has not been one. */
export function itemBestMs (item, level, records) {
	const itemRec = records[item.id];

	return allowedForms(level, item.mode).reduce((best, form) => {
		const ms = formRecord(itemRec, form)?.bestMs ?? 0;
		if (!ms)
			return best;

		return best ? Math.min(best, ms) : ms;
	}, 0);
}

/** Has this question been answered correctly at least once, in any form? */
export const isCovered = (item, records) => Boolean(records[item.id]?.everCorrect);

/* ----------------------------------------------------------------- stars */

/**
 * Star thresholds against the mean grade over the level's whole item set,
 * normalised to 0..1. Unseen items count as zero, so stars measure the level
 * rather than the last run of it.
 *
 * Calibrated against the rungs so each threshold names a state a child can
 * recognise: every item tried is 1/3 and earns one star, every item answered
 * correctly is 2/3 and earns two, and three asks for most of the set to be
 * fluent. The unlock gate — every item correct at least once — therefore lands
 * at two stars, so there is a star still to win on a level already opened.
 */
export const STAR_THRESHOLDS = [0.3, 0.6, 0.85];

/**
 * @returns {{stars: number, fluency: number, covered: number, total: number,
 *            complete: boolean}}
 */
export function scoreLevel (level, records) {
	const items = itemsOf(level);
	const total = items.length;
	let graded = 0;
	let covered = 0;

	for (const item of items) {
		graded += itemGrade(item, level, records) / GRADE_MAX;
		if (isCovered(item, records))
			++covered;
	}

	const fluency = total ? graded / total : 0;

	return {
		stars: STAR_THRESHOLDS.filter(t => fluency >= t).length,
		fluency,
		covered,
		total,
		complete: total > 0 && covered === total,
	};
}

export const starsFor = (level, records) => scoreLevel(level, records).stars;

/**
 * Which levels are open.
 *
 * Derived rather than stored, so it cannot drift out of step with the records
 * and so it re-answers itself correctly after a migration. The first level is
 * always open; each later one opens when every question in the level before it
 * has been answered correctly at least once.
 *
 * `unlockAll` is the `?unlock` debug override. It is applied here, at the point
 * of asking, and never written back — a debug switch must not hand out progress
 * the child did not earn.
 *
 * @returns {Set<string>} level ids
 */
export function unlockedLevels (records, {unlockAll = false} = {}) {
	const open = new Set();

	for (let i = 0; i < LEVELS.length; ++i) {
		if (unlockAll || i === 0 || scoreLevel(LEVELS[i - 1], records).complete)
			open.add(LEVELS[i].id);
		else
			break;
	}

	return open;
}

/* ------------------------------------------------------------------- runs */

/**
 * One bounded attempt at a level.
 *
 * `misses` counts timeouts only. A wrong answer the child then corrects is not
 * a miss: they got there, and the whole feedback sequence exists to let them.
 */
export function startRun (level) {
	return {
		level,
		asked: [],
		answered: 0,
		misses: 0,
		improvements: [],
		startedAt: Date.now(),
	};
}

export const runRemaining = run => Math.max(0, run.level.questions - run.answered);
export const runComplete = run => run.answered >= run.level.questions;

/**
 * Did this run clear the level?
 *
 * Nothing timed out, and at least one question ended up better known than it
 * had ever been. Getting everything right is not on its own enough — the
 * animation marks moving forward, not marking time.
 */
export const isClear = run => run.misses === 0 && run.improvements.length > 0;

/* ---------------------------------------------------------------- picking */

/**
 * Whether a form may be offered for an item yet.
 *
 * The gate exists because weakest-first weighting alone gets this exactly
 * backwards: a form never attempted has no record, so it looks maximally weak
 * and would be picked first — handing a child their very first sight of a
 * question in its hardest presentation. So a harder form has to be earned: the
 * child must have got this question right with the objects in front of them
 * before it is asked of them without.
 */
export function formAvailable (item, form, records) {
	if (form === FORMS.FULL)
		return true;

	const full = formRecord(records[item.id], FORMS.FULL);

	return Boolean(full && full.correct > 0);
}

/**
 * How much this (item, form) wants practice. Weakest first, but never zero:
 * a mastered question still comes round occasionally, which is what keeps it
 * mastered.
 */
export function weightFor (item, form, records) {
	const grade = gradeFor(formRecord(records[item.id], form), item.quantity);
	// 4, 3, 2, 1 across the rungs: an unseen question is four times as likely as
	// a fluent one, not infinitely more likely.
	return (GRADE_MAX - grade) + 1;
}

const weightedPick = (entries, rng) => {
	const total = entries.reduce((sum, e) => sum + e.weight, 0);
	if (total <= 0)
		return entries.length ? entries[0] : null;

	let roll = rng() * total;
	for (const entry of entries) {
		roll -= entry.weight;
		if (roll <= 0)
			return entry;
	}

	return entries[entries.length - 1];
};

/**
 * Choose the next question and presentation for a run.
 *
 * Anything already asked this run is set aside first, so a short run spreads
 * across the level instead of drilling one question — unless the run is longer
 * than the item set, in which case repeats are unavoidable and allowed.
 *
 * @param {() => number} [rng] injectable so a harness can drive this
 *   deterministically rather than sampling and hoping.
 * @returns {{item: object, form: string}|null}
 */
export function chooseTarget (level, records, run, rng = Math.random) {
	const items = itemsOf(level);
	const fresh = items.filter(i => !run.asked.includes(i.id));
	const pool = fresh.length ? fresh : items;

	const byItem = pool.map(item => ({item, weight: weightFor(item, FORMS.FULL, records)
		+ allowedForms(level, item.mode)
			.filter(f => f !== FORMS.FULL && formAvailable(item, f, records))
			.reduce((sum, f) => sum + weightFor(item, f, records), 0)}));

	const chosen = weightedPick(byItem, rng);
	if (!chosen)
		return null;

	const item = chosen.item;
	const forms = allowedForms(level, item.mode)
		.filter(form => formAvailable(item, form, records))
		.map(form => ({form, weight: weightFor(item, form, records)}));

	const form = weightedPick(forms, rng);

	return {item, form: form ? form.form : FORMS.FULL};
}

/**
 * Build the question object the board renders.
 *
 * Uses `buildOptions` and the question shape from `questions.js` rather than
 * `generate()`: generate draws random operands out of a tier, and a level has
 * already decided which question it wants asked.
 */
export function buildQuestion (level, target, pairing, knobs) {
	const {item, form} = target;
	const tierId = tierIdFor(item.mode, level.max);

	return {
		mode: item.mode,
		tierId,
		pairingId: pairing.id,
		operands: item.operands.slice(),
		answer: item.answer,
		options: buildOptions(item.answer, knobs.distractor),
		// The level's form decides `preview`. `knobsFor` also has an opinion
		// about it, derived from mastery pressure; this overrides it on purpose,
		// so that what a level says it asks is what it asks.
		knobs: {...knobs, preview: showsPreviews(form) ? 'objects' : 'numbers'},
		form,
		levelId: level.id,
		quantity: item.quantity,
		skill: skillKey(item.mode, tierId),
		timeoutMs: TIMEOUT_BANDS[0],
		band: 0,
		key: item.id,
	};
}

/**
 * One question for a run, ready for the timeout band and the board.
 *
 * @param {object} deps
 *   `records`   the plain items object from storage
 *   `pickPairing`  chooses the art; the level does not constrain it, so the
 *                  figures stay varied across a run
 *   `knobsFor`  supplies density and distractor distance
 *   `rng`       injectable randomness
 */
export function nextInRun (run, deps) {
	const {records, pickPairing, knobsFor, rng = Math.random} = deps;
	const level = run.level;
	const target = chooseTarget(level, records, run, rng);
	if (!target)
		return null;

	const pairing = pickPairing();
	const knobs = knobsFor(target.item.mode, tierIdFor(target.item.mode, level.max));

	return buildQuestion(level, target, pairing, knobs);
}

/**
 * Fold one answered question into the run.
 *
 * @param {object} report what `scheduler.recordAnswer` returned
 * @param {boolean} [counts] false for a question that is not part of the run's
 *   quota — it still teaches, but it must not consume one of the level's
 *   questions or put the clear condition at risk.
 */
export function recordRunAnswer (run, q, outcome, report, counts = true) {
	if (!run.asked.includes(q.key))
		run.asked.push(q.key);

	if (report && report.improved)
		run.improvements.push({
			itemId: q.key,
			form: q.form,
			gradeBefore: report.gradeBefore,
			gradeAfter: report.gradeAfter,
			bestMsBefore: report.bestMsBefore,
			bestMsAfter: report.bestMsAfter,
		});

	if (!counts)
		return run;

	run.answered += 1;
	if (outcome === 'timeout')
		run.misses += 1;

	return run;
}

/**
 * What the result screen shows.
 *
 * Stars and unlocking are both recomputed from the records here rather than
 * accumulated during the run, so they say what is true now — including
 * improvements made on a question that came round twice.
 */
export function finishRun (run, records, {starsSeen = 0} = {}) {
	const level = run.level;
	const score = scoreLevel(level, records);
	const next = LEVELS[levelIndex(level.id) + 1] ?? null;

	return {
		levelId: level.id,
		stars: score.stars,
		starsGained: Math.max(0, score.stars - starsSeen),
		fluency: score.fluency,
		covered: score.covered,
		total: score.total,
		cleared: isClear(run),
		misses: run.misses,
		answered: run.answered,
		improvements: run.improvements.slice(),
		// Named only when this run is what completed the coverage: the map shows
		// the lock coming off, and it should do that once.
		unlocked: score.complete && next ? next.id : null,
	};
}
