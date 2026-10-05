// Service Worker: trang sách gọi tệp theo đường dẫn cũ (vd _app/trang/p012.jpg, _cd/CD1/Track07.mp3) → lấy trong máy, chưa có thì tải (Cloudflare Pages) rồi cất lại.
// Trả được yêu cầu Range (Safari/iPad bắt buộc khi phát audio/video qua Service Worker).
// Vỏ app (HTML, JS, hình của app): HTML và tệp không kèm ?v= thì lấy mạng trước + bắt hỏi lại máy chủ; .js?v=<băm> (vite.config.js gắn
// lúc build) thì lấy trong máy trước. Cất bản sao để mất mạng vẫn mở được app. Font Google: cất 1 lần, lần sau lấy trong máy.
// Cloudflare Access đứng trước cả trang: hết phiên đăng nhập thì máy chủ chuyển hướng sang trang đăng nhập (khác nguồn) — mở trang thì
// để trình duyệt đi theo (đăng nhập lại), còn tệp lẻ thì coi như lỗi mạng (dùng bản trong máy nếu có).
importScripts('/cau-hinh.js');
const KHO_VO = 'pu3-vo';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.pathname.startsWith('/api/') || u.pathname.startsWith('/cdn-cgi/')) return;
  if (u.origin === location.origin) {
    if (u.search === '?goc') return;                       // tai-ve.js tự tải + cất (để bắt được lỗi máy hết chỗ)
    const p = decodeURIComponent(u.pathname.slice(1));
    e.respondWith(laTepDrive(p) ? tra(p, r.headers.get('range')) : vo(r, u));
  } else if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(font(r));
});

// Cache Storage hỏng / hết chỗ thì vẫn lấy mạng như thường — vỏ app không bao giờ phụ thuộc vào kho
const moKho = () => caches.open(KHO_VO).catch(() => null);
async function vo(r, u) {
  // Cloudflare Pages bỏ đuôi .html (308 /x.html → /x): trang (mở hoặc main.js tải trước) xin thẳng /x và cất 1 bản cho cả /x.html, /x
  // và mọi ?ve=… — không thì mất mạng mở link "/x.html" không thấy bản đã cất (02/10/2026)
  const kho = await moKho(), mo = r.mode === 'navigate', trang = mo || u.pathname.endsWith('.html');
  const duong = u.origin + u.pathname.replace(/\.html$/, ''), khoa = trang ? duong : r;
  if (kho && u.searchParams.has('v')) { const co = await kho.match(r); if (co) return co; }   // …js?v=<băm> (vite.config.js): không bao giờ đổi
  try {
    const m = await fetch(trang ? duong + u.search : r, { cache: 'no-cache', redirect: 'manual' });   // có bản trong cache HTTP thì máy chủ chỉ trả 304
    if (m.type === 'opaqueredirect') {                     // hết phiên Cloudflare Access
      if (mo) return m;                                    // trình duyệt đi theo → trang đăng nhập Gmail
      throw new Error('het-phien');
    }
    if (m.ok && kho) await kho.put(khoa, m.clone()).catch(() => {});
    return m;
  } catch (err) {
    return (kho && await kho.match(khoa)) || Response.error();
  }
}
async function font(r) {
  const kho = await moKho(), co = kho && await kho.match(r);
  if (co) return co;
  const m = await fetch(r);
  if (kho && (m.ok || m.type === 'opaque')) await kho.put(r, m.clone()).catch(() => {});
  return m;
}

const dangTai = new Map();                  // nhiều yêu cầu cùng 1 tệp chỉ tải 1 lần
async function layBlob(p) {
  const kho = await caches.open(KHO_TEP), co = await kho.match(khoaTep(p));
  if (co) return co.blob();
  if (!dangTai.has(p)) dangTai.set(p, (async () => {
    const m = await fetch(urlTep(p), { redirect: 'manual' });
    if (!m.ok) throw new Error(m.type === 'opaqueredirect' ? 'Hết phiên đăng nhập — mở lại app' : `HTTP ${m.status}: ${p}`);
    const blob = await m.blob();
    await kho.put(khoaTep(p), new Response(blob, { headers: { 'Content-Type': blob.type, 'X-Kb': String(Math.round(blob.size / 1024)) } })).catch(() => {});   // máy hết chỗ: vẫn trả tệp vừa tải
    return blob;
  })().finally(() => dangTai.delete(p)));
  return dangTai.get(p);
}
async function tra(p, range) {
  try {
    const b = await layBlob(p), n = b.size, h = { 'Content-Type': b.type, 'Accept-Ranges': 'bytes' };
    const m = range && /bytes=(\d*)-(\d*)/.exec(range);
    if (m && (m[1] || m[2])) {
      const dau = m[1] ? +m[1] : Math.max(0, n - +m[2]);
      const cuoi = m[1] && m[2] ? Math.min(+m[2], n - 1) : n - 1;
      if (dau >= n) return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${n}` } });
      return new Response(b.slice(dau, cuoi + 1), { status: 206, headers: { ...h, 'Content-Range': `bytes ${dau}-${cuoi}/${n}`, 'Content-Length': String(cuoi - dau + 1) } });
    }
    return new Response(b, { headers: { ...h, 'Content-Length': String(n) } });
  } catch (err) {
    return new Response(String(err.message || err), { status: 504 });
  }
}
