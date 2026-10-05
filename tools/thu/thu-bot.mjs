// Thử bot Will (public/bot.js + functions/api/bot.js) trên máy: wrangler pages dev (Whisper + Aura của Workers AI chạy THẬT, tính tiền vài xu)
// + "Claude giả" (máy chủ node trả lời mẫu, ANTHROPIC_BASE_URL) + Chrome headless TẮT TIẾNG, ngón tay giả, MICRO GIẢ phát tệp WAV
// "I can jump." (giọng Windows SAPI, lặp liên tục) — như bé nói vào iPad.
//  1. mở sách trang 8–9 (Unit 1) → chạm 🐢 → Will chào (chữ + tiếng mp3 giải mã được) — Claude giả nhận đúng dàn ý Unit 1, chưa có lượt của con
//  2. giữ 🎤 2,4 giây rồi thả → Whisper nghe ra "jump" → Claude giả nhận "Child: …jump…" → Will trả lời, có 💡 gợi ý + câu tiếng Việt;
//     giáo án: lời mở đầu kể đúng loại bài trang 8–9 (truyện + ngữ pháp); chấm: jump đúng, mẫu câu đầu Unit 1 bí, ⭐ (mục bịa bị lọc)
//  2b. ↻ buổi mới → Claude giả nhận tiến độ ("needs practice: <mẫu câu đầu Unit 1>"); 📊 hiện bảng tiến độ Unit 1
//  3. đủ 10 lượt của con → máy chủ chèn lời dặn "session is over" → xong = true
//  4. nhật ký pu3-bot-nk có lượt của con + của Will; đóng khung thì tắt micro
// Chạy (thư mục repo): python tools/len-cloudflare.py thu && node tools/thu/thu-bot.mjs <thư mục ảnh>
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
const cho = ms => new Promise(r => setTimeout(r, ms)), RA = process.argv[2] || 'C:/t-pu3-bot', CONG = 8796, CLAUDE = 8797, CDP = 9352;
const HO_SO = 'C:\\t-pu3b' + Date.now().toString(36);
mkdirSync(RA, { recursive: true });
const WAV = `${RA}/be-noi.wav`;
if (!existsSync(WAV)) spawnSync('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
  `$s.SetOutputToWaveFile('${WAV}', (New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo 16000, ([System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen), ([System.Speech.AudioFormat.AudioChannel]::Mono))); ` +
  `$s.Rate = -2; $s.Speak("I can jump."); $s.Dispose()`], { stdio: 'inherit' });

const goiClaude = [];                                  // Claude giả: ghi lại yêu cầu, trả lời mẫu theo đúng khuôn JSON của bot.js
createServer((q, s) => {
  let b = ''; q.on('data', c => b += c); q.on('end', () => {
    const y = JSON.parse(b || '{}');
    if (!y.messages) { s.writeHead(404); return s.end(); }   // yêu cầu thăm dò (thân rỗng) — không phải lượt của bot
    goiClaude.push(y);
    const het = y.messages?.some(m => m.role === 'system'), lan = y.messages?.filter(m => m.role === 'user').length;
    const tl = het ? { viet: '', reply: 'Great job today! Goodbye!', goi_y: 'Bé có thể nói: Goodbye, Will!', xong: true }
      : lan === 1 ? { viet: '', reply: "Hello! I'm Will, your robot friend. What's this?", goi_y: 'Bé có thể nói: It\'s a jump.', xong: false }
      : { viet: 'Will hỏi cây bút màu gì. Bạn nói: It is brown nhé!', reply: "Great! It's a jump. What colour is it?", goi_y: "Bé có thể nói: It's brown.", xong: false,   // lượt 2 giả như con bí → có câu tiếng Việt
          dung: ['Jump', 'muc-bia'], bi: ["Which country are we in? — We're in …"], sao: true };   // 'Jump' (hoa) + mục bịa: máy chủ phải chuẩn hoá / lọc
    tl.dung ||= []; tl.bi ||= []; tl.sao ||= false;
    s.writeHead(200, { 'Content-Type': 'application/json', 'request-id': 'req_thu' });
    s.end(JSON.stringify({ id: 'msg_thu', type: 'message', role: 'assistant', model: y.model, content: [{ type: 'text', text: JSON.stringify(tl) }],
      stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } }));
  });
}).listen(CLAUDE);

const U = `http://127.0.0.1:${CONG}`;
const dev = spawn(`npx --yes wrangler@4 pages dev dist --port ${CONG} --binding ANTHROPIC_API_KEY=thu --binding ANTHROPIC_BASE_URL=http://127.0.0.1:${CLAUDE}`,
  { cwd: 'C:/Users/Administrator/Downloads/Tieng Anh/Ban web iPad/power-up-3-web', shell: true });
