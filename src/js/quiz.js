// محرّك الأسئلة: اختيار من متعدد، وجواب عددي، وسؤال يُكشف جوابه، ومسألة تُكشف خطواتها.
import { rich, auto, esc } from './math.js';
import { sfx } from './sfx.js';
import { confetti, sparks, floatText } from './fx.js';
import { answer as record, badge } from './store.js';

const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export { shuffle };

export function parseNum(s) {
  if (s == null) return NaN;
  let t = String(s).trim().replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,]/g, '.').replace(/\s+/g, '').replace(/−/g, '-');
  t = t.replace(/[x×*]10\^?\(?([-+]?\d+)\)?/i, 'e$1').replace(/^10\^?\(?([-+]?\d+)\)?$/, '1e$1');
  return Number(t);
}

export function occLabel(occ) {
  if (!occ || !occ.length) return '';
  const s = occ.map((o) => `${o.year}${o.session ? ' ' + o.session : ''}`);
  return s.length > 3 ? s.slice(0, 3).join('، ') + ` و${s.length - 3} غيرها` : s.join('، ');
}

function header(q) {
  const tag = q.source === 'wizari' ? `<span class="qtag wiz">وزاري${q.occ && q.occ.length ? ' · ' + esc(occLabel(q.occ)) : ''}</span>`
    : q.source === 'book' ? `<span class="qtag book">من أسئلة الكتاب</span>`
    : q.source === 'gen' ? `<span class="qtag gen">تحدّي الأرقام</span>` : q.source === 'lab' ? `<span class="qtag lab">تدريب على نمط الوزاري</span>` : '';
  const kind = q.kindLabel ? `<span class="qtag kind">${esc(q.kindLabel)}</span>` : '';
  return `<div class="qtags">${tag}${kind}</div><div class="qtext">${rich(q.q)}</div>${q.figure ? `<div class="qfig">${q.figure}</div>` : ''}`;
}

