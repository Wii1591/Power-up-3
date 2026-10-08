"""Chép phần MÃ của sách từ bản trên máy (nơi đang sửa) vào public/ của app web.
Tệp nặng (trang sách, âm thanh, video) KHÔNG vào repo: tools/len-cloudflare.py chép vào dist lúc deploy.
Chạy sau mỗi lần sửa sách (tao-sach.py / ghep-bai-tap.py / sửa sach-pu3.js, bai-tap.js):
  python tools/chep-sach.py  rồi thử → python tools/len-cloudflare.py → git commit + push (README mục 3).
"""
import pathlib, re, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')

NGUON = pathlib.Path(r"C:\Users\Administrator\Downloads\Tieng Anh\Power Up\Power Up Pupil's Book\Power Up Level 3 Pupil's Book")
RA = pathlib.Path(__file__).resolve().parents[1] / 'public'
TRANG = 'Hoc-Power-Up-3.html'
MA = [TRANG] + re.findall(r'<script src="([^"]+\.js)"', (NGUON / TRANG).read_text(encoding='utf-8'))   # mọi .js trang sách gọi
CHEN = '<link rel="icon" href="icon-192.png"><script src="cau-hinh.js"></script><script src="tai-ve.js"></script><script src="may-chu.js"></script>'   # Service Worker, tải trước, đồng bộ tiến độ
CUOI = ''   # 🐢 Nói với Will TẮT 08/10/2026 (anh An); bật lại: '<script src="bot.js"></script>\n' + bỏ dòng tắt đầu functions/api/bot.js — bot (cần /api/bot, chỉ có ở bản web) — sau mã sách vì dùng biến của sách

for p in MA:
    d = RA / p
    d.parent.mkdir(parents=True, exist_ok=True)
    if p.endswith('.html'):
        s = (NGUON / p).read_text(encoding='utf-8')
        assert '<head>' in s and CHEN not in s and s.count('</body>') == 1, p
        d.write_text(s.replace('<head>', '<head>\n' + CHEN, 1).replace('</body>', CUOI + '</body>'), encoding='utf-8')
    else:
        shutil.copy2(NGUON / p, d)
    print('chép', p)
