// Tải tệp nặng (Cloudflare Pages) về máy trước khi cần + gọi API tiến độ (/api/tien-do → D1) — dùng chung cho màn mở đầu và trang sách.
(function () {
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  // fetch cùng nguồn; Cloudflare Access hết phiên thì máy chủ chuyển hướng sang trang đăng nhập → báo rõ thay vì "Failed to fetch"
  async function lay(url, init) {
    const r = await fetch(url, { ...init, redirect: 'manual' });
    if (r.type === 'opaqueredirect') throw new Error('Hết phiên đăng nhập — đóng app mở lại để đăng nhập Gmail');
    if (!r.ok) throw new Error(`Máy chủ báo lỗi ${r.status}`);
    return r;
  }
  // tiến độ: {a:'tai'} → {du_lieu: {khoá: [giá trị, giờ sửa]}} · {a:'luu', du_lieu} → {ghi}
  const goi = q => lay('/api/tien-do', q.a === 'luu' ? { method: 'POST', body: JSON.stringify({ du_lieu: q.du_lieu }) } : {}).then(r => r.json());

  // danh mục [[đường dẫn, kb]] các tệp nặng — /_dm.json do tools/len-cloudflare.py lập lúc deploy (SW cất bản sao cho lúc mất mạng)
  let dm = null;
  const danhMuc = () => dm || (dm = lay('/_dm.json', { cache: 'no-cache' }).then(r => r.json()).then(ds => ds.filter(([p]) => laTepDrive(p)))
    .catch(e => { dm = null; throw e; }));

  const hang = [], daXep = new Set(), dangLay = new Set();   // hàng chờ tải · tệp đã xếp (không xếp trùng) · tệp đang tải
  let soTho = 0;
  const T = self.TaiVe = {
    toiDaTho: 2,                             // số luồng tải song song (màn mở đầu "Tải hết" dùng 6)
    onTep: null, onXong: null, onLoi: null,  // gọi lại: tải xong 1 tệp (đường dẫn, kb) · hết hàng · dừng vì lỗi
    goi, danhMuc,
    // truoc = kéo lên đầu hàng (tệp sắp dùng ngay) — kể cả tệp nền đã xếp ở cuối hàng từ trước (26/09: bỏ qua tệp đã xếp
    // làm tải trước vô tác dụng: tệp cần ngay vẫn tải sau hàng trăm tệp khác). Tệp đã có trong máy thì luồng tải tự bỏ qua.
    them(ds, truoc = false) {
      const moi = [...new Set(ds)].filter(p => p && laTepDrive(p) && !dangLay.has(p) && (truoc || !daXep.has(p)));
      moi.forEach(p => daXep.add(p));
      if (truoc) { const s = new Set(moi), con = hang.filter(p => !s.has(p)); hang.length = 0; hang.push(...moi, ...con); }
      else hang.push(...moi);
      while (soTho < T.toiDaTho && hang.length) tho();
    },
    dung() { hang.length = 0; daXep.clear(); },
    get dangTai() { return soTho > 0; },
  };

  async function tho() {
    soTho++;
    let loi = 0;
    try {
      const kho = await caches.open(KHO_TEP), kb = new Map(await danhMuc());
      const co = new Set((await kho.keys()).map(r => new URL(r.url).pathname));   // tệp đã có trong máy: đọc 1 lần, khỏi hỏi từng tệp
      while (hang.length) {
        const p = hang.shift();
        if (!kb.has(p) || co.has(khoaTep(p)) || await kho.match(khoaTep(p))) continue;
        dangLay.add(p);
        try {   // ?goc: đi thẳng mạng, không qua SW — tự cất ở đây để bắt được lỗi máy hết chỗ
          const blob = await (await lay(urlTep(p) + '?goc')).blob();
          await kho.put(khoaTep(p), new Response(blob, { headers: { 'Content-Type': blob.type, 'X-Kb': String(Math.round(blob.size / 1024)) } }));
          T.onTep?.(p, kb.get(p));
          loi = 0;
        } catch (e) {
          hang.unshift(p);
          if (e.name === 'QuotaExceededError' || /đăng nhập/.test(e.message) || ++loi > 6) { T.dung(); T.onLoi?.(e); break; }
          await ngu(3000 * loi);
        } finally {
          dangLay.delete(p);
        }
      }
    } catch (e) {
      T.onLoi?.(e);
    } finally {
      if (--soTho === 0) T.onXong?.();
    }
  }
})();
