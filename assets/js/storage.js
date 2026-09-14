/**
 * storage.js — local progress, skill mastery and item history.
 *
 * Phase one persists to localStorage only. Every record the adaptive policy
 * needs lives here; nothing leaves the device.
 */

const KEY = 'curiouslab.counting-pairs.v1';
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
	version: 1,
	created: Date.now(),
	updated: Date.now(),
	/** skillKey -> record */
	skills: {},
	/** pairingId -> record */
	pairings: {},
	/** itemKey -> record */
	items: {},
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
const emptyItem = () => ({seen: 0, errors: 0, timeouts: 0, lastSeen: 0, consecutive: 0});

let state = emptyState();
let saveTimer = null;

export function load () {
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed && parsed.version === 1)
				state = Object.assign(emptyState(), parsed);
		}
	}
	catch (err) {
		console.warn('progress could not be read, starting fresh', err);
		state = emptyState();
	}

	state.progress.sessions += 1;
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

export function item (key) {
	if (!state.items[key])
		state.items[key] = emptyItem();

	return state.items[key];
}

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
