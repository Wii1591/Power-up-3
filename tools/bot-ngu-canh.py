"""Ngữ cảnh cho bot Will (functions/api/bot.js): mỗi phần sách (Welcome to Diversicus, Unit 1…9, Review…, Grammar reference) = từ vựng + mẫu câu + lời mọi bài nghe (kèm loại bài).
Nguồn: public/_app/du_lieu.js (từ trong tranh, tên + loại bài) + lời whisper các track ở thư mục sách (_cd/loi.json) + TU_THEM (từ trang Vocabulary
mà tranh không có nhãn — soạn tay từ chữ in trên trang) + MAU (mẫu câu soạn tay từ 2 khung Grammar spotlight mỗi unit).
"muc" = danh sách mục Will luyện + chấm (từ + mẫu câu) — tiến độ của con lưu theo đúng chuỗi này, nên ĐỔI chữ một mục là mất tiến độ cũ của mục đó.
Sách 3: trang ảnh = trang sách (Power Up 1 lệch 2). Chạy lại khi sách đổi:  python tools/bot-ngu-canh.py  → bot/ngu-canh.json
"""
import json, pathlib, re, sys
sys.stdout.reconfigure(encoding='utf-8')

REPO = pathlib.Path(__file__).resolve().parents[1]
SACH = pathlib.Path(r"C:\Users\Administrator\Downloads\Tieng Anh\Power Up\Power Up Pupil's Book\Power Up Level 3 Pupil's Book")
D = json.loads((REPO / 'public/_app/du_lieu.js').read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
LOI = json.loads((SACH / '_cd/loi.json').read_text(encoding='utf-8'))

MAU = {
    'Welcome to Diversicus': ["Who's this? — This is …", "Where's Diversicus? — It's in …"],
    'Unit 1': ["Which country are we in? — We're in …", "Why are you …ing? — Because …", "What time do you have lunch? — I have lunch at half past …",
               "I could … when I was … / I couldn't …"],
    'Unit 2': ["It's the place where … / the woman who … / the … which …", "When we finished …, we went to …"],
    'Unit 3': ["I'm not as … as you", "… is …er than … / … is the …est", "I want to … / You need to … / I don't want to …"],
    'Unit 4': ["We mustn't … loudly / Look carefully / It worked well", "… can … faster / better / more quickly than …"],
    'Unit 5': ["What's it made of? — It's made of …", "Shall we …? — Let's … / We could …"],
    'Unit 6': ["You should … / You shouldn't …", "Should you …? — Yes, you should. / No, you shouldn't.", "I'm good at … / Are you good at …? / I'm not very good at …"],
    'Unit 7': ["When you …, you … / If you …, you …", "What does your … look like? — He's / She's … and he's / she's got …", "What's your … like? — He's / She's very …"],
    'Unit 8': ["I'm going to … / It isn't going to …", "What are we going to … first?", "We should go into / through / across / past / round the …"],
    'Unit 9': ["Before / After / When I …, I …", "You're going to be … / It's going to be …"],
}
TU_THEM = {
    'Welcome to Diversicus': ['circus', 'acrobat', 'clown', 'tent', 'show', 'tour'],
    'Unit 1': ['breakfast', 'a snack', 'lunch', 'dinner', 'wake up', 'go to bed', 'midday', 'midnight', "o'clock", 'half past'],
    'Unit 2': ['drove', 'saw', 'grew up', 'told', 'taught', 'got dressed up', 'wrote', 'took photos', 'gave', 'climbed', 'built'],
    'Unit 3': ['cough', 'temperature', 'sore throat', 'cold', 'backache', 'stomach-ache', 'headache', 'hurt', 'doctor'],
    'Unit 4': ['waterfall', 'jungle', 'carefully', 'slowly', 'quickly', 'flew', 'sailed', 'fished', 'threw', 'caught', 'learnt'],
    'Unit 5': ['card', 'metal', 'glass', 'plastic', 'wool', 'wood', 'paper', 'scissors', 'glue', 'made of'],
    'Unit 6': ['geography', 'history', 'maths', 'language', 'music', 'science', 'IT', 'art', 'sport', 'laptop', 'e-book', 'dictionary', 'internet',
               'website', 'copy', 'cut', 'screen', 'homework'],
    'Unit 7': ['interesting', 'kind', 'friendly', 'clever', 'lazy', 'popular', 'brave', 'unkind', 'unfriendly'],
    'Unit 8': ['straight on', 'north', 'east', 'west', 'airport', 'bank', 'post office', "chemist's", 'theatre', 'museum', 'university', 'hotel', 'restaurant', 'stamp'],
    'Unit 9': ['alone', 'strange', 'horrible', 'noisy', 'huge', 'lucky', 'excellent', 'special', 'suitcase', 'rucksack', 'pyjamas', 'trainers',
               'postcard', 'sandcastle', 'pack'],
}
BO_TU = {'waterfallj', 'little dog', 'man', 'huge mouth', 'special shoes', 'tour is over', 'paste'}   # mảnh câu / chữ OCR sai dính nhãn tranh
TAT_CA = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6', 'Unit 7', 'Unit 8', 'Unit 9']
REVIEW = {'Review 1–3': TAT_CA[:3], 'Review 4–6': TAT_CA[3:6], 'Review 7–9': TAT_CA[6:]}
CHI_MAU = {'Grammar reference': TAT_CA}                  # trang ngữ pháp cuối sách: luyện lại mẫu câu cả 9 unit (không gộp từ — quá dài)
GOP = {'Bìa': 'Welcome to Diversicus', 'Map of the book': 'Welcome to Diversicus', 'Bìa sau': 'Grammar reference'}   # phần không có bài nghe → dùng ngữ cảnh phần này
MISSION = 0                                              # sách 3 không có trang Mission

ten = lambda s: s['ten'] if not s['chu'] or s['ten'] == 'Mission' else f"{s['ten']} — {s['chu']}"
phan_cua = lambda p: next(s for s in D['phan'] if s['tu'] <= p <= s['den'])
DAN = re.compile(r"^(Pupils?'?s?\s*Book,?\s*)?(Unit \w+,?\s*)?(page \d+\.?,?\s*)?", re.I)   # lời dẫn đầu track
CHUC = {'a', 'an', 'the', 'and', 'with', 'in', 'on', 'at', 'of', 'to', 'me', 'are', 'is', 'under', 'their'}

def tu_sach(ds):                                         # nhãn từ trong tranh: chỉ giữ từ / cụm thường (bỏ mảnh lời bài hát, câu, số dính chữ)
    ra = []
    for w in ds:
        w = re.sub(r'\d+', '', w).strip(' ,.?!—-').lower() if w[:1].islower() else ''
        t = w.split()
        if re.fullmatch(r'[a-z][a-z ]*', w) and len(t) <= 3 and t[0] not in CHUC and t[-1] not in CHUC and w not in ra and w not in BO_TU: ra.append(w)
    return ra

phan = {}
for s in D['phan']:
    if s['ten'] in GOP or s['ten'] == 'Mission': continue
    tu = tu_sach(w[8] for w in D['tu'] if s['tu'] <= w[0] <= s['den'])
    tu += [w for w in TU_THEM.get(s['ten'], []) if w not in tu]
    bai = [{'trang': t['trang'], 'ten': t['ten'], 'loai': t['loai'],
            'loi': DAN.sub('', ' '.join(x[2] for x in LOI.get(t['file'][4:], []))).strip()}
           for t in D['track'] if s['tu'] <= t['trang'] <= s['den']]
    phan[s['ten']] = {'ten': ten(s), 'tu': tu, 'mau': MAU.get(s['ten'], []), 'bai': [b for b in bai if b['loi']]}

cu = []
for k, p in phan.items():                                # từ học trước + mục luyện (Review = gộp 3 unit)
    p['tu_cu'] = list(cu)
    nguon = [phan[u] for u in REVIEW.get(k, [k])]
    p['muc'] = [m for q in nguon for m in q['tu'] + q['mau']]
    if k in CHI_MAU: p['muc'] = [m for u in CHI_MAU[k] for m in phan[u]['mau']]
    cu += [w for w in p['tu'] if w not in cu]

trang = {}
for p in range(1, D['soTrang'] + 1):
    s = phan_cua(p)['ten']
    trang[p] = GOP.get(s) or (f'Unit {p - MISSION}' if s == 'Mission' else s)
assert all(v in phan for v in trang.values()), set(trang.values()) - set(phan)
assert all(p['muc'] for p in phan.values()), [k for k, p in phan.items() if not p['muc']]

ra = REPO / 'bot/ngu-canh.json'
ra.parent.mkdir(exist_ok=True)
ra.write_text(json.dumps({'trang': trang, 'phan': phan}, ensure_ascii=False, indent=0), encoding='utf-8')
for k, v in phan.items(): print(f"{k:20} {len(v['tu']):3} từ {len(v['mau'])} mẫu {len(v['muc']):3} mục {len(v['bai']):2} bài | {', '.join(v['tu'][:8])}")
print('→', ra, f'{ra.stat().st_size // 1024} KB')
