// حالة الطالب وتقدّمه: الخبرة والرتب والإلكترونات والسلسلة والأوسمة.
const KEY = 's6-sci-physics';
const PKEY = 'allawh-profile';

const blank = () => ({ xp: 0, el: 0, streak: { n: 0, last: null, best: 0 }, lessons: {}, chapters: {}, qs: {}, badges: [], daily: {}, stats: { correct: 0, wrong: 0, wizari: 0, perfect: 0, sims: 0, exams: 0 } });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
export const state = S;
export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

export function profile() { try { return JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch (e) { return null; } }
export function setProfile(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }

export const AVATARS = [
  ['🦁', '#ffe8cc'], ['🐯', '#fff3bf'], ['🐼', '#e9ecef'], ['🦊', '#ffe3e3'], ['🐰', '#f3d9fa'], ['🐢', '#d3f9d8'],
  ['🦉', '#e5dbff'], ['🐬', '#d0ebff'], ['🐝', '#fff9db'], ['🦋', '#c5f6fa'], ['🚀', '#dbe4ff'], ['⭐', '#fff0f6'],
];

export const RANKS = [
  [0, 'متدرّب مختبر', '🧪'], [150, 'مساعد باحث', '🔬'], [400, 'باحث', '⚗️'], [800, 'باحث أول', '🧲'],
  [1400, 'مهندس تجارب', '⚙️'], [2200, 'خبير فيزياء', '🔭'], [3300, 'عالِم', '🧠'], [4800, 'عالِم متميّز', '🏅'], [7000, 'أسطورة الفيزياء', '👑'],
];
export function rank(xp = S.xp) {
  let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const [from, name, icon] = RANKS[i], next = RANKS[i + 1];
  return { i, name, icon, from, to: next ? next[0] : from, pct: next ? (xp - from) / (next[0] - from) : 1, nextName: next ? next[1] : null };
}

const listeners = new Set();
export const on = (fn) => listeners.add(fn);
const emit = (ev) => listeners.forEach((fn) => fn(ev));

export const today = () => new Date().toLocaleDateString('en-CA');
function touchStreak() {
  const t = today();
  if (S.streak.last === t) return;
  const y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  S.streak.n = S.streak.last === y ? S.streak.n + 1 : 1;
  S.streak.last = t; S.streak.best = Math.max(S.streak.best, S.streak.n);
  emit({ type: 'streak', n: S.streak.n });
  if (S.streak.n >= 3) badge('streak3'); if (S.streak.n >= 7) badge('streak7'); if (S.streak.n >= 30) badge('streak30');
}
export function streakAlive() {
  const t = today(), y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  return S.streak.last === t || S.streak.last === y ? S.streak.n : 0;
}

export function reward(xp, el = 0, where = null) {
  const before = rank().i;
  S.xp += xp; S.el += el; touchStreak(); save();
  emit({ type: 'xp', xp, el, where });
  const after = rank();
  if (after.i > before) emit({ type: 'rank', rank: after });
}

export const BADGES = {
  first: ['🎯', 'أول مهمة', 'أنهيت أول مهمة في المختبر'],
  perfect: ['💎', 'بلا خطأ', 'أنهيت اختبار مهمة بالدرجة الكاملة'],
  streak3: ['🔥', 'شعلة ثلاثة أيام', 'تعلّمت ثلاثة أيام متتالية'],
  streak7: ['🌋', 'أسبوع كامل', 'سبعة أيام متتالية'],
  streak30: ['☄️', 'شهر من الشغف', 'ثلاثون يومًا متتالية'],
  wiz10: ['📜', 'قارئ الوزاريات', 'أجبت عشرة أسئلة وزارية'],
  wiz50: ['🏛️', 'صيّاد الوزاريات', 'خمسون سؤالًا وزاريًا'],
  wiz150: ['👨‍⚖️', 'ملك الوزاريات', 'مئة وخمسون سؤالًا وزاريًا'],
  sim5: ['🧪', 'يد المجرّب', 'شغّلت خمس تجارب افتراضية'],
  ch1: ['🔋', 'سيّد المتسعات', 'اجتزت تحدّي جناح المتسعات'],
  ch1gold: ['🥇', 'متسعات ذهبية', 'تحدّي المتسعات بدرجة 95% فأكثر'],
  ch2: ['🧲', 'سيّد الحث', 'اجتزت تحدّي جناح الحث الكهرومغناطيسي'], ch2gold: ['🥇', 'حث ذهبي', 'تحدّي الحث بدرجة 95% فأكثر'],
  ch3: ['〰️', 'سيّد التيار المتناوب', 'اجتزت تحدّي جناح التيار المتناوب'], ch3gold: ['🥇', 'رنين ذهبي', 'تحدّي التيار المتناوب بدرجة 95% فأكثر'],
  ch4: ['📡', 'سيّد الموجات', 'اجتزت تحدّي جناح الموجات الكهرومغناطيسية'], ch4gold: ['🥇', 'موجات ذهبية', 'تحدّي الموجات بدرجة 95% فأكثر'],
  ch5: ['🌈', 'سيّد البصريات', 'اجتزت تحدّي جناح البصريات الفيزيائية'], ch5gold: ['🥇', 'ضوء ذهبي', 'تحدّي البصريات بدرجة 95% فأكثر'],
  ch6: ['⚛️', 'سيّد الفيزياء الحديثة', 'اجتزت تحدّي جناح الفيزياء الحديثة'], ch6gold: ['🥇', 'كمّ ذهبي', 'تحدّي الفيزياء الحديثة بدرجة 95% فأكثر'],
  ch7: ['💡', 'سيّد الإلكترونيات', 'اجتزت تحدّي جناح إلكترونيات الحالة الصلبة'], ch7gold: ['🥇', 'ترانزستور ذهبي', 'تحدّي الإلكترونيات بدرجة 95% فأكثر'],
  ch8: ['🔦', 'سيّد الليزر', 'اجتزت تحدّي جناح الأطياف الذرية والليزر'], ch8gold: ['🥇', 'طيف ذهبي', 'تحدّي الأطياف والليزر بدرجة 95% فأكثر'],
  ch9: ['☢️', 'سيّد النواة', 'اجتزت تحدّي جناح الفيزياء النووية'], ch9gold: ['🥇', 'نواة ذهبية', 'تحدّي الفيزياء النووية بدرجة 95% فأكثر'],
  all9: ['👑', 'فاتح المختبر', 'اجتزت تحدّيات الأجنحة التسعة كلها'],
  daily: ['📅', 'تحدّي اليوم', 'أنهيت التحدّي اليومي'],
  combo10: ['⚡', 'سلسلة صاعقة', 'عشر إجابات صحيحة متتالية'],
  mock: ['🎓', 'الامتحان الكبير', 'أنهيت امتحانًا وزاريًا تجريبيًا كاملًا'],
};
export function badge(id) {
  if (S.badges.includes(id) || !BADGES[id]) return;
  S.badges.push(id); save(); emit({ type: 'badge', id });
}

export function answer(qid, ok, { wizari = false } = {}) {
  const r = S.qs[qid] || { c: 0, w: 0 };
  ok ? r.c++ : r.w++; r.t = Date.now(); S.qs[qid] = r;
  ok ? S.stats.correct++ : S.stats.wrong++;
  if (wizari && ok) { S.stats.wizari++; if (S.stats.wizari >= 10) badge('wiz10'); if (S.stats.wizari >= 50) badge('wiz50'); if (S.stats.wizari >= 150) badge('wiz150'); }
  save();
}

export function lessonDone(id, stars, pct) {
  const L = S.lessons[id] || { stars: 0, best: 0, runs: 0 };
  L.stars = Math.max(L.stars, stars); L.best = Math.max(L.best, pct); L.runs++; L.done = true; S.lessons[id] = L;
  badge('first'); if (pct === 100) { S.stats.perfect++; badge('perfect'); }
  save();
}

export function chapterExam(n, pct) {
  const C = S.chapters[n] || { best: 0, tries: 0 };
  C.best = Math.max(C.best, pct); C.tries++; if (pct >= 80) C.passed = true; S.chapters[n] = C; S.stats.exams++;
  if (pct >= 80) badge('ch' + n); if (pct >= 95) badge('ch' + n + 'gold');
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9].every((k) => (S.chapters[k] || {}).passed)) badge('all9');
  save();
}

export function simUsed() { S.stats.sims++; if (S.stats.sims >= 5) badge('sim5'); save(); }
