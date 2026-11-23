[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/syamscelot1/ember-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/syamscelot1/ember-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Duel

A duel of four houses — Ember, Tide, Leaf, Gale. You have 30 life, Nyra the Ember
Witch has 30 life. Spend mana, play cards, match a house to spark Resonance, and
break her guard before she breaks yours.

## How it plays

- Each turn your mana grows by one (up to 10), refills, and you draw a card.
- Click a card in your hand (or press 1–7) to play it when you can afford it.
  Creatures take their place on your side of the table; spells resolve at once.
- **Resonance:** playing a creature whose house is already on your side gives every
  creature of that house +1 attack — including the newcomer.
- Click **End Turn** (or press Space) and your creatures attack: each one strikes
  the creature opposite it, or Nyra herself when the slot is empty. Then Nyra plays.
- The duel ends when a hero reaches 0 life. An empty deck bites its owner for 2
  fatigue each draw, so stalling has a price.
- Nyra plays by readable rules: biggest creature first, Burst when it can finish
  you, Mend when she is hurt, Bloom when her hand is thin.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files (canvas, ES modules,
synthesized WebAudio sounds). Screenshots are real renders of the game via
`?shot=start|play|win|loss` (see `shots.json`).

## Files

- `game/index.html` — the page, canvas only
- `game/src/main.js` — bootstrap, frame loop, Nyra's turn timer
- `game/src/config.js` — the four houses and all 20 original cards
- `game/src/state.js` — the rules: turns, mana, Resonance, combat, fatigue
- `game/src/ai.js` — Nyra's decisions and the screenshot autopilot
- `game/src/render.js` — the felt table, cards, heroes and screens
- `game/src/input.js` — mouse and keyboard
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/deck.js` — seeded shuffle so every game is reproducible
- `game/src/shots.js` — the deterministic `?shot=` scenes
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes the dossier)
- `serve.ts` — tiny static server for local play-testing
