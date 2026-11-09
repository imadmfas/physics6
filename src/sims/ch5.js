// تجارب الفصل الخامس: البصريات الفيزيائية
import { slider, toggle, readouts, frame, goals } from './kit.js';
import { sfx } from '../js/sfx.js';
import { sparks } from '../js/fx.js';

const hit = (G, st, onGoal) => G.check(st, (d) => { sparks(d, '#fbbf24'); onGoal && onGoal(); });
function canvas(w, h) { const c = document.createElement('canvas'); c.className = 'rcplot'; c.width = w; c.height = h; return c; }
// لون تقريبي لطول موجي مرئي (nm)
export function wlColor(l, a = 1) {
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}

/* ===== 1) تجربة يونك: الشقان ===== */
export function young(mount, { onGoal } = {}) {
  const f = frame('تجربة شقي يونك', 'تتداخل الموجتان الصادرتان عن الشقين فتظهر هدب مضيئة (تداخل بنّاء) ومظلمة (تداخل إتلافي). غيّر الطول الموجي والبعد بين الشقين وبعد الشاشة، وراقب البعد بين هدبتين متتاليتين Δy = λL/d.');
  mount.appendChild(f.root);
  const S = { l: 550, d: 0.2, L: 1.5 };
  const cv = canvas(700, 300); f.stage.appendChild(cv);
  const sl = slider('الطول الموجي λ', { min: 400, max: 700, step: 10, value: S.l, unit: 'nm' }, (v) => { S.l = v; draw(); });
  const sd = slider('البعد بين الشقين d', { min: 0.1, max: 0.5, step: 0.05, value: S.d, unit: 'mm' }, (v) => { S.d = v; draw(); });
  const sL = slider('بعد الشاشة عن الشقين L', { min: 0.5, max: 3, step: 0.1, value: S.L, unit: 'm' }, (v) => { S.L = v; draw(); });
  const R = readouts([['dy', 'Δy = λL/d']]);
  const G = goals([{ text: 'اجعل البعد بين الهدب أكبر من 6 mm', test: (st) => st.dy > 6e-3 }, { text: 'استعمل ضوءًا بنفسجيًا (λ < 430 nm)', test: (st) => st.l < 430 }]);
  f.ctrl.append(sl.el, sd.el, sL.el, R.el, G.el);
  const c = cv.getContext('2d');
  function draw() {
    const dy = S.l * 1e-9 * S.L / (S.d * 1e-3); S.dy = dy;
    c.clearRect(0, 0, 700, 300);
    // المصدر والشقان
    c.fillStyle = wlColor(S.l); c.beginPath(); c.arc(40, 150, 10, 0, 7); c.fill();
    c.fillStyle = '#475569'; c.fillRect(140, 20, 8, 260); c.clearRect(140, 150 - S.d * 120 - 4, 8, 8); c.clearRect(140, 150 + S.d * 120 - 4, 8, 8);
    // الموجات الدائرية
    for (const ys of [150 - S.d * 120, 150 + S.d * 120]) for (let r = 12; r < 260; r += 18) { c.strokeStyle = wlColor(S.l, 0.18); c.lineWidth = 2; c.beginPath(); c.arc(148, ys, r, -1.2, 1.2); c.stroke(); }
    // الشاشة وشدتها
    const sx = 180 + (S.L / 3) * 300; c.fillStyle = '#0b1220'; c.fillRect(sx, 10, 18, 280);
    for (let y = 10; y < 290; y++) { const yy = (y - 150) / 280 * 0.04; const I = Math.cos(Math.PI * S.d * 1e-3 * yy / (S.l * 1e-9 * S.L)) ** 2; c.fillStyle = wlColor(S.l, I); c.fillRect(sx, y, 18, 1); c.fillStyle = wlColor(S.l, 0.9); c.fillRect(sx + 26, y, I * 120, 1); }
    c.fillStyle = '#94a3b8'; c.font = '13px Tajawal'; c.fillText('الشاشة', sx - 6, 304); c.fillText('توزيع الشدة', sx + 50, 20);
    R.set('dy', +(dy * 1e3).toFixed(2), 'mm'); hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

/* ===== 2) الحيود من شق مفرد ===== */
export function diffraction(mount, { onGoal } = {}) {
  const f = frame('الحيود من شق مفرد', 'كلما ضاق الشق اتسعت الهدبة المركزية المضيئة. الهدب المظلمة عند ℓ sinθ = mλ.');
  mount.appendChild(f.root);
  const S = { l: 600, a: 0.05 };
  const cv = canvas(700, 260); f.stage.appendChild(cv);
  const sl = slider('الطول الموجي λ', { min: 400, max: 700, step: 10, value: S.l, unit: 'nm' }, (v) => { S.l = v; draw(); });
  const sa = slider('عرض الشق ℓ', { min: 0.02, max: 0.2, step: 0.01, value: S.a, unit: 'mm' }, (v) => { S.a = v; draw(); });
  const R = readouts([['w', 'عرض الهدبة المركزية (L = 1 m)']]);
  const G = goals([{ text: 'ضيّق الشق إلى أصغر عرض وراقب اتساع الهدبة المركزية', test: (st) => st.a <= 0.02 }]);
  f.ctrl.append(sl.el, sa.el, R.el, G.el);
  const c = cv.getContext('2d');
  function draw() {
    c.clearRect(0, 0, 700, 260); const w = 2 * S.l * 1e-9 / (S.a * 1e-3);
    for (let x = 0; x < 700; x++) { const y = (x - 350) / 700 * 0.12; const b = Math.PI * S.a * 1e-3 * y / (S.l * 1e-9); const I = b === 0 ? 1 : (Math.sin(b) / b) ** 2; c.fillStyle = wlColor(S.l, Math.min(1, I * 1.2)); c.fillRect(x, 20, 1, 90); c.fillStyle = wlColor(S.l, 0.9); c.fillRect(x, 240 - I * 110, 1.2, 2.5); }
    R.set('w', +(w * 1e3).toFixed(1), 'mm'); hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

/* ===== 3) الاستقطاب: مستقطبان ===== */
export function polarizer(mount, { onGoal } = {}) {
  const f = frame('استقطاب الضوء', 'يمرر المستقطب الأول اهتزازات الضوء في مستوٍ واحد فيصير مستقطبًا. أدر المحلل (المستقطب الثاني): تقل شدة الضوء النافذ حتى تنعدم حين يتعامد محورا النفاذ.');
  mount.appendChild(f.root);
  const S = { th: 0 };
  const cv = canvas(700, 240); f.stage.appendChild(cv);
  const st = slider('زاوية المحلل بالنسبة للمستقطب', { min: 0, max: 180, step: 5, value: S.th, unit: '°' }, (v) => { S.th = v; draw(); });
  const R = readouts([['I', 'شدة الضوء النافذ (نسبة إلى المستقطب)']]);
  const G = goals([{ text: 'أطفئ الضوء النافذ تمامًا', test: (s) => s.th === 90 }, { text: 'اجعل الشدة ربع الأصلية تقريبًا', test: (s) => s.th === 60 || s.th === 120 }]);
  f.ctrl.append(st.el, R.el, G.el);
  const c = cv.getContext('2d');
  const disk = (x, ang, lab) => { c.strokeStyle = '#94a3b8'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, 120, 40, 90, 0, 0, 7); c.stroke(); c.save(); c.translate(x, 120); c.rotate(-ang * Math.PI / 180); c.strokeStyle = '#fbbf24'; c.lineWidth = 2; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * 8, -70); c.lineTo(k * 8, 70); c.stroke(); } c.restore(); c.fillStyle = '#94a3b8'; c.font = '13px Tajawal'; c.textAlign = 'center'; c.fillText(lab, x, 230); };
  function draw() {
    const I = Math.cos(S.th * Math.PI / 180) ** 2; S.I = I;
    c.clearRect(0, 0, 700, 240);
    c.fillStyle = 'rgba(253,230,138,.5)'; c.fillRect(20, 100, 200, 40);
    for (let k = 0; k < 6; k++) { const a = k * 30 * Math.PI / 180; c.strokeStyle = '#fde68a'; c.beginPath(); c.moveTo(80 - Math.cos(a) * 25, 120 - Math.sin(a) * 25); c.lineTo(80 + Math.cos(a) * 25, 120 + Math.sin(a) * 25); c.stroke(); }
    disk(250, 0, 'المستقطب'); c.fillStyle = 'rgba(253,230,138,.45)'; c.fillRect(290, 100, 160, 40);
    c.strokeStyle = '#fde68a'; c.lineWidth = 3; c.beginPath(); c.moveTo(370, 95); c.lineTo(370, 145); c.stroke();
    disk(480, S.th, 'المحلل'); c.fillStyle = `rgba(253,230,138,${0.5 * I})`; c.fillRect(520, 100, 160, 40);
    c.strokeStyle = `rgba(253,230,138,${I})`; c.beginPath(); c.moveTo(600, 120 - 25 * Math.sqrt(I)); c.lineTo(600, 120 + 25 * Math.sqrt(I)); c.stroke();
    R.set('I', Math.round(I * 100) + '\\%'); hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

/* ===== 4) الأغشية الرقيقة ===== */
export function thinfilm(mount, { onGoal } = {}) {
  const f = frame('التداخل في الأغشية الرقيقة', 'ينعكس الضوء عن السطحين العلوي والسفلي لغشاء الصابون فتتداخل الموجتان، ويختلف اللون الظاهر باختلاف سمك الغشاء. لذلك تظهر فقاعات الصابون ملونة.');
  mount.appendChild(f.root);
  const S = { t: 300 };
  const cv = canvas(700, 260); f.stage.appendChild(cv);
  const st = slider('سمك الغشاء', { min: 0, max: 800, step: 10, value: S.t, unit: 'nm' }, (v) => { S.t = v; draw(); });
  const G = goals([{ text: 'اجعل الغشاء رقيقًا جدًا (أقل من 30 nm): يبدو مظلمًا', test: (s) => s.t < 30 }]);
  f.ctrl.append(st.el, G.el);
  const c = cv.getContext('2d'); const n = 1.33;
  const color = (t) => { let r = 0, g = 0, b = 0; for (let l = 400; l <= 700; l += 20) { const I = Math.sin(2 * Math.PI * n * t / l) ** 2; const col = wlColor(l, 1).match(/\d+/g).map(Number); r += col[0] * I; g += col[1] * I; b += col[2] * I; } const k = 1 / 7; return `rgb(${Math.min(255, r * k)},${Math.min(255, g * k)},${Math.min(255, b * k)})`; };
  function draw() {
    c.clearRect(0, 0, 700, 260);
    for (let x = 0; x < 700; x += 2) { c.fillStyle = color(x / 700 * 800); c.fillRect(x, 170, 2, 50); }
    c.fillStyle = '#fff'; c.fillRect(S.t / 800 * 700 - 1, 164, 3, 62);
    const g = c.createRadialGradient(350, 85, 10, 350, 85, 75); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, color(S.t)); c.fillStyle = g; c.beginPath(); c.arc(350, 85, 72, 0, 7); c.fill();
    c.fillStyle = '#94a3b8'; c.font = '13px Tajawal'; c.textAlign = 'center'; c.fillText('ألوان الغشاء بحسب سمكه من 0 إلى 800 nm', 350, 245);
    hit(G, S, onGoal);
  }
  draw(); return { destroy() {} };
}

export const SIMS = { young, diffraction, polarizer, thinfilm };
