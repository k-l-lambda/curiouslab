/**
 * scheduler.js — mode alternation, one-factor-at-a-time difficulty, and the
 * weighted item selection policy.
 *
 * The policy interleaves count / add / sub rather than running them as three
 * blocks, raises at most a couple of difficulty factors per step, and treats
 * the timeout band as its own dimension so "knew it but needed longer" never
 * looks like an arithmetic error.
 */

import {PAIRINGS, pairingById} from './pairings.js';
import * as store from './storage.js';
import {OUTCOME} from './storage.js';
import {
	MODES, TIERS, TIMEOUT_BANDS,
	generate, siblingOf, skillKey, tierIndex, pick, quantityOf,
} from './questions.js';
// One-way edge: levels.js imports neither this module nor storage.js, so the
// grading rules stay assertable on their own.
import {gradeFor} from './levels.js';

const UNLOCK_MASTERY = 0.8;
const UNLOCK_ATTEMPTS = 6;
const KNOB_MIN_ATTEMPTS = 4;
const BAND_ADVANCE_RUN = 3;
const MAX_SAME_MODE = 2;
const MAX_SAME_ITEM = 2;
const WEAKNESS_RATE = 0.4;

/** Session-local trail, not persisted: what the child just saw. */
const session = {
	modes: [],
	pairings: [],
	items: [],
	reinforceQueue: [],
	knobRotation: 0,
};

export const getSession = () => session;

function ensureSeedUnlocks () {
	for (const mode of MODES)
		store.skill(skillKey(mode, TIERS[mode][0].id)).unlocked = true;
}

/** Tiers currently available for a mode: unlocked ones, plus the next one. */
function availableTiers (mode) {
	ensureSeedUnlocks();
	const tiers = TIERS[mode];
	const open = [];

	for (let i = 0; i < tiers.length; ++i) {
		const rec = store.skill(skillKey(mode, tiers[i].id));
		if (rec.unlocked) {
			open.push(tiers[i]);
			continue;
		}

		const prev = i > 0 ? store.skill(skillKey(mode, tiers[i - 1].id)) : null;
		if (prev && prev.mastery >= UNLOCK_MASTERY && prev.attempts >= UNLOCK_ATTEMPTS) {
			rec.unlocked = true;
			open.push(tiers[i]);
		}
		break;
	}

	return open.length ? open : [tiers[0]];
}

/**
 * Difficulty knobs for a skill. Pressure grows with mastery, but only one knob
 * is raised per pressure step and the order rotates, so quantity, density,
 * distractor distance and label dependence never all jump together.
 *
 * The `preview` knob it sets is advisory. A level declares which presentation
 * forms it asks for, and `levels.buildQuestion` overwrites `preview` from the
 * chosen form after calling this — so on the level path, what the level says it
 * asks is what gets asked. Free practice is where this knob still decides.
 */
export function knobsFor (mode, tierId) {
	const rec = store.skill(skillKey(mode, tierId));
	const knobs = {density: 'sparse', distractor: 'far', preview: 'objects'};

	if (rec.attempts < KNOB_MIN_ATTEMPTS)
		return knobs;

	let pressure = 0;
	if (rec.mastery >= 0.55)
		pressure = 1;
	if (rec.mastery >= 0.72)
		pressure = 2;
	if (rec.mastery >= 0.88)
		pressure = 3;

	const order = ['distractor', 'density', 'preview'];
	const start = session.knobRotation % order.length;

	for (let i = 0; i < Math.min(pressure, 2); ++i) {
		const knob = order[(start + i) % order.length];
		if (knob === 'distractor')
			knobs.distractor = 'near';
		else if (knob === 'density')
			knobs.density = 'compact';
		// Number-only cards only once the child is clearly comfortable.
		else if (pressure >= 2)
			knobs.preview = 'numbers';
	}

	return knobs;
}

function modeSwitchBoost (mode) {
	const trail = session.modes;
	if (!trail.length)
		return 1;

	const last = trail[trail.length - 1];
	const run = [...trail].reverse().findIndex(m => m !== mode);
	const streak = run === -1 ? trail.length : run;

	// Hard block, not a damper: three of the same mode in a row should not be
	// reachable however the other weights fall.
	if (mode === last && streak >= MAX_SAME_MODE)
		return 0;

	return mode === last ? 0.45 : 1.6;
}

function pairingWeight (pairing) {
	const rec = store.pairingRecord(pairing.id);
	const trail = session.pairings;
	const recentIndex = trail.lastIndexOf(pairing.id);
	let weight = 1;

	// Familiar pairings first; newer art unlocks as the child plays.
	const gate = Math.floor(store.getState().progress.answered / 4);
	if (pairing.familiarity > gate + 1)
		weight *= 0.15;

	// Freshness: something not seen for a while is more interesting.
	if (recentIndex !== -1)
		weight *= [0.15, 0.35, 0.7][trail.length - 1 - recentIndex] ?? 1;

	if (!rec.seen)
		weight *= 1.4;

	return weight;
}

