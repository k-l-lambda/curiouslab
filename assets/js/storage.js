/**
 * storage.js — local progress, skill mastery and item history.
 *
 * Progress lives in IndexedDB, with a localStorage mirror. Every record the
 * adaptive policy needs is here; nothing leaves the device.
 *
 * IndexedDB is the store of record because it is the one with room to grow: the
 * per-item, per-form history is already the largest thing here and it grows with
 * every question the child meets, while localStorage is a few megabytes shared
 * across the whole origin and throws once that is spent.
 *
 * The mirror is not belt-and-braces. IndexedDB writes are asynchronous, and a tab
 * being closed or discarded is not obliged to wait for a transaction to commit —
 * so the last answer of a session, the one that just earned the star, is exactly
 * the write most likely to be dropped. `localStorage.setItem` is synchronous and
 * has landed by the time it returns. So each flush writes both: IndexedDB for
 * capacity, localStorage so `pagehide` cannot lose the newest answer. `load()`
 * takes whichever copy is newer, which is also what carries an existing player's
 * localStorage-only history into IndexedDB on first run.
 */

/**
 * The key keeps its `.v1` suffix while the payload inside is at version 2, which
 * looks like a mistake and is not. The suffix is the *storage slot*; changing it
 * would orphan every child's existing history behind a name nothing reads any
 * more. The version inside the payload is what says how to interpret it, and
 * that is what `load()` migrates on. The IndexedDB record uses the same string as
 * its key, so the two copies are visibly the same slot.
 */
const KEY = 'curiouslab.counting-pairs.v1';
const VERSION = 2;
const SAVE_DEBOUNCE = 400;

/**
 * The database is named for the site, not the game: one database with a record
 * per game keeps a second game from having to open a second connection, and an
 * upgrade only has to be reasoned about in one place.
 */
const DB_NAME = 'curiouslab';
const DB_VERSION = 1;
const STORE = 'progress';

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

/* ------------------------------------------------------------- indexeddb */

let dbPromise = null;

/**
 * The connection, opened once and shared.
 *
 * Resolves to `null` rather than rejecting when IndexedDB cannot be used —
 * private browsing modes and locked-down profiles both refuse it, and in a game
 * for children a refused database has to mean "keep playing against the mirror",
 * never a broken page. Every caller therefore checks for null instead of
 * catching.
 */
function openDb () {
	if (dbPromise)
		return dbPromise;

	dbPromise = attempt(DB_VERSION);

	return dbPromise;
}

/**
 * One open attempt, at a given version.
 *
 * Split out because of a state the database can genuinely be left in: existing at
 * the expected version but without the object store. `indexedDB.open(name)` with
 * no version *creates* the database at version 1 with no stores, so anything on
 * this origin that opens it that way — a sibling game sharing `curiouslab`, a
 * console poke, a devtools panel — gets there first and `onupgradeneeded` then
 * never fires for us. Every write would fail for the lifetime of the profile,
 * silently, with the game running on the mirror and no sign anything was wrong.
 * So a missing store is repaired by reopening one version higher, which is the
 * only way to be handed an upgrade transaction.
 *
 * `version` may be `undefined`, which opens whatever is on disk rather than
 * asking for a number. That is the recovery path when the database has already
 * been pushed past our version by something else on the origin.
 */
function attempt (version) {
	return new Promise(resolve => {
		let req;
		try {
			req = indexedDB.open(DB_NAME, version);
		}
		catch (err) {
			console.warn('IndexedDB unavailable, using the localStorage mirror', err);

			return resolve(null);
		}

		req.onupgradeneeded = () => {
			// Out-of-line keys: the record is the saved blob exactly as the rest of
			// this module builds it, so no key field has to be threaded through the
			// state shape to satisfy the database.
			if (!req.result.objectStoreNames.contains(STORE))
				req.result.createObjectStore(STORE);
		};
		req.onsuccess = async () => {
			const db = req.result;

			if (!db.objectStoreNames.contains(STORE)) {
				// Bumping the version is what earns an upgrade transaction. Close first
				// or our own connection blocks it.
				const next = db.version + 1;
				db.close();

				return resolve(await attempt(next));
			}

			// A second tab opening a newer version needs this one to let go, or that
			// tab's upgrade blocks until this page is closed.
			db.onversionchange = () => {
				db.close();
				dbPromise = null;
			};
			resolve(db);
		};
		req.onerror = async () => {
			// The database is already past the version we asked for. That is what a
			// sibling game sharing `curiouslab` leaves behind when it adds its own
			// store and bumps the version — our store may or may not be in there.
			// Reopening with no version at all is the only way to be handed whatever
			// is actually on disk, and from there the missing-store path above can do
			// its job. `version` undefined means exactly that, and is not the same as
			// asking for version 1.
			if (req.error && req.error.name === 'VersionError' && version !== undefined)
				return resolve(await attempt(undefined));

			console.warn('IndexedDB could not be opened, using the localStorage mirror', req.error);
			resolve(null);
		};
		// Another tab is mid-upgrade and holding the old version open. Nothing to do
		// but proceed on the mirror; the next load gets the database.
		req.onblocked = () => resolve(null);
	});
}

