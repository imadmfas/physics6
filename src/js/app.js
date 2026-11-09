import { rich, auto, esc, tex } from './math.js';
import { sfx } from './sfx.js';
import { confetti, toast, modal, floatText, sparks } from './fx.js';
import * as store from './store.js';
import { runQuiz, askOne, shuffle, starsFor, celebrate, occLabel } from './quiz.js';
import { generate } from './gen.js';
import { SIMS as SIMS1 } from '../sims/ch1.js';

const SIMS = { ...SIMS1 };
const GRADE = 's6-sci';
const ACCESS_URL = 'https://imadmfas.github.io/allawh/access.js';
const WA = '9647812346562';
const PASS_CH = 80;
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
let INDEX = null; const CH = {};

/* ========== تحميل البيانات ========== */
async function loadIndex() { if (!INDEX) INDEX = await (await fetch('data/index.json')).json(); return INDEX; }
async function loadCh(n) {
  if (!CH[n]) { const d = await (await fetch(`data/ch${n}.json`)).json(); d.qById = Object.fromEntries(d.questions.map((q) => [q.id, q])); CH[n] = d; }
  return CH[n];
}
function globalLessonNo(n, idx) { let k = 0; for (const c of INDEX.chapters) { if (c.n === n) return k + idx + 1; k += c.lessons; } return 999; }

/* ========== الاشتراك ========== */
let accessMod = null;
async function access() { if (!accessMod) { try { accessMod = await import(/* @vite-ignore */ ACCESS_URL); } catch (e) { accessMod = { gate: async () => true, hasAccess: async () => true, FREE: 5, failed: true }; } } return accessMod; }
async function gateLesson(n, idx) { const a = await access(); return a.gate({ grade: GRADE, lesson: globalLessonNo(n, idx) }); }

/* ========== أحداث المكافآت ========== */
store.on((ev) => {
  if (ev.type === 'xp') { paintHud(); }
  if (ev.type === 'rank') {
    sfx.levelup(); confetti({ n: 200 });
    modal(`<div class="rankup"><div class="bigi">${ev.rank.icon}</div><div class="k">ترقية!</div><h2>صرت الآن: ${esc(ev.rank.name)}</h2><p>استمر في التجارب والأسئلة لتصل إلى الرتبة التالية${ev.rank.nextName ? `: <b>${esc(ev.rank.nextName)}</b>` : ''}.</p><button class="btn big go" data-v="1">رائع!</button></div>`, { cls: 'pop' });
  }
  if (ev.type === 'badge') {
    const [ic, name, desc] = store.BADGES[ev.id]; sfx.unlock2();
    toast(`<b>وسام جديد: ${esc(name)}</b><br><small>${esc(desc)}</small>`, { icon: ic, cls: 'badge-t', ms: 4200 });
  }
  if (ev.type === 'streak' && ev.n > 1) toast(`سلسلة <b>${ev.n}</b> أيام متتالية! لا تقطعها.`, { icon: '🔥' });
});

/* ========== الشريط العلوي ========== */
function hud() {
  const p = store.profile(), r = store.rank(), av = p ? store.AVATARS[p.av] || store.AVATARS[0] : ['🧑‍🔬', '#dbe4ff'];
  return `<header class="hud">
    <a class="brand" href="#/"><span class="logo">⚛</span><span><b>مختبر الفيزياء</b><small>السادس العلمي</small></span></a>
    <span class="sp"></span>
    <div class="chips">
      <span class="chip fire ${store.streakAlive() ? '' : 'off'}" title="أيام متتالية">🔥 <b id="hStreak">${store.streakAlive()}</b></span>
      <span class="chip el" title="إلكترونات">⚡ <b id="hEl">${store.state.el}</b></span>
    </div>
    <button class="me" id="meBtn"><span class="av" style="--b:${av[1]}">${av[0]}</span><span class="who"><b>${esc(p ? p.name : 'باحث جديد')}</b><small>${r.icon} ${esc(r.name)}</small></span></button>
  </header>
  <div class="xpbar" title="الخبرة"><i style="width:${(r.pct * 100).toFixed(1)}%"></i><span>${store.state.xp} XP${r.nextName ? ` · الرتبة التالية بعد ${r.to - store.state.xp}` : ''}</span></div>`;
}
function paintHud() {
  const s = $('#hStreak'), e = $('#hEl'); if (s) s.textContent = store.streakAlive(); if (e) e.textContent = store.state.el;
  const r = store.rank(), bar = $('.xpbar i'), t = $('.xpbar span');
  if (bar) bar.style.width = (r.pct * 100).toFixed(1) + '%'; if (t) t.textContent = `${store.state.xp} XP${r.nextName ? ` · الرتبة التالية بعد ${r.to - store.state.xp}` : ''}`;
}

/* ========== الملف الشخصي ========== */
async function onboarding(force) {
  let p = store.profile();
  if (p && !force) return;
  let pick = p ? p.av : -1;
  const html = `<div class="onb"><div class="onb-art">⚛</div><h2>${p ? 'ملفك في المختبر' : 'أهلًا بك في مختبر الفيزياء'}</h2><p>${p ? '' : 'ستتجول في تسعة أجنحة، في كل جناح تجارب ومهام وأسئلة وزارية حقيقية. اكتب اسمك واختر صورتك لنبدأ.'}</p>
    <input id="oName" maxlength="20" placeholder="اسمك" value="${esc(p ? p.name : '')}"><div class="avs">${store.AVATARS.map((a, i) => `<button class="av" data-i="${i}" aria-pressed="${i === pick}" style="--b:${a[1]}">${a[0]}</button>`).join('')}</div>
    <button class="btn big go" id="oGo" disabled>ادخل المختبر</button></div>`;
  const bg = document.createElement('div'); bg.className = 'modal-bg in'; bg.innerHTML = `<div class="modal pop">${html}</div>`; document.body.appendChild(bg);
  await new Promise((done) => {
    const chk = () => { $('#oGo', bg).disabled = !($('#oName', bg).value.trim() && pick >= 0); };
    $('.avs', bg).onclick = (e) => { const b = e.target.closest('.av'); if (!b) return; sfx.tap(); pick = +b.dataset.i; bg.querySelectorAll('.avs .av').forEach((x) => x.setAttribute('aria-pressed', x === b)); chk(); };
    $('#oName', bg).oninput = chk; chk();
    $('#oGo', bg).onclick = () => { sfx.unlock(); sfx.unlock2(); store.setProfile({ name: $('#oName', bg).value.trim(), av: pick, since: p ? p.since : Date.now() }); bg.remove(); done(); };
  });
}

