/**
 * main.js — the two views, the round loop, HUD, timer bands, pause and the
 * parent panel.
 *
 * The map is the entrance: a level is chosen there, which starts a bounded run
 * on the board, which ends in a result. Play surface rules: numerals and
 * arithmetic symbols are allowed, prose is not. Every control is an icon. The
 * parent panel is the only place with text, and it is closed during normal play.
 */

import {injectSprites, sprite} from '../../assets/js/art.js';
import * as store from '../../assets/js/storage.js';
import {OUTCOME} from '../../assets/js/storage.js';
import * as sched from '../../assets/js/scheduler.js';
import {TIMEOUT_BANDS, TIERS, skillKey} from '../../assets/js/questions.js';
import {PAIRINGS, pairingById} from '../../assets/js/pairings.js';
import * as levels from '../../assets/js/levels.js';
import * as board from './board.js';
import * as map from './map.js';

const STREAK_STARS = 5;
const GARDEN_MAX = 14;
const AUTO_SUBMIT_MS = 900;
const HINT_AFTER_ERRORS = 2;
/**
 * Floor for a recorded answer time. A card tapped during the entrance animation
 * would otherwise read as 0ms, which is not a time a child can produce; it also
 * keeps a "fastest ever" comparison from latching onto an unbeatable zero.
 */
const MIN_ANSWER_MS = 250;

const dom = {};
const ui = {
	question: null,
	handles: null,
	// timing
	startedAt: 0,
	remainingMs: 0,
	timerId: null,
	tickId: null,
	// round state
	errors: 0,
	selected: null,
	autoSubmitId: null,
	resolving: false,
	// true while a feedback animation is playing: input is closed, but the
	// round is not over and the clock is stopped.
	feedback: false,
	paused: false,
	usedHelp: false,
	/**
	 * The stopwatch reading taken the moment the child settled on a card, in
	 * milliseconds. Read at selection rather than at confirmation because
	 * AUTO_SUBMIT_MS sits between the two, and that wait is the interface's,
	 * not the child's.
	 */
	answerMs: null,
	/** True between startTimer and clearTimers, so pauseTimer knows there is a clock. */
	timerRunning: false,
	/**
	 * Incremented for every round, and for every view swap. An async
	 * continuation captures it and checks it before touching the DOM, so a
	 * sequence that outlives its round can never act on the next one — nor, now,
	 * land a board animation on top of the map.
	 */
	generation: 0,
	/** 'map' or 'play'. */
	view: 'map',
	/** The run in progress, from `levels.startRun`, or null in free play. */
	run: null,
	/** Stars the child had already been shown for this level before the run. */
	starsSeen: 0,
	/** Debug: `?unlock` opens every level without touching the saved progress. */
	unlockAll: false,
};

/** True when `gen` is still the round on screen, and the board is still up. */
const current = gen => gen === ui.generation && !ui.paused && ui.view === 'play';

/* --------------------------------------------------------------- plumbing */

const clearTimers = () => {
	clearTimeout(ui.timerId);
	cancelAnimationFrame(ui.tickId);
	clearTimeout(ui.autoSubmitId);
	ui.timerId = null;
	ui.tickId = null;
	ui.autoSubmitId = null;
	ui.timerRunning = false;
};

/* ------------------------------------------------- the answer stopwatch */

/**
 * How long the child has actually been looking at this question with the cards
 * live. Deliberately not derived from the countdown, which cannot answer it:
 * a retry restarts that clock on half a band, the entrance runs before it, and
 * the feedback sequence stops it on purpose. What a best time compares is this.
 */
const clock = {accumMs: 0, since: 0};

const clockRead = () =>
	clock.accumMs + (clock.since ? performance.now() - clock.since : 0);

const clockStart = () => {
	if (!clock.since)
		clock.since = performance.now();
};

const clockStop = () => {
	if (clock.since) {
		clock.accumMs += performance.now() - clock.since;
		clock.since = 0;
	}
};

const clockReset = () => {
	clock.accumMs = 0;
	clock.since = 0;
};

/**
 * Reveal one step of the presentation when a question has gone unanswered.
 *
 * Fired off the answer stopwatch at `levels.SOFTEN_MS`. `bare` gains the objects
 * in the question; `prompt` gains the previews on the answer cards. Nothing else
 * about the round changes: the clock keeps running, the options stay as they were,
 * and the child's selection if they have one is left alone.
 *
 * The cost is on the record, not on the child. A softened question cannot improve
 * its grade or its best time no matter how it ends — see `recordAnswer` — because
 * what was answered is not the question that was asked. Coverage still counts: the
 * child did produce the right number, and coverage asks only that.
 *
 * @returns {boolean} whether anything was revealed
 */
function soften () {
	const q = ui.question;
	if (!q || q.softened || !levels.canSoften(q.form))
		return false;

	const shown = q.form === levels.FORMS.BARE
		? board.revealObjects(ui.handles, q)
		: board.revealChoiceObjects(ui.handles, q);
	if (!shown)
		return false;

	// Marked on the question rather than on `ui`, so it travels with it into
	// `recordAnswer` and cannot be lost by a repaint or a pause.
	q.softened = true;
	q.shownForm = levels.softerForm(q.form);

	return true;
}

/**
 * Has this question been sat on long enough to deserve a reveal?
 *
 * Not once a card is chosen. A choice waits `AUTO_SUBMIT_MS` for its confirmation,
 * so a child who picks at 7.9s has their answer land at 8.8s — and without this
 * the reveal would fire into that gap and strip the credit off a question they
 * answered in time. The stopwatch already stopped at the moment they chose; this
 * is the same rule applied to the reveal.
 */
