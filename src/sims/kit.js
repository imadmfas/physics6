// أدوات مشتركة للتجارب الافتراضية: منزلقات، مفاتيح، لوحة قراءات.
import { tex, sci } from '../js/math.js';
import { sfx } from '../js/sfx.js';

export const E0 = 8.85e-12;
export const NS = 'http://www.w3.org/2000/svg';

export function slider(label, { min, max, step, value, fmt = (v) => v, unit = '' }, onInput) {
  const w = document.createElement('label'); w.className = 'sl';
  w.innerHTML = `<span class="sl-l">${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}"><b class="sl-v" dir="ltr"></b>`;
  const inp = w.querySelector('input'), out = w.querySelector('.sl-v');
  const upd = () => { out.innerHTML = fmt(+inp.value) + (unit ? ' ' + unit : ''); inp.style.setProperty('--p', ((inp.value - min) / (max - min)) * 100 + '%'); };
  let lastTick = 0;
  inp.addEventListener('input', () => { upd(); const t = performance.now(); if (t - lastTick > 60) { sfx.tick(); lastTick = t; } onInput(+inp.value); });
  upd();
  return { el: w, get value() { return +inp.value; }, set value(v) { inp.value = v; upd(); } };
}

export function toggle(options, value, onChange) {
  const w = document.createElement('div'); w.className = 'seg';
  w.innerHTML = options.map(([v, t]) => `<button type="button" data-v="${v}" class="${v === value ? 'on' : ''}">${t}</button>`).join('');
  w.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; sfx.tap();
    w.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); onChange(b.dataset.v);
  });
  return w;
}

export function readouts(items) {
  const w = document.createElement('div'); w.className = 'reads';
  w.innerHTML = items.map(([k, l]) => `<div class="rd" data-k="${k}"><span>${l}</span><b dir="ltr"></b></div>`).join('');
  return {
    el: w,
    set(k, v, unit = '') {
      const b = w.querySelector(`[data-k="${k}"] b`); if (!b) return;
      const html = tex(`${typeof v === 'number' ? sci(v, 3) : v}${unit ? '\\ ' + unit : ''}`);
      if (b.dataset.h !== html) { b.innerHTML = html; b.dataset.h = html; b.parentElement.classList.remove('blink'); void b.offsetWidth; b.parentElement.classList.add('blink'); }
    },
  };
}

export function svg(w, h, cls = '') {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('class', 'simsvg ' + cls); return s;
}
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e;
}

export function frame(title, hint) {
  const w = document.createElement('div'); w.className = 'sim';
  w.innerHTML = `<div class="sim-h"><span class="sim-badge">تجربة افتراضية</span><b>${title}</b></div>${hint ? `<div class="sim-hint">${hint}</div>` : ''}<div class="sim-stage"></div><div class="sim-ctrl"></div>`;
  return { root: w, stage: w.querySelector('.sim-stage'), ctrl: w.querySelector('.sim-ctrl') };
}

// مهمة صغيرة داخل التجربة: هدف يتحقق الطالب منه فيكسب مكافأة
export function goals(list) {
  const w = document.createElement('div'); w.className = 'goals';
  w.innerHTML = `<div class="goals-h">🎯 مهام التجربة</div>` + list.map((g, i) => `<div class="goal" data-i="${i}"><i></i><span>${g.text}</span></div>`).join('');
  const done = new Set();
  return {
    el: w,
    check(state, onHit) {
      list.forEach((g, i) => {
        if (done.has(i) || !g.test(state)) return;
        done.add(i); const d = w.querySelector(`[data-i="${i}"]`); d.classList.add('done'); sfx.coin(); onHit && onHit(d, i);
      });
    },
    get count() { return done.size; },
  };
}
