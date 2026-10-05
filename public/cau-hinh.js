// Cấu hình dùng chung cho trang + Service Worker (self = window hoặc SW)
self.KHO_TEP = 'pu3-tep';                               // Cache Storage: trang sách + âm thanh + video (Cloudflare Pages, sau Cloudflare Access)
self.khoaTep = p => '/_tep/' + encodeURIComponent(p);   // khoá cache của 1 tệp theo đường dẫn app gọi
self.urlTep = p => '/' + p.split('/').map(encodeURIComponent).join('/');
// tệp nặng (không nằm trong repo, deploy từ PU3-len-Drive/tep-sach): trang _app/trang/… + âm thanh _cd/… + video _phim/… — trừ mã
// (.js .json .html) đi kèm app. Tên hàm giữ từ thời tệp nằm trên Drive.
self.laTepDrive = p => /^(_app|_cd|_phim)\//.test(p) && !/\.(js|json|html)$/i.test(p);