const softenDue = () => ui.question && !ui.question.softened && !ui.selected
	&& levels.canSoften(ui.question.form) && clockRead() >= levels.SOFTEN_MS;

function iconButton (iconId, label, onClick) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'icon-btn';
	// Icons carry the meaning on screen; the label is for assistive tech only.
	btn.setAttribute('aria-label', label);
	btn.append(sprite(iconId));
	btn.addEventListener('click', onClick);

	return btn;
}

/* -------------------------------------------------------------- HUD parts */

function buildHud () {
	const hud = dom.hud;
	hud.textContent = '';

	dom.pauseBtn = iconButton('ic-pause', 'pause', togglePause);
	dom.hintBtn = iconButton('ic-hint', 'hint', onHint);
	dom.undoBtn = iconButton('ic-undo', 'undo', onUndo);
	dom.confirmBtn = iconButton('ic-check', 'confirm', onConfirm);
	dom.parentBtn = iconButton('ic-gear', 'grown-up panel', openParent);
	// Back to the map, not out to the hub. From inside a level the map is what
	// "home" means: it is where the child came from and where the rest of the
	// levels are. A button rather than a link, because it no longer navigates.
	dom.homeBtn = iconButton('ic-home', 'back to the map', leaveRun);

	dom.streak = document.createElement('div');
	dom.streak.className = 'streak';
	for (let i = 0; i < STREAK_STARS; ++i)
		dom.streak.append(sprite('sp-star'));

	// How far through the level's questions this run is. Separate from the streak
	// strip on purpose: the streak is about answering well, this is about how much
	// is left, and one strip meaning both would mean neither.
	dom.runStrip = document.createElement('div');
	dom.runStrip.className = 'run-strip';
	dom.runStrip.hidden = true;

	dom.timer = buildTimer();

	const spacer = document.createElement('div');
	spacer.className = 'hud-spacer';

	hud.append(dom.pauseBtn, dom.hintBtn, dom.undoBtn, dom.confirmBtn, spacer,
		dom.runStrip, dom.streak, dom.timer, dom.parentBtn, dom.homeBtn);
}

/**
 * Leave a level part-way through.
 *
 * The run is abandoned, not finished: no result screen, no stars ceremony, no
 * clear. Nothing is lost that was earned, though — every answer was already
 * written to storage as it happened, so mastery, best times and the coverage that
 * opens the next level all survive. What the child gives up is only this run's
 * chance at clearing, which is the honest price of not finishing it.
 */
function leaveRun () {
	showMap();
}

/**
 * The map's own HUD: no play controls, because there is no round to control.
 *
 * This is where the link out of the game lives. The play view's home button goes
 * to the map instead, so leaving the site entirely is deliberately two taps from
 * inside a question rather than one.
 */
function buildMapHud () {
	const hud = dom.mapHud;
	hud.textContent = '';

	const home = document.createElement('a');
	home.className = 'icon-btn';
	home.href = '../../index.html';
	home.setAttribute('aria-label', 'home');
	home.append(sprite('ic-home'));

	const spacer = document.createElement('div');
	spacer.className = 'hud-spacer';

	hud.append(spacer, iconButton('ic-gear', 'grown-up panel', openParent), home);
}

function buildTimer () {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('class', 'timer');
	svg.setAttribute('viewBox', '0 0 100 100');
	svg.setAttribute('aria-hidden', 'true');

	const mk = cls => {
		const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		c.setAttribute('cx', '50');
		c.setAttribute('cy', '50');
		c.setAttribute('r', '42');
		c.setAttribute('class', cls);

		return c;
	};

	const track = mk('track');
	const bar = mk('bar');
	const circumference = 2 * Math.PI * 42;
	bar.style.strokeDasharray = String(circumference);
	bar.style.strokeDashoffset = '0';
	svg.dataset.circumference = String(circumference);
	svg.append(track, bar);
	dom.timerBar = bar;

	return svg;
}

function paintTimer (fraction) {
	const c = Number(dom.timer.dataset.circumference);
	dom.timerBar.style.strokeDashoffset = String(c * (1 - Math.max(0, Math.min(1, fraction))));
	dom.timer.classList.toggle('low', fraction < 0.25);
}

function paintStreak () {
	const streak = store.getState().progress.streak % STREAK_STARS;
	const full = store.getState().progress.streak > 0 && streak === 0;
	[...dom.streak.children].forEach((star, i) => {
		star.classList.toggle('lit', full || i < streak);
	});
}

/**
 * Repaint the run strip: one pip per question the level asks, filled for each
 * one answered. The strip takes a `missed` class the moment a question is lost,
 * which is visible for the length of the walkthrough that follows — the last
 * thing the strip does before the attempt ends, since a miss now ends it.
 */
function paintRun () {
	if (!dom.runStrip)
		return;

	dom.runStrip.hidden = !ui.run;
	if (!ui.run)
		return;

	const {questions} = ui.run.level;
	if (dom.runStrip.children.length !== questions) {
		dom.runStrip.textContent = '';
		for (let i = 0; i < questions; ++i) {
			const pip = document.createElement('span');
			pip.className = 'run-pip';
			dom.runStrip.append(pip);
		}
	}

	[...dom.runStrip.children].forEach((pip, i) => {
		pip.classList.toggle('done', i < ui.run.answered);
	});
	dom.runStrip.classList.toggle('missed', ui.run.misses > 0);
	dom.runStrip.setAttribute('aria-label',
		`question ${Math.min(ui.run.answered + 1, questions)} of ${questions}`);
}

