/**
 * main.js — the round loop, HUD, timer bands, pause and the parent panel.
 *
 * Play surface rules: numerals and arithmetic symbols are allowed, prose is
 * not. Every control is an icon. The parent panel is the only place with text,
 * and it is closed during normal play.
 */

import {injectSprites, sprite} from '../../assets/js/art.js';
import * as store from '../../assets/js/storage.js';
import {OUTCOME} from '../../assets/js/storage.js';
import * as sched from '../../assets/js/scheduler.js';
import {TIMEOUT_BANDS, TIERS, skillKey} from '../../assets/js/questions.js';
import * as board from './board.js';

const STREAK_STARS = 5;
const GARDEN_MAX = 14;
const AUTO_SUBMIT_MS = 900;
const HINT_AFTER_ERRORS = 2;

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
	timedOut: false,
	/**
	 * Incremented for every round. An async continuation captures it and
	 * checks it before touching the DOM, so a sequence that outlives its
	 * round can never act on the next one.
	 */
	generation: 0,
};

/** True when `gen` is still the round on screen. */
const current = gen => gen === ui.generation && !ui.paused;

/* --------------------------------------------------------------- plumbing */

const clearTimers = () => {
	clearTimeout(ui.timerId);
	cancelAnimationFrame(ui.tickId);
	clearTimeout(ui.autoSubmitId);
	ui.timerId = null;
	ui.tickId = null;
	ui.autoSubmitId = null;
};

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

	const home = document.createElement('a');
	home.className = 'icon-btn';
	home.href = '../../index.html';
	home.setAttribute('aria-label', 'home');
	home.append(sprite('ic-home'));

	dom.streak = document.createElement('div');
	dom.streak.className = 'streak';
	for (let i = 0; i < STREAK_STARS; ++i)
		dom.streak.append(sprite('sp-star'));

	dom.timer = buildTimer();

	const spacer = document.createElement('div');
	spacer.className = 'hud-spacer';

	hud.append(dom.pauseBtn, dom.hintBtn, dom.undoBtn, dom.confirmBtn, spacer,
		dom.streak, dom.timer, dom.parentBtn, home);
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

		const left = ms - (performance.now() - ui.startedAt);
		ui.remainingMs = left;
		paintTimer(left / total);
		if (left > 0)
			ui.tickId = requestAnimationFrame(tick);
	};
	ui.tickId = requestAnimationFrame(tick);
	ui.timerId = setTimeout(onTimeout, ms);
}

function pauseTimer () {
	clearTimers();
	ui.remainingMs -= performance.now() - ui.startedAt;
}

/* ----------------------------------------------------------- round flow */

function nextRound () {
	clearTimers();
	ui.generation += 1;
	ui.question = sched.nextQuestion();
	ui.errors = 0;
	ui.selected = null;
	ui.resolving = false;
	ui.feedback = false;
	ui.usedHelp = false;
	ui.timedOut = false;

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

	// The clock only starts once the scene has settled.
	const gen = ui.generation;
	setTimeout(() => {
		if (current(gen) && !ui.resolving && !ui.feedback)
			startTimer(ui.question.timeoutMs);
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

	const elapsed = q.timeoutMs - Math.max(0, ui.remainingMs);
	const outcome = ui.errors === 0 && !ui.usedHelp && !ui.timedOut
		? OUTCOME.FIRST_TRY
		: OUTCOME.AFTER_HELP;

	sched.recordAnswer(q, outcome, elapsed, ui.errors);
	paintStreak();
	paintGarden(true);

	await board.success(ui.handles, q, btn);
	if (gen === ui.generation)
		nextRound();
}

async function resolveWrong (btn) {
	const q = ui.question;
	const gen = ui.generation;

	// The clock stops for the whole feedback sequence: the counting hint can run
	// for seconds, and it must not be spent out of the child's thinking time.
	clearTimers();
	ui.feedback = true;
	ui.errors += 1;
	ui.selected = null;
	dom.confirmBtn.disabled = true;
	dom.undoBtn.disabled = true;

	// Calm and instructional: the card comes back, the choices stay open.
	await board.retry(btn);
	if (!current(gen))
		return;

	await board.countingHint(ui.handles);
	if (!current(gen))
		return;

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
}

async function onTimeout () {
	// A timeout must never land during feedback: the clock is stopped there.
	if (ui.resolving || ui.feedback)
		return;

	ui.resolving = true;
	clearTimers();
	ui.timedOut = true;

	const gen = ui.generation;
	const q = ui.question;
	// Recorded as a timeout, not an arithmetic error: the child may have known it.
	sched.recordAnswer(q, OUTCOME.TIMEOUT, q.timeoutMs, ui.errors);
	paintStreak();

	// A gentle counting walkthrough, then a fresh question with more time.
	await board.countingHint(ui.handles);
	board.lockChoices(ui.handles);
	await new Promise(resolve => setTimeout(resolve, 500));
	if (gen === ui.generation)
		nextRound();
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
	// The question survives the pause with whatever time was left.
	if (ui.remainingMs > 0 && !ui.resolving && !ui.feedback)
		startTimer(ui.remainingMs);
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
	});
	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'text-btn';
	closeBtn.textContent = 'Back to the game';
	closeBtn.addEventListener('click', closeParent);
	actions.append(closeBtn, resetBtn);
	sheet.append(actions);

	dom.parent.append(sheet);
	document.body.append(dom.pause, dom.parent);
}

function closeParent () {
	dom.parent.hidden = true;
	// resume() re-arms the clock only when a round is genuinely waiting on input.
	resume();
}

function boot () {
	injectSprites();
	dom.hud = document.querySelector('.hud');
	dom.board = document.querySelector('.board');
	dom.garden = document.querySelector('.garden');

	store.load();
	buildHud();
	buildOverlays();
	paintGarden(false);
	paintStreak();
	nextRound();

	document.addEventListener('keydown', event => {
		if (event.key === 'Escape') {
			if (!dom.parent.hidden)
				closeParent();
			else
				togglePause();
		}
	});

	// Losing focus mid-question should not spend the child's time.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden' && !ui.paused && !ui.resolving)
			pause();
	});
}

boot();
