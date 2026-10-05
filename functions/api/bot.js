// Bot Will — bạn máy luyện nói tiếng Anh theo sách (giữ 🎤 để nói, public/bot.js). Mỗi lượt:
//   tiếng con (WAV 16 kHz base64) → Whisper (Workers AI) → Claude trả lời theo đúng phần sách + loại bài đang mở → Aura (Workers AI) đọc thành tiếng.
// Trả về: thân = tiếng mp3 của Will; header X-Bot = JSON {be_noi, phan, viet, reply, goi_y, dung, bi, sao, xong, ms} (encodeURIComponent).
// Giáo án theo loại bài (DAN "How to practise"), chấm từng lượt: dung / bi = mục (từ + mẫu câu, bot/ngu-canh.json "muc") con nói được / còn bí,
// sao = con nói trọn câu đúng. public/bot.js cộng dồn vào tiến độ pu3-bot-tien-do và gửi bản chụp đầu buổi (tien_do) để Will ôn mục còn yếu trước.
// Cloudflare Access đứng trước cả trang (chỉ Gmail anh An). Secret ANTHROPIC_API_KEY đặt trong Pages → power-up-3 → Settings → Variables and Secrets.
// Điều khoản Anthropic cho sản phẩm có trẻ em dùng (support.claude.com bài 9307344): báo là AI ngay đầu mỗi buổi, lọc nội dung, giám sát —
// lời dặn bên dưới + nhãn "bạn máy (AI)" trên khung chat + nhật ký pu3-bot-nk.
import Anthropic from '@anthropic-ai/sdk';
import NGU_CANH from '../../bot/ngu-canh.json';

// Sonnet 5.5 (anh chọn 04/10/2026): cache được lời dặn (từ 512 token; Haiku 4.5 phải ≥ 4096) nên rẻ hơn cả Haiku, tắt được phần nghĩ → nhanh.
// thinking between_tools chỉ Sonnet 5.5 nhận — đổi mô hình khác thì bỏ dòng thinking bên dưới.
const MO_HINH = 'claude-sonnet-5-5', GIONG = 'orion', MAX_LUOT = 10;   // MAX_LUOT: số lượt con nói mỗi buổi, tới đó Will chào tạm biệt
const loi = (s, status = 400) => Response.json({ ok: false, loi: s }, { status });
const LOAI = { chi: 'new words', 'ngu-phap': "grammar box (Grammar spotlight)", truyen: 'Diversicus story', chant: 'chant', hat: 'song',
               'van-hoc': 'reading story', 'bai-tap': 'listening exercise' };
const thao = ([d, b]) => d >= 2 && d > b;                  // "đã thạo" (Will bỏ qua, chỉ ôn nhanh); bảng 📊 của bố mẹ dễ hơn: đúng > bí

