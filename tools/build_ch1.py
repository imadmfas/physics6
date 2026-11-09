#!/usr/bin/env python3
"""يجمع بيانات الفصل الأول (الكتاب + الوزاريات + الرسوم) في data/ch1.json."""
import json, os, re, sys
W = '/home/claude/work'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

book = json.load(open(f'{W}/ch1_book.json'))
waz = json.load(open(f'{W}/ch1_waz_a.json')) + json.load(open(f'{W}/ch1_waz_b.json'))
figs = json.load(open(f'{W}/figs.json')) if os.path.exists(f'{W}/figs.json') else {}

def lid(x):  # "2-1" كما يُطبع في الكتاب = الدرس 1-2
    a, b = x.split('-'); return f'{b}-{a}'

SIMS = {'1-3': ['plates'], '1-4': ['plates'], '1-5': ['plates'], '1-6': ['network'], '1-7': ['energy'], '1-8': ['variable'], '1-9': ['rc'], '1-10': ['keyboard']}
GENS = {'1-1': ['sphere'], '1-3': ['cap_q', 'cap_c'], '1-4': ['diel_off', 'diel_on'], '1-5': ['plates'], '1-6': ['series', 'parallel', 'series_v'], '1-7': ['energy', 'energy_q', 'energy_x'], '1-9': ['rc_i']}
ICONS = {'1-1': '🔋', '1-2': '▮▮', '1-3': 'C', '1-4': '🧱', '1-5': '📐', '1-6': '🔗', '1-7': '⚡', '1-8': '🎛️', '1-9': '💡', '1-10': '📱'}
BOOK_MCQ_LESSON = {1: '1-4', 2: '1-3', 3: '1-5', 4: '1-7', 5: '1-4', 6: '1-6', 7: '1-5', 8: '1-6', 9: '1-6', 10: '1-6'}
BOOK_CON_LESSON = {2: '1-7', 3: '1-9', 4: '1-5', 5: '1-9', 6: '1-7', 7: '1-8', 8: '1-6', 9: '1-10', 10: '1-4', 11: '1-4', 12: '1-4'}
BOOK_PROB_LESSON = {1: '1-9', 2: '1-7', 3: '1-6', 4: '1-6', 5: '1-6', 6: '1-7', 7: '1-6', 8: '1-6', 9: '1-6'}

strip_opt = lambda o: re.sub(r'^\s*\(?[a-dA-D]\)\s*', '', o).strip()

lessons = []
for li, L in enumerate(book['lessons']):
    i = lid(L['id']); blocks = []
    for bi, b in enumerate(L['blocks']):
        b = dict(b)
        if b['type'] == 'figure':
            b['svg'] = figs.get(f'L{li}B{bi}')
        if b['type'] == 'example':
            fs = ([b['figure']] if b.get('figure') else []) + b.get('figures', [])
            svgs = [figs.get(f'L{li}B{bi}F{k}') for k in range(len(fs))]
            b['svg'] = ''.join(s for s in svgs if s) or None
            b.pop('figure', None); b.pop('figures', None)
        b.pop('describe', None)
        blocks.append(b)
    lessons.append({'id': i, 'title': L['title'], 'titleEn': L.get('titleEn', ''), 'pages': L.get('pages', []), 'icon': ICONS.get(i), 'blocks': blocks, 'gens': GENS.get(i, [])})

questions = []
eq = book['endQuestions']
def figsvg(prefix, q):
    n = (1 if q.get('figure') else 0) + len(q.get('figures', []))
    s = ''.join(figs.get(f'{prefix}F{k}') or '' for k in range(n)); return s or None
for qi, q in enumerate(eq['mcq']):
    questions.append({'id': f'bm{q["num"]}', 'kind': 'mcq', 'source': 'book', 'lesson': BOOK_MCQ_LESSON.get(q['num']), 'q': q['q'], 'options': [strip_opt(o) for o in q['options']], 'correct': q['correct'], 'why': q.get('why'), 'figure': figsvg(f'Emcq{qi}', q), 'kindLabel': 'اختيار من متعدد'})
for qi, q in enumerate(eq['conceptual']):
    questions.append({'id': f'bc{q["num"]}', 'kind': 'reveal', 'source': 'book', 'lesson': BOOK_CON_LESSON.get(q['num']), 'q': q['q'], 'answer': q.get('answer'), 'figure': figsvg(f'Econceptual{qi}', q), 'kindLabel': 'سؤال مفاهيمي'})
