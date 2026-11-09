// تجارب الفصل الثالث: التيار المتناوب
import { slider, toggle, readouts, svg, frame, goals } from './kit.js';
import { sfx } from '../js/sfx.js';
import { sparks } from '../js/fx.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const hit = (G, st, onGoal) => G.check(st, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
const loop = (fn) => { let raf = 0, last = performance.now(), on = true; const f = (t) => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(raf); }; };
function canvas(w, h) { const c = document.createElement('canvas'); c.className = 'rcplot'; c.width = w; c.height = h; return c; }

/* ===== 1) الطور بين الفولطية والتيار في دوائر R و L و C ===== */
export function phasor(mount, { onGoal } = {}) {
  const f = frame('الطور بين الفولطية والتيار', 'اختر عنصر الدائرة: في المقاومة الصرف يتفق الطوران، وفي المحث الصرف تتقدم الفولطية على التيار بربع دورة، وفي المتسعة الصرف يتقدم التيار على الفولطية بربع دورة. المتجهان الدوّاران (الطوريان) يوضحان ذلك.');
  mount.appendChild(f.root);
  const S = { el: 'R', f: 1, seen: new Set() };
  const cv = canvas(700, 300); f.stage.appendChild(cv);
  const seg = toggle([['R', 'مقاومة صرف R'], ['L', 'محث صرف L'], ['C', 'متسعة صرف C']], 'R', (v) => { S.el = v; S.seen.add(v); sfx.flip(); hit(G, S, onGoal); });
  const sf = slider('سرعة العرض', { min: 0.3, max: 2, step: 0.1, value: S.f }, (v) => { S.f = v; });
  const R = readouts([['ph', 'فرق الطور φ بين V و I'], ['who', 'المتقدم في الطور']]);
  const G = goals([{ text: 'جرّب العناصر الثلاثة وقارن فرق الطور', test: (st) => st.seen.size >= 3 }]);
  f.ctrl.append(seg, sf.el, R.el, G.el);
  S.seen.add('R');
  const c = cv.getContext('2d'); let t = 0;
  const stop = loop((dt) => {
    t += dt * S.f * 2;
    const ph = S.el === 'R' ? 0 : S.el === 'L' ? Math.PI / 2 : -Math.PI / 2; // تقدم V على I
    c.clearRect(0, 0, 700, 300);
    // الدائرة المرجعية والطوريان
    const cx = 130, cy = 150, r = 95;
    c.strokeStyle = '#334155'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
    const arrow = (a, col, len, lab) => { const x = cx + Math.cos(a) * len, y = cy - Math.sin(a) * len; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke(); c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.font = 'bold 16px Tajawal'; c.fillText(lab, x + 8, y - 6); };
    arrow(t, '#f472b6', r * 0.75, 'I'); arrow(t + ph, '#22d3ee', r, 'V');
    // المنحنيان
    const x0 = 260, w = 420;
    c.strokeStyle = '#334155'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, cy); c.lineTo(x0 + w, cy); c.stroke();
    const wave = (off, amp, col) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= w; i += 3) { const a = t + off - i / 60; const y = cy - Math.sin(a) * amp; i ? c.lineTo(x0 + i, y) : c.moveTo(x0 + i, y); } c.stroke(); };
    wave(0, r * 0.75, '#f472b6'); wave(ph, r, '#22d3ee');
    c.fillStyle = '#22d3ee'; c.font = '15px Tajawal'; c.fillText('الفولطية V', x0 + w - 80, 24); c.fillStyle = '#f472b6'; c.fillText('التيار I', x0 + w - 160, 24);
    R.set('ph', S.el === 'R' ? '0' : S.el === 'L' ? '+90°' : '-90°');
    R.set('who', S.el === 'R' ? '\\text{متفقان في الطور}' : S.el === 'L' ? '\\text{الفولطية}' : '\\text{التيار}');
  });
  return { destroy: stop };
}

