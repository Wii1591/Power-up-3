// Karaoke sách Power Up 3 (chép sach-pu2.js level 2) — nhân bản sach5.js (Oxford Phonics World 5) đã được anh duyệt: 🎤 Karaoke (dạ quang chạy + bi cam nảy trên nền sách gốc)
// / 🐸 Nhảy chữ / Tắt, 🗣 Đọc theo, pháo giấy + ★ khi nghe trọn bài, chạm 1 chữ = phát từ chữ đó, bài hát có nốt nhạc bay, chạm SỐ BÀI = phóng to bài.
// Dữ liệu D.track[i].k = [[giây đầu, giây cuối, trang, x0, y0, x1, y1, dòng, vị trí trong dòng, chữ], …], D.track[i].loai =
// chi | chant | hat | truyen | ngu-phap | van-hoc (ghep-sach.py). Power Up khác sách 5:
//   · bỏ phần tô vần phonics; · chant + "Listen and point": chữ sáng là NHÃN TỪ trong tranh (bi nảy từ nhãn này sang nhãn kia = chỉ tay theo tiếng);
//   · chạm 1 nhãn từ có trong bài vè (D.tu) = nghe riêng từ đó; · bài hát có bản nhạc không lời (t.kara): nút 🎶 Hát không lời.
// Dùng biến của mã sách chung (am, D, iBai, nho, anhTrang, $, san, phong, batPhong, thuPhong, TI_LE, chuaBut, phat, url).
(() => {
  const KIEU = { karaoke: '🎤 Karaoke', nhay: '🐸 Nhảy chữ', tat: '🎤 Tắt' }, SAU = { karaoke: 'nhay', nhay: 'tat', tat: 'karaoke' };
  let kieu = nho.doc('pu3-kara', 'karaoke'); if (!KIEU[kieu]) kieu = 'karaoke';
  let docTheo = nho.doc('pu3-doc-theo', '0') === '1';
  const GIU = 0.8, NGAT = 1.5;                            // giữ chữ cuối 0,8 s sau khi đọc xong; cách nhau > 1,5 s = hết câu

  // Bài hát có bản KHÔNG LỜI (t.kara; mốc bản có lời = mốc bản không lời + t.kl giây, lech-kara.py đo): đang phát bản đó thì chữ vẫn chạy đúng nhịp
  const khongLoi = () => { const t = D.track[iBai]; return !!(t && t.kara && decodeURIComponent(am.src).endsWith(t.kara)); };
  const gio = () => am.currentTime + (khongLoi() ? D.track[iBai].kl : 0);

  const SAO_KHOA = 'pu3-sao';
  let sao = {}; try { sao = JSON.parse(nho.doc(SAO_KHOA, '{}')) || {}; } catch { sao = {}; }
  const soKara = D.track.filter(t => t.k).length;

  const css = document.createElement('style');
  css.textContent = `
  .kara { position: absolute; inset: 0; pointer-events: none; }
  .kara > * { position: absolute; display: block; }
  .kara .to { border-radius: 6px; background: #ffd23f; mix-blend-mode: multiply; transform-origin: 0 50%; }
  .kara .to.xong { background: #ffe98c; }
  .kara .bong { width: 2.2%; aspect-ratio: 1; border-radius: 50%; transform: translate(-50%, -112%);
                background: radial-gradient(circle at 34% 30%, #fffc 0 13%, #ff7b3a 14% 60%, #d63c1c 61%); box-shadow: 0 2px 3px #0005; }
  .kara .nhay { overflow: hidden; border-radius: 10px; background: #fff; transform-origin: 50% 90%;
                box-shadow: 0 0 0 3px #ffc21a, 0 10px 20px #0004; animation: kara-bat .42s cubic-bezier(.34, 1.7, .6, 1) forwards; }
  .kara .nhay img { position: absolute; max-width: none; }
  @keyframes kara-bat { from { transform: none; } to { transform: translateY(-16%) scale(1.3); } }
  .kara .not { font: 800 clamp(12px, 2.2vmin, 22px)/1 Nunito, sans-serif; color: var(--m); translate: -50% -100%;
               text-shadow: 0 1px 0 #fff, 0 0 4px #fff; animation: kara-not 1.6s ease-out forwards; }
  @keyframes kara-not { from { opacity: 0; transform: translate(0, 0) rotate(-8deg); } 15% { opacity: 1; }
                        to { opacity: 0; transform: translate(var(--dx), -260%) rotate(12deg); } }
  @media (prefers-reduced-motion: reduce) { .kara .nhay { animation: none; transform: scale(1.12); } .kara .bong, .kara .not { display: none; } }
  .nghe.co-kara::after { content: '♪'; position: absolute; right: -14%; top: -18%; width: 44%; aspect-ratio: 1; border-radius: 50%;
                         background: #ffc21a; color: #5a3b00; font: 800 11px/1 Nunito, sans-serif; display: grid; place-items: center; }
  .nghe.co-kara.da-hat::after { content: '★'; background: #ff9f1c; color: #fff; box-shadow: 0 0 0 2px #fff; }
  /* 🗣 Đọc theo: lúc dừng cho con đọc, nút hiện vòng đếm ngược */
  #doc-theo { position: relative; padding-left: 34px; }
  #doc-theo::before { content: ''; position: absolute; left: 8px; top: 50%; translate: 0 -50%; width: 20px; height: 20px; border-radius: 50%;
                      background: conic-gradient(var(--xanh) var(--g, 0%), var(--vien) 0); }
  #doc-theo[aria-pressed="true"]::before { background: conic-gradient(#fff var(--g, 0%), rgba(255, 255, 255, .35) 0); }
  #doc-theo.dang { background: var(--cam); border-color: var(--cam); color: #fff; }
  #doc-theo.dang::before { background: conic-gradient(#fff var(--g, 0%), rgba(255, 255, 255, .35) 0); }
  #sao-hat { cursor: default; font-variant-numeric: tabular-nums; }
  #sao-hat.moi { animation: sao-moi .8s cubic-bezier(.34, 1.7, .6, 1); }
  @keyframes sao-moi { 40% { transform: scale(1.35); background: #ffe07a; } }
  #phao { position: absolute; inset: 0; pointer-events: none; z-index: 5; display: none; }
  #phao.hien { display: block; }`;
  document.head.append(css);

  const nut = document.createElement('button');
  nut.className = 'nut-nho'; nut.id = 'kara';
  nut.title = 'Chữ trên trang chạy theo tiếng đọc — bài vè, bài hát, truyện, ngữ pháp, bài đọc (nút nghe có dấu ♪). Chạm 1 chữ để nghe từ chỗ đó';
  $('lap').before(nut);
  const nutDoc = document.createElement('button');
  nutDoc.className = 'nut-nho'; nutDoc.id = 'doc-theo'; nutDoc.textContent = 'Đọc theo';
  nutDoc.title = 'Hết mỗi câu máy dừng lại, con đọc theo rồi máy tự chạy tiếp';
  nut.after(nutDoc);
  const nutSao = document.createElement('span');
  nutSao.className = 'nut-nho'; nutSao.id = 'sao-hat'; nutSao.title = 'Số bài vè / bài hát / truyện / bài đọc con đã nghe trọn (★ trên nút tai nghe)';
  nutDoc.after(nutSao);
  const datSao = () => { nutSao.textContent = `⭐ ${Object.keys(sao).filter(f => D.track.some(t => t.k && t.file === f)).length}/${soKara}`; };
  const datNut = () => { nut.textContent = KIEU[kieu]; nut.ariaPressed = kieu !== 'tat'; nutDoc.ariaPressed = docTheo; };
  datNut(); datSao();
  nut.onclick = () => { kieu = SAU[kieu]; nho.ghi('pu3-kara', kieu); datNut(); hien = null; ve1(); };
  nutDoc.onclick = () => { docTheo = !docTheo; nho.ghi('pu3-doc-theo', docTheo ? '1' : '0'); datNut(); if (!docTheo) thoiDoc(true); };

  let hien = null;                                         // {i, j, kieu}: đang vẽ chữ nào — đổi mới dựng lại, không thì chỉ cập nhật
  const pt = v => v * 100 + '%';
  function lop(p) {                                        // lớp karaoke trong trang p (trang dựng lại thì mất → tạo lại)
    const l = document.querySelector(`#san .trang[data-p="${p}"] .lop`); if (!l) return null;
    return l.querySelector('.kara') || l.insertBefore(Object.assign(document.createElement('div'), { className: 'kara' }), l.querySelector('canvas'));
  }
  const oChu = (w, dx = 0.22, dy = 0.14) => {             // ô quanh chữ, nới theo cỡ chữ
    const h = w[6] - w[4];
    return [w[3] - h * dx, w[4] - h * dy, w[5] + h * dx, w[6] + h * dy];
  };
  const dat = (el, [x0, y0, x1, y1]) => Object.assign(el.style, { left: pt(x0), top: pt(y0), width: pt(x1 - x0), height: pt(y1 - y0) });

  function chuHienTai() {                                  // chỉ số chữ đang đọc trong D.track[iBai].k, -1 = không
    const k = kieu !== 'tat' && D.track[iBai]?.k, now = gio();
    if (!k || am.ended || Number.isNaN(now)) return -1;   // NaN: bản không lời chưa đo được độ lệch (không có kl) → không chạy chữ
    let a = 0, b = k.length - 1, j = -1;                   // chữ cuối cùng đã bắt đầu
    while (a <= b) { const m = (a + b) >> 1; if (k[m][0] <= now) { j = m; a = m + 1; } else b = m - 1; }
    if (j >= 0 && now > k[j][1] + GIU && !(k[j + 1] && k[j + 1][0] - k[j][1] < NGAT)) j = -1;   // đang ngắt dài giữa 2 câu
    return j;
  }
  const khoa = w => `${w[2]}:${w[7]}`;
  function doanCau(k, j) {                                 // đoạn liên tiếp cùng dòng in quanh chữ j: [đầu, cuối] chỉ số trong k
    let a = j, b = j;
    while (a > 0 && khoa(k[a - 1]) === khoa(k[j]) && k[a][0] - k[a - 1][1] < NGAT) a--;
    while (b + 1 < k.length && khoa(k[b + 1]) === khoa(k[j]) && k[b + 1][0] - k[b][1] < NGAT) b++;
    return [a, b];
  }

  let notSau = 0;                                          // giờ (performance.now) được thả nốt nhạc kế
  function ve1() {
    const k = D.track[iBai]?.k, now = gio(), j = chuHienTai();
    if (j >= 0 && docTheo) nhacDoc(k, j, now);
    if (j < 0) { if (hien) { document.querySelectorAll('#san .kara').forEach(x => x.replaceChildren()); hien = null; } return; }
    const w = k[j], L = lop(w[2]); if (!L) return;
    if (!hien || hien.i !== iBai || hien.j !== j || hien.L !== L || !L.isConnected || !L.firstChild) {
      document.querySelectorAll('#san .kara').forEach(x => x.replaceChildren());
      hien = { i: iBai, j, L, to: null };
      if (kieu === 'karaoke') {                            // các chữ đã đọc của câu này (cùng dòng, đi xuôi) + chữ đang đọc
        const cau = [j];
        for (let i = j - 1; i >= 0; i--) {
          const x = k[i], y = k[i + 1];
          if (x[2] !== w[2] || x[7] !== w[7] || x[8] >= y[8] || y[0] - x[1] > NGAT) break;
          cau.unshift(i);
        }
        for (const i of cau) {
          const el = document.createElement('i'); el.className = i === j ? 'to' : 'to xong'; dat(el, oChu(k[i], 0.1, 0.06)); L.append(el);
          if (i === j) hien.to = el;
        }
      } else {                                             // nhảy: bản sao đúng chữ đó cắt từ ảnh trang, bật lên
        const o = oChu(w, 0.3, 0.2), el = document.createElement('div'), img = new Image();
        el.className = 'nhay'; dat(el, o);
        img.src = anhTrang(w[2]); img.alt = ''; img.draggable = false;
        Object.assign(img.style, { width: pt(1 / (o[2] - o[0])), height: 'auto', left: pt(-o[0] / (o[2] - o[0])), top: pt(-o[1] / (o[3] - o[1])) });
        el.append(img);
        L.append(el);
      }
      hien.bong = document.createElement('i'); hien.bong.className = 'bong'; L.append(hien.bong);
    }
    if (hien.to) hien.to.style.transform = `scaleX(${Math.min(1, Math.max(0.08, (now - w[0]) / Math.max(0.12, w[1] - w[0])))})`;
    // bóng nảy: đậu trên chữ đang đọc, gần tới chữ sau thì nhảy vòng cung sang
    const giua = x => (x[3] + x[5]) / 2, dinh = x => x[4] - (kieu === 'nhay' ? (x[6] - x[4]) * 0.55 : 0), s = k[j + 1];   // nhảy: chữ bật cao hơn
    let bx = giua(w), by = dinh(w);
    if (s && s[2] === w[2] && s[0] - w[0] < 2.5) {
      const H = Math.min(0.4, (s[0] - w[0]) * 0.85), f = Math.max(0, Math.min(1, (now - (s[0] - H)) / H));
      bx += (giua(s) - bx) * f; by += (dinh(s) - by) * f - Math.max(w[6] - w[4], 0.015) * 1.4 * Math.sin(Math.PI * f);
    }
    hien.bong.style.left = pt(bx); hien.bong.style.top = pt(by);
    if (D.track[iBai].loai === 'hat' && !am.paused && performance.now() > notSau) {   // bài hát: nốt nhạc bay lên theo bi
      notSau = performance.now() + 650;
      const n = document.createElement('i'); n.className = 'not';
      n.textContent = '♪♫♩♬'[Math.random() * 4 | 0];
      n.style.setProperty('--m', ['#e0007a', '#7b3fe4', '#0d7887', '#f28a1c'][Math.random() * 4 | 0]);
      n.style.setProperty('--dx', (Math.random() - 0.5) * 60 + 'px');
      n.style.left = pt(bx); n.style.top = pt(by - (w[6] - w[4]) * 0.8);
      hien.L.append(n); setTimeout(() => n.remove(), 1700);
    }
  }

  // ===== 🗣 Đọc theo: hết câu (đoạn cùng dòng in) thì dừng, vòng đếm ngược trên nút cho con đọc lại, xong tự phát tiếp =====
  let doc = null;                                          // {b, hen, t0, dai}: đang dừng cho con đọc sau chữ b
  let daDoc = -1;                                          // chỉ số chữ cuối của đoạn vừa dừng (không dừng 2 lần cùng đoạn)
  function nhacDoc(k, j, now) {
    if (doc || am.paused) return;
    const [a, b] = doanCau(k, j); if (b === daDoc) return;
    const cuoi = k[b];
    if (now < cuoi[1] - 0.05) return;                     // chưa hết chữ cuối
    const dai_ = Math.min(6, Math.max(1.6, (cuoi[1] - k[a][0]) * 1.15 + 0.6));
    daDoc = b; am.pause();
    doc = { b, t0: performance.now(), dai: dai_ * 1000 };
    nutDoc.classList.add('dang'); nutDoc.textContent = 'Con đọc nhé…';
    const tick = () => {
      if (!doc) return;
      const f = Math.min(1, (performance.now() - doc.t0) / doc.dai);
      nutDoc.style.setProperty('--g', Math.round(f * 100) + '%');
      if (f < 1) doc.hen = requestAnimationFrame(tick);
      else { thoiDoc(false); am.play().catch(() => {}); }
    };
    doc.hen = requestAnimationFrame(tick);
  }
  function thoiDoc(huy) {                                  // huy = người dùng can thiệp (tua, bấm, đổi bài) → không tự phát tiếp
    if (!doc) return;
    cancelAnimationFrame(doc.hen); doc = null; nutDoc.classList.remove('dang'); nutDoc.textContent = 'Đọc theo'; nutDoc.style.setProperty('--g', '0%');
    if (huy) daDoc = -1;
  }

  // ===== Hết bài có karaoke: pháo giấy + ★ cho bài đó =====
  const phao = document.createElement('canvas'); phao.id = 'phao'; san.append(phao);
  function banPhao() {
    const r = san.getBoundingClientRect(); phao.width = r.width; phao.height = r.height; phao.classList.add('hien');
    const ctx = phao.getContext('2d'), MAU = ['#f28a1c', '#ffd23f', '#e0007a', '#0d7887', '#4caf50', '#2979ff'], hat = [];
    for (let i = 0; i < 90; i++) hat.push({ x: r.width / 2 + (Math.random() - .5) * 120, y: r.height - 40, vx: (Math.random() - .5) * 14, vy: -9 - Math.random() * 9,
                                             m: MAU[i % MAU.length], w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, g: Math.random() * 6.3, q: (Math.random() - .5) * .3 });
    const t0 = performance.now();
    (function ve() {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, phao.width, phao.height);
      for (const h of hat) {
        h.x += h.vx; h.y += h.vy; h.vy += 0.32; h.vx *= 0.99; h.g += h.q;
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.g); ctx.fillStyle = h.m; ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1.6) / 0.6);
        ctx.fillRect(-h.w / 2, -h.h / 2, h.w, h.h); ctx.restore();
      }
      if (t < 2.3) requestAnimationFrame(ve); else { ctx.clearRect(0, 0, phao.width, phao.height); phao.classList.remove('hien'); }
    })();
  }
  am.addEventListener('ended', () => {
    thoiDoc(false);
    const t = D.track[iBai];
    if (!t?.k || $('lap').ariaPressed === 'true') return;
    if (!sao[t.file]) { sao[t.file] = 1; nho.ghi(SAO_KHOA, JSON.stringify(sao)); datSao(); danhDau();
                        nutSao.classList.remove('moi'); void nutSao.offsetWidth; nutSao.classList.add('moi'); }
    if (kieu !== 'tat') banPhao();
  });

  let rq = 0;
  const chay = () => { cancelAnimationFrame(rq); const f = () => { ve1(); if (!am.paused) rq = requestAnimationFrame(f); }; f(); };
  am.addEventListener('play', () => { if (doc) thoiDoc(true); chay(); });
  am.addEventListener('seeked', () => { thoiDoc(true); daDoc = -1; ve1(); });
  am.addEventListener('emptied', () => { thoiDoc(true); daDoc = -1; ve1(); });
  ['pause', 'ended'].forEach(t => am.addEventListener(t, () => ve1()));

  // ===== Chạm 1 chữ của bài có karaoke trên trang → hát từ chữ đó (chạm ngắn, không kéo; không ở chế độ ✏️ Viết) =====
  let cham = null;
  san.addEventListener('pointerdown', e => { cham = e.isPrimary ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; }, true);
  san.addEventListener('pointerup', e => {
    const c = cham; cham = null;
    if (!c || document.body.classList.contains('dang-viet') || e.target.closest('button, dialog, #cong-cu')) return;
    if (Math.hypot(e.clientX - c.x, e.clientY - c.y) > 10 || performance.now() - c.t > 600) return;
    const l = e.target.closest?.('.trang .lop') || document.elementsFromPoint(e.clientX, e.clientY).find(x => x.matches?.('.trang .lop'));
    if (!l) return;
    const p = +l.parentNode.dataset.p, r = l.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (am.paused || !D.track[iBai]?.k) {                  // không có bài karaoke đang chạy: chạm NHÃN TỪ trong tranh = nghe riêng từ đó
      const n = (D.tu || []).find(n => n[0] === p && fx >= n[1] - 0.006 && fx <= n[3] + 0.006 && fy >= n[2] - 0.008 && fy <= n[4] + 0.008);
      if (n) return docTu(n, l);
    }
    if (kieu === 'tat') return;
    let tot = null;                                        // chữ gần nhất trong ô nới rộng, ưu tiên bài đang phát
    D.track.forEach((t, i) => t.k?.forEach((w, j) => {
      if (w[2] !== p) return;
      const h = w[6] - w[4], o = [w[3] - h * 0.3, w[4] - h * 0.4, w[5] + h * 0.3, w[6] + h * 0.4];
      if (fx < o[0] || fx > o[2] || fy < o[1] || fy > o[3]) return;
      const d = Math.hypot(fx - (w[3] + w[5]) / 2, fy - (w[4] + w[6]) / 2) - (i === iBai ? 1 : 0);
      if (!tot || d < tot.d) tot = { i, j, d };
    }));
    if (!tot) return;
    const w = D.track[tot.i].k[tot.j], den = () => { am.currentTime = Math.max(0, w[0] - 0.12 - (khongLoi() ? D.track[iBai].kl || 0 : 0)); am.play().catch(() => {}); };
    thoiDoc(true);
    if (tot.i === iBai && am.readyState >= 1) den();
    else { phat(tot.i); am.addEventListener('loadedmetadata', den, { once: true }); }
  });

  // ===== Chạm 1 NHÃN TỪ trong tranh (D.tu = [trang, x0, y0, x1, y1, tệp, giây đầu, giây cuối, chữ]) → nghe riêng từ đó, cắt từ bài vè của trang =====
  css.textContent += `
  .nhan-tu { position: absolute; border-radius: 8px; background: #ffd23f; mix-blend-mode: multiply; pointer-events: none; animation: nhan-tu .9s ease-out forwards; }
  @keyframes nhan-tu { from { opacity: 1; transform: scale(1.25); } 60% { opacity: 1; transform: none; } to { opacity: 0; } }`;
  const amTu = new Audio(); let henTu = 0;
  function docTu(n, l) {
    am.pause(); clearTimeout(henTu);
    const phat1 = () => { amTu.currentTime = n[6]; amTu.play().catch(() => {}); henTu = setTimeout(() => amTu.pause(), (n[7] - n[6]) * 1000 + 60); };
    if (decodeURIComponent(amTu.src).endsWith(n[5]) && amTu.readyState >= 1) phat1();
    else { amTu.src = url(n[5]); amTu.addEventListener('loadedmetadata', phat1, { once: true }); }
    const el = document.createElement('i'); el.className = 'nhan-tu';   // nháy vàng nhãn vừa chạm (đặt thẳng trong .lop: lớp .kara bị ve1 dọn mỗi lần dừng tiếng)
    dat(el, [n[1] - 0.005, n[2] - 0.005, n[3] + 0.005, n[4] + 0.005]); l.insertBefore(el, l.querySelector('canvas'));
    setTimeout(() => el.remove(), 950);
  }

  // ===== 🎶 Không lời: bài hát có bản nhạc không lời → con tự hát, chữ vẫn chạy (nút chỉ hiện khi bài đang chọn là bài hát có bản đó) =====
  const nutKL = document.createElement('button');
  nutKL.className = 'nut-nho'; nutKL.id = 'khong-loi'; nutKL.textContent = '🎶 Không lời'; nutKL.hidden = true;
  nutKL.title = 'Phát bản nhạc không lời của bài hát này để con tự hát — chữ vẫn chạy theo nhạc';
  nut.before(nutKL);
  const datKL = () => { nutKL.hidden = !D.track[iBai]?.kara; nutKL.ariaPressed = khongLoi(); };
  nutKL.onclick = () => {
    const t = D.track[iBai]; if (!t?.kara) return;
    thoiDoc(true); am.src = url(khongLoi() ? t.file : t.kara); am.playbackRate = +$('toc').value; am.play().catch(() => {}); datKL();
  };
  ['loadstart', 'emptied'].forEach(t => am.addEventListener(t, datKL));

  // ===== Chạm SỐ BÀI (ô vuông xanh lá) → phóng to đúng bài đó vừa khung, chạm lại = về cả trang =====
  css.textContent += `
  .ten-bai { position: absolute; z-index: 2; border: 0; padding: 0; background: none; border-radius: 10px; }
  .ten-bai:hover, .ten-bai:focus-visible { background: rgba(21, 151, 168, .1); outline: 2px dashed var(--xanh); }
  body.dang-viet .ten-bai { pointer-events: none; }
  .ten-bai.phim { border-radius: 6px; }
  .ten-bai.phim::after { content: '▶'; position: absolute; right: -16%; top: -20%; width: 40%; aspect-ratio: 1; border-radius: 50%;
                         background: #ff9f1c; color: #fff; font: 800 9px/1 Nunito, sans-serif; display: grid; place-items: center; box-shadow: 0 0 0 2px #fff; }
  .ten-bai.phim.them { z-index: 3; container-type: size; border-radius: 50%; background: #ff9f1c; box-shadow: 0 1px 5px rgba(0, 0, 0, .35), 0 0 0 2px #fff; display: grid; place-items: center; }
  .ten-bai.phim.them span { font-size: 60cqh; line-height: 1; }  /* video karaoke: không in trên trang → nút hiện hẳn */`;
  function moBai(p, y0, y1) {
    if (phong && phong.p === p && Math.abs(phong.y - (y0 + y1) / 2) < 0.02) return thuPhong();   // đang xem đúng bài này → về cả trang
    const W = san.clientWidth - 24, H = san.clientHeight - 24 - chuaBut(), h0 = Math.min(H, W / TI_LE);
    const s = Math.min(5, Math.max(1, Math.min(H * 0.96 / ((y1 - y0) * h0), W / (0.94 * TI_LE * h0))));
    batPhong(p, 0.5, (y0 + y1) / 2, s);
  }
  function ganTenBai() {
    for (const l of document.querySelectorAll('#san .trang .lop')) {
      if (l.querySelector('.ten-bai')) continue;
      const p = +l.parentNode.dataset.p;
      for (const [q, a, b, c, d, f, ten, them] of D.phim || []) {  // biểu tượng phim in trên trang (phim.py) → mở video; chèn trước nên nằm trên ô số bài liền kề
        if (q !== p) continue;
        const n = document.createElement('button');
        n.className = 'ten-bai phim' + (them ? ' them' : ''); n.title = n.ariaLabel = 'Xem video: ' + ten; if (them) n.innerHTML = '<span>🎤</span>';
        dat(n, [a, b, c, d]);
        n.onclick = () => { am.pause(); $('vid').src = url(f); $('hop-video').showModal(); $('vid').play().catch(() => {}); };
        l.insertBefore(n, l.children[1]);
      }
      for (const [q, y0, y1, a, b, c, d] of D.bai || []) {
        if (q !== p) continue;
        const n = document.createElement('button');
        n.className = 'ten-bai'; n.title = n.ariaLabel = 'Phóng to bài này (chạm lại để về cả trang)';
        dat(n, [a, b, c, d]); n.onclick = () => moBai(p, y0, y1);
        l.insertBefore(n, l.children[1]);                  // trước canvas + nút nghe: chỗ chồng lên huy hiệu disc thì nút nghe thắng
      }
      for (const [q, a, b, c, d, toi] of D.lk || []) {     // liên kết in trong sách (level 3): dải "mission" trang mở đầu unit ↔ trang "mission in action!" cuối unit
        if (q !== p) continue;
        const n = document.createElement('button');
        n.className = 'ten-bai lien-ket'; n.title = n.ariaLabel = toi > q ? 'Tới trang “mission in action!” của unit này' : 'Về trang mở đầu unit (danh sách việc Mission)';
        dat(n, [a, b, c, d]); n.onclick = () => { thuPhong(); moTrang(toi); };
        l.insertBefore(n, l.children[1]);
      }
    }
  }

  // trang dựng lại (lật trang, phóng to, 1/2 trang) → vẽ lại ngay, đang dừng cũng thấy chữ đang dở; nút nghe có karaoke gắn ♪ (hát trọn: ★)
  function danhDau() {
    document.querySelectorAll('#san .nghe').forEach(b => {
      const t = D.track[+b.dataset.i];
      b.classList.toggle('co-kara', !!t?.k); b.classList.toggle('da-hat', !!(t?.k && sao[t.file]));
    });
  }
  new MutationObserver(() => { hien = null; danhDau(); ganTenBai(); ve1(); }).observe($('san'), { childList: true });
  danhDau(); ganTenBai();
})();
