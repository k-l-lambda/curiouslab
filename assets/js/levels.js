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
	// Ten is two signs, not one: a raised finger and a fist read as the digits
	// 1 and 0. No single hand shape says ten -- two open palms come closest but
	// shrink to an unreadable smudge at marker size, and a fist alone says zero
	// or nothing. Spelling it keeps the whole set hands, which is what makes the
	// signs legible to a child who cannot read the numerals.
	{id: 'b10', sign: '\u{261D}\u{FE0F}\u{270A}', max: 10},
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

/**
 * How long a question may sit unanswered before its presentation is softened.
 *
 * Measured on the answer stopwatch, not the countdown: the countdown is a band
 * that varies with the child's recent pace and restarts at half length on a
 * retry, so the same eight seconds of being stuck would arrive at a different
 * moment on every question. What this counts is time with the cards live and the
 * child looking at them, which is the thing being reacted to.
 */
export const SOFTEN_MS = 8000;

/**
 * One step down the presentation ladder: what to show when a child is stuck.
 *
 * `bare` gains the objects in the question, becoming `prompt`. `prompt` gains the
 * object previews on the answer cards, becoming `full`. `full` has nothing left to
 * reveal and is left alone — there is no state below it, and a child stuck on a
 * fully illustrated question needs the counting hint, which they already get.
 *
 * A question softens at most once. `bare` does not walk on to `full` after another
 * eight seconds: the reveal it got is the one it asked for, and stepping twice
 * would mean a child who waits long enough is never actually asked the question.
 */
export const SOFTER_FORM = {
	[FORMS.BARE]: FORMS.PROMPT,
	[FORMS.PROMPT]: FORMS.FULL,
};

export const softerForm = form => SOFTER_FORM[form] ?? null;

/** Whether this form has anything left to reveal. */
export const canSoften = form => Boolean(SOFTER_FORM[form]);

/**
 * The forms a level may ask for a mode, hardest last.
 *
 * A level declares `forms` per mode rather than once for the whole level,
 * because the modes do not arrive at the same time and so are not at the same
 * stage. Level three asks addition with numeral-only cards from its very first
 * question — the child already earned that with objects in level two — while
 * asking its brand-new subtraction with the objects still shown. One flat list
 * could not say that.
 *
 * The declaration is filtered against what the mode can actually be asked in,
 * so a level cannot accidentally request a bare counting question.
 */
export const allowedForms = (level, mode) =>
	(level.forms[mode] ?? []).filter(form => FORMS_BY_MODE[mode].includes(form));

/**
 * The modes a level asks, in the order its item set is built.
 *
 * Read off the `forms` map rather than declared twice, so a mode cannot exist
 * with no form to ask it in, or a form ladder with no mode to use it.
 */
export const modesOf = level => Object.keys(level.forms)
	.filter(mode => allowedForms(level, mode).length > 0);

/**
 * How much more often a mode is drawn than plain counting.
 *
 * Arithmetic is the thing being taught; counting is the ground it stands on and
 * is mostly already known by the time a level pairs the two. Without this, a
 * level's mix is decided purely by how many items each mode contributes, which
 * is an accident of the arithmetic — level four holds five counting questions
 * against ten additions for no reason anyone chose.
 */
export const MODE_WEIGHT = {count: 1, add: 2, sub: 2};

export const modeWeightOf = mode => MODE_WEIGHT[mode] ?? 1;

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
 * `clear` name the files it will be replaced by. They are different media on
 * purpose: `cover` is a still, and `clear` is a five-second video, because the
 * celebration is where a small story with a surprise in it belongs and a held
 * frame cannot carry one. The briefs for both are in `assets/levels/prompts.md`,
 * and the generated files sit beside them in `assets/levels/`.
 *
 * `maxErrors` is how many wrong taps one question may take before it is given
 * up as a miss. Per question, not per run, because that is what makes it the
 * companion of the timeout: both end the question the child is on, and both are
 * a way of running out on it rather than getting it wrong. A miss ends the
 * attempt — see `isFailure` — so this number is the whole safety margin a level
 * gives, and it tightens from three to two in the five band: the questions there
 * are ones the child has met before in the three band, and two tries on a
 * familiar sum still leaves room for a slip without leaving room for guessing
 * through a four-card question.
 *
 * `pairing` is the level's face on the map, not a constraint on its questions:
 * the cover art is drawn around these two figures, so the map needs to know
 * which they are. Inside a run the figures still vary question to question —
 * `nextInRun` picks those, and variety there is the point.
 *
 * `cast` is the constraint on that variety: the highest `familiarity` a pairing
 * may have to appear in this level at all. Without it the cast is gated only by
 * how many questions the child has answered in total, so a new pair added for a
 * late level would walk into level one as soon as the count went high enough —
 * and the early levels are where a small, repeated cast is the point. Raising it
 * is how new figures are introduced, and the level that raises it is the level
 * they debut in.
 *
 * `forms` is keyed by mode, and the modes it names are the modes the level asks:
 * the list is not declared separately. Each mode's array is a ladder, easiest
 * first, and where a mode starts on it is the level's difficulty knob — see
 * `allowedForms` and `formAvailable`.
 *
 * `questions` may exceed the item set, and does on level three: eight questions
 * over six items. `chooseTarget` sets aside what a run has already asked, so
 * repeats only begin once the set is exhausted.
 */