function paintGarden (sprouted) {
	const {garden} = store.getState().progress;
	const shown = Math.min(garden, GARDEN_MAX);
	const existing = dom.garden.children.length;

	if (existing > shown || garden === 0) {
		dom.garden.textContent = '';
		for (let i = 0; i < shown; ++i)
			dom.garden.append(sprite('sp-flower'));

		return;
	}

	for (let i = existing; i < shown; ++i) {
		const flower = sprite('sp-flower', sprouted ? 'sprout' : '');
		dom.garden.append(flower);
	}
}

/* ------------------------------------------------------------- the timer */

function startTimer (ms) {
	ui.remainingMs = ms;
	ui.startedAt = performance.now();
	const total = ui.question.timeoutMs;

	const tick = () => {
		if (ui.paused || ui.resolving)
			return;

		// Checked here rather than on a timer of its own: this loop already starts
		// when the cards go live, stops for a pause and for the feedback sequence,
		// and dies with the round. A separate setTimeout would have to be taught
		// each of those, and would fire over a question that had already moved on.
		if (softenDue() && !ui.feedback)
			soften();

		const left = ms - (performance.now() - ui.startedAt);
		ui.remainingMs = left;
		paintTimer(left / total);
		if (left > 0)
			ui.tickId = requestAnimationFrame(tick);
	};
	ui.tickId = requestAnimationFrame(tick);
	ui.timerId = setTimeout(onTimeout, ms);
	ui.timerRunning = true;
}

function pauseTimer () {
	// Only spend time against a clock that was actually running. A pause during
	// the entrance animation would otherwise subtract from `startedAt` left by
	// the previous round, driving remainingMs negative — and resume() only
	// restarts a clock with time left on it, so the question would end up with
	// no clock at all and could never time out.
	const running = ui.timerRunning;
	clearTimers();
	clockStop();
	if (running)
		ui.remainingMs -= performance.now() - ui.startedAt;
}

/* ----------------------------------------------------------- round flow */

/**
 * The next question, from the run if one is in progress.
 *
 * A run's question comes from the level's own item set; free practice keeps the
 * scheduler's whole-ladder policy. Both then go through `applyBand`, and a run
 * asks it to relax: see the note on `applyBand` for why a tightening band would
 * otherwise fight the clear rule.
 */
function drawQuestion () {
	if (!ui.run)
		return sched.nextQuestion();

	const q = levels.nextInRun(ui.run, {
		records: store.itemRecords(),
		// The level fixes the arithmetic, not the cast. Varying the figures
		// across a run keeps six questions from reading as one question asked
		// six times.
		pickPairing: pickPairing,
		knobsFor: sched.knobsFor,
	});

	return q ? sched.applyBand(q, {relax: true}) : null;
}

/**
 * Which figures the next question wears.
 *
 * The level's own pair leads, because that is the one on its map node, but a run
 * of six identical scenes is a run a child stops looking at. Familiarity order
 * still applies to the alternatives, so nothing arrives before its turn.
 */
function pickPairing () {
	const own = pairingById(ui.run?.level?.pairing ?? '');
	const gate = Math.floor(store.getState().progress.answered / 4) + 1;
	const pool = PAIRINGS.filter(p => p.familiarity <= gate);
	const options = pool.length ? pool : [PAIRINGS[0]];

	if (own && Math.random() < 0.5)
		return own;

	return options[Math.floor(Math.random() * options.length)];
}

function nextRound () {
	clearTimers();
	ui.generation += 1;
	const q = drawQuestion();
	// A run with nothing left to ask is a finished run, not a broken one.
	if (!q) {
		endRun();

		return;
	}

	ui.question = q;
	ui.errors = 0;
	ui.selected = null;
	ui.resolving = false;
	ui.feedback = false;
	ui.usedHelp = false;
	ui.answerMs = null;
	// The countdown state is reset too. It never was, so a pause before the
	// clock started reached back into the previous round's timestamp.
	ui.remainingMs = 0;
	ui.startedAt = 0;
	clockReset();

	// Entrance shortens as the child gets used to the scene, so it never
	// becomes a delay.
	const played = store.getState().progress.playedQuestions;
	const enterScale = played > 24 ? 0.55 : played > 10 ? 0.75 : 1;

	ui.handles = board.render(dom.board, ui.question, {enterScale});
	ui.handles.buttons.forEach(btn => {
		btn.addEventListener('click', () => onChoice(btn));
	});

	dom.confirmBtn.disabled = true;
	dom.undoBtn.disabled = true;
	dom.hintBtn.disabled = false;
	paintTimer(1);
	paintStreak();
	paintRun();

	// The clock only starts once the scene has settled.
	const gen = ui.generation;
	setTimeout(() => {
		if (current(gen) && !ui.resolving && !ui.feedback) {
			startTimer(ui.question.timeoutMs);
			clockStart();
		}
	}, ui.handles.entranceMs);
}

function onChoice (btn) {
	if (ui.resolving || ui.feedback || ui.paused || btn.disabled)
		return;

	// Tapping the selected card again undoes the choice.
	if (ui.selected === btn) {
		onUndo();

		return;
	}

	ui.selected = btn;
	// Taken now, while the choice is fresh: AUTO_SUBMIT_MS elapses before
	// onConfirm runs, and that wait belongs to the interface. Choosing again
	// after an undo deliberately keeps the clock running — hesitation is part
	// of how long the question took.
	ui.answerMs = Math.max(MIN_ANSWER_MS, Math.round(clockRead()));
	board.select(btn, ui.handles.buttons);
	dom.confirmBtn.disabled = false;
	dom.undoBtn.disabled = false;

	// Submit on its own shortly after, so the child sees the selected state
	// but does not have to find a second control.
	clearTimeout(ui.autoSubmitId);
	ui.autoSubmitId = setTimeout(onConfirm, AUTO_SUBMIT_MS);
}

