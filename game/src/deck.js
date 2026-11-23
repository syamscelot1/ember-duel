// Ember Duel — seeded random numbers and deck building.
// The same seed always builds the same shuffled decks, so replays and screenshots are exact.

import { DECK_LIST } from './config.js';

/** Small fast seeded generator (mulberry32). Returns a function that yields [0, 1). */
export function makeRng(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh shuffled deck: card ids in draw order (pop from the end to draw). */
export function buildDeck(seed) {
  const rng = makeRng(seed);
  const deck = [...DECK_LIST];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return deck;
}

/** Pick a random element with the given rng, or null when the list is empty. */
export function pickRandom(rng, list) {
  if (list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
}