export const LEVELS = [
	{
		id: 'l1',
		cast: 5,
		band: 'b3',
		min: 1,
		max: 3,
		questions: 3,
		maxErrors: 3,
		forms: {count: [FORMS.FULL]},
		sprite: 'sp-cat',
		pairing: 'cat-fish',
		cover: 'l1-cover.webp',
		clear: 'l1-clear.mp4',
	},
	{
		id: 'l2',
		cast: 5,
		band: 'b3',
		min: 1,
		max: 3,
		questions: 5,
		maxErrors: 3,
		forms: {count: [FORMS.FULL], add: [FORMS.FULL, FORMS.PROMPT]},
		sprite: 'sp-monkey',
		pairing: 'monkey-banana',
		cover: 'l2-cover.webp',
		clear: 'l2-clear.mp4',
	},
	{
		// Arithmetic only, and the first level with no counting to fall back on.
		// Six items against eight questions, so a run repeats two of them —
		// intended, because there is no way to ask eight distinct sums under
		// three and the repetition is what makes a small set stick.
		//
		// Addition starts at `prompt`: the objects come off the answer cards on
		// the child's first question here, because level two already had them
		// answering these very sums with the objects shown. Subtraction is new,
		// so it starts where addition did, with everything visible.
		id: 'l3',
		cast: 5,
		band: 'b3',
		min: 1,
		max: 3,
		questions: 8,
		maxErrors: 3,
		forms: {
			add: [FORMS.PROMPT, FORMS.BARE],
			sub: [FORMS.FULL, FORMS.PROMPT],
		},
		sprite: 'sp-dog',
		pairing: 'dog-bone',
		cover: 'l3-cover.webp',
		clear: 'l3-clear.mp4',
	},
	{
		// The first level of the five band, and counting returns — not as
		// revision but because four and five are new quantities, and the child
		// has never counted them here.
		id: 'l4',
		cast: 5,
		band: 'b5',
		min: 1,
		max: 5,
		questions: 10,
		maxErrors: 2,
		forms: {
			count: [FORMS.FULL, FORMS.PROMPT],
			add: [FORMS.PROMPT, FORMS.BARE],
		},
		sprite: 'sp-rabbit',
		pairing: 'rabbit-carrot',
		cover: 'l4-cover.webp',
		clear: 'l4-clear.mp4',
	},
	{
		// Twenty-five items against ten questions: the widest level yet, and the
		// one that takes the most returning to finish. Everything the ladder has
		// taught is in play at once.
		id: 'l5',
		cast: 5,
		band: 'b5',
		min: 1,
		max: 5,
		questions: 10,
		maxErrors: 2,
		forms: {
			count: [FORMS.FULL, FORMS.PROMPT],
			add: [FORMS.PROMPT, FORMS.BARE],
			sub: [FORMS.FULL, FORMS.PROMPT],
		},
		sprite: 'sp-bird',
		pairing: 'bird-seed',
		cover: 'l5-cover.webp',
		clear: 'l5-clear.mp4',
	},
	{
		// The first level past five, and it asks only one thing: count a group
		// bigger than a hand. No arithmetic, because the number range is the new
		// skill here and pairing it with a second new skill would make a failure
		// unreadable -- neither the child nor the grown-up panel could say which
		// of the two was the trouble.
		//
		// Six items against twelve questions, and six items times its two forms is
		// exactly twelve item-forms, so a clean run can meet every one of them once.
		// `chooseTarget` sets aside what the run has already asked, so the repeats
		// only begin once the set is spent.
		id: 'l6',
		// The three new pairings debut here: pig-apple, mouse-cheese and hen-egg sit
		// at familiarity 6, 7 and 8, so raising the ceiling to 8 is what lets them on
		// screen -- and leaving every earlier level at 5 is what keeps them off it.
		cast: 8,
		band: 'b10',
		min: 5,
		max: 10,
		questions: 12,
		// Two, as in the five band. The rule there was that a familiar sum needs no
		// third try; here it is that counting eight objects wrongly is a miscount to
		// be tried again from the top, not a fact to be recalled -- and a third try
		// on four cards is enough to guess through.
		maxErrors: 2,
		forms: {count: [FORMS.FULL, FORMS.PROMPT]},
		sprite: 'sp-lamp',
		pairing: 'lamp-star',
		cover: 'l6-cover.webp',
		clear: 'l6-clear.mp4',
	},
	{
		// Addition returns, and this is the first level whose two modes work in
		// different ranges: counting to ten, adding to eight. The counting is the
		// part the child just spent a whole level on, so it is the wider of the two;
		// the arithmetic is the new thing here and starts below its own ceiling. A
		// single range would have forced one of the two to be wrong — sums to ten over
		// a set the child met one level ago, or counting capped at eight for no reason
		// the child could see.
		id: 'l7',
		cast: 8,
		band: 'b10',
		min: 1,
		max: 10,
		// Eight, not ten. `1 + 7` is the widest sum here, and the addends stay inside
		// what level 6 taught the child to count.
		ranges: {add: {max: 8}},
		questions: 12,
		// Two tries a question, as everywhere above the three band.
		maxErrors: 2,
		// Counting starts at `prompt` — one rung up from level 6, and the top of the
		// counting ladder, since a counting question written as a numeral would print
		// its own answer. Addition starts where levels 4 and 5 left it and keeps `bare`
		// above, which opens per question once the rung below it has been answered.
		forms: {count: [FORMS.PROMPT], add: [FORMS.PROMPT, FORMS.BARE]},
		sprite: 'sp-pig',
		pairing: 'pig-apple',
		cover: 'l7-cover.webp',
		clear: 'l7-clear.mp4',
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
// A level's `max` names a tier, and the tiers are the bands: 3, 5, 7, 10. An 8 is
// not a band of its own — it is a ceiling inside the ten band, which is what level 7
// asks for — so it maps to the ten tier deliberately. The fallback below would have
// landed there anyway; naming it means the next reader does not have to work out
// whether that was intended.
const TIER_BY_MAX = {3: 0, 5: 1, 7: 2, 8: 3, 10: 3};

export function tierIdFor (mode, max) {
	const tiers = TIERS[mode];
	const index = TIER_BY_MAX[max];

	return (tiers[index] ?? tiers[tiers.length - 1]).id;
}

/**
 * The number range one mode of a level works in.
 *
 * A level's `min`/`max` cover all its modes, which held while every level asked its
 * modes over one range. Level 7 does not: it counts to ten and adds to eight, because
 * the two are different skills and the wider one is the one already practised. So a
 * level may name `ranges` per mode, and anything it does not name falls back to the
 * level's own bounds — every level written before this reads exactly as it did.
 *
 * @param {object} level
 * @param {string} mode
 * @returns {{min: number, max: number}}
 */
export function rangeFor (level, mode) {
	const own = level.ranges?.[mode];

	return {
		min: own?.min ?? level.min,
		max: own?.max ?? level.max,
	};
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

	for (const mode of modesOf(level)) {
		// Per mode, because a level may cap its arithmetic below its counting — see
		// `rangeFor`.
		const {min, max} = rangeFor(level, mode);

		if (mode === 'count')
			for (let n = min; n <= max; ++n)
				items.push({id: itemId(mode, [n]), mode, operands: [n], answer: n, quantity: n});

		if (mode === 'add')
			for (let a = 1; a < max; ++a)
				for (let b = 1; a + b <= max; ++b)
					items.push({
						id: itemId(mode, [a, b]),
						mode,
						operands: [a, b],
						answer: a + b,
						quantity: a + b,
					});

		if (mode === 'sub')
			for (let total = 2; total <= max; ++total)
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
 * fluent.
 *
 * Those figures describe an item set graded evenly, and that is the whole reason
 * the unlock gate no longer reads coverage. It used to, on the calibration that
 * "every item correct at least once" lands at two stars — true only while the
 * grades are uniform. They are not: a mean can be carried by the fluent items, so
 * a level could reach three stars with two of its questions never answered, and
 * the child saw full stars above a locked level. The gate is `UNLOCK_STARS` now,
 * read off the same number the map paints.
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

/**
 * The star count to show for a level.
 *
 * `played` is not a formality. Levels share questions — level two's set contains
 * level one's three counting questions — and the gate that opens level two is
 * exactly those three being answered correctly. So the moment level two unlocks,
 * its own set already scores 3 x (2/3) / 6 = 0.333, over the first threshold: a
 * level nobody has touched would wear a star earned somewhere else. A level
 * therefore shows none until a run of it has been played through to a result — the caller
 * decides what counts, and `main.js` keys it on finished runs, so tapping in and
 * leaving again does not light one either. The star then arrives on that first
 * result screen, as a star genuinely won there.
 *
 * The underlying score is left alone. `scoreLevel` still answers for the whole
 * item set, which is what makes a replay able to raise stars, and `complete` —
 * `complete` — the coverage the result sheet shows — must keep accumulating across
 * levels regardless of what has been played.
 */
export function starsFor (level, records, {played = true} = {}) {
	if (!played)
		return 0;

	return scoreLevel(level, records).stars;
}

/**
 * Stars needed on a level to open the one after it.
 *
 * One. The gate used to be coverage — every question in the level answered
 * correctly at least once — and that was a different quantity from the one on
 * screen, which is what made it feel broken: stars are a *mean* over the item
 * set and coverage is an *and* over it, so a few fluent questions could carry the
 * mean to three stars while two questions had never been answered at all. The
 * child saw three stars and a locked level, with nothing on the map able to
 * explain the difference. Reading the gate off the star count the child is
 * already looking at means the map cannot lie about what is needed.
 */
export const UNLOCK_STARS = 1;

/**
 * Which levels are open.
 *
 * Derived rather than stored, so it cannot drift out of step with the records
 * and so it re-answers itself correctly after a migration. The first level is
 * always open; each later one opens once the level before it has earned
 * `UNLOCK_STARS`.
 *
 * The star count used is the one the map shows, which is why `played` has to be
 * supplied rather than assumed. Item sets overlap — level 2's set contains level
 * 1's — so an untouched level already scores against its own items on the
 * strength of the level below: mastering level 1 alone puts level 2 at one star
 * without it ever being opened. Gating on the computed score would therefore open
 * level 3 as well, two levels for one. `starsFor` returns 0 for a level with no
 * finished run, and that is what stops the cascade. A level must be played to
 * open the next one.
 *
 * `finished` is the second half of the gate and defaults to *nothing finished*
 * rather than to `played`. Falling back to `played` would read better at the call
 * site and was the first version of this, but it means a caller that forgets the
 * predicate silently gets the old stars-only rule back — a gate that fails open
 * when misconfigured. Defaulting to false instead makes a forgotten predicate show
 * up at once as levels that will not open, which is wrong in the direction someone
 * notices.
 *
 * `unlockAll` is the `?unlock` debug override. It is applied here, at the point
 * of asking, and never written back — a debug switch must not hand out progress
 * the child did not earn.
 *
 * @param {object} records item records, by item id
 * @param {object} [opts]
 * @param {boolean} [opts.unlockAll] the `?unlock` override
 * @param {(levelId: string) => boolean} [opts.played] has a run of this level been
 *   finished? Defaults to false for every level, so a caller that omits it gets the
 *   strict answer rather than a cascade.
 * @returns {Set<string>} level ids
 */
export function unlockedLevels (records,
		{unlockAll = false, played = () => false, finished = () => false} = {}) {
	const open = new Set();

	for (let i = 0; i < LEVELS.length; ++i) {
		const prev = LEVELS[i - 1];
		if (unlockAll || i === 0
				|| (finished(prev.id)
					&& starsFor(prev, records, {played: played(prev.id)}) >= UNLOCK_STARS))
			open.add(LEVELS[i].id);
		else
			break;
	}

	return open;
}

/* ------------------------------------------------------------------- runs */

/** A level that does not say otherwise gets this many tries at one question. */
export const DEFAULT_MAX_ERRORS = 3;

/**
 * How many wrong taps one question of this level may take.
 *
 * Read through a function rather than off the level, so a level table written
 * before this rule existed still behaves rather than handing `undefined` to a
 * comparison — where `errors >= undefined` is false and the budget silently
 * becomes infinite.
 */
export const maxErrorsOf = level => level?.maxErrors ?? DEFAULT_MAX_ERRORS;

/**
 * The two ways a question can be lost.
 *
 * A wrong answer is not one of them. The whole feedback sequence exists to let a
 * child correct themselves, and it would be strange to run it and then hold the
 * mistake against them. What ends a question is running out: out of time, or out
 * of tries. `error` is the outcome recorded when the last try is spent, so it
 * names the second kind — the child never produced the answer.
 */
export const MISS_OUTCOMES = new Set(['timeout', 'error']);
export const isMiss = outcome => MISS_OUTCOMES.has(outcome);

/**
 * One bounded attempt at a level.
 *
 * `misses` counts questions the child never got to the answer of — see
 * `MISS_OUTCOMES`. `timeouts` and `exhausted` split that total by cause. Only the
 * total decides anything; the split is carried out through `finishRun` so that a
 * run lost to the clock can be told from one lost to wrong answers without
 * replaying it, which is the difference a grown-up would want and the two numbers
 * are the only record of.
 */
export function startRun (level) {
	return {
		level,
		asked: [],
		answered: 0,
		misses: 0,
		timeouts: 0,
		exhausted: 0,
		improvements: [],
		startedAt: Date.now(),
	};
}

export const runRemaining = run => Math.max(0, run.level.questions - run.answered);
export const runComplete = run => run.answered >= run.level.questions;

/** The most stars a level can be worth. */
export const STARS_MAX = STAR_THRESHOLDS.length;

/**
 * Did this run clear the level?
 *
 * Nothing was lost — neither to the clock nor to the error budget — and at least
 * one question ended up better known than it had ever been. Getting everything
 * right is not on its own enough: the animation marks moving forward, not
 * marking time.
 *
 * Except at three stars, where the improvement is no longer asked for. This is not
 * a softening of the rule but the end of it: three stars means most of the item
 * set is already fluent, so the only way left to improve is to beat a personal
 * best that is already near the floor a child can physically produce. Without this
 * the celebration would become permanently unreachable on exactly the levels a
 * child has learned best — the harder they had worked, the less they would be
 * shown — and a clean run would end in silence. So mastery buys the story back: on
 * a fully-starred level, losing nothing is enough.
 *
 * @param {object} run
 * @param {number} [stars] the level's star count; 3 relaxes the rule
 */
export const isClear = (run, stars = 0) => run.misses === 0
	&& (run.improvements.length > 0 || stars >= STARS_MAX);

/**
 * Did this run end in failure?
 *
 * One lost question is enough. A miss used to cost only the clear, and the run
 * carried on through its remaining questions; now it ends the attempt, so the
 * two ways of losing a question are the two ways of losing a run.
 *
 * The reason for tying it to the attempt rather than the question: the run is
 * the unit a child can see the shape of. A level that asks ten questions and
 * quietly writes off the third teaches that the miss did not matter much, which
 * is the opposite of true — it has already cost the clear, and there is no way
 * to earn it back inside the same run. Ending there makes the cost legible and
 * makes starting again the thing to do about it.
 *
 * What failure does *not* do is take back what was learned. Every answer is
 * already written to the store as it happens, so a failed attempt keeps its
 * correct answers: item grades, best times and coverage all stand. The stars are
 * computed from those grades, so a lost run can still raise the star count on the
 * map — the answers were given, which losing does not make untrue, and taking them
 * back would mean a child could lose ground by playing.
 *
 * What it does cost is the next level. Stars alone used to open it, which meant a
 * failed attempt could unlock on the strength of the questions answered before the
 * miss; the gate now wants the run finished as well, so losing costs the unlock
 * until some run gets to the end. Both `finishRun` and `unlockedLevels` read that,
 * and they have to agree — one without the other either hides an unlock that
 * happens anyway or animates one that does not.
 *
 * @param {object} run
 */
export const isFailure = run => run.misses > 0;

/* ---------------------------------------------------------------- picking */

/**
 * Whether a form may be offered for an item yet.
 *
 * The gate exists because weakest-first weighting alone gets this exactly
 * backwards: a form never attempted has no record, so it looks maximally weak
 * and would be picked first — handing a child their very first sight of a
 * question in its hardest presentation. So each rung has to be earned: a form
 * opens once the one below it on this level's ladder has been answered right.
 *
 * The bottom rung is whatever the level starts this mode at, which is not
 * always `full`. Level three opens addition at `prompt` deliberately, and the
 * gate has to let that through rather than looking for a `full` record that
 * level was designed never to ask for.
 */
export function formAvailable (level, item, form, records) {
	const ladder = allowedForms(level, item.mode);
	const rung = ladder.indexOf(form);

	if (rung < 0)
		return false;

	if (rung === 0)
		return true;

	const below = formRecord(records[item.id], ladder[rung - 1]);

	return Boolean(below && below.correct > 0);
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

	// An item's pull is how much practice its open forms want, scaled by how
	// much the level wants that mode asked at all. The sum rather than the max,
	// because an item with two rungs still to climb does need more visits than
	// one with a single rung left.
	const byItem = pool.map(item => ({
		item,
		weight: modeWeightOf(item.mode) * allowedForms(level, item.mode)
			.filter(form => formAvailable(level, item, form, records))
			.reduce((sum, form) => sum + weightFor(item, form, records), 0),
	}));

	const chosen = weightedPick(byItem, rng);
	if (!chosen)
		return null;

	const item = chosen.item;
	const forms = allowedForms(level, item.mode)
		.filter(form => formAvailable(level, item, form, records))
		.map(form => ({form, weight: weightFor(item, form, records)}));

	const form = weightedPick(forms, rng);

	// The fallback is the level's own entry rung, not `full`: a level that never
	// asks `full` must not be handed it because a pick came back empty.
	return {item, form: form ? form.form : allowedForms(level, item.mode)[0]};
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
	// The mode's own ceiling, not the level's, so a mode that caps itself is filed
	// under the skill it is actually asking. Level 7's eight and ten both land on the
	// top tier, so nothing moves today; read this as the rule the next per-mode range
	// will need rather than as a fix for anything currently visible.
	const tierId = tierIdFor(item.mode, rangeFor(level, item.mode).max);

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
	// The mode's own ceiling here too, so density and distractor pressure come from
	// the same tier the record is filed under -- whichever tier that turns out to be.
	const knobs = knobsFor(target.item.mode,
		tierIdFor(target.item.mode, rangeFor(level, target.item.mode).max));

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
	if (isMiss(outcome)) {
		run.misses += 1;
		if (outcome === 'timeout')
			run.timeouts += 1;
		else
			run.exhausted += 1;
	}

	return run;
}

/**
 * What the result screen shows.
 *
 * Stars and unlocking are both recomputed from the records here rather than
 * accumulated during the run, so they say what is true now — including
 * improvements made on a question that came round twice.
 */
export function finishRun (run, records, {starsSeen = 0, nextWasOpen = false} = {}) {
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
		cleared: isClear(run, score.stars),
		failed: isFailure(run),
		misses: run.misses,
		timeouts: run.timeouts,
		exhausted: run.exhausted,
		answered: run.answered,
		improvements: run.improvements.slice(),
		// Named only when this run is what earned the unlock: the map shows the lock
		// coming off, and a lock can only come off once. The star count alone is true
		// of every later run of the same level too, so on its own it made the map
		// replay the unlock — and worse, it sent the child to the map at the end of
		// every such run, since `endRun` leaves the result sheet whenever an unlock is
		// named. `nextWasOpen` is the caller's snapshot from before the run, the same
		// shape as `starsSeen`: what the child had already been shown.
		//
		// No `played` argument needed here: the run being finished is what makes this
		// level played, so `score.stars` is already the number the map will show.
		// `!isFailure(run)` because losing the attempt does not open anything. The
		// stars are still real and still rise -- the answers given before the miss
		// stand -- but they are not on their own enough: the level has to be finished
		// too. Kept in step with `unlockedLevels`, which gates on the same thing
		// through its `finished` predicate; if only this reported the suppression the
		// animation would stop while the lock came off anyway on the next map draw.
		unlocked: !isFailure(run) && score.stars >= UNLOCK_STARS && next && !nextWasOpen
			? next.id
			: null,
	};
}