function onUndo () {
	if (ui.resolving || ui.feedback || !ui.selected)
		return;

	clearTimeout(ui.autoSubmitId);
	board.deselect(ui.handles.buttons);
	ui.selected = null;
	dom.confirmBtn.disabled = true;
	dom.undoBtn.disabled = true;
}

async function onConfirm () {
	if (ui.resolving || ui.feedback || !ui.selected)
		return;

	clearTimeout(ui.autoSubmitId);
	const btn = ui.selected;
	const value = Number(btn.dataset.value);
	const q = ui.question;

	if (value === q.answer) {
		ui.resolving = true;
		clearTimers();
		await resolveCorrect(btn);

		return;
	}

	await resolveWrong(btn);
}

async function resolveCorrect (btn) {
	const q = ui.question;
	const gen = ui.generation;
	board.lockChoices(ui.handles);
	dom.confirmBtn.disabled = true;
	dom.undoBtn.disabled = true;
	dom.hintBtn.disabled = true;

	clockStop();
	// `answerMs` is the child's own time on the card they settled on; `roundMs`
	// is everything they spent on the question. A best time compares the first.
	//
	// The old reading here was `q.timeoutMs - ui.remainingMs`, which cannot
	// answer either question: a retry restarts the countdown on half a band, the
	// entrance runs before the countdown exists, and the 900ms auto-submit wait
	// landed inside the measurement.
	const timing = {answerMs: ui.answerMs, roundMs: Math.round(clockRead())};
	// A timeout ends its own round, so by here the child has answered without
	// running out of time; only errors and help can hold this back.
	const outcome = ui.errors === 0 && !ui.usedHelp
		? OUTCOME.FIRST_TRY
		: OUTCOME.AFTER_HELP;

	const report = sched.recordAnswer(q, outcome, timing, ui.errors);
	if (ui.run)
		levels.recordRunAnswer(ui.run, q, outcome, report, !q.reinforcement);
	paintStreak();
	paintRun();
	paintGarden(true);

	await board.success(ui.handles, q, btn);
	// The generation check, not `current`: a finished run leaves the play view,
	// and this continuation is what takes it there.
	if (gen !== ui.generation)
		return;

	if (ui.run && levels.runComplete(ui.run))
		endRun();
	else
		nextRound();
}

/**
 * The encouragement screen, then whatever comes next.
 *
 * In a level run, both kinds of miss end the attempt: the encouragement screen
 * plays and the child goes back to the map with the run recorded as failed. It
 * used to end only the question and carry on through the rest of them, which
 * made a lost question a bookkeeping detail — the clear was already gone by
 * then, and nothing about the remaining questions could bring it back.
 *
 * Free practice has no run to fail, so there a miss still just ends the question
 * and the next one follows.
 *
 * @param {string} cause `'timeout'` or `'error'`
 */
async function afterMiss (gen, cause) {
	if (!ui.run) {
		nextRound();

		return;
	}

	await map.playMiss(dom.miss, ui.run.level, cause);

	// The check is after the screen, not before: it holds for over a second, and
	// the child can leave for the map inside that time — in which case the run is
	// already over and `failRun` would be undoing a state it does not own.
	if (gen !== ui.generation)
		return;

	await failRun();
}

/**
 * The attempt is lost. Record it, then hand the child back the map.
 *
 * No result sheet. The sheet is for an attempt that produced something to read —
 * stars gained, questions improved, a level opened — and a failed run has none of
 * that to show; putting one up would make the child dismiss a panel to be told
 * they got nothing. The encouragement screen has already said the one thing there
 * is to say, and it says it in pictures.
 *
 * What still gets written:
 *
 * - `runs`, because this was an attempt the child saw through to an outcome, and
 *   `runs > 0` is what lets the map show stars at all. A level played and lost
 *   that still read as untouched would be a lie about what happened.
 * - Nothing else. `starsSeen` stays where it was so any stars earned here are
 *   still new the next time a result sheet can show them properly; `cleared` and
 *   `bestRun` describe attempts that went well, and this one did not.
 *
 * Per-item progress needs no help from here — `recordAnswer` writes every answer
 * as it lands. So the questions answered correctly before the miss still count,
 * including toward the coverage that opens the next level. A run can therefore
 * fail and unlock in the same breath, and when it does the unlock still plays:
 * the child is being sent to the map anyway, the lock is genuinely off, and
 * holding that back until some later successful run would be hiding a thing they
 * earned.
 */
async function failRun () {
	const run = ui.run;
	if (!run)
		return showMap();

	clearTimers();
	clockStop();
	const records = store.itemRecords();
	const result = levels.finishRun(run, records, {starsSeen: ui.starsSeen});
	const rec = store.level(run.level.id);
	rec.runs += 1;
	store.save();

	ui.run = null;
	ui.question = null;
	const gen = ui.generation;
	showMap();

	if (result.unlocked && gen === ui.generation)
		await map.playUnlock(dom.mapHost, result.unlocked);
}

/**
 * The question is over, with the answer never produced: the error budget is spent.
 *
 * The correct card is shown before moving on. That is the whole reason this is a
 * separate path from a wrong answer that still has tries left — the child has
 * stopped being asked, so leaving the question unanswered on screen would teach
 * nothing and end on a blank. It matters more now than it did: in a level run
 * this is the last question of the attempt, so this walkthrough is the last thing
 * the child is shown before the encouragement screen and the map.
 */
