// Tiến độ của con (mọi khoá localStorage "pu3-…": bài tập, sao, chữ viết, trang đang mở…) ở Cloudflare D1 `learning-english`, bảng tien_do
// (repo oup-5-game/sql/tien-do.sql, dùng chung với Phonics Wings 5 + Power Up 1–3) — binding DB trong wrangler.toml.
// Cloudflare Access đứng trước cả trang (chỉ Gmail anh An) — request tới được đây là đã đăng nhập.
const APP = 'pu3';
const loi = e => Response.json({ ok: false, loi: 'd1: ' + String(e?.message || e).slice(0, 200) }, { status: 502 });

// → {ok, du_lieu: {khoá: [giá trị, giờ sửa ms]}}
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('select khoa, gia_tri, cap_nhat from tien_do where app = ?').bind(APP).all();
    return Response.json({ ok: true, du_lieu: Object.fromEntries(results.map(x => [x.khoa, [x.gia_tri, x.cap_nhat]])) });
  } catch (e) { return loi(e); }
}

// {du_lieu: {khoá: [giá trị, giờ sửa ms]}} → chỉ ghi khoá mới hơn bản đang lưu; trả số khoá đã ghi
export async function onRequestPost({ request, env }) {
  const { du_lieu } = await request.json().catch(() => ({}));
  if (!du_lieu || typeof du_lieu !== 'object') return Response.json({ ok: false, loi: 'mat-body' }, { status: 400 });
  const du = Object.entries(du_lieu).filter(([k, v]) => k.startsWith(APP + '-') && Array.isArray(v));
  if (!du.length) return Response.json({ ok: true, ghi: 0 });
  const cau = env.DB.prepare(`insert into tien_do (app, khoa, gia_tri, cap_nhat) values (?, ?, ?, ?)
    on conflict (app, khoa) do update set gia_tri = excluded.gia_tri, cap_nhat = excluded.cap_nhat where tien_do.cap_nhat < excluded.cap_nhat`);
  try {
    const kq = await env.DB.batch(du.map(([k, v]) => cau.bind(APP, k, String(v[0]), +v[1] || Date.now())));
    return Response.json({ ok: true, ghi: kq.reduce((n, r) => n + r.meta.changes, 0) });
  } catch (e) { return loi(e); }
}
