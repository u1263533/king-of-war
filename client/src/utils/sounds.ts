/**
 * Procedural sound effects using Web Audio API.
 * No audio files needed — all sounds are generated programmatically.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  startTime = 0,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
}

function playNoise(duration: number, volume = 0.08, startTime = 0) {
  const ctx = getCtx();
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime + startTime);
  src.stop(ctx.currentTime + startTime + duration);
}

/** Rapid clicking / rattling — dice rolling */
export function playDiceRoll() {
  for (let i = 0; i < 12; i++) {
    playNoise(0.04, 0.12, i * 0.06);
    playTone(300 + Math.random() * 400, 0.03, "square", 0.04, i * 0.06);
  }
}

/** Coin clink — purchase sound */
export function playBuy() {
  playTone(1200, 0.08, "sine", 0.12, 0);
  playTone(1600, 0.1, "sine", 0.10, 0.06);
  playTone(2000, 0.15, "sine", 0.08, 0.12);
}

/** Construction / hammer sound */
export function playBuild() {
  playNoise(0.05, 0.15, 0);
  playTone(200, 0.08, "square", 0.10, 0);
  playNoise(0.05, 0.12, 0.15);
  playTone(250, 0.08, "square", 0.08, 0.15);
  playNoise(0.05, 0.10, 0.30);
  playTone(300, 0.08, "square", 0.06, 0.30);
}

/** Dramatic horn — combat start */
export function playCombatStart() {
  playTone(180, 0.6, "sawtooth", 0.10, 0);
  playTone(220, 0.5, "sawtooth", 0.08, 0.15);
  playTone(280, 0.5, "sawtooth", 0.12, 0.3);
  playTone(360, 0.8, "sawtooth", 0.10, 0.5);
}

/** Triumphant fanfare — victory */
export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.3, "square", 0.10, i * 0.15);
    playTone(freq * 1.5, 0.25, "sine", 0.06, i * 0.15 + 0.05);
  });
}

/** Low somber sound — defeat */
export function playDefeat() {
  playTone(200, 0.8, "sine", 0.12, 0);
  playTone(160, 0.8, "sine", 0.10, 0.3);
  playTone(120, 1.0, "sine", 0.08, 0.6);
}

/** Card swoosh */
export function playCardPlay() {
  playNoise(0.12, 0.10, 0);
  playTone(800, 0.06, "sine", 0.04, 0.02);
}

/** Military march beat — recruit */
export function playRecruit() {
  playTone(150, 0.1, "square", 0.10, 0);
  playNoise(0.04, 0.12, 0.12);
  playTone(150, 0.1, "square", 0.10, 0.24);
  playNoise(0.04, 0.12, 0.36);
  playTone(200, 0.15, "square", 0.08, 0.48);
}

/** Subtle click — button press */
export function playButtonClick() {
  playTone(1000, 0.04, "sine", 0.06, 0);
}

/** Notification chime — turn start */
export function playTurnStart() {
  playTone(880, 0.12, "sine", 0.08, 0);
  playTone(1100, 0.15, "sine", 0.06, 0.1);
}

/** Descending tone — coin loss */
export function playCoinLoss() {
  playTone(600, 0.12, "sine", 0.10, 0);
  playTone(450, 0.12, "sine", 0.08, 0.1);
  playTone(300, 0.2, "sine", 0.06, 0.2);
}

/** Explosion — fuse mine / combat hit */
export function playExplosion() {
  playNoise(0.4, 0.20, 0);
  playTone(80, 0.3, "sawtooth", 0.15, 0);
  playTone(60, 0.5, "sawtooth", 0.10, 0.1);
  playNoise(0.3, 0.10, 0.15);
}
