// تجارب الفصل الأول: المتسعات
import { E0, slider, toggle, readouts, svg, el, frame, goals } from './kit.js';
import { sfx } from '../js/sfx.js';
import { sparks } from '../js/fx.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ===== 1) مختبر المتسعة ذات الصفيحتين ===== */
export function plates(mount, { onGoal } = {}) {
  const f = frame('مختبر المتسعة ذات الصفيحتين', 'غيّر المساحة والبعد وفرق الجهد، وأدخل العازل، ثم افصل البطارية وراقب ما يتغيّر وما يبقى ثابتًا.');
  mount.appendChild(f.root);
  const S = { A: 0.05, d: 4, V: 100, k: 1, on: true, Qlock: 0 };
  const W = 640, H = 330, s = svg(W, H); f.stage.appendChild(s);
  const defs = el('defs', {}, s);
  defs.innerHTML = `<linearGradient id="plP" x1="0" x2="1"><stop offset="0" stop-color="#ff8a8a"/><stop offset="1" stop-color="#d63c3c"/></linearGradient>
    <linearGradient id="plN" x1="0" x2="1"><stop offset="0" stop-color="#4c8dff"/><stop offset="1" stop-color="#7fb2ff"/></linearGradient>
    <marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fde68a"/></marker>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const gDiel = el('g', {}, s), gField = el('g', {}, s), gWire = el('g', { fill: 'none', stroke: '#94a3b8', 'stroke-width': 3, 'stroke-linejoin': 'round' }, s);
  const pL = el('rect', { fill: 'url(#plP)', rx: 3 }, s), pR = el('rect', { fill: 'url(#plN)', rx: 3 }, s);
  const gQ = el('g', { 'font-size': 15, 'font-weight': 800, 'text-anchor': 'middle' }, s);
  // البطارية والمفتاح
  const bat = el('g', {}, s);
  bat.innerHTML = `<rect x="292" y="282" width="56" height="34" rx="8" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/><text x="320" y="305" fill="#fbbf24" font-size="14" text-anchor="middle" font-weight="700">بطارية</text>`;
  const sw = el('line', { stroke: '#fbbf24', 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
  const swDot = el('circle', { r: 5, fill: '#fbbf24' }, s);
  const vLabel = el('text', { x: 320, y: 274, fill: '#e2e8f0', 'font-size': 15, 'text-anchor': 'middle', direction: 'ltr', 'unicode-bidi': 'plaintext' }, s);

  const ctrl = f.ctrl;
  const sA = slider('مساحة الصفيحة A', { min: 0.01, max: 0.2, step: 0.01, value: S.A, fmt: (v) => v.toFixed(2), unit: 'm²' }, (v) => { S.A = v; draw(); });
  const sD = slider('البعد بين الصفيحتين d', { min: 1, max: 10, step: 0.5, value: S.d, unit: 'mm' }, (v) => { S.d = v; draw(); });
  const sV = slider('فرق جهد البطارية', { min: 0, max: 200, step: 5, value: S.V, unit: 'V' }, (v) => { S.V = v; draw(); });
  const kSeg = toggle([['1', 'فراغ / هواء'], ['2', 'عازل k=2'], ['3', 'عازل k=3'], ['5', 'عازل k=5']], '1', (v) => { S.k = +v; sfx.flip(); draw(); });
  const cSeg = toggle([['on', '🔌 متصلة بالبطارية'], ['off', '✂️ مفصولة عنها']], 'on', (v) => { if (v === 'off') S.Qlock = cap() * S.V; S.on = v === 'on'; sfx.zap(); draw(); });
  const R = readouts([['C', 'السعة C'], ['Q', 'الشحنة Q'], ['V', 'فرق الجهد ΔV'], ['E', 'المجال E'], ['PE', 'الطاقة PE']]);
  const G = goals([
    { text: 'اجعل السعة أكبر من 500 pF', test: (st) => st.C > 500e-12 },
    { text: 'أدخل عازلًا والمتسعة متصلة، وراقب زيادة الشحنة', test: (st) => st.on && st.k > 1 && st.V > 0 },
    { text: 'افصل البطارية ثم أدخل عازلًا: لاحظ هبوط فرق الجهد', test: (st) => !st.on && st.k > 1 && st.Qlock > 0 },
    { text: 'اجعل المجال بين الصفيحتين أكبر من 100000 V/m', test: (st) => st.E > 1e5 },
  ]);
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(kSeg, cSeg);
  ctrl.append(sA.el, sD.el, sV.el, row, R.el, G.el);

  function cap() { return S.k * E0 * S.A / (S.d * 1e-3); }
  function draw() {
    const C = cap();
    const Q = S.on ? C * S.V : S.Qlock, Vc = Q / C, E = Vc / (S.d * 1e-3), PE = 0.5 * Q * Vc;
    sV.el.classList.toggle('dim', !S.on);
    const hgt = 60 + Math.sqrt(S.A / 0.2) * 170, gap = 30 + (S.d - 1) / 9 * 190, cx = 320, y0 = 140 - hgt / 2;
    const xl = cx - gap / 2 - 14, xr = cx + gap / 2;
    pL.setAttribute('x', xl); pL.setAttribute('y', y0); pL.setAttribute('width', 14); pL.setAttribute('height', hgt);
    pR.setAttribute('x', xr); pR.setAttribute('y', y0); pR.setAttribute('width', 14); pR.setAttribute('height', hgt);
    // الأسلاك
    const yb = 299, swOpen = !S.on;
    gWire.innerHTML = `<path d="M${xl + 7},${y0 + hgt} V${yb} H292"/><path d="M${xr + 7},${y0 + hgt} V${yb} H${swOpen ? 372 : 348}"/>${swOpen ? '' : ''}`;
    sw.setAttribute('x1', 348); sw.setAttribute('y1', yb); sw.setAttribute('x2', swOpen ? 370 : 372); sw.setAttribute('y2', swOpen ? yb - 22 : yb);
    swDot.setAttribute('cx', 348); swDot.setAttribute('cy', yb);
    vLabel.textContent = S.on ? `${S.V} V` : 'الدائرة مفتوحة';
    // الشحنات
    const n = clamp(Math.round(Math.sqrt(Q / 1e-9) * 1.6), 0, 22);
    let q = '';
    for (let i = 0; i < n; i++) { const y = y0 + 10 + (i + 0.5) * (hgt - 20) / n; q += `<text x="${xl - 10}" y="${y + 5}" fill="#ff8a8a">+</text><text x="${xr + 25}" y="${y + 5}" fill="#7fb2ff">−</text>`; }
    gQ.innerHTML = q;
    // العازل وجزيئاته المستقطبة
    if (S.k > 1) {
      let m = `<rect x="${xl + 16}" y="${y0 + 4}" width="${gap - 4}" height="${hgt - 8}" rx="6" fill="rgba(167,139,250,.18)" stroke="rgba(167,139,250,.6)" stroke-dasharray="5 4"/>`;
      const cols = Math.max(1, Math.floor((gap - 10) / 26)), rows = Math.max(2, Math.floor((hgt - 20) / 26));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = xl + 16 + (i + 0.5) * (gap - 4) / cols, y = y0 + 10 + (j + 0.5) * (hgt - 20) / rows;
        m += `<g transform="translate(${x},${y})"><ellipse rx="10" ry="6" fill="rgba(167,139,250,.35)" stroke="#a78bfa"/><text x="-5" y="4" font-size="9" fill="#7fb2ff" text-anchor="middle">−</text><text x="5" y="4" font-size="9" fill="#ff8a8a" text-anchor="middle">+</text></g>`;
      }
      gDiel.innerHTML = m;
    } else gDiel.innerHTML = '';
    // خطوط المجال
    const lines = E > 0 ? clamp(Math.ceil(E / 2.2e4), 1, 9) : 0;
    let fl = '';
    for (let i = 0; i < lines; i++) { const y = y0 + (i + 1) * hgt / (lines + 1); fl += `<line x1="${xl + 18}" y1="${y}" x2="${xr - 4}" y2="${y}" stroke="#fde68a" stroke-width="2" marker-end="url(#arw)" opacity=".85" class="flow"/>`; }
    gField.innerHTML = fl;
    R.set('C', C * 1e12, 'pF'); R.set('Q', Q * 1e9, 'nC'); R.set('V', Vc, 'V'); R.set('E', E, 'V/m'); R.set('PE', PE, 'J');
    G.check({ ...S, C, E }, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
  }
  draw();
  return { destroy() {} };
}

/* ===== 2) منصة ربط المتسعات ===== */
export function network(mount, { onGoal } = {}) {
  const f = frame('منصة ربط المتسعات', 'اختر نوع الربط وسعات المتسعات وفرق الجهد، ثم قارن الشحنة وفرق الجهد في كل متسعة.');
  mount.appendChild(f.root);
  const S = { mode: 'series', c: [6, 3, 2], three: false, V: 12 };
  const W = 640, H = 300, s = svg(W, H); f.stage.appendChild(s);
  const R = readouts([['Ceq', 'السعة المكافئة'], ['QT', 'الشحنة الكلية'], ['PE', 'الطاقة الكلية']]);
  const seg = toggle([['series', 'توالي'], ['parallel', 'توازي']], S.mode, (v) => { S.mode = v; draw(true); });
  const seg3 = toggle([['2', 'متسعتان'], ['3', 'ثلاث متسعات']], '2', (v) => { S.three = v === '3'; draw(true); });
  const sl = [0, 1, 2].map((i) => slider(`C${i + 1}`, { min: 1, max: 20, step: 1, value: S.c[i], unit: 'μF' }, (v) => { S.c[i] = v; draw(); }));
  const sV = slider('فرق جهد المصدر', { min: 0, max: 60, step: 1, value: S.V, unit: 'V' }, (v) => { S.V = v; draw(); });
  const G = goals([
    { text: 'اجعل السعة المكافئة أصغر من أصغر متسعة', test: (st) => st.Ce < Math.min(...st.cs) - 1e-9 },
    { text: 'اجعل السعة المكافئة أكبر من 30 μF', test: (st) => st.Ce > 30 },
    { text: 'في التوالي: اجعل فرق جهد إحدى المتسعات ضعف الأخرى', test: (st) => st.mode === 'series' && st.vs.length === 2 && Math.abs(st.vs[0] / st.vs[1] - 2) < 0.01 || st.mode === 'series' && st.vs.length === 2 && Math.abs(st.vs[1] / st.vs[0] - 2) < 0.01 },
  ]);
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(seg, seg3);
  f.ctrl.append(row, sl[0].el, sl[1].el, sl[2].el, sV.el, R.el, G.el);

  const capSym = (x, y, vert, fill, label, sub) => {
    const g = vert
      ? `<line x1="${x}" y1="${y - 40}" x2="${x}" y2="${y - 7}" /><line x1="${x}" y1="${y + 7}" x2="${x}" y2="${y + 40}" /><line x1="${x - 22}" y1="${y - 7}" x2="${x + 22}" y2="${y - 7}" stroke-width="5" stroke="#ff8a8a"/><line x1="${x - 22}" y1="${y + 7}" x2="${x + 22}" y2="${y + 7}" stroke-width="5" stroke="#7fb2ff"/><rect x="${x - 22}" y="${y - 5}" width="44" height="10" fill="rgba(251,191,36,${fill})"/>`
      : `<line x1="${x - 7}" y1="${y - 22}" x2="${x - 7}" y2="${y + 22}" stroke-width="5" stroke="#ff8a8a"/><line x1="${x + 7}" y1="${y - 22}" x2="${x + 7}" y2="${y + 22}" stroke-width="5" stroke="#7fb2ff"/><rect x="${x - 5}" y="${y - 22}" width="10" height="44" fill="rgba(251,191,36,${fill})"/>`;
    return g + `<text x="${x + (vert ? 30 : 0)}" y="${y + (vert ? -8 : -34)}" font-size="20" fill="#e2e8f0" text-anchor="${vert ? 'start' : 'middle'}" stroke="none" font-weight="700" direction="ltr" unicode-bidi="plaintext">${label}</text><text x="${x + (vert ? 30 : 0)}" y="${y + (vert ? 16 : 50)}" font-size="16" fill="#a5f3fc" text-anchor="${vert ? 'start' : 'middle'}" stroke="none" direction="ltr" unicode-bidi="plaintext">${sub}</text>`;
  };
  let anim = 0;
  function draw(big) {
    sl[2].el.classList.toggle('dim', !S.three);
    const cs = S.c.slice(0, S.three ? 3 : 2);
    let Ce, qs, vs;
    if (S.mode === 'series') { Ce = 1 / cs.reduce((a, c) => a + 1 / c, 0); const Q = Ce * S.V; qs = cs.map(() => Q); vs = cs.map((c) => Q / c); }
    else { Ce = cs.reduce((a, c) => a + c, 0); vs = cs.map(() => S.V); qs = cs.map((c) => c * S.V); }
    const QT = Ce * S.V, PE = 0.5 * Ce * 1e-6 * S.V * S.V;
    const qmax = Math.max(...qs, 1);
    let g = `<g fill="none" stroke="#94a3b8" stroke-width="3">`;
    // البطارية على اليسار
    g += `<line x1="70" y1="40" x2="70" y2="125"/><line x1="70" y1="175" x2="70" y2="260"/><line x1="48" y1="125" x2="92" y2="125" stroke="#fbbf24" stroke-width="5"/><line x1="58" y1="140" x2="82" y2="140" stroke="#fbbf24" stroke-width="5"/><line x1="48" y1="155" x2="92" y2="155" stroke="#fbbf24" stroke-width="5"/><line x1="58" y1="170" x2="82" y2="170" stroke="#fbbf24" stroke-width="5"/>`;
    g += `<text x="30" y="155" fill="#fbbf24" stroke="none" font-size="18" font-weight="700" text-anchor="middle" direction="ltr" unicode-bidi="plaintext">${S.V}V</text>`;
    if (S.mode === 'series') {
      const xs = cs.map((_, i) => 180 + (i + 0.5) * 400 / cs.length);
      g += `<path d="M70,40 V75 H${xs[0] - 7}"/>`;
      for (let i = 0; i < cs.length - 1; i++) g += `<path d="M${xs[i] + 7},75 H${xs[i + 1] - 7}"/>`;
      g += `<path d="M${xs[cs.length - 1] + 7},75 H600 V260 H70"/>`;
      cs.forEach((c, i) => { g += capSym(xs[i], 75, false, 0.15 + 0.6 * qs[i] / qmax, `C${i + 1} = ${c} μF`, `${+qs[i].toFixed(1)}μC · ${+vs[i].toFixed(1)}V`); });
    } else {
      const xs = cs.map((_, i) => 200 + i * (cs.length === 3 ? 140 : 190));
      g += `<path d="M70,40 H${xs[xs.length - 1]}"/><path d="M70,260 H${xs[xs.length - 1]}"/>`;
      cs.forEach((c, i) => { g += capSym(xs[i], 150, true, 0.15 + 0.6 * qs[i] / qmax, `C${i + 1} = ${c} μF`, `${+qs[i].toFixed(1)}μC · ${+vs[i].toFixed(1)}V`); g += `<path d="M${xs[i]},40 V110"/><path d="M${xs[i]},190 V260"/>`; });
    }
    g += `</g><g class="electrons">`;
    // إلكترونات متحركة على السلك عند التغيير
    for (let i = 0; i < 8; i++) g += `<circle r="4" fill="#7dd3fc"><animateMotion dur="1.6s" repeatCount="${big ? 2 : 1}" begin="${i * 0.18}s" path="M70,260 H${S.mode === 'series' ? '600 V75 H200' : '530'}"/></circle>`;
    g += `</g>`;
    s.innerHTML = g;
    clearTimeout(anim); anim = setTimeout(() => { const e = s.querySelector('.electrons'); e && e.remove(); }, 3500);
    R.set('Ceq', Ce, 'μF'); R.set('QT', QT, 'μC'); R.set('PE', PE, 'J');
    G.check({ mode: S.mode, Ce, cs, vs }, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
  }
  draw(true);
  return { destroy() {} };
}

/* ===== 3) الطاقة المختزنة: المساحة تحت المنحني ===== */
export function energy(mount, { onGoal } = {}) {
  const f = frame('الطاقة المختزنة في المتسعة', 'الطاقة تساوي المساحة تحت خط الشحنة مع فرق الجهد. اشحن المتسعة ثم فرّغها في مصباح الوميض.');
  mount.appendChild(f.root);
  const S = { C: 20, V: 100, flashes: 0 };
  const W = 640, H = 300, s = svg(W, H); f.stage.appendChild(s);
  const R = readouts([['Q', 'الشحنة Q'], ['PE', 'الطاقة PE']]);
  const sC = slider('السعة C', { min: 5, max: 50, step: 5, value: S.C, unit: 'μF' }, (v) => { S.C = v; draw(); });
  const sV = slider('فرق الجهد ΔV', { min: 0, max: 200, step: 10, value: S.V, unit: 'V' }, (v) => { S.V = v; draw(); });
  const btn = document.createElement('button'); btn.className = 'btn go flashbtn'; btn.textContent = '📸 فرّغ الشحنة في مصباح الوميض';
  const G = goals([
    { text: 'اجعل فرق الجهد 100 V ثم 200 V وراقب الطاقة: تصير أربعة أمثالها', test: (st) => st.seen100 && st.V === 200 },
    { text: 'خزّن طاقة أكبر من 0.5 J', test: (st) => st.PE > 0.5 },
    { text: 'أطلق ومضتين', test: (st) => st.flashes >= 2 },
  ]);
  f.ctrl.append(sC.el, sV.el, R.el, btn, G.el);
  const x0 = 70, y0 = 260, gw = 300, gh = 210, Vmax = 200, Qmax = 50 * 200;
  function draw() {
    if (S.V === 100) S.seen100 = true;
    const Q = S.C * S.V, PE = 0.5 * S.C * 1e-6 * S.V * S.V;
    const xv = x0 + S.V / Vmax * gw, yq = y0 - Q / Qmax * gh, xEnd = x0 + gw, yEnd = y0 - S.C * Vmax / Qmax * gh;
    s.innerHTML = `<g stroke="#64748b" stroke-width="2"><line x1="${x0}" y1="${y0}" x2="${x0 + gw + 20}" y2="${y0}"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - gh - 20}"/></g>
      <text x="${x0 + gw + 26}" y="${y0 + 5}" fill="#94a3b8" font-size="14" direction="ltr">ΔV</text><text x="${x0 - 8}" y="${y0 - gh - 26}" fill="#94a3b8" font-size="14" text-anchor="middle">Q</text>
      <polygon points="${x0},${y0} ${xv},${y0} ${xv},${yq}" fill="rgba(251,191,36,.35)" stroke="#fbbf24" stroke-width="2"/>
      <line x1="${x0}" y1="${y0}" x2="${xEnd}" y2="${yEnd}" stroke="#22d3ee" stroke-width="3" stroke-dasharray="6 5" opacity=".6"/>
      <circle cx="${xv}" cy="${yq}" r="7" fill="#22d3ee"/>
      <text x="${(x0 + 2 * xv) / 3}" y="${(2 * y0 + yq) / 3 + 6}" fill="#fde68a" font-size="15" text-anchor="middle" font-weight="700">PE</text>
      <g transform="translate(470,60)"><rect x="0" y="0" width="140" height="190" rx="18" fill="#0f172a" stroke="#334155"/><rect x="25" y="20" width="90" height="${150}" rx="10" fill="#1e293b"/><rect class="tank" x="25" y="${20 + 150 * (1 - Math.min(1, PE / 1))}" width="90" height="${150 * Math.min(1, PE / 1)}" rx="10" fill="url(#tg)"/><text x="70" y="182" fill="#94a3b8" font-size="12" text-anchor="middle">خزان الطاقة</text></g>
      <defs><linearGradient id="tg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>`;
    R.set('Q', Q, 'μC'); R.set('PE', PE, 'J');
    G.check({ ...S, PE }, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
  }
  btn.onclick = () => {
    if (S.V === 0) return;
    sfx.zap(); S.flashes++;
    const fl = document.createElement('div'); fl.className = 'flashfx'; document.body.appendChild(fl); setTimeout(() => fl.remove(), 600);
    const v0 = S.V; let t = 0;
    const step = () => { t += 1 / 30; S.V = Math.max(0, Math.round(v0 * Math.exp(-t * 5) / 10) * 10); sV.value = S.V; draw(); if (S.V > 0) requestAnimationFrame(step); };
    step();
  };
  draw();
  return { destroy() {} };
}

