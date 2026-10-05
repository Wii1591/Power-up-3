// Máy bài tập sách Power Up 3 — đặc tả _app/ho-so/dac-ta-may-bai-tap.md. Vẽ Ô BÀI TẬP chạm được đè lên trang theo window.PU_BT (_app/bai_tap.js, cấu trúc ở
// _app/ho-so/huong-dan-noi-dung.md mục 2–3): so · tich · tich-x · khoanh · viet · noi · duong · dan · to · ve · nghe. Chấm NGAY từng ô (đúng: xanh + "ting"; sai: rung đỏ +
// "bụp" rồi trả về trống — riêng ô viết giữ chữ cho bé sửa như puzzle5); xong 1 ô bài tập: reo + sao bung; xong mọi ô bài tập của 1 bài: ★ dán lên ô SỐ BÀI.
// Đầu trang: ✅ n/N (chạm = tới trang còn bài dở) · ↺ Làm lại · 📋 (iPad). Thanh bên PC / hộp 📋: "Trang này học gì" + 🔑 Đáp án + 📝 Lời nghe.
// Nhớ localStorage pu3-bt {trang: {id ô bài tập: trạng thái}} — ô có giá trị {v: {chỉ số ô: giá trị}}, nối {c: ['a|b']}, đường {n: số bước đã đi}; trang dựng lại thì đọc lại từ đây.
// Bẫy đã tránh: (1) mọi chỗ chạm được là <button> — #san bắt ngón tay để chụm / kéo (setPointerCapture) và chỉ bỏ qua button; (2) lớp .bt có z-index = nhóm tách biệt,
// mix-blend-mode không ăn xuống ảnh trang → màu tô nằm ở lớp riêng .bt-to KHÔNG z-index (như .kara); (3) ô đã xong khoá bằng pointer-events: none chứ không disabled
// (ngón tay xuyên xuống trang: vẫn chụm / kéo / chạm chữ karaoke); (4) tên lớp CSS đều có tiền tố — mã sách chung đã dùng .nghe .so .to .mau .viet.
// Dùng biến của mã sách chung: D, am, iBai, $, san, luot, iLuot, phong, batPhong, thuPhong, moTrang, trangDangMo, soSach, url, phat, TI_LE, chuaBut.
(() => {
  const DL = () => window.PU_BT?.trang || {};
  const GIAM = matchMedia('(prefers-reduced-motion: reduce)');
  const an = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pt = v => v * 100 + '%';
  const MAU = { red: '#e53935', blue: '#1e88e5', green: '#43a047', yellow: '#fdd835', orange: '#fb8c00', purple: '#8e24aa', pink: '#f06292', black: '#2b2b2b', brown: '#8d5a3b', grey: '#9e9e9e', white: '#ffffff' };
  const MAU_BUT = ['#e0457b', '#2f80ed', '#22a35a', '#f28a1c', '#8a4fd8', '#0aa5b5'];
  const KN = { 'tu-vung': 'Từ vựng', nghe: 'Nghe', noi: 'Nói', doc: 'Đọc', viet: 'Viết', 'ngu-phap': 'Ngữ pháp', chant: 'Bài vè', hat: 'Bài hát', truyen: 'Truyện', 'van-hoc': 'Văn học',
               clil: 'Liên môn', thi: 'Luyện thi', 'du-an': 'Dự án', video: 'Video', 'on-tap': 'Ôn tập' };
  const DAU = { v: '<svg class="dau" viewBox="0 0 24 24"><path d="M4.5 13.5 9.5 19.5 20 4.5"/></svg>', x: '<svg class="dau" viewBox="0 0 24 24"><path d="M5.5 5 18.5 19.5M18.5 5 5.5 19.5"/></svg>' };
  const dauTX = (w, v) => w.bieu ? `<span class="bt-bieu">${an(w.bieu[v === 'v' ? 0 : 1])}</span>` : DAU[v];   // ô tich-x: ✓ / ✗ hoặc 2 biểu tượng riêng (bieu)

  // ---------- bộ nhớ ----------
  let luu; try { luu = JSON.parse(localStorage.getItem('pu3-bt')); } catch {}
  if (!luu || typeof luu !== 'object') luu = {};
  let henGhi = 0;
  const ghi = () => { clearTimeout(henGhi); henGhi = 0; try { localStorage.setItem('pu3-bt', JSON.stringify(luu)); } catch {} };
  const luuTre = () => { clearTimeout(henGhi); henGhi = setTimeout(ghi, 300); };
  const ghiDo = () => { if (henGhi) ghi(); };
  addEventListener('pagehide', ghiDo); document.addEventListener('visibilitychange', () => { if (document.hidden) ghiDo(); });
  const tt = (p, id) => luu[p]?.[id] || {};               // trạng thái 1 ô bài tập (chỉ đọc)
  const ttGhi = (p, id) => (luu[p] ||= {})[id] ||= {};

  // ---------- chấm ----------
  const TICH = { tich: 1, khoanh: 1 };
  const gon = s => String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,!?;:]/g, '').replace(/[-\s]+/g, ' ').trimStart();   // bỏ hoa/thường, dấu câu, gộp dấu cách, ’ = '
  const khop = (x, v) => [].concat(x.da ?? []).find(a => gon(a).trimEnd() === gon(v).trimEnd());                                  // đáp án viết trùng chữ bé gõ
  const phaiLam = (w, x) => !x.mau && (TICH[w.kieu] ? x.da === true : x.da != null);                                            // ô phải đúng thì bài mới xong (mẫu, ô sai, ô tự do: không tính)
  const dungO = (w, x, v) => v != null && v !== '' && (w.kieu === 'viet' ? khop(x, v) != null : TICH[w.kieu] ? x.da === true : v === x.da);
  // ô viết cùng "nhom" (sơ đồ Venn, cặp chữ — anh duyệt 01/10/2026): mỗi ô nhận mọi từ của vùng nhưng 2 ô không được cùng 1 từ; ô mẫu và ô đứng trước thắng.
  // "toy box" = "box", "toy ship" = "ship" (cùng 1 thứ)
  const goc = s => gon(s ?? '').trimEnd().replace(/^toy /, '');
  const trungNhom = (w, i, vs) => { const x = w.o[i], g = goc(vs?.[i]);
    return w.kieu === 'viet' && x.nhom != null && !!g && w.o.some((y, k) => k !== i && y.nhom === x.nhom && (y.mau || k < i) && goc(y.mau ? [].concat(y.da)[0] : vs?.[k]) === g); };
  const dungI = (w, i, vs) => dungO(w, w.o[i], vs?.[i]) && !trungNhom(w, i, vs);           // đúng ô thứ i, xét cả luật không trùng trong nhóm
  function dem(w, s) {                                    // [số phần tử đã đúng, số phần tử phải làm] của 1 ô bài tập
    if (w.kieu === 'noi') { const mau = (w.mau || []).map(c => c.join('|')), can = (w.da || []).map(c => c.join('|')).filter(c => !mau.includes(c)); return [can.filter(c => (s.c || []).includes(c)).length, can.length]; }
    if (w.kieu === 'duong') { const m = w.mau || 0, n = (w.da || []).length; return [Math.max(0, Math.min(n, Math.max(m, s.n || 0)) - m), Math.max(0, n - m)]; }
    if (w.kieu === 've' || w.kieu === 'nghe') return [0, 0];
    const can = (w.o || []).map((x, i) => [x, i]).filter(([x]) => phaiLam(w, x));
    return [can.filter(([x, i]) => dungI(w, i, s.v)).length, can.length];
  }
  const coCham = w => dem(w, {})[1] > 0;
  const xongBt = (p, w) => { const [a, b] = dem(w, tt(p, w.id)); return b > 0 && a === b; };
  const cacBt = tr => (tr?.bai || []).flatMap(b => b.bt || []);
  function tongKet() {                                    // số ô bài tập đã xong / tổng cả sách
    let xong = 0, tong = 0; const tr = DL();
    for (const p in tr) for (const w of cacBt(tr[p])) if (coCham(w)) { tong++; if (xongBt(p, w)) xong++; }
    return { xong, tong };
  }

  // ---------- tiếng (WebAudio tự tạo, không cần tệp) ----------
  function keu(loai) {                                    // 'dung' ting · 'sai' bụp · 'reo' xong 1 ô bài tập · còn lại: tách nhẹ
    try {
      const ac = keu.ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime, not = (f, bd, dai, to = 0.12, f2) => { const o = ac.createOscillator(), g = ac.createGain(); o.connect(g).connect(ac.destination);
        o.frequency.setValueAtTime(f, t + bd); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + bd + dai);
        g.gain.setValueAtTime(to, t + bd); g.gain.exponentialRampToValueAtTime(0.001, t + bd + dai); o.start(t + bd); o.stop(t + bd + dai + 0.05); };
      if (loai === 'dung') { not(660, 0, 0.16); not(880, 0.11, 0.3); }
      else if (loai === 'sai') not(190, 0, 0.22, 0.2, 60);
      else if (loai === 'reo') [523, 659, 784, 1047].forEach((f, i) => not(f, 0.3 + i * 0.09, 0.34));   // sau tiếng "ting" của ô cuối
      else not(520, 0, 0.07, 0.06);
    } catch {}
  }

  // ---------- giao diện ----------
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
  .bt { position: absolute; inset: 0; pointer-events: none; z-index: 2; font: 800 12px/1 Nunito, "Segoe UI", system-ui, sans-serif; }
  .bt-to { position: absolute; inset: 0; pointer-events: none; }
  .bt-mau { position: absolute; mix-blend-mode: multiply; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; transition: background-color .2s; }
  body.dang-viet .bt, body.dang-viet .bt * { pointer-events: none !important; }
  body.dang-viet .bt-bang, body.dang-viet #bt-phim { display: none !important; }
  #san .trang { translate: 0 var(--bt-day, 0px); }
  .bt-o { position: absolute; display: grid; place-items: center; margin: 0; padding: 0; border: 0; background: none; border-radius: .35em; pointer-events: auto;
          font: inherit; font-size: 1em; color: #1d56b8; -webkit-tap-highlight-color: transparent; }
  @media (hover: hover) { .bt-o:hover { background: rgba(21, 151, 168, .13); box-shadow: 0 0 0 .1em rgba(21, 151, 168, .4); } }
  .bt-o.tieu { background: rgba(255, 190, 80, .3); box-shadow: 0 0 0 .2em #ff9f1c; }
  .bt-o.dung { color: #118a43; }
  .bt-o.moi { animation: bt-nay .45s cubic-bezier(.34, 1.6, .6, 1); }
  .bt-o.sai { background: rgba(255, 90, 90, .42); color: #c0182b; animation: bt-rung .5s; }
  .bt-o.khoa { pointer-events: none; }
  .bt-o.nhat { background: rgba(255, 255, 255, .62); }
  .bt-o.chi { animation: bt-chi .55s 3; }
  @keyframes bt-nay { 40% { transform: scale(1.22); } }
  @keyframes bt-rung { 20%, 60% { transform: translateX(-.45em); } 40%, 80% { transform: translateX(.45em); } }
  @keyframes bt-chi { 50% { background: rgba(255, 210, 63, .6); box-shadow: 0 0 0 .5em #ffc21a; } }
  @keyframes bt-nhay { 50% { box-shadow: 0 0 0 .42em rgba(255, 159, 28, .4); } }
  .bt-o.k-so::before, .bt-o.k-tich::before, .bt-o.k-tich-x::before { content: ''; position: absolute; inset: -.45em; }   /* ô vuông nhỏ: nới vùng chạm cho ngón tay */
  .bt .dau { width: 125%; height: 125%; overflow: visible; fill: none; stroke: #1b86d1; stroke-width: 3.3; stroke-linecap: round; stroke-linejoin: round; translate: 7% -9%; }
  .bt-o.sai .dau { stroke: #c0182b; }
  .bt-bieu { line-height: 1; font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; }
  .bt-o.k-tich .dau { opacity: 0; }
  .bt-o.k-tich.dung .dau { opacity: 1; }
  .bt-o.k-tich .dau path { stroke-dasharray: 27; stroke-dashoffset: 27; }
  .bt-o.k-tich.dung .dau path { stroke-dashoffset: 0; transition: stroke-dashoffset .32s ease-out; }
  .bt-o.k-khoanh::after { content: ''; position: absolute; inset: -16% -6%; border: .18em solid #e2452d; border-radius: 50%; opacity: 0; transform: rotate(-2deg) scale(.6);
                           transition: transform .28s cubic-bezier(.34, 1.6, .6, 1), opacity .12s; }
  .bt-o.k-khoanh.dung::after { opacity: 1; transform: rotate(-2deg); }
  .bt-o.k-viet { overflow: hidden; align-items: end; font-weight: 700; border-radius: .25em; }
  .bt-o.k-viet span { white-space: nowrap; line-height: 1.12; }
  .bt-o.k-noi.chon { background: rgba(255, 190, 80, .25); box-shadow: 0 0 0 .2em #ff9f1c; animation: bt-nhay 1s ease-in-out infinite; }
  .bt-net { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; fill: none; stroke: #0aa5b5; stroke-width: .34em;
            stroke-linecap: round; stroke-linejoin: round; opacity: .88; }
  .bt-to .bt-net { mix-blend-mode: multiply; opacity: .85; stroke: #16a7bb; stroke-width: .26em; }
  .bt-o.k-duong { border-radius: 45%; }
  .bt-o.k-duong.qua { box-shadow: 0 0 0 .14em #fff, 0 0 0 .36em #ffb300; }
  .bt-o.k-duong.cuoi { animation: bt-nhay 1.2s ease-in-out infinite; }
  .bt-the { background: #fff; border: .1em solid #1f9d4c; border-radius: .6em; padding: .16em .5em .2em; font-size: 1.3em; color: #1d2b36; white-space: nowrap; box-shadow: 0 .1em .3em rgba(0, 0, 0, .2); }
  .bt-o.sai .bt-the { border-color: #c0182b; color: #c0182b; }
  .bt-huy { position: absolute; left: 0; top: 0; translate: -30% -30%; width: 1.9em; height: 1.9em; display: grid; place-items: center; border-radius: 50%; background: #fff;
            box-shadow: 0 .08em .3em rgba(0, 0, 0, .3); font-style: normal; font-size: .95em; }
  .bt-huy.ok { color: #118a43; left: 50%; top: 50%; translate: -50% -50%; }
  .bt-huy.giua { left: 50%; top: 50%; translate: -50% -50%; }   /* 🎨 ô tô: góc trên-trái từng đè ô số bên cạnh (level 2 tr. 86, soát 03/10/2026) → đặt giữa hình */
  .bt-o.k-ve { width: 2.3em; height: 2.3em; translate: -70% -40%; border-radius: 50%; background: #fff; box-shadow: 0 .1em .35em rgba(0, 0, 0, .3); font-size: 1.05em; }
  .bt-o.k-ve::before { content: ''; position: absolute; inset: -.5em; }
  .bt-o.k-nghe.phat { background: rgba(255, 210, 63, .45); animation: bt-nhay 1s ease-in-out infinite; }
  .bt-sao { position: absolute; translate: -50% -50%; rotate: -14deg; scale: 0; font: 800 2.2em/1 Nunito, "Segoe UI", sans-serif; font-style: normal; color: #ffc21a; pointer-events: none;
            -webkit-text-stroke: .05em #fff; text-shadow: 0 .05em .12em rgba(0, 0, 0, .4); transition: scale .45s cubic-bezier(.34, 1.8, .6, 1); }
  .bt-sao.hien { scale: 1; }
  .bt-tia { position: absolute; translate: -50% -50%; font: 800 1.3em/1 Nunito, "Segoe UI", sans-serif; font-style: normal; color: #ffc21a; pointer-events: none; animation: bt-tia .85s ease-out forwards; }
  @keyframes bt-tia { from { transform: scale(.4); opacity: 1; } to { transform: translate(var(--x), var(--y)) scale(1.15) rotate(140deg); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .bt-o, .bt-o.moi, .bt-o.sai, .bt-o.chi, .bt-bang { animation: none !important; } .bt-o.k-khoanh::after, .bt-sao, .bt-o .dau path { transition: none !important; } }

  /* bảng nổi chọn số / màu / thẻ / ✓✗ */
  .bt-bang { position: absolute; z-index: 4; display: grid; grid-template-columns: repeat(var(--cot, 6), auto); gap: 6px; padding: 8px; background: var(--the); border: 2px solid var(--xanh);
             border-radius: 18px; box-shadow: 0 10px 28px rgba(0, 0, 0, .3); animation: bt-bung .16s ease-out; }
  .bt-bang[hidden] { display: none; }
  @keyframes bt-bung { from { transform: scale(.85); opacity: 0; } }
  .bt-bang button { min-width: 48px; height: 48px; padding: 0 10px; border: 0; border-radius: 12px; background: var(--xanh-nhat); color: #0a4f59; box-shadow: 0 3px 0 #b5dde2;
                    font: 800 22px/1 Nunito, "Segoe UI", system-ui, sans-serif; }
  .bt-bang button:active { transform: translateY(2px); box-shadow: 0 1px 0 #b5dde2; }
  .bt-bang button.mo { opacity: .35; }
  .bt-bang button.xoa { background: #ffe1e1; color: #b00020; box-shadow: 0 3px 0 #f0bcbc; }
  .bt-bang button.mau { width: 48px; padding: 0; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 0 2px #b9c6cb, 0 3px 6px rgba(0, 0, 0, .22); }
  .bt-bang button.the { padding: 0 16px; background: #fff; border: 2px solid #1f9d4c; color: #1d2b36; box-shadow: 0 3px 0 #bfe3cb; font-size: 20px; }
  .bt-bang button.bieu { font-size: 30px; }
  .bt-bang .dau { width: 30px; height: 30px; fill: none; stroke: #1b86d1; stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; }

  /* bàn phím chữ ở đáy màn hình (ô viết) */
  #bt-phim { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: none; flex-direction: column; gap: 6px; padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
             background: #f0f2f8ee; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); box-shadow: 0 -6px 20px #0002; user-select: none; -webkit-user-select: none; }
  #bt-phim.mo { display: flex; }
  #bt-phim .hang { display: flex; gap: 5px; justify-content: center; }
  #bt-phim button { flex: 1 1 0; max-width: 64px; min-width: 30px; height: clamp(44px, 7vw, 56px); padding: 0; border: 0; border-radius: 12px; background: #fff; box-shadow: 0 3px 0 #c9cfdd;
                    font: 800 clamp(18px, 3vw, 26px)/1 Nunito, "Segoe UI", system-ui, sans-serif; color: #1d2b36; touch-action: manipulation; }
  #bt-phim button:active { transform: translateY(2px); box-shadow: 0 1px 0 #c9cfdd; }
  #bt-phim button.cach { flex: 5 1 0; max-width: 300px; color: #8790a3; font-size: 15px; }
  #bt-phim button.xoa { max-width: 90px; background: #ffe1e1; color: #b00020; }
  #bt-phim button.ok { max-width: 90px; background: #d8f3e0; color: #118a43; }
  #bt-phim button.dong { max-width: 90px; background: #dfe6f5; }
  #bt-phim .bt-go { min-height: 1.3em; text-align: center; white-space: pre; font: 800 clamp(20px, 3.6vw, 30px)/1.3 Nunito, "Segoe UI", sans-serif; letter-spacing: .06em; color: #1d2b36; }
  #bt-phim .bt-go.goi { font: 700 14px/2.4 Nunito, "Segoe UI", sans-serif; letter-spacing: 0; color: #5d6479; }
  #bt-phim .bt-go.sai { color: #c0182b; }

  /* nút đầu trang + bảng "Trang này học gì" */
  #bt-dem { font-variant-numeric: tabular-nums; }
  #bt-dem.moi { animation: bt-dem .8s cubic-bezier(.34, 1.7, .6, 1); }
  @keyframes bt-dem { 40% { transform: scale(1.3); background: #d8f3e0; } }
  #bt-lai.hoi { background: var(--cam-nhat); border-color: var(--cam); color: #8f4700; }
  #bt-hd { display: none; }
  @media (max-width: 1100px) { #bt-hd { display: inline-block; } }
  @media (max-width: 860px) { #bt-lai span { display: none; } }
  @media (min-width: 1101px) {                            /* thanh bên: mục lục cuộn riêng, hướng dẫn trang luôn thấy */
    aside { display: flex; flex-direction: column; overflow: hidden; }
    aside h2 { flex: none; }
    #muc-luc { flex: 0 1 auto; max-height: 36%; overflow-y: auto; }
    #huong-dan { flex: 1 1 0; min-height: 0; overflow-y: auto; }
  }
  #huong-dan, .bt-hop .hd { font-size: 13px; line-height: 1.4; overflow-wrap: anywhere; }
  .hd-trang h3 { margin: 8px 6px 6px; font-size: 13px; font-weight: 800; color: var(--xanh); }
  .hd-bai { margin: 0 2px 8px; padding: 8px; border: 1px solid var(--vien); border-radius: 12px; background: #fafdfd; }
  .hd-bai p { margin: 0 0 4px; }
  .hd-so { display: inline-grid; place-items: center; min-width: 20px; height: 20px; margin-right: 6px; border-radius: 6px; background: #5fbf3a; color: #fff; font-size: 12px; vertical-align: 1px; }
  .hd-mo { color: var(--mo); }
  .hd-kn { display: inline-block; margin-right: 6px; padding: 1px 8px; border-radius: 99px; background: var(--xanh-nhat); color: var(--xanh); font-size: 12px; font-weight: 700; }
  .hd-tt { font-size: 12px; font-weight: 800; color: #8f4700; white-space: nowrap; }
  .hd-tt.xong { color: #d48a00; }
  .hd-khong { font-size: 12px; font-style: italic; color: var(--mo); }
  .hd-bai details { margin-top: 6px; }
  .hd-bai summary { display: inline-block; padding: 4px 10px; border: 1px solid var(--vien); border-radius: 10px; background: var(--the); font-weight: 700; list-style: none; cursor: pointer; user-select: none; -webkit-user-select: none; }
  .hd-bai summary::-webkit-details-marker { display: none; }
  .hd-bai summary:hover { border-color: var(--xanh); color: var(--xanh); }
  .hd-bai details[open] > summary { background: var(--cam-nhat); border-color: var(--cam); color: #8f4700; }
  .hd-bai ul { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 0; padding: 0; list-style: none; }
  .hd-bai li.dong { flex-basis: 100%; }
  .hd-o { padding: 2px 7px; border: 1px solid var(--vien); border-radius: 8px; background: var(--the); font-size: 12px; text-align: left; }
  .hd-o:hover { border-color: var(--cam); }
  .hd-o i { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border-radius: 50%; box-shadow: 0 0 0 1px #9aa7ad; }
  .hd-o small { color: var(--mo); }
  .hd-phat { display: block; width: 100%; margin-top: 6px; padding: 5px 8px; border: 1px solid var(--xanh); border-radius: 10px; background: var(--xanh-nhat); color: var(--xanh); font-weight: 700; text-align: left; }
  .hd-loi { margin-top: 6px; }
  .hd-loi span { display: block; }
  .hd-loi b { display: block; margin-top: 5px; color: var(--xanh); }
  dialog.bt-hop { width: min(560px, 94vw); max-height: 86vh; background: var(--the); color: var(--chu); overflow: hidden; }
  dialog.bt-hop[open] { display: flex; flex-direction: column; }
  .bt-hop h2 { flex: none; margin: 0; padding: 14px 56px 10px 16px; border-bottom: 1px solid var(--vien); font-size: 16px; font-weight: 800; }
  .bt-hop .dong { background: var(--nen); }
  .bt-hop .hd { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px 10px 14px; font-size: 14px; -webkit-overflow-scrolling: touch; }
  .bt-hop .hd-o, .bt-hop .hd-kn, .bt-hop .hd-tt, .bt-hop .hd-khong { font-size: 13px; }` }));

  // ---------- bảng nổi ----------
  const bang = document.createElement('div'); bang.className = 'bt-bang'; bang.hidden = true; san.append(bang);
  let neo = null, khiChon = null, dsBang = [];            // ô đang mở bảng, hàm nhận giá trị chọn, các lựa chọn
  function dongBang() { if (!neo) return; neo.classList.remove('tieu'); neo = null; bang.hidden = true; }
  function datBang() {                                    // sát ô vừa chạm: dưới → trên → phải → trái, không tràn khung sách
    const s = san.getBoundingClientRect(), a = neo.getBoundingClientRect(), w = bang.offsetWidth, h = bang.offsetHeight, K = 8, kep = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    let x = (a.left + a.right) / 2 - w / 2, y = a.bottom + K;
    if (y + h > s.bottom - 4) y = a.top - K - h;
    if (y < s.top + 4) { y = (a.top + a.bottom) / 2 - h / 2; x = a.right + K; if (x + w > s.right - 4) x = a.left - K - w; }
    bang.style.left = kep(x, s.left + 4, s.right - w - 4) - s.left + 'px'; bang.style.top = kep(y, s.top + 4, s.bottom - h - 4) - s.top + 'px';
  }
  function moBang(e, ds, chon) {                          // ds = [{v, chu | html, lop, nen, ten, mo}]
    if (neo === e) return dongBang();
    dongBang(); dongPhim(); if (!ds.length) return;
    neo = e; khiChon = chon; dsBang = ds; e.classList.add('tieu');
    bang.style.setProperty('--cot', ds[0].lop === 'the' ? Math.min(2, ds.length) : Math.ceil(ds.length / Math.ceil(ds.length / 6)));
    bang.replaceChildren(...ds.map((d, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = (d.lop || '') + (d.mo ? ' mo' : ''); b.dataset.i = i; b.dataset.v = d.v ?? '';
      if (d.html) b.innerHTML = d.html; else b.textContent = d.chu ?? ''; if (d.nen) b.style.background = d.nen; if (d.ten) b.title = b.ariaLabel = d.ten; return b; }));
    bang.hidden = false; datBang();
  }
  bang.onclick = e => { const b = e.target.closest('button'); if (!b || !neo) return; const d = dsBang[+b.dataset.i], f = khiChon; dongBang(); f(d.v); };
  ['pointerdown', 'pointerup'].forEach(t => bang.addEventListener(t, e => e.stopPropagation()));   // chạm khe giữa các nút: khung sách không coi là kéo trang / chạm chữ karaoke
  document.addEventListener('pointerdown', e => { if (neo && !bang.contains(e.target) && !neo.contains(e.target)) dongBang(); }, true);

  // ---------- bàn phím chữ (ô viết) ----------
  const phim = document.createElement('div'); phim.id = 'bt-phim'; document.body.append(phim);
  let dang = null;                                        // { c, i }: ô viết đang gõ
  const oCua = (p, id, i) => san.querySelector(`.bt [data-k="${CSS.escape(`${p}|${id}|${i}`)}"]`);
  const chuDang = () => tt(dang.c.p, dang.c.w.id).v?.[dang.i] || '';
  const hienGo = () => { const v = chuDang(), n = phim.firstChild; n.textContent = v || (dang.c.w.phim === 'so' ? 'Gõ số vào ô' : 'Gõ chữ vào ô'); n.classList.toggle('goi', !v); };
  function dayTrang() {                                   // ô đang gõ bị bàn phím che → đẩy trang lên cho thấy ô
    const e = dang && oCua(dang.c.p, dang.c.w.id, dang.i), cu = parseFloat(san.style.getPropertyValue('--bt-day')) || 0;
    const thua = e ? e.getBoundingClientRect().bottom - cu + 14 - phim.getBoundingClientRect().top : 0;
    thua > 0 ? san.style.setProperty('--bt-day', -thua + 'px') : san.style.removeProperty('--bt-day');
  }
  function dongPhim() { if (!dang) return; const p = dang.c.p; dang = null; phim.classList.remove('mo'); dayTrang(); capNhat(p); }
  function moPhim(c, i) {
    const pCu = dang?.c.p; dongBang(); dang = { c, i };
    const k = c.w.phim || 'chu', nut_ = (ch, lop, ten, chu) => `<button type="button" data-c="${ch}"${lop ? ` class="${lop}"` : ''}${ten ? ` title="${ten}"` : ''}>${chu ?? ch}</button>`;
    phim.innerHTML = '<div class="bt-go"></div>' + [...(k !== 'chu' ? ['1234567890'] : []), ...(k !== 'so' ? ['abcdefghijklm', 'nopqrstuvwxyz'] : [])].map(h => `<div class="hang">${[...h].map(ch => nut_(ch)).join('')}</div>`).join('') +
      `<div class="hang">${k !== 'so' ? nut_("'") + nut_(' ', 'cach', 'Dấu cách', 'cách') : ''}${nut_('xoa', 'xoa', 'Xoá chữ', '⌫')}${nut_('ok', 'ok', 'Xong — chấm', '✔')}${nut_('dong', 'dong', 'Đóng bàn phím', '✕')}</div>`;
    phim.classList.add('mo'); hienGo(); capNhat(c.p); if (pCu != null && pCu !== c.p) capNhat(pCu);
    dayTrang();
  }
  function go(k) {                                        // 1 phím: chữ / số / ' / cách · 'xoa' · 'ok' (chấm ngay)
    const { c, i } = dang, da = [].concat(c.w.o[i].da).map(a => gon(a).trimEnd()), max = Math.max(...da.map(a => a.length));
    let v = chuDang();
    if (k === 'xoa') v = v.slice(0, -1);
    else if (k !== 'ok') { if (k === ' ' && (!v || v.endsWith(' '))) return; v = (v.length >= max ? v.slice(0, max - 1) : v) + k; }   // đầy chữ rồi: chữ mới thay chữ cuối
    const g = gon(v), gt = g.trimEnd(), dung = da.includes(gt) && !trungNhom(c.w, i, { ...(tt(c.p, c.w.id).v || {}), [i]: v });
    // chấm khi đủ chữ (luật puzzle5): dài ≥ đáp án ngắn nhất và không còn là phần đầu của đáp án dài hơn; phím ✔ = chấm luôn
    const du = k === 'ok' ? !!gt : k !== 'xoa' && gt.length >= Math.min(...da.map(a => a.length)) && !da.some(a => a.length > gt.length && a.startsWith(g));
    // đáp án ngắn là phần đầu của đáp án dài hơn ('no' / 'no she doesn't' — soát R2; 'a' / 'adjective' — R8, 01/10/2026): ô xanh nhưng CHƯA ting / nhảy ô, chờ bé gõ tiếp hoặc bấm ✔
    const cho = dung && k !== 'ok' && da.some(a => a.length > gt.length && a.startsWith(gt));   // cả 'a' / 'adjective' (p116)
    if (dung && !cho) keu('dung');
    doi(c, s => { s.v ||= {}; if (v) s.v[i] = v; else delete s.v[i]; });
    hienGo();
    const e = oCua(c.p, c.w.id, i), cu = dang;
    if (dung && !cho) { if (e) moi(e); setTimeout(() => { if (dang !== cu) return; const ke = c.w.o.findIndex((y, n) => phaiLam(c.w, y) && !dungI(c.w, n, tt(c.p, c.w.id).v)); ke < 0 ? dongPhim() : moPhim(c, ke); }, 600); }
    else if (du) { sai(e); phim.firstChild.classList.add('sai'); setTimeout(() => phim.firstChild?.classList.remove('sai'), 520); }
  }
  phim.addEventListener('pointerdown', e => e.preventDefault());    // không cướp focus
  phim.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !dang) return; b.dataset.c === 'dong' ? dongPhim() : go(b.dataset.c); });
  addEventListener('keydown', e => {                      // bắt trước mã sách chung (Space = phát / dừng, Esc = thu nhỏ, ← → lật trang)
    if (hop.open) return e.stopImmediatePropagation();
    if (e.key === 'Escape' && (neo || dang)) { dongBang(); dongPhim(); return e.stopImmediatePropagation(); }
    if (!dang || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, select, textarea')) return;
    const kieu = dang.c.w.phim || 'chu', c = e.key === '’' ? "'" : e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const k = c === 'Backspace' ? 'xoa' : c === 'Enter' ? 'ok' : (kieu !== 'so' && /^[a-z' ]$/.test(c)) || (kieu !== 'chu' && /^[0-9]$/.test(c)) ? c : c === ' ' ? '' : null;
    if (k == null) return;
    e.preventDefault(); e.stopImmediatePropagation(); if (k) go(k);
  }, true);

  // ---------- đổi trạng thái + chấm xong ----------
  const datLai = new Map();                               // trang đang hiện → các hàm vẽ lại theo trạng thái
  const moi = e => { e.classList.add('moi'); setTimeout(() => e.classList.remove('moi'), 600); };
  function sai(...es) { keu('sai'); es.forEach(e => { if (!e) return; e.classList.add('sai'); setTimeout(() => e.classList.remove('sai'), 520); }); }
  function capNhat(p) { datLai.get(String(p))?.forEach(f => f()); datDem(); datHD(); }
  function doi(c, sua) {                                  // đổi trạng thái 1 ô bài tập: ghi, vẽ lại, vừa xong thì mừng
    const truoc = xongBt(c.p, c.w); sua(ttGhi(c.p, c.w.id)); luuTre(); capNhat(c.p);
    if (!truoc && xongBt(c.p, c.w)) mung(c);
  }
  function datO(c, i, e, v, hien, tre = 0, giu = 520) {   // đặt giá trị v vào ô i: đúng → ghi + "ting"; sai → hiện (hien) rồi rung đỏ, trả về trống
    const co = c.s().v?.[i] != null;
    if (v != null && dungO(c.w, c.w.o[i], v)) { keu('dung'); moi(e); return doi(c, s => { (s.v ||= {})[i] = v; }); }
    if (co) doi(c, s => { delete s.v[i]; });
    if (v == null) return;
    hien?.(); setTimeout(() => sai(e), tre); setTimeout(c.dat, tre + giu);
  }
  function mung(c) {                                      // xong 1 ô bài tập: reo + sao bung ở chỗ dán ★
    keu('reo'); nutDem.classList.remove('moi'); void nutDem.offsetWidth; nutDem.classList.add('moi');
    const L = san.querySelector(`.bt[data-p="${c.p}"]`), v = L && choSao(c.p, DL()[c.p], c.j); if (!v || GIAM.matches) return;
    for (let n = 0; n < 9; n++) { const i = document.createElement('i'); i.className = 'bt-tia'; i.textContent = '★';
      i.style.cssText = `left:${pt(v[0])};top:${pt(v[1])};--x:${Math.cos(n * 0.7) * 4.2}em;--y:${Math.sin(n * 0.7) * 4.2}em`; L.append(i); setTimeout(() => i.remove(), 900); }
  }
  function choSao(p, tr, j) {                             // [x, y] chỗ dán ★ của bài thứ j: góc ô SỐ BÀI (D.bai), không khớp thì góc ô bài tập đầu tiên
    const o = (D.bai || []).filter(b => b[0] === +p), co = tr.bai.map((b, k) => k).filter(k => tr.bai[k].so > 0), n = co.indexOf(j);
    if (o.length === co.length && n >= 0) return [o[n][3], o[n][4]];
    const w = tr.bai[j].bt.find(coCham), x = w.kieu === 'noi' ? w.a[0] : w.o.find(x => !x.mau) || w.o[0];
    return [x.o[0], x.o[1]];
  }

  // ---------- vẽ từng kiểu: nhận c = {L, T, p, w, j, s()} → trả hàm vẽ lại theo trạng thái ----------
  const cao = o => (o[3] - o[1]) * 50, rong = o => (o[2] - o[0]) * 50 * TI_LE;   // cỡ ô theo em của lớp (1em = 2% chiều cao trang)
  const tam = o => [(o[0] + o[2]) / 2, (o[1] + o[3]) / 2];
  function mep(o, d) {                                    // điểm trên mép ô o, phía nhìn về điểm d (đường nối không gạch qua chữ / hình)
    const [x, y] = tam(o), dx = d[0] - x, dy = d[1] - y, t = Math.min(1, (o[2] - o[0]) / 2 / Math.abs(dx || 1e-9), (o[3] - o[1]) / 2 / Math.abs(dy || 1e-9));
    return [x + dx * t, y + dy * t];
  }
  const doan_ = (A, B) => { const a = mep(A, tam(B)), b = mep(B, tam(A)); return `M${a[0] * 100} ${a[1] * 100}L${b[0] * 100} ${b[1] * 100}`; };
  const lopNet = L => { L.insertAdjacentHTML('afterbegin', '<svg class="bt-net" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>'); return L.firstChild; };
  function nut(c, o, i) {                                 // nút trong suốt phủ khung o = [x0, y0, x1, y1]
    const e = document.createElement('button'); e.type = 'button'; e.className = 'bt-o k-' + c.w.kieu; e.dataset.k = `${c.p}|${c.w.id}|${i}`;
    e.style.cssText = `left:${pt(o[0])};top:${pt(o[1])};width:${pt(o[2] - o[0])};height:${pt(o[3] - o[1])}`;
    c.L.append(e); return e;
  }
  const cacO = c => c.w.o.map((x, i) => x.mau ? null : nut(c, x.o, i));   // ô mẫu: sách đã in sẵn, không vẽ đè, không chạm được
  function vuaChu(e, sp, co) {                            // chữ tự co cho vừa bề ngang ô
    sp.style.fontSize = co + 'em'; const r = e.clientWidth * 0.96 / (sp.offsetWidth || 1);
    if (r < 1) sp.style.fontSize = co * r + 'em';
  }
  const VE = {
    so(c) {
      const { w } = c, es = cacO(c), tu = w.tu ?? 1, den = w.den ?? 9;
      es.forEach((e, i) => { if (!e) return;
        e.style.fontSize = Math.min(cao(w.o[i].o) * 0.8, rong(w.o[i].o) / (String(den).length * 0.64)) + 'em';
        e.onclick = () => {
          const v = c.s().v || {}, daDat = w.o.filter((x, k) => k !== i && (x.mau || dungO(w, x, v[k]))).map(x => x.da), ds = [];   // số đã đặt đúng ở ô khác: mờ
          for (let n = tu; n <= den; n++) ds.push({ v: n, chu: n, mo: daDat.includes(n) });
          moBang(e, [...ds, { v: null, chu: '⌫', lop: 'xoa', ten: 'Xoá số' }], n => datO(c, i, e, n, () => { e.textContent = n; }));
        }; });
      return () => { const v = c.s().v || {}; es.forEach((e, i) => { if (!e) return; const ok = dungO(w, w.o[i], v[i]); e.textContent = ok ? v[i] : ''; e.classList.toggle('dung', ok); }); };
    },
    tich(c) {                                             // tích ✓ / khoanh (cùng luật: ô da = true mới nhận; có nhom thì chọn đúng xong các ô kia mờ + khoá; da = null là tích tự do)
      const { w } = c, es = cacO(c);
      es.forEach((e, i) => { if (!e) return; const x = w.o[i];
        if (w.kieu === 'tich') e.innerHTML = DAU.v;
        e.onclick = () => x.da == null ? (keu(), doi(c, s => { s.v ||= {}; if (s.v[i]) delete s.v[i]; else s.v[i] = 1; })) : datO(c, i, e, 1); });
      return () => { const v = c.s().v || {}; es.forEach((e, i) => { if (!e) return; const x = w.o[i], co = x.da == null ? !!v[i] : dungO(w, x, v[i]);
        const nhomXong = x.nhom != null && !co && w.o.some((y, k) => y.nhom === x.nhom && y.da === true && (y.mau || v[k]));
        e.classList.toggle('dung', co); e.classList.toggle('nhat', nhomXong); e.classList.toggle('khoa', nhomXong || (co && x.da != null)); }); };
    },
    'tich-x'(c) {                                         // bieu: ["🙂", "🙁"] (vẽ mặt cười / mếu) thay ✓ / ✗ — "v" = biểu tượng 1, "x" = biểu tượng 2
      const { w } = c, es = cacO(c), hinh = v => dauTX(w, v);
      es.forEach((e, i) => { if (!e) return;
        if (w.bieu) e.style.fontSize = Math.min(cao(w.o[i].o), rong(w.o[i].o)) * 0.78 + 'em';
        e.onclick = () => moBang(e, ['v', 'x'].map(v => ({ v, html: hinh(v), lop: w.bieu ? 'bieu' : '', ten: w.bieu ? w.bieu[v === 'v' ? 0 : 1] : v === 'v' ? 'Tích ✓' : 'Gạch ✗' })), v => datO(c, i, e, v, () => { e.innerHTML = hinh(v); })); });
      return () => { const v = c.s().v || {}; es.forEach((e, i) => { if (!e) return; const ok = dungO(w, w.o[i], v[i]); e.innerHTML = ok ? hinh(v[i]) : ''; e.classList.toggle('dung', ok); e.classList.toggle('khoa', ok); }); };
    },
    viet(c) {
      const { p, w } = c, es = cacO(c);
      es.forEach((e, i) => { if (!e) return; e.innerHTML = '<span></span>'; e.onclick = () => moPhim(c, i); });
      return () => { const v = c.s().v || {}; es.forEach((e, i) => { if (!e) return; const x = w.o[i], ok = dungI(w, i, v), sp = e.firstChild;
        sp.textContent = ok ? khop(x, v[i]) : v[i] || '';
        e.classList.toggle('dung', ok); e.classList.toggle('khoa', ok); e.classList.toggle('tieu', !!dang && dang.c.p === p && dang.c.w === w && dang.i === i);
        vuaChu(e, sp, cao(x.o) * 0.84); }); };
    },
    noi(c) {
      const { w } = c, svg = lopNet(c.L), o = {}, ma = d => d.join('|'), dapAn = (w.da || []).map(ma);
      let chon = null;                                     // ô đang chờ ô bên kia
      for (const ben of ['a', 'b']) for (const x of w[ben] || []) { const k = ben + ':' + x.id; o[k] = { x, e: nut(c, x.o, k) }; o[k].e.onclick = () => cham(k); }
      const capCua = k => (w.da || []).filter(d => String(d[k[0] === 'a' ? 0 : 1]) === k.slice(2)).map(ma);
      function cham(k) {
        if (!chon || chon[0] === k[0]) { chon = chon === k ? null : k; keu(); return dat(); }   // chọn / đổi ô cùng bên / bỏ chọn
        const a = k[0] === 'a' ? k : chon, b = k[0] === 'a' ? chon : k, m = a.slice(2) + '|' + b.slice(2), e2 = [o[a].e, o[b].e];
        chon = null;
        if (dapAn.includes(m)) { keu('dung'); e2.forEach(moi); doi(c, s => { (s.c ||= []).includes(m) || s.c.push(m); }); }
        else { dat(); sai(...e2); }
      }
      function dat() {
        const da = [...new Set([...(w.mau || []).map(ma), ...(c.s().c || []).filter(m => dapAn.includes(m))])];
        svg.innerHTML = da.map((m, n) => { const [a, b] = m.split('|'); return `<path d="${doan_(o['a:' + a].x.o, o['b:' + b].x.o)}" stroke="${MAU_BUT[n % MAU_BUT.length]}" vector-effect="non-scaling-stroke"/>`; }).join('');
        for (const k in o) { const cap = capCua(k), het = cap.length > 0 && cap.every(m => da.includes(m)); o[k].e.classList.toggle('khoa', het); o[k].e.classList.toggle('chon', chon === k); }
      }
      return dat;
    },
    duong(c) {                                            // nối từ MÉP viên này tới MÉP viên kế (qua tâm thì nét gạch ngang chữ in trên viên đá chữ); 2 viên sát nhau vẫn còn 1 đoạn ngắn ở giữa — lớp .bt-to, multiply
      const { w } = c, svg = lopNet(c.T), m = w.mau || 0, es = w.o.map((x, i) => nut(c, x.o, i));
      const ra = (b, a, d) => Math.min(...[0, 1].map(k => d[k] > 0 ? (b[k + 2] - a[k]) / d[k] : d[k] < 0 ? (b[k] - a[k]) / d[k] : Infinity));   // t để tia a + t·d ra khỏi ô b
      const noi2 = (i, j) => {
        const A = tam(w.o[i].o), B = tam(w.o[j].o), d = [B[0] - A[0], B[1] - A[1]], it = 0.012 / (Math.hypot(...d) || 1);   // đoạn ngắn nhất 1,2 % trang
        let t0 = Math.min(1, ra(w.o[i].o, A, d)), t1 = Math.max(0, 1 - ra(w.o[j].o, B, [-d[0], -d[1]]));
        if (t1 - t0 < it) { const g = (t0 + t1) / 2; t0 = g - it / 2; t1 = g + it / 2; }
        const p = t => (A[0] + d[0] * t) * 100 + ' ' + (A[1] + d[1] * t) * 100;
        return `M${p(t0)}L${p(t1)}`;
      };
      const buoc = () => Math.min(w.da.length, Math.max(m, c.s().n || 0));
      es.forEach((e, i) => { e.onclick = () => { const k = buoc(); if (w.da[k] === i) { keu('dung'); moi(e); doi(c, s => { s.n = k + 1; }); } else sai(e); }; });
      return () => { const k = buoc(), di = w.da.slice(0, k);
        svg.innerHTML = k > 1 ? `<path d="${di.slice(1).map((j, n) => noi2(di[n], j)).join('')}" vector-effect="non-scaling-stroke"/>` : '';
        es.forEach((e, i) => { e.classList.toggle('qua', di.includes(i)); e.classList.toggle('cuoi', k > 0 && k < w.da.length && di[k - 1] === i); e.classList.toggle('khoa', k >= w.da.length); }); };
    },
    dan(c) {
      const { w } = c, es = cacO(c), the = t => `<span class="bt-the">${an(t)}</span>`;
      es.forEach((e, i) => { if (!e) return; e.onclick = () => {
        const v = c.s().v || {}, con = [...w.the];        // thẻ chưa dán
        w.o.forEach((x, k) => { const n = x.mau || dungO(w, x, v[k]) ? con.indexOf(x.da) : -1; if (n >= 0) con.splice(n, 1); });
        moBang(e, con.map(t => ({ v: t, chu: t, lop: 'the' })), t => datO(c, i, e, t, () => { e.innerHTML = the(t); })); }; });
      return () => { const v = c.s().v || {}; es.forEach((e, i) => { if (!e) return; const ok = dungO(w, w.o[i], v[i]);
        e.innerHTML = ok ? the(v[i]) : '<i class="bt-huy">🏷️</i>'; e.classList.toggle('dung', ok); e.classList.toggle('khoa', ok); }); };
    },
    to(c) {
      const { w } = c, es = cacO(c), ms = [];
      es.forEach((e, i) => { if (!e) return; const x = w.o[i], m = ms[i] = document.createElement('i');
        m.className = 'bt-mau'; m.style.cssText = e.style.cssText + (x.mn ? `;-webkit-mask-image:url("${x.mn}");mask-image:url("${x.mn}")` : ''); c.T.append(m);
        e.onclick = () => moBang(e, Object.keys(MAU).map(t => ({ v: t, lop: 'mau', nen: MAU[t], ten: t })), t => datO(c, i, e, t, () => { m.style.background = MAU[t]; }, 400, 0)); });   // sai: tô lên 0,4 s rồi rung + trả lại trắng
      return () => { const v = c.s().v || {}; es.forEach((e, i) => { if (!e) return; const ok = dungO(w, w.o[i], v[i]);
        ms[i].style.background = ok ? MAU[v[i]] : ''; e.innerHTML = !ok ? '<i class="bt-huy giua">🎨</i>' : v[i] === 'white' ? '<i class="bt-huy ok">✓</i>' : '';
        e.classList.toggle('dung', ok); e.classList.toggle('khoa', ok); }); };
    },
    ve(c) {                                               // vẽ / viết tự do: huy hiệu ✏️ ở góc trên-PHẢI vùng (góc trái đè chữ in đầu dòng "What's your name?") → bật bút + phóng to tới vùng đó
      c.w.o.forEach((x, i) => { const o = x.o, e = nut(c, [o[2], o[1], o[2], o[1]], i);
        e.style.width = e.style.height = ''; e.textContent = '✏️'; e.title = e.ariaLabel = 'Viết / vẽ vào đây bằng bút';
        e.onclick = () => {
          if (!document.body.classList.contains('dang-viet')) $('viet').click();
          const W = san.clientWidth - 24, H = san.clientHeight - 24 - chuaBut(), h0 = Math.min(H, W / TI_LE);
          batPhong(+c.p, (o[0] + o[2]) / 2, (o[1] + o[3]) / 2, Math.min(5, Math.max(1, Math.min(H * 0.94 / ((o[3] - o[1]) * h0), W * 0.94 / ((o[2] - o[0]) * h0 * TI_LE)))));
        }; });
      return () => {};
    },
    nghe(c) {                                             // chạm 1 chỗ trên trang = nghe 1 đoạn
      c.w.o.forEach((x, i) => { const e = nut(c, x.o, i); e.title = e.ariaLabel = 'Nghe';
        e.onclick = () => { san.querySelectorAll('.k-nghe.phat').forEach(n => n.classList.remove('phat')); e.classList.add('phat'); phatDoan(x.clip); }; });
      return () => {};
    },
  };
  VE.khoanh = VE.tich;
  const doan = new Audio(); let henDoan = 0;              // 1 thẻ Audio riêng cho ô nghe (dùng lại, đỡ RAM iPad)
  function phatDoan([tep, a, b]) {
    am.pause(); cancelAnimationFrame(henDoan);
    doan.src = url(tep) + '#t=' + a; doan.play().catch(() => {});
    const f = () => { if (doan.paused || doan.ended) return; if (doan.currentTime >= b) return doan.pause(); henDoan = requestAnimationFrame(f); };
    henDoan = requestAnimationFrame(f);
  }
  ['pause', 'ended', 'error'].forEach(t => doan.addEventListener(t, () => san.querySelectorAll('.k-nghe.phat').forEach(n => n.classList.remove('phat'))));
  am.addEventListener('play', () => doan.pause());

  // ---------- gắn vào trang (trang dựng lại mỗi lần lật / phóng to / đổi 1–2 trang) ----------
  const coChu = L => { L.style.fontSize = L.clientHeight / 50 + 'px'; if (L.to) L.to.style.fontSize = L.style.fontSize; };   // L.to = lớp .bt-to cùng trang (nét đường đi)
  const RO = new ResizeObserver(es => es.forEach(e => coChu(e.target)));
  function dung(k) {
    const p = k.dataset.p, tr = DL()[p], lop = k.querySelector('.lop'), cv = lop?.querySelector('canvas.viet');
    if (!tr || !cv || lop.querySelector('.bt')) return;
    const L = document.createElement('div'), T = document.createElement('div'), fs = [];
    L.className = 'bt'; L.dataset.p = p; T.className = 'bt-to'; L.to = T;
    lop.insertBefore(T, cv); cv.after(L); coChu(L);        // .bt-to dưới nét bút; .bt trên nét bút + số bài, dưới nút nghe
    (tr.bai || []).forEach((b, j) => {
      const ws = (b.bt || []).filter(w => {
        const c = { L, T, p, w, j, s: () => tt(p, w.id) };
        try { c.dat = VE[w.kieu](c); fs.push(c.dat); return coCham(w); } catch (e) { console.warn('BT: ô bài tập hỏng', p, w?.id, e); return false; }
      });
      if (!ws.length) return;
      const e = document.createElement('i'), v = choSao(p, tr, j); e.className = 'bt-sao'; e.textContent = '★'; e.style.left = pt(v[0]); e.style.top = pt(v[1]); L.append(e);
      fs.push(() => e.classList.toggle('hien', ws.every(w => xongBt(p, w))));
    });
    datLai.set(p, fs); fs.forEach(f => f());
  }
  function gan() {
    RO.disconnect();
    const mo = new Set();
    for (const k of san.querySelectorAll('.trang')) { mo.add(k.dataset.p); dung(k); }
    for (const p of datLai.keys()) if (!mo.has(p)) datLai.delete(p);
    san.querySelectorAll('.bt').forEach(L => RO.observe(L));
    if (neo && !neo.isConnected) dongBang();
    if (dang) mo.has(String(dang.c.p)) ? (capNhat(dang.c.p), dayTrang()) : dongPhim();
    veHD(); datDem();
  }
  function dungLai() { dongBang(); dongPhim(); san.querySelectorAll('.bt, .bt-to').forEach(n => n.remove()); datLai.clear(); hdCu = null; gan(); }
  function xoaTrang(p) { delete luu[p]; ghi(); dungLai(); }

  // ---------- nút đầu trang ----------
  const taoNut = (id, html, ten) => Object.assign(document.createElement('button'), { className: 'nut-nho', id, innerHTML: html, title: ten });
  const nutDem = taoNut('bt-dem', '✅ 0/0', 'Số ô bài tập đã làm xong / tổng cả sách — chạm để tới trang còn bài chưa xong');
  const nutLai = taoNut('bt-lai', '', 'Xoá bài làm của trang đang mở để làm lại (chạm 2 lần)');
  const nutHD = taoNut('bt-hd', '📋', 'Trang này học gì — hướng dẫn cho bố mẹ, đáp án, lời nghe');
  $('viet').before(nutDem, nutLai, nutHD);
  const datDem = () => { const t = tongKet(); nutDem.textContent = `✅ ${t.xong}/${t.tong}`; };
  nutDem.onclick = () => {                                // tới trang có bài chưa xong kế tiếp (hết sách thì quay lại đầu)
    const tr = DL(), ds = Object.keys(tr).map(Number).sort((a, b) => a - b), cu = Math.max(...luot[iLuot]);
    const q = [...ds.filter(p => p > cu), ...ds.filter(p => p <= cu)].find(p => cacBt(tr[p]).some(w => coCham(w) && !xongBt(p, w)));
    if (q == null) return; if (phong) thuPhong(); moTrang(q);
  };
  let henLai = 0;
  const nhanLai = hoi => { nutLai.innerHTML = hoi ? '↺ Chạm lần nữa' : '↺<span> Làm lại</span>'; nutLai.classList.toggle('hoi', hoi); };
  nhanLai(false);
  nutLai.onclick = () => {                                // chạm 2 lần trong 3 s như nút 🗑
    if (Date.now() - henLai > 3000) { henLai = Date.now(); nhanLai(true); return setTimeout(() => { if (Date.now() - henLai >= 3000) nhanLai(false); }, 3050); }
    henLai = 0; nhanLai(false); trangDangMo().forEach(p => delete luu[p]); ghi(); dungLai();
  };

  // ---------- bảng "Trang này học gì" (thanh bên PC · hộp 📋 trên iPad) ----------
  const hd = $('huong-dan'), hop = document.createElement('dialog');
  hop.className = 'bt-hop'; hop.innerHTML = '<button class="dong" aria-label="Đóng">✕</button><h2>📋 Trang này học gì</h2><div class="hd"></div>';
  document.body.append(hop);
  hop.firstChild.onclick = () => hop.close(); hop.addEventListener('click', e => { if (e.target === hop) hop.close(); });
  nutHD.onclick = () => { dongBang(); dongPhim(); hop.lastChild.innerHTML = hd.innerHTML; hop.showModal(); };
  const soTrack = f => { const m = /CD(\d+)\D+(\d+)/.exec(f); return m ? `${+m[1]}.${m[2].padStart(2, '0')}` : f; };
  function dapAn(p, w) {                                  // đáp án 1 ô bài tập → các mục <li> (chạm 1 mục = nháy ô đó trên trang)
    const o = w.o || [], ten = (x, i, goc = 'ô') => an(x.ten || `${goc} ${i + 1}`), mau_ = x => x.mau ? ' <small>(mẫu)</small>' : '';
    const chip = (i, chu) => `<li><button type="button" class="hd-o" data-chi="${an(`${p}|${w.id}|${i}`)}">${chu}</button></li>`;
    const thuTu = (x, i) => o.filter((y, k) => k <= i && y.nhom === x.nhom).length;
    switch (w.kieu) {
      case 'so': return o.map((x, i) => chip(i, `${ten(x, i)}: <b>${an(x.da)}</b>${mau_(x)}`));
      case 'tich': case 'khoanh': return o.map((x, i) => x.da === true ? chip(i, (x.nhom != null ? `câu ${an(x.nhom)}: ` : '') + `<b>${x.ten ? an(x.ten) : 'ô thứ ' + thuTu(x, i)}</b>${mau_(x)}`) : '');
      case 'tich-x': return o.map((x, i) => chip(i, `${ten(x, i)}: <b>${w.bieu ? an(w.bieu[x.da === 'v' ? 0 : 1]) : x.da === 'v' ? '✓' : '✗'}</b>${mau_(x)}`));
      case 'viet': return o.map((x, i) => chip(i, `${x.ten ? an(x.ten) : i + 1}: <b>${[].concat(x.da ?? []).map(an).join(' / ')}</b>${mau_(x)}`));
      case 'dan': return o.map((x, i) => chip(i, `${ten(x, i, 'hình')}: <b>${an(x.da)}</b>${mau_(x)}`));
      case 'to': return o.map((x, i) => chip(i, `<i style="background:${MAU[x.da] || '#fff'}"></i>${ten(x, i, 'hình')}: <b>${an(x.da)}</b>${mau_(x)}`));
      case 'noi': return (w.da || []).map(d => chip('a:' + d[0], `<b>${an(d[0])} – ${an(d[1])}</b>`));
      case 'duong': return [`<li class="dong">${(w.da || []).map(i => an(o[i]?.tu ?? i + 1)).join(' → ')}</li>`];
      default: return [];
    }
  }
  function htmlTrang(p) {
    const tr = DL()[p];
    if (!tr) return `<section class="hd-trang"><h3>${soSach(p)}</h3><p class="hd-mo" style="margin:0 6px 8px">Trang này chưa soạn hướng dẫn.</p></section>`;
    const daCo = new Set(), loi = tr.loi || {};
    const htmlLoi = f => { daCo.add(f); const i = D.track.findIndex(t => t.file === f);
      return `<details><summary>📝 Lời nghe ${soTrack(f)}</summary><button type="button" class="hd-phat" data-phat="${i}">▶ ${an(i < 0 ? soTrack(f) : D.track[i].ten || soTrack(f))}</button>` +
        `<div class="hd-loi">${loi[f].map(cau => /^\d+$/.test(cau) ? `<b>${cau}</b>` : `<span>${an(cau)}</span>`).join('')}</div></details>`; };
    const bai = (tr.bai || []).map((b, j) => {
      const da = [...(b.dap_an || []).map(d => `<li class="dong">${an(d)}</li>`), ...(b.bt || []).flatMap(w => dapAn(p, w))].filter(Boolean);
      return `<article class="hd-bai"><p>${b.so > 0 ? `<b class="hd-so">${b.so}</b>` : ''}<b>${an(b.lenh)}</b></p>${b.mo_ta ? `<p class="hd-mo">${an(b.mo_ta)}</p>` : ''}` +
        `<p><span class="hd-kn">${KN[b.kn] || an(b.kn)}</span>${(b.bt || []).some(coCham) ? `<span class="hd-tt" data-tt="${p}|${j}"></span>` : b.khong_bt ? `<span class="hd-khong">${an(b.khong_bt)}</span>` : ''}</p>` +
        (da.length ? `<details><summary>🔑 Đáp án</summary><ul>${da.join('')}</ul></details>` : '') + (b.track || []).filter(f => loi[f]).map(htmlLoi).join('') + '</article>';
    }).join('');
    const thua = Object.keys(loi).filter(f => !daCo.has(f)).map(htmlLoi).join('');   // lời của track không bài nào khai
    return `<section class="hd-trang"><h3>${tr.sach != null ? 'Trang ' + tr.sach : soSach(p)}${tr.muc ? ' · ' + an(tr.muc) : ''}</h3>${bai}${thua ? `<article class="hd-bai">${thua}</article>` : ''}</section>`;
  }
  let hdCu = null;
  function veHD() {                                       // chỉ vẽ lại khi đổi trang (giữ 🔑 / 📝 đang mở); tiến độ thì datHD
    const khoa = luot[iLuot].join();
    if (khoa !== hdCu) { hdCu = khoa; hd.innerHTML = luot[iLuot].map(htmlTrang).join(''); document.querySelector('#muc-luc .muc.dang')?.scrollIntoView({ block: 'nearest' }); }
    datHD();
  }
  function datHD() {                                      // ★ / số ô đã làm của từng bài
    document.querySelectorAll('[data-tt]').forEach(n => { const [p, j] = n.dataset.tt.split('|'), b = DL()[p]?.bai?.[j]; if (!b) return;
      let a = 0, t = 0, xong = true; for (const w of b.bt || []) { const [x, y] = dem(w, tt(p, w.id)); a += x; t += y; if (x < y) xong = false; }
      n.textContent = xong ? '★ xong' : `${a}/${t} ô`; n.classList.toggle('xong', xong); });
  }
  function bamHD(e) {
    const b = e.target.closest('[data-phat], [data-chi]'); if (!b) return;
    if (b.dataset.phat != null) { const i = +b.dataset.phat; return i < 0 ? 0 : i === iBai && !am.paused ? am.pause() : phat(i); }   // chạm tên track = phát (chạm lại = dừng)
    if (hop.open) hop.close();
    const o = san.querySelector(`.bt [data-k="${CSS.escape(b.dataset.chi)}"]`); if (!o) return;
    o.classList.add('chi'); setTimeout(() => o.classList.remove('chi'), 1700);
  }
  hd.addEventListener('click', bamHD); hop.addEventListener('click', bamHD);

  $('viet').addEventListener('click', () => { dongBang(); dongPhim(); });   // bật ✏️ Viết: bút viết xuyên qua lớp bài tập, bảng chọn / bàn phím đóng
  addEventListener('resize', () => { dongBang(); dayTrang(); });
  new MutationObserver(gan).observe(san, { childList: true }); gan();
  function thuGiai(p) {                                   // CHỈ ĐỂ THỬ: điền đáp án đúng mọi ô bài tập của trang p bằng cú chạm như bé (click nút ô → nút bảng nổi / phím),
    p = String(p); const tr = DL()[p]; if (!tr) return { tong: 0, xong: 0, chua: [] };   // ô bé không chạm được (khoá) thì bỏ qua → dữ liệu hỏng lộ ra ở chua
    if (!san.querySelector(`.trang[data-p="${p}"]`)) { if (phong) thuPhong(); moTrang(+p); }
    gan();
    const nutO = (id, i) => san.querySelector(`.bt [data-k="${CSS.escape(`${p}|${id}|${i}`)}"]`);
    const cham = e => { if (e && !e.classList.contains('khoa')) e.click(); };
    const chonBang = v => { const b = !bang.hidden && bang.querySelector(`button[data-v="${CSS.escape(String(v))}"]`); b ? b.click() : dongBang(); };
    for (const w of cacBt(tr)) {
      if (!coCham(w)) continue;
      if (w.kieu === 'noi') { for (const [a, b] of w.da || []) if (!(w.mau || []).some(m => m.join('|') === a + '|' + b)) { cham(nutO(w.id, 'a:' + a)); cham(nutO(w.id, 'b:' + b)); } continue; }
      if (w.kieu === 'duong') { for (let k = w.mau || 0; k < w.da.length; k++) cham(nutO(w.id, w.da[k])); continue; }
      w.o.forEach((x, i) => {
        if (!phaiLam(w, x)) return;
        const e = nutO(w.id, i); if (!e || e.classList.contains('khoa')) return;
        if (TICH[w.kieu]) return e.click();
        e.click();
        if (w.kieu !== 'viet') return chonBang(x.da);
        const vs = tt(p, w.id).v || {}, daDung = w.o.map((y, k) => k !== i && y.nhom != null && y.nhom === x.nhom ? goc(y.mau ? [].concat(y.da)[0] : vs[k]) : '').filter(Boolean);   // cùng nhóm: chọn từ chưa ô nào dùng
        const chu = [].concat(x.da).find(a => !daDung.includes(goc(a))) ?? [].concat(x.da)[0];
        for (const ch of gon(chu ?? '').trimEnd()) { const b = dang && phim.querySelector(`button[data-c="${CSS.escape(ch)}"]`); if (!b) break; b.click(); }
      });
    }
    dongPhim(); dongBang();
    const ws = cacBt(tr).filter(coCham);
    return { tong: ws.length, xong: ws.filter(w => xongBt(p, w)).length, chua: ws.filter(w => !xongBt(p, w)).map(w => w.id) };
  }
  window.BT = { dungLai, xoaTrang, xong: (p, id) => { const w = cacBt(DL()[p]).find(w => w.id === id); return !!w && xongBt(p, w); }, tongKet, thuGiai };
})();
