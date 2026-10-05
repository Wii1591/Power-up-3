// Màn mở đầu: bật Service Worker, đồng bộ tiến độ với D1, tải trước tệp về máy.
// Đăng nhập: Cloudflare Access (chỉ Gmail của anh An) đứng trước cả trang — tới được đây là đã đăng nhập.
const $ = id => document.getElementById(id);
const { KHO_TEP, TaiVe } = self;

const baoTrangThai = s => { $('trang-thai').textContent = s; };
const ngu = ms => new Promise(r => setTimeout(r, ms));

const goi = q => TaiVe.goi(q);

// ===== tiến độ: so giờ sửa từng khoá "pu3-…" (bài tập pu3-bt, sao pu3-sao, chữ viết pu3-viet-…, trang đang mở…) giữa máy và D1 —
// bên nào sửa sau thì giữ. Không gộp 2 bên: "↺ Làm lại" xoá bài của trang, gộp thì bài cũ bên kia sống lại.
const giờSua = k => +localStorage.getItem('pu3~t~' + k) || 0;
const datKhoa = (k, v, t) => { localStorage.setItem(k, v); localStorage.setItem('pu3~t~' + k, String(t)); };
async function dongBo() {
  const sv = (await goi({ a: 'tai' })).du_lieu || {}, len = {}, khoa = new Set(Object.keys(sv));
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('pu3-')) khoa.add(k); }
  for (const k of khoa) {
    const may = localStorage.getItem(k), [v, ts] = sv[k] || [null, 0];
    if (v !== null && ts > giờSua(k)) datKhoa(k, v, ts);
    else if (may !== null && (v === null || giờSua(k) > ts)) len[k] = [may, giờSua(k) || Date.now()];
  }
  if (Object.keys(len).length) await goi({ a: 'luu', du_lieu: len });
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ===== tệp trên máy =====
let thieu = [], tongKb = 0, daKb = 0, tong = 0, da = 0, dangTaiHet = false;
function veKho() {
  const pt = tongKb ? Math.floor(daKb / tongKb * 100) : 0;
  $('thanh').firstElementChild.style.transform = `scaleX(${pt / 100})`; $('thanh').setAttribute('aria-valuenow', pt);
  $('kho-chu').textContent = `Đã có ${da}/${tong} tệp · ${Math.round(daKb / 1024)}/${Math.round(tongKb / 1024)} MB` + (da === tong ? ' — đủ rồi, học được cả khi không có mạng.' : '');
  $('tai-het').disabled = false;
  $('tai-het').textContent = dangTaiHet ? '⏸ Dừng tải' : da === tong ? '✅ Đã tải đủ' : `⬇️ Tải nốt ${Math.round((tongKb - daKb) / 1024)} MB về máy`;
}
async function kiemKho() {
  const dm = await TaiVe.danhMuc();
  const kho = await caches.open(KHO_TEP), co = new Map();
  for (const r of await kho.keys()) co.set(decodeURIComponent(new URL(r.url).pathname.slice('/_tep/'.length)), r);
  thieu = []; tong = dm.length; tongKb = da = daKb = 0;
  await Promise.all(dm.map(async ([p, kb]) => {   // hỏi cả danh mục một lượt (hỏi lần lượt trên iPad mất vài giây)
    tongKb += kb;
    const r = co.get(p), cu = r && await kho.match(r);
    if (cu && Math.abs(+cu.headers.get('X-Kb') - kb) <= 1) { da++; daKb += kb; return; }
    if (r) await kho.delete(r);               // tệp trên Drive đã được thay → bỏ bản cũ, tải lại
    thieu.push([p, kb]);
  }));
  thieu.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  veKho();
}
function taiHet() {
  if (dangTaiHet) { dangTaiHet = false; TaiVe.dung(); veKho(); return; }   // bấm lần nữa = dừng
  if (!thieu.length) return;                              // đã đủ: không có gì tải, khỏi kẹt ở "Dừng tải" (onXong không bao giờ gọi)
  dangTaiHet = true; veKho();
  navigator.storage?.persist?.();
  localStorage.setItem('pu3~tai-het', '1');             // lần mở sau màn đầu tự tải nốt phần còn thiếu
  TaiVe.toiDaTho = 6;
  TaiVe.onTep = (p, kb) => { da++; daKb += kb; veKho(); };
  TaiVe.onLoi = e => baoTrangThai(e.name === 'QuotaExceededError' ? 'Máy hết chỗ lưu — xoá bớt ảnh/video trên iPad rồi tải tiếp.' : 'Tải chưa được: ' + e.message);
  TaiVe.onXong = () => { dangTaiHet = false; kiemKho().catch(() => veKho()); };
  TaiVe.them(thieu.map(x => x[0]));
}

async function moDau() {
  if (!('serviceWorker' in navigator) || !self.caches) return baoTrangThai('Trình duyệt này chưa hỗ trợ lưu dữ liệu — dùng Safari hoặc Chrome bản mới.');
  await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });   // host đặt .js "immutable": SW phải tự hỏi lại cả cau-hinh.js
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {   // lần đầu: đợi Service Worker nhận quản trang
    await Promise.race([new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true })), ngu(3000)]);
    if (!navigator.serviceWorker.controller) return location.reload();
  }
  // vỏ app phải có bản sao thì mất mạng mới mở được: SW tự cất những gì đi qua nó, nhưng lần mở đầu tiên trang này tải trước khi
  // có SW, còn trang sách thì con có thể chưa mở lần nào → xin lại cả vỏ qua SW (có rồi thì máy chủ chỉ trả 304), kể cả
  // đúng các tệp .js?v=… mà trang sách gọi (vite.config.js gắn ?v=)
  const lay = u => fetch(u).catch(() => {});
  [location.pathname, ...[...document.querySelectorAll('script[src], img[src], link[rel=manifest], link[rel$=icon]')].map(e => e.src || e.href)].forEach(lay);
  fetch('/Hoc-Power-Up-3.html').then(r => r.text()).then(h => [...h.matchAll(/src="\/?([^":]+\.js\?v=\w+)"/g)].forEach(m => lay('/' + m[1]))).catch(() => {});
  $('vao').hidden = $('kho').hidden = false;
  const ve = new URLSearchParams(location.search).get('ve');
  baoTrangThai('☁️ Đang đồng bộ tiến độ…');
  try { baoTrangThai(`☁️ Tiến độ đã đồng bộ lúc ${await Promise.race([dongBo(), ngu(10000).then(() => { throw new Error('mạng chậm'); })])}`); }
  catch (e) { baoTrangThai('☁️ Chưa đồng bộ được tiến độ (' + e.message + ') — vẫn học được, lần sau sẽ đồng bộ bù.'); }
  if (ve && ve.startsWith('/')) return location.replace(ve);   // trang sách gửi về để bật Service Worker → quay lại đúng chỗ
  kiemKho().then(() => { if (thieu.length && localStorage.getItem('pu3~tai-het') === '1' && !dangTaiHet) taiHet(); })
    .catch(e => { $('kho-chu').textContent = 'Chưa kiểm tra được: ' + e.message; });
}

$('tai-het').addEventListener('click', taiHet);
moDau().catch(e => baoTrangThai('Lỗi: ' + e.message));
