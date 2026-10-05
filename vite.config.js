import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Host AI Studio trả mọi tệp không phải HTML với "Cache-Control: immutable" 1 năm (đo 26/09/2026) → .js không có mã băm trong tên
// (cau-hinh.js, tai-ve.js, may-chu.js, du_lieu_game.js…) bị trình duyệt giữ bản cũ sau Publish, cả trong bộ nhớ đệm RAM (không qua
// Service Worker). Build xong: gắn ?v=<băm nội dung> vào mọi src="….js" cùng nguồn trong các trang HTML → đổi nội dung là đổi URL.
function ganPhienBan() {
  let ra;
  return {
    name: 'gan-phien-ban', apply: 'build',
    configResolved(c) { ra = path.resolve(c.root, c.build.outDir); },
    closeBundle() {
      const bam = f => createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
      for (const h of fs.readdirSync(ra).filter(f => f.endsWith('.html'))) {
        const p = path.join(ra, h);
        fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/src="(\/?)([^":?]+\.js)"/g, (m, dau, js) =>
          fs.existsSync(path.join(ra, js)) ? `src="${dau}${js}?v=${bam(path.join(ra, js))}"` : m));
      }
    },
  };
}

// Game là HTML tĩnh trong public/ (chép từ bản máy bằng tools/chep-game.py); chỉ màn mở đầu index.html đi qua Vite.
export default defineConfig({
  plugins: [ganPhienBan()],
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',              // AI Studio tắt HMR bằng DISABLE_HMR
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
