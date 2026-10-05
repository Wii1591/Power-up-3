// Thử bản web Power Up 3 trên máy: wrangler pages dev (dist + functions như Cloudflare thật, không có Access) + Chrome headless TẮT TIẾNG,
// NGÓN TAY giả + chính sách tự phát thật (như iPad — xem bẫy level 4: chuột + no-user-gesture-required không bắt được lỗi chạm / tiếng).
// /api/tien-do do Chrome thử tự trả (CDP Fetch, "D1 giả" giữ trong bộ nhớ, bản mới hơn mới ghi — như câu SQL trong functions/api/tien-do.js):
//  1. mở thẳng trang sách khi máy chưa có SW → về màn đầu bật SW + đồng bộ → tự quay lại trang sách
//  2. màn đầu → chạm "Học sách" → trang hiện ảnh (qua SW) → chạm nút nghe → tiếng chạy
//  2b. chạm biểu tượng phim → video phát (qua SW, có Range)
//  3. giải bài trang 12 → tiến độ lên D1 giả; xoá sạch máy (như máy mới) → màn đầu kéo tiến độ về
//  4. Tải hết → tắt máy chủ (mất mạng) → mở lại sách: trang xa + tiếng + video vẫn chạy từ máy
// Chạy (thư mục repo): python tools/len-cloudflare.py thu && node tools/thu/thu-web.mjs <thư mục ảnh>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const cho = ms => new Promise(r => setTimeout(r, ms)), RA = process.argv[2] || 'C:/t-pu3-anh', CONG = 8798, CDP = 9351;
const HO_SO = process.env.HO_SO || 'C:\\t-pu3w' + Date.now().toString(36);   // hồ sơ Chrome mới = máy mới; đường dẫn NGẮN (Cache Storage hỏng với đường dẫn dài)
mkdirSync(RA, { recursive: true });
const U = `http://127.0.0.1:${CONG}`;
const gas = spawn(`npx --yes wrangler@4 pages dev dist --port ${CONG}`, { cwd: 'C:/Users/Administrator/Downloads/Tieng Anh/Ban web iPad/power-up-3-web', shell: true });
const tatMayChu = () => spawn('taskkill', ['/pid', String(gas.pid), '/t', '/f']);
for (let i = 0; i < 240; i++) { await cho(500); try { if ((await fetch(`${U}/_dm.json`)).ok) break; } catch {} }
const supa = {};                                      // D1 giả: khoá → [giá trị, giờ sửa]
function supaGia({ requestId, request }) {
  let ra;
  if (request.method === 'POST') {
    const du = JSON.parse(request.postData || '{}').du_lieu || {};
    let ghi = 0;
    for (const [k, [v, t]] of Object.entries(du)) if (k.startsWith('pu3-') && !(supa[k]?.[1] >= +t)) { supa[k] = [String(v), +t]; ghi++; }
    ra = { ok: true, ghi };
  } else ra = { ok: true, du_lieu: supa };
  goi('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(ra)).toString('base64') });
}
const cr = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--mute-audio', `--remote-debugging-port=${CDP}`, '--user-data-dir=' + HO_SO,
  '--autoplay-policy=document-user-activation-required', '--window-size=1180,820', 'about:blank'], { stdio: 'ignore' });
