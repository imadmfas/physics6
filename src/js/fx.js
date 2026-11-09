// مؤثرات بصرية: قصاصات الاحتفال، النقاط الطائرة، الإشعارات، النوافذ.
import { esc } from './math.js';
import { sfx } from './sfx.js';

const reduced = () => document.body.classList.contains('rm');

export function confetti({ n = 120, colors = ['#22d3ee', '#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#fff'] } = {}) {
  if (reduced()) return;
  sfx.party();
  const cv = document.createElement('canvas'); cv.className = 'fx-canvas'; document.body.appendChild(cv);
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 15 - 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, col: colors[(Math.random() * colors.length) | 0] }));
  let t = 0;
  (function loop() {
    t++; c.clearRect(0, 0, W, H);
    for (const p of ps) { p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.col; c.globalAlpha = Math.max(0, 1 - t / 140); c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
    if (t < 140) requestAnimationFrame(loop); else cv.remove();
  })();
}

export function sparks(el, color = '#22d3ee') {
  if (reduced() || !el) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('i'); s.className = 'spark';
    const a = (i / 14) * Math.PI * 2, d = 40 + Math.random() * 30;
    s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 700);
  }
}

export function floatText(text, el, cls = '') {
  const f = document.createElement('div'); f.className = 'floater ' + cls; f.textContent = text;
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 1300); sfx.coin();
}

let toastBox;
export function toast(html, { icon = '✨', ms = 3200, cls = '' } = {}) {
  if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; document.body.appendChild(toastBox); }
  sfx.ding();
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = `<span class="ti">${icon}</span><div>${html}</div>`;
  toastBox.appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, ms);
}

export function modal(html, { cls = '', closable = true } = {}) {
  return new Promise((resolve) => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${cls}">${html}</div>`;
    document.body.appendChild(bg); requestAnimationFrame(() => bg.classList.add('in')); sfx.pop();
    const close = (v) => { sfx.close(); bg.classList.remove('in'); setTimeout(() => bg.remove(), 250); resolve(v); };
    bg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]'); if (b) return close(b.dataset.v);
      if (closable && e.target === bg) close(null);
    });
  });
}

export const h = (s) => esc(s);

// يشغّل نقرة خفيفة مع ظهور كل عنصر من مجموعة متتالية الظهور
export function cascade(els, step = 70, start = 0) {
  if (reduced()) return;
  [...els].slice(0, 14).forEach((e, i) => setTimeout(() => sfx.blip(i), start + i * step));
}