/* ========== المحطة الرئيسة ========== */
const CH_ICONS = ['🔋', '🧲', '〰️', '📡', '🌈', '⚛️', '💡', '🔦', '☢️'];
const CH_COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c', '#e879f9', '#f87171'];

function chapterState(c) {
  if (!c.ready) return 'soon';
  if (c.n === 1) return 'open';
  const prev = store.state.chapters[c.n - 1];
  return prev && prev.passed ? 'open' : 'locked';
}

async function viewStation() {
  await loadIndex();
  const S = store.state, p = store.profile();
  const daily = S.daily[store.today()];
  const wings = INDEX.chapters.map((c, i) => {
    const st = chapterState(c), ch = S.chapters[c.n];
    const done = c.ready ? Object.keys(S.lessons).filter((id) => id.split('-')[1] === String(c.n) || id.endsWith('-' + c.n)).length : 0;
    return `<a class="wing ${st}" href="${st === 'open' ? '#/ch/' + c.n : 'javascript:void 0'}" data-st="${st}" data-n="${c.n}" style="--c:${CH_COLORS[i]};--d:${i * 60}ms">
      <span class="wnum">${c.n}</span><span class="wic">${st === 'locked' ? '🔒' : st === 'soon' ? '⏳' : CH_ICONS[i]}</span>
      <b>${esc(c.title)}</b><small dir="ltr">${esc(c.titleEn)}</small>
      ${ch && ch.passed ? `<span class="wbadge">✓ ${ch.best}%</span>` : st === 'soon' ? '<span class="wbadge soon">قريبًا</span>' : st === 'locked' ? `<span class="wbadge lock">اجتز الجناح ${c.n - 1}</span>` : `<span class="wbadge go">ادخل</span>`}
    </a>`;
  }).join('');
  const earned = S.badges.length, all = Object.keys(store.BADGES).length;
  app.innerHTML = `${hud()}<main class="station">
    <section class="hero">
      <div class="hero-t"><div class="hello">${p ? `مرحبًا ${esc(p.name)} 👋` : 'مرحبًا'}</div><h1>محطة مختبرات الفيزياء</h1><p>تسعة أجنحة، في كل جناح مهام وتجارب وأسئلة وزارية. اجتز «تحدّي الجناح» بدرجة ${PASS_CH}% ليُفتح لك الجناح التالي.</p></div>
      <div class="hero-orb"><div class="orb"><i></i><i></i><i></i><b>⚛</b></div></div>
    </section>
    <section class="quick">
      <a class="qk daily ${daily ? 'done' : ''}" href="#/daily"><span class="qi">📅</span><b>تحدّي اليوم</b><small>${daily ? `أنجزته اليوم: ${daily.ok}/${daily.total}` : 'خمسة أسئلة سريعة، ومكافأة مضاعفة'}</small></a>
      <a class="qk mock" href="#/mock"><span class="qi">🎓</span><b>امتحان وزاري تجريبي</b><small>ورقة كاملة بنمط الوزارة ومؤقت</small></a>
      <a class="qk badges" href="#/badges"><span class="qi">🏅</span><b>أوسمتي</b><small>${earned} من ${all}</small></a>
    </section>
    <h2 class="sec">أجنحة المختبر</h2>
    <section class="wings">${wings}</section>
  </main>${footer()}`;
  app.querySelectorAll('.wing').forEach((w) => w.addEventListener('click', (e) => {
    if (w.dataset.st === 'locked') { e.preventDefault(); sfx.wrong(); w.classList.add('shake'); setTimeout(() => w.classList.remove('shake'), 450); toast(`يُفتح هذا الجناح بعد اجتياز «تحدّي الجناح ${w.dataset.n - 1}» بدرجة ${PASS_CH}% فأكثر.`, { icon: '🔒' }); }
    else if (w.dataset.st === 'soon') { e.preventDefault(); toast('هذا الجناح قيد البناء، وسيُفتتح قريبًا.', { icon: '🛠️' }); }
    else sfx.tap();
  }));
}

function footer() {
  return `<footer class="foot"><a href="https://imadmfas.github.io/allawh/">↩ اللوح المحاور</a> · <a href="#/settings">الإعدادات</a> · <a target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent('ملاحظة على مختبر فيزياء السادس العلمي: ' + location.href + '\n')}">أرسل ملاحظة</a><br><small>إعداد الأستاذ الدكتور عماد محمد فرحان الدليمي، باستعمال المساعد الذكي كلاود. المحتوى العلمي من كتاب الفيزياء للصف السادس العلمي، الطبعة الحادية عشرة 2025.</small></footer>`;
}

