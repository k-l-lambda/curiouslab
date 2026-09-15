/**
 * storage.js — local progress, skill mastery and item history.
 *
 * Phase one persists to localStorage only. Every record the adaptive policy
 * needs lives here; nothing leaves the device.
 */

/**
 * The key keeps its `.v1` suffix while the payload inside is at version 2, which
 * looks like a mistake and is not. The suffix is the *storage slot*; changing it
 * would orphan every child's existing history behind a name nothing reads any
 * more. The version inside the payload is what says how to interpret it, and
 * that is what `load()` migrates on.
 */
const KEY = 'curiouslab.counting-pairs.v1';
const VERSION = 2;
const SAVE_DEBOUNCE = 400;

/** Outcome kinds. Timeout is recorded separately from an arithmetic error. */
export const OUTCOME = {
	FIRST_TRY: 'firstTry',
	AFTER_HELP: 'afterHelp',
	ERROR: 'error',
	TIMEOUT: 'timeout',
	SKIPPED: 'skipped',
};

const emptyState = () => ({
	version: VERSION,
	created: Date.now(),
	updated: Date.now(),
	/** skillKey -> record */
	skills: {},
	/** pairingId -> record */
	pairings: {},
	/** itemId -> record */
	items: {},
	/** levelId -> record */
	levels: {},
	progress: {
		garden: 0,
		streak: 0,
		bestStreak: 0,
		answered: 0,
		firstTryCorrect: 0,
		sessions: 0,
		playedQuestions: 0,
	},
	/** rolling log of the most recent answers, newest last */
	recent: [],
});

const emptySkill = () => ({
	attempts: 0,
	firstTry: 0,
	errors: 0,
	timeouts: 0,
	mastery: 0.35,
	/** timeout band index into TIMEOUT_BANDS */
	band: 0,
	fastRun: 0,
	lastSeen: 0,
	unlocked: false,
	/** newest-last window of booleans */
	window: [],
});

const emptyPairing = () => ({seen: 0, errors: 0, lastSeen: 0});

/**
 * One concrete question — `count:3`, `add:2+3` — across every way of showing it.
 *
 * `everCorrect` is what opens the next level, and it is deliberately recorded
 * here rather than per form: getting `2+3` right once proves the arithmetic,
 * whichever way it was put on screen.
 */
const emptyItem = () => ({
	everCorrect: false,
	seen: 0,
	errors: 0,
	timeouts: 0,
	lastSeen: 0,
	consecutive: 0,
	/** form name -> record */
	forms: {},
});

/**
 * The same question in one presentation.
 *
 * `bestMs` is only ever written from an unaided answer. A correct answer that
 * followed a counting hint measures how long the hint took, not how well the
 * child knows the question.
 */
const emptyForm = () => ({
	seen: 0,
	correct: 0,
	firstTry: 0,
	misses: 0,
	bestMs: 0,
	lastMs: 0,
	lastSeen: 0,
});

/**
 * Per level. Only what cannot be recomputed is kept: stars and unlocking are
 * derived from the item records every time the map is drawn, so they rise on
 * their own as the child gets better without anything having to remember to
 * update them. `starsSeen` is the highest star count already celebrated, so a
 * newly earned star can be shown as new exactly once.
 */
const emptyLevel = () => ({
	cleared: false,
	starsSeen: 0,
	runs: 0,
	bestRun: null,
	lastPlayed: 0,
});

let state = emptyState();
let saveTimer = null;

/**
 * Fill a parsed blob out to the current shape.
 *
 * A plain `Object.assign` is a shallow merge, which happens to work only as long
 * as every nested object is either wholly present or wholly absent. The moment a
 * field is added inside `progress` or inside a record, an older blob starts
 * yielding `undefined` for it — silently, at read time. So each sub-object gets
 * filled through its own factory.
 */
function hydrate (parsed) {
	const fresh = emptyState();
	const out = Object.assign(fresh, parsed);

	out.version = VERSION;
	out.progress = Object.assign(emptyState().progress, parsed.progress);
	out.skills = parsed.skills ?? {};
	out.pairings = parsed.pairings ?? {};
	out.recent = Array.isArray(parsed.recent) ? parsed.recent : [];

	out.items = {};
	for (const [id, rec] of Object.entries(parsed.items ?? {})) {
		const item = Object.assign(emptyItem(), rec);
		item.forms = {};
		for (const [form, fRec] of Object.entries(rec.forms ?? {}))
			item.forms[form] = Object.assign(emptyForm(), fRec);
		out.items[id] = item;
	}

	out.levels = {};
	for (const [id, rec] of Object.entries(parsed.levels ?? {}))
		out.levels[id] = Object.assign(emptyLevel(), rec);

	return out;
}

