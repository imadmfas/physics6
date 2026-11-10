#!/usr/bin/env python3
"""يجمع بيانات فصل (الكتاب + الوزاريات + الرسوم + أسئلة التدريب) في data/chN.json.
الاستعمال: python3 tools/build_ch.py N"""
import json, os, re, sys
W = '/home/claude/work'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

import glob
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1
CFG = json.load(open(os.path.join(ROOT, 'tools', 'chapters.json')))[str(N)]
book = json.load(open(f'{W}/ch{N}_book.json'))
waz = []
for f in sorted(glob.glob(f'{W}/ch{N}_waz*.json')): waz += json.load(open(f))
figs = json.load(open(f'{W}/figs{"" if N == 1 else N}.json')) if os.path.exists(f'{W}/figs{"" if N == 1 else N}.json') else {}
tags = json.load(open(f'{W}/ch{N}_booktags.json')) if os.path.exists(f'{W}/ch{N}_booktags.json') else {}

def lid(x):  # "2-1" كما يُطبع في الكتاب = الدرس 1-2
    return '-'.join(reversed(x.split('-')))

SIMS = CFG.get('sims', {})
GENS = CFG.get('gens', {})
ICONS = CFG.get('icons', {})
BOOK_MCQ_LESSON = {int(k): v for k, v in (tags.get('mcq') or CFG.get('mcq', {})).items()}
BOOK_CON_LESSON = {int(k): v for k, v in (tags.get('conceptual') or CFG.get('conceptual', {})).items()}
BOOK_PROB_LESSON = {int(k): v for k, v in (tags.get('problems') or CFG.get('problems', {})).items()}

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
for qi, q in enumerate(eq.get('mcq', [])):
    questions.append({'id': f'c{N}bm{q["num"]}', 'kind': 'mcq', 'source': 'book', 'lesson': BOOK_MCQ_LESSON.get(q['num']), 'q': q['q'], 'options': [strip_opt(o) for o in q['options']], 'correct': q['correct'], 'why': q.get('why'), 'figure': figsvg(f'Emcq{qi}', q), 'kindLabel': 'اختيار من متعدد'})
for qi, q in enumerate(eq.get('conceptual', [])):
    questions.append({'id': f'c{N}bc{q["num"]}', 'kind': 'reveal', 'source': 'book', 'lesson': BOOK_CON_LESSON.get(q['num']), 'q': q['q'], 'answer': q.get('answer'), 'figure': figsvg(f'Econceptual{qi}', q), 'kindLabel': 'سؤال مفاهيمي'})
for qi, q in enumerate(eq.get('problems', [])):
    questions.append({'id': f'c{N}bp{q["num"]}', 'kind': 'reveal', 'source': 'book', 'lesson': BOOK_PROB_LESSON.get(q['num']), 'q': q['q'], 'steps': q.get('solution'), 'final': q.get('answer'), 'figure': figsvg(f'Eproblems{qi}', q), 'kindLabel': 'مسألة'})

DOUBT = set(json.load(open(f'{W}/doubtful.json'))) if os.path.exists(f'{W}/doubtful.json') else set()
waz = [q for q in waz if q['id'] not in DOUBT]  # الأسئلة المشكوك في نصها المطبوع محذوفة
for q in waz:
    base = {'id': q['id'], 'source': 'wizari', 'lesson': q.get('lesson'), 'q': q['q'], 'occ': q.get('occurrences', []), 'kindLabel': q.get('kind'), 'figure': figs.get(q['id'])}
    if q.get('kind') == 'اختر' and q.get('options') and q.get('correct') is not None:
        questions.append({**base, 'kind': 'mcq', 'options': [strip_opt(o) for o in q['options']], 'correct': q['correct'], 'why': q.get('answer')})
    elif q.get('steps'):
        questions.append({**base, 'kind': 'reveal', 'steps': q['steps'], 'final': q.get('final'), 'answer': q.get('answer')})
    else:
        questions.append({**base, 'kind': 'reveal', 'answer': q.get('answer') or ''})

lab = json.load(open(f'{W}/ch{N}_mcq_lab.json')) if os.path.exists(f'{W}/ch{N}_mcq_lab.json') else []
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

out = {'chapter': N, 'title': book['title'], 'titleEn': book['titleEn'], 'pages': book['pages'], 'objectives': book.get('objectives', []), 'terms': book.get('terms', []), 'lessons': lessons, 'questions': questions}
os.makedirs(f'{ROOT}/data', exist_ok=True)
json.dump(out, open(f'{ROOT}/data/ch{N}.json', 'w'), ensure_ascii=False, separators=(',', ':'))

# فهرس الكتاب: الفصول الجاهزة هي التي لها ملف بيانات
titles = [('المتسعات', 'Capacitors'), ('الحث الكهرومغناطيسي', 'Electromagnetic Induction'), ('التيار المتناوب', 'Alternating Current'), ('الموجات الكهرومغناطيسية', 'Electromagnetic Waves'), ('البصريات الفيزيائية', 'Physical Optics'), ('الفيزياء الحديثة', 'Modern Physics'), ('الكترونيات الحالة الصلبة', 'Solid State Electronics'), ('الأطياف الذرية والليزر', 'Atomic Spectra and Laser'), ('الفيزياء النووية', 'Nuclear Physics')]
chs = []
for i, (t, e) in enumerate(titles):
    fp = f'{ROOT}/data/ch{i + 1}.json'
    ready = os.path.exists(fp)
    n = len(json.load(open(fp))['lessons']) if ready else 10
    chs.append({'n': i + 1, 'title': t, 'titleEn': e, 'ready': ready, 'lessons': n})
json.dump({'book': 'الفيزياء — السادس العلمي', 'chapters': chs}, open(f'{ROOT}/data/index.json', 'w'), ensure_ascii=False, indent=1)

from collections import Counter
print('lessons', [(L['id'], len(L['blocks'])) for L in lessons])
print('questions', len(questions), Counter((q['source'], q['kind']) for q in questions))
print('no lesson:', [q['id'] for q in questions if not q['lesson']])
print('figs used', sum(1 for q in questions if q.get('figure')) + sum(1 for L in lessons for b in L['blocks'] if b.get('svg')))
print('size KB', os.path.getsize(f'{ROOT}/data/ch{N}.json') // 1024)