// يعرض سؤالًا واحدًا ويعيد وعدًا بالنتيجة: { ok, self }
export function askOne(box, q, { examMode = false } = {}) {
  return new Promise((resolve) => {
    box.innerHTML = `<div class="qcard enter">${header(q)}<div class="qbody"></div></div><div class="qbar"></div>`;
    const body = box.querySelector('.qbody'), bar = box.querySelector('.qbar');
    const finish = (ok, extra = {}) => {
      record(q.id, ok, { wizari: q.source === 'wizari' });
      resolve({ ok, ...extra });
    };
    const feedback = (ok, html) => {
      ok ? sfx.correct() : sfx.wrong();
      bar.innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><div class="fbh">${ok ? '✓ إجابة صحيحة' : '✗ ليست صحيحة'}</div>${html ? `<div class="fbx">${html}</div>` : ''}<button class="btn big ${ok ? 'go' : 'warn'}" data-next>متابعة</button></div>`;
      bar.querySelector('[data-next]').onclick = () => { sfx.tap(); finish(ok); };
      bar.querySelector('[data-next]').focus();
    };

    if (q.kind === 'mcq') {
      const order = shuffle(q.options.map((o, i) => i));
      body.innerHTML = `<div class="opts">${order.map((i, k) => `<button class="opt" data-i="${i}"><span class="ok">${'أبجد'[k] || k + 1}</span><span>${auto(q.options[i])}</span></button>`).join('')}</div>`;
      bar.innerHTML = `<button class="btn big" data-check disabled>تحقّق</button>`;
      let pick = -1;
      body.onclick = (e) => {
        const b = e.target.closest('.opt'); if (!b || body.classList.contains('locked')) return;
        sfx.tap(); pick = +b.dataset.i; body.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b));
        bar.querySelector('[data-check]').disabled = false;
      };
      bar.querySelector('[data-check]').onclick = () => {
        body.classList.add('locked');
        const ok = pick === q.correct;
        body.querySelectorAll('.opt').forEach((x) => { const i = +x.dataset.i; if (i === q.correct) x.classList.add('right'); else if (i === pick) x.classList.add('wrongp'); });
        if (ok) sparks(body.querySelector('.opt.right'), '#34d399');
        feedback(ok, examMode ? '' : (q.why ? rich(q.why) : ''));
      };
    } else if (q.kind === 'numeric') {
      body.innerHTML = `<div class="numrow"><input class="num" inputmode="decimal" dir="ltr" placeholder="الجواب" autocomplete="off"><span class="unit" dir="ltr">${q.unit ? auto(q.unit) : ''}</span></div><div class="hint">يمكنك الكتابة هكذا: <b dir="ltr">2.4e-5</b> أو <b dir="ltr">2.4×10^-5</b></div>`;
      bar.innerHTML = `<button class="btn big" data-check disabled>تحقّق</button>`;
      const inp = body.querySelector('.num'), btn = bar.querySelector('[data-check]');
      inp.oninput = () => { btn.disabled = !inp.value.trim(); };
      inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value.trim()) btn.click(); };
      setTimeout(() => inp.focus(), 100);
      btn.onclick = () => {
        const v = parseNum(inp.value), tol = q.tol ?? 0.02;
        const ok = isFinite(v) && Math.abs(v - q.value) <= Math.abs(q.value) * tol + 1e-30;
        inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrongp');
        feedback(ok, (ok ? '' : `الجواب الصحيح: <b dir="ltr">${auto(q.show || String(q.value))}</b>`) + (!examMode && q.steps ? `<ol class="steps">${q.steps.map((s) => `<li>${auto(s)}</li>`).join('')}</ol>` : ''));
      };
    } else {
      // reveal: سؤال مفاهيمي يُكشف جوابه أو مسألة تُكشف خطواتها، ثم يقيّم الطالب نفسه
      const steps = q.steps && q.steps.length ? q.steps : null;
      body.innerHTML = `<div class="think">فكّر في الجواب أو اكتبه في دفترك، ثم اكشفه.</div><div class="reveal"></div>`;
      const rv = body.querySelector('.reveal');
      let k = 0;
      const selfGrade = () => {
        bar.innerHTML = `<div class="self"><div class="selfq">هل كان جوابك صحيحًا؟</div><div class="row"><button class="btn warn" data-s="0">لا، أحتاج مراجعة</button><button class="btn go" data-s="1">نعم ✓</button></div></div>`;
        bar.onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; const ok = b.dataset.s === '1'; ok ? sfx.correct() : sfx.flip(); finish(ok, { self: true }); };
      };
      const next = () => {
        sfx.flip();
        if (!steps) { rv.innerHTML = `<div class="ans enter">${rich(q.answer)}</div>`; selfGrade(); return; }
        if (k === 0) rv.innerHTML = '<ol class="steps"></ol>';
        rv.querySelector('.steps').insertAdjacentHTML('beforeend', `<li class="enter">${auto(steps[k])}</li>`); k++;
        if (k >= steps.length) { if (q.final) rv.insertAdjacentHTML('beforeend', `<div class="final enter">${auto(q.final)}</div>`); selfGrade(); }
        else bar.querySelector('button').textContent = `الخطوة التالية (${k + 1} من ${steps.length})`;
      };
      bar.innerHTML = `<button class="btn big alt">${steps ? 'أظهر الخطوة الأولى' : 'أظهر الجواب'}</button>`;
      bar.querySelector('button').onclick = next;
    }
  });
}

// جلسة أسئلة كاملة بشريط تقدّم وسلسلة إصابات
export async function runQuiz(root, questions, { title = '', examMode = false, onProgress } = {}) {
  root.innerHTML = `<div class="quiz"><div class="qtop"><button class="x" data-quit aria-label="خروج">✕</button><div class="pbar"><i></i></div><div class="combo" hidden></div></div><div class="qstage"></div></div>`;
  const stage = root.querySelector('.qstage'), pbar = root.querySelector('.pbar i'), combo = root.querySelector('.combo');
  let quit = false;
  root.querySelector('[data-quit]').onclick = () => { quit = true; stage.dispatchEvent(new Event('quit')); };
  const res = []; let streak = 0, best = 0;
  for (let i = 0; i < questions.length; i++) {
    pbar.style.width = (i / questions.length) * 100 + '%';
    const r = await Promise.race([askOne(stage, questions[i], { examMode }), new Promise((ok) => stage.addEventListener('quit', () => ok(null), { once: true }))]);
    if (!r || quit) return null;
    res.push({ q: questions[i], ...r });
    if (r.ok) {
      streak++; best = Math.max(best, streak);
      if (streak >= 3) { combo.hidden = false; combo.textContent = `🔥 ×${streak}`; combo.classList.remove('pop'); void combo.offsetWidth; combo.classList.add('pop'); }
      if (streak === 10) badge('combo10');
    } else { streak = 0; combo.hidden = true; }
    onProgress && onProgress(res);
  }
  pbar.style.width = '100%';
  const auto = res.filter((r) => !r.self), ok = res.filter((r) => r.ok).length;
  return { res, ok, total: res.length, pct: Math.round((ok / res.length) * 100), bestCombo: best, autoOk: auto.filter((r) => r.ok).length, autoTotal: auto.length };
}

export function starsFor(pct) { return pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0; }

export function celebrate(stars) { if (stars >= 2) confetti(); stars && [0, 1, 2].slice(0, stars).forEach((i) => setTimeout(() => sfx.star(i), 300 + i * 250)); }
export { floatText };