/**
 * v1 -> v2.
 *
 * Item keys used to carry the tier they happened to be drawn from
 * (`add:a2:2+3`); identity is now tier-free (`add:2+3`), so several old keys can
 * collapse onto one new one — `count 3` was reachable from both `c1` and `c2`.
 * Counts are summed on the way in.
 *
 * What survives: every skill record (mastery, timeout band, the first-try
 * window), every pairing record, all of `progress`, the recent answer log, and
 * each item's seen/error/timeout counts. So the grown-up panel keeps its whole
 * history and nobody's earned timeout bands reset.
 *
 * What cannot: `everCorrect` starts false for every item, and there are no form
 * records or best times. A v1 record counted attempts and errors but never
 * whether an attempt actually succeeded, so there is no honest way to seed it —
 * inferring it from `errors === 0 && seen > 0` would hand out level unlocks the
 * child never earned. The visible consequence is that an existing player starts
 * the ladder with level one open and no stars, while keeping every number the
 * grown-up panel shows.
 */
function migrateV1 (parsed) {
	const items = {};

	for (const [oldKey, rec] of Object.entries(parsed.items ?? {})) {
		const parts = oldKey.split(':');
		// `mode:tierId:operands` -> `mode:operands`. Anything not in that shape is
		// left as it is rather than guessed at.
		const id = parts.length === 3 ? `${parts[0]}:${parts[2]}` : oldKey;
		const into = items[id] ?? emptyItem();

		into.seen += rec.seen ?? 0;
		into.errors += rec.errors ?? 0;
		into.timeouts += rec.timeouts ?? 0;
		into.lastSeen = Math.max(into.lastSeen, rec.lastSeen ?? 0);
		// Session-local: the scheduler rewrites it from the session trail anyway.
		into.consecutive = 0;
		items[id] = into;
	}

	return {...parsed, version: VERSION, items, levels: {}};
}

export function load () {
	let migrated = false;

	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			let parsed = JSON.parse(raw);
			if (parsed && parsed.version === 1) {
				parsed = migrateV1(parsed);
				migrated = true;
			}
			if (parsed && parsed.version === VERSION)
				state = hydrate(parsed);
		}
	}
	catch (err) {
		console.warn('progress could not be read, starting fresh', err);
		state = emptyState();
		migrated = false;
	}

	state.progress.sessions += 1;

	// A migration is written synchronously rather than through the debounce: it
	// is the only copy of a rewritten history, and a tab closed inside 400ms
	// would otherwise leave it to be redone from the original next time.
	if (migrated)
		flush();
	else
		save();

	return state;
}

export function save () {
	state.updated = Date.now();
	clearTimeout(saveTimer);
	saveTimer = setTimeout(flush, SAVE_DEBOUNCE);
}

export function flush () {
	clearTimeout(saveTimer);
	saveTimer = null;
	try {
		localStorage.setItem(KEY, JSON.stringify(state));
	}
	catch (err) {
		console.warn('progress could not be saved', err);
	}
}

export const getState = () => state;

export function reset () {
	state = emptyState();
	flush();

	return state;
}

export function skill (key) {
	if (!state.skills[key])
		state.skills[key] = emptySkill();

	return state.skills[key];
}

export function pairingRecord (id) {
	if (!state.pairings[id])
		state.pairings[id] = emptyPairing();

	return state.pairings[id];
}

export function item (id) {
	if (!state.items[id])
		state.items[id] = emptyItem();

	return state.items[id];
}

/** One question in one presentation; created on first sight. */
export function itemForm (id, form) {
	const rec = item(id);
	if (!rec.forms[form])
		rec.forms[form] = emptyForm();

	return rec.forms[form];
}

export function level (id) {
	if (!state.levels[id])
		state.levels[id] = emptyLevel();

	return state.levels[id];
}

/**
 * The raw items object, for the rules in `levels.js` to read.
 *
 * Handed over as a plain object on purpose: those rules are pure functions of
 * records, which is what lets them be asserted without a browser or a store.
 */
export const itemRecords = () => state.items;

/** Error rate over the recent window; 0 when the skill is unseen. */
export function windowErrorRate (key) {
	const rec = state.skills[key];
	if (!rec || !rec.window.length)
		return 0;

	const wrong = rec.window.filter(ok => !ok).length;

	return wrong / rec.window.length;
}

export function pushRecent (entry) {
	state.recent.push(entry);
	if (state.recent.length > 60)
		state.recent.shift();
}

// Never lose the last answer to a tab switch or a closed lid.
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden')
		flush();
});
