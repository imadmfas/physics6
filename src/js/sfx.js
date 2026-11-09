// أصوات مركّبة بالمتصفح، بلا ملفات صوتية.
let ctx = null, master = null;
const pref = { on: true, vol: 0.7 };
try { Object.assign(pref, JSON.parse(localStorage.getItem('p6-sound') || '{}')); } catch (e) {}

function ac() {
  if (!pref.on) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.connect(ctx.destination); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  master.gain.value = pref.vol * 0.5;
  return ctx;
}

function tone(f, { t = 0, dur = 0.15, type = 'sine', vol = 0.3, to = null, attack = 0.01 } = {}) {
  const c = ac(); if (!c) return;
  const s = c.currentTime + t, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, s);
  if (to) o.frequency.exponentialRampToValueAtTime(to, s + dur);
  g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(vol, s + attack); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  o.connect(g).connect(master); o.start(s); o.stop(s + dur + 0.05);
}
function noise({ t = 0, dur = 0.2, vol = 0.2, freq = 1200 } = {}) {
  const c = ac(); if (!c) return;
  const s = c.currentTime + t, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  src.connect(f).connect(g).connect(master); src.start(s);
}

export const sfx = {
  get on() { return pref.on; },
  set(on, vol) { pref.on = on; if (vol != null) pref.vol = vol; try { localStorage.setItem('p6-sound', JSON.stringify(pref)); } catch (e) {} },
  unlock() { ac(); },
  tap() { tone(660, { dur: 0.05, type: 'triangle', vol: 0.12 }); },
  flip() { noise({ dur: 0.12, vol: 0.08, freq: 2400 }); tone(520, { dur: 0.08, type: 'sine', vol: 0.06, to: 780 }); },
  correct() { [784, 988, 1319].forEach((f, i) => tone(f, { t: i * 0.07, dur: 0.18, type: 'triangle', vol: 0.18 })); },
  wrong() { tone(220, { dur: 0.25, type: 'sawtooth', vol: 0.1, to: 140 }); tone(233, { dur: 0.25, type: 'square', vol: 0.04, to: 150 }); },
  coin() { tone(988, { dur: 0.08, type: 'square', vol: 0.08 }); tone(1319, { t: 0.08, dur: 0.22, type: 'square', vol: 0.08 }); },
  star(i = 0) { tone(1046 + i * 262, { dur: 0.3, type: 'sine', vol: 0.2 }); tone(2093 + i * 524, { dur: 0.25, type: 'sine', vol: 0.05 }); },
  zap() { noise({ dur: 0.18, vol: 0.18, freq: 3500 }); tone(1800, { dur: 0.18, type: 'sawtooth', vol: 0.05, to: 300 }); },
  charge(d = 0.6) { tone(200, { dur: d, type: 'sine', vol: 0.08, to: 900, attack: 0.05 }); },
  unlock2() { [523, 659, 784, 1046].forEach((f, i) => tone(f, { t: i * 0.09, dur: 0.3, type: 'triangle', vol: 0.15 })); },
  levelup() {
    const seq = [523, 659, 784, 1046, 784, 1046, 1319];
    seq.forEach((f, i) => tone(f, { t: i * 0.1, dur: 0.28, type: 'square', vol: 0.07 }));
    seq.forEach((f, i) => tone(f / 2, { t: i * 0.1, dur: 0.28, type: 'triangle', vol: 0.1 }));
  },
  fail() { [392, 349, 311, 262].forEach((f, i) => tone(f, { t: i * 0.16, dur: 0.3, type: 'triangle', vol: 0.12 })); },
  tick() { tone(1500, { dur: 0.03, type: 'square', vol: 0.03 }); },
};
