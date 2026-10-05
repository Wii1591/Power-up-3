# Power Up 3 — sách Cambridge Power Up 3 tương tác (bản web iPad)

App học sách **Power Up 3 (Pupil's Book)** cho bé trên iPad: 128 trang, nút nghe 🎧 trên từng trang, chữ chạy theo bài hát / bài vè / truyện,
chạm nhãn từ trong tranh để nghe riêng từ, 🎶 bản nhạc không lời, 52 video, **bài tập chạm là chấm ngay**, viết Apple Pencil, bot 🐢 **Nói với Will**.
Dựng 05/10/2026 bằng cách nhân bản repo `power-up-1-web` (cùng kiến trúc **Cloudflare Pages + Cloudflare Access + D1**) — README của Power Up 1
giải thích lý do từng chi tiết (Service Worker, Range, bỏ đuôi `.html`, tiến độ không gộp…); ở đây chỉ ghi phần riêng của sách 3 (repo `power-up-3-web` dựng cùng lúc, gần như y hệt).

## 1. Địa chỉ

| Gì | Link |
|---|---|
| **App** | https://power-up-3.pages.dev — đăng nhập: email `ducanle91@gmail.com` → mã gửi về Gmail (Cloudflare Access, phiên 1 tháng) |
| Cloudflare: project Pages `power-up-3` (Settings → Variables and Secrets: `ANTHROPIC_API_KEY`; binding D1 `DB` + `AI` khai trong `wrangler.toml`) | https://dash.cloudflare.com/c1e40df298a2b44ea5a959584b84ca24/pages/view/power-up-3/settings/production |
| Cloudflare Zero Trust (nhóm `bitter-smoke-e9ba`): Access → Applications → **Power Up 3** (`power-up-3.pages.dev` + `*.power-up-3.pages.dev`, luật dùng chung "Chi anh An (Gmail)", One-time PIN) | https://dash.cloudflare.com/c1e40df298a2b44ea5a959584b84ca24/one/access-controls/apps |
| Cloudflare D1 `learning-english` → bảng `tien_do` (dòng `app = 'pu3'`) — **dùng chung** với Power Up 1 (`pu1`), Power Up 2 (`pu2`), Phonics Wings 5 (`opw5`); SQL ở repo `oup-5-game/sql/tien-do.sql` | https://dash.cloudflare.com/c1e40df298a2b44ea5a959584b84ca24/workers/d1 |
| Sách trên máy (nơi sửa) | `Downloads\Tieng Anh\Power Up\Power Up Pupil's Book\Power Up Level 3 Pupil's Book\` (README ở đó = quy trình dựng sách + sổ review nội dung) |
| Repo | chỉ git trên máy (anh chốt 05/10/2026 — không có GitHub, không có AI Studio) |

**iPad:** Safari mở https://power-up-3.pages.dev → Chia sẻ → *Thêm vào MH chính* (tên "Power Up 3") → mở từ biểu tượng → đăng nhập Gmail → **Tải hết về máy** (Wi-Fi, 277 MB). Làm trong app ở MH chính vì iPad giữ dữ liệu của app MH chính riêng với Safari.

**Xem tiến độ của con** (mọi sách một chỗ): `npx wrangler@4 d1 execute learning-english --remote --command "select app, khoa, length(gia_tri) n, datetime(cap_nhat/1000, 'unixepoch', '+7 hours') luc from tien_do order by cap_nhat desc limit 30"`.

## 2. Cách chạy

```
iPad ── Cloudflare Access (chỉ Gmail anh An, phiên 1 tháng) ── Cloudflare Pages power-up-3
          │                                                      ├─ app + 309 tệp nặng (cùng 1 tên miền, CDN)
          │  Service Worker (public/sw.js)                       ├─ functions/api/tien-do.js ──► D1 learning-english, bảng tien_do (app 'pu3')
          └─ Cache Storage trên máy: pu3-tep · pu3-vo            └─ functions/api/bot.js ──► Workers AI (Whisper nghe, Aura đọc) + Claude API
```
- Giống hệt Power Up 1, đổi khoá: localStorage `pu3-…` (đồng bộ), `pu3~…` (chỉ trên máy), kho `pu3-tep` / `pu3-vo`, Function chỉ nhận khoá `pu3-`.
- **Tệp nặng KHÔNG nằm trong repo** (bản quyền Cambridge + nặng): `tools/len-cloudflare.py` gọi `_app/tools/danh-sach-up.py` của sách (danh sách trang + tiếng + video mà mã sách gọi) rồi **chép thẳng từ thư mục sách** vào `dist` lúc deploy — khác Power Up 1 (chép qua bản sao `len-Drive\PU1-len-Drive\tep-sach`), bớt một bước + bớt 250 MB trùng.
- Sách 3: **trang ảnh = trang sách** (ảnh là bản scan làm đẹp) (Power Up 1 lệch 2) — `functions/api/bot.js` `moDau` không cộng 2.

### 🐢 Nói với Will
Như Power Up 1 (README Power Up 1 mục "Nói với Will": giữ 🎤 → Whisper → Claude Sonnet 5.5 → Aura; tiếng Việt chỉ khi con bí; giáo án theo loại bài; trí nhớ + ⭐ + 📊 theo từng máy). Riêng sách 3:
- Lời dặn: "Power Up 3 (A1 Movers level)", câu tới ~20 từ, giọng cô giáo tiểu học; loại bài: truyện **Diversicus**, khung **Grammar spotlight**.
- `bot/ngu-canh.json` sinh bằng `python tools/bot-ngu-canh.py`: từ = nhãn trong tranh + **`TU_THEM`** (từ in trên trang Vocabulary mà tranh không gắn nhãn: giờ giấc, bệnh, vật liệu, môn học, tính cách, nơi chốn, đồ du lịch…) − `BO_TU` (mảnh câu dính nhãn); mẫu câu `MAU` soạn tay từ 2 khung **Grammar spotlight** mỗi unit (lời whisper). Bìa + Map of the book → "Welcome to Diversicus"; Grammar reference (tr. 120–127) + Bìa sau → luyện lại mẫu câu cả 9 unit (`CHI_MAU`); sách 3 không có trang Mission. Đổi chữ 1 mục là mất tiến độ cũ của mục đó.
- Tiến độ bot: `pu3-bot-tien-do-<mã máy>`, nhật ký `pu3-bot-nk` (đồng bộ D1 như bài tập).

## 3. Quy trình làm (Claude tự làm hết)

1. Sửa trong thư mục sách (`tao-sach.py` / `ghep-bai-tap.py` / `sach-pu3.js`…) → thử trên máy (`Mo-Sach-Power-Up-2.cmd`).
2. `python tools/chep-sach.py` (chép mã sách vào `public/`, chèn `cau-hinh.js` `tai-ve.js` `may-chu.js` + `bot.js`) → sách đổi lời/từ thì `python tools/bot-ngu-canh.py`.
3. `python tools/len-cloudflare.py thu` → `node tools/thu-nhanh.mjs` → `node tools/thu/thu-web.mjs <thư mục ảnh>` (sửa bot: `node tools/thu/thu-bot.mjs <thư mục ảnh>` — micro giả "I can jump." + Claude giả, Whisper/Aura thật). Sửa `functions/api/tien-do.js`: `node ../oup-5-game/tools/thu/thu-tien-do.mjs pu3`.
4. `python tools/len-cloudflare.py` (build + deploy; wrangler chỉ tải tệp mới/đổi) → `git commit`.
5. iPad: mở lại màn đầu (mã mới nhờ `?v=`; tệp nặng đổi thì màn đầu so kb và tải lại — đổi < 1 KB thì phải đổi tên tệp).

## 4. Cài đặt (05/10/2026)

1. ✅ `wrangler pages project create power-up-3 --production-branch main`.
2. ✅ Access app "Power Up 3" (`power-up-3.pages.dev` + `*.power-up-3.pages.dev`), chép đúng cấu hình app "Power Up 1" (luật "Chi anh An (Gmail)", One-time PIN, phiên 730 giờ) — Claude tạo qua API của dash trong Chrome của anh (OAuth wrangler không có quyền Access). Soát curl TRƯỚC khi deploy: 302.
3. ✅ Deploy đầu + soát lại (trang, `_dm.json`, ảnh, `/api/tien-do`, link xem trước đều 302 khi chưa đăng nhập).
4. ⬜ Anh đặt secret `ANTHROPIC_API_KEY` (dùng lại khoá của Power Up 1): Cloudflare Pages `power-up-3` → Settings → Variables and Secrets → Add → Type **Secret**, tên `ANTHROPIC_API_KEY` → Save → báo em deploy lại (secret chỉ áp từ bản deploy sau). Chưa có khoá thì khung chat báo "Chưa có khoá ANTHROPIC_API_KEY".
5. ⬜ Anh thử trên iPad (thêm MH chính → đăng nhập → Tải hết → học thử + 🐢).

## 5. Nhật ký thay đổi

| Ngày | Commit / deploy | Thay đổi |
|---|---|---|
| 05/10/2026 | (commit đầu) deploy d639cf0d | Nhân bản từ `power-up-1-web` (d2a8dc6…ea19bbd): khoá `pu3-`, D1 dùng chung app `pu3`, biểu tượng rùa Will nền đỏ + huy hiệu tím "3" (`Ban web iPad\_icon\tao-icon.py`), `len-cloudflare.py` chép thẳng từ thư mục sách, bot theo sách 3 (lời dặn A1 Movers, `TU_THEM`, `MAU` Grammar spotlight, Grammar reference, không lệch trang), bài thử theo trang sách 3 |

## 6. Lỗi hay gặp

Xem bảng bẫy ở README `power-up-1-web` mục 6 (đã dính ở Power Up 1 + Oxford Phonics). Riêng phần Cloudflare:

| Triệu chứng | Nguyên nhân | Cách tránh / chữa |
|---|---|---|
| Tệp sách lộ công khai | Tên miền/link mới chưa nằm trong Access app | Mọi tên miền thêm cho project phải thêm vào Access app "Power Up 3" TRƯỚC khi deploy; soát `curl -s -o /dev/null -w "%{http_code}" https://…/_dm.json` phải ra 302 |
| Vừa tạo Access app, curl lúc 302 lúc 522 | Luật chưa lan hết các máy chủ biên | Đợi tới khi 30 lượt đều 302 rồi mới deploy (05/10/2026 dính lại) |
| Đặt secret xong `/api/bot` vẫn 503 | Secret Pages chỉ áp cho bản deploy sau | Deploy lại |
| Bài thử giải bài trả `{"tong":0}` | Trang chọn chỉ có ô không chấm (vd ô Mission tích tự do) | Chọn trang có ô `da` (sách 3: trang 12; trang 6 chỉ có ô Mission tích tự do — dính 05/10/2026) |

## 7. Sổ review

| Ngày | Ai | Kết quả |
|---|---|---|
| 05/10/2026 | Claude (`thu-nhanh` + `thu-web`, wrangler pages dev) | Lượt đầu HỎNG ở bước giải bài (trang 6 không có ô chấm → đổi trang 12), sau đó ĐẠT: máy mới mở thẳng sách → về màn đầu bật SW → quay lại sách; trang 4 nút nghe + video chạy (qua SW, Range); giải bài trang 12 → D1 giả → máy mới kéo về; Tải hết 309/309 (277 MB); mất mạng mở sách, trang 97 + tiếng, video trang 96 vẫn chạy; 0 lỗi JS, 0 tệp hỏng. |