const DAN = p => `You are Will, a friendly cartoon turtle robot. You chat in spoken English with a young Vietnamese child who is learning from the Cambridge textbook "Power Up 3" (A1 Movers level). A parent sits next to the child.

How to talk:
- Speak like a warm primary school teacher. Each reply is at most 2 short sentences (about 20 words) and asks exactly one easy question, except when saying goodbye.
- Use only simple English at A1 Movers level: the words and sentence patterns of this part of the book, words the child learned before, numbers, everyday words.
- Correct answer: praise briefly ("Great!", "Well done!") and ask the next question.
- Wrong or half answer: never say "wrong". Say the correct full sentence and invite the child to say it ("It's a pencil. Can you say: It's a pencil?").
- The child's words come from speech recognition and may contain mistakes; guess the meaning generously. If it is empty, unclear or in Vietnamese, encourage the child and ask again more simply, or give two choices ("Is it red or blue?").
- Vietnamese help only when the child is stuck: silent or unclear, says they don't know, answers in Vietnamese, or misses the same question twice. Then put in viet one short, warm Vietnamese sentence (at most 20 words) telling the child what Will is asking and what they could say; call yourself "Will" and the child "bạn" (e.g. "Will hỏi cây bút ở trên bàn hay dưới bàn. Bạn nói: It's on the desk nhé!"). Will says viet first, then reply asks again in English. In every other turn viet is an empty string, and reply is always English only.
- Stay on the book. If the child says something off-topic, upsetting or personal, answer kindly in one sentence and go back to the book. Never ask for personal information beyond a first name and age, and if the child tells you where they live, their school or a phone number, do not repeat it. Never say anything scary, violent or unkind.
- First reply of a session: say hello, say "I'm Will, your robot friend.", then ask one easy question.
- When told the session is over: say goodbye warmly in one short sentence and set xong to true.

How to practise, by the lessons on the open pages (the session start message lists them; if there are several, start with the grammar box, then new words, then the chant or song, then the story, and move between them; on a page with a chant or song, do the chant/song practice at least once):
- new words: point-and-name quiz about things on the page: "What's this?", "What colour is the bag?", "How many pencils?".
- grammar box: practise its sentence pattern, changing the words each time, and ask for the full sentence answer.
- Diversicus story / reading story: ask about the story: who, where, what happened, using the story's own sentences.
- chant / song: say the first half of a line and let the child say the rest, then ask about a word in it.
- listening exercise: ask questions with the same words and sentences as the exercise.
- Progress from earlier sessions (in the session start message): start with one or two "needs practice" targets, then the open pages' lessons. Don't drill "confident" targets again, except a quick review near the end.

Targets of this part (use these exact strings, character for character, in dung and bi):
${p.muc.join('\n')}

Answer fields: viet = Vietnamese help Will says aloud first, or an empty string; reply = what Will says aloud in English (plain text, no emojis or symbols); goi_y = Vietnamese, at most 20 words, for the parent: what the child could answer (e.g. "Bé có thể nói: It's a pencil."); dung = targets the child said correctly in their LAST message (a word the child said themselves — not words that were only in Will's question — or a pattern they used in a sentence); bi = targets the child was asked about in their last message but could not say; both empty when the child has not answered yet; sao = true only when the child's last message was a complete, correct sentence using a target pattern or word; xong = true only when saying goodbye.

Part of the book: ${p.ten}
Words of this part: ${p.tu.join(', ') || '(review of earlier units)'}
Sentence patterns of this part: ${p.mau.join(' | ') || '(review of earlier units)'}
Words learned before: ${p.tu_cu.join(', ') || '(none yet)'}

Lessons of this part (book page, lesson title, type, audio transcript — transcripts may contain recognition errors):
${p.bai.map(b => `[page ${b.trang}] ${b.ten} (${LOAI[b.loai] || b.loai})\n${b.loi}`).join('\n\n')}`;

const chuoi = { type: 'array', items: { type: 'string' } };
const KHUON = {
  type: 'json_schema',
  schema: {
    type: 'object', additionalProperties: false, required: ['viet', 'reply', 'goi_y', 'dung', 'bi', 'sao', 'xong'],
    properties: { viet: { type: 'string' }, reply: { type: 'string' }, goi_y: { type: 'string' }, dung: chuoi, bi: chuoi, sao: { type: 'boolean' }, xong: { type: 'boolean' } },
  },
};

// Lời mở đầu buổi: trang đang mở + các bài trên đó (loại bài → cách luyện) + tiến độ các buổi trước. Giữ nguyên suốt buổi (client gửi lại
// đúng bản chụp tien_do đầu buổi) để tiền tố trùng nhau → cache được.
function moDau(p, trang, tien_do) {
  const so = trang.slice(0, 2).map(Number);   // sách 2–3: trang ảnh = trang sách (Power Up 1 lệch 2)
  const bai = p.bai.filter(b => so.includes(b.trang)).map(b => `[page ${b.trang}] ${b.ten} (${LOAI[b.loai] || b.loai})`);
  const td = p.muc.map(m => [m, tien_do?.[m]]), lam = td.filter(([, x]) => Array.isArray(x));
  const ds = f => lam.filter(([, x]) => f(x)).map(([m]) => m).join(' | ') || '(none)';
  return `Session start. The child has book page ${so.join(' and ')} open.\nLessons on these pages: ${bai.join('; ') || '(none — talk about this part of the book)'}\n` +
    (lam.length ? `Progress from earlier sessions — confident: ${ds(thao)}\nneeds practice: ${ds(x => !thao(x) && x[1] > 0)}\nnot practised yet: ${td.filter(([, x]) => !Array.isArray(x)).map(([m]) => m).slice(0, 12).join(' | ') || '(none)'}`
                : 'Progress from earlier sessions: this is the first session for this part.');
}

const tlJson = x => JSON.stringify({ viet: String(x.viet || '').slice(0, 300), reply: String(x.reply).slice(0, 400), goi_y: String(x.goi_y || '').slice(0, 200),
                                     dung: (x.dung || []).slice(0, 10).map(String), bi: (x.bi || []).slice(0, 10).map(String), sao: !!x.sao, xong: false });