function skillScore (mode, tier) {
	const key = skillKey(mode, tier.id);
	const rec = store.skill(key);
	const errorRate = store.windowErrorRate(key);

	// Base difficulty: keep the child near their frontier, not at the floor.
	const frontier = availableTiers(mode).length - 1;
	const distance = Math.abs(tierIndex(mode, tier.id) - frontier);
	const base = [1, 0.55, 0.25, 0.12][Math.min(distance, 3)];

	const errorBoost = 1 + errorRate * 2.2;
	const timeoutBoost = 1 + (rec.attempts ? rec.timeouts / rec.attempts : 0) * 1.4;
	const ageMinutes = rec.lastSeen ? (Date.now() - rec.lastSeen) / 60000 : 30;
	const freshnessBoost = 1 + Math.min(ageMinutes / 10, 1) * 0.6;
	// Explore skills we know little about.
	const uncertaintyBoost = 1 + 0.9 / (1 + rec.attempts);
	const jitter = 0.85 + Math.random() * 0.3;

	// Mastered items stay in the mix, but quietly.
	const masteredDamp = rec.mastery >= 0.9 && errorRate === 0 ? 0.4 : 1;

	return base * errorBoost * timeoutBoost * freshnessBoost * uncertaintyBoost
		* masteredDamp * jitter;
}

function weightedPick (candidates) {
	if (!candidates.length)
		return null;

	const total = candidates.reduce((sum, c) => sum + c.weight, 0);
	if (total <= 0)
		return candidates[0];

	let roll = Math.random() * total;
	for (const c of candidates) {
		roll -= c.weight;
		if (roll <= 0)
			return c;
	}

	return candidates[candidates.length - 1];
}

/** The skill family with a real, current weakness — or null. */
function weakestSkill () {
	let worst = null;

	for (const mode of MODES) {
		for (const tier of TIERS[mode]) {
			const key = skillKey(mode, tier.id);
			const rec = store.getState().skills[key];
			if (!rec || rec.attempts < 3)
				continue;

			const rate = store.windowErrorRate(key);
			if (rate > WEAKNESS_RATE && (!worst || rate > worst.rate))
				worst = {mode, tier, rate};
		}
	}

	return worst;
}

/**
 * Apply the stored timeout band for this skill to a question.
 *
 * `relax` gives one band back, and level runs ask for it. Without it the rules
 * work against each other: the band tightens as a skill improves, while clearing
 * a level asks for no timeouts — so getting better at a level would make clearing
 * it harder, and a child could be timed out of the very level they had just
 * mastered. A level run is a statement about their counting, not about the clock
 * they earned in free practice.
 */
export function applyBand (q, {relax = false} = {}) {
	const rec = store.skill(q.skill);
	const band = relax ? Math.max(0, rec.band - 1) : rec.band;
	q.band = Math.min(band, TIMEOUT_BANDS.length - 1);
	q.timeoutMs = TIMEOUT_BANDS[q.band];
	// An unfamiliar pairing always gets the generous band.
	if (!store.pairingRecord(q.pairingId).seen) {
		q.band = 0;
		q.timeoutMs = TIMEOUT_BANDS[0];
	}

	return q;
}

/**
 * Mode-level weight. Deliberately independent of how many tiers the mode has
 * open: otherwise a mode still sitting on one tier is out-voted by the summed
 * weight of a mode with four, and alternation collapses.
 */
function modeWeight (mode, weak) {
	const tiers = availableTiers(mode);
	let need = 0;
	let attempts = 0;

	for (const tier of tiers) {
		const key = skillKey(mode, tier.id);
		const rec = store.skill(key);
		attempts += rec.attempts;
		need = Math.max(need, store.windowErrorRate(key));
	}

	// Under-practised modes pull harder; a weak mode gets a short run.
	const uncertainty = 1 + 1.2 / (1 + attempts / 4);
	const errorBoost = 1 + need * 1.8;
	const weakBoost = weak && weak.mode === mode ? 1.8 : 1;

	return modeSwitchBoost(mode) * uncertainty * errorBoost * weakBoost
		* (0.9 + Math.random() * 0.2);
}

