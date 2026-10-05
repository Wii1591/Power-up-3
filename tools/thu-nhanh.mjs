// Kiểm tra nhanh (không cần trình duyệt): node tools/thu-nhanh.mjs
//  tai-ve.js: taiTruoc (them(ds, true)) kéo được tệp lên đầu hàng kể cả khi nền đã xếp hết từ trước.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const GOC = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.slice(1))), '..');   // "Tieng Anh" → %20 (dời thư mục 03/10)

// ---- 1. hàng tải trước ----
{
  // 300 tệp nền rồi 2 tệp của trang đang mở nằm cuối danh mục
  const dm = [...Array(300)].map((_, i) => [`_cd/CD1/Track${i}.mp3`, 30]).concat([['_app/trang/p050.jpg', 1300], ['_cd/CD3/Track40.mp3', 2000]]);
  const thuTu = [];
  const ctx = vm.createContext({ Response, Blob, URL, URLSearchParams, JSON, Map, Set, Promise, Error, setTimeout, encodeURIComponent,
    caches: { open: async () => ({ match: async () => undefined, put: async () => {}, keys: async () => [] }) },
    fetch: async url => {
      if (url === '/_dm.json') return { ok: true, json: async () => dm };
      thuTu.push(decodeURIComponent(url.replace(/\?goc$/, '').slice(1)));
      await new Promise(r => setTimeout(r, 20));
      return { ok: true, blob: async () => new Blob([]) };
    } });
  ctx.self = ctx;
  vm.runInContext(fs.readFileSync(path.join(GOC, 'public/cau-hinh.js'), 'utf8') + fs.readFileSync(path.join(GOC, 'public/tai-ve.js'), 'utf8'), ctx);
  const T = ctx.TaiVe;
  T.toiDaTho = 1;
  T.them(dm.map(x => x[0]));                                        // may-chu.js: nền xếp hết sách
  await new Promise(r => setTimeout(r, 5));
  T.them(['_cd/CD3/Track40.mp3', '_app/trang/p050.jpg'], true);   // con lật tới trang 50 → taiTruoc
  await new Promise(r => { T.onXong = r; });
  const vt = p => thuTu.indexOf(p) + 1;
  assert.equal(thuTu.length, 302, 'mỗi tệp tải đúng 1 lần (kể cả tệp đang nằm trong lượt tải dở lúc xin tải trước)');
  const a = vt('_app/trang/p050.jpg'), b = vt('_cd/CD3/Track40.mp3');
  assert.ok(a <= 5 && b <= 5, `tệp của trang đang mở phải tải ngay sau tệp đang dở (≤ 5), đang ở vị trí ${a}, ${b} / 302`);
  console.log(`✓ taiTruoc kéo tệp trang đang mở lên đầu hàng: tải thứ ${a} và ${b} / 302 (trước khi sửa: 301–302)`);
}
