// تجارب الفصل الثاني: الحث الكهرومغناطيسي
import { slider, toggle, readouts, svg, el, frame, goals } from './kit.js';
import { sfx } from '../js/sfx.js';
import { sparks } from '../js/fx.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const hit = (G, st, onGoal) => G.check(st, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
const loop = (fn) => { let raf = 0, last = performance.now(), on = true; const f = (t) => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(raf); }; };
// رموز المجال: نقاط (خارج من الورقة) أو علامات × (داخل في الورقة)
function fieldMarks(g, x0, y0, w, h, dir, step = 46, op = 0.35) {
  let s = '';
  for (let x = x0 + step / 2; x < x0 + w; x += step) for (let y = y0 + step / 2; y < y0 + h; y += step)
    s += dir > 0 ? `<circle cx="${x}" cy="${y}" r="3.5" fill="rgba(125,211,252,${op})"/>` : `<path d="M${x - 5},${y - 5} l10,10 M${x + 5},${y - 5} l-10,10" stroke="rgba(125,211,252,${op})" stroke-width="2"/>`;
  g.innerHTML = s;
}

/* ===== 1) جسيم مشحون في مجال مغناطيسي ===== */
export function lorentz(mount, { onGoal } = {}) {
  const f = frame('جسيم مشحون في مجال مغناطيسي', 'أطلق الجسيم داخل المجال. القوة المغناطيسية عمودية على السرعة دائمًا فتحرفه في مسار دائري. غيّر الشحنة والسرعة وشدة المجال واتجاهه.');
  mount.appendChild(f.root);
  const S = { q: 1, v: 3, B: 2, dir: -1, shots: 0, signs: new Set(), dirs: new Set() };
  const W = 640, H = 330, s = svg(W, H); f.stage.appendChild(s);
  const gF = el('g', {}, s), trail = el('path', { fill: 'none', stroke: '#fde68a', 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }, s);
  const p = el('circle', { r: 11 }, s), pl = el('text', { 'font-size': 16, 'font-weight': 900, 'text-anchor': 'middle', fill: '#04121a' }, s);
  const fv = el('line', { stroke: '#f472b6', 'stroke-width': 4, 'marker-end': 'url(#fa2)' }, s), vv = el('line', { stroke: '#22d3ee', 'stroke-width': 4, 'marker-end': 'url(#va2)' }, s);
  el('defs', {}, s).innerHTML = `<marker id="fa2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#f472b6"/></marker><marker id="va2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#22d3ee"/></marker>`;
  const leg = el('text', { x: 620, y: 24, fill: '#94a3b8', 'font-size': 14, 'text-anchor': 'end' }, s);
  const sq = toggle([['1', 'شحنة موجبة +'], ['-1', 'شحنة سالبة −']], '1', (v) => { S.q = +v; reset(); });
  const sd = toggle([['-1', 'المجال داخل الورقة ×'], ['1', 'المجال خارج الورقة •']], '-1', (v) => { S.dir = +v; reset(); });
  const sv = slider('سرعة الجسيم v', { min: 1, max: 5, step: 0.5, value: S.v }, (v) => { S.v = v; reset(); });
  const sb = slider('كثافة الفيض B', { min: 0, max: 4, step: 0.5, value: S.B }, (v) => { S.B = v; reset(); });
  const go = document.createElement('button'); go.className = 'btn go'; go.textContent = '🚀 أطلق الجسيم';
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(sq, sd);
  const R = readouts([['r', 'نصف قطر المسار (نسبي)'], ['F', 'القوة F = qvB (نسبية)']]);
  const G = goals([
    { text: 'أطلق شحنة موجبة ثم سالبة: لاحظ انعكاس جهة الانحراف', test: (st) => st.signs.size === 2 },
    { text: 'اجعل B = 0 وأطلق الجسيم: يسير في خط مستقيم', test: (st) => st.lastB === 0 },
    { text: 'اعكس اتجاه المجال وأطلق الجسيم', test: (st) => st.dirs.size === 2 },
  ]);
  f.ctrl.append(row, sv.el, sb.el, go, R.el, G.el);
  fieldMarks(gF, 0, 0, W, H, S.dir);
  let st = null, stop = null, pts = [];
  function reset() {
    stop && stop(); fieldMarks(gF, 0, 0, W, H, S.dir); pts = []; trail.setAttribute('d', '');
    p.setAttribute('fill', S.q > 0 ? '#f87171' : '#60a5fa'); pl.textContent = S.q > 0 ? '+' : '−';
    st = { x: 60, y: 165, vx: S.v, vy: 0 }; place();
    leg.textContent = S.dir < 0 ? '× المجال داخل في الورقة' : '• المجال خارج من الورقة';
    const r = S.B ? (S.v / S.B) : Infinity; R.set('r', isFinite(r) ? r : '\\infty'); R.set('F', S.v * S.B);
  }
  function place() {
    p.setAttribute('cx', st.x); p.setAttribute('cy', st.y); pl.setAttribute('x', st.x); pl.setAttribute('y', st.y + 6);
    const sp = Math.hypot(st.vx, st.vy) || 1, ux = st.vx / sp, uy = st.vy / sp;
    vv.setAttribute('x1', st.x); vv.setAttribute('y1', st.y); vv.setAttribute('x2', st.x + ux * 46); vv.setAttribute('y2', st.y + uy * 46);
    // F = q v × B ؛ B على المحور z (خارج الورقة موجب). في إحداثيات الشاشة y للأسفل
    const fx = S.q * S.dir * (-st.vy), fy = S.q * S.dir * (st.vx); const fm = Math.hypot(fx, fy);
    if (S.B && fm) { fv.setAttribute('x1', st.x); fv.setAttribute('y1', st.y); fv.setAttribute('x2', st.x + fx / fm * 40); fv.setAttribute('y2', st.y + fy / fm * 40); fv.style.display = ''; } else fv.style.display = 'none';
  }
  go.onclick = () => {
    reset(); sfx.zap(); S.shots++; S.signs.add(S.q); S.dirs.add(S.dir); S.lastB = S.B;
    stop = (() => { const k = 0.9; return loop((dt) => {
      for (let i = 0; i < 4; i++) {
        const w = k * S.q * S.dir * S.B * 0.03; // زاوية الدوران في كل خطوة: F = q v × B
        const vx = st.vx, vy = st.vy; st.vx = vx * Math.cos(w) - vy * Math.sin(w); st.vy = vx * Math.sin(w) + vy * Math.cos(w);
        st.x += st.vx * 1.6; st.y += st.vy * 1.6;
      }
      pts.push(`${st.x.toFixed(1)},${st.y.toFixed(1)}`); if (pts.length > 400) pts.shift(); trail.setAttribute('d', 'M' + pts.join(' L'));
      place();
      if (st.x < -20 || st.x > W + 20 || st.y < -20 || st.y > H + 20 || pts.length > 380) { stop(); hit(G, S, onGoal); }
    }); })();
  };
  reset();
  return { destroy() { stop && stop(); } };
}

