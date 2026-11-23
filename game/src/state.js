// Ember Duel — the game state and the rules that move it.
// One Game owns both heroes, both decks, both boards and the turn. The renderer and the
// input layer only read it and call its small public verbs: startTurn, playCard, endTurn.

import {
  CARD_BY_ID, DECK_SIZE, HOUSES, MAX_BOARD, MAX_HAND, MAX_HP, MAX_MANA,
  OPENING_HAND, START_HP,
} from './config.js';
import { buildDeck, pickRandom } from './deck.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_OVER = 'over';

let nextCreatureId = 1;

function newHero(name, title, seed) {
  return {
    name, title,
    hp: START_HP, maxHp: MAX_HP,
    mana: 0, maxMana: 0,
    deck: buildDeck(seed),
    hand: [],
    board: [],
    cardsPlayed: 0,
    damageDealt: 0,
  };
}

/** A creature as it sits on the table: its card, current attack/defense and a stable id. */
export function makeCreature(card, owner) {
  return {
    uid: nextCreatureId,
    id: card.id, name: card.name, house: card.house,
    attack: card.attack, defense: card.defense, maxDefense: card.defense,
    owner, justPlayed: true,
  };
}

export class Game {
  constructor(seed = 1) {
    this.seed = seed;
    this.rng = null;
    this.phase = PHASE_TITLE;
    this.turn = 0;
    this.active = 'player'; // whose turn it is
    this.winner = null;
    this.log = [];
    this.events = []; // one-frame notices for the renderer: {kind, text, side}
    this.player = null;
    this.enemy = null;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed;
    nextCreatureId = 1;
    this.rng = null;
    this.phase = PHASE_TITLE;
    this.turn = 0;
    this.active = 'player';
    this.winner = null;
    this.log = ['The table is set. Ember against tide, leaf against gale.'];
    this.events = [];
    this.player = newHero('You', 'Ember Duelist', seed * 7919 + 11);
    this.enemy = newHero('Nyra', 'Ember Witch', seed * 104729 + 7);
  }

  /** Deal the opening hands and begin turn one. */
  startGame() {
    this.reset(this.seed);
    this.phase = PHASE_PLAY;
    this.rng = this.makeShotRng();
    for (let index = 0; index < OPENING_HAND; index += 1) {
      this.drawCard(this.player);
      this.drawCard(this.enemy);
    }
    this.beginTurn(this.player);
    this.say('Your turn — play a card, then end the turn.');
  }

  // The live game draws from Math.random through a tiny wrapper so the screenshot
  // autopilot can swap in a seeded one without touching the rules.
  makeShotRng() {
    return () => Math.random();
  }

  sideOf(hero) { return hero === this.player ? 'player' : 'enemy'; }
  otherHero(hero) { return hero === this.player ? this.enemy : this.player; }

  say(text) {
    this.log.push(text);
    if (this.log.length > 4) this.log.shift();
  }

  drawCard(hero) {
    if (hero.deck.length === 0) {
      hero.hp -= 2; // fatigue: an empty deck bites its owner
      this.say(`${hero.name} draws from an empty deck and takes 2 fatigue.`);
      this.checkEnd();
      return null;
    }
    const id = hero.deck.pop();
    if (hero.hand.length >= MAX_HAND) {
      this.say(`${hero.name}'s hand is full — ${CARD_BY_ID[id].name} is lost.`);
      return null;
    }
    hero.hand.push(id);
    return id;
  }

  /** Mana grows by one each of your turns, up to the cap, then refills and you draw. */
  beginTurn(hero) {
    this.turn += 1;
    hero.maxMana = Math.min(MAX_MANA, hero.maxMana + 1);
    hero.mana = hero.maxMana;
    this.drawCard(hero);
    this.say(hero === this.player ? `Turn ${this.turn} — your move.` : `Turn ${this.turn} — Nyra is thinking…`);
  }

  /** Resonance: playing a creature whose house is already on your board empowers that house. */
  applyResonance(hero, house) {
    const kin = hero.board.filter((creature) => creature.house === house);
    if (kin.length === 0) return 0;
    for (const creature of kin) creature.attack += 1;
    this.events.push({ kind: 'resonance', text: `Resonance! ${HOUSES[house].name} +1 attack`, side: this.sideOf(hero) });
    return kin.length;
  }

  canPlay(hero, handIndex) {
    const card = CARD_BY_ID[hero.hand[handIndex]];
    if (!card) return false;
    if (hero.mana < card.cost) return false;
    if (card.type === 'creature' && hero.board.length >= MAX_BOARD) return false;
    return true;
  }