/* ===== 4) دائرة المقاومة والمتسعة: الشحن والتفريغ ===== */
export function rc(mount, { onGoal } = {}) {
  const f = frame('دائرة الشحن والتفريغ', 'اضغط «اشحن» ثم «فرّغ»، وراقب فرق جهد المتسعة والتيار والمصباح. غيّر المقاومة والسعة وقارن سرعة الشحن.');
  mount.appendChild(f.root);
  const S = { R: 10, C: 100, E: 12, Vc: 0, mode: 'idle', t: 0, runs: { c: 0, d: 0 } };
  const wrap = document.createElement('div'); wrap.className = 'rcwrap';
  const s = svg(300, 220, 'rc-circ'); const cv = document.createElement('canvas'); cv.className = 'rcplot'; cv.width = 640; cv.height = 300;
  wrap.append(s, cv); f.stage.appendChild(wrap);
  const sR = slider('المقاومة R', { min: 1, max: 50, step: 1, value: S.R, unit: 'kΩ' }, (v) => { S.R = v; });
  const sC = slider('السعة C', { min: 50, max: 500, step: 50, value: S.C, unit: 'μF' }, (v) => { S.C = v; });
  const b1 = document.createElement('button'); b1.className = 'btn go'; b1.textContent = '⚡ اشحن';
  const b2 = document.createElement('button'); b2.className = 'btn alt'; b2.textContent = '💡 فرّغ';
  const row = document.createElement('div'); row.className = 'ctrl-row'; row.append(b1, b2);
  const R = readouts([['V', 'فرق جهد المتسعة'], ['I', 'التيار'], ['T', 'زمن الشحن الظاهر']]);
  const G = goals([
    { text: 'اشحن المتسعة حتى يقارب فرق جهدها فرق جهد البطارية', test: (st) => st.Vc > 0.98 * st.E },
    { text: 'فرّغ المتسعة المشحونة وراقب انطفاء المصباح تدريجيًا', test: (st) => st.runs.d > 0 && st.Vc < 0.3 },
    { text: 'ضاعف المقاومة وأعد الشحن: صار الشحن أبطأ', test: (st) => st.runs.c >= 2 && st.R >= 20 },
  ]);
  f.ctrl.append(row, sR.el, sC.el, R.el, G.el);
  const c = cv.getContext('2d');
  let pts = [], raf = 0;
  function circuit(I) {
    const glow = Math.min(1, Math.abs(I) / (S.E / (S.R * 1e3)) );
    const charging = S.mode === 'charge';
    s.innerHTML = `<g fill="none" stroke="#94a3b8" stroke-width="3"><path d="M40,40 H260 V180 H40 Z"/></g>
      <g><rect x="25" y="85" width="30" height="50" fill="#0f172a"/><line x1="22" y1="100" x2="58" y2="100" stroke="#fbbf24" stroke-width="4"/><line x1="30" y1="112" x2="50" y2="112" stroke="#fbbf24" stroke-width="4"/><text x="72" y="114" fill="#fbbf24" font-size="15" direction="ltr" unicode-bidi="plaintext">${S.E}V</text></g>
      <g transform="translate(150,40)"><rect x="-30" y="-10" width="60" height="20" fill="#0f172a" stroke="#e2e8f0" stroke-width="2"/><text y="-16" fill="#e2e8f0" font-size="12" text-anchor="middle">R</text></g>
      <g transform="translate(260,110)"><rect x="-12" y="-20" width="24" height="40" fill="#0f172a"/><line x1="-20" y1="-6" x2="20" y2="-6" stroke="#ff8a8a" stroke-width="5"/><line x1="-20" y1="6" x2="20" y2="6" stroke="#7fb2ff" stroke-width="5"/><text x="-28" y="5" fill="#e2e8f0" font-size="12" text-anchor="end">C</text></g>
      <g transform="translate(150,180)"><circle r="18" fill="rgba(253,224,71,${0.08 + 0.9 * glow})" stroke="#fde68a" stroke-width="2" filter="${glow > 0.05 ? 'url(#bg)' : ''}"/><path d="M-8,-4 l4,8 l4,-8 l4,8" stroke="#78350f" stroke-width="2" fill="none"/></g>
      <defs><filter id="bg"><feGaussianBlur stdDeviation="6"/></filter></defs>
      <text x="150" y="214" fill="#94a3b8" font-size="12" text-anchor="middle">${charging ? 'المفتاح على وضع الشحن' : S.mode === 'discharge' ? 'المفتاح على وضع التفريغ' : 'المفتاح مفتوح'}</text>`;
  }
  function plot() {
    const W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    c.strokeStyle = '#334155'; c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(50, 20 + i * 52); c.lineTo(W - 10, 20 + i * 52); c.stroke(); }
    c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(50, 10); c.lineTo(50, 280); c.lineTo(W - 10, 280); c.stroke();
    c.fillStyle = '#94a3b8'; c.font = '14px Tajawal, sans-serif'; c.fillText('الزمن t', W - 70, 298);
    c.fillStyle = '#22d3ee'; c.fillText('ΔV (فرق جهد المتسعة)', 60, 18); c.fillStyle = '#f472b6'; c.fillText('I (التيار)', 260, 18);
    const draw = (key, col, max) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); pts.forEach((p, i) => { const x = 50 + p.x * (W - 70), y = 280 - p[key] / max * 250; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); };
    if (pts.length) { draw('v', '#22d3ee', S.E); draw('i', '#f472b6', S.E / (S.R * 1e3)); }
  }
  function run(mode) {
    cancelAnimationFrame(raf); S.mode = mode; S.runs[mode === 'charge' ? 'c' : 'd']++; pts = []; sfx.charge(0.4);
    const tau = S.R * 1e3 * S.C * 1e-6, total = 5 * tau, frames = 210; let k = 0; const V0 = S.Vc;
    const tick = () => {
      k++; const t = (k / frames) * total;
      const v = mode === 'charge' ? S.E + (V0 - S.E) * Math.exp(-t / tau) : V0 * Math.exp(-t / tau);
      const i = mode === 'charge' ? (S.E - v) / (S.R * 1e3) : -v / (S.R * 1e3);
      S.Vc = v; pts.push({ x: k / frames, v, i: Math.abs(i) });
      circuit(i); plot();
      R.set('V', v, 'V'); R.set('I', Math.abs(i) * 1e3, 'mA'); R.set('T', total, 's');
      if (k < frames) raf = requestAnimationFrame(tick); else { S.mode = 'idle'; G.check(S, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); }); }
      if (k === frames) circuit(0);
    };
    tick();
  }
  b1.onclick = () => run('charge'); b2.onclick = () => { if (S.Vc < 0.05) { b2.classList.add('shake'); setTimeout(() => b2.classList.remove('shake'), 400); return; } run('discharge'); };
  circuit(0); plot(); R.set('V', 0, 'V'); R.set('I', 0, 'mA'); R.set('T', 5 * S.R * S.C * 1e-3, 's');
  return { destroy() { cancelAnimationFrame(raf); } };
}