/** Pick the next question. */
export function nextQuestion () {
	ensureSeedUnlocks();

	// A queued reinforcement question always comes first.
	if (session.reinforceQueue.length)
		return applyBand(session.reinforceQueue.shift());

	const weak = weakestSkill();

	// 1. mode, so count / add / sub genuinely alternate
	const modeChoice = weightedPick(MODES.map(mode => ({
		mode,
		weight: modeWeight(mode, weak),
	})));
	const mode = (modeChoice ?? {mode: pick(MODES)}).mode;

	// 2. tier within the mode
	const tierChoice = weightedPick(availableTiers(mode).map(tier => ({
		tier,
		weight: Math.max(skillScore(mode, tier), 0.001),
	})));
	const tier = tierChoice.tier;

	// 3. pairing
	const pairingChoice = weightedPick(PAIRINGS.map(pairing => ({
		pairing,
		weight: Math.max(pairingWeight(pairing), 0.001),
	})));
	let pairing = pairingChoice.pairing;

	let q = generate(mode, tier, pairing, knobsFor(mode, tier.id));

	// Never show the same exact item more than twice in a row: re-roll the
	// pairing and operands, keeping the chosen skill.
	let guard = 0;
	while (guard++ < 12) {
		const tail = session.items.slice(-MAX_SAME_ITEM);
		const repeated = tail.length === MAX_SAME_ITEM && tail.every(k => k === q.key);
		if (!repeated && store.item(q.key).consecutive < MAX_SAME_ITEM)
			break;

		pairing = weightedPick(PAIRINGS.map(p => ({
			pairing: p,
			weight: Math.max(pairingWeight(p), 0.001),
		}))).pairing;
		q = generate(mode, tier, pairing, knobsFor(mode, tier.id));
	}

	return applyBand(q);
}

function updateMastery (rec, outcome) {
	const deltas = {
		[OUTCOME.FIRST_TRY]: () => rec.mastery + (1 - rec.mastery) * 0.26,
		[OUTCOME.AFTER_HELP]: () => rec.mastery + (1 - rec.mastery) * 0.1,
		[OUTCOME.ERROR]: () => rec.mastery - rec.mastery * 0.22,
		// A timeout costs less than a wrong answer: the arithmetic may be fine.
		[OUTCOME.TIMEOUT]: () => rec.mastery - rec.mastery * 0.08,
		[OUTCOME.SKIPPED]: () => rec.mastery,
	};

	rec.mastery = Math.max(0.02, Math.min(1, (deltas[outcome] ?? (() => rec.mastery))()));
}

/**
 * Record one answer and let it move the policy.
 * @param {object} q
 * @param {string} outcome one of OUTCOME
 * @param {number} elapsedMs
 * @param {number} [errorCount] wrong taps made before the round resolved
 */
/**
 * Record one answer, move the policy on, and report what the answer changed.
 *
 * @param {object} q the question just answered
 * @param {string} outcome one of OUTCOME
 * @param {{answerMs: number|null, roundMs: number}} timing
 *   `answerMs` is the child's own time on the card they settled on, and is null
 *   when nobody ever got it right. `roundMs` is everything spent on the question.
 *   Passed as an object rather than a bare number so that a caller which has not
 *   been updated fails loudly instead of quietly recording `undefined`.
 * @param {number} [errorCount]
 * @returns {{improved: boolean, gradeBefore: number, gradeAfter: number,
 *            bestMsBefore: number, bestMsAfter: number, firstEverCorrect: boolean,
 *            itemId: string, form: string}}
 */