let nhatKyDev = ''; dev.stdout.on('data', d => nhatKyDev += d); dev.stderr.on('data', d => nhatKyDev += d);
const tatMayChu = () => spawn('taskkill', ['/pid', String(dev.pid), '/t', '/f']);
for (let i = 0; i < 240; i++) { await cho(500); try { if ((await fetch(`${U}/_dm.json`)).ok) break; } catch {} }

const cr = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--mute-audio', `--remote-debugging-port=${CDP}`, '--user-data-dir=' + HO_SO,
  '--autoplay-policy=document-user-activation-required', '--window-size=1180,820', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
  '--use-file-for-fake-audio-capture=' + WAV.replace(/\//g, '\\'), 'about:blank'], { stdio: 'ignore' });
let ws; for (let i = 0; i < 160 && !ws; i++) { await cho(250); try { ws = (await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} }
const so = new WebSocket(ws); await new Promise(r => so.onopen = r);
let id = 0; const cb = new Map(), loi = [];
const supaGia = ({ requestId, request }) => goi('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
  body: Buffer.from(JSON.stringify(request.method === 'POST' ? { ok: true, ghi: 0 } : { ok: true, du_lieu: {} })).toString('base64') });
so.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Fetch.requestPaused') return supaGia(m.params); if (cb.has(m.id)) { cb.get(m.id)(m.result || {}); cb.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') loi.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') loi.push('console: ' + m.params.args.map(a => a.value ?? a.description).join(' ')); };
const goi = (method, params = {}) => new Promise(r => { const n = ++id; cb.set(n, r); so.send(JSON.stringify({ id: n, method, params })); });
const js = async e => (await goi('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const chup = async ten => { const a = await goi('Page.captureScreenshot', { format: 'jpeg', quality: 75 }); writeFileSync(`${RA}/${ten}.jpg`, Buffer.from(a.data, 'base64')); };
const doi = async (dk, ms = 30000) => { for (let t = 0; t < ms; t += 250) { if (await js(dk).catch(() => false)) return true; await cho(250); } return false; };
const ngon = (type, pts) => goi('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y, id: 1 })) });
const tam = async sel => JSON.parse(await js(`(() => { const r = document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return r ? JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]) : 'null'; })()`));
const cham = async (sel, giu = 60) => { const p = await tam(sel); if (!p) return false; await ngon('touchStart', [p]); await cho(giu); await ngon('touchEnd', []); await cho(300); return true; };
const kq = {};
try {
  await goi('Runtime.enable'); await goi('Page.enable');
  await goi('Fetch.enable', { patterns: [{ urlPattern: '*/api/tien-do*' }] });
  await goi('Emulation.setDeviceMetricsOverride', { width: 1180, height: 820, deviceScaleFactor: 1, mobile: true });
  await goi('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await goi('Page.navigate', { url: `${U}/Hoc-Power-Up-3.html` });   // máy mới: về màn đầu bật SW rồi tự quay lại sách
  kq.moSach = await doi(`location.pathname.startsWith('/Hoc-Power-Up-3') && document.readyState === 'complete' && typeof moTrang === 'function' && !!document.getElementById('bot-mo')`, 60000);
  await js(`moTrang(9); 1`); await cho(800);
  // 1. Will chào
  let t0 = Date.now();
  await cham('#bot-mo');
  kq.chao = await doi(`document.querySelector('#bot-nk .will button')`, 30000) && (Date.now() - t0) / 1000 + ' s';   // 🔊 chỉ gắn khi mp3 giải mã được
  kq.chaoChu = await js(`document.querySelector('#bot-nk .will')?.textContent`);
  const c1 = goiClaude[0];
  kq.dan = !!c1 && c1.system.includes('Unit 1 — Practice time') && c1.system.includes("Which country are we in") && c1.messages.length === 1 && /page 8 and 9 open/.test(c1.messages[0].content);
  kq.mucNghi = c1?.output_config?.effort; kq.moHinh = c1?.model;
  kq.sonnetTatNghi = c1?.model === 'claude-sonnet-5-5' && c1?.thinking?.type === 'between_tools' && ['low', 'medium', 'high'].includes(c1?.output_config?.effort);
  await chup('1-will-chao');
  // 2. giữ 🎤 2,4 s
  await doi(`!document.getElementById('bot-noi').disabled`, 10000);
  t0 = Date.now();
  await cham('#bot-noi', 2400);
  kq.traLoi = await doi(`document.querySelectorAll('#bot-nk .will').length === 2 && document.querySelectorAll('#bot-nk .will button').length === 2`, 40000) && (Date.now() - Number(t0)) / 1000 + ' s';
  kq.beNoi = await js(`document.querySelector('#bot-nk .be')?.textContent`);
  kq.ngheRaJump = /jump/i.test(kq.beNoi || '') && /Child: .*jump/i.test(goiClaude[1]?.messages?.at(-1)?.content || '');
  kq.goiY = await js(`[...document.querySelectorAll('#bot-nk .goi-y')].length === 2`);
  kq.tiengViet = await js(`(() => { const w = document.querySelectorAll('#bot-nk .will'); return w.length === 2 && !w[0].querySelector('.vi') && /Will hỏi/.test(w[1].querySelector('.vi')?.textContent || ''); })()`);
  kq.ms = await js(`document.getElementById('bot').dataset.ms`);
  kq.giaoAn = /Lessons on these pages: .*\(Diversicus story\).*\(grammar box/.test(c1.messages[0].content) && /first session/.test(c1.messages[0].content);
  const MAU1 = "Which country are we in? — We're in …";
  kq.chamDiem = await js(`(() => { const k = Object.keys(localStorage).filter(k => k.startsWith('pu3-bot-tien-do-')), t = JSON.parse(localStorage.getItem(k[0]) || '{}'), m = t.muc || {};
    if (k.length !== 1 || localStorage.getItem('pu3-bot-tien-do')) return false;   // chỉ khoá riêng của máy này
    return m.jump?.[0] === 1 && m.jump?.[3] === 'Unit 1' && m[${JSON.stringify(MAU1)}]?.[1] === 1 && !m['muc-bia'] && !m.Jump && t.sao?.['Unit 1'] === 1 && t.buoi?.['Unit 1'] === 1
      && document.getElementById('bot-sao').textContent === '⭐ 1' && !!document.querySelector('#bot-nk .be .sao'); })()`);
  await chup('2-con-noi');
  // 2b. buổi mới (↻) → Will nhận tiến độ: mẫu câu đầu Unit 1 "needs practice"; 📊 cho bố mẹ
  const truoc = goiClaude.length;
  await cham('#bot-moi');
  await doi(`document.querySelectorAll('#bot-nk .will').length === 1`, 30000);
  const c3 = goiClaude[truoc];
  kq.nhoTienDo = !!c3 && c3.messages.length === 1 && c3.messages[0].content.includes('needs practice: ' + MAU1) && /confident: \(none\)/.test(c3.messages[0].content);
  await cham('#bot-xem');
  kq.bangTienDo = await js(`(() => { const t = document.getElementById('bot-td'); return !t.hidden && getComputedStyle(document.getElementById('bot-nk')).display === 'none' && /Unit 1/.test(t.textContent)
    && /2 buổi · ⭐ 1/.test(t.textContent) && /Đã nói được: jump ×1/.test(t.textContent) && /Cần luyện thêm: Which country/.test(t.textContent); })()`);
  await chup('3-tien-do');
  await cham('#bot-xem');
  // 2c. (Codex soát 04/10) tiến độ máy khác đồng bộ về → 📊 cộng cả hai máy, máy này không ghi vào khoá máy khác
  await js(`localStorage.setItem('pu3-bot-tien-do-khac', JSON.stringify({ muc: { jump: [5, 0, 1, 'Unit 1'] }, sao: { 'Unit 1': 2 }, buoi: { 'Unit 1': 1 } })); 1`);
  await cham('#bot-xem');
  kq.haiMay = await js(`/3 buổi · ⭐ 3/.test(document.getElementById('bot-td').textContent) && /jump ×6/.test(document.getElementById('bot-td').textContent)`);
  await cham('#bot-xem');
  // 2d. lật trang giữa buổi → Will vẫn nói về trang đầu buổi (ngữ cảnh + tiền tố cache không đổi)
  await js(`moTrang(30); 1`); await cho(500);
  let n0 = goiClaude.length;
  await cham('#bot-noi', 2400);
  await doi(`document.querySelectorAll('#bot-nk .will').length === 2`, 40000);
  kq.latTrang = goiClaude.length === n0 + 1 && /page 8 and 9 open/.test(goiClaude.at(-1).messages[0].content) && goiClaude.at(-1).system.includes('Unit 1 —');
  await js(`moTrang(9); 1`); await cho(500);
  // 2e. đang giữ 🎤 mà bấm ↻ (ngón khác) → đoạn ghi cũ bị bỏ, buổi mới chỉ có lời chào
  n0 = goiClaude.length;
  const pMic = await tam('#bot-noi');
  await ngon('touchStart', [pMic]); await cho(1200);
  await js(`document.getElementById('bot-moi').click(); 1`);
  await cho(300); await ngon('touchEnd', []);
  await doi(`document.querySelectorAll('#bot-nk .will').length === 1`, 30000);
  await cho(16000);                                      // quá mốc tự gửi 15 giây: mã cũ gửi đoạn ghi cũ vào buổi mới đúng lúc này
  kq.reTrongKhiGhi = goiClaude.length === n0 + 1 && goiClaude.at(-1).messages.length === 1 && !(await js(`!!document.querySelector('#bot-nk .be')`));
  // 2f. đóng khung lúc iPad còn đang hỏi quyền micro (+ bấm ↻ trong lúc chờ) → không còn luồng micro nào chạy, không gửi lời chào
  await cham('#bot-dong');
  await js(`(() => { const goc = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); window.luongMic = [];
    navigator.mediaDevices.getUserMedia = c => new Promise(r => { window.choQuyen = () => r(goc(c).then(s => (luongMic.push(s), s))); }); })(); 1`);
  n0 = goiClaude.length;
  await cham('#bot-mo'); await js(`document.getElementById('bot-moi').click(); 1`); await cham('#bot-dong');
  await js(`choQuyen(); 1`); await cho(2500);
  kq.dongKhiXinQuyen = goiClaude.length === n0 && await js(`luongMic.length === 1 && luongMic[0].getTracks().every(t => t.readyState === 'ended')`);
  await js(`delete navigator.mediaDevices.getUserMedia; 1`);   // trả lại hàm thật (prototype)
  await cham('#bot-mo');
  await doi(`document.querySelectorAll('#bot-nk .will').length === 1`, 30000); await cho(1500);
  kq.moLaiMotLoiChao = goiClaude.length === n0 + 1;
  // 3. đủ 10 lượt → chào tạm biệt
  const ls = [{ ai: 'will', reply: 'Hi', goi_y: '' }]; for (let i = 0; i < 9; i++) ls.push({ ai: 'be', chu: 'jump' }, { ai: 'will', reply: 'Great!', goi_y: '' });
  ls.push({ ai: 'be', chu: 'jump' });                 // lượt thứ 10 của con
  kq.hetBuoi = await js(`fetch('/api/bot', { method: 'POST', body: JSON.stringify({ trang: [9], lich_su: ${JSON.stringify(ls)}, am: null }) })
    .then(r => JSON.parse(decodeURIComponent(r.headers.get('X-Bot'))).xong)`) === true && goiClaude.at(-1).messages.at(-1).role === 'system';
  kq.chanSai = await js(`fetch('/api/bot', { method: 'POST', body: '{"trang":[999]}' }).then(r => r.status)`) === 400;
  // 4. nhật ký + đóng khung tắt micro
  kq.nhatKy = await js(`JSON.parse(localStorage.getItem('pu3-bot-nk') || '[]').map(x => x[2]).join(',')`) === 'will,be,will,will,be,will,will,will';
  await cham('#bot-dong');
  kq.dongKhung = await js(`!document.getElementById('bot').open && document.getElementById('bot-noi').disabled`);
} catch (e) { loi.push('script: ' + e.message); }
finally {
  const dat = kq.moSach && kq.chao && kq.dan && kq.sonnetTatNghi && kq.traLoi && kq.ngheRaJump && kq.goiY && kq.tiengViet && kq.giaoAn && kq.chamDiem && kq.nhoTienDo && kq.bangTienDo && kq.haiMay && kq.latTrang && kq.reTrongKhiGhi && kq.dongKhiXinQuyen && kq.moLaiMotLoiChao && kq.hetBuoi && kq.chanSai && kq.nhatKy && kq.dongKhung && !loi.length;
  writeFileSync(`${RA}/claude-gia.json`, JSON.stringify(goiClaude, null, 1));   // yêu cầu Claude giả nhận được (soát dàn ý)
  console.log(JSON.stringify(kq, null, 1)); console.log('lỗi:', loi.length ? loi.slice(0, 10) : 'không');
  if (!dat) console.log('--- wrangler ---\n' + nhatKyDev.split('\n').filter(l => /error|lỗi|✘|warn/i.test(l)).slice(-15).join('\n'));
  console.log(dat ? 'ĐẠT' : 'HỎNG');
  so.close(); cr.kill(); tatMayChu();
  await cho(1500); try { rmSync(HO_SO, { recursive: true, force: true }); } catch {}
  process.exit(dat ? 0 : 1);
}
