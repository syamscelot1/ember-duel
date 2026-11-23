// Ember Duel — small synthesized sounds, WebAudio only, no audio files.
// Everything is an oscillator blip so the game needs no network and no assets.

let context = null;
let muted = false;

function audioContext() {
  if (context === null) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

/** One short tone: frequency, length in seconds, shape and volume. */
export function playTone(frequency, duration, type = 'sine', volume = 0.12) {
  if (muted) return;
  const audio = audioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

/** A few notes in a row, each `step` seconds after the last. */
export function playMelody(notes, step = 0.12, type = 'triangle', volume = 0.12) {
  notes.forEach((frequency, index) => {
    window.setTimeout(() => playTone(frequency, step * 1.6, type, volume), index * step * 1000);
  });
}

export const sfx = {
  click() { playTone(660, 0.06, 'square', 0.05); },
  draw() { playTone(520, 0.08, 'sine', 0.07); },
  playCard() { playTone(392, 0.12, 'triangle', 0.12); playTone(587, 0.14, 'triangle', 0.08); },
  hit() { playTone(140, 0.16, 'sawtooth', 0.14); },
  heal() { playMelody([523, 659, 784], 0.09, 'sine', 0.08); },
  win() { playMelody([523, 659, 784, 1047, 1319], 0.13, 'triangle', 0.12); },
  lose() { playMelody([392, 330, 262, 196], 0.16, 'sawtooth', 0.09); },
  turn() { playTone(440, 0.07, 'sine', 0.06); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() { return muted; }
