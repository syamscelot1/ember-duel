// Ember Duel — bootstrap and the frame loop.
// Owns the canvas, the floating event notices, and the pause before Nyra takes her turn.
// A ?shot=start|play|win|loss URL stages one deterministic scene and draws it once,
// which is how the entry's screenshots are taken.

import { TABLE_HEIGHT, TABLE_WIDTH } from './config.js';
import { Game, PHASE_OVER, PHASE_PLAY, PHASE_TITLE } from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { playAiTurn } from './ai.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const context = canvas.getContext('2d');
canvas.width = TABLE_WIDTH;
canvas.height = TABLE_HEIGHT;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

const game = new Game(seed);
const ui = {
  hoverIndex: null,
  floaters: [],
  muted: false,
  time: 0,
  frozen: false,
};

function announce(text) {
  status.textContent = text;
}

/** Turn the game's queued events into floating notices on the table, stacked so they never overlap. */
function drainEvents() {
  for (const event of game.events) {
    const colour = event.kind === 'hit' ? '#ff8a70'
      : event.kind === 'resonance' ? '#ffd23e'
      : event.kind === 'spell' ? '#a8d4ff'
      : '#ffffff';
    ui.floaters.push({
      text: event.text,
      x: 205,
      y: 300 - (ui.floaters.length % 3) * 28,
      colour,
      life: 1,
    });
  }
  game.events.length = 0;
  if (ui.floaters.length > 3) ui.floaters.splice(0, ui.floaters.length - 3);
}

let aiTimer = null;

function scheduleAiTurn() {
  if (aiTimer !== null) return;
  aiTimer = window.setTimeout(() => {
    aiTimer = null;
    if (game.phase !== PHASE_PLAY || game.active !== 'enemy') return;
    playAiTurn(game);
    sfx.playCard();
    drainEvents();
    if (game.phase === PHASE_PLAY) {
      game.endTurn();
      sfx.turn();
      drainEvents();
      announce('Your turn.');
    } else {
      endOfGameSound();
    }
  }, 1000);
}

function endOfGameSound() {
  if (game.winner === 'player') sfx.win();
  else sfx.lose();
  announce(game.winner === 'player' ? 'Victory! Nyra is beaten.' : 'Defeat. Nyra wins this duel.');
}

const hooks = {
  startGame() {
    game.startGame();
    ui.floaters = [];
    drainEvents();
    announce('The duel begins. Your turn.');
  },
  restart() {
    game.startGame();
    ui.floaters = [];
    drainEvents();
    announce('A new duel begins. Your turn.');
  },
  playHandCard(index) {
    if (game.phase !== PHASE_PLAY || game.active !== 'player') return;
    const played = game.playCard(game.player, index);
    if (played) {
      sfx.playCard();
      drainEvents();
      if (game.phase === PHASE_OVER) endOfGameSound();
    } else {
      sfx.click();
    }
  },
  endTurn() {
    if (game.phase !== PHASE_PLAY || game.active !== 'player') return;
    game.endTurn();
    sfx.turn();
    drainEvents();
    if (game.phase === PHASE_OVER) endOfGameSound();
    else announce('Nyra is thinking…');
  },
  onHover(index) { ui.hoverIndex = index; },
  onMute(muted) { ui.muted = muted; },
};

attachInput(canvas, game, hooks);

function frame(timestamp) {
  ui.time = timestamp / 1000;
  if (!ui.frozen) {
    for (const floater of ui.floaters) {
      floater.y -= 0.35;
      floater.life -= 0.008;
    }
    ui.floaters = ui.floaters.filter((floater) => floater.life > 0);
  }
  if (game.phase === PHASE_PLAY && game.active === 'enemy' && !shotName) scheduleAiTurn();
  drawGame(context, game, ui);
  if (!shotName) window.requestAnimationFrame(frame);
}

// A staged screenshot: draw the scene once, with its notices held still, and stop.
// The end screens read cleanest with no floating notices; the play scene keeps one.
if (shotName) {
  ui.frozen = true;
  ui.time = 0.5;
  stageShot(shotName, game, seed);
  drainEvents();
  if (shotName === 'win' || shotName === 'loss') ui.floaters = [];
  else ui.floaters = ui.floaters.slice(-1);
  for (const floater of ui.floaters) floater.life = 1;
  drawGame(context, game, ui);
  document.title = `Ember Duel — ${shotName}`;
} else {
  window.requestAnimationFrame(frame);
}
