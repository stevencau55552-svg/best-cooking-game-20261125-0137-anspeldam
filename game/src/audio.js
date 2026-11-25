// Original synthesized sounds for The Copper Ladle (WebAudio, no audio files).
// One clear job: every blip, sizzle and chime the kitchen makes.

export function createAudio() {
  return { ctx: null, muted: false, sizzleNodes: null };
}

function ensureContext(audio) {
  if (!audio.ctx) {
    try {
      audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audio.ctx = null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function tone(audio, freq, seconds, type, gainValue, when = 0) {
  if (audio.muted) return;
  const ctx = ensureContext(audio);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const t = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

export function playChop(audio) {
  tone(audio, 180, 0.08, 'square', 0.08);
  tone(audio, 90, 0.06, 'triangle', 0.1, 0.02);
}

export function playPickup(audio) {
  tone(audio, 520, 0.09, 'sine', 0.1);
  tone(audio, 780, 0.12, 'sine', 0.08, 0.06);
}

export function playServe(audio) {
  tone(audio, 660, 0.12, 'sine', 0.12);
  tone(audio, 880, 0.14, 'sine', 0.12, 0.1);
  tone(audio, 1320, 0.22, 'sine', 0.1, 0.2);
}

export function playDing(audio) {
  tone(audio, 1046, 0.25, 'triangle', 0.12);
}

export function playBad(audio) {
  tone(audio, 220, 0.18, 'sawtooth', 0.07);
  tone(audio, 160, 0.25, 'sawtooth', 0.07, 0.12);
}

export function playClick(audio) {
  tone(audio, 440, 0.05, 'square', 0.05);
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  return audio.muted;
}