// {trang: [p…], lich_su: [{ai: 'will', viet, reply, goi_y, dung, bi, sao} | {ai: 'be', chu}], am?: base64 WAV, tien_do?: {mục: [đúng, bí]}}
// viet (tiếng Việt khi con bí) do iPad tự đọc bằng giọng Việt có sẵn (public/bot.js) — Aura chỉ đọc tiếng Anh
export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return loi('Chưa có khoá ANTHROPIC_API_KEY trong Cloudflare Pages', 503);
  const { trang, lich_su = [], am, tien_do } = await request.json().catch(() => ({}));
  const ten = NGU_CANH.trang[trang?.[0]];
  if (!ten || !Array.isArray(lich_su) || lich_su.length > 2 * MAX_LUOT + 2 || (am && (typeof am !== 'string' || am.length > 3e6))
      || (tien_do && (typeof tien_do !== 'object' || JSON.stringify(tien_do).length > 40000))) return loi('sai-yeu-cau');
  const p = NGU_CANH.phan[ten], ms = {}, t0 = Date.now();

  let be_noi = null;
  if (am) {
    const r = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: am, language: 'en', initial_prompt: p.tu.concat(p.tu_cu).slice(0, 80).join(', ') });
    be_noi = (r?.text || '').trim().slice(0, 300);
    ms.nghe = Date.now() - t0;
  }

  const messages = [{ role: 'user', content: moDau(p, trang, tien_do) }];
  for (const x of lich_su) {
    if (x?.ai === 'will') messages.push({ role: 'assistant', content: tlJson(x) });
    else messages.push({ role: 'user', content: `Child: ${String(x?.chu || '').slice(0, 300) || '(silence or unclear)'}` });
  }
  if (be_noi !== null) messages.push({ role: 'user', content: `Child: ${be_noi || '(silence or unclear)'}` });
  if (messages.at(-1).role !== 'user') return loi('sai-thu-tu');
  if (messages.filter(m => m.role === 'user').length > MAX_LUOT) messages.push({ role: 'system', content: 'The session is over now: say goodbye.' });

  let tl;
  try {
    const t1 = Date.now();
    // qua Worker claude-sin (Singapore): iPad ở VN có lúc vào Cloudflare Hồng Kông, Anthropic chặn vùng đó (403 "Request not allowed", 05/10/2026).
    // Bài thử đặt ANTHROPIC_BASE_URL (Claude giả) thì gọi thẳng.
    const qua = env.CLAUDE && !env.ANTHROPIC_BASE_URL ? { fetch: (u, i) => env.CLAUDE.fetch(u, i) } : {};
    const { data: r, response } = await new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL, ...qua }).beta.messages.create({
      model: MO_HINH, max_tokens: 1000,
      thinking: { type: 'between_tools' },                 // không nghĩ trước khi trả lời (mức thấp nhất của Sonnet 5.5, cần effort ≤ high)
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',   // bị từ chối vì chính sách → máy chủ Anthropic tự chạy lại bằng mô hình dự phòng
      output_config: { effort: 'low', format: KHUON },
      cache_control: { type: 'ephemeral' },
      system: DAN(p), messages,
    }).withResponse();
    ms.nghi = Date.now() - t1;
    ms.noi = response.headers.get('x-claude-colo') || request.cf?.colo;   // máy chủ đã gọi Anthropic (soát: SIN)
    const chu = r.content.find(b => b.type === 'text')?.text;
    tl = r.stop_reason !== 'refusal' && chu ? JSON.parse(chu) : null;
  } catch (e) {
    return loi(`Claude: ${e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e.message}`.slice(0, 300), 502);
  }
  tl ||= { viet: '', reply: "Let's look at our book again! What can you see?", goi_y: '', dung: [], bi: [], sao: false, xong: false };
  const goc = new Map(p.muc.map(m => [m.toLowerCase(), m])), loc = ds => [...new Set((ds || []).map(m => goc.get(String(m).toLowerCase())).filter(Boolean))];
  tl.dung = loc(tl.dung); tl.bi = loc(tl.bi).filter(m => !tl.dung.includes(m));   // chỉ nhận đúng chuỗi mục của phần này
  tl.sao = !!tl.sao && tl.dung.length > 0;                 // ⭐ chỉ khi con thật sự nói đúng một mục
  const dau = { 'X-Bot': encodeURIComponent(JSON.stringify({ be_noi, phan: ten, ...tl, ms })), 'Cache-Control': 'no-store' };

  try {
    const tieng = await env.AI.run('@cf/deepgram/aura-1', { text: tl.reply, speaker: GIONG });
    return new Response(tieng, { headers: { ...dau, 'Content-Type': 'audio/mpeg' } });
  } catch {
    return new Response(null, { status: 204, headers: dau });   // không đọc được thì vẫn hiện chữ
  }
}
