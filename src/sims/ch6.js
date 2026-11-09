// تجارب الفصل السادس إلى التاسع: الفيزياء الحديثة، الإلكترونيات، الأطياف والليزر، الفيزياء النووية
import { slider, toggle, readouts, svg, frame, goals } from './kit.js';
import { sfx } from '../js/sfx.js';
import { sparks } from '../js/fx.js';
import { wlColor } from './ch5.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const hit = (G, st, onGoal) => G.check(st, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
const loop = (fn) => { let raf = 0, last = performance.now(), on = true; const f = (t) => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(raf); }; };
function canvas(w, h) { const c = document.createElement('canvas'); c.className = 'rcplot'; c.width = w; c.height = h; return c; }
const H = 6.63e-34, C = 3e8, EV = 1.6e-19;

/* ===== الفصل 6: إشعاع الجسم الأسود ===== */
export function blackbody(mount, { onGoal } = {}) {
  const f = frame('إشعاع الجسم الأسود', 'كلما ارتفعت درجة حرارة الجسم ازدادت شدة إشعاعه الكلي، وانزاحت قمة المنحني نحو الأطوال الموجية القصيرة (قانون فين: λmax T = ثابت).');
  mount.appendChild(f.root);
  const S = { T: 4000 };
  const cv = canvas(700, 300); f.stage.appendChild(cv);
  const sT = slider('درجة الحرارة T', { min: 2000, max: 8000, step: 100, value: S.T, unit: 'K' }, (v) => { S.T = v; draw(); });
  const R = readouts([['lm', 'λmax = 2.898×10⁻³ / T']]);
  const G = goals([{ text: 'اجعل قمة المنحني في منطقة الضوء المرئي', test: (s) => s.lm < 700e-9 && s.lm > 400e-9 }, { text: 'سخّن الجسم إلى 7000 K فأكثر', test: (s) => s.T >= 7000 }]);
  f.ctrl.append(sT.el, R.el, G.el);
  const c = cv.getContext('2d');
  const planck = (l, T) => 1 / (l ** 5 * (Math.exp(1.4388e-2 / (l * T)) - 1));
  function draw() {
    c.clearRect(0, 0, 700, 300); const x0 = 50, y0 = 270, w = 620;
    for (let l = 400; l <= 700; l += 2) { const x = x0 + (l * 1e-9) / 3e-6 * w; c.fillStyle = wlColor(l, 0.25); c.fillRect(x, 20, 2.2, y0 - 20); }
    const ref = planck(2.898e-3 / 8000, 8000);
    [[S.T, '#fbbf24', 3], [3000, '#64748b', 1.5]].forEach(([T, col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let i = 1; i <= w; i += 2) { const l = i / w * 3e-6; const y = y0 - planck(l, T) / ref * 240; i > 1 ? c.lineTo(x0 + i, y) : c.moveTo(x0 + i, y); } c.stroke(); });
    c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, 15); c.lineTo(x0, y0); c.lineTo(x0 + w, y0); c.stroke();
    c.fillStyle = '#94a3b8'; c.font = '13px Tajawal'; c.fillText('الطول الموجي λ', x0 + w - 90, y0 + 22); c.fillText('الشدة', 4, 20); c.fillText('3000 K', x0 + 520, y0 - 30);
    const lm = 2.898e-3 / S.T; S.lm = lm; R.set('lm', lm * 1e9, 'nm');
    const glow = clamp((S.T - 1500) / 6000, 0, 1); c.fillStyle = `hsl(${30 + glow * 30},100%,${30 + glow * 50}%)`; c.beginPath(); c.arc(640, 50, 24, 0, 7); c.fill();
    hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

/* ===== الفصل 6: الظاهرة الكهروضوئية ===== */
export function photoelectric(mount, { onGoal } = {}) {
  const f = frame('الظاهرة الكهروضوئية', 'سلّط ضوءًا على سطح الفلز: لا تنبعث الإلكترونات إلا إذا كان تردد الضوء أكبر من تردد العتبة، مهما كانت شدته. زيادة التردد تزيد الطاقة الحركية العظمى للإلكترونات، وزيادة الشدة تزيد عددها.');
  mount.appendChild(f.root);
  const S = { l: 450, I: 50, W: 2.3, ejected: 0, below: false };
  const s = svg(640, 260); f.stage.appendChild(s);
  const sl = slider('الطول الموجي للضوء λ', { min: 200, max: 700, step: 10, value: S.l, unit: 'nm' }, (v) => { S.l = v; });
  const si = slider('شدة الضوء', { min: 0, max: 100, step: 10, value: S.I, unit: '%' }, (v) => { S.I = v; });
  const sw = toggle([['2.3', 'صوديوم (2.3 eV)'], ['4.3', 'خارصين (4.3 eV)']], '2.3', (v) => { S.W = +v; });
  const R = readouts([['E', 'طاقة الفوتون hf'], ['K', 'KEmax = hf − W'], ['n', 'إلكترونات منبعثة']]);
  const G = goals([{ text: 'حرّر إلكترونات من السطح', test: (st) => st.ejected > 10 }, { text: 'اجعل الضوء أحمر شديدًا على الخارصين: لا انبعاث رغم الشدة', test: (st) => st.below && st.I >= 80 && st.W > 4 }]);
  f.ctrl.append(sl.el, si.el, sw, R.el, G.el);
  let es = [], phs = [];
  const stop = loop((dt) => {
    const Eph = H * C / (S.l * 1e-9) / EV, K = Eph - S.W; S.below = K <= 0;
    if (Math.random() < S.I / 100 * 0.6) phs.push({ x: 40 + Math.random() * 60, y: 20, t: 0 });
    phs.forEach((p) => { p.x += 7; p.y += 7; p.t += dt; });
    phs = phs.filter((p) => { if (p.y > 180) { if (K > 0) { es.push({ x: p.x, y: 190, v: 2 + Math.sqrt(K) * 3 }); S.ejected++; if (Math.random() < 0.3) sfx.tick(); } return false; } return true; });
    es.forEach((e) => { e.x += e.v; e.y -= e.v * 0.6; }); es = es.filter((e) => e.x < 640 && e.y > 0);
    const col = S.l >= 380 && S.l <= 750 ? wlColor(S.l) : '#c084fc';
    s.innerHTML = `<rect x="0" y="195" width="640" height="65" fill="#475569"/><text x="320" y="235" fill="#e2e8f0" font-size="15" text-anchor="middle">سطح الفلز (دالة الشغل W = ${S.W} eV)</text>
      ${phs.map((p) => `<path d="M${p.x - 14},${p.y - 14} q4,-6 7,0 t7,0" stroke="${col}" stroke-width="3" fill="none" transform="rotate(45 ${p.x} ${p.y})"/>`).join('')}
      ${es.map((e) => `<circle cx="${e.x}" cy="${e.y}" r="5" fill="#60a5fa"/><text x="${e.x}" y="${e.y + 4}" font-size="9" fill="#fff" text-anchor="middle">−</text>`).join('')}`;
    R.set('E', +Eph.toFixed(2), 'eV'); R.set('K', K > 0 ? +K.toFixed(2) : 0, 'eV'); R.set('n', S.ejected);
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== الفصل 7: الثنائي البلوري: انحياز أمامي وعكسي ===== */
export function diode(mount, { onGoal } = {}) {
  const f = frame('الوصلة الثنائية PN', 'في الانحياز الأمامي تضيق منطقة النضوب ويمر تيار كبير، وفي الانحياز العكسي تتسع منطقة النضوب ولا يمر إلا تيار ضئيل جدًا.');
  mount.appendChild(f.root);
  const S = { V: 0.3, seen: new Set() };
  const s = svg(640, 230); const cv = canvas(640, 220); f.stage.append(s, cv);
  const sv = slider('فولطية الانحياز', { min: -5, max: 1, step: 0.05, value: S.V, unit: 'V' }, (v) => { S.V = v; S.seen.add(v > 0.6 ? 'f' : v < 0 ? 'r' : 'o'); draw(); });
  const R = readouts([['I', 'التيار I'], ['w', 'عرض منطقة النضوب']]);
  const G = goals([{ text: 'اجعل الثنائي يوصل في الانحياز الأمامي', test: (st) => st.V > 0.65 }, { text: 'اعكس الانحياز وراقب اتساع منطقة النضوب', test: (st) => st.V <= -3 }]);
  f.ctrl.append(sv.el, R.el, G.el);
  const c = cv.getContext('2d');
  const Iof = (V) => V > 0 ? 1e-9 * (Math.exp(V / 0.026) - 1) : -1e-9;
  function draw() {
    const w = clamp(40 * Math.sqrt(Math.max(0.05, 0.7 - S.V)), 4, 110), I = Iof(S.V);
    let g = `<rect x="100" y="40" width="${220 - w / 2}" height="120" fill="rgba(248,113,113,.25)" stroke="#f87171"/><rect x="${320 + w / 2}" y="40" width="${220 - w / 2}" height="120" fill="rgba(96,165,250,.25)" stroke="#60a5fa"/><rect x="${320 - w / 2}" y="40" width="${w}" height="120" fill="#0b1220" stroke="#94a3b8" stroke-dasharray="4 3"/>`;
    for (let k = 0; k < 14; k++) { const x = 110 + (k % 7) * ((200 - w / 2) / 7), y = 60 + Math.floor(k / 7) * 60; g += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#f87171" stroke-width="2"/><text x="${x}" y="${y + 4}" font-size="11" fill="#f87171" text-anchor="middle">+</text>`; const x2 = 340 + w / 2 + (k % 7) * ((200 - w / 2) / 7); g += `<circle cx="${x2}" cy="${y + 20}" r="6" fill="#60a5fa"/>`; }
    g += `<text x="200" y="30" fill="#f87171" font-size="16" text-anchor="middle" font-weight="800">P</text><text x="440" y="30" fill="#60a5fa" font-size="16" text-anchor="middle" font-weight="800">N</text><text x="320" y="185" fill="#94a3b8" font-size="13" text-anchor="middle">منطقة النضوب</text>
      <text x="320" y="215" fill="${S.V > 0 ? '#34d399' : '#f87171'}" font-size="15" text-anchor="middle">${S.V > 0 ? 'انحياز أمامي' : S.V < 0 ? 'انحياز عكسي' : 'بلا انحياز'}</text>`;
    s.innerHTML = g;
    c.clearRect(0, 0, 640, 220); const x0 = 420, y0 = 150;
    c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, y0); c.lineTo(630, y0); c.moveTo(x0, 10); c.lineTo(x0, 210); c.stroke();
    c.strokeStyle = '#22d3ee'; c.lineWidth = 3; c.beginPath(); for (let V = -5; V <= 0.8; V += 0.01) { const x = x0 + V * 80, y = y0 - clamp(Iof(V) / 0.02 * 130, -3, 140); V > -5 ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(x0 + S.V * 80, y0 - clamp(I / 0.02 * 130, -3, 140), 7, 0, 7); c.fill();
    c.fillStyle = '#94a3b8'; c.font = '13px Tajawal'; c.fillText('V', 620, y0 + 18); c.fillText('I', x0 + 6, 20);
    R.set('I', Math.abs(I) < 1e-6 ? '\\approx 0' : +(I * 1000).toFixed(2) + '\\ mA'); R.set('w', +(w / 40).toFixed(2), '\\text{(نسبي)}');
    hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

/* ===== الفصل 7: التقويم بالثنائي ===== */
export function rectifier(mount, { onGoal } = {}) {
  const f = frame('تقويم التيار المتناوب', 'الثنائي يسمح بمرور التيار باتجاه واحد. في تقويم نصف الموجة يمر نصف الدورة الموجب فقط، وفي تقويم الموجة الكاملة (القنطرة) ينقلب النصف السالب ليصير موجبًا.');
  mount.appendChild(f.root);
  const S = { mode: 'half', seen: new Set(['half']) };
  const cv = canvas(700, 280); f.stage.appendChild(cv);
  const seg = toggle([['none', 'بلا تقويم'], ['half', 'تقويم نصف موجة'], ['full', 'تقويم موجة كاملة']], 'half', (v) => { S.mode = v; S.seen.add(v); sfx.flip(); hit(G, S, onGoal); });
  const G = goals([{ text: 'قارن بين نوعي التقويم', test: (st) => st.seen.has('half') && st.seen.has('full') }]);
  f.ctrl.append(seg, G.el);
  const c = cv.getContext('2d'); let t = 0;
  const stop = loop((dt) => {
    t += dt; c.clearRect(0, 0, 700, 280);
    const row = (y, fn, col, lab) => { c.strokeStyle = '#334155'; c.lineWidth = 1; c.beginPath(); c.moveTo(20, y); c.lineTo(680, y); c.stroke(); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= 660; x += 2) { const v = fn(x / 50 - t * 3); x ? c.lineTo(20 + x, y - v * 45) : c.moveTo(20 + x, y - v * 45); } c.stroke(); c.fillStyle = '#94a3b8'; c.font = '14px Tajawal'; c.textAlign = 'right'; c.fillText(lab, 690, y - 52); };
    row(80, Math.sin, '#a78bfa', 'الفولطية الداخلة (متناوبة)');
    row(210, (a) => { const v = Math.sin(a); return S.mode === 'none' ? v : S.mode === 'half' ? Math.max(0, v) : Math.abs(v); }, '#34d399', 'الفولطية الخارجة على الحمل');
  });
  return { destroy: stop };
}

/* ===== الفصل 8: مستويات الطاقة في ذرة الهيدروجين ===== */
export function hydrogen(mount, { onGoal } = {}) {
  const f = frame('طيف ذرة الهيدروجين', 'انقر مستوى أعلى ثم مستوى أوطأ: ينتقل الإلكترون ويبعث فوتونًا طاقته تساوي فرق الطاقة بين المستويين. الانتقالات إلى المستوى الثاني تعطي متسلسلة بالمر المرئية.');
  mount.appendChild(f.root);
  const S = { from: 3, to: 2, lines: [], series: new Set() };
  const s = svg(640, 320); f.stage.appendChild(s);
  const R = readouts([['E', 'طاقة الفوتون'], ['l', 'الطول الموجي'], ['ser', 'المتسلسلة']]);
  const G = goals([{ text: 'أطلق ثلاثة خطوط من متسلسلة بالمر', test: (st) => st.lines.filter((l) => l.to === 2).length >= 3 }, { text: 'أطلق خطًا من متسلسلة ليمان (فوق البنفسجي)', test: (st) => st.series.has('ليمان') }]);
  f.ctrl.append(R.el, G.el);
  const En = (n) => -13.6 / (n * n), yOf = (n) => [0, 290, 160, 110, 76, 50, 28][n]; // الرسم ليس بمقياس رسم
  let pick = null, photon = null;
  const names = { 1: 'ليمان', 2: 'بالمر', 3: 'باشن', 4: 'براكت', 5: 'فوند' };
  function draw() {
    let g = '';
    for (let n = 1; n <= 6; n++) { const y = yOf(n); g += `<line x1="60" y1="${y}" x2="380" y2="${y}" stroke="${pick === n ? '#fbbf24' : '#94a3b8'}" stroke-width="${pick === n ? 4 : 2}" data-n="${n}" style="cursor:pointer"/><rect x="40" y="${y - 11}" width="340" height="22" fill="transparent" data-n="${n}" style="cursor:pointer"/><text x="30" y="${y + 5}" fill="#e2e8f0" font-size="13" text-anchor="end" direction="ltr">n=${n}</text><text x="390" y="${y + 5}" fill="#94a3b8" font-size="12" direction="ltr">${En(n).toFixed(2)} eV</text>`; }
    // الطيف
    g += `<rect x="460" y="20" width="160" height="280" rx="10" fill="#020617"/>`;
    S.lines.forEach((L) => { const y = 30 + (L.l - 90) / (1900 - 90) * 260; g += `<rect x="470" y="${y}" width="140" height="3" fill="${L.l >= 380 && L.l <= 750 ? wlColor(L.l) : '#64748b'}"/>`; });
    g += `<text x="540" y="315" fill="#94a3b8" font-size="12" text-anchor="middle">الطيف الخطي المنبعث</text><text x="220" y="315" fill="#64748b" font-size="11" text-anchor="middle">المسافات بين المستويات ليست بمقياس رسم</text>`;
    if (photon) g += `<circle cx="${photon.x}" cy="${photon.y}" r="8" fill="${photon.col}" filter="drop-shadow(0 0 8px ${photon.col})"/>`;
    s.innerHTML = g;
  }
  s.addEventListener('click', (e) => {
    const n = +(e.target.dataset && e.target.dataset.n); if (!n) return;
    if (!pick) { pick = n; sfx.tap(); draw(); return; }
    if (n >= pick) { pick = n; draw(); return; }
    const E = En(pick) - En(n), l = 1240 / E, col = l >= 380 && l <= 750 ? wlColor(l) : '#c4b5fd';
    S.lines.push({ from: pick, to: n, l }); S.series.add(names[n]);
    R.set('E', +E.toFixed(2), 'eV'); R.set('l', +l.toFixed(0), 'nm'); R.set('ser', `\\text{${names[n] || ''}}`);
    photon = { x: 220, y: yOf(n), col }; sfx.star(0); pick = null;
    const anim = () => { photon.x += 12; photon.y -= 2; draw(); if (photon.x < 470) requestAnimationFrame(anim); else { photon = null; draw(); } };
    anim(); hit(G, S, onGoal);
  });
  draw(); return { destroy() {} };
}

/* ===== الفصل 8: الليزر: الانبعاث المحفَّز وانقلاب التوزيع ===== */
export function laser(mount, { onGoal } = {}) {
  const f = frame('كيف يعمل الليزر', 'الضخ يرفع الذرات إلى مستوى الطاقة الأعلى. حين يصير عدد الذرات المثارة أكبر من غير المثارة (انقلاب التوزيع) يحفّز كل فوتون ذرة مثارة فتبعث فوتونًا مماثلًا له في الطور والاتجاه، فيتضخم الضوء.');
  mount.appendChild(f.root);
  const S = { pump: 30, out: 0, inv: false };
  const s = svg(640, 240); f.stage.appendChild(s);
  const sp = slider('شدة الضخ', { min: 0, max: 100, step: 5, value: S.pump, unit: '%' }, (v) => { S.pump = v; });
  const R = readouts([['ex', 'نسبة الذرات المثارة'], ['out', 'شدة الحزمة الخارجة']]);
  const G = goals([{ text: 'حقّق انقلاب التوزيع وأطلق حزمة الليزر', test: (st) => st.out > 0.5 }]);
  f.ctrl.append(sp.el, R.el, G.el);
  const atoms = Array.from({ length: 40 }, (_, i) => ({ x: 120 + (i % 10) * 42, y: 70 + Math.floor(i / 10) * 32, ex: false }));
  let phs = [];
  const stop = loop(() => {
    atoms.forEach((a) => { if (!a.ex && Math.random() < S.pump / 2500) a.ex = true; if (a.ex && Math.random() < 0.002) { a.ex = false; phs.push({ x: a.x, y: a.y, vx: Math.random() < 0.5 ? 6 : -6, vy: (Math.random() - 0.5) * 4 }); } });
    phs.forEach((p) => { p.x += p.vx; p.y += p.vy; atoms.forEach((a) => { if (a.ex && Math.abs(a.x - p.x) < 10 && Math.abs(a.y - p.y) < 10 && phs.length < 220) { a.ex = false; phs.push({ x: a.x, y: a.y, vx: p.vx, vy: p.vy * 0.2 }); } }); if (p.x > 560 && Math.abs(p.y - 118) < 60) { p.vx = -Math.abs(p.vx); p.vy *= 0.2; p.out = (p.out || 0) + 1; } if (p.x < 90) { p.vx = Math.abs(p.vx); p.vy *= 0.2; } });
    let out = 0; phs = phs.filter((p) => { if (p.y < 40 || p.y > 200) return false; if (p.out > 2 && p.x > 555) { out++; return false; } return true; });
    S.out = S.out * 0.95 + out * 0.05;
    const ex = atoms.filter((a) => a.ex).length / atoms.length;
    s.innerHTML = `<rect x="90" y="45" width="470" height="150" rx="16" fill="rgba(34,211,238,.06)" stroke="#334155"/><rect x="80" y="40" width="10" height="160" fill="#e2e8f0"/><rect x="560" y="40" width="10" height="160" fill="rgba(226,232,240,.6)"/>
      <text x="85" y="225" fill="#94a3b8" font-size="12" text-anchor="middle">مرآة عاكسة كليًا</text><text x="565" y="225" fill="#94a3b8" font-size="12" text-anchor="middle">مرآة عاكسة جزئيًا</text>
      ${atoms.map((a) => `<circle cx="${a.x}" cy="${a.y}" r="9" fill="${a.ex ? '#f87171' : '#1e293b'}" stroke="${a.ex ? '#fca5a5' : '#475569'}"/>`).join('')}
      ${phs.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#f43f5e"/>`).join('')}
      <rect x="570" y="112" width="${Math.min(70, S.out * 60)}" height="12" fill="#f43f5e" opacity="${Math.min(1, S.out)}" filter="drop-shadow(0 0 8px #f43f5e)"/>`;
    S.inv = ex > 0.5; R.set('ex', Math.round(ex * 100) + '\\%'); R.set('out', +S.out.toFixed(2));
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== الفصل 9: الاضمحلال الإشعاعي وعمر النصف ===== */
export function decay(mount, { onGoal } = {}) {
  const f = frame('الاضمحلال الإشعاعي وعمر النصف', 'كل نواة غير مستقرة تضمحل عشوائيًا، لكن عدد الأنوية المتبقية يتناقص إلى النصف بعد كل عمر نصف.');
  mount.appendChild(f.root);
  const S = { half: 4, t: 0, run: false, N0: 400, N: 400 };
  const wrap = document.createElement('div'); wrap.className = 'rcwrap';
  const s = svg(300, 300); const cv = canvas(640, 300); wrap.append(s, cv); f.stage.appendChild(wrap);
  const sh = slider('عمر النصف', { min: 1, max: 8, step: 1, value: S.half, unit: 's' }, (v) => { S.half = v; });
  const b = document.createElement('button'); b.className = 'btn go'; b.textContent = '☢️ ابدأ الاضمحلال';
  const R = readouts([['N', 'الأنوية المتبقية N'], ['t', 'الزمن'], ['nh', 'عدد أعمار النصف']]);
  const G = goals([{ text: 'انتظر حتى يبقى ربع الأنوية تقريبًا (بعد عمري نصف)', test: (st) => st.run && st.N <= st.N0 / 4 + 10 }]);
  f.ctrl.append(b, sh.el, R.el, G.el);
  let nuc = [], hist = [];
  const reset = () => { nuc = Array.from({ length: S.N0 }, (_, i) => ({ x: 10 + (i % 20) * 14, y: 10 + Math.floor(i / 20) * 14, d: false })); S.t = 0; S.N = S.N0; hist = [[0, S.N0]]; };
  b.onclick = () => { reset(); S.run = true; sfx.charge(0.3); };
  reset();
  const c = cv.getContext('2d');
  const stop = loop((dt) => {
    if (S.run && S.N > 0) { S.t += dt; const p = 1 - Math.pow(0.5, dt / S.half); nuc.forEach((n) => { if (!n.d && Math.random() < p) { n.d = true; S.N--; if (Math.random() < 0.15) sfx.tick(); } }); hist.push([S.t, S.N]); }
    s.innerHTML = nuc.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="5.5" fill="${n.d ? '#334155' : '#34d399'}"/>`).join('');
    c.clearRect(0, 0, 640, 300); const tm = S.half * 5;
    c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 10); c.lineTo(40, 270); c.lineTo(630, 270); c.stroke();
    for (let k = 1; k <= 5; k++) { const x = 40 + k * S.half / tm * 590; c.strokeStyle = '#334155'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x, 10); c.lineTo(x, 270); c.stroke(); c.setLineDash([]); c.fillStyle = '#94a3b8'; c.font = '12px Tajawal'; c.fillText(k + 'T½', x - 10, 288); }
    c.strokeStyle = '#94a3b8'; c.lineWidth = 1.5; c.beginPath(); for (let t = 0; t <= tm; t += tm / 200) { const x = 40 + t / tm * 590, y = 270 - S.N0 * Math.pow(0.5, t / S.half) / S.N0 * 250; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.strokeStyle = '#34d399'; c.lineWidth = 3; c.beginPath(); hist.forEach(([t, N], i) => { const x = 40 + t / tm * 590, y = 270 - N / S.N0 * 250; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    R.set('N', S.N); R.set('t', +S.t.toFixed(1), 's'); R.set('nh', +(S.t / S.half).toFixed(2));
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== الفصل 9: الانشطار والتفاعل المتسلسل ===== */
export function fission(mount, { onGoal } = {}) {
  const f = frame('الانشطار النووي والتفاعل المتسلسل', 'يصطدم نيوترون بنواة يورانيوم-235 فتنشطر إلى نواتين متوسطتين وتنبعث نيوترونات وطاقة كبيرة. تُحدث النيوترونات المنبعثة انشطارات جديدة. في المفاعل تمتص قضبان السيطرة بعض النيوترونات لتبقى العملية مسيطرًا عليها.');
  mount.appendChild(f.root);
  const S = { rods: 0, splits: 0 };
  const s = svg(640, 300); f.stage.appendChild(s);
  const sr = slider('إدخال قضبان السيطرة (امتصاص النيوترونات)', { min: 0, max: 90, step: 10, value: S.rods, unit: '%' }, (v) => { S.rods = v; });
  const b = document.createElement('button'); b.className = 'btn go'; b.textContent = '⚛️ أطلق نيوترونًا';
  const R = readouts([['s', 'عدد الانشطارات'], ['n', 'النيوترونات الحرة']]);
  const G = goals([{ text: 'أحدث تفاعلًا متسلسلًا (أكثر من 20 انشطارًا)', test: (st) => st.splits > 20 }, { text: 'استعمل قضبان السيطرة بنسبة 60% فأكثر وأطلق نيوترونًا', test: (st) => st.rods >= 60 && st.splits > 0 }]);
  f.ctrl.append(b, sr.el, R.el, G.el);
  let U = [], ns = [], flashes = [];
  const reset = () => { U = Array.from({ length: 60 }, (_, i) => ({ x: 70 + (i % 12) * 45, y: 40 + Math.floor(i / 12) * 52, ok: true })); ns = []; S.splits = 0; };
  b.onclick = () => { reset(); ns.push({ x: 10, y: 140, vx: 5, vy: 0.4 }); sfx.zap(); };
  reset();
  const stop = loop(() => {
    ns.forEach((n) => { n.x += n.vx; n.y += n.vy; if (Math.random() < S.rods / 100 * 0.02) n.dead = true; U.forEach((u) => { if (u.ok && !n.dead && Math.hypot(u.x - n.x, u.y - n.y) < 13) { u.ok = false; n.dead = true; S.splits++; flashes.push({ x: u.x, y: u.y, t: 1 }); if (S.splits % 3 === 1) sfx.zap(); for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2; ns.push({ x: u.x, y: u.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4 }); } } }); });
    ns = ns.filter((n) => !n.dead && n.x > 0 && n.x < 640 && n.y > 0 && n.y < 300);
    flashes.forEach((fl) => fl.t -= 0.04); flashes = flashes.filter((fl) => fl.t > 0);
    s.innerHTML = `${S.rods ? [0, 1, 2, 3].map((k) => `<rect x="${110 + k * 135}" y="0" width="10" height="${S.rods * 3}" fill="#475569"/>`).join('') : ''}
      ${U.map((u) => u.ok ? `<circle cx="${u.x}" cy="${u.y}" r="11" fill="#34d399"/><text x="${u.x}" y="${u.y + 4}" font-size="8" fill="#04121a" text-anchor="middle">U</text>` : `<circle cx="${u.x - 6}" cy="${u.y}" r="6" fill="#fbbf24"/><circle cx="${u.x + 6}" cy="${u.y}" r="6" fill="#f472b6"/>`).join('')}
      ${flashes.map((fl) => `<circle cx="${fl.x}" cy="${fl.y}" r="${(1 - fl.t) * 30}" fill="rgba(253,224,71,${fl.t * 0.6})"/>`).join('')}
      ${ns.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="4" fill="#e2e8f0"/>`).join('')}`;
    R.set('s', S.splits); R.set('n', ns.length);
    if (Math.random() < 0.05) hit(G, S, onGoal);
  });
  return { destroy: stop };
}

/* ===== الفصل 9: نفاذية الإشعاعات ===== */
export function radiation(mount, { onGoal } = {}) {
  const f = frame('قدرة نفاذ الإشعاعات النووية', 'جسيمات ألفا يوقفها لوح من الورق، وجسيمات بيتا يوقفها لوح رقيق من الألمنيوم، وأشعة كاما تنفذ ولا يوقفها إلا لوح سميك من الرصاص.');
  mount.appendChild(f.root);
  const S = { type: 'a', seen: new Set(['a']) };
  const s = svg(640, 220); f.stage.appendChild(s);
  const seg = toggle([['a', 'ألفا α'], ['b', 'بيتا β'], ['g', 'كاما γ']], 'a', (v) => { S.type = v; S.seen.add(v); sfx.flip(); hit(G, S, onGoal); });
  const G = goals([{ text: 'جرّب الأنواع الثلاثة', test: (st) => st.seen.size === 3 }]);
  f.ctrl.append(seg, G.el);
  let ps = [];
  const stop = loop(() => {
    if (Math.random() < 0.3) ps.push({ x: 40, y: 80 + Math.random() * 60 });
    const stopAt = S.type === 'a' ? 200 : S.type === 'b' ? 340 : 480;
    ps.forEach((p) => { p.x += 6; }); ps = ps.filter((p) => p.x < Math.min(stopAt, 640) + (S.type === 'g' ? 160 * (Math.random() < 0.7 ? 1 : 0) : 0));
    const col = S.type === 'a' ? '#f87171' : S.type === 'b' ? '#60a5fa' : '#34d399';
    s.innerHTML = `<rect x="200" y="30" width="8" height="160" fill="#fef3c7"/><text x="204" y="210" fill="#94a3b8" font-size="12" text-anchor="middle">ورق</text>
      <rect x="340" y="30" width="14" height="160" fill="#cbd5e1"/><text x="347" y="210" fill="#94a3b8" font-size="12" text-anchor="middle">ألمنيوم</text>
      <rect x="480" y="30" width="40" height="160" fill="#475569"/><text x="500" y="210" fill="#94a3b8" font-size="12" text-anchor="middle">رصاص</text>
      <circle cx="30" cy="110" r="16" fill="#fbbf24"/><text x="30" y="115" font-size="12" text-anchor="middle">☢</text>
      ${ps.map((p) => S.type === 'g' ? `<path d="M${p.x - 10},${p.y} q2.5,-6 5,0 t5,0" stroke="${col}" stroke-width="2.5" fill="none"/>` : `<circle cx="${p.x}" cy="${p.y}" r="${S.type === 'a' ? 6 : 3.5}" fill="${col}"/>`).join('')}`;
  });
  return { destroy: stop };
}

export const SIMS = { blackbody, photoelectric, diode, rectifier, hydrogen, laser, decay, fission, radiation };
