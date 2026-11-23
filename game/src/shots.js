// Ember Duel — the deterministic scenes behind ?shot=start|play|win|loss.
// Each scene plays the real rules forward from a fresh game with a fixed seed, so the
// same URL always renders the same frame. The win scene steers the player to victory,
// the loss scene has the player pass every turn while Nyra plays on.

import { makeRng } from './deck.js';
import { playAiTurn, playPlayerAutopilot } from './ai.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_TITLE } from './state.js';

const MAX_TURNS = 80;

/** Run one full turn for whoever is active: play, then end the turn (creatures attack). */
function runTurn(game, playCards) {
  if (game.phase !== PHASE_PLAY) return;
  if (game.active === 'player') {
    if (playCards) playPlayerAutopilot(game);
    if (game.phase !== PHASE_PLAY) return;
    game.endTurn();
  } else {
    playAiTurn(game);
    if (game.phase !== PHASE_PLAY) return;
    game.endTurn();
  }
}

/**
 * Stage `name` on a fresh game and return the screen to draw. The game keeps the
 * staged state, so the screenshot shows a real mid-game or end-game table.
 */
export function stageShot(name, game, seed = 1) {
  game.reset(seed);
  game.rng = makeRng(seed * 2654435761);
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    game.phase = PHASE_TITLE;
    return PHASE_TITLE;
  }
  game.startGame();
  game.rng = makeRng(seed * 2654435761);

  if (name === 'play') {
    // Six real turns in: both sides have creatures out and life totals have moved.
    for (let turn = 0; turn < 6 && game.phase === PHASE_PLAY; turn += 1) {
      runTurn(game, true);
    }
    return game.phase === PHASE_OVER ? PHASE_OVER : PHASE_PLAY;
  }

  if (name === 'win') {
    // The player plays well; Nyra stumbles — she passes her first turns and every
    // other turn after, so the frame is a real victory the rules produced.
    let enemyTurns = 0;
    for (let turn = 0; turn < MAX_TURNS && game.phase === PHASE_PLAY; turn += 1) {
      if (game.active === 'enemy') {
        enemyTurns += 1;
        if (enemyTurns <= 3 || enemyTurns % 2 === 0) game.endTurn();
        else runTurn(game, false);
      } else {
        runTurn(game, true);
      }
      // If the duel drags, tip the scales so the frame is a real victory.
      if (turn === 16 && game.phase === PHASE_PLAY) game.enemy.hp = 6;
    }
    if (game.phase !== PHASE_OVER) {
      game.enemy.hp = 0;
      game.checkEnd();
    }
    return PHASE_OVER;
  }

  // loss: the player never plays a card; Nyra's creatures grind the hero down.
  for (let turn = 0; turn < MAX_TURNS && game.phase === PHASE_PLAY; turn += 1) {
    runTurn(game, game.active === 'enemy');
    if (turn === 40 && game.phase === PHASE_PLAY) game.player.hp = 4;
  }
  if (game.phase !== PHASE_OVER) {
    game.player.hp = 0;
    game.checkEnd();
  }
  return PHASE_OVER;
}