for qi, q in enumerate(eq['problems']):
    questions.append({'id': f'bp{q["num"]}', 'kind': 'reveal', 'source': 'book', 'lesson': BOOK_PROB_LESSON.get(q['num']), 'q': q['q'], 'steps': q.get('solution'), 'final': q.get('answer'), 'figure': figsvg(f'Eproblems{qi}', q), 'kindLabel': 'مسألة'})

for q in waz:
    base = {'id': q['id'], 'source': 'wizari', 'lesson': q.get('lesson'), 'q': q['q'], 'occ': q.get('occurrences', []), 'kindLabel': q.get('kind'), 'figure': figs.get(q['id'])}
    if q.get('kind') == 'اختر' and q.get('options') and q.get('correct') is not None:
        questions.append({**base, 'kind': 'mcq', 'options': [strip_opt(o) for o in q['options']], 'correct': q['correct'], 'why': q.get('answer')})
    elif q.get('steps'):
        questions.append({**base, 'kind': 'reveal', 'steps': q['steps'], 'final': q.get('final'), 'answer': q.get('answer')})
    else:
        questions.append({**base, 'kind': 'reveal', 'answer': q.get('answer') or ''})

lab = json.load(open(f'{W}/ch1_mcq_lab.json')) if os.path.exists(f'{W}/ch1_mcq_lab.json') else []
for q in lab:
    questions.append({'id': q['id'], 'kind': 'mcq', 'source': 'lab', 'lesson': q['lesson'], 'q': q['q'], 'options': q['options'], 'correct': q['correct'], 'why': q.get('why'), 'kindLabel': 'اختر الإجابة الصحيحة'})

# إدراج التجارب وسؤال تحقق سريع داخل كل درس
for L in lessons:
    bl = L['blocks']
    for k in SIMS.get(L['id'], []):
        # بعد آخر قانون أو في نهاية الشرح قبل الأمثلة
        pos = max([j + 1 for j, b in enumerate(bl) if b['type'] in ('law', 'activity')] or [len(bl)])
        ex = [j for j, b in enumerate(bl) if b['type'] == 'example']
        if ex: pos = min(pos, ex[0])
        bl.insert(pos, {'type': 'sim', 'key': k})
    chk = [q for q in questions if q['lesson'] == L['id'] and q['kind'] == 'mcq' and q['source'] == 'wizari'] or [q for q in questions if q['lesson'] == L['id'] and q['kind'] == 'mcq']
    if chk and len(bl) > 3:
        bl.insert(max(2, int(len(bl) * 0.55)), {'type': 'check', 'qid': chk[0]['id']})

out = {'chapter': 1, 'title': book['title'], 'titleEn': book['titleEn'], 'pages': book['pages'], 'objectives': book.get('objectives', []), 'terms': book.get('terms', []), 'lessons': lessons, 'questions': questions}
os.makedirs(f'{ROOT}/data', exist_ok=True)
json.dump(out, open(f'{ROOT}/data/ch1.json', 'w'), ensure_ascii=False, separators=(',', ':'))

titles = [('المتسعات', 'Capacitors'), ('الحث الكهرومغناطيسي', 'Electromagnetic Induction'), ('التيار المتناوب', 'Alternating Current'), ('الموجات الكهرومغناطيسية', 'Electromagnetic Waves'), ('البصريات الفيزيائية', 'Physical Optics'), ('الفيزياء الحديثة', 'Modern Physics'), ('الكترونيات الحالة الصلبة', 'Solid State Electronics'), ('الأطياف الذرية والليزر', 'Atomic Spectra and Laser'), ('الفيزياء النووية', 'Nuclear Physics')]
LC = [10, 0, 0, 0, 0, 0, 0, 0, 0]
idx = {'book': 'الفيزياء — السادس العلمي', 'chapters': [{'n': i + 1, 'title': t, 'titleEn': e, 'ready': i == 0, 'lessons': LC[i] or 10} for i, (t, e) in enumerate(titles)]}
json.dump(idx, open(f'{ROOT}/data/index.json', 'w'), ensure_ascii=False, indent=1)

from collections import Counter
print('lessons', [(L['id'], len(L['blocks'])) for L in lessons])
print('questions', len(questions), Counter((q['source'], q['kind']) for q in questions))
print('no lesson:', [q['id'] for q in questions if not q['lesson']])
print('figs used', sum(1 for q in questions if q.get('figure')) + sum(1 for L in lessons for b in L['blocks'] if b.get('svg')))
print('size KB', os.path.getsize(f'{ROOT}/data/ch1.json') // 1024)