async function giveUp (q, gen) {
	ui.resolving = true;
	ui.feedback = false;
	clearTimers();
	clockStop();

	// `OUTCOME.ERROR` rather than a timeout: the clock was not what ran out, and
	// the band must not be handed time back over a question the child had plenty
	// of time for.
	const report = sched.recordAnswer(q, OUTCOME.ERROR,
		{answerMs: null, roundMs: Math.round(clockRead())}, ui.errors);
	if (ui.run)
		levels.recordRunAnswer(ui.run, q, OUTCOME.ERROR, report, !q.reinforcement);
	paintStreak();
	paintRun();

	// Same as the timeout walkthrough: show which card it was, count it out, and
	// leave the picture rather than the mistake as the last thing on screen.
	board.scaffold(ui.handles, q);
	await board.correspondenceHint(ui.handles, ui.handles.buttons.find(
		b => Number(b.dataset.value) === q.answer));
	if (gen !== ui.generation)
		return;

	board.lockChoices(ui.handles);
	await afterMiss(gen, OUTCOME.ERROR);
}

async function resolveWrong (btn) {
	const q = ui.question;
	const gen = ui.generation;

	// The clock stops for the whole feedback sequence: the counting hint can run
	// for seconds, and it must not be spent out of the child's thinking time.
	clearTimers();
	clockStop();
	ui.feedback = true;
	ui.errors += 1;
	ui.selected = null;
	dom.confirmBtn.disabled = true;
	dom.undoBtn.disabled = true;

	// A number-only question has nothing on screen to count, so the hints that
	// follow would all run against an empty panel. Bring the objects out first.
	//
	// And count that as a softening, exactly as the eight-second timer would. The
	// reveal is the same reveal: from here on the child is answering with the
	// objects in front of them, so the record must not credit them with the form
	// that was withholding them. Without this, tapping any wrong card would be a
	// quicker way to get the objects than waiting for them, and would still earn
	// full credit for the harder form — which would leave the timer rule meaning
	// almost nothing on the form it matters most for.
	if (board.revealObjects(ui.handles, q)) {
		q.softened = true;
		q.shownForm = levels.softerForm(q.form);
	}

	// Carry the chosen number out before anything else: the child sees what
	// that many objects actually does to the figures, which is the reason it is
	// wrong. Only then does the card come back.
	await board.wrongReveal(ui.handles, Number(btn.dataset.value), btn);
	if (!current(gen))
		return;

	// Calm and instructional: the card comes back, the choices stay open.
	await board.retry(btn);
	if (!current(gen))
		return;

	await board.countingHint(ui.handles);
	if (!current(gen))
		return;

	// Out of tries. The level says how many one question gets, and this is the
	// second way a question can be lost — the companion of the clock running out.
	// Checked after the counting hint so the child still gets the walkthrough for
	// the try they just spent, and only in a run: free practice has no budget to
	// spend, and nothing there would be gained by closing a question early.
	if (ui.run && ui.errors >= levels.maxErrorsOf(ui.run.level)) {
		await giveUp(q, gen);

		return;
	}

	if (ui.errors >= HINT_AFTER_ERRORS) {
		// Still stuck: show part of the reasoning, leave the last step to the child.
		ui.usedHelp = true;
		board.scaffold(ui.handles, q);
		await board.correspondenceHint(ui.handles, ui.handles.buttons.find(
			b => Number(b.dataset.value) === q.answer));
		if (!current(gen))
			return;
	}

	ui.feedback = false;

	// A retry gets a fresh half-band, so it is never a race.
	startTimer(Math.max(ui.remainingMs, q.timeoutMs * 0.5));
	clockStart();
}

async function onTimeout () {
	// A timeout must never land during feedback: the clock is stopped there.
	if (ui.resolving || ui.feedback)
		return;

	// Nor may it take a question the child has already answered. A card chosen in
	// the last moments waits AUTO_SUBMIT_MS for its confirmation, and the band can
	// expire inside that wait — recording a miss for an answer that is sitting
	// there selected, and in a level run breaking the clear over it.
	if (ui.selected) {
		clearTimeout(ui.autoSubmitId);
		await onConfirm();

		return;
	}

	ui.resolving = true;
	clearTimers();
	clockStop();

	const gen = ui.generation;
	const q = ui.question;
	// Recorded as a timeout, not an arithmetic error: the child may have known it.
	// `answerMs` is null rather than the band: nobody produced an answer, and a
	// band length recorded as a time would poison the best-time comparison.
	const report = sched.recordAnswer(q, OUTCOME.TIMEOUT,
		{answerMs: null, roundMs: Math.round(clockRead())}, ui.errors);
	if (ui.run)
		levels.recordRunAnswer(ui.run, q, OUTCOME.TIMEOUT, report, !q.reinforcement);
	paintStreak();
	paintRun();

	// Same reason as a wrong answer: a number-only question needs its objects
	// before a counting walkthrough can walk over anything. Not marked as a
	// softening, unlike the wrong-answer reveal: the answer has already been
	// recorded a few lines above and the attempt is over, so there is nothing left
	// for it to be credited against. The objects here are for the walkthrough
	// alone.
	board.revealObjects(ui.handles, q);

	// A gentle counting walkthrough, then the encouragement screen, then a fresh
	// question with more time.
	await board.countingHint(ui.handles);
	board.lockChoices(ui.handles);
	await new Promise(resolve => setTimeout(resolve, 500));
	if (gen !== ui.generation)
		return;

	await afterMiss(gen, OUTCOME.TIMEOUT);
}

async function onHint () {
	if (ui.resolving || ui.feedback || ui.paused)
		return;

	const gen = ui.generation;
	ui.usedHelp = true;
	dom.hintBtn.disabled = true;
	await board.countingHint(ui.handles);
	if (current(gen))
		dom.hintBtn.disabled = false;
}

/* --------------------------------------------------------------- views */