/* ===== 2) دائرة RLC على التوالي: الرنين ===== */
export function rlc(mount, { onGoal } = {}) {
  const f = frame('دائرة RLC والرنين', 'غيّر تردد المصدر: عند تردد الرنين تتساوى رادة الحث ورادة السعة، فتصير الممانعة أصغر ما يمكن وتساوي المقاومة، ويبلغ التيار أعظم مقدار، ويكون عامل القدرة واحدًا.');
  mount.appendChild(f.root);
  const S = { f: 200, R: 20, L: 0.1, C: 10e-6, V: 50, hitRes: false };
  const cv = canvas(700, 300); f.stage.appendChild(cv);
  const sf = slider('تردد المصدر f', { min: 50, max: 1000, step: 5, value: S.f, unit: 'Hz' }, (v) => { S.f = v; draw(); });
  const sR = slider('المقاومة R', { min: 5, max: 100, step: 5, value: S.R, unit: 'Ω' }, (v) => { S.R = v; draw(); });
  const sL = slider('معامل الحث L', { min: 0.02, max: 0.5, step: 0.02, value: S.L, unit: 'H' }, (v) => { S.L = v; draw(); });
  const sC = slider('السعة C', { min: 2, max: 50, step: 1, value: S.C * 1e6, unit: 'μF' }, (v) => { S.C = v * 1e-6; draw(); });
  const R = readouts([['XL', 'X_L = 2πfL'], ['XC', 'X_C = 1/(2πfC)'], ['Z', 'الممانعة Z'], ['I', 'التيار I'], ['pf', 'عامل القدرة cosφ'], ['fr', 'تردد الرنين f_r']]);
  const G = goals([
    { text: 'اضبط التردد على الرنين (عامل القدرة يقارب 1)', test: (st) => st.pf > 0.995 },
    { text: 'في الرنين صغّر المقاومة: يرتفع منحني الرنين ويضيق (يزداد عامل النوعية)', test: (st) => st.pf > 0.99 && st.R <= 10 },
    { text: 'اجعل الدائرة ذات خصائص حثية (X_L > X_C)', test: (st) => st.XL > st.XC * 1.5 },
  ]);
  f.ctrl.append(sf.el, sR.el, sL.el, sC.el, R.el, G.el);
  const c = cv.getContext('2d');
  const I_of = (fr) => { const XL = 2 * Math.PI * fr * S.L, XC = 1 / (2 * Math.PI * fr * S.C); return S.V / Math.hypot(S.R, XL - XC); };
  function draw() {
    const XL = 2 * Math.PI * S.f * S.L, XC = 1 / (2 * Math.PI * S.f * S.C), Z = Math.hypot(S.R, XL - XC), I = S.V / Z, pf = S.R / Z, fr = 1 / (2 * Math.PI * Math.sqrt(S.L * S.C));
    c.clearRect(0, 0, 700, 300);
    // منحني الرنين
    const x0 = 50, y0 = 270, w = 400, h = 230, fmax = 1000, Imax = S.V / 5;
    c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, 30); c.lineTo(x0, y0); c.lineTo(x0 + w + 10, y0); c.stroke();
    c.strokeStyle = '#22d3ee'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= w; i += 2) { const fr2 = 10 + i / w * fmax, y = y0 - I_of(fr2) / Imax * h; i ? c.lineTo(x0 + i, Math.max(20, y)) : c.moveTo(x0 + i, y); } c.stroke();
    const xf = x0 + S.f / fmax * w, yf = y0 - I / Imax * h;
    c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(xf, Math.max(20, yf), 8, 0, 7); c.fill();
    c.setLineDash([5, 5]); c.strokeStyle = '#a78bfa'; c.beginPath(); c.moveTo(x0 + fr / fmax * w, 30); c.lineTo(x0 + fr / fmax * w, y0); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#94a3b8'; c.font = '14px Tajawal'; c.fillText('f', x0 + w + 14, y0 + 5); c.fillText('I', x0 - 18, 30); c.fillStyle = '#a78bfa'; c.fillText('f_r', x0 + fr / fmax * w - 8, 22);
    // مثلث الممانعة
    const ox = 520, oy = 230, sc = 140 / Math.max(S.R, Math.abs(XL - XC), 1);
    const rx = ox + S.R * sc, ry = oy - (XL - XC) * sc * 0.6;
    c.lineWidth = 4; c.strokeStyle = '#34d399'; c.beginPath(); c.moveTo(ox, oy); c.lineTo(rx, oy); c.stroke();
    c.strokeStyle = (XL > XC ? '#f59e0b' : '#60a5fa'); c.beginPath(); c.moveTo(rx, oy); c.lineTo(rx, clamp(ry, 20, 290)); c.stroke();
    c.strokeStyle = '#f472b6'; c.beginPath(); c.moveTo(ox, oy); c.lineTo(rx, clamp(ry, 20, 290)); c.stroke();
    c.fillStyle = '#34d399'; c.fillText('R', (ox + rx) / 2, oy + 18); c.fillStyle = '#f472b6'; c.fillText('Z', (ox + rx) / 2 - 16, (oy + clamp(ry, 20, 290)) / 2); c.fillStyle = XL > XC ? '#f59e0b' : '#60a5fa'; c.fillText('X_L − X_C', rx + 6, (oy + clamp(ry, 20, 290)) / 2);
    R.set('XL', +XL.toFixed(1), 'Ω'); R.set('XC', +XC.toFixed(1), 'Ω'); R.set('Z', +Z.toFixed(1), 'Ω'); R.set('I', +I.toFixed(3), 'A'); R.set('pf', +pf.toFixed(3)); R.set('fr', +fr.toFixed(1), 'Hz');
    Object.assign(S, { XL, XC, pf }); hit(G, S, onGoal);
  }
  draw();
  return { destroy() {} };
}

