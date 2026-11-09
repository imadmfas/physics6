// تجارب الفصل الرابع: الموجات الكهرومغناطيسية
import { slider, toggle, readouts, frame, goals } from './kit.js';
import { sfx } from '../js/sfx.js';
import { sparks } from '../js/fx.js';

const hit = (G, st, onGoal) => G.check(st, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
const loop = (fn) => { let raf = 0, last = performance.now(), on = true; const f = (t) => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(raf); }; };
function canvas(w, h) { const c = document.createElement('canvas'); c.className = 'rcplot'; c.width = w; c.height = h; return c; }

const BANDS = [
  [3e3, 3e9, 'الموجات الراديوية', '#a78bfa'], [3e9, 3e11, 'المايكروويف', '#818cf8'], [3e11, 4.3e14, 'تحت الحمراء', '#f87171'],
  [4.3e14, 7.5e14, 'الضوء المرئي', '#fde68a'], [7.5e14, 3e16, 'فوق البنفسجية', '#c084fc'], [3e16, 3e19, 'الأشعة السينية', '#67e8f9'], [3e19, 3e23, 'أشعة كاما', '#34d399'],
];
const band = (f) => BANDS.find(([a, b]) => f >= a && f < b) || BANDS[BANDS.length - 1];
function visColor(f) { const l = 3e8 / f * 1e9; const h = l < 450 ? 270 : l < 495 ? 230 : l < 570 ? 130 : l < 590 ? 55 : l < 620 ? 30 : 0; return `hsl(${h},90%,60%)`; }

/* ===== 1) انتشار الموجة الكهرومغناطيسية والطيف ===== */
export function emwave(mount, { onGoal } = {}) {
  const f = frame('الموجة الكهرومغناطيسية وطيفها', 'مجال كهربائي (أحمر) ومجال مغناطيسي (أزرق) متعامدان ومتفقان في الطور، وكلاهما عمودي على اتجاه الانتشار. حرّك منزلق التردد عبر الطيف: تنتشر كل الموجات بسرعة الضوء c، ويتغير الطول الموجي λ = c/f.');
  mount.appendChild(f.root);
  const S = { lg: 14.7, seen: new Set() };
  const cv = canvas(700, 300); const sp = canvas(700, 70); f.stage.append(cv, sp);
  const sl = slider('التردد (مقياس لوغاريتمي)', { min: 4, max: 21, step: 0.1, value: S.lg, unit: '', fmt: (v) => `10^${v.toFixed(1)} Hz` }, (v) => { S.lg = v; S.seen.add(band(10 ** v)[2]); hit(G, S, onGoal); });
  const R = readouts([['f', 'التردد f'], ['l', 'الطول الموجي λ'], ['b', 'المنطقة']]);
  const G = goals([{ text: 'مرّ بثلاث مناطق مختلفة من الطيف', test: (st) => st.seen.size >= 3 }, { text: 'اعثر على الضوء المرئي', test: (st) => st.seen.has('الضوء المرئي') }]);
  f.ctrl.append(sl.el, R.el, G.el);
  const c = cv.getContext('2d'), s2 = sp.getContext('2d'); let t = 0;
  // شريط الطيف
  const drawSpec = () => {
    s2.clearRect(0, 0, 700, 70);
    BANDS.forEach(([a, b, name, col]) => { const x1 = (Math.log10(a) - 4) / 17 * 700, x2 = (Math.log10(b) - 4) / 17 * 700; s2.fillStyle = col; s2.globalAlpha = 0.35; s2.fillRect(x1, 10, x2 - x1, 30); s2.globalAlpha = 1; s2.fillStyle = '#e2e8f0'; s2.font = '11px Tajawal'; s2.textAlign = 'center'; s2.fillText(name, (x1 + x2) / 2, 58); });
    const x = (S.lg - 4) / 17 * 700; s2.fillStyle = '#fff'; s2.fillRect(x - 2, 4, 4, 42);
  };
  const stop = loop((dt) => {
    t += dt; const fq = 10 ** S.lg, lam = 3e8 / fq, bd = band(fq);
    const kpx = 2 * Math.PI / (60 + (21 - S.lg) * 14); // طول موجي معروض
    c.clearRect(0, 0, 700, 300);
    const y0 = 150, x0 = 40;
    c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(680, y0); c.stroke(); c.fillStyle = '#64748b'; c.fillText('اتجاه الانتشار', 600, y0 + 20);
    for (let x = 0; x < 640; x += 6) {
      const ph = kpx * x - t * 5, E = Math.sin(ph) * 90, B = Math.sin(ph) * 60;
      c.strokeStyle = 'rgba(248,113,113,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + x, y0); c.lineTo(x0 + x, y0 - E); c.stroke();
      c.strokeStyle = 'rgba(96,165,250,.8)'; c.beginPath(); c.moveTo(x0 + x, y0); c.lineTo(x0 + x + B * 0.6, y0 + B * 0.35); c.stroke();
    }
    c.fillStyle = '#f87171'; c.font = 'bold 16px Tajawal'; c.fillText('E', 20, 60); c.fillStyle = '#60a5fa'; c.fillText('B', 20, 250);
    if (bd[2] === 'الضوء المرئي') { c.fillStyle = visColor(fq); c.globalAlpha = 0.25; c.fillRect(0, 0, 700, 300); c.globalAlpha = 1; }
    drawSpec();
    R.set('f', fq, 'Hz'); R.set('l', lam, 'm'); R.set('b', `\\text{${bd[2]}}`);
  });
  return { destroy: stop };
}