export function recordAnswer (q, outcome, timing, errorCount = 0) {
	if (!timing || typeof timing !== 'object')
		throw new TypeError('recordAnswer: timing must be {answerMs, roundMs}');

	const answerMs = timing.answerMs;
	const state = store.getState();
	const rec = store.skill(q.skill);
	const pRec = store.pairingRecord(q.pairingId);
	const iRec = store.item(q.key);
	// Every question has a presentation; free practice questions are `full`
	// unless the knobs took the previews away.
	const form = q.form ?? (q.knobs?.preview === 'numbers' ? 'prompt' : 'full');
	const fRec = store.itemForm(q.key, form);
	// Snapshot before anything moves: grade is computed from the record rather
	// than stored on it, so "what it was" has to be captured, not read back.
	const before = {...fRec};
	const now = Date.now();

	rec.attempts += 1;
	rec.lastSeen = now;
	pRec.seen += 1;
	pRec.lastSeen = now;
	iRec.seen += 1;
	iRec.lastSeen = now;

	const correct = outcome === OUTCOME.FIRST_TRY || outcome === OUTCOME.AFTER_HELP;

	if (outcome === OUTCOME.FIRST_TRY)
		rec.firstTry += 1;
	if (errorCount > 0) {
		rec.errors += errorCount;
		pRec.errors += errorCount;
		iRec.errors += errorCount;
	}
	if (outcome === OUTCOME.TIMEOUT) {
		rec.timeouts += 1;
		iRec.timeouts += 1;
	}

	/* ---- this exact question, in this exact presentation ---- */

	fRec.seen += 1;
	fRec.lastSeen = now;

	if (correct) {
		// What opens the next level, and it is set here for any correct answer:
		// with help or without, the child produced the right number.
		iRec.everCorrect = true;
		fRec.correct += 1;
		if (answerMs != null)
			fRec.lastMs = Math.round(answerMs);
	}

	if (outcome === OUTCOME.FIRST_TRY && answerMs != null) {
		fRec.firstTry += 1;
		// Only an unaided answer sets the best time. One that followed a counting
		// hint would be measuring the hint.
		if (!fRec.bestMs || answerMs < fRec.bestMs)
			fRec.bestMs = Math.round(answerMs);
	}

	// Both ways of never reaching the answer. `OUTCOME.ERROR` is what a level run
	// records when the question's error budget runs out, and for this record it
	// means the same thing a timeout does: the child left without it.
	if (outcome === OUTCOME.TIMEOUT || outcome === OUTCOME.ERROR)
		fRec.misses += 1;

	// A question solved only after help counts against the recent window, so it
	// keeps raising future practice probability rather than looking mastered.
	rec.window.push(outcome === OUTCOME.FIRST_TRY);
	if (rec.window.length > 8)
		rec.window.shift();

	updateMastery(rec, outcome);

	// Timeout band: tighten only after a run of comfortable first-try answers,
	// and give time back immediately after a timeout.
	if (outcome === OUTCOME.FIRST_TRY && answerMs != null && answerMs < q.timeoutMs * 0.6) {
		rec.fastRun += 1;
		if (rec.fastRun >= BAND_ADVANCE_RUN && rec.band < TIMEOUT_BANDS.length - 1) {
			rec.band += 1;
			rec.fastRun = 0;
		}
	}
	else if (outcome === OUTCOME.TIMEOUT) {
		rec.band = Math.max(0, rec.band - 1);
		rec.fastRun = 0;
	}
	else if (!correct)
		rec.fastRun = 0;

	// Progress, garden and streak.
	state.progress.answered += 1;
	state.progress.playedQuestions += 1;
	session.knobRotation += 1;

	if (correct) {
		// The garden grows for any correct answer; the streak only counts
		// unaided ones, so the passing run stays meaningful.
		state.progress.garden += 1;
		if (outcome === OUTCOME.FIRST_TRY) {
			state.progress.firstTryCorrect += 1;
			state.progress.streak += 1;
			state.progress.bestStreak = Math.max(state.progress.bestStreak, state.progress.streak);
		}
		else
			state.progress.streak = 0;
	}
	else
		// Partial reset: the run resets, the learned history does not.
		state.progress.streak = 0;

	// Session trail.
	session.modes.push(q.mode);
	session.pairings.push(q.pairingId);
	session.items.push(q.key);
	for (const trail of [session.modes, session.pairings, session.items])
		if (trail.length > 12)
			trail.shift();

	const tail = session.items.slice(-MAX_SAME_ITEM - 1);
	iRec.consecutive = tail.filter(k => k === q.key).length;

	// After a miss, queue one gentler sibling instead of replaying the same item.
	//
	// Not on the level path. A level run asks a fixed number of questions, and an
	// injected extra would either eat one of them — leaving some of the level's own
	// questions unasked, which is exactly what the coverage gate counts — or make
	// the length of a run unpredictable. `siblingOf` also steps down a tier to find
	// something easier, which can land outside the level's range entirely. Levels
	// do their own weighting instead: a missed question simply carries more weight
	// into the next run.
	if ((!correct || errorCount > 0) && !q.reinforcement && !q.levelId)
		session.reinforceQueue.push(siblingOf(q, pairingById(q.pairingId)));

	store.pushRecent({
		at: now,
		mode: q.mode,
		tier: q.tierId,
		pairing: q.pairingId,
		operands: q.operands.slice(),
		answer: q.answer,
		outcome,
		errorCount,
		// Null when nobody answered. Rounded only for storage; the comparison
		// above uses the real value.
		elapsedMs: answerMs == null ? null : Math.round(answerMs),
		roundMs: Math.round(timing.roundMs ?? 0),
		form,
		levelId: q.levelId ?? null,
		band: q.band,
	});

	store.save();

	const quantity = q.quantity ?? quantityOf(q.mode, q.operands);
	const gradeBefore = gradeFor(before, quantity);
	const gradeAfter = gradeFor(fRec, quantity);

	return {
		itemId: q.key,
		form,
		gradeBefore,
		gradeAfter,
		bestMsBefore: before.bestMs ?? 0,
		bestMsAfter: fRec.bestMs,
		firstEverCorrect: correct && !before.correct,
		// Either the child reached a rung they had not reached before, or they beat
		// their own best time on this question. Both count as getting better, and
		// either one is enough to clear a level.
		improved: gradeAfter > gradeBefore
			|| (fRec.bestMs > 0 && before.bestMs > 0 && fRec.bestMs < before.bestMs),
	};
}

export {TIMEOUT_BANDS};
