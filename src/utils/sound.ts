// Efeitos sonoros 8-bit gerados com Web Audio (sem ficheiros externos).
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freqs: number[], step = 0.08, type: OscillatorType = 'square', volume = 0.06) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime;
  freqs.forEach((f, i) => {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.setValueAtTime(volume, t0 + i * step);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (i + 1) * step);
    osc.connect(gain).connect(a.destination);
    osc.start(t0 + i * step);
    osc.stop(t0 + (i + 1) * step + 0.02);
  });
}

export const sfx = {
  correct: () => tone([660, 880, 1320], 0.07),
  wrong: () => tone([220, 165], 0.14, 'sawtooth', 0.05),
  tick: () => tone([1000], 0.03, 'square', 0.025),
  unlock: () => tone([523, 659, 784, 1046], 0.09),
  click: () => tone([440], 0.03, 'square', 0.03),
};