/**
 * Swap views.
 *
 * The generation bump is the important part: every board animation checks it
 * before touching the DOM, so leaving the play view cancels whatever was still
 * in flight rather than letting it land on the map.
 */
function showView (name) {
	ui.generation += 1;
	ui.view = name;
	clearTimers();
	clockStop();
	ui.paused = false;
	dom.pause.hidden = true;
	// Every overlay belongs to a round, so none may outlive the view. The result
	// sheet is the one that matters: Escape out of it goes to the map, and without
	// this it would sit over the map with its own buttons still the only way out.
	dom.result.hidden = true;
	// The encouragement screen is mid-run by definition, so leaving takes it with
	// us. Its own timer resolves into a generation check and finds nothing to do.
	dom.miss.hidden = true;
	dom.mapView.hidden = name !== 'map';
	dom.playView.hidden = name !== 'play';
}

function levelView () {
	const records = store.itemRecords();
	const unlocked = levels.unlockedLevels(records, {unlockAll: ui.unlockAll});
	const stars = new Map();
	const cleared = new Set();

	for (const level of levels.LEVELS) {
		const rec = store.level(level.id);
		// A level shows stars only once a run of it has been finished. Sets overlap,
		// so an untouched level can already score against its own items on the
		// strength of the level before it; see `starsFor`.
		stars.set(level.id, levels.starsFor(level, records, {played: rec.runs > 0}));
		if (rec.cleared)
			cleared.add(level.id);
	}

	return {unlocked, stars, cleared, unlockAll: ui.unlockAll, onPick: startLevel};
}

function showMap () {
	ui.run = null;
	showView('map');
	// Board flyers park on <body>, so they would hang over the map; the board
	// clears its own strays rather than main.js reaching into its DOM.
	board.teardown();
	map.render(dom.mapHost, levelView());
	paintRun();
}

/**
 * Tapping a level: its cover first, the first question only once the child asks.
 *
 * The cover is a door rather than a delay. It shows where they are about to be,
 * and it is the reason the clear video afterwards reads as the same place — the
 * clip starts from this exact frame. Backing out here costs nothing: no run has
 * started, so nothing is recorded and no star is at stake.
 */
function startLevel (levelId) {
	const level = levels.levelById(levelId);
	if (!level)
		return;

	map.renderCover(dom.cover, level, {
		onStart: () => {
			dom.cover.hidden = true;
			beginRun(level);
		},
		onBack: () => {
			dom.cover.hidden = true;
			// Straight back to the map, which is still drawn underneath.
			showMap();
		},
	});
	dom.cover.hidden = false;
}

function beginRun (level) {
	const rec = store.level(level.id);
	// Snapshot before the run, so the result can tell a star won just now from
	// one the child already had.
	ui.starsSeen = rec.starsSeen;
	rec.lastPlayed = Date.now();
	ui.run = levels.startRun(level);

	showView('play');
	nextRound();
}

/* -------------------------------------------------------------- the result */

async function endRun () {
	const run = ui.run;
	if (!run)
		return showMap();

	clearTimers();
	clockStop();
	const records = store.itemRecords();
	const result = levels.finishRun(run, records, {starsSeen: ui.starsSeen});
	const rec = store.level(run.level.id);

	// Counted here rather than at the start, so `runs` means runs the child saw
	// through to a result. Two things depend on that reading: it is what gets
	// persisted (nothing saves between starting a level and finishing one), and it
	// is the gate on showing stars — tapping into a level and leaving again should
	// not light up a star that the level before it earned.
	rec.runs += 1;

	// Persist what the child has now been shown, so the next result only pops the
	// stars that are genuinely new.
	rec.starsSeen = Math.max(rec.starsSeen, result.stars);
	if (result.cleared)
		rec.cleared = true;
	if (!rec.bestRun || result.stars > rec.bestRun.stars)
		rec.bestRun = {stars: result.stars, at: Date.now(), misses: result.misses};
	store.save();

	ui.run = null;
	ui.question = null;
	paintRun();

	const gen = ui.generation;
	map.renderResult(dom.result, result, {
		onReplay: () => {
			dom.result.hidden = true;
			// Through the cover again, not straight into a question. The same door
			// every time is what makes it a door.
			startLevel(result.levelId);
		},
		onMap: () => {
			dom.result.hidden = true;
			showMap();
		},
	});
	dom.result.hidden = false;

	// The level's own clip, and `endRun` waits for it — which is what keeps an
	// unlock from cutting the story off part-way through.
	if (result.cleared)
		await map.playClear(dom.result, run.level);

	// The unlock is shown on the map, where the newly open level actually is.
	// Only when this run is what completed the coverage, and only if the child has
	// not already tapped their way somewhere else.
	if (result.unlocked && gen === ui.generation) {
		dom.result.hidden = true;
		showMap();
		await map.playUnlock(dom.mapHost, result.unlocked);
	}
}

/* --------------------------------------------------------------- pause */

function togglePause () {
	ui.paused ? resume() : pause();
}

function pause () {
	if (ui.resolving)
		return;

	ui.paused = true;
	pauseTimer();
	dom.pause.hidden = false;
}

/** Only the parent panel needs to pause a resolving round; it just hides play. */
function softPause () {
	ui.paused = true;
	pauseTimer();
}

function resume () {
	ui.paused = false;
	dom.pause.hidden = true;
	// The question survives the pause with whatever time was left. The view check
	// matters because the gear is on the map too: closing the panel there must not
	// start a countdown against whatever question was last on the board.
	if (ui.view === 'play' && ui.question
		&& ui.remainingMs > 0 && !ui.resolving && !ui.feedback) {
		startTimer(ui.remainingMs);
		clockStart();
	}
}

/* -------------------------------------------------- parent / dev panel */

