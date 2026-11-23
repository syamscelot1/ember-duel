// Ember Duel — everything drawn on the canvas: the felt table, the heroes, the hands,
// the boards, the cards and the title / victory / defeat screens.
// All art is drawn with canvas paths (no image files), so the game loads nothing.

import { CARD_BY_ID, HOUSES, LAYOUT, TABLE_HEIGHT, TABLE_WIDTH } from './config.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_TITLE } from './state.js';

export const END_TURN_RECT = { x: 1124, y: 428, width: 132, height: 54 };
export const MUTE_RECT = { x: 1144, y: 16, width: 36, height: 28 };

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'center', weight = 'bold', font = 'Georgia, serif') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** One of the four house emblems, drawn as a shape so colour is never the only cue. */
export function drawHouseIcon(ctx, shape, cx, cy, size, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineJoin = 'round';
  if (shape === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.7, cy - size * 0.2, cx + size * 0.55, cy + size * 0.45, cx + size * 0.25, cy + size * 0.7);
    ctx.bezierCurveTo(cx + size * 0.1, cy + size * 0.85, cx - size * 0.1, cy + size * 0.85, cx - size * 0.25, cy + size * 0.7);
    ctx.bezierCurveTo(cx - size * 0.6, cy + size * 0.4, cx - size * 0.55, cy - size * 0.3, cx, cy - size);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.25);
    ctx.bezierCurveTo(cx + size * 0.3, cy + size * 0.1, cx + size * 0.2, cy + size * 0.5, cx, cy + size * 0.55);
    ctx.bezierCurveTo(cx - size * 0.2, cy + size * 0.5, cx - size * 0.3, cy + size * 0.1, cx, cy - size * 0.25);
    ctx.fill();
  } else if (shape === 'drop') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.75, cy - size * 0.1, cx + size * 0.6, cy + size * 0.7, cx, cy + size * 0.75);
    ctx.bezierCurveTo(cx - size * 0.6, cy + size * 0.7, cx - size * 0.75, cy - size * 0.1, cx, cy - size);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(cx - size * 0.2, cy + size * 0.15, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.8, cy - size * 0.4, cx + size * 0.8, cy + size * 0.5, cx, cy + size * 0.9);
    ctx.bezierCurveTo(cx - size * 0.8, cy + size * 0.5, cx - size * 0.8, cy - size * 0.4, cx, cy - size);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.7);
    ctx.lineTo(cx, cy + size * 0.7);
    ctx.stroke();
  } else { // swirl
    ctx.beginPath();
    for (let angle = 0; angle < Math.PI * 4.4; angle += 0.25) {
      const radius = (size * 0.9 * angle) / (Math.PI * 4.4);
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (angle === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The rectangles of the player's hand cards, fanned across the bottom of the table. */
export function handRects(count) {
  const { cardWidth, cardHeight, handY } = LAYOUT;
  const spacing = count <= 1 ? 0 : Math.min(140, (TABLE_WIDTH - 320) / (count - 1));
  const total = cardWidth + spacing * Math.max(0, count - 1);
  const startX = (TABLE_WIDTH - total) / 2;
  const rects = [];
  for (let index = 0; index < count; index += 1) {
    rects.push({ x: startX + index * spacing, y: handY, width: cardWidth, height: cardHeight });
  }
  return rects;
}

/** The rectangles of a side's board creatures, in a row across the middle. */
export function boardRects(side, count) {
  const { boardCardWidth, boardCardHeight, playerBoardY, enemyBoardY } = LAYOUT;
  const spacing = 116;
  const total = boardCardWidth + spacing * Math.max(0, count - 1);
  const startX = (TABLE_WIDTH - total) / 2;
  const y = side === 'player' ? playerBoardY : enemyBoardY;
  const rects = [];
  for (let index = 0; index < count; index += 1) {
    rects.push({ x: startX + index * spacing, y, width: boardCardWidth, height: boardCardHeight });
  }
  return rects;
}

function drawCardFace(ctx, card, x, y, width, height, options = {}) {
  const house = HOUSES[card.house];
  const scale = width / 132;
  ctx.save();
  if (options.dim) ctx.globalAlpha = 0.55;
  // Parchment body with a house-coloured frame.
  roundRect(ctx, x, y, width, height, 10 * scale);
  ctx.fillStyle = '#f8f1de';
  ctx.fill();
  ctx.lineWidth = 4 * scale;
  ctx.strokeStyle = house.colour;
  ctx.stroke();
  roundRect(ctx, x + 3 * scale, y + 3 * scale, width - 6 * scale, height - 6 * scale, 8 * scale);
  ctx.lineWidth = 1 * scale;
  ctx.strokeStyle = house.dark;
  ctx.stroke();
  // Cost gem, top left.
  ctx.beginPath();
  ctx.arc(x + 20 * scale, y + 20 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fillStyle = house.dark;
  ctx.fill();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  text(ctx, String(card.cost), x + 20 * scale, y + 21 * scale, 20 * scale, '#ffffff');
  // House emblem, top right.
  drawHouseIcon(ctx, house.shape, x + width - 20 * scale, y + 20 * scale, 11 * scale, house.colour);
  // Name.
  text(ctx, card.name, x + width / 2, y + 44 * scale, 15 * scale, '#241a10', 'center', 'bold');
  // Art panel: big house emblem on a house-tinted field.
  const artY = y + 54 * scale;
  const artH = 52 * scale;
  roundRect(ctx, x + 10 * scale, artY, width - 20 * scale, artH, 6 * scale);
  const gradient = ctx.createLinearGradient(x, artY, x, artY + artH);
  gradient.addColorStop(0, house.light);
  gradient.addColorStop(1, house.colour);
  ctx.fillStyle = gradient;
  ctx.fill();
  drawHouseIcon(ctx, house.shape, x + width / 2, artY + artH / 2, 22 * scale, 'rgba(255,255,255,0.92)');
  // Flavour / spell text (skipped on the small board cards, where it would crowd the numbers).
  if (!options.compact) {
    const lines = wrapText(ctx, card.text, width - 22 * scale, 11 * scale);
    lines.slice(0, 2).forEach((line, index) => {
      text(ctx, line, x + width / 2, y + 116 * scale + index * 12 * scale, 11 * scale, '#5a4632', 'center', 'normal', 'Georgia, serif');
    });
  }
  // Bottom row: attack and defense, or a SPELL ribbon.
  if (card.type === 'creature') {
    ctx.beginPath();
    ctx.arc(x + 24 * scale, y + height - 20 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    text(ctx, String(card.attack), x + 24 * scale, y + height - 19 * scale, 17 * scale, '#ffffff');
    ctx.beginPath();
    ctx.arc(x + width - 24 * scale, y + height - 20 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#2471a3';
    ctx.fill();
    ctx.stroke();
    text(ctx, String(card.defense), x + width - 24 * scale, y + height - 19 * scale, 17 * scale, '#ffffff');
    text(ctx, 'ATK', x + 24 * scale, y + height - 38 * scale, 8 * scale, '#c0392b');
    text(ctx, 'DEF', x + width - 24 * scale, y + height - 38 * scale, 8 * scale, '#2471a3');
  } else {
    roundRect(ctx, x + width / 2 - 34 * scale, y + height - 34 * scale, 68 * scale, 22 * scale, 11 * scale);
    ctx.fillStyle = house.dark;
    ctx.fill();
    text(ctx, '✦ SPELL ✦', x + width / 2, y + height - 22 * scale, 11 * scale, '#ffffff');
  }
  ctx.restore();
}

function wrapText(ctx, value, maxWidth, size) {
  ctx.font = `normal ${size}px Georgia, serif`;
  const words = value.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current === '' ? word : `${current} ${word}`;
    if (ctx.measureText(trial).width <= maxWidth || current === '') current = trial;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

function drawCardBack(ctx, x, y, width, height) {
  ctx.save();
  roundRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = '#5b1a1a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d4af37';
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 6);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#d4af37';
  ctx.stroke();
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(-14, -14, 28, 28);
  ctx.fillStyle = '#5b1a1a';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();
  ctx.restore();
}

function drawManaCrystals(ctx, x, y, mana, maxMana) {
  const spacing = 20;
  for (let index = 0; index < maxMana; index += 1) {
    const cx = x + index * spacing;
    ctx.beginPath();
    ctx.arc(cx, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = index < mana ? '#2fb7ff' : '#20344a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = index < mana ? '#bfe9ff' : '#4a5a6a';
    ctx.stroke();
  }
  text(ctx, `${mana}/${maxMana} mana`, x + maxMana * spacing + 10, y, 12, '#cfe3ff', 'left', 'bold', 'system-ui, sans-serif');
}

function drawHeroPanel(ctx, hero, x, y, isPlayer) {
  const width = 340;
  const height = 74;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = 'rgba(8, 14, 26, 0.78)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isPlayer ? '#d4af37' : '#e8491d';
  ctx.stroke();
  // Portrait disc with the hero's initial.
  ctx.beginPath();
  ctx.arc(x + 34, y + height / 2, 24, 0, Math.PI * 2);
  ctx.fillStyle = isPlayer ? '#d4af37' : '#8a4fd0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  text(ctx, hero.name.charAt(0), x + 34, y + height / 2 + 1, 26, '#ffffff');
  text(ctx, `${hero.name.toUpperCase()} — ${hero.title.toUpperCase()}`, x + 66, y + 18, 14, '#ffffff', 'left', 'bold', 'system-ui, sans-serif');
  // Life bar with the number on top.
  const barX = x + 66;
  const barY = y + 34;
  const barWidth = 254;
  const barHeight = 20;
  roundRect(ctx, barX, barY, barWidth, barHeight, 10);
  ctx.fillStyle = '#2a0d0d';
  ctx.fill();
  const fraction = Math.max(0, hero.hp / hero.maxHp);
  if (fraction > 0) {
    roundRect(ctx, barX, barY, Math.max(20, barWidth * fraction), barHeight, 10);
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#ff5a3c');
    gradient.addColorStop(1, '#ffb199');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  text(ctx, `♥ ${hero.hp} / ${hero.maxHp}`, barX + barWidth / 2, barY + barHeight / 2 + 1, 13, '#ffffff', 'center', 'bold', 'system-ui, sans-serif');
  drawManaCrystals(ctx, x + 66, y + 62, hero.mana, hero.maxMana);
}

function drawDeckPile(ctx, x, y, count, label) {
  drawCardBack(ctx, x, y, 44, 62);
  text(ctx, String(count), x + 22, y + 74, 13, '#ffffff', 'center', 'bold', 'system-ui, sans-serif');
  text(ctx, label, x + 22, y + 90, 10, '#9fb4d0', 'center', 'normal', 'system-ui, sans-serif');
}

function drawTable(ctx) {
  const gradient = ctx.createRadialGradient(640, 330, 80, 640, 360, 760);
  gradient.addColorStop(0, '#1f6b3a');
  gradient.addColorStop(0.6, '#14532a');
  gradient.addColorStop(1, '#0a2e18');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 360, 560, 250, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let index = 0; index < 5; index += 1) {
    ctx.beginPath();
    ctx.ellipse(640, 360, 480 + index * 22, 205 + index * 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTitleScreen(ctx, game, ui) {
  drawTable(ctx);
  // A fan of the four house cards behind the title.
  const preview = ['ember-phoenix', 'tide-leviathan', 'leaf-worldtree', 'gale-tempest'];
  preview.forEach((id, index) => {
    const x = 640 - 300 + index * 155;
    ctx.save();
    ctx.translate(x + 66, 500);
    ctx.rotate((index - 1.5) * 0.06);
    ctx.translate(-66, -92);
    drawCardFace(ctx, CARD_BY_ID[id], 0, 0, 132, 184);
    ctx.restore();
  });
  text(ctx, 'EMBER DUEL', 640, 130, 84, '#ffd23e', 'center', 'bold', 'Georgia, serif');
  text(ctx, 'A duel of four houses — Ember · Tide · Leaf · Gale', 640, 190, 22, '#f8f1de', 'center', 'normal', 'Georgia, serif');
  text(ctx, 'You have 30 life. Nyra has 30 life. Spend mana, play cards,', 640, 258, 18, '#d8e8d8', 'center', 'normal', 'Georgia, serif');
  text(ctx, 'match a house to spark Resonance, and break her guard.', 640, 282, 18, '#d8e8d8', 'center', 'normal', 'Georgia, serif');
  const pulse = 0.65 + 0.35 * Math.sin(ui.time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK OR PRESS ENTER TO PLAY  ◀', 640, 340, 24, '#ffffff', 'center', 'bold', 'system-ui, sans-serif');
  ctx.globalAlpha = 1;
  text(ctx, 'Keys: 1–7 play a card · Space ends your turn · M mutes · R restarts', 640, 700, 14, '#9fb4d0', 'center', 'normal', 'system-ui, sans-serif');
}

function drawPlayScreen(ctx, game, ui) {
  drawTable(ctx);
  const { player, enemy } = game;
  drawHeroPanel(ctx, enemy, 24, 14, false);
  drawHeroPanel(ctx, player, 24, 632, true);
  drawDeckPile(ctx, 1200, 14, enemy.deck.length, 'ENEMY DECK');
  drawDeckPile(ctx, 1200, 632, player.deck.length, 'YOUR DECK');
  // Turn banner.
  const yourTurn = game.active === 'player' && game.phase === PHASE_PLAY;
  const banner = game.phase === PHASE_PLAY
    ? (yourTurn ? 'YOUR TURN — play a card, then end your turn' : 'NYRA’S TURN…')
    : '';
  if (banner !== '') {
    roundRect(ctx, 470, 8, 340, 30, 15);
    ctx.fillStyle = yourTurn ? 'rgba(212, 175, 55, 0.9)' : 'rgba(120, 90, 160, 0.9)';
    ctx.fill();
    text(ctx, banner, 640, 24, 14, '#ffffff', 'center', 'bold', 'system-ui, sans-serif');
  }
  // Enemy hand, face down, fanned at the top.
  const enemyFanWidth = 64 + Math.max(0, enemy.hand.length - 1) * 46;
  const enemyFanX = (TABLE_WIDTH - enemyFanWidth) / 2;
  enemy.hand.forEach((_cardId, index) => {
    const y = 92 - Math.abs(index - (enemy.hand.length - 1) / 2) * 3;
    drawCardBack(ctx, enemyFanX + index * 46, y, 64, 88);
  });
  text(ctx, `Nyra holds ${enemy.hand.length} cards`, 640, 82, 13, '#cfe3ff', 'center', 'bold', 'system-ui, sans-serif');
  // Boards.
  const enemyBoard = boardRects('enemy', enemy.board.length);
  enemy.board.forEach((creature, index) => {
    drawBoardCreature(ctx, creature, enemyBoard[index]);
  });
  const playerBoard = boardRects('player', player.board.length);
  player.board.forEach((creature, index) => {
    drawBoardCreature(ctx, creature, playerBoard[index]);
  });
  if (enemy.board.length === 0) text(ctx, '— Nyra’s side of the table is empty —', 640, 252, 14, 'rgba(255,255,255,0.45)', 'center', 'normal', 'Georgia, serif');
  if (player.board.length === 0) text(ctx, '— your creatures will stand here —', 640, 418, 14, 'rgba(255,255,255,0.45)', 'center', 'normal', 'Georgia, serif');
  // Player hand, face up.
  const rects = handRects(player.hand.length);
  player.hand.forEach((cardId, index) => {
    const card = CARD_BY_ID[cardId];
    const rect = rects[index];
    const hovered = ui.hoverIndex === index;
    const y = hovered ? rect.y - 18 : rect.y;
    if (hovered) {
      ctx.save();
      ctx.shadowColor = '#ffd23e';
      ctx.shadowBlur = 22;
      roundRect(ctx, rect.x - 3, y - 3, rect.width + 6, rect.height + 6, 12);
      ctx.fillStyle = 'rgba(255, 210, 62, 0.25)';
      ctx.fill();
      ctx.restore();
    }
    const affordable = player.mana >= card.cost && game.phase === PHASE_PLAY && game.active === 'player';
    drawCardFace(ctx, card, rect.x, y, rect.width, rect.height, { dim: !affordable && game.phase === PHASE_PLAY });
    if (affordable && game.phase === PHASE_PLAY && game.active === 'player') {
      text(ctx, 'PLAYABLE', rect.x + rect.width / 2, y - 10, 10, '#ffd23e', 'center', 'bold', 'system-ui, sans-serif');
    }
  });
  // End turn button.
  const rect = END_TURN_RECT;
  const canEnd = game.phase === PHASE_PLAY && game.active === 'player';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
  ctx.fillStyle = canEnd ? '#d4af37' : '#5a5a5a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  text(ctx, 'END TURN', rect.x + rect.width / 2, rect.y + 20, 16, canEnd ? '#241a10' : '#cccccc', 'center', 'bold', 'system-ui, sans-serif');
  text(ctx, '[Space]', rect.x + rect.width / 2, rect.y + 40, 11, canEnd ? '#5a4632' : '#bbbbbb', 'center', 'normal', 'system-ui, sans-serif');
  // Log lines, bottom left above the player panel.
  game.log.slice(-3).forEach((line, index) => {
    text(ctx, line, 24, 540 + index * 20, 13, 'rgba(255,255,255,0.85)', 'left', 'normal', 'system-ui, sans-serif');
  });
  // Floating event notices.
  ui.floaters.forEach((floater) => {
    ctx.globalAlpha = Math.max(0, floater.life);
    text(ctx, floater.text, floater.x, floater.y, 18, floater.colour, 'center', 'bold', 'Georgia, serif');
  });
  ctx.globalAlpha = 1;
  // Mute button.
  roundRect(ctx, MUTE_RECT.x, MUTE_RECT.y, MUTE_RECT.width, MUTE_RECT.height, 6);
  ctx.fillStyle = 'rgba(8, 14, 26, 0.7)';
  ctx.fill();
  text(ctx, ui.muted ? '🔇' : '🔊', MUTE_RECT.x + 18, MUTE_RECT.y + 15, 15, '#ffffff');
}

function drawBoardCreature(ctx, creature, rect) {
  const card = CARD_BY_ID[creature.id];
  const face = { ...card, attack: creature.attack, defense: creature.defense };
  drawCardFace(ctx, face, rect.x, rect.y, rect.width, rect.height, { compact: true });
  if (creature.justPlayed) {
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.strokeStyle = 'rgba(255, 210, 62, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function drawOverScreen(ctx, game, ui) {
  drawPlayScreen(ctx, game, ui);
  ctx.fillStyle = 'rgba(6, 10, 18, 0.82)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  const won = game.winner === 'player';
  const bannerY = 210;
  text(ctx, won ? '★ VICTORY! ★' : 'DEFEAT', 640, bannerY, 76, won ? '#ffd23e' : '#ff5a3c', 'center', 'bold', 'Georgia, serif');
  text(ctx, won ? 'Nyra’s flame is out. The table is yours.' : 'Nyra keeps the table — this time.', 640, bannerY + 70, 22, '#f8f1de', 'center', 'normal', 'Georgia, serif');
  const stats = [
    `Turns played: ${game.turn}`,
    `Cards you played: ${game.player.cardsPlayed}`,
    `Damage you dealt: ${game.player.damageDealt}`,
    `Your life left: ${game.player.hp} / ${game.player.maxHp}`,
  ];
  stats.forEach((line, index) => {
    text(ctx, line, 640, bannerY + 130 + index * 30, 18, '#d8e8d8', 'center', 'normal', 'system-ui, sans-serif');
  });
  const pulse = 0.65 + 0.35 * Math.sin(ui.time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS R TO PLAY AGAIN', 640, bannerY + 280, 22, '#ffffff', 'center', 'bold', 'system-ui, sans-serif');
  ctx.globalAlpha = 1;
}

/** Draw the whole game for the current phase. `ui` carries hover, floaters and time. */
export function drawGame(ctx, game, ui) {
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (game.phase === PHASE_TITLE) drawTitleScreen(ctx, game, ui);
  else if (game.phase === PHASE_OVER) drawOverScreen(ctx, game, ui);
  else drawPlayScreen(ctx, game, ui);
}
