// Chèn vào đầu trang sách (tools/chep-sach.py), sau cau-hinh.js + tai-ve.js. Chỉ chạy trên bản web:
// - trang chưa được Service Worker lo tệp thì quay về màn mở đầu;
// - ghi tiến độ (localStorage "pu3-…": bài tập, sao, chữ viết, trang đang mở…) thì đẩy lên /api/tien-do → D1;
// - tải dần về máy phần còn thiếu (_app/trang/… + _cd/… + video _phim/… sau cùng), trang gần trang đang mở trước.
(function () {
  if (location.protocol === 'file:' || !('serviceWorker' in navigator)) return;
  if (!navigator.serviceWorker.controller) { location.replace('/?ve=' + encodeURIComponent(location.pathname + location.hash)); return; }
  const ghi = Storage.prototype.setItem, cho = {};
  let hen = 0;
  Storage.prototype.setItem = function (k, v) {
    ghi.call(this, k, v);
    if (this !== localStorage || !String(k).startsWith('pu3-')) return;
    const t = Date.now();
    ghi.call(this, 'pu3~t~' + k, String(t));           // giờ sửa từng khoá, để màn mở đầu so với D1
    cho[k] = [String(v), t];
    clearTimeout(hen); hen = setTimeout(day, 4000);
  };
  function day(luc_dong) {
    const du = Object.assign({}, cho);
    Object.keys(cho).forEach(k => delete cho[k]);
    if (!Object.keys(du).length) return;
    const body = JSON.stringify({ du_lieu: du });
    // lỗi mạng thì thôi: lần mở sau màn mở đầu tự so giờ sửa và đẩy bù
    fetch('/api/tien-do', { method: 'POST', body, keepalive: luc_dong === true && body.length < 60000 }).catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) day(true); });

  // sách xin tải trước bài nghe của trang đang mở + ảnh các lượt kề (taiTruocKe) → chen lên đầu hàng
  window.taiTruoc = ds => TaiVe.them(ds, true);
  // tải dần cả sách: trang + tiếng của trang gần trang đang mở trước (cùng khoảng cách thì ảnh trước tiếng)
  addEventListener('load', () => setTimeout(async () => {
    try {
      const o = +localStorage.getItem('pu3-trang') || 2, trangCua = new Map();
      for (const t of window.OPW?.track || []) for (const f of [t.file, t.kara]) if (f) trangCua.set(f, t.trang);
      const xa = p => { const m = /^_app\/trang\/p(\d+)\./.exec(p), t = m ? +m[1] : trangCua.get(p) ?? 999; return Math.abs(t - o) * 2 + (m ? 0 : 1); };
      TaiVe.them((await TaiVe.danhMuc()).map(x => x[0]).sort((a, b) => xa(a) - xa(b)));
    } catch {}
  }, 1500));
})();