const MODE_LABEL = {count: 'Counting', add: 'Addition', sub: 'Subtraction'};
const OUTCOME_LABEL = {
	firstTry: 'correct first try',
	afterHelp: 'correct after help',
	error: 'wrong answer',
	timeout: 'ran out of time',
	skipped: 'skipped',
};

function rangeLabel (mode, tierId) {
	const tier = TIERS[mode].find(t => t.id === tierId);
	if (!tier)
		return tierId;

	return mode === 'count' ? `${tier.min}–${tier.max}` : `up to ${tier.max}`;
}

function openParent () {
	// softPause, not pause: the gear may be tapped during a success animation,
	// and play must stop underneath the panel regardless.
	softPause();
	renderParent();
	dom.parent.hidden = false;
}

function renderParent () {
	const state = store.getState();
	const host = dom.parent.querySelector('.parent-body');
	host.textContent = '';

	const {progress} = state;
	const accuracy = progress.answered
		? Math.round(progress.firstTryCorrect / progress.answered * 100)
		: 0;

	const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
	const summary = document.createElement('p');
	summary.textContent = `${plural(progress.answered, 'question')} answered, `
		+ `${accuracy}% correct on the first try. `
		+ `Best unaided run: ${progress.bestStreak}. `
		+ `${plural(progress.sessions, 'session')}.`;
	host.append(summary);

	// Per-skill table. Deliberately not a single percentage: "subtraction
	// within 5 needs practice" is the actionable form.
	const table = document.createElement('table');
	table.innerHTML = `<thead><tr>
		<th>Skill</th><th>Range</th><th class="n">Tried</th>
		<th class="n">First try</th><th class="n">Errors</th><th class="n">Timeouts</th>
		<th>Mastery</th><th class="n">Time</th></tr></thead>`;
	const tbody = document.createElement('tbody');

	for (const mode of ['count', 'add', 'sub']) {
		for (const tier of TIERS[mode]) {
			const rec = state.skills[skillKey(mode, tier.id)];
			if (!rec || !rec.attempts)
				continue;

			const tr = document.createElement('tr');
			const weak = rec.mastery < 0.5 || store.windowErrorRate(skillKey(mode, tier.id)) > 0.4;
			tr.innerHTML = `
				<td class="${weak ? 'weak' : ''}">${MODE_LABEL[mode]}</td>
				<td>${rangeLabel(mode, tier.id)}</td>
				<td class="n">${rec.attempts}</td>
				<td class="n">${rec.firstTry}</td>
				<td class="n">${rec.errors}</td>
				<td class="n">${rec.timeouts}</td>
				<td><div class="bar"><i style="width:${Math.round(rec.mastery * 100)}%"></i></div></td>
				<td class="n">${Math.round(TIMEOUT_BANDS[rec.band] / 1000)}s</td>`;
			tbody.append(tr);
		}
	}
	table.append(tbody);
	host.append(table);

	// Needs-practice list, in words rather than a score.
	const weakList = [];
	for (const mode of ['count', 'add', 'sub']) {
		for (const tier of TIERS[mode]) {
			const key = skillKey(mode, tier.id);
			const rec = state.skills[key];
			if (!rec || rec.attempts < 3)
				continue;
			if (rec.mastery < 0.5 || store.windowErrorRate(key) > 0.4)
				weakList.push(`${MODE_LABEL[mode].toLowerCase()} ${rangeLabel(mode, tier.id)}`);
		}
	}

	const advice = document.createElement('p');
	advice.style.marginTop = '1rem';
	advice.textContent = weakList.length
		? `Needs more practice: ${weakList.join('; ')}.`
		: progress.answered < 8
			? 'Not enough answers yet to say which skills need practice.'
			: 'No skill is currently flagged for extra practice.';
	host.append(advice);

	// Recent answers, with timeouts distinguished from wrong answers.
	if (state.recent.length) {
		const h = document.createElement('h2');
		h.textContent = 'Recent answers';
		h.style.fontSize = '1rem';
		h.style.marginTop = '1.25rem';
		host.append(h);

		const list = document.createElement('table');
		const body = document.createElement('tbody');
		for (const r of state.recent.slice(-12).reverse()) {
			// The log is the one structure `hydrate` passes through as it found it,
			// and it is carried across migrations untouched — so an entry written by
			// an older version, or half-written when a tab died, can be missing
			// `operands`. Skipped rather than rendered: reading it blind threw here
			// and took the whole panel down with it, which is a bad trade for one
			// unreadable row.
			if (!Array.isArray(r.operands) || !r.operands.length)
				continue;

			const shown = r.mode === 'count'
				? `count ${r.operands[0]}`
				: `${r.operands[0]} ${r.mode === 'add' ? '+' : '−'} ${r.operands[1]} = ${r.answer}`;
			const tr = document.createElement('tr');
			tr.innerHTML = `<td>${shown}</td><td>${r.pairing}</td>`
				+ `<td class="${r.outcome === 'firstTry' ? '' : 'weak'}">${OUTCOME_LABEL[r.outcome] ?? r.outcome}</td>`
				+ `<td class="n">${(r.elapsedMs / 1000).toFixed(1)}s</td>`;
			body.append(tr);
		}
		list.append(body);
		host.append(list);
	}
}

/* ---------------------------------------------------------------- setup */

