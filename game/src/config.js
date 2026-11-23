// Ember Duel — card catalogue, houses and table constants.
// Every card, name, house and number here is original work for this game.

// Logical canvas size. The page scales this to the window; screenshots are 1280x720.
export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 720;

export const START_HP = 30;
export const MAX_HP = 30;
export const MAX_MANA = 10;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const OPENING_HAND = 3;
export const DECK_SIZE = 30;

// The four houses. Colour AND shape tell them apart, never text alone.
export const HOUSES = {
  ember: { name: 'Ember', colour: '#e8491d', dark: '#8f1f05', light: '#ffb199', shape: 'flame' },
  tide: { name: 'Tide', colour: '#1d7fe8', dark: '#0a3d75', light: '#a8d4ff', shape: 'drop' },
  leaf: { name: 'Leaf', colour: '#2fae4e', dark: '#0f5c24', light: '#b3ecc0', shape: 'leaf' },
  gale: { name: 'Gale', colour: '#8a4fd0', dark: '#452078', light: '#d9bfff', shape: 'swirl' },
};
export const HOUSE_KEYS = ['ember', 'tide', 'leaf', 'gale'];

// type: 'creature' stays on the table and fights; 'spell' resolves at once.
export const CARDS = [
  { id: 'ember-imp', name: 'Ember Imp', house: 'ember', type: 'creature', cost: 1, attack: 2, defense: 1, text: 'A spark with teeth.' },
  { id: 'tide-sprite', name: 'Tide Sprite', house: 'tide', type: 'creature', cost: 1, attack: 1, defense: 2, text: 'Slips past every net.' },
  { id: 'leaf-sprout', name: 'Leaf Sprout', house: 'leaf', type: 'creature', cost: 1, attack: 1, defense: 3, text: 'Small roots, deep roots.' },
  { id: 'gale-wisp', name: 'Gale Wisp', house: 'gale', type: 'creature', cost: 1, attack: 2, defense: 1, text: 'Here, then gone.' },
  { id: 'ember-hound', name: 'Ember Hound', house: 'ember', type: 'creature', cost: 2, attack: 3, defense: 2, text: 'Its bark is a backdraft.' },
  { id: 'tide-crab', name: 'Tide Crab', house: 'tide', type: 'creature', cost: 2, attack: 2, defense: 3, text: 'Armour borrowed from the sea.' },
  { id: 'leaf-bramble', name: 'Leaf Bramble', house: 'leaf', type: 'creature', cost: 2, attack: 2, defense: 4, text: 'The hedge bites back.' },
  { id: 'gale-falcon', name: 'Gale Falcon', house: 'gale', type: 'creature', cost: 2, attack: 3, defense: 1, text: 'Faster than the warning.' },
  { id: 'ember-drake', name: 'Ember Drake', house: 'ember', type: 'creature', cost: 3, attack: 4, defense: 3, text: 'A young flame, already proud.' },
  { id: 'tide-serpent', name: 'Tide Serpent', house: 'tide', type: 'creature', cost: 3, attack: 3, defense: 4, text: 'It coils around the current.' },
  { id: 'leaf-ancient', name: 'Leaf Ancient', house: 'leaf', type: 'creature', cost: 3, attack: 2, defense: 6, text: 'Older than the road you came by.' },
  { id: 'gale-stormhawk', name: 'Gale Stormhawk', house: 'gale', type: 'creature', cost: 3, attack: 5, defense: 2, text: 'Thunder keeps its distance.' },
  { id: 'ember-phoenix', name: 'Ember Phoenix', house: 'ember', type: 'creature', cost: 5, attack: 6, defense: 5, text: 'Burns out. Comes back brighter.' },
  { id: 'tide-leviathan', name: 'Tide Leviathan', house: 'tide', type: 'creature', cost: 5, attack: 5, defense: 6, text: 'The deep, standing up.' },
  { id: 'leaf-worldtree', name: 'Leaf Worldtree', house: 'leaf', type: 'creature', cost: 5, attack: 4, defense: 8, text: 'Its shade is a kingdom.' },
  { id: 'gale-tempest', name: 'Gale Tempest', house: 'gale', type: 'creature', cost: 5, attack: 7, defense: 4, text: 'A storm that learned to aim.' },
  { id: 'ember-burst', name: 'Ember Burst', house: 'ember', type: 'spell', cost: 2, attack: 0, defense: 0, text: 'Deal 3 damage to the enemy hero.', spell: 'burst' },
  { id: 'tide-mend', name: 'Tide Mend', house: 'tide', type: 'spell', cost: 2, attack: 0, defense: 0, text: 'Restore 5 life to your hero.', spell: 'mend' },
  { id: 'leaf-bloom', name: 'Leaf Bloom', house: 'leaf', type: 'spell', cost: 2, attack: 0, defense: 0, text: 'Draw 2 cards.', spell: 'bloom' },
  { id: 'gale-gust', name: 'Gale Gust', house: 'gale', type: 'spell', cost: 1, attack: 0, defense: 0, text: 'Deal 2 damage to a random enemy creature, or the hero.', spell: 'gust' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.id, card]));

// Two copies of each cheap creature, one of each big creature, six spells: 30 cards.
export const DECK_LIST = [
  'ember-imp', 'ember-imp', 'tide-sprite', 'tide-sprite', 'leaf-sprout', 'leaf-sprout',
  'gale-wisp', 'gale-wisp', 'ember-hound', 'ember-hound', 'tide-crab', 'tide-crab',
  'leaf-bramble', 'leaf-bramble', 'gale-falcon', 'gale-falcon',
  'ember-drake', 'tide-serpent', 'leaf-ancient', 'gale-stormhawk',
  'ember-phoenix', 'tide-leviathan', 'leaf-worldtree', 'gale-tempest',
  'ember-burst', 'ember-burst', 'tide-mend', 'leaf-bloom', 'leaf-bloom', 'gale-gust',
];

// Table layout, in logical pixels.
export const LAYOUT = {
  cardWidth: 132,
  cardHeight: 184,
  boardCardWidth: 104,
  boardCardHeight: 140,
  handY: 512,
  playerBoardY: 348,
  enemyBoardY: 182,
};
