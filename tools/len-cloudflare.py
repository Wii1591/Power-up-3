"""Đưa app lên Cloudflare Pages (project power-up-3, sau Cloudflare Access chỉ Gmail anh An):
vite build → _app/tools/danh-sach-up.py của sách lập danh sách tệp nặng mã sách gọi (trang + tiếng + video) → chép thẳng từ thư mục sách
vào dist → lập dist/_dm.json (danh mục [đường dẫn, kb] cho "Tải hết") → wrangler pages deploy (chỉ tải lên tệp mới/đổi, so băm).
Chạy (thư mục repo):  python tools/len-cloudflare.py        — build + deploy
                      python tools/len-cloudflare.py thu    — chỉ build (để node tools/thu/thu-web.mjs thử trên máy)
"""
import json, pathlib, shutil, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")

REPO = pathlib.Path(__file__).resolve().parent.parent
SACH = pathlib.Path(r"C:\Users\Administrator\Downloads\Tieng Anh\Power Up\Power Up Pupil's Book\Power Up Level 3 Pupil's Book")
DIST = REPO / 'dist'
sh = lambda lenh, cwd=REPO: subprocess.run(lenh, cwd=cwd, check=True, shell=True)

sh('npx vite build')
sh(f'"{sys.executable}" _app/tools/danh-sach-up.py', SACH)
dm = []
for x in json.loads((SACH / '_app/danh-sach-file.json').read_text(encoding='utf-8')):
    d = DIST / x['p']
    d.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SACH / x['p'], d)
    dm.append([x['p'], round(d.stat().st_size / 1024)])
(DIST / '_dm.json').write_text(json.dumps(sorted(dm), ensure_ascii=False), encoding='utf-8')
print(f'dist: {len(dm)} tệp nặng, {sum(k for _, k in dm) / 1024:.0f} MB')
if sys.argv[1:] != ['thu']:
    sh('npx --yes wrangler@4 pages deploy --branch main --commit-dirty=true')