function buildOverlays () {
	// Pause: wordless, one large resume control.
	dom.pause = document.createElement('div');
	dom.pause.className = 'overlay';
	dom.pause.hidden = true;
	const pauseSheet = document.createElement('div');
	pauseSheet.className = 'sheet pause-sheet';
	pauseSheet.append(iconButton('ic-play', 'resume', resume));
	dom.pause.append(pauseSheet);
	dom.pause.addEventListener('click', event => {
		if (event.target === dom.pause)
			resume();
	});

	// Parent panel: the only text surface, and never open during play.
	dom.parent = document.createElement('div');
	dom.parent.className = 'overlay';
	dom.parent.hidden = true;
	const sheet = document.createElement('div');
	sheet.className = 'sheet parent';

	const head = document.createElement('div');
	head.className = 'row';
	const title = document.createElement('h2');
	title.textContent = 'Progress';
	head.append(title, iconButton('ic-close', 'close', closeParent));
	sheet.append(head);

	const note = document.createElement('p');
	note.textContent = 'For grown-ups. Progress is stored on this device only.';
	sheet.append(note);

	const body = document.createElement('div');
	body.className = 'parent-body';
	sheet.append(body);

	const actions = document.createElement('div');
	actions.className = 'actions';
	const resetBtn = document.createElement('button');
	resetBtn.type = 'button';
	resetBtn.className = 'text-btn danger';
	resetBtn.textContent = 'Reset all progress';
	resetBtn.addEventListener('click', () => {
		// Destructive and local: confirm before wiping the child's history.
		if (!window.confirm('Erase all saved progress on this device?'))
			return;

		store.reset();
		paintGarden(false);
		paintStreak();
		renderParent();
		// The map is drawn from the records, so a wipe has to redraw it — otherwise
		// it keeps showing stars and open levels that no longer exist, and tapping
		// one would start a level the save says is locked.
		if (ui.view === 'map')
			map.render(dom.mapHost, levelView());
		else
			// A run against erased records has nothing left to be a run of.
			showMap();
	});
	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'text-btn';
	closeBtn.textContent = 'Back to the game';
	closeBtn.addEventListener('click', closeParent);
	actions.append(closeBtn, resetBtn);
	sheet.append(actions);

	dom.parent.append(sheet);

	// The result of a run. Filled by map.js; kept here because it belongs to the
	// same overlay stack as the pause and parent sheets.
	dom.result = document.createElement('div');
	dom.result.className = 'overlay result';
	dom.result.hidden = true;

	// The level cover, shown between tapping a level and its first question.
	dom.cover = document.createElement('div');
	dom.cover.className = 'overlay cover';
	dom.cover.hidden = true;

	// The encouragement screen after a lost question. No dismiss control of its
	// own: it holds for a moment and goes, and a tap anywhere shortens that — a
	// button here would be one more thing to understand at the least good moment
	// to be asking a child to understand something.
	dom.miss = document.createElement('div');
	dom.miss.className = 'overlay miss';
	dom.miss.hidden = true;

	document.body.append(dom.pause, dom.parent, dom.result, dom.cover, dom.miss);
}

function closeParent () {
	dom.parent.hidden = true;
	// resume() re-arms the clock only when a round is genuinely waiting on input.
	resume();
}

/**
 * Async only because reading the save is: IndexedDB has no synchronous read. The
 * sprites go in first so the page is not blank while the database opens, and
 * everything that draws from records comes after the await — `buildHud` paints
 * the streak and the garden from `progress`, and `showMap` reads every item
 * record, so either one running against an empty state would show a first-time
 * map to a child who has been playing for weeks.
 */
async function boot () {
	injectSprites();
	dom.mapView = document.querySelector('.map-view');
	dom.playView = document.querySelector('.play-view');
	dom.mapHud = document.querySelector('.map-hud');
	dom.mapHost = document.querySelector('.map-host');
	dom.hud = document.querySelector('.hud');
	dom.board = document.querySelector('.board');
	dom.garden = document.querySelector('.garden');

	// Debug only, and deliberately not persisted: a switch that wrote itself into
	// the save file would leave the child's real progress permanently unlockable.
	ui.unlockAll = new URLSearchParams(window.location.search).has('unlock');

	await store.load();
	buildHud();
	buildMapHud();
	buildOverlays();
	paintGarden(false);
	paintStreak();
	showMap();

	document.addEventListener('keydown', event => {
		if (event.key !== 'Escape')
			return;

		// The encouragement screen dismisses itself, and it owns the continuation of
		// the run. Escape must not fall through to the pause toggle underneath it,
		// which would leave a round waiting behind a screen nobody can see.
		if (!dom.miss.hidden)
			return;

		if (!dom.parent.hidden)
			closeParent();
		else if (!dom.cover.hidden) {
			// Escape out of the cover is backing out of the level, which no run has
			// started for yet, so there is nothing to abandon.
			dom.cover.hidden = true;
			showMap();
		}
		else if (!dom.result.hidden)
			// Escape out of the result goes back to the map, which is the only
			// other thing that screen can do.
			showMap();
		else if (ui.view === 'play')
			// Never on the map: there is no round to pause there, and the pause
			// overlay would sit over it with no way to read what it means.
			togglePause();
	});

	// Losing focus mid-question should not spend the child's time. Only in play:
	// backgrounding the map would otherwise raise a pause sheet over it.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden'
			&& ui.view === 'play' && !ui.paused && !ui.resolving)
			pause();
	});

	// The map measures its host to choose a path shape, so a box that changes shape
	// needs a re-render. Debounced, because a drag-resize fires this continuously
	// and each render throws the nodes away and measures the path again. Skipped
	// while the unlock animation is running: a re-render would remove the very node
	// mid-flight.
	let resizeId = 0;
	window.addEventListener('resize', () => {
		clearTimeout(resizeId);
		resizeId = setTimeout(() => {
			if (ui.view === 'map' && !dom.mapHost.querySelector('.unlocking'))
				map.render(dom.mapHost, levelView());
		}, 150);
	});
}

boot();
