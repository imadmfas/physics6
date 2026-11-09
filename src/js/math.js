// يحوّل الصيغ المكتوبة بالترميز المصغّر إلى KaTeX، والنص العربي الذي فيه $...$ إلى HTML.
import katex from 'katex';

const SYM = {
  'Δ': '\\Delta ', 'ε': '\\varepsilon ', 'κ': '\\kappa ', 'μ': '\\mu ', 'π': '\\pi ', 'Ω': '\\Omega ', 'ω': '\\omega ',
  'τ': '\\tau ', 'θ': '\\theta ', 'λ': '\\lambda ', 'φ': '\\varphi ', 'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ',
  'ρ': '\\rho ', 'σ': '\\sigma ', 'ν': '\\nu ', 'Φ': '\\Phi ', 'ψ': '\\psi ',
  '×': '\\times ', '÷': '\\div ', '≈': '\\approx ', '≠': '\\neq ', '≤': '\\le ', '≥': '\\ge ', '→': '\\rightarrow ',
  '∝': '\\propto ', '±': '\\pm ', '°': '^{\\circ}', '·': '\\cdot ', '√': '\\sqrt ', '∞': '\\infty ', '−': '-',
};
const AR = /[؀-ۿ][؀-ۿ\s،؛:().0-9-]*/g;

export function toTex(src) {
  let s = String(src);
  s = s.replace(AR, (m) => `\\text{${m.trim()}}` + (m.endsWith(' ') ? '\\ ' : ''));
  s = s.replace(/[ΔεκμπΩωτθλφαβγρσνΦψ×÷≈≠≤≥→∝±°·√∞−]/g, (c) => SYM[c]);
  return s;
}

const cache = new Map();
export function tex(src, display = false) {
  const key = (display ? 'D' : 'I') + src;
  if (cache.has(key)) return cache.get(key);
  let html;
  try { html = katex.renderToString(toTex(src), { displayMode: display, throwOnError: false, strict: false, output: 'html' }); }
  catch (e) { html = `<code>${esc(src)}</code>`; }
  cache.set(key, html);
  return html;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// نص عربي فيه $...$ وأسطر جديدة
export function rich(text) {
  if (text == null) return '';
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return parts.map((p) => (p.startsWith('$') && p.endsWith('$') && p.length > 2)
    ? `<span class="m" dir="ltr">${tex(p.slice(1, -1))}</span>`
    : esc(p).replace(/\n/g, '<br>')).join('');
}

// سطر قد يكون صيغة خالصة أو نصًا عربيًا فيه صيغ
export function auto(text) {
  const s = String(text ?? '');
  if (s.includes('$')) return rich(s);
  const arabic = (s.match(/[؀-ۿ]/g) || []).length;
  const latin = (s.match(/[A-Za-z0-9=+\\^_{}]/g) || []).length;
  if (arabic && arabic > latin * 0.6) return rich(s);
  return `<span class="m" dir="ltr">${tex(s)}</span>`;
}

// عرض رقم بالصيغة العلمية: 3.2e-6 → 3.2 × 10^{-6}
export function sci(x, digits = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 4) return String(+x.toPrecision(digits));
  const m = +(x / 10 ** e).toPrecision(digits);
  return `${m} × 10^{${e}}`;
}
