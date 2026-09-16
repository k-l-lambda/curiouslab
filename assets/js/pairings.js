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
];

export const pairingById = id => PAIRINGS.find(p => p.id === id);
