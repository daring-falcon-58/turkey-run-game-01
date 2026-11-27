// All sound is synthesized with WebAudio — no audio files, no network.
// A gobble, a jump boing, a pickup chirp, a hit thud and a win fanfare,
// each built from a few oscillators so the game stays a handful of files.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      return null;
    }
    return context;
  }

  function tone(freq, seconds, type, volume, when = 0, slideTo = null) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    jump() {
      tone(280, 0.16, 'sine', 0.16, 0, 620);
    },
    dash() {
      tone(900, 0.12, 'sawtooth', 0.07, 0, 300);
    },
    pickup() {
      tone(880, 0.09, 'triangle', 0.14);
      tone(1318, 0.12, 'triangle', 0.12, 0.07);
    },
    gold() {
      tone(660, 0.1, 'triangle', 0.14);
      tone(990, 0.1, 'triangle', 0.14, 0.08);
      tone(1320, 0.18, 'triangle', 0.14, 0.16);
    },
    hit() {
      tone(160, 0.25, 'sawtooth', 0.2, 0, 60);
      tone(90, 0.3, 'square', 0.12, 0, 45);
    },
    gobble() {
      // Three fast low clucks: the turkey's panic call when the farmer closes in.
      tone(220, 0.07, 'square', 0.1, 0, 140);
      tone(200, 0.07, 'square', 0.1, 0.09, 130);
      tone(240, 0.09, 'square', 0.1, 0.18, 150);
    },
    stage() {
      tone(523, 0.12, 'triangle', 0.14);
      tone(784, 0.16, 'triangle', 0.14, 0.1);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.15, i * 0.13));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.09, i * 0.16));
    },
  };
}