/** The stored blob, or null when there is none or it cannot be read. */
async function readDb () {
	const db = await openDb();
	if (!db)
		return null;

	return new Promise(resolve => {
		try {
			const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => resolve(null);
		}
		catch (err) {
			console.warn('progress could not be read from IndexedDB', err);
			resolve(null);
		}
	});
}

/**
 * Write the blob.
 *
 * Takes a snapshot rather than `state` itself. IndexedDB structured-clones the
 * value when the transaction commits, not when `put` is called, so handing it the
 * live object would store whatever the child had done by that later moment — with
 * an `updated` stamp from before it.
 */
async function writeDb (snapshot) {
	const db = await openDb();
	if (!db)
		return false;

	return new Promise(resolve => {
		try {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).put(snapshot, KEY);
			tx.oncomplete = () => resolve(true);
			tx.onerror = () => {
				console.warn('progress could not be saved to IndexedDB', tx.error);
				resolve(false);
			};
			tx.onabort = () => resolve(false);
		}
		catch (err) {
			console.warn('progress could not be saved to IndexedDB', err);
			resolve(false);
		}
	});
}

/* ------------------------------------------------------------ load / save */

/** The mirror copy, or null. Parsing failures are treated as no copy at all. */
function readMirror () {
	try {
		const raw = localStorage.getItem(KEY);

		return raw ? JSON.parse(raw) : null;
	}
	catch (err) {
		console.warn('the progress mirror could not be read', err);

		return null;
	}
}

/**
 * Whichever copy is newer.
 *
 * They disagree in exactly two ordinary situations, and picking the later
 * `updated` handles both: an existing player whose history is localStorage-only
 * (no database copy yet), and a session whose final answer made it into the
 * synchronous mirror but not into the transaction that was still open when the
 * tab went away. A blob with no `updated` at all is treated as oldest, so a
 * corrupt or hand-edited copy cannot win against a real one.
 */
function newerOf (a, b) {
	if (!a)
		return b;
	if (!b)
		return a;

	return (b.updated ?? 0) > (a.updated ?? 0) ? b : a;
}

/**
 * Read the save and count this session.
 *
 * Asynchronous because IndexedDB is. Everything that reads state afterwards
 * stays synchronous — `state` is a plain object held here, and this is the only
 * function that has to wait for anything — so callers await once at boot and
 * nothing else in the game has to know where the records came from.
 *
 * @returns {Promise<object>} the live state
 */
export async function load () {
	let migrated = false;

	try {
		let parsed = newerOf(readMirror(), await readDb());
		if (parsed && parsed.version === 1) {
			parsed = migrateV1(parsed);
			migrated = true;
		}
		// Assigned in both directions, so this function always reports the stores
		// rather than whatever `state` happened to hold. Unreadable copies read as
		// a new player, which is what a fresh page already saw; being explicit is
		// what makes a second `load` in one process mean the same thing as the
		// first.
		state = parsed && parsed.version === VERSION ? hydrate(parsed) : emptyState();
	}
	catch (err) {
		console.warn('progress could not be read, starting fresh', err);
		state = emptyState();
		migrated = false;
	}

	state.progress.sessions += 1;

	// A migration is written without waiting for the debounce: it is the only copy
	// of a rewritten history, and a tab closed inside 400ms would otherwise leave
	// it to be redone from the original next time. The same call also seeds the
	// database from a mirror-only save, which is how an existing player's history
	// moves across without a separate import step.
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

/**
 * Write both copies now.
 *
 * Stays synchronous to call, and the mirror write has landed by the time it
 * returns, because `pagehide` handlers get no chance to await. The returned
 * promise is for tests and for `reset`, where it matters that the database has
 * actually been written before anything reads it again.
 *
 * @returns {Promise<boolean>} whether the IndexedDB write committed
 */
export function flush () {
	clearTimeout(saveTimer);
	saveTimer = null;

	// Serialised once and used twice: the string goes to the mirror, and parsing it
	// back gives the database a snapshot frozen at this instant. Both copies are
	// then provably the same bytes, and the flush runs on every answer, so doing
	// the work once matters.
	const json = JSON.stringify(state);
	const snapshot = JSON.parse(json);

	try {
		localStorage.setItem(KEY, json);
	}
	catch (err) {
		// Out of quota, or storage denied. The database is the store of record and
		// may well still accept it, so this is not fatal.
		console.warn('the progress mirror could not be written', err);
	}

	return writeDb(snapshot);
}

export const getState = () => state;

/**
 * Erase everything.
 *
 * An empty state is written over both copies rather than the records being
 * deleted. Deleting would leave the other copy standing as the newer of the two —
 * `load` takes whichever has the later `updated`, so a wiped database next to an
 * untouched mirror would restore the history the grown-up just erased. An empty
 * state stamped now is unambiguously the newest thing in both stores.
 *
 * Synchronous for its caller, which repaints immediately: the mirror is already
 * written when this returns, and the panel reads `state`, not the stores.
 */
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

// Never lose the last answer to a tab switch or a closed lid. Both handlers are
// why the mirror exists: neither can await, so the IndexedDB write started here
// may not commit, while the synchronous localStorage write always has. Whichever
// of the two survives, `load` picks it up by timestamp.
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden')
		flush();
});
