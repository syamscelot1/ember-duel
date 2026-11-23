// Ember Duel — mouse and keyboard input.
// Clicks a hand card to play it, the End Turn button to pass, the title to start;
// keys 1-7 play cards, Space ends the turn, R restarts, M mutes.

import { END_TURN_RECT, MUTE_RECT, handRects } from './render.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_TITLE } from './state.js';
import { isMuted, sfx, toggleMute } from './audio.js';

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

/**
 * Wire input to the canvas. `hooks` is what the main loop owns:
 * startGame, playHandCard(index), endTurn, restart, onHover(index|null), onMute(muted).
 */
export function attachInput(canvas, game, hooks) {
  function toLogical(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = toLogical(event);
    if (game.phase !== PHASE_PLAY || game.active !== 'player') {
      hooks.onHover(null);
      return;
    }
    const rects = handRects(game.player.hand.length);
    let hovered = null;
    for (let index = 0; index < rects.length; index += 1) {
      const rect = rects[index];
      if (inside(point, { ...rect, y: rect.y - 18, height: rect.height + 18 })) hovered = index;
    }
    hooks.onHover(hovered);
  });

  canvas.addEventListener('click', (event) => {
    const point = toLogical(event);
    if (inside(point, MUTE_RECT)) {
      hooks.onMute(toggleMute());
      return;
    }
    if (game.phase === PHASE_TITLE) {
      sfx.click();
      hooks.startGame();
      return;
    }
    if (game.phase === PHASE_OVER) return;
    if (game.phase !== PHASE_PLAY || game.active !== 'player') return;
    if (inside(point, END_TURN_RECT)) {
      sfx.click();
      hooks.endTurn();
      return;
    }
    const rects = handRects(game.player.hand.length);
    for (let index = 0; index < rects.length; index += 1) {
      if (inside(point, rects[index])) {
        hooks.playHandCard(index);
        return;
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
      hooks.onMute(toggleMute());
      return;
    }
    if (game.phase === PHASE_TITLE && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      sfx.click();
      hooks.startGame();
      return;
    }
    if (game.phase === PHASE_OVER && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
      hooks.restart();
      return;
    }
    if (game.phase !== PHASE_PLAY || game.active !== 'player') return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      hooks.endTurn();
      return;
    }
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= game.player.hand.length) {
      hooks.playHandCard(digit - 1);
    }
  });

  return { isMuted };
}