/* ===== 2) تجربة فراداي: مغناطيس وملف وكلفانوميتر ===== */
export function faraday(mount, { onGoal } = {}) {
  const f = frame('اكتشاف فراداي: المغناطيس والملف', 'اسحب المغناطيس داخل الملف وخارجه. ينحرف مؤشر الكلفانوميتر فقط حين يتغير الفيض، وتزداد الانحرافة بسرعة الحركة وعدد اللفات. لاحظ قطبية وجه الملف (قانون لنز).');
  mount.appendChild(f.root);
  const S = { N: 200, x: 90, vx: 0, max: 0, both: new Set(), held: false, flip: 1 };
  const W = 640, H = 300, s = svg(W, H); f.stage.appendChild(s);
  const coilX = 330, coilW = 150;
  s.innerHTML = `<defs><linearGradient id="mgN" x1="0" x2="1"><stop offset="0" stop-color="#ef4444"/><stop offset="1" stop-color="#b91c1c"/></linearGradient><linearGradient id="mgS" x1="0" x2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs>
    <g id="coil"></g><g id="pole"></g>
    <g id="mag" style="cursor:grab"><rect x="0" y="-22" width="70" height="44" rx="6" fill="url(#mgS)"/><rect x="70" y="-22" width="70" height="44" rx="6" fill="url(#mgN)"/><text x="35" y="7" fill="#fff" font-size="20" font-weight="900" text-anchor="middle" id="tS">S</text><text x="105" y="7" fill="#fff" font-size="20" font-weight="900" text-anchor="middle" id="tN">N</text></g>
    <g transform="translate(560,210)"><circle r="56" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/><path d="M-44,-8 A46,46 0 0 1 44,-8" fill="none" stroke="#475569" stroke-width="2"/><text y="34" fill="#94a3b8" font-size="18" text-anchor="middle" font-weight="800">G</text><text x="-40" y="-14" fill="#64748b" font-size="11">−</text><text x="36" y="-14" fill="#64748b" font-size="11">+</text><line id="needle" x1="0" y1="10" x2="0" y2="-44" stroke="#f87171" stroke-width="4" stroke-linecap="round"/><circle r="6" fill="#e2e8f0"/></g>
    <path id="wires" fill="none" stroke="#94a3b8" stroke-width="3"/><g id="cur"></g>`;
  const mag = s.querySelector('#mag'), needle = s.querySelector('#needle'), coil = s.querySelector('#coil'), pole = s.querySelector('#pole'), cur = s.querySelector('#cur');
  function drawCoil() {
    const turns = Math.round(S.N / 25); let g = `<rect x="${coilX - 6}" y="70" width="${coilW + 12}" height="120" rx="12" fill="rgba(148,163,184,.08)"/>`;
    for (let i = 0; i < turns; i++) { const x = coilX + (i + 0.5) * coilW / turns; g += `<ellipse cx="${x}" cy="130" rx="7" ry="58" fill="none" stroke="#f59e0b" stroke-width="3"/>`; }
    coil.innerHTML = g;
    s.querySelector('#wires').setAttribute('d', `M${coilX + coilW},188 V250 H504 M${coilX},188 V280 H560 V266`);
  }
  const sN = slider('عدد لفات الملف N', { min: 50, max: 400, step: 50, value: S.N }, (v) => { S.N = v; drawCoil(); });
  const flipB = document.createElement('button'); flipB.className = 'btn'; flipB.textContent = '🔄 اقلب المغناطيس';
  const autoB = document.createElement('button'); autoB.className = 'btn alt'; autoB.textContent = '▶ حركة تلقائية';
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(flipB, autoB);
  const R = readouts([['emf', 'القوة الدافعة المحتثة (نسبية)'], ['face', 'قطبية وجه الملف القريب']]);
  const G = goals([
    { text: 'أدخل المغناطيس في الملف بسرعة: انحراف كبير', test: (st) => st.max > 60 },
    { text: 'أدخل المغناطيس ثم أخرجه: ينحرف المؤشر في الاتجاهين', test: (st) => st.both.size === 2 },
    { text: 'أوقف المغناطيس داخل الملف: لا تيار رغم وجود المجال', test: (st) => st.restInside },
  ]);
  f.ctrl.append(sN.el, row, R.el, G.el);
  const flux = (x) => { const c = coilX + coilW / 2, d = (x + 140 - coilX); return S.flip / (1 + Math.exp(-(d) / 22)) * (1 / (1 + Math.exp((x - c - 40) / 30))); };
  let prevF = flux(S.x), ang = 0, auto = false, at = 0, restT = 0;
  let drag = null;
  mag.addEventListener('pointerdown', (e) => { drag = { x0: e.clientX, m0: S.x }; S.held = true; mag.setPointerCapture(e.pointerId); auto = false; });
  mag.addEventListener('pointermove', (e) => { if (!drag) return; const k = W / s.getBoundingClientRect().width; S.x = clamp(drag.m0 + (e.clientX - drag.x0) * k, 10, 470); });
  mag.addEventListener('pointerup', () => { drag = null; S.held = false; });
  flipB.onclick = () => { S.flip *= -1; sfx.flip(); s.querySelector('#tS').textContent = S.flip > 0 ? 'S' : 'N'; s.querySelector('#tN').textContent = S.flip > 0 ? 'N' : 'S'; s.querySelector('#mag rect').setAttribute('fill', S.flip > 0 ? 'url(#mgS)' : 'url(#mgN)'); s.querySelectorAll('#mag rect')[1].setAttribute('fill', S.flip > 0 ? 'url(#mgN)' : 'url(#mgS)'); prevF = flux(S.x); };
  autoB.onclick = () => { auto = !auto; at = 0; autoB.textContent = auto ? '⏸ أوقف' : '▶ حركة تلقائية'; };
  drawCoil();
  const stop = loop((dt, t) => {
    if (auto) { at += dt; S.x = 200 + 170 * Math.sin(at * 2.2); }
    mag.setAttribute('transform', `translate(${S.x},130)`);
    const F = flux(S.x), dF = (F - prevF) / Math.max(dt, 1e-3); prevF = F;
    const emf = -S.N / 200 * dF * 40;
    ang += (clamp(emf * 30, -75, 75) - ang) * 0.35;
    needle.setAttribute('transform', `rotate(${ang})`);
    if (Math.abs(ang) > 8) { S.both.add(Math.sign(ang)); if (Math.random() < 0.15) sfx.tick(); }
    S.max = Math.max(S.max, Math.abs(ang));
    // سكون داخل الملف
    const inside = S.x + 140 > coilX + 20 && S.x < coilX + coilW - 20;
    if (inside && Math.abs(dF) < 0.01 && !auto) { restT += dt; if (restT > 1.2) S.restInside = true; } else restT = 0;
    // قطبية وجه الملف القريب من المغناطيس (يقاوم التغير)
    const face = Math.abs(emf) < 0.05 ? '—' : (dF * S.flip > 0 ? 'N (تنافر)' : 'S (تجاذب)');
    pole.innerHTML = face === '—' ? '' : `<text x="${coilX - 20}" y="60" fill="${face[0] === 'N' ? '#f87171' : '#60a5fa'}" font-size="22" font-weight="900" text-anchor="middle">${face[0]}</text>`;
    // أسهم التيار
    cur.innerHTML = Math.abs(emf) > 0.05 ? `<circle r="5" fill="#fde68a"><animateMotion dur="${clamp(1.5 / Math.abs(emf), 0.3, 3)}s" repeatCount="indefinite" path="${emf > 0 ? `M${coilX + coilW},188 V250 H504` : `M504,250 H${coilX + coilW} V188`}"/></circle>` : '';
    R.set('emf', +emf.toFixed(2)); R.set('face', face === '—' ? '\\text{لا يوجد}' : face[0]);
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== 3) القوة الدافعة الكهربائية الحركية: ساق على سكتين ===== */
export function rod(mount, { onGoal } = {}) {
  const f = frame('الساق المتحركة على سكتين', 'اسحب الساق الموصلة داخل المجال المغناطيسي. تتولد قوة دافعة كهربائية حركية ε = vBL فيضيء المصباح، وتظهر قوة مغناطيسية تعاكس الحركة: تحتاج إلى شغل لتحريك الساق (حفظ الطاقة).');
  mount.appendChild(f.root);
  const S = { B: 0.5, L: 0.4, R: 2, x: 220, v: 0, max: 0, dirs: new Set() };
  const W = 640, H = 300, s = svg(W, H); f.stage.appendChild(s);
  const gF = el('g', {}, s); fieldMarks(gF, 110, 40, 520, 220, -1, 40, 0.45);
  s.insertAdjacentHTML('beforeend', `<path d="M110,50 H630 M110,250 H630" stroke="#cbd5e1" stroke-width="6"/><path d="M110,50 V250" stroke="#cbd5e1" stroke-width="6"/>
    <g transform="translate(70,150)"><circle r="26" fill="#1e293b" stroke="#fde68a" stroke-width="2" id="bulb"/><path d="M-9,-4 l5,10 l4,-10 l5,10" stroke="#78350f" fill="none" stroke-width="2"/></g><path d="M70,124 V50 H110 M70,176 V250 H110" stroke="#cbd5e1" stroke-width="3" fill="none"/>
    <g id="rod" style="cursor:ew-resize"><rect x="-9" y="36" width="18" height="228" rx="6" fill="#f59e0b"/><rect x="-22" y="128" width="44" height="44" rx="12" fill="rgba(245,158,11,.25)" stroke="#f59e0b"/></g>
    <g id="arrows"></g><g id="iflow"></g><text x="620" y="28" fill="#94a3b8" font-size="14" text-anchor="end">× المجال داخل في الورقة</text>`);
  const rodG = s.querySelector('#rod'), bulb = s.querySelector('#bulb'), arrows = s.querySelector('#arrows'), iflow = s.querySelector('#iflow');
  const sB = slider('كثافة الفيض B', { min: 0.1, max: 1, step: 0.1, value: S.B, unit: 'T' }, (v) => { S.B = v; });
  const sL = slider('طول الساق L', { min: 0.1, max: 0.8, step: 0.1, value: S.L, unit: 'm' }, (v) => { S.L = v; });
  const sR = slider('مقاومة الدائرة R', { min: 1, max: 10, step: 1, value: S.R, unit: 'Ω' }, (v) => { S.R = v; });
  const R = readouts([['v', 'سرعة الساق v'], ['e', 'ε = vBL'], ['I', 'التيار المحتث I'], ['F', 'القوة المعرقلة F = BIL']]);
  const G = goals([
    { text: 'حرّك الساق حتى تتجاوز القوة الدافعة 1 V', test: (st) => st.max > 1 },
    { text: 'حرّك الساق يمينًا ثم يسارًا: ينعكس اتجاه التيار', test: (st) => st.dirs.size === 2 },
    { text: 'أوقف الساق: يختفي التيار وينطفئ المصباح', test: (st) => st.max > 0.3 && st.stopped },
  ]);
  f.ctrl.append(sB.el, sL.el, sR.el, R.el, G.el);
  let drag = null, lastX = S.x, stillT = 0;
  rodG.addEventListener('pointerdown', (e) => { drag = { x0: e.clientX, r0: S.x }; rodG.setPointerCapture(e.pointerId); });
  rodG.addEventListener('pointermove', (e) => { if (!drag) return; const k = W / s.getBoundingClientRect().width; S.x = clamp(drag.r0 + (e.clientX - drag.x0) * k, 150, 610); });
  rodG.addEventListener('pointerup', () => { drag = null; });
  const stop = loop((dt) => {
    const vpx = (S.x - lastX) / Math.max(dt, 1e-3); lastX = S.x;
    S.v += ((vpx / 100) - S.v) * 0.3; // m/s (100 px = 1 m)
    const e = S.v * S.B * S.L, I = e / S.R, F = S.B * Math.abs(I) * S.L;
    rodG.setAttribute('transform', `translate(${S.x},0)`);
    const glow = clamp(Math.abs(I) / 0.5, 0, 1);
    bulb.setAttribute('fill', `rgba(253,224,71,${0.08 + glow * 0.9})`); bulb.style.filter = glow > 0.1 ? `drop-shadow(0 0 ${10 + glow * 20}px #fde047)` : '';
    S.max = Math.max(S.max, Math.abs(e)); if (Math.abs(S.v) > 0.3) S.dirs.add(Math.sign(S.v));
    if (Math.abs(S.v) < 0.02) { stillT += dt; if (stillT > 0.8 && S.max > 0.3) S.stopped = true; } else { stillT = 0; S.stopped = false; }
    arrows.innerHTML = Math.abs(S.v) > 0.05 ? `<line x1="${S.x}" y1="20" x2="${S.x + Math.sign(S.v) * 50}" y2="20" stroke="#22d3ee" stroke-width="4"/><text x="${S.x + Math.sign(S.v) * 60}" y="26" fill="#22d3ee" font-size="15" text-anchor="middle">v</text><line x1="${S.x}" y1="285" x2="${S.x - Math.sign(S.v) * clamp(F * 300, 10, 80)}" y2="285" stroke="#f472b6" stroke-width="4"/><text x="${S.x - Math.sign(S.v) * (clamp(F * 300, 10, 80) + 12)}" y="291" fill="#f472b6" font-size="15" text-anchor="middle">F</text>` : '';
    // اتجاه التيار: يمين الحركة في مجال داخل → التيار في الساق نحو الأعلى (قاعدة الكف)
    iflow.innerHTML = Math.abs(I) > 0.01 ? `<circle r="5" fill="#fde68a"><animateMotion dur="${clamp(0.4 / Math.abs(I), 0.3, 3)}s" repeatCount="indefinite" path="${S.v > 0 ? `M${S.x},250 V50 H110 V250 H${S.x}` : `M${S.x},50 V250 H110 V50 H${S.x}`}"/></circle>` : '';
    R.set('v', +S.v.toFixed(2), 'm/s'); R.set('e', +e.toFixed(3), 'V'); R.set('I', +I.toFixed(3), 'A'); R.set('F', +F.toFixed(4), 'N');
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== 4) الفيض المغناطيسي عبر حلقة ===== */
export function flux(mount, { onGoal } = {}) {
  const f = frame('الفيض المغناطيسي عبر حلقة', 'أدر الحلقة داخل المجال المنتظم: يكون الفيض أعظم حين يكون مستوي الحلقة عموديًا على خطوط المجال، وصفرًا حين يوازيها.');
  mount.appendChild(f.root);
  const S = { B: 0.5, A: 0.2, th: 0 };
  const s = svg(640, 280); f.stage.appendChild(s);
  const sB = slider('كثافة الفيض B', { min: 0.1, max: 1, step: 0.1, value: S.B, unit: 'T' }, (v) => { S.B = v; draw(); });
  const sA = slider('مساحة الحلقة A', { min: 0.05, max: 0.4, step: 0.05, value: S.A, unit: 'm²' }, (v) => { S.A = v; draw(); });
  const sT = slider('الزاوية بين متجه المساحة والمجال θ', { min: 0, max: 90, step: 5, value: S.th, unit: '°' }, (v) => { S.th = v; draw(); });
  const R = readouts([['P', 'Φ_B = BA cosθ']]);
  const G = goals([{ text: 'اجعل الفيض صفرًا', test: (st) => st.th === 90 }, { text: 'اجعل الفيض أكبر من 0.3 Wb', test: (st) => st.P > 0.3 }]);
  f.ctrl.append(sB.el, sA.el, sT.el, R.el, G.el);
  function draw() {
    const P = S.B * S.A * Math.cos(S.th * Math.PI / 180), w = 60 + Math.sqrt(S.A) * 180, sx = Math.cos(S.th * Math.PI / 180);
    let g = '';
    const n = Math.round(S.B * 8) + 2; for (let i = 0; i < n; i++) { const y = 30 + (i + 0.5) * 220 / n; g += `<line x1="40" y1="${y}" x2="600" y2="${y}" stroke="#fde68a" stroke-width="1.6" opacity=".7"/><path d="M590,${y - 5} l10,5 l-10,5" fill="#fde68a" opacity=".7"/>`; }
    g += `<ellipse cx="320" cy="140" rx="${Math.max(3, w / 2 * sx)}" ry="${w / 2}" fill="rgba(34,211,238,.18)" stroke="#22d3ee" stroke-width="4"/>`;
    // الخطوط التي تخترق الحلقة
    g += `<text x="320" y="270" fill="#94a3b8" font-size="14" text-anchor="middle">خطوط المجال المارة خلال الحلقة: ${Math.round(Math.abs(n * sx * Math.min(1, w / 220)))}</text>`;
    s.innerHTML = g; S.P = P; R.set('P', +P.toFixed(3), 'Wb'); hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

/* ===== 5) التيارات الدوامة: بندول معدني بين قطبي مغناطيس ===== */
export function eddy(mount, { onGoal } = {}) {
  const f = frame('التيارات الدوّامة', 'اترك البندول يتأرجح بين قطبي المغناطيس. في الصفيحة المصمتة تتولد تيارات دوّامة تعرقل الحركة فيتوقف بسرعة، وفي الصفيحة المشقوقة تضعف التيارات فيتأرجح طويلًا.');
  mount.appendChild(f.root);
  const S = { plate: 'solid', mag: true, a: 0.9, w: 0, runs: new Set() };
  const s = svg(640, 300); f.stage.appendChild(s);
  const sp = toggle([['solid', 'صفيحة مصمتة'], ['slot', 'صفيحة مشقوقة']], 'solid', (v) => { S.plate = v; });
  const sm = toggle([['1', 'المغناطيس موجود'], ['0', 'من دون مغناطيس']], '1', (v) => { S.mag = v === '1'; });
  const go = document.createElement('button'); go.className = 'btn go'; go.textContent = '↩ اترك البندول';
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(sp, sm, go);
  const G = goals([{ text: 'جرّب الصفيحتين المصمتة والمشقوقة وقارن', test: (st) => st.runs.size >= 2 }]);
  f.ctrl.append(row, G.el);
  go.onclick = () => { S.a = 0.9; S.w = 0; sfx.swish(); S.runs.add(S.plate + S.mag); hit(G, S, onGoal); };
  const stop = loop((dt) => {
    const inField = Math.abs(S.a) < 0.35 && S.mag;
    const damp = inField ? (S.plate === 'solid' ? 9 : 1.2) : 0.08;
    S.w += (-9.8 / 1.4 * Math.sin(S.a) - damp * S.w) * dt; S.a += S.w * dt;
    const L = 200, px = 320 + L * Math.sin(S.a), py = 30 + L * Math.cos(S.a);
    const plateOp = inField ? 0.85 : 1;
    let plate = `<rect x="-40" y="-30" width="80" height="60" rx="6" fill="#cbd5e1"/>`;
    if (S.plate === 'slot') for (let i = -2; i <= 2; i++) plate += `<rect x="${i * 15 - 2}" y="-30" width="4" height="44" fill="#0b1220"/>`;
    const eddies = inField && S.plate === 'solid' && Math.abs(S.w) > 0.3 ? `<circle r="14" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="4 3" class="flow"/><circle r="24" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="4 3" class="flow"/>` : '';
    s.innerHTML = `<line x1="320" y1="30" x2="${px}" y2="${py}" stroke="#94a3b8" stroke-width="3"/><circle cx="320" cy="30" r="6" fill="#e2e8f0"/>
      ${S.mag ? `<g opacity=".9"><rect x="262" y="196" width="116" height="76" rx="10" fill="#b91c1c"/><rect x="262" y="234" width="116" height="38" rx="0" fill="#1d4ed8"/><rect x="262" y="234" width="116" height="38" rx="10" fill="#1d4ed8"/><text x="320" y="222" fill="#fff" font-weight="900" text-anchor="middle" font-size="15">N أمام الصفيحة</text><text x="320" y="260" fill="#fff" font-weight="900" text-anchor="middle" font-size="15">S خلفها</text></g>` : ''}
      <g transform="translate(${px},${py}) rotate(${-S.a * 57.3})" opacity="${plateOp}">${plate}${eddies}</g>`;
  });
  return { destroy: stop };
}

/* ===== 6) المولّد الكهربائي ===== */
export function generator(mount, { onGoal } = {}) {
  const f = frame('المولّد الكهربائي', 'يدور الملف في مجال مغناطيسي فيتغير الفيض خلاله باستمرار، فتتولد قوة دافعة كهربائية متناوبة. زد سرعة الدوران وراقب المقدار الأعظم والتردد.');
  mount.appendChild(f.root);
  const S = { w: 2, N: 100, B: 0.2, A: 0.05, maxE: 0 };
  const wrap = document.createElement('div'); wrap.className = 'rcwrap';
  const s = svg(300, 240); const cv = document.createElement('canvas'); cv.className = 'rcplot'; cv.width = 640; cv.height = 280; wrap.append(s, cv); f.stage.appendChild(wrap);
  const sw = slider('سرعة الدوران ω', { min: 0, max: 10, step: 0.5, value: S.w, unit: 'rad/s' }, (v) => { S.w = v; });
  const sN = slider('عدد اللفات N', { min: 50, max: 300, step: 50, value: S.N }, (v) => { S.N = v; });
  const R = readouts([['e', 'القوة الدافعة الآنية'], ['em', 'المقدار الأعظم NBAω']]);
  const G = goals([{ text: 'اجعل المقدار الأعظم للقوة الدافعة أكبر من 20 V', test: (st) => st.maxE > 20 }, { text: 'أوقف الدوران: تنعدم القوة الدافعة', test: (st) => st.w === 0 && st.maxE > 0 }]);
  f.ctrl.append(sw.el, sN.el, R.el, G.el);
  const c = cv.getContext('2d'); let th = 0; const hist = [];
  const stop = loop((dt) => {
    th += S.w * dt; const em = S.N * S.B * S.A * S.w, e = em * Math.sin(th); S.maxE = Math.max(S.maxE, em);
    const cx = 150, cy = 120, w = 70 * Math.abs(Math.cos(th)) + 4;
    s.innerHTML = `<rect x="20" y="40" width="40" height="160" rx="8" fill="#b91c1c"/><text x="40" y="126" fill="#fff" font-weight="900" text-anchor="middle">N</text><rect x="240" y="40" width="40" height="160" rx="8" fill="#1d4ed8"/><text x="260" y="126" fill="#fff" font-weight="900" text-anchor="middle">S</text>
      ${[60, 90, 120, 150, 180].map((y) => `<line x1="62" y1="${y}" x2="238" y2="${y}" stroke="#fde68a" opacity=".35"/>`).join('')}
      <rect x="${cx - w}" y="${cy - 60}" width="${2 * w}" height="120" fill="rgba(245,158,11,.12)" stroke="#f59e0b" stroke-width="4" rx="4"/>
      <line x1="${cx}" y1="${cy - 80}" x2="${cx}" y2="${cy + 80}" stroke="#94a3b8" stroke-dasharray="4 4"/>`;
    hist.push(e); if (hist.length > 300) hist.shift();
    c.clearRect(0, 0, 640, 280); c.strokeStyle = '#334155'; c.beginPath(); c.moveTo(0, 140); c.lineTo(640, 140); c.stroke();
    const sc = 110 / Math.max(30, S.maxE);
    c.strokeStyle = '#22d3ee'; c.lineWidth = 3; c.beginPath(); hist.forEach((v, i) => { const x = i * 640 / 300, y = 140 - v * sc; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    c.fillStyle = '#94a3b8'; c.font = '15px Tajawal'; c.fillText('ε', 8, 20); c.fillText('t', 625, 160);
    R.set('e', +e.toFixed(1), 'V'); R.set('em', +em.toFixed(1), 'V');
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== 7) الحث الذاتي: نمو التيار في دائرة فيها محث ===== */
export function selfInd(mount, { onGoal } = {}) {
  const f = frame('الحث الذاتي', 'أغلق المفتاح: لا يصل التيار إلى مقداره الثابت فورًا لأن المحث يولد قوة دافعة محتثة تعاكس نمو التيار. افتح المفتاح: تظهر شرارة بسبب التغير السريع في التيار.');
  mount.appendChild(f.root);
  const S = { L: 2, R: 10, E: 12, I: 0, on: false, sparks: 0, runs: 0 };
  const wrap = document.createElement('div'); wrap.className = 'rcwrap';
  const s = svg(300, 220); const cv = document.createElement('canvas'); cv.className = 'rcplot'; cv.width = 640; cv.height = 280; wrap.append(s, cv); f.stage.appendChild(wrap);
  const sL = slider('معامل الحث الذاتي L', { min: 0.5, max: 5, step: 0.5, value: S.L, unit: 'H' }, (v) => { S.L = v; });
  const sR = slider('المقاومة R', { min: 2, max: 20, step: 2, value: S.R, unit: 'Ω' }, (v) => { S.R = v; });
  const btn = document.createElement('button'); btn.className = 'btn go'; btn.textContent = '🔌 أغلق المفتاح';
  const R = readouts([['I', 'التيار I'], ['PE', 'الطاقة في المحث ½LI²'], ['e', 'القوة الدافعة المحتثة']]);
  const G = goals([{ text: 'أغلق المفتاح وراقب نمو التيار التدريجي', test: (st) => st.runs > 0 && st.I > 0.9 * st.E / st.R }, { text: 'افتح المفتاح والتيار مار: شرارة!', test: (st) => st.sparks > 0 }, { text: 'كبّر L وأعد التجربة: صار النمو أبطأ', test: (st) => st.runs >= 2 && st.L >= 4 }]);
  f.ctrl.append(btn, sL.el, sR.el, R.el, G.el);
  const c = cv.getContext('2d'); let hist = [], sparkT = 0;
  btn.onclick = () => {
    S.on = !S.on; btn.textContent = S.on ? '✋ افتح المفتاح' : '🔌 أغلق المفتاح'; btn.className = 'btn ' + (S.on ? 'warn' : 'go');
    if (S.on) { S.runs++; hist = []; sfx.charge(0.5); } else if (S.I > 0.2) { S.sparks++; sparkT = 0.4; sfx.zap(); }
  };
  const stop = loop((dt) => {
    const target = S.on ? S.E / S.R : 0;
    const dI = S.on ? (S.E - S.I * S.R) / S.L * dt : -S.I * Math.min(1, dt * 40);
    S.I += dI; const e = -S.L * dI / Math.max(dt, 1e-3);
    if (S.on) { hist.push(S.I); if (hist.length > 300) hist.shift(); }
    sparkT = Math.max(0, sparkT - dt);
    const glow = clamp(S.I / (S.E / 2), 0, 1);
    s.innerHTML = `<g fill="none" stroke="#94a3b8" stroke-width="3"><path d="M40,40 H260 V180 H40 Z"/></g>
      <rect x="25" y="85" width="30" height="50" fill="#0f172a"/><line x1="22" y1="100" x2="58" y2="100" stroke="#fbbf24" stroke-width="4"/><line x1="30" y1="112" x2="50" y2="112" stroke="#fbbf24" stroke-width="4"/>
      <g transform="translate(150,40)"><rect x="-60" y="-14" width="120" height="28" fill="#0f172a"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${-50 + i * 20},0 a10,10 0 0 1 20,0" fill="none" stroke="#f59e0b" stroke-width="3"/>`).join('')}<text y="-20" fill="#e2e8f0" font-size="13" text-anchor="middle" direction="ltr">L</text></g>
      <g transform="translate(260,110)"><rect x="-10" y="-30" width="20" height="60" fill="#0f172a" stroke="#e2e8f0"/><text x="-18" y="5" fill="#e2e8f0" font-size="13" text-anchor="end" direction="ltr">R</text></g>
      <g transform="translate(150,180)"><rect x="-30" y="-8" width="60" height="16" fill="#0f172a"/><line x1="-26" y1="0" x2="${S.on ? 26 : 18}" y2="${S.on ? 0 : -22}" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>${sparkT > 0 ? `<path d="M18,-22 l8,-10 l-2,8 l10,-4 l-8,12" fill="#fde047" stroke="#fff" filter="drop-shadow(0 0 8px #fde047)"/>` : ''}</g>
      <circle cx="90" cy="180" r="0"/><g transform="translate(260,180)"></g>
      <text x="150" y="214" fill="#94a3b8" font-size="12" text-anchor="middle">${S.on ? 'المفتاح مغلق' : 'المفتاح مفتوح'}</text>`;
    c.clearRect(0, 0, 640, 280); c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 10); c.lineTo(40, 250); c.lineTo(630, 250); c.stroke();
    const Imax = S.E / 2; c.setLineDash([6, 6]); c.strokeStyle = '#475569'; c.beginPath(); c.moveTo(40, 250 - (S.E / S.R) / Imax * 220); c.lineTo(630, 250 - (S.E / S.R) / Imax * 220); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#22d3ee'; c.lineWidth = 3; c.beginPath(); hist.forEach((v, i) => { const x = 40 + i * 590 / 300, y = 250 - v / Imax * 220; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    c.fillStyle = '#94a3b8'; c.font = '15px Tajawal'; c.fillText('I', 20, 20); c.fillText('t', 620, 270);
    R.set('I', +S.I.toFixed(3), 'A'); R.set('PE', +(0.5 * S.L * S.I * S.I).toFixed(3), 'J'); R.set('e', +(Math.abs(e) < 1e-3 ? 0 : e).toFixed(2), 'V');
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== 8) الحث المتبادل: ملفان ===== */
export function mutual(mount, { onGoal } = {}) {
  const f = frame('الحث المتبادل بين ملفين', 'أغلق مفتاح الملف الابتدائي ثم افتحه، وراقب كلفانوميتر الملف الثانوي: ينحرف لحظة الإغلاق ولحظة الفتح فقط، أي حين يتغير التيار في الابتدائي.');
  mount.appendChild(f.root);
  const S = { on: false, I: 0, kicks: new Set(), steady: 0 };
  const s = svg(640, 280); f.stage.appendChild(s);
  const btn = document.createElement('button'); btn.className = 'btn go'; btn.textContent = '🔌 أغلق مفتاح الابتدائي';
  const R = readouts([['I1', 'تيار الابتدائي'], ['e2', 'القوة الدافعة في الثانوي']]);
  const G = goals([{ text: 'أغلق المفتاح: ينحرف المؤشر لحظيًا', test: (st) => st.kicks.has(1) }, { text: 'افتح المفتاح: ينحرف بالاتجاه المعاكس', test: (st) => st.kicks.has(-1) }, { text: 'اترك المفتاح مغلقًا: يعود المؤشر إلى الصفر', test: (st) => st.steady > 1.5 }]);
  f.ctrl.append(btn, R.el, G.el);
  btn.onclick = () => { S.on = !S.on; btn.textContent = S.on ? '✋ افتح مفتاح الابتدائي' : '🔌 أغلق مفتاح الابتدائي'; btn.className = 'btn ' + (S.on ? 'warn' : 'go'); sfx.zap(); S.steady = 0; };
  let ang = 0;
  const stop = loop((dt) => {
    const t = S.on ? 1 : 0, dI = (t - S.I) * Math.min(1, dt * 4); S.I += dI;
    const e2 = -dI / Math.max(dt, 1e-3);
    ang += (clamp(e2 * 60, -70, 70) - ang) * 0.3;
    if (Math.abs(ang) > 15) S.kicks.add(ang < 0 ? 1 : -1);
    if (S.on && Math.abs(ang) < 2) S.steady += dt;
    const coil = (x0, col) => [0, 1, 2, 3, 4, 5, 6].map((i) => `<ellipse cx="${x0 + i * 16}" cy="120" rx="6" ry="46" fill="none" stroke="${col}" stroke-width="3"/>`).join('');
    s.innerHTML = `<rect x="140" y="110" width="360" height="20" rx="6" fill="#475569"/>${coil(170, '#f59e0b')}${coil(370, '#22d3ee')}
      <path d="M170,166 V230 H120 M266,166 V230 H220" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="120" y="215" width="100" height="30" rx="6" fill="#0f172a" stroke="#fbbf24"/><text x="170" y="236" fill="#fbbf24" font-size="13" text-anchor="middle">بطارية + مفتاح</text>
      <text x="218" y="60" fill="#f59e0b" font-size="15" text-anchor="middle">الملف الابتدائي</text><text x="418" y="60" fill="#22d3ee" font-size="15" text-anchor="middle">الملف الثانوي</text>
      ${S.I > 0.05 ? [0, 1, 2].map((i) => `<line x1="150" y1="${105 + i * 15}" x2="520" y2="${105 + i * 15}" stroke="#fde68a" stroke-width="1.5" opacity="${S.I * 0.8}"/>`).join('') : ''}
      <path d="M370,166 V230 H520 M466,166 V200" fill="none" stroke="#94a3b8" stroke-width="3"/>
      <g transform="translate(560,220)"><circle r="44" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/><text y="28" fill="#94a3b8" font-size="16" text-anchor="middle" font-weight="800">G</text><line x1="0" y1="8" x2="0" y2="-34" stroke="#f87171" stroke-width="4" stroke-linecap="round" transform="rotate(${ang})"/><circle r="5" fill="#e2e8f0"/></g>`;
    R.set('I1', +(S.I * 2).toFixed(2), 'A'); R.set('e2', +e2.toFixed(2), 'V');
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== 9) لاقطة القيثارة الكهربائية ===== */
export function guitar(mount, { onGoal } = {}) {
  const f = frame('لاقطة القيثارة الكهربائية', 'انقر الوتر: يهتز الوتر الفولاذي الممغنط فوق ملف اللاقطة، فيتغير الفيض خلال الملف وتتولد قوة دافعة محتثة بالتردد نفسه، تُضخَّم فتسمعها.');
  mount.appendChild(f.root);
  const S = { amp: 0, t: 0, plucks: 0 };
  const s = svg(640, 200); const cv = document.createElement('canvas'); cv.className = 'rcplot'; cv.width = 640; cv.height = 160;
  f.stage.append(s, cv);
  const b = document.createElement('button'); b.className = 'btn go'; b.textContent = '🎸 انقر الوتر';
  const G = goals([{ text: 'انقر الوتر ثلاث مرات', test: (st) => st.plucks >= 3 }]);
  f.ctrl.append(b, G.el);
  const pluck = () => { S.amp = 1; S.plucks++; hit(G, S, onGoal); try { const C = new (window.AudioContext || window.webkitAudioContext)(); const o = C.createOscillator(), g = C.createGain(); o.type = 'sawtooth'; o.frequency.value = 196; g.gain.setValueAtTime(0.12, C.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, C.currentTime + 1.6); o.connect(g).connect(C.destination); o.start(); o.stop(C.currentTime + 1.7); } catch (e) {} };
  b.onclick = pluck; s.addEventListener('pointerdown', pluck);
  const c = cv.getContext('2d'); const hist = [];
  const stop = loop((dt) => {
    S.t += dt; S.amp *= Math.exp(-dt * 1.4);
    const y = S.amp * 22 * Math.sin(S.t * 40);
    s.innerHTML = `<rect x="0" y="120" width="640" height="80" fill="#3f2a1d"/><rect x="250" y="112" width="140" height="40" rx="8" fill="#111827" stroke="#64748b"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${265 + i * 22}" cy="132" r="6" fill="#9ca3af"/>`).join('')}
      <text x="320" y="185" fill="#e2e8f0" font-size="14" text-anchor="middle">ملف اللاقطة ومغناطيسها</text>
      <path d="M20,70 Q320,${70 + y * 2} 620,70" stroke="#e5e7eb" stroke-width="3" fill="none" style="cursor:pointer"/><text x="30" y="55" fill="#94a3b8" font-size="13">وتر فولاذي</text>`;
    hist.push(y); if (hist.length > 320) hist.shift();
    c.clearRect(0, 0, 640, 160); c.strokeStyle = '#334155'; c.beginPath(); c.moveTo(0, 80); c.lineTo(640, 80); c.stroke();
    c.strokeStyle = '#f472b6'; c.lineWidth = 2.5; c.beginPath(); hist.forEach((v, i) => { const x = i * 2, yy = 80 - v * 2.5; i ? c.lineTo(x, yy) : c.moveTo(x, yy); }); c.stroke();
    c.fillStyle = '#94a3b8'; c.font = '14px Tajawal'; c.fillText('الإشارة الكهربائية الخارجة من اللاقطة', 360, 20);
  });
  return { destroy: stop };
}

export const SIMS = { lorentz, faraday, rod, flux, eddy, generator, selfInd, mutual, guitar };
