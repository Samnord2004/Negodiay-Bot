// Web Audio API sound synthesizer for Mortal Kombat Tournament

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMKGongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 1.8);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.8);
}

export function playMKHitSound(heavy = false) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (heavy ? 0.04 : 0.02)));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(heavy ? 600 : 1200, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(heavy ? 0.6 : 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
}

export function playMKFreezeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.linearRampToValueAtTime(3200, now + 0.25);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

export function playMKSpearSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function playMKFatalitySound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Low dark dramatic doom chord
  [65.4, 77.78, 98.0, 130.8].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    gain.gain.setValueAtTime(0.2, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.05);
    osc.stop(now + 2.5);
  });
}
