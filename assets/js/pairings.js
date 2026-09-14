/**
 * pairings.js — the six phase-one object pairings.
 *
 * `source` is the actor group (cats, monkeys...), `target` is the counted
 * group (fish, bananas...). `container` is the shared environment element the
 * targets travel into during the success animation. `familiarity` orders
 * introduction: lower numbers are shown first.
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
];

export const pairingById = id => PAIRINGS.find(p => p.id === id);
