// 🐢 Nói với Will — bạn máy (AI) luyện nói tiếng Anh theo phần sách đang mở. Chỉ có ở bản web (cần /api/bot, functions/api/bot.js);
// tools/chep-sach.py chèn cuối trang sách. Giữ 🎤 để nói, thả ra là gửi: tiếng → WAV 16 kHz → /api/bot → Will trả lời bằng chữ + tiếng.
// iPad: AudioContext mở trong cú chạm nút 🐢 (Safari chỉ cho phát tiếng sau cú chạm), dùng chung cho thu và phát; đóng khung là tắt micro
// (mic mở thì iPad đổi chế độ âm thanh, tiếng sách nhỏ đi). Nhật ký buổi nói → localStorage pu3-bot-nk (may-chu.js đẩy lên D1).
// Tiến độ (trí nhớ của Will) → pu3-bot-tien-do = {muc: {mục: [lần nói đúng, lần bí, giờ, phần]}, sao: {phần: ⭐}, buoi: {phần: số buổi}}
// (cũng đồng bộ D1). Đầu buổi chụp lại {mục: [đúng, bí]} gửi kèm mọi lượt của buổi đó → Will ôn mục còn yếu trước. 📊 = bảng cho bố mẹ.
// Dùng biến của mã sách chung ($, am, phong, luot, iLuot, nho).
(() => {
  const NK = 'pu3-bot-nk', GIU_NK = 300, TD = 'pu3-bot-tien-do';
  const css = document.createElement('style');
  css.textContent = `
  #bot-mo { font-weight: 800; }
  #bot { position: fixed; z-index: 50; inset: 64px auto 96px 12px; margin: 0; padding: 0; width: min(380px, calc(100vw - 24px)); height: auto; flex-direction: column;   /* bên trái: đè cột mục lục, chừa tranh trang sách cho con nhìn */
         background: var(--the, #fff); border: 1px solid var(--vien, #d8e2e6); border-radius: 18px; box-shadow: 0 12px 40px #0003; overflow: hidden; }
  #bot[open] { display: flex; }
  #bot .dau { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #e9f7f2; border-bottom: 1px solid var(--vien, #d8e2e6); }
  #bot .dau img { width: 46px; height: 46px; border-radius: 50%; background: #fff; object-fit: cover; }
  #bot .dau b { display: block; font-size: 17px; } #bot .dau small { color: var(--mo, #5d6b73); }
  #bot .dau button { margin-left: auto; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--vien, #d8e2e6); background: #fff; font-size: 17px; }
  #bot .dau button + button { margin-left: 0; }
  #bot-nk { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  #bot-nk[hidden] { display: none; }                      /* display: flex ở trên đè thuộc tính hidden */
  #bot-nk .will, #bot-nk .be { max-width: 86%; padding: 9px 12px; border-radius: 16px; font-size: 18px; line-height: 1.35; }
  #bot-nk .will { align-self: flex-start; background: #e3f4f6; border-bottom-left-radius: 4px; }
  #bot-nk .be { align-self: flex-end; background: #fff1de; border-bottom-right-radius: 4px; }
  #bot-nk .will button { border: 0; background: none; font-size: 17px; padding: 0 0 0 6px; }
  #bot-nk .will .vi { display: block; margin-bottom: 4px; font-size: 15px; color: #0d6e79; font-style: italic; }
  #bot-nk .goi-y { align-self: flex-start; font-size: 13px; color: var(--mo, #5d6b73); margin: -4px 0 0 6px; }
  #bot-nk .bao { align-self: center; font-size: 14px; color: var(--mo, #5d6b73); text-align: center; }
  #bot .chan { padding: 10px; display: grid; place-items: center; gap: 4px; border-top: 1px solid var(--vien, #d8e2e6); }
  #bot-noi { width: 88px; height: 88px; border-radius: 50%; border: 0; background: var(--cam, #f28a1c); color: #fff; font-size: 38px;
             touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; box-shadow: 0 4px 12px #0003; }
  #bot-noi.dang { background: #e03a3a; transform: scale(1.12); box-shadow: 0 0 0 10px #e03a3a33; }
  #bot-noi:disabled { background: #b9c4c9; }
  #bot .chan small { color: var(--mo, #5d6b73); font-size: 13px; min-height: 1.2em; }
  #bot-sao { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; margin-left: auto; }
  #bot-sao.moi { animation: bot-sao .8s cubic-bezier(.34, 1.7, .6, 1); }
  @keyframes bot-sao { 40% { transform: scale(1.5); } }
  #bot .dau #bot-sao + button { margin-left: 0; }
  #bot-nk .be .sao { margin-left: 6px; }
  #bot-td { flex: 1; overflow-y: auto; padding: 12px 14px; font-size: 14px; line-height: 1.45; }
  #bot-td h4 { margin: 10px 0 2px; font-size: 16px; } #bot-td p { margin: 2px 0; }`;
  document.head.append(css);

  const mo = Object.assign(document.createElement('button'), { className: 'nut-nho', id: 'bot-mo', textContent: '🐢 Nói với Will', title: 'Nói chuyện tiếng Anh với Will — bạn máy (AI) — theo bài đang học. Cần mạng.' });
  $('viet').before(mo);
  // <dialog> mở không chặn (show): sách cho ngón tay bấm nút trong dialog cả lúc đang ✏️ Viết (chanTay)
  const hop = Object.assign(document.createElement('dialog'), { id: 'bot', ariaLabel: 'Nói chuyện với Will' });
  hop.innerHTML = `<div class="dau"><img src="will.png" alt=""><div><b>Will</b><small>bạn máy (AI), không phải người thật</small></div>
    <span id="bot-sao" title="Sao con được khi nói trọn câu đúng">⭐ 0</span>
    <button id="bot-xem" title="Tiến độ (cho bố mẹ)" aria-label="Tiến độ">📊</button>
    <button id="bot-moi" title="Buổi mới" aria-label="Buổi mới">↻</button><button id="bot-dong" title="Đóng" aria-label="Đóng">✕</button></div>
    <div id="bot-nk" aria-live="polite"></div><div id="bot-td" hidden></div>
    <div class="chan"><button id="bot-noi" aria-label="Giữ để nói" disabled>🎤</button><small id="bot-tt"></small></div>`;
  document.body.append(hop);
  const nk = $('bot-nk'), noi = $('bot-noi'), tt = s => { $('bot-tt').textContent = s; };

  let ctx = null, mic = null, khuc = null, phatDang = null, lichSu = [], cho = false, xong = false, buoi = 0, tdDau = {}, trangBuoi = [];

  // Tiến độ theo TỪNG MÁY: máy này chỉ ghi khoá pu3-bot-tien-do-<mã máy>, đọc = cộng mọi khoá pu3-bot-tien-do* (khoá của máy khác đồng bộ về
  // qua màn mở đầu). Một khoá chung thì đồng bộ "bên nào sửa sau thì giữ" làm 2 máy ghi đè bộ đếm của nhau (Codex soát 04/10/2026).
  // Mã máy ở pu3~bot-may (tiền tố pu3~ = không đồng bộ).
  const MAY = nho.doc('pu3~bot-may', '') || (() => { const m = Math.random().toString(36).slice(2, 8); nho.ghi('pu3~bot-may', m); return m; })();
  const TD_MAY = TD + '-' + MAY;
  const docMot = k => { try { const t = JSON.parse(localStorage.getItem(k) || '{}'); return { muc: t.muc || {}, sao: t.sao || {}, buoi: t.buoi || {} }; } catch { return { muc: {}, sao: {}, buoi: {} }; } };
  function docTd() {
    const t = { muc: {}, sao: {}, buoi: {} };
    let ks = []; try { ks = Object.keys(localStorage).filter(k => k === TD || k.startsWith(TD + '-')); } catch {}
    for (const x of ks.map(docMot)) {
      for (const [m, [d, b, g, ph]] of Object.entries(x.muc)) { const y = t.muc[m] ||= [0, 0, 0, ph]; y[0] += d; y[1] += b; if (g > y[2]) { y[2] = g; y[3] = ph; } }
      for (const n of ['sao', 'buoi']) for (const [ph, v] of Object.entries(x[n])) t[n][ph] = (t[n][ph] || 0) + v;
    }
    return t;
  }
  const tongSao = t => Object.values(t.sao).reduce((s, n) => s + n, 0);
  $('bot-sao').textContent = '⭐ ' + tongSao(docTd());
  function ghiTd(kq, moDau) {                              // cộng dồn kết quả chấm 1 lượt của Will (dung / bi / sao) vào tiến độ của máy này
    const t = docMot(TD_MAY), ph = kq.phan, luc = Date.now();
    for (const m of kq.dung || []) { const x = t.muc[m] ||= [0, 0, 0, ph]; x[0]++; x[2] = luc; x[3] = ph; }
    for (const m of kq.bi || []) { const x = t.muc[m] ||= [0, 0, 0, ph]; x[1]++; x[2] = luc; x[3] = ph; }
    if (kq.sao) t.sao[ph] = (t.sao[ph] || 0) + 1;
    if (moDau) t.buoi[ph] = (t.buoi[ph] || 0) + 1;
    nho.ghi(TD_MAY, JSON.stringify(t));
    const s = $('bot-sao'); s.textContent = '⭐ ' + tongSao(docTd());
    if (kq.sao) { s.classList.remove('moi'); void s.offsetWidth; s.classList.add('moi'); }
  }
  function veTd() {                                        // 📊 cho bố mẹ: mỗi phần sách — số buổi, ⭐, mục đã nói được / cần luyện thêm
    const t = docTd(), ds = {}, td = $('bot-td');
    for (const [m, [d, b, , ph]] of Object.entries(t.muc)) {
      const x = ds[ph] ||= { duoc: [], yeu: [] };
      if (d > b) x.duoc.push(`${m} ×${d}`); else if (b > 0) x.yeu.push(m);
    }
    const phan = [...new Set([...Object.keys(ds), ...Object.keys(t.buoi)])].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    const dong = (tag, chu) => Object.assign(document.createElement(tag), { textContent: chu });
    td.replaceChildren(dong('p', phan.length ? 'Will chấm sau mỗi câu con nói. "Đã nói được" = nói đúng nhiều hơn số lần bí.' : 'Chưa có buổi nói nào.'));
    for (const ph of phan) {
      const x = ds[ph] || { duoc: [], yeu: [] };
      td.append(dong('h4', ph), dong('p', `${t.buoi[ph] || 0} buổi · ⭐ ${t.sao[ph] || 0}`),
                dong('p', '✅ Đã nói được: ' + (x.duoc.join(', ') || '—')), dong('p', '🔁 Cần luyện thêm: ' + (x.yeu.join(', ') || '—')));
    }
  }
  $('bot-xem').onclick = () => { const xem = $('bot-td').hidden; if (xem) veTd(); $('bot-td').hidden = !xem; nk.hidden = xem; };

  function ghiNk(ai, chu) {                               // nhật ký cho bố mẹ xem lại (đồng bộ D1 qua may-chu.js)
    try {
      const ds = JSON.parse(nho.doc(NK, '[]'));
      ds.push([Date.now(), trangBuoi[0], ai, chu]);
      nho.ghi(NK, JSON.stringify(ds.slice(-GIU_NK)));
    } catch {}
  }
  const trangDangMo = () => phong ? [phong.p] : luot[iLuot];
  const cuon = () => { nk.scrollTop = nk.scrollHeight; };
  function them(lop, chu) { const d = document.createElement('div'); d.className = lop; d.textContent = chu; nk.append(d); cuon(); return d; }

  // Will nói: câu tiếng Việt (chỉ khi con bí) bằng giọng Việt có sẵn trong máy (iPad: Linh; Aura không đọc được tiếng Việt), xong mới phát tiếng Anh.
  // Máy không có giọng Việt thì chỉ hiện chữ. luotNoi: con bấm 🎤 / đóng khung giữa chừng thì bỏ phần còn lại.
  const giongVi = () => { try { return speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)); } catch { return null; } };
  try { speechSynthesis.getVoices(); } catch {}           // Chrome nạp danh sách giọng chậm: gọi sớm
  const noiViet = chu => new Promise(xong => {
    const g = chu && giongVi(); if (!g) return xong();
    const u = new SpeechSynthesisUtterance(chu); u.voice = g; u.lang = g.lang; u.rate = 0.95;
    u.onend = u.onerror = () => xong(); speechSynthesis.speak(u);
  });
  let luotNoi = 0;
  async function noiCau(viet, buf) {
    ctx.resume().catch(() => {});                          // iPad khoá màn hình / ra nền → AudioContext "interrupted"; 🔊 là cú chạm nên đánh thức được
    dungPhat(); const lan = luotNoi;
    await noiViet(viet);
    if (lan !== luotNoi || !buf) return;
    phatDang = ctx.createBufferSource(); phatDang.buffer = buf; phatDang.connect(ctx.destination); phatDang.start();
  }
  const dungPhat = () => { luotNoi++; try { speechSynthesis.cancel(); } catch {} try { phatDang?.stop(); } catch {} phatDang = null; };

  async function hoi(am) {                                 // gửi 1 lượt (am = WAV base64; null = mở đầu buổi) → Will trả lời
    cho = true; noi.disabled = true; tt('Will đang nghĩ…');
    const b = buoi;
    try {
      const r = await fetch('/api/bot', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ trang: trangBuoi, lich_su: lichSu, am, tien_do: tdDau }) });
      if (r.type === 'opaqueredirect') throw new Error('Hết phiên đăng nhập — đóng sách, mở lại app rồi đăng nhập');
      if (!r.headers.get('X-Bot')) throw new Error((await r.json().catch(() => ({}))).loi || `Lỗi máy chủ ${r.status}`);
      const kq = JSON.parse(decodeURIComponent(r.headers.get('X-Bot')));
      const buf = r.status === 200 ? await ctx.decodeAudioData(await r.arrayBuffer()).catch(() => null) : null;
      if (b !== buoi) return;                              // đã bấm Buổi mới / đóng trong lúc chờ
      ghiTd(kq, !lichSu.length);
      if (kq.be_noi !== null) {
        lichSu.push({ ai: 'be', chu: kq.be_noi }); ghiNk('be', kq.be_noi);
        const d = them('be', kq.be_noi || '…'); if (kq.sao) d.append(Object.assign(document.createElement('span'), { className: 'sao', textContent: '⭐' }));
      }
      lichSu.push({ ai: 'will', viet: kq.viet || '', reply: kq.reply, goi_y: kq.goi_y, dung: kq.dung, bi: kq.bi, sao: kq.sao });
      const d = them('will', kq.reply); ghiNk('will', (kq.viet ? kq.viet + ' — ' : '') + kq.reply);
      if (kq.viet) d.prepend(Object.assign(document.createElement('span'), { className: 'vi', textContent: kq.viet }));
      if (buf || kq.viet) { const n = Object.assign(document.createElement('button'), { textContent: '🔊', ariaLabel: 'Nghe lại' }); n.onclick = () => noiCau(kq.viet, buf); d.append(n); }
      if (hop.open) noiCau(kq.viet, buf);
      if (kq.goi_y) them('goi-y', '💡 ' + kq.goi_y);
      hop.dataset.ms = JSON.stringify(kq.ms);              // bài thử đọc thời gian từng bước
      xong = !!kq.xong;
      if (xong) them('bao', 'Hết buổi rồi 🎉 — bấm ↻ để nói tiếp');
    } catch (e) {
      if (b !== buoi) return;
      them('bao', navigator.onLine === false ? 'Cần mạng để nói chuyện với Will' : String(e.message || e));
    } finally {
      if (b === buoi) { cho = false; noi.disabled = xong || !mic; tt(xong ? '' : 'Giữ 🎤 để nói'); }
    }
  }

  // Một lần xin micro dùng chung cho mọi lời gọi đang chờ (iPad còn đang hỏi quyền mà bấm ↻ / mở lại thì không mở thêm luồng);
  // xin xong mà khung đã đóng thì tắt luôn (Codex soát 04/10/2026: đóng lúc đang hỏi quyền → micro vẫn chạy).
  let xinMic = null, nutMic = [];
  async function batMic() {
    if (mic) return true;
    const s = await (xinMic ||= navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
      .catch(() => null).finally(() => { xinMic = null; }));
    if (!s) { them('bao', 'Chưa có micro — cho phép app dùng micro (Cài đặt iPad → Safari → Micrô) rồi bấm ↻'); return false; }
    if (mic) return true;                                  // lời gọi khác cùng chờ đã gắn xong
    if (!hop.open) { s.getTracks().forEach(t => t.stop()); return false; }
    mic = s;
    const nguon = ctx.createMediaStreamSource(mic), xl = ctx.createScriptProcessor(4096, 1, 1), cam = ctx.createGain();
    // ponytail: ScriptProcessor đã cũ nhưng Safari/Chrome vẫn chạy và không cần tệp worklet riêng; đổi sang AudioWorklet nếu trình duyệt bỏ
    xl.onaudioprocess = e => { if (khuc) khuc.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    cam.gain.value = 0; nguon.connect(xl); xl.connect(cam); cam.connect(ctx.destination);   // phải nối ra loa thì Chrome mới chạy xl (âm lượng 0)
    nutMic = [nguon, xl, cam];
    return true;
  }
  const tatMic = () => { mic?.getTracks().forEach(t => t.stop()); mic = null; nutMic.forEach(n => n.disconnect()); nutMic = []; };

  // Float32 ở tần số `tu` → WAV PCM 16 bit 16 kHz mono (base64); null nếu quá ngắn / quá nhỏ (Whisper nghe im lặng hay bịa câu)
  function wav16k(ds, tu) {
    const n = ds.reduce((s, k) => s + k.length, 0), x = new Float32Array(n);
    let o = 0; for (const k of ds) { x.set(k, o); o += k.length; }
    if (n < tu * 0.4) return 'ngan';
    if (Math.sqrt(x.reduce((s, v) => s + v * v, 0) / n) < 0.006) return 'nho';
    const r = tu / 16000, m = Math.floor(n / r), b = new DataView(new ArrayBuffer(44 + m * 2));
    for (let i = 0; i < m; i++) {                          // trung bình các mẫu rơi vào ô i = lọc thấp thô, đủ cho giọng nói
      const a = Math.floor(i * r), c = Math.max(a + 1, Math.floor((i + 1) * r));
      let s = 0; for (let j = a; j < c; j++) s += x[j];
      b.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s / (c - a))) * 0x7fff, true);
    }
    const chu = (i, s) => [...s].forEach((ch, k) => b.setUint8(i + k, ch.charCodeAt(0)));
    chu(0, 'RIFF'); b.setUint32(4, 36 + m * 2, true); chu(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
    b.setUint32(24, 16000, true); b.setUint32(28, 32000, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); chu(36, 'data'); b.setUint32(40, m * 2, true);
    const u = new Uint8Array(b.buffer); let bin = '';
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  let henDung = 0;
  noi.addEventListener('pointerdown', e => {
    if (noi.disabled || khuc) return;
    noi.setPointerCapture(e.pointerId); ctx.resume(); dungPhat();
    khuc = []; noi.classList.add('dang'); tt('Đang nghe… thả ra khi nói xong');
    henDung = setTimeout(thaNut, 15000);                   // giữ quá 15 giây thì tự gửi
  });
  function thaNut() {
    clearTimeout(henDung);
    if (!khuc) return;
    const ds = khuc; khuc = null; noi.classList.remove('dang');
    const am = wav16k(ds, ctx.sampleRate);
    if (am === 'ngan') return tt('Giữ nút lâu hơn chút, nói xong mới thả nhé');
    if (am === 'nho') return tt('Will chưa nghe thấy — con nói to hơn nhé');
    hoi(am);
  }
  ['pointerup', 'pointercancel'].forEach(t => noi.addEventListener(t, thaNut));
  const boGhi = () => { clearTimeout(henDung); khuc = null; noi.classList.remove('dang'); };   // đang giữ 🎤 mà bấm ↻ / ✕ → bỏ đoạn đang ghi

  async function batDau() {                                // buổi mới: xoá khung, Will chào trước (kèm câu "I'm Will, your robot friend")
    const b = ++buoi; lichSu = []; xong = false; boGhi(); nk.replaceChildren(); dungPhat(); nk.hidden = false; $('bot-td').hidden = true;
    // bản chụp đầu buổi, giữ nguyên cả buổi: trang (lật trang giữa buổi không đổi ngữ cảnh của Will — muốn bài khác thì ↻) + tiến độ (cache)
    trangBuoi = trangDangMo().slice();
    tdDau = Object.fromEntries(Object.entries(docTd().muc).map(([m, x]) => [m, x.slice(0, 2)]));
    them('bao', `Will là bạn máy (AI) — đang nói về ${trangBuoi.map(soSach).join(', ')} (sang bài khác thì bấm ↻). Giữ 🎤 để nói tiếng Anh với Will.`);
    if (!mic && !await batMic()) return;
    if (b !== buoi || !hop.open) return;                   // trong lúc chờ quyền micro đã bấm ↻ lần nữa / đóng khung
    hoi(null);
  }
  mo.onclick = () => {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume(); am.pause();
    try { speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })); } catch {}   // iPad chỉ cho giọng Việt nói sau lần đầu gọi trong cú chạm
    if (!hop.open) hop.show();
    if (!lichSu.length || xong) batDau(); else if (!mic) batMic().then(ok => { noi.disabled = !ok || cho || xong; });
  };
  $('bot-moi').onclick = () => { ctx.resume(); batDau(); };
  $('bot-dong').onclick = () => { hop.close(); dungPhat(); boGhi(); tatMic(); noi.disabled = true; };
})();