  /** Play the card at handIndex for hero. Returns true when the card was played. */
  playCard(hero, handIndex) {
    if (this.phase !== PHASE_PLAY) return false;
    if (!this.canPlay(hero, handIndex)) return false;
    const card = CARD_BY_ID[hero.hand[handIndex]];
    hero.hand.splice(handIndex, 1);
    hero.mana -= card.cost;
    hero.cardsPlayed += 1;
    if (card.type === 'creature') {
      const resonance = this.applyResonance(hero, card.house);
      const creature = makeCreature(card, this.sideOf(hero));
      if (resonance > 0) creature.attack += 1; // the newcomer joins the resonance too
      hero.board.push(creature);
      this.events.push({ kind: 'play', text: `${hero.name} plays ${card.name}`, side: this.sideOf(hero) });
    } else {
      this.castSpell(hero, card);
    }
    this.checkEnd();
    return true;
  }

  castSpell(hero, card) {
    const foe = this.otherHero(hero);
    if (card.spell === 'burst') {
      this.damageHero(foe, 3);
      this.events.push({ kind: 'spell', text: `${card.name} hits ${foe.name} for 3!`, side: this.sideOf(foe) });
    } else if (card.spell === 'mend') {
      hero.hp = Math.min(hero.maxHp, hero.hp + 5);
      this.events.push({ kind: 'spell', text: `${hero.name} mends 5 life.`, side: this.sideOf(hero) });
    } else if (card.spell === 'bloom') {
      this.drawCard(hero);
      this.drawCard(hero);
      this.events.push({ kind: 'spell', text: `${hero.name} draws 2 cards.`, side: this.sideOf(hero) });
    } else if (card.spell === 'gust') {
      const target = pickRandom(this.rng, foe.board);
      if (target) {
        target.defense -= 2;
        this.events.push({ kind: 'spell', text: `${card.name} strikes ${target.name} for 2!`, side: this.sideOf(foe) });
        this.clearDead(foe);
      } else {
        this.damageHero(foe, 2);
        this.events.push({ kind: 'spell', text: `${card.name} hits ${foe.name} for 2!`, side: this.sideOf(foe) });
      }
    }
    this.say(`${hero.name} casts ${card.name}.`);
  }

  damageHero(hero, amount) {
    hero.hp -= amount;
    if (hero === this.enemy) this.player.damageDealt += amount;
    if (hero === this.player) this.enemy.damageDealt += amount;
  }

  clearDead(hero) {
    hero.board = hero.board.filter((creature) => creature.defense > 0);
  }

  /**
   * Every creature on the active side attacks: the creature in the opposite slot takes the
   * blow, or the enemy hero does when the slot is empty. Dead creatures leave the table.
   */
  resolveAttacks(hero) {
    const foe = this.otherHero(hero);
    const attackers = [...hero.board];
    for (let slot = 0; slot < attackers.length; slot += 1) {
      const attacker = attackers[slot];
      if (attacker.defense <= 0) continue;
      const target = foe.board[slot];
      if (target) {
        target.defense -= attacker.attack;
        this.events.push({ kind: 'hit', text: `${attacker.name} hits ${target.name} for ${attacker.attack}`, side: this.sideOf(foe) });
      } else {
        this.damageHero(foe, attacker.attack);
        this.events.push({ kind: 'hit', text: `${attacker.name} hits ${foe.name} for ${attacker.attack}!`, side: this.sideOf(foe) });
      }
      if (this.checkEnd()) return;
    }
    this.clearDead(hero);
    this.clearDead(foe);
    for (const creature of hero.board) creature.justPlayed = false;
  }

  /** End the active side's turn: its creatures attack, then the other side begins. */
  endTurn() {
    if (this.phase !== PHASE_PLAY) return;
    const hero = this.active === 'player' ? this.player : this.enemy;
    this.resolveAttacks(hero);
    if (this.phase !== PHASE_PLAY) return;
    this.active = this.active === 'player' ? 'enemy' : 'player';
    this.beginTurn(this.active === 'player' ? this.player : this.enemy);
  }

  checkEnd() {
    if (this.phase !== PHASE_PLAY) return this.phase === PHASE_OVER;
    if (this.player.hp <= 0 && this.enemy.hp <= 0) {
      this.winner = this.player.damageDealt >= this.enemy.damageDealt ? 'player' : 'enemy';
    } else if (this.enemy.hp <= 0) {
      this.winner = 'player';
    } else if (this.player.hp <= 0) {
      this.winner = 'enemy';
    } else {
      return false;
    }
    this.player.hp = Math.max(0, this.player.hp);
    this.enemy.hp = Math.max(0, this.enemy.hp);
    this.phase = PHASE_OVER;
    this.say(this.winner === 'player' ? 'Victory! Nyra’s flame is out.' : 'Defeat. Nyra keeps the table — this time.');
    return true;
  }

  get deckCount() { return DECK_SIZE; }
}
