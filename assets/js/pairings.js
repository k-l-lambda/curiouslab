/**
 * pairings.js — the object pairings.
 *
 * `assets/sprites/expansion-plan.md` is the item list this grows along.
 *
 * `source` is the actor group (cats, monkeys...), `target` is the counted
 * group (fish, bananas...). `container` is the pairing's environment element —
 * a bowl, a nest. The board no longer shows it: the targets are delivered to
 * the source figures themselves, and a container in the middle would name a
 * destination they never travel to. Kept because it belongs to the pairing.
 * `familiarity` orders introduction: lower numbers are shown first.
 * `container` is null from row six on — see the note on the first such row.
 */

export const PAIRINGS = [
	{
		id: 'cat-fish',
		source: 'sp-cat',
		target: 'sp-fish',
		container: 'sp-bowl',
		familiarity: 0,
		tint: '#5cc3e8',
	},
	{
		id: 'monkey-banana',
		source: 'sp-monkey',
		target: 'sp-banana',
		container: 'sp-basket',
		familiarity: 1,
		tint: '#f7d84a',
	},
	{
		id: 'dog-bone',
		source: 'sp-dog',
		target: 'sp-bone',
		container: 'sp-bowl-dog',
		familiarity: 2,
		tint: '#e0c9a0',
	},
	{
		id: 'rabbit-carrot',
		source: 'sp-rabbit',
		target: 'sp-carrot',
		container: 'sp-garden',
		familiarity: 3,
		tint: '#f0862f',
	},
	{
		id: 'bird-seed',
		source: 'sp-bird',
		target: 'sp-seed',
		container: 'sp-nest',
		familiarity: 4,
		tint: '#d9a94f',
	},
	{
		id: 'lamp-star',
		source: 'sp-lamp',
		target: 'sp-star',
		container: 'sp-glow',
		familiarity: 5,
		tint: '#ffd44d',
	},
	{
		// Rows 6 onward carry no container: the field has no consumer, and the
		// board delivers targets to the figures themselves, so inventing a bowl
		// for each new pair would be drawing nobody looks at.
		id: 'pig-apple',
		source: 'sp-pig',
		target: 'sp-apple',
		container: null,
		familiarity: 6,
		tint: '#d6453f',
	},
	{
		id: 'mouse-cheese',
		source: 'sp-mouse',
		target: 'sp-cheese',
		container: null,
		familiarity: 7,
		tint: '#f2c94c',
	},
	{
		id: 'hen-egg',
		source: 'sp-hen',
		target: 'sp-egg',
		container: null,
		familiarity: 8,
		tint: '#d9b48c',
	},
	// Rows nine to nineteen. Each `tint` is the accent its level carries in
	// `../levels/prompts.md` rather than a colour picked here, so the pairing and
	// the map node the child taps to reach it are the same colour. `hamster-corn`
	// from the expansion plan is deliberately absent: it stays in the pool and was
	// not given a level, so drawing it buys no level face.
	{
		id: 'sheep-clover',
		source: 'sp-sheep',
		target: 'sp-clover',
		container: null,
		familiarity: 9,
		tint: '#4f9a34',
	},
	{
		id: 'cow-haybale',
		source: 'sp-cow',
		target: 'sp-haybale',
		container: null,
		familiarity: 10,
		tint: '#c98a1f',
	},
	{
		id: 'horse-horseshoe',
		source: 'sp-horse',
		target: 'sp-horseshoe',
		container: null,
		familiarity: 11,
		tint: '#8fa3b2',
	},
	{
		id: 'duck-snail',
		source: 'sp-duck',
		target: 'sp-snail',
		container: null,
		familiarity: 12,
		tint: '#8a63c0',
	},
	// The cheapest row in the table: `sp-flower` was already drawn as garden
	// decoration, so only the actor was new.
	{
		id: 'bee-flower',
		source: 'sp-bee',
		target: 'sp-flower',
		container: null,
		familiarity: 13,
		tint: '#f27a9b',
	},
	{
		id: 'goat-cabbage',
		source: 'sp-goat',
		target: 'sp-cabbage',
		container: null,
		familiarity: 14,
		tint: '#7fb069',
	},
	{
		id: 'squirrel-acorn',
		source: 'sp-squirrel',
		target: 'sp-acorn',
		container: null,
		familiarity: 15,
		tint: '#6b4a24',
	},
	{
		id: 'elephant-peanut',
		source: 'sp-elephant',
		target: 'sp-peanut',
		container: null,
		familiarity: 16,
		tint: '#e07a52',
	},
	{
		id: 'panda-bamboo',
		source: 'sp-panda',
		target: 'sp-bamboo',
		container: null,
		familiarity: 17,
		tint: '#b5c94a',
	},
	{
		id: 'frog-lotus',
		source: 'sp-frog',
		target: 'sp-lotus',
		container: null,
		familiarity: 18,
		tint: '#3f9e9d',
	},
	{
		id: 'giraffe-leaf',
		source: 'sp-giraffe',
		target: 'sp-leaf',
		container: null,
		familiarity: 19,
		tint: '#4a8f5a',
	},
];

export const pairingById = id => PAIRINGS.find(p => p.id === id);