/* ========== الجناح (الفصل) ========== */
async function viewWing(n, tab = 'path') {
  await loadIndex(); const c = INDEX.chapters.find((x) => x.n === n);
  if (!c || chapterState(c) !== 'open') return go('#/');
  const d = await loadCh(n), S = store.state, col = CH_COLORS[n - 1];
  const a = await access(); const paid = await a.hasAccess(GRADE);
  let unlockedUpTo = 0;
  d.lessons.forEach((L, i) => { if (i === 0 || (S.lessons[d.lessons[i - 1].id] || {}).done) unlockedUpTo = i; });
  const allDone = d.lessons.every((L) => (S.lessons[L.id] || {}).done);
  const path = d.lessons.map((L, i) => {
    const r = S.lessons[L.id] || {}, open = i <= unlockedUpTo, g = globalLessonNo(n, i), locked$ = !paid && g > (a.FREE || 5);
    const stars = [0, 1, 2].map((k) => `<i class="${k < (r.stars || 0) ? 'on' : ''}">★</i>`).join('');
    return `<div class="node ${r.done ? 'done' : open ? 'open' : 'locked'} ${i === unlockedUpTo && !r.done ? 'current' : ''}" style="--x:${[0, 60, 90, 60, 0, -60, -90, -60][i % 8]}px;--d:${i * 70}ms">
      <button class="nbtn" data-i="${i}" aria-label="${esc(L.title)}">${r.done ? '✓' : !open ? '🔒' : locked$ ? '💎' : L.icon || (i + 1)}</button>
      <div class="nlab"><b>${L.id} ${esc(L.title)}</b><span class="stars">${stars}</span>${locked$ && open ? '<small class="pro">للمشتركين</small>' : ''}</div>
      ${i === unlockedUpTo && !r.done ? '<span class="startbubble">ابدأ هنا</span>' : ''}
    </div>`;
  }).join('');
  const exam = S.chapters[n] || {};
  const wizCount = d.questions.filter((q) => q.source === 'wizari').length;
  app.innerHTML = `${hud()}<main class="wingv" style="--c:${col}">
    <section class="whead"><a class="back" href="#/">→ المحطة</a><div class="wtitle"><span class="wic big">${CH_ICONS[n - 1]}</span><div><small>الجناح ${n}</small><h1>${esc(d.title)}</h1><span dir="ltr" class="en">${esc(d.titleEn)}</span></div></div>
      <div class="tabs"><a href="#/ch/${n}" class="${tab === 'path' ? 'on' : ''}">🗺️ المهام</a><a href="#/bank/${n}" class="${tab === 'bank' ? 'on' : ''}">🏛️ الوزاريات (${wizCount})</a><a href="#/cards/${n}" class="${tab === 'cards' ? 'on' : ''}">🃏 بطاقات المراجعة</a><a href="#/lab/${n}" class="${tab === 'lab' ? 'on' : ''}">🧪 التجارب</a></div></section>
    <section class="path">${path}
      <div class="node boss ${allDone ? 'open' : 'locked'} ${exam.passed ? 'done' : ''}" style="--x:0px;--d:${d.lessons.length * 70}ms"><button class="nbtn" data-boss="1">${exam.passed ? '🏆' : allDone ? '⚔️' : '🔒'}</button><div class="nlab"><b>تحدّي الجناح</b><small>${exam.best ? `أفضل درجة ${exam.best}%` : `يفتح الجناح التالي عند ${PASS_CH}%`}</small></div></div>
    </section></main>${footer()}`;
  app.querySelectorAll('.nbtn').forEach((b) => b.onclick = async () => {
    if (b.dataset.boss) {
      if (!allDone) { sfx.wrong(); return toast('أنهِ مهام الجناح كلها أولًا لتفتح التحدّي.', { icon: '🔒' }); }
      if (!(await (await access()).gate({ grade: GRADE, lesson: 999 }))) return;
      return go(`#/exam/${n}`);
    }
    const i = +b.dataset.i;
    if (i > unlockedUpTo) { sfx.wrong(); b.parentElement.classList.add('shake'); setTimeout(() => b.parentElement.classList.remove('shake'), 450); return toast('أنهِ المهمة السابقة أولًا.', { icon: '🔒' }); }
    sfx.tap();
    if (!(await gateLesson(n, i))) return;
    go(`#/l/${n}/${i}`);
  });
  const cur = app.querySelector('.node.current'); cur && setTimeout(() => cur.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
}

/* ========== المهمة (الدرس) ========== */
function blockCard(b) {
  const pg = b.page ? `<span class="pg">ص ${b.page}</span>` : '';
  switch (b.type) {
    case 'text': return `<div class="card text">${pg}${rich(b.body)}</div>`;
    case 'definition': return `<div class="card def">${pg}<div class="cardk">📘 تعريف</div><h3>${rich(b.term)}${b.termEn ? ` <small dir="ltr">${esc(b.termEn)}</small>` : ''}</h3><p>${rich(b.body)}</p></div>`;
    case 'law': return `<div class="card law">${pg}<div class="cardk">⚖️ قانون</div><div class="formula" dir="ltr">${tex(b.formula, true)}</div>${b.where && b.where.length ? `<ul class="where">${b.where.map((w) => `<li>${auto(w)}</li>`).join('')}</ul>` : ''}${b.note ? `<p class="note">${rich(b.note)}</p>` : ''}</div>`;
    case 'units': return `<div class="card units">${pg}<div class="cardk">📏 الوحدات</div>${rich(b.body)}</div>`;
    case 'box': return `<div class="card box k-${esc((b.kind || '').replace(/\s/g, ''))}">${pg}<div class="cardk">${({ 'تذكر': '🧠', 'هل تعلم': '💡', 'فكر': '🤔', 'ملاحظة': '📝' })[b.kind] || '✨'} ${esc(b.kind || '')}</div>${rich(b.body)}</div>`;
    case 'activity': return `<div class="card act">${pg}<div class="cardk">🧪 نشاط</div><h3>${rich(b.title)}</h3>${b.tools && b.tools.length ? `<div class="tools"><b>أدوات النشاط:</b> ${b.tools.map(rich).join('، ')}</div>` : ''}${b.steps && b.steps.length ? `<ol>${b.steps.map((s) => `<li>${rich(s)}</li>`).join('')}</ol>` : ''}${b.observe ? `<p><b>نلاحظ:</b> ${rich(b.observe)}</p>` : ''}${b.conclude ? `<p class="concl"><b>نستنتج:</b> ${rich(b.conclude)}</p>` : ''}</div>`;
    case 'table': return `<div class="card tbl">${pg}<div class="tscroll"><table><thead><tr>${b.head.map((h) => `<th>${auto(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((x) => `<td>${auto(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    case 'figure': return b.svg ? `<div class="card fig">${pg}<div class="figsvg">${b.svg}</div><div class="cap">${rich(b.caption || '')}</div></div>` : '';
    default: return '';
  }
}

function groupBlocks(blocks) {
  // يجمع البطاقات القصيرة المتتالية في شريحة واحدة، ويفرد المثال المحلول والتجربة بشرائح مستقلة
  const slides = []; let cur = [], len = 0;
  const flush = () => { if (cur.length) slides.push({ kind: 'cards', blocks: cur }); cur = []; len = 0; };
  for (const b of blocks) {
    if (b.type === 'example') { flush(); slides.push({ kind: 'example', b }); continue; }
    if (b.type === 'sim') { flush(); slides.push({ kind: 'sim', key: b.key }); continue; }
    if (b.type === 'check') { flush(); slides.push({ kind: 'check', qid: b.qid }); continue; }
    if (b.type === 'figure' && !b.svg) continue;
    const l = JSON.stringify(b).length;
    if (len && (len + l > 900 || b.type === 'activity' || b.type === 'table')) {
      // نص ينتهي بنقطتين يمهّد لما بعده، فينتقل معه إلى الشريحة التالية
      const last = cur[cur.length - 1], lead = last && last.type === 'text' && /[:：]\s*$/.test(last.body) && cur.length > 1 ? cur.pop() : null;
      flush(); if (lead) { cur.push(lead); len = JSON.stringify(lead).length; }
    }
    cur.push(b); len += l;
    if (b.type === 'activity' || b.type === 'table' || b.type === 'law') flush();
  }
  flush(); return slides;
}

async function viewLesson(n, i) {
  await loadIndex(); const d = await loadCh(n), L = d.lessons[i]; if (!L) return go('#/ch/' + n);
  if (!(await gateLesson(n, i))) return go('#/ch/' + n);
  const slides = [{ kind: 'intro' }, ...groupBlocks(L.blocks), { kind: 'quizIntro' }];
  let k = 0, simGoals = 0;
  app.innerHTML = `<main class="lesson" style="--c:${CH_COLORS[n - 1]}"><div class="ltop"><button class="x" id="lx" aria-label="خروج">✕</button><div class="pbar"><i></i></div><span class="lcount" id="lcount"></span></div><div class="lstage" id="ls"></div><div class="lnav"><button class="btn ghost" id="lprev">السابق</button><button class="btn big" id="lnext">التالي</button></div></main>`;
  $('#lx').onclick = () => { sfx.tap(); go('#/ch/' + n); };
  const stage = $('#ls'), next = $('#lnext'), prev = $('#lprev');
  let curSim = null;
  async function show(dir = 1) {
    curSim && curSim.destroy && curSim.destroy(); curSim = null;
    const sl = slides[k];
    $('.ltop .pbar i').style.width = (k / (slides.length - 1)) * 100 + '%';
    $('#lcount').textContent = `${k + 1} / ${slides.length}`;
    prev.style.visibility = k ? 'visible' : 'hidden'; next.style.display = ''; next.disabled = false; next.textContent = 'التالي';
    stage.className = 'lstage ' + (dir > 0 ? 'in-l' : 'in-r'); void stage.offsetWidth;
    if (sl.kind === 'intro') {
      stage.innerHTML = `<div class="lintro"><div class="lmark">${L.id}</div><h1>${esc(L.title)}</h1><div dir="ltr" class="en">${esc(L.titleEn || '')}</div><div class="lmeta">📖 صفحات الكتاب ${(L.pages || []).join('–')}</div>
        <div class="lplan"><span>📚 ${slides.filter((s) => s.kind === 'cards').length} بطاقات شرح</span>${slides.some((s) => s.kind === 'example') ? `<span>✍️ ${slides.filter((s) => s.kind === 'example').length} أمثلة محلولة</span>` : ''}${slides.some((s) => s.kind === 'sim') ? `<span>🧪 ${slides.filter((s) => s.kind === 'sim').length} تجربة افتراضية</span>` : ''}<span>🎯 اختبار المهمة</span></div></div>`;
      next.textContent = 'لننطلق 🚀';
    } else if (sl.kind === 'cards') {
      stage.innerHTML = sl.blocks.map(blockCard).join('');
    } else if (sl.kind === 'example') {
      const b = sl.b; let s = 0;
      stage.innerHTML = `<div class="card ex">${b.page ? `<span class="pg">ص ${b.page}</span>` : ''}<div class="cardk">✍️ مثال ${b.num || ''}</div><div class="exq">${rich(b.question)}</div>${b.svg ? `<div class="figsvg">${b.svg}</div>` : ''}<ol class="steps"></ol><div class="exa"></div><button class="btn alt" id="exStep">أظهر خطوة الحل الأولى</button></div>`;
      next.disabled = true;
      $('#exStep').onclick = () => {
        sfx.flip(); const ol = stage.querySelector('.steps');
        if (s < b.solution.length) { ol.insertAdjacentHTML('beforeend', `<li class="enter">${auto(b.solution[s])}</li>`); s++; }
        if (s >= b.solution.length) { $('#exStep').remove(); if (b.answer) stage.querySelector('.exa').innerHTML = `<div class="final enter">${auto(b.answer)}</div>`; next.disabled = false; store.reward(5, 1); floatText('+5 XP', next); }
        else $('#exStep').textContent = `الخطوة التالية (${s + 1} من ${b.solution.length})`;
      };
    } else if (sl.kind === 'sim') {
      stage.innerHTML = ''; const f = SIMS[sl.key];
      if (f) { curSim = f(stage, { onGoal: () => { simGoals++; store.reward(10, 3); floatText('+10 XP ⚡3', stage.querySelector('.goals')); } }); store.simUsed(); }
    } else if (sl.kind === 'check') {
      const q = d.qById[sl.qid]; next.style.display = 'none';
      const r = await askOne(stage, q);
      if (r.ok) { store.reward(8, 2); }
      next.style.display = ''; k++; return show(1);
    } else if (sl.kind === 'quizIntro') {
      stage.innerHTML = `<div class="lintro"><div class="lmark boss">🎯</div><h1>اختبار المهمة</h1><p>أسئلة من الكتاب ومن الامتحانات الوزارية ومسائل جديدة. اجمع النجوم الثلاث!</p><div class="lplan"><span>⭐ 50%</span><span>⭐⭐ 70%</span><span>⭐⭐⭐ 90%</span></div></div>`;
      next.textContent = 'ابدأ الاختبار ⚔️';
    }
    stage.scrollTop = 0; window.scrollTo(0, 0);
  }
  next.onclick = () => { sfx.tap(); if (k < slides.length - 1) { k++; store.reward(1); show(1); } else lessonQuiz(n, i); };
  prev.onclick = () => { if (k > 0) { sfx.flip(); k--; show(-1); } };
  show();
}

function lessonQuestions(d, L, count = 8) {
  const pool = d.questions.filter((q) => q.lesson === L.id);
  const mcq = shuffle(pool.filter((q) => q.kind === 'mcq'));
  const rev = shuffle(pool.filter((q) => q.kind === 'reveal' && q.source === 'wizari'));
  const gens = (L.gens || []).map(generate).filter(Boolean);
  const extra = shuffle((L.gens || []).map(generate).filter(Boolean));
  const out = [...mcq.slice(0, 4), ...gens.slice(0, 2), ...rev.slice(0, 2)];
  while (out.length < count && (mcq.length > 4 || extra.length || rev.length > 2)) {
    if (mcq.length > 4) out.push(mcq.splice(4, 1)[0]); else if (extra.length) out.push(extra.pop()); else out.push(rev.splice(2, 1)[0]);
  }
  return shuffle(out).slice(0, count);
}

async function lessonQuiz(n, i) {
  const d = await loadCh(n), L = d.lessons[i];
  const qs = lessonQuestions(d, L);
  app.innerHTML = `<main class="quizv" style="--c:${CH_COLORS[n - 1]}"></main>`;
  const r = await runQuiz($('.quizv'), qs, { title: L.title });
  if (!r) return go('#/ch/' + n);
  const stars = starsFor(r.pct), prevStars = (store.state.lessons[L.id] || {}).stars || 0;
  const xp = 20 + r.ok * 5 + Math.max(0, stars - prevStars) * 15 + (r.bestCombo >= 5 ? 10 : 0), el = r.ok + stars * 2;
  store.lessonDone(L.id, stars, r.pct); store.reward(xp, el);
  const nextL = d.lessons[i + 1];
  app.innerHTML = `<main class="result" style="--c:${CH_COLORS[n - 1]}"><div class="res-card pop">
    <div class="res-stars">${[0, 1, 2].map((k) => `<i class="${k < stars ? 'on' : ''}" style="--d:${300 + k * 250}ms">★</i>`).join('')}</div>
    <h1>${stars === 3 ? 'أداء عبقري!' : stars === 2 ? 'أحسنت!' : stars === 1 ? 'بداية جيدة' : 'حاول مرة أخرى'}</h1>
    <div class="res-pct">${r.pct}%</div><p>${r.ok} إجابات صحيحة من ${r.total}${r.bestCombo >= 3 ? ` · أطول سلسلة 🔥${r.bestCombo}` : ''}</p>
    <div class="res-gain"><span>+${xp} XP</span><span>+${el} ⚡</span></div>
    ${r.res.some((x) => !x.ok) ? `<details class="review"><summary>راجع أخطاءك (${r.res.filter((x) => !x.ok).length})</summary>${r.res.filter((x) => !x.ok).map((x) => `<div class="rv"><div>${rich(x.q.q)}</div><div class="rva">${x.q.kind === 'mcq' ? '✓ ' + auto(x.q.options[x.q.correct]) : x.q.kind === 'numeric' ? '✓ ' + auto(x.q.show) : rich(x.q.answer || '') + (x.q.steps ? `<ol class="steps">${x.q.steps.map((s) => `<li>${auto(s)}</li>`).join('')}</ol>` : '')}</div></div>`).join('')}</details>` : ''}
    <div class="row"><button class="btn ghost" id="again">أعد الاختبار</button>${nextL ? `<button class="btn big go" id="nextL">المهمة التالية ←</button>` : `<button class="btn big go" id="toWing">إلى تحدّي الجناح ⚔️</button>`}</div>
  </div></main>`;
  celebrate(stars);
  $('#again').onclick = () => lessonQuiz(n, i);
  const nb = $('#nextL'); if (nb) nb.onclick = async () => { if (await gateLesson(n, i + 1)) go(`#/l/${n}/${i + 1}`); };
  const tw = $('#toWing'); if (tw) tw.onclick = () => go('#/ch/' + n);
}

/* ========== تحدّي الجناح ========== */
async function viewExam(n) {
  const d = await loadCh(n);
  const mcq = shuffle(d.questions.filter((q) => q.kind === 'mcq'));
  const gens = shuffle(d.lessons.flatMap((L) => L.gens || [])).slice(0, 8).map(generate).filter(Boolean);
  const qs = shuffle([...mcq.slice(0, 12), ...gens]).slice(0, 18);
  app.innerHTML = `<main class="result" style="--c:${CH_COLORS[n - 1]}"><div class="res-card pop"><div class="bigi">⚔️</div><h1>تحدّي جناح ${esc(d.title)}</h1><p>${qs.length} سؤالًا تُصحّح آليًا، من الكتاب والوزاريات ومسائل جديدة. تحتاج ${PASS_CH}% لتفتح الجناح التالي. لا تظهر الشروح أثناء التحدّي.</p><button class="btn big go" id="go">ابدأ التحدّي</button><a class="btn ghost" href="#/ch/${n}">ليس الآن</a></div></main>`;
  await new Promise((r) => { $('#go').onclick = r; });
  sfx.unlock2();
  app.innerHTML = `<main class="quizv exam" style="--c:${CH_COLORS[n - 1]}"></main>`;
  const r = await runQuiz($('.quizv'), qs, { examMode: true });
  if (!r) return go('#/ch/' + n);
  const pass = r.pct >= PASS_CH, before = (store.state.chapters[n] || {}).passed;
  store.chapterExam(n, r.pct); store.reward(pass ? 150 + r.ok * 5 : 30 + r.ok * 3, pass ? 40 : 5);
  pass ? (sfx.levelup(), confetti({ n: 260 })) : sfx.fail();
  app.innerHTML = `<main class="result" style="--c:${CH_COLORS[n - 1]}"><div class="res-card pop ${pass ? 'win' : 'lose'}">
    <div class="bigi">${pass ? '🏆' : '💪'}</div><h1>${pass ? (before ? 'اجتزت التحدّي مجددًا!' : 'فُتح الجناح التالي!') : 'لم تبلغ الدرجة المطلوبة بعد'}</h1>
    <div class="res-pct">${r.pct}%</div><p>${r.ok} من ${r.total} · المطلوب ${PASS_CH}%</p>
    ${pass ? '' : '<p>راجع المهام التي حصلت فيها على نجوم أقل، ثم جرّب التحدّي مرة أخرى بأسئلة جديدة.</p>'}
    ${r.res.some((x) => !x.ok) ? `<details class="review"><summary>راجع أخطاءك (${r.res.filter((x) => !x.ok).length})</summary>${r.res.filter((x) => !x.ok).map((x) => `<div class="rv"><div>${rich(x.q.q)}</div><div class="rva">✓ ${x.q.kind === 'mcq' ? auto(x.q.options[x.q.correct]) : auto(x.q.show)}${x.q.why ? `<div class="why">${rich(x.q.why)}</div>` : ''}${x.q.steps ? `<ol class="steps">${x.q.steps.map((s) => `<li>${auto(s)}</li>`).join('')}</ol>` : ''}</div></div>`).join('')}</details>` : ''}
    <div class="row"><a class="btn ghost" href="#/ch/${n}">إلى الجناح</a>${pass ? `<a class="btn big go" href="#/">إلى المحطة</a>` : `<button class="btn big go" id="retry">حاول مرة أخرى</button>`}</div></div></main>`;
  const rt = $('#retry'); if (rt) rt.onclick = () => viewExam(n);
}

/* ========== بنك الوزاريات ========== */
async function viewBank(n) {
  await viewWing(n, 'bank');
  const d = await loadCh(n), S = store.state;
  const wiz = d.questions.filter((q) => q.source === 'wizari');
  const years = [...new Set(wiz.flatMap((q) => (q.occ || []).map((o) => o.year)))].sort((a, b) => b - a);
  const kinds = [...new Set(wiz.map((q) => q.kindLabel).filter(Boolean))];
  const path = $('.path'); path.className = 'bank';
  const solved = wiz.filter((q) => (S.qs[q.id] || {}).c).length;
  path.innerHTML = `<div class="bank-h"><div class="bank-stat"><b>${solved}</b> من <b>${wiz.length}</b> سؤالًا وزاريًا أجبتها صحيحًا<div class="minibar"><i style="width:${(solved / Math.max(1, wiz.length)) * 100}%"></i></div></div>
    <div class="filters"><select id="fy"><option value="">كل السنوات</option>${years.map((y) => `<option>${y}</option>`).join('')}</select><select id="fk"><option value="">كل الأنواع</option>${kinds.map((k) => `<option>${esc(k)}</option>`).join('')}</select><select id="fs"><option value="">الكل</option><option value="new">لم أجبها</option><option value="wrong">أخطأت فيها</option></select></div>
    <button class="btn big go" id="drill">تدرّب على 10 أسئلة من القائمة 🎯</button></div><div class="qlist" id="ql"></div>`;
  const list = () => {
    const y = $('#fy').value, k = $('#fk').value, s = $('#fs').value;
    return wiz.filter((q) => (!y || (q.occ || []).some((o) => String(o.year) === y)) && (!k || q.kindLabel === k) && (!s || (s === 'new' ? !S.qs[q.id] : (S.qs[q.id] || {}).w > (S.qs[q.id] || {}).c)));
  };
  const paint = () => {
    const L = list();
    $('#ql').innerHTML = L.map((q) => { const r = S.qs[q.id]; return `<button class="qitem ${r ? (r.c ? 'ok' : 'bad') : ''}" data-id="${q.id}"><span class="qk">${esc(q.kindLabel || '')}</span><span class="qq">${rich(q.q.length > 160 ? q.q.slice(0, 160) + '…' : q.q)}</span><span class="qy">${esc(occLabel(q.occ))}</span></button>`; }).join('') || '<p class="empty">لا توجد أسئلة بهذه التصفية.</p>';
  };
  ['fy', 'fk', 'fs'].forEach((id) => $('#' + id).onchange = paint); paint();
  $('#ql').onclick = async (e) => { const b = e.target.closest('.qitem'); if (!b) return; drill([d.qById[b.dataset.id]], n); };
  $('#drill').onclick = () => { const L = shuffle(list()).slice(0, 10); if (L.length) drill(L, n); };
}
async function drill(qs, n) {
  if (!(await (await access()).gate({ grade: GRADE, lesson: 999 }))) return;
  app.innerHTML = `<main class="quizv" style="--c:${CH_COLORS[n - 1]}"></main>`;
  const r = await runQuiz($('.quizv'), qs);
  if (r) { store.reward(5 + r.ok * 6, r.ok); r.ok && confetti({ n: 60 + r.ok * 10 }); toast(`أجبت ${r.ok} من ${r.total} صحيحًا. +${5 + r.ok * 6} XP`, { icon: '🏛️' }); }
  go('#/bank/' + n);
}

/* ========== بطاقات المراجعة ========== */
async function viewCards(n) {
  await viewWing(n, 'cards');
  const d = await loadCh(n);
  const cards = [];
  d.lessons.forEach((L) => L.blocks.forEach((b) => { if (b.type === 'definition') cards.push({ f: b.term, b: b.body, l: L.id }); if (b.type === 'law' && b.where && b.where.filter(Boolean).length) cards.push({ f: (b.where && b.where[0]) ? 'قانون: ' + (b.lawName || L.title) : 'قانون', fm: b.formula, b: (b.where || []).join('\n'), l: L.id }); }));
  const path = $('.path'); path.className = 'cardsv';
  let i = 0, deck = shuffle(cards);
  const paint = () => {
    const c = deck[i];
    path.innerHTML = `<div class="fc-wrap"><div class="fc-count">${i + 1} / ${deck.length} · من الدرس ${c.l}</div><div class="flash" id="fc"><div class="face front">${c.fm ? `<div class="formula" dir="ltr">${tex(c.fm, true)}</div><small>ما معنى رموز هذا القانون؟</small>` : `<h2>${rich(c.f)}</h2><small>ما تعريفه؟ انقر لتقلب البطاقة</small>`}</div><div class="face back">${c.fm ? `<ul class="where">${c.b.split('\n').map((x) => `<li>${auto(x)}</li>`).join('')}</ul>` : `<p>${rich(c.b)}</p>`}</div></div>
      <div class="row"><button class="btn warn" id="fNo">لم أتذكّرها</button><button class="btn go" id="fYes">تذكّرتها ✓</button></div></div>`;
    $('#fc').onclick = () => { sfx.flip(); $('#fc').classList.toggle('flipped'); };
    const nx = (ok) => { ok ? (sfx.coin(), store.reward(2, ok ? 1 : 0)) : (sfx.flip(), deck.push(c)); i++; if (i >= deck.length) { confetti({ n: 80 }); path.innerHTML = '<div class="fc-done"><div class="bigi">🃏</div><h2>أنهيت البطاقات!</h2><button class="btn big go" id="fAgain">جولة جديدة</button></div>'; $('#fAgain').onclick = () => { i = 0; deck = shuffle(cards); paint(); }; } else paint(); };
    $('#fYes').onclick = () => nx(true); $('#fNo').onclick = () => nx(false);
  };
  cards.length ? paint() : (path.innerHTML = '<p class="empty">لا توجد بطاقات.</p>');
}

/* ========== قاعة التجارب ========== */
async function viewLab(n, key) {
  await viewWing(n, 'lab');
  const d = await loadCh(n);
  const keys = [...new Set(d.lessons.flatMap((L) => L.blocks.filter((b) => b.type === 'sim').map((b) => b.key)))];
  const names = { plates: 'المتسعة ذات الصفيحتين', network: 'ربط المتسعات', energy: 'الطاقة المختزنة', rc: 'الشحن والتفريغ', variable: 'المتسعة المتغيرة', keyboard: 'مفتاح لوحة الحاسوب' };
  const path = $('.path'); path.className = 'labv';
  const k0 = key || keys[0];
  path.innerHTML = `<div class="labtabs">${keys.map((k) => `<a href="#/lab/${n}/${k}" class="${k === k0 ? 'on' : ''}">${names[k] || k}</a>`).join('')}</div><div id="labstage"></div>`;
  if (SIMS[k0]) { SIMS[k0]($('#labstage'), { onGoal: () => { store.reward(10, 3); } }); store.simUsed(); }
}

/* ========== تحدّي اليوم ========== */
async function viewDaily() {
  await loadIndex();
  const t = store.today(); const done = store.state.daily[t];
  const avail = INDEX.chapters.filter((c) => chapterState(c) === 'open');
  const pools = await Promise.all(avail.map((c) => loadCh(c.n)));
  const all = pools.flatMap((d) => d.questions.filter((q) => q.kind === 'mcq'));
  // الأولوية للأسئلة التي أخطأ فيها الطالب
  const S = store.state.qs, weak = all.filter((q) => (S[q.id] || {}).w > (S[q.id] || {}).c);
  const gens = pools.flatMap((d) => d.lessons.flatMap((L) => L.gens || []));
  const qs = shuffle([...shuffle(weak).slice(0, 2), ...shuffle(all).slice(0, 2), ...shuffle(gens).slice(0, 1).map(generate)]).filter(Boolean).slice(0, 5);
  app.innerHTML = `<main class="quizv"></main>`;
  const r = await runQuiz($('.quizv'), qs);
  if (!r) return go('#/');
  const first = !done; const xp = first ? 30 + r.ok * 10 : r.ok * 3;
  store.state.daily[t] = { ok: Math.max(r.ok, done ? done.ok : 0), total: r.total }; store.save();
  store.reward(xp, first ? 10 : 0); if (first) store.badge('daily');
  celebrate(starsFor(r.pct));
  app.innerHTML = `<main class="result"><div class="res-card pop"><div class="bigi">📅</div><h1>${first ? 'أنجزت تحدّي اليوم!' : 'جولة إضافية'}</h1><div class="res-pct">${r.ok}/${r.total}</div><div class="res-gain"><span>+${xp} XP</span>${first ? '<span>+10 ⚡</span>' : ''}</div><p>عُد غدًا لتحدٍّ جديد وحافظ على سلسلتك 🔥</p><a class="btn big go" href="#/">إلى المحطة</a></div></main>`;
}

/* ========== الامتحان الوزاري التجريبي ========== */
async function viewMock() {
  await loadIndex();
  const avail = INDEX.chapters.filter((c) => chapterState(c) === 'open');
  const pools = await Promise.all(avail.map((c) => loadCh(c.n)));
  const wiz = pools.flatMap((d) => d.questions.filter((q) => q.source === 'wizari'));
  const pick = (f, n) => shuffle(wiz.filter(f)).slice(0, n);
  const probs = pick((q) => q.steps && q.steps.length, 6), concept = pick((q) => !q.steps && q.kind === 'reveal', 12), mcq = pick((q) => q.kind === 'mcq', 6);
  const paper = [];
  for (let i = 0; i < 6; i++) {
    const parts = [probs[i], concept[2 * i], concept[2 * i + 1] || mcq[i]].filter(Boolean);
    if (parts.length) paper.push(parts);
  }
  if (paper.length < 6) toast('الورقة الآن من الأجنحة المفتوحة فقط، وتكتمل كلما فتحت أجنحة جديدة.', { icon: 'ℹ️', ms: 5000 });
  const T = 3 * 3600; let left = T, timer;
  app.innerHTML = `<main class="mock"><div class="mock-head"><div><div class="k">جمهورية العراق — وزارة التربية · اللجنة الدائمة للامتحانات العامة</div><h1>امتحان تجريبي: الفيزياء — السادس العلمي</h1><div class="k">ملاحظة: أجب عن خمسة أسئلة فقط، ولكل سؤال 20 درجة.</div></div><div class="timer" id="tm">3:00:00</div></div>
    <ol class="paper">${paper.map((parts, i) => `<li class="pq"><div class="pqh">س${i + 1}</div>${parts.map((q, j) => `<div class="part"><b>${'ABC'[j]})</b> ${rich(q.q)}${q.figure ? `<div class="qfig">${q.figure}</div>` : ''}${q.kind === 'mcq' ? `<ol class="mopts">${q.options.map((o) => `<li>${auto(o)}</li>`).join('')}</ol>` : ''}<div class="tag">${esc(occLabel(q.occ))}</div></div>`).join('')}</li>`).join('')}</ol>
    <div class="mock-foot"><p>حلّ الورقة في دفترك كما في القاعة الامتحانية، ثم اضغط «أنهيت» لترى الأجوبة النموذجية وتصحّح لنفسك.</p><button class="btn big go" id="fin">أنهيت، أرني الأجوبة</button></div></main>`;
  const tm = $('#tm');
  timer = setInterval(() => { left--; const h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), s = left % 60; tm.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; if (left <= 600) tm.classList.add('warn'); if (left <= 0) { clearInterval(timer); $('#fin').click(); } }, 1000);
  addEventListener('hashchange', () => clearInterval(timer), { once: true });
  $('#fin').onclick = () => {
    clearInterval(timer); sfx.unlock2();
    const used = T - left;
    app.querySelectorAll('.part').forEach((p, idx) => {
      const flat = paper.flat(), q = flat[idx];
      p.insertAdjacentHTML('beforeend', `<div class="mans">${q.kind === 'mcq' ? '✓ ' + auto(q.options[q.correct]) : q.steps ? `<ol class="steps">${q.steps.map((s) => `<li>${auto(s)}</li>`).join('')}</ol>${q.final ? `<div class="final">${auto(q.final)}</div>` : ''}` : rich(q.answer)}</div><div class="grade"><span>درجتك لهذا الفرع:</span><button data-g="0">✗ خطأ</button><button data-g="0.5">½ جزئي</button><button data-g="1">✓ صحيح</button></div>`);
    });
    $('#fin').outerHTML = `<button class="btn big go" id="score">احسب درجتي</button>`;
    app.querySelectorAll('.grade').forEach((g) => g.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; sfx.tap(); g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); g.dataset.v = b.dataset.g; });
    $('#score').onclick = () => {
      const qScores = paper.map((parts, i) => { const gs = [...app.querySelectorAll('.pq')][i].querySelectorAll('.grade'); let s = 0; gs.forEach((g) => s += +(g.dataset.v || 0)); return (s / parts.length) * 20; });
      const best5 = qScores.sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0), total = Math.round(best5 * (6 / Math.max(paper.length, 1)) > 100 ? 100 : best5 * (5 / Math.min(5, paper.length)));
      store.reward(80 + Math.round(total / 2), 20); store.badge('mock'); confetti({ n: 220 });
      modal(`<div class="rankup"><div class="bigi">🎓</div><h2>درجتك التقديرية: ${total} من 100</h2><p>استغرقت ${Math.round(used / 60)} دقيقة. ${total >= 90 ? 'مستوى ممتاز، أنت جاهز للقاعة!' : total >= 70 ? 'مستوى جيد، راجع الفروع التي أخطأت فيها.' : 'تحتاج مراجعة أكثر، ارجع إلى مهام الأجنحة وبنك الوزاريات.'}</p><button class="btn big go" data-v="1">حسنًا</button></div>`, { cls: 'pop' });
    };
  };
}

/* ========== الأوسمة والإعدادات ========== */
function viewBadges() {
  const S = store.state, r = store.rank();
  app.innerHTML = `${hud()}<main class="badgesv"><a class="back" href="#/">→ المحطة</a><h1>أوسمتي ورتبتي</h1>
    <section class="rankcard"><div class="bigi">${r.icon}</div><div><b>${esc(r.name)}</b><div class="minibar"><i style="width:${r.pct * 100}%"></i></div><small>${S.xp} XP${r.nextName ? ` · ${r.to - S.xp} للوصول إلى «${esc(r.nextName)}»` : ''}</small></div></section>
    <div class="ranks">${store.RANKS.map(([x, name, ic], i) => `<span class="${i <= r.i ? 'on' : ''}">${ic} ${esc(name)}<small>${x}</small></span>`).join('')}</div>
    <h2 class="sec">الأوسمة</h2><div class="bgrid">${Object.entries(store.BADGES).map(([id, [ic, name, desc]]) => `<div class="bdg ${S.badges.includes(id) ? 'on' : ''}"><div class="bi">${S.badges.includes(id) ? ic : '❔'}</div><b>${esc(name)}</b><small>${esc(desc)}</small></div>`).join('')}</div>
    <h2 class="sec">إحصاءاتي</h2><div class="stats"><div><b>${S.stats.correct}</b><small>إجابة صحيحة</small></div><div><b>${S.stats.wizari}</b><small>سؤالًا وزاريًا</small></div><div><b>${S.stats.sims}</b><small>تجربة</small></div><div><b>${S.streak.best}</b><small>أطول سلسلة</small></div></div>
  </main>${footer()}`;
}
async function viewSettings() {
  const a = await access(); const paid = await a.hasAccess(GRADE);
  app.innerHTML = `${hud()}<main class="settings"><a class="back" href="#/">→ المحطة</a><h1>الإعدادات</h1>
    <div class="set"><b>الأصوات</b><button class="btn" id="snd">${sfx.on ? '🔊 مفعّلة' : '🔇 مطفأة'}</button></div>
    <div class="set"><b>تقليل الحركة</b><button class="btn" id="rm">${document.body.classList.contains('rm') ? 'مفعّل' : 'غير مفعّل'}</button></div>
    <div class="set"><b>ملفي (الاسم والصورة)</b><button class="btn" id="prof">تعديل</button></div>
    <div class="set"><b>الاشتراك</b><span>${paid ? '✓ كتب السادس العلمي مفتوحة على هذا الجهاز' : 'الدروس الخمسة الأولى مجانية'}</span><a class="btn" href="https://imadmfas.github.io/allawh/#/grade/s6/sci">${paid ? 'إدارة / تسجيل الخروج' : 'عندي كلمة سر'}</a></div>
    <div class="set danger"><b>مسح تقدّمي في هذا الكتاب</b><button class="btn warn" id="wipe">مسح</button></div></main>${footer()}`;
  $('#snd').onclick = () => { sfx.set(!sfx.on); viewSettings(); };
  $('#rm').onclick = () => { const v = !document.body.classList.contains('rm'); document.body.classList.toggle('rm', v); try { localStorage.setItem('p6-rm', v ? '1' : ''); } catch (e) {} viewSettings(); };
  $('#prof').onclick = async () => { await onboarding(true); viewSettings(); };
  $('#wipe').onclick = () => { if (confirm('سيُمسح كل تقدّمك ونقاطك وأوسمتك في هذا الكتاب. متأكد؟')) { localStorage.removeItem('s6-sci-physics'); location.reload(); } };
}

/* ========== التوجيه ========== */
function go(h) { if (location.hash === h) route(); else location.hash = h; }
async function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  window.scrollTo(0, 0);
  try {
    if (!p.length) await viewStation();
    else if (p[0] === 'ch') await viewWing(+p[1]);
    else if (p[0] === 'l') await viewLesson(+p[1], +p[2]);
    else if (p[0] === 'exam') await viewExam(+p[1]);
    else if (p[0] === 'bank') await viewBank(+p[1]);
    else if (p[0] === 'cards') await viewCards(+p[1]);
    else if (p[0] === 'lab') await viewLab(+p[1], p[2]);
    else if (p[0] === 'daily') await viewDaily();
    else if (p[0] === 'mock') await viewMock();
    else if (p[0] === 'badges') viewBadges();
    else if (p[0] === 'settings') await viewSettings();
    else await viewStation();
  } catch (e) { console.error(e); app.innerHTML = `<main class="err"><h1>حدث خطأ</h1><p>${esc(e.message)}</p><a class="btn" href="#/">المحطة</a></main>`; }
}
addEventListener('hashchange', route);
document.addEventListener('click', (e) => { if (e.target.closest('#meBtn')) onboarding(true).then(route); }, true);
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
try { if (localStorage.getItem('p6-rm')) document.body.classList.add('rm'); } catch (e) {}
(async () => { await onboarding(false); route(); })();