/* ===== 5) المتسعة المتغيرة السعة ===== */
export function variable(mount, { onGoal } = {}) {
  const f = frame('المتسعة المتغيرة السعة', 'أدر المقبض: كلما زادت المساحة المتقابلة بين الصفائح الثابتة والمتحركة زادت السعة. (القيم توضيحية)');
  mount.appendChild(f.root);
  const S = { ang: 60, Cmax: 365 };
  const s = svg(640, 280); f.stage.appendChild(s);
  const R = readouts([['ov', 'المساحة المتقابلة'], ['C', 'السعة']]);
  const sl = slider('زاوية دوران المقبض', { min: 0, max: 180, step: 5, value: S.ang, unit: '°' }, (v) => { S.ang = v; draw(); });
  const G = goals([
    { text: 'أوصل السعة إلى نهايتها العظمى', test: (st) => st.ang === 180 },
    { text: 'أوصل السعة إلى أصغر قيمة لها', test: (st) => st.ang === 0 },
  ]);
  f.ctrl.append(sl.el, R.el, G.el);
  function draw() {
    const frac = S.ang / 180, C = 15 + (S.Cmax - 15) * frac;
    const cx = 320, cy = 150, r = 110;
    const a = (180 - S.ang) * Math.PI / 180;
    let g = '';
    for (let i = 0; i < 5; i++) {
      const dy = (i - 2) * 6;
      g += `<path d="M${cx - r},${cy + dy} A${r},${r} 0 0 1 ${cx + r},${cy + dy} Z" fill="rgba(148,163,184,.25)" stroke="#94a3b8"/>`;
    }
    const ex = cx + r * Math.cos(Math.PI + (Math.PI - a)), ey = cy - r * Math.sin(Math.PI - a);
    for (let i = 0; i < 5; i++) {
      const dy = (i - 2) * 6 + 3;
      g += `<g transform="translate(0,${dy}) rotate(${-(180 - S.ang)} ${cx} ${cy})"><path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z" fill="rgba(34,211,238,.35)" stroke="#22d3ee"/></g>`;
    }
    g += `<circle cx="${cx}" cy="${cy}" r="10" fill="#fbbf24"/><text x="${cx}" y="270" fill="#94a3b8" font-size="13" text-anchor="middle">الصفائح الثابتة رمادية، والمتحركة زرقاء</text>`;
    s.innerHTML = g;
    R.set('ov', Math.round(frac * 100) + '\\%'); R.set('C', C, 'pF');
    G.check(S, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
  }
  draw();
  return { destroy() {} };
}

/* ===== 6) لوحة مفاتيح الحاسوب: متسعة تتغير سعتها بالضغط ===== */
export function keyboard(mount, { onGoal } = {}) {
  const f = frame('مفتاح لوحة الحاسوب', 'اضغط المفتاح: يقل البعد بين الصفيحتين فتزداد السعة، ويتحسس الحاسوب هذا التغيّر فيعرف المفتاح المضغوط. (القيم توضيحية)');
  mount.appendChild(f.root);
  const S = { pressed: false, n: 0 };
  const s = svg(640, 260); f.stage.appendChild(s);
  const R = readouts([['d', 'البعد بين الصفيحتين'], ['C', 'السعة']]);
  const scr = document.createElement('div'); scr.className = 'kscreen'; scr.dir = 'ltr';
  const G = goals([{ text: 'اضغط المفتاح خمس مرات واكتب كلمة على الشاشة', test: (st) => st.n >= 5 }]);
  f.ctrl.append(R.el, scr, G.el);
  const word = 'PHYSICS';
  function draw() {
    const d = S.pressed ? 1 : 3, C = 0.6 * 3 / d;
    const top = S.pressed ? 92 : 60;
    s.innerHTML = `<rect x="200" y="${top}" width="240" height="60" rx="14" fill="#1e293b" stroke="#64748b" stroke-width="2" class="key" style="cursor:pointer"/>
      <text x="320" y="${top + 38}" fill="#e2e8f0" font-size="22" text-anchor="middle" font-weight="800" style="pointer-events:none">${word[S.n % word.length]}</text>
      <rect x="230" y="${top + 62}" width="180" height="8" fill="#ff8a8a"/><text x="450" y="${top + 70}" fill="#ff8a8a" font-size="12">صفيحة متحركة</text>
      <rect x="230" y="190" width="180" height="8" fill="#7fb2ff"/><text x="450" y="198" fill="#7fb2ff" font-size="12">صفيحة ثابتة</text>
      <path d="M215,${top + 66} q-20,${(190 - top - 66) / 2} 0,${190 - top - 66}" stroke="#94a3b8" fill="none" stroke-width="2"/><path d="M425,${top + 66} q20,${(190 - top - 66) / 2} 0,${190 - top - 66}" stroke="#94a3b8" fill="none" stroke-width="2"/>
      <text x="320" y="240" fill="#94a3b8" font-size="13" text-anchor="middle">${S.pressed ? 'البعد صغير: السعة كبيرة' : 'البعد كبير: السعة صغيرة'}</text>`;
    R.set('d', d, 'mm'); R.set('C', C, 'pF');
  }
  const press = (v) => { if (S.pressed === v) return; S.pressed = v; if (v) { sfx.tap(); S.n++; scr.textContent = (word + ' ').repeat(3).slice(0, S.n); G.check(S, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); }); } draw(); };
  s.addEventListener('pointerdown', (e) => { if (e.target.closest('.key')) press(true); });
  addEventListener('pointerup', () => press(false));
  draw();
  return { destroy() {} };
}

export const SIMS = { plates, network, energy, rc, variable, keyboard };