let ws; for (let i = 0; i < 160 && !ws; i++) { await cho(250); try { ws = (await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} }
const so = new WebSocket(ws); await new Promise(r => so.onopen = r);
let id = 0, giaiDoan = 'mạng'; const cb = new Map(), loi = [];
so.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Fetch.requestPaused') return supaGia(m.params); if (cb.has(m.id)) { cb.get(m.id)(m.result || {}); cb.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') loi.push(`[${giaiDoan}] ` + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') loi.push(`[${giaiDoan}] console: ` + m.params.args.map(a => a.value ?? a.description).join(' ')); };
const goi = (method, params = {}) => new Promise(r => { const n = ++id; cb.set(n, r); so.send(JSON.stringify({ id: n, method, params })); });
const js = async e => (await goi('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const chup = async ten => { const a = await goi('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(`${RA}/${ten}.jpg`, Buffer.from(a.data, 'base64')); };
const doi = async (dk, ms = 30000) => { for (let t = 0; t < ms; t += 250) { if (await js(dk).catch(() => false)) return true; await cho(250); } return false; };
const ngon = (type, pts) => goi('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y, id: 1 })) });
const tam = async sel => JSON.parse(await js(`(() => { const r = document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return r ? JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]) : 'null'; })()`));
const cham = async sel => { const p = await tam(sel); if (!p) return false; await ngon('touchStart', [p]); await cho(60); await ngon('touchEnd', []); await cho(300); return true; };
const hong = `performance.getEntriesByType('resource').filter(e => e.responseStatus >= 400).map(e => e.responseStatus + ' ' + decodeURIComponent(e.name.replace(location.origin, '')))`;
const anhTrang = p => `[...document.querySelectorAll('#san .trang[data-p="${p}"] img')].some(i => i.complete && i.naturalWidth > 0)`;
const sachSan = `document.readyState === 'complete' && typeof moTrang === 'function' && !!navigator.serviceWorker.controller`;
const tieng = `!am.paused && am.currentTime > 1`;
const video = `document.getElementById('hop-video').open && !vid.paused && vid.currentTime > 1 && vid.videoWidth > 0`;
const kq = {};
try {
  await goi('Runtime.enable'); await goi('Page.enable');
  await goi('Fetch.enable', { patterns: [{ urlPattern: '*/api/tien-do*' }] });
  await goi('Emulation.setDeviceMetricsOverride', { width: 1180, height: 820, deviceScaleFactor: 1, mobile: true });   // iPad Air ngang
  await goi('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  // 1. máy mới mở thẳng trang sách → về màn đầu bật SW → tự quay lại trang sách
  await goi('Page.navigate', { url: `${U}/Hoc-Power-Up-3.html` });
  kq.lanDauVeSach = await doi(`location.pathname.startsWith('/Hoc-Power-Up-3') && ${sachSan}`, 60000);
  if (!kq.lanDauVeSach) kq.buoc1 = await js(`location.href + ' | ' + (document.getElementById('trang-thai')?.textContent || '') + ' | sw=' + !!navigator.serviceWorker.controller`);
  // 2. màn đầu → Học sách → trang hiện ảnh → mở trang 4 (có cả bài nghe lẫn video) → chạm nút nghe
  await goi('Page.navigate', { url: `${U}/` });
  kq.manDau = await doi(`!document.getElementById('vao').hidden && /đồng bộ lúc/.test(document.getElementById('trang-thai').textContent)`, 30000);
  await doi(`/Đã có/.test(document.getElementById('kho-chu').textContent)`, 20000);
  kq.kho = await js(`document.getElementById('kho-chu').textContent`);
  await chup('1-man-dau');
  let t0 = Date.now();
  await cham('#vao a');
  kq.moSach = await doi(`${sachSan} && [...document.querySelectorAll('#san .trang img')].some(i => i.complete && i.naturalWidth > 0)`, 60000) && (Date.now() - t0) / 1000 + ' s';
  await js(`moTrang(4); 1`); await doi(anhTrang(4), 20000); await cho(600);
  await chup('2-sach-trang-4');
  kq.nutNghe = await js(`document.querySelectorAll('.nghe').length`);
  t0 = Date.now();
  await cham('#san .trang[data-p="4"] .nghe');
  kq.tiengChay = await doi(tieng, 30000) && (Date.now() - t0) / 1000 + ' s';
  await js(`am.pause(); 1`);
  // 2b. chạm biểu tượng phim trang 4 → video qua SW phát được (Range)
  t0 = Date.now();
  await cham('#san .trang[data-p="4"] .ten-bai.phim');
  kq.videoChay = await doi(video, 60000) && (Date.now() - t0) / 1000 + ' s';
  await chup('2b-video'); await js(`document.getElementById('hop-video').close(); 1`);
  // 3. bài tập → D1 giả → máy mới kéo về
  await js(`moTrang(12); 1`); await cho(600);
  kq.giaiTrang12 = await js(`JSON.stringify(BT.thuGiai(12))`);
  await cho(5500);                                     // may-chu.js đẩy sau 4 giây
  kq.supaCoBaiTap = String(supa['pu3-bt']?.[0] || '').includes('"12"');
  kq.hongMang = await js(hong);
  await goi('Page.navigate', { url: `${U}/` });
  await doi(`!document.getElementById('vao').hidden`, 30000);
  await js(`localStorage.clear(); 1`);   // máy mới
  await goi('Page.navigate', { url: `${U}/?lai=1` });
  await doi(`/đồng bộ lúc/.test(document.getElementById('trang-thai').textContent)`, 30000);
  kq.mayMoiCoBaiTap = await js(`!!JSON.parse(localStorage.getItem('pu3-bt') || '{}')[12]`);
  // 4. Tải hết → mất mạng → sách vẫn chạy
  await doi(`!document.getElementById('tai-het').disabled`, 30000);
  t0 = Date.now();
  await cham('#tai-het');
  kq.taiHet = await doi(`/Đã tải đủ/.test(document.getElementById('tai-het').textContent)`, 300000) && (Date.now() - t0) / 1000 + ' s';
  kq.khoSauTai = await js(`document.getElementById('kho-chu').textContent`);
  await chup('3-tai-het');
  tatMayChu(); giaiDoan = 'mất mạng'; await cho(2500);
  await goi('Page.navigate', { url: `${U}/Hoc-Power-Up-3.html` });
  kq.matMangMoSach = await doi(`${sachSan} && [...document.querySelectorAll("#san .trang img")].some(i => i.complete && i.naturalWidth > 0)`, 30000);   // mở lại đúng trang đang học (pu3-trang đã đồng bộ)
  await js(`moTrang(97); 1`);
  kq.matMangTrangXa = await doi(anhTrang(97), 20000);
  await cho(800);
  const coNut = await cham('#san .trang[data-p="97"] .nghe');
  kq.matMangTieng = coNut && await doi(tieng, 20000);
  await chup('4-mat-mang-trang-97');
  await js(`am.pause(); moTrang(96); 1`); await cho(800);   // video trang 96 đã nằm trong "Tải hết"
  kq.matMangVideo = await cham('#san .trang[data-p="96"] .ten-bai.phim') && await doi(video, 20000);
} catch (e) { loi.push('script: ' + e.message); }
finally {
  if (kq.hongMang) kq.hongMang = [kq.hongMang.length + ' hỏng', ...kq.hongMang.slice(0, 6)];
  const dat = kq.lanDauVeSach && kq.manDau && kq.moSach && kq.tiengChay && kq.supaCoBaiTap && kq.mayMoiCoBaiTap && kq.taiHet && kq.matMangMoSach && kq.matMangTrangXa && kq.matMangTieng && kq.videoChay && kq.matMangVideo && !loi.length;
  console.log(JSON.stringify(kq, null, 1)); console.log('lỗi:', loi.length ? loi.slice(0, 10) : 'không'); console.log(dat ? 'ĐẠT' : 'HỎNG');
  so.close(); cr.kill(); tatMayChu();
  if (!process.env.HO_SO) { await cho(1500); try { rmSync(HO_SO, { recursive: true, force: true }); } catch {} }
  process.exit(dat ? 0 : 1);
}