/* ===== 2) التضمين: السعوي والترددي ===== */
export function modulation(mount, { onGoal } = {}) {
  const f = frame('تضمين الموجات: AM و FM', 'تحمل الموجة الحاملة عالية التردد إشارة الصوت. في التضمين السعوي تتغير سعة الحاملة وفق الإشارة، وفي التضمين الترددي يتغير ترددها وتبقى سعتها ثابتة.');
  mount.appendChild(f.root);
  const S = { mode: 'AM', fs: 2, seen: new Set(['AM']) };
  const cv = canvas(700, 330); f.stage.appendChild(cv);
  const seg = toggle([['AM', 'تضمين سعوي AM'], ['FM', 'تضمين ترددي FM']], 'AM', (v) => { S.mode = v; S.seen.add(v); sfx.flip(); hit(G, S, onGoal); });
  const sf = slider('تردد إشارة الصوت', { min: 1, max: 5, step: 0.5, value: S.fs }, (v) => { S.fs = v; });
  const G = goals([{ text: 'قارن بين التضمينين', test: (st) => st.seen.size === 2 }]);
  f.ctrl.append(seg, sf.el, G.el);
  const c = cv.getContext('2d'); let t = 0;
  const row = (y, col, fn, label) => { c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); for (let x = 0; x <= 640; x += 1.5) { const v = fn(x); x ? c.lineTo(30 + x, y - v) : c.moveTo(30 + x, y - v); } c.stroke(); c.fillStyle = '#94a3b8'; c.font = '14px Tajawal'; c.textAlign = 'right'; c.fillText(label, 690, y - 34); };
  const stop = loop((dt) => {
    t += dt; c.clearRect(0, 0, 700, 330);
    const sig = (x) => Math.sin(x / 640 * Math.PI * 2 * S.fs - t * 2);
    row(60, '#fbbf24', (x) => 26 * sig(x), 'إشارة الصوت');
    row(165, '#a78bfa', (x) => 26 * Math.sin(x * 0.45 - t * 20), 'الموجة الحاملة');
    if (S.mode === 'AM') row(275, '#22d3ee', (x) => (30 + 18 * sig(x)) * Math.sin(x * 0.45 - t * 20), 'الموجة المضمَّنة سعويًا');
    else { let ph = 0; const pts = []; for (let x = 0; x <= 640; x += 1.5) { ph += 0.45 * 1.5 * (1 + 0.6 * sig(x)); pts.push(ph); } let k = 0; row(275, '#22d3ee', () => 30 * Math.sin(pts[k++] - t * 20), 'الموجة المضمَّنة ترددياً'); }
  });
  return { destroy: stop };
}

export const SIMS = { emwave, modulation };
