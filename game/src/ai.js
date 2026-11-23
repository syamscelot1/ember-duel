// Ember Duel — Nyra, the AI opponent.
// She plays by readable rules a player can learn and counter: biggest affordable creature
// first, Burst when it can finish you, Mend when she is hurt, Bloom when her hand is thin,
// and she always spends her mana before she ends her turn.

import { CARD_BY_ID } from './config.js';

/** Score a card in hand for the AI: creatures by their body, spells by the moment. */
export function scoreCardForAi(game, hero, cardId) {
  const card = CARD_BY_ID[cardId];
  const foe = game.otherHero(hero);
  if (card.type === 'creature') {
    // A creature already on the board of the same house is worth more: resonance.
    const kin = hero.board.some((creature) => creature.house === card.house) ? 1.5 : 0;
    return card.attack + card.defense * 0.6 + kin;
  }
  if (card.spell === 'burst') return foe.hp <= 3 ? 100 : (foe.hp <= 8 ? 8 : 4);
  if (card.spell === 'mend') return hero.hp <= 15 ? 12 : (hero.hp >= hero.maxHp ? -1 : 2);
  if (card.spell === 'bloom') return hero.hand.length <= 3 ? 6 : 1;
  if (card.spell === 'gust') return foe.board.length > 0 ? 5 : 3;
  return 0;
}

/**
 * Play Nyra's whole turn: keep playing her best affordable card until nothing good is
 * left, then end the turn. Returns the list of card names she played, for the log.
 */
export function playAiTurn(game) {
  const hero = game.enemy;
  const played = [];
  for (let guard = 0; guard < 12; guard += 1) {
    let bestIndex = -1;
    let bestScore = 0;
    for (let index = 0; index < hero.hand.length; index += 1) {
      const card = CARD_BY_ID[hero.hand[index]];
      if (hero.mana < card.cost) continue;
      if (card.type === 'creature' && hero.board.length >= 5) continue;
      const score = scoreCardForAi(game, hero, hero.hand[index]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex === -1) break;
    const name = CARD_BY_ID[hero.hand[bestIndex]].name;
    if (!game.playCard(hero, bestIndex)) break;
    played.push(name);
    if (game.phase !== 'play') break;
  }
  game.say(played.length > 0 ? `Nyra plays: ${played.join(', ')}.` : 'Nyra plays nothing and ends her turn.');
  return played;
}

/**
 * The screenshot autopilot for the player: play the best affordable card each turn,
 * favouring creatures, and always end the turn. Used only to stage ?shot= frames.
 */
export function playPlayerAutopilot(game) {
  const hero = game.player;
  for (let guard = 0; guard < 12; guard += 1) {
    let bestIndex = -1;
    let bestScore = 0;
    for (let index = 0; index < hero.hand.length; index += 1) {
      const card = CARD_BY_ID[hero.hand[index]];
      if (hero.mana < card.cost) continue;
      if (card.type === 'creature' && hero.board.length >= 5) continue;
      const score = scoreCardForAi(game, hero, hero.hand[index]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex === -1) break;
    if (!game.playCard(hero, bestIndex)) break;
    if (game.phase !== 'play') break;
  }
}