/* ===== 3) دائرة المحث والمتسعة: الاهتزاز الكهرومغناطيسي ===== */
export function lc(mount, { onGoal } = {}) {
  const f = frame('دائرة الاهتزاز الكهرومغناطيسي LC', 'اشحن المتسعة ثم أغلق الدائرة: تتحول الطاقة ذهابًا وإيابًا بين المجال الكهربائي للمتسعة والمجال المغناطيسي للمحث. أضف مقاومة لترى تخامد الاهتزاز.');
  mount.appendChild(f.root);
  const S = { q: 1, i: 0, L: 1, C: 1, R: 0, run: false, cycles: 0 };
  const wrap = document.createElement('div'); wrap.className = 'rcwrap';
  const s = svg(300, 240); const cv = canvas(640, 260); wrap.append(s, cv); f.stage.appendChild(wrap);
  const b = document.createElement('button'); b.className = 'btn go'; b.textContent = '⚡ اشحن ثم أغلق الدائرة';
  const sr = toggle([['0', 'بلا مقاومة'], ['0.3', 'مع مقاومة صغيرة']], '0', (v) => { S.R = +v; });
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(b, sr);
  const G = goals([{ text: 'شغّل الدائرة وراقب تبادل الطاقة', test: (st) => st.cycles >= 2 }, { text: 'أضف مقاومة: يتخامد الاهتزاز', test: (st) => st.R > 0 && st.run && st.q * st.q + st.i * st.i < 0.2 }]);
  f.ctrl.append(row, G.el);
  const c = cv.getContext('2d'); const hist = []; let prevSign = 1;
  b.onclick = () => { S.q = 1; S.i = 0; S.run = true; hist.length = 0; sfx.charge(0.4); };
  const stop = loop((dt) => {
    if (S.run) for (let k = 0; k < 4; k++) { const h = dt * 1.5; const di = (-S.q / S.C - S.R * S.i) / S.L * h; S.i += di; S.q += S.i * h; }
    if (Math.sign(S.q) !== prevSign && S.run) { S.cycles += 0.5; prevSign = Math.sign(S.q); }
    const UE = S.q * S.q / 2, UB = S.i * S.i * S.L / 2;
    s.innerHTML = `<path d="M60,40 H240 V200 H60 Z" fill="none" stroke="#94a3b8" stroke-width="3"/>
      <g transform="translate(60,120)"><rect x="-18" y="-24" width="36" height="48" fill="#0b1220"/><line x1="-22" y1="-7" x2="22" y2="-7" stroke="${S.q >= 0 ? '#f87171' : '#60a5fa'}" stroke-width="5"/><line x1="-22" y1="7" x2="22" y2="7" stroke="${S.q >= 0 ? '#60a5fa' : '#f87171'}" stroke-width="5"/>${[...Array(Math.round(Math.abs(S.q) * 4))].map((_, k) => `<line x1="${-15 + k * 10}" y1="-4" x2="${-15 + k * 10}" y2="4" stroke="#fde68a" stroke-width="2"/>`).join('')}<text x="-30" y="5" fill="#e2e8f0" font-size="14" text-anchor="end">C</text></g>
      <g transform="translate(240,120)"><rect x="-16" y="-50" width="32" height="100" fill="#0b1220"/>${[0, 1, 2, 3, 4].map((k) => `<path d="M0,${-45 + k * 18} a9,9 0 0 1 0,18" fill="none" stroke="#f59e0b" stroke-width="3"/>`).join('')}<circle r="${8 + Math.abs(S.i) * 30}" fill="rgba(125,211,252,${Math.min(0.5, Math.abs(S.i) * 0.6)})"/><text x="26" y="5" fill="#e2e8f0" font-size="14">L</text></g>
      <rect x="110" y="215" width="${UE * 160}" height="10" fill="#fbbf24"/><rect x="110" y="228" width="${UB * 160}" height="10" fill="#22d3ee"/><text x="104" y="224" fill="#fbbf24" font-size="11" text-anchor="end">كهربائية</text><text x="104" y="238" fill="#22d3ee" font-size="11" text-anchor="end">مغناطيسية</text>`;
    if (S.run) { hist.push([UE, UB]); if (hist.length > 320) hist.shift(); }
    c.clearRect(0, 0, 640, 260); c.strokeStyle = '#64748b'; c.beginPath(); c.moveTo(20, 230); c.lineTo(630, 230); c.stroke();
    [['#fbbf24', 0], ['#22d3ee', 1]].forEach(([col, j]) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); hist.forEach((h, k) => { const x = 20 + k * 2, y = 230 - h[j] * 400; k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); });
    c.fillStyle = '#94a3b8'; c.font = '14px Tajawal'; c.fillText('الطاقة في المتسعة (أصفر) وفي المحث (أزرق)', 330, 20);
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

export const SIMS = { phasor, rlc, lc };
