/* NutriFuture – chạy hoàn toàn phía trình duyệt (phù hợp GitHub Pages) */
'use strict';

/* ================= Tiện ích ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const fmt = (n, d = 0) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const round1 = n => Math.round(n * 10) / 10;
const dayKey = (d = new Date()) => d.toLocaleDateString('sv-SE');
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600); };

const ALLERGENS = ['Đậu phộng', 'Tôm, cua', 'Nhuyễn thể', 'Cá', 'Trứng', 'Sữa', 'Đậu nành', 'Gluten', 'Mè'];

/* Món cơ bản bổ sung (ngoài 252 món) để tra cứu & dựng thực đơn */
const BASICS = [
  { id: 'b1', name: 'Cơm trắng', serving: '1 bát (150g)', kcal: 200, protein: 4, fat: 0.5, carb: 45, region: 'Cơ bản', province: '', allergens: [], micro: 'vitamin B1, magiê', basic: 'rice' },
  { id: 'b2', name: 'Chuối', serving: '1 quả (100g)', kcal: 90, protein: 1, fat: 0.3, carb: 23, region: 'Cơ bản', province: '', allergens: [], micro: 'kali, vitamin B6, C', basic: 'fruit' },
  { id: 'b3', name: 'Cam', serving: '1 quả (150g)', kcal: 62, protein: 1.2, fat: 0.2, carb: 15, region: 'Cơ bản', province: '', allergens: [], micro: 'vitamin C, folate', basic: 'fruit' },
  { id: 'b4', name: 'Ổi', serving: '1 quả (150g)', kcal: 85, protein: 3, fat: 1, carb: 18, region: 'Cơ bản', province: '', allergens: [], micro: 'vitamin C, chất xơ', basic: 'fruit' },
  { id: 'b5', name: 'Đu đủ', serving: '1 chén (150g)', kcal: 65, protein: 1, fat: 0.3, carb: 16, region: 'Cơ bản', province: '', allergens: [], micro: 'vitamin A, C', basic: 'fruit' },
  { id: 'b6', name: 'Dưa hấu', serving: '1 miếng (200g)', kcal: 60, protein: 1.2, fat: 0.3, carb: 15, region: 'Cơ bản', province: '', allergens: [], micro: 'vitamin A, C, nước', basic: 'fruit' },
  { id: 'b7', name: 'Táo', serving: '1 quả (150g)', kcal: 78, protein: 0.4, fat: 0.3, carb: 21, region: 'Cơ bản', province: '', allergens: [], micro: 'chất xơ, vitamin C', basic: 'fruit' },
  { id: 'b8', name: 'Trứng luộc', serving: '1 quả (50g)', kcal: 78, protein: 6, fat: 5, carb: 0.6, region: 'Cơ bản', province: '', allergens: ['Trứng'], micro: 'vitamin B12, D, choline', basic: 'protein' },
  { id: 'b9', name: 'Sữa tươi không đường', serving: '1 hộp (180ml)', kcal: 115, protein: 6, fat: 6, carb: 9, region: 'Cơ bản', province: '', allergens: ['Sữa'], micro: 'canxi, vitamin D, B2', basic: 'milk' },
];
const FOODS = window.FOODS.concat(BASICS);
const VEG_RE = /rau|cải|muống|canh|nộm|gỏi|ngó sen|củ hủ|hoa chuối|bắp cải/i;
const isVeg = f => f.basic === 'fruit' || (f.veg ?? VEG_RE.test(f.name));
const isVegetable = n => /rau|cải|muống|bắp cải|su su|bí|cà rốt|ngó sen|hoa chuối|củ hủ|nộm|gỏi|canh|dưa/i.test(n);

/* ================= Trạng thái ================= */
const KEY = 'nf_state_v1';
const defState = () => ({ profile: null, diary: {}, points: 0, streak: { last: '', n: 0 }, badges: [], lookups: [], daily: {}, quiz: null, quizPerfect: 0, weeklyDone: {}, themes: ['default'], theme: 'default', menu: null });
let S = defState();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(defState(), JSON.parse(raw)); } catch (e) { /* bỏ qua */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } };
const getKey = () => { try { return localStorage.getItem('nf_key') || ''; } catch (e) { return ''; } };
const getModel = () => { try { return localStorage.getItem('nf_model') || ''; } catch (e) { return ''; } };

/* ================= Hồ sơ / công thức ================= */
function calcProfile(p) {
  const h = p.h / 100, bmi = p.w / (h * h);
  let cat, cls = '';
  if (bmi < 18.5) { cat = 'Thiếu cân'; cls = 'warnk'; }
  else if (bmi < 23) cat = 'Bình thường';
  else if (bmi < 25) { cat = 'Thừa cân'; cls = 'warnk'; }
  else { cat = 'Béo phì'; cls = 'warnk'; }
  // Mifflin–St Jeor × hệ số vận động, làm tròn 50 kcal
  const bmr = 10 * p.w + 6.25 * p.h - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const kcal = Math.round(bmr * p.act / 50) * 50;
  const water = Math.round(p.w * 33 / 100) / 10; // 33 ml/kg
  return { bmi: round1(bmi), cat, cls, kcal, water, bmr: Math.round(bmr) };
}
const target = () => (S.profile ? calcProfile(S.profile).kcal : 2000);
const myAllergens = () => (S.profile ? S.profile.allergens : []);
const hits = f => (f.allergens || []).filter(a => myAllergens().includes(a));

/* ================= Điều hướng ================= */
const FEATURES = [
  { id: 'f1', ico: '🧑‍🎓', t: 'Hồ sơ & cảnh báo dị ứng', d: 'Tính BMI, nhu cầu calo, lượng nước và lưu hồ sơ dị ứng.' },
  { id: 'f2', ico: '🔍', t: 'Tra cứu dinh dưỡng', d: '252 món Bắc – Trung – Nam, chọn khẩu phần S/M/L.' },
  { id: 'f3', ico: '📷', t: 'Nhận diện bằng AI', d: 'Chụp ảnh món ăn, AI phân tích và cảnh báo dị ứng.' },
  { id: 'f4', ico: '🍱', t: 'Thực đơn khoa học', d: '3 bữa cân đối, đủ 4 nhóm chất, đổi món theo sở thích.' },
  { id: 'f5', ico: '📒', t: 'Nhật ký & theo dõi', d: 'Biểu đồ calo, phân tích Carb – Đạm – Béo, sao lưu JSON.' },
  { id: 'f6', ico: '🎮', t: 'Học mà chơi', d: 'Câu đố mỗi ngày, điểm, chuỗi ngày, huy hiệu, thử thách.' },
];
$('#featureCards').innerHTML = FEATURES.map((f, i) => `<button class="fcard" data-view="${f.id}"><div class="ico">${f.ico}</div><h3>${i + 1}. ${esc(f.t)}</h3><p>${esc(f.d)}</p></button>`).join('');

function show(id) {
  if (!$('#view-' + id)) id = 'home';
  $$('.view').forEach(v => v.hidden = v.id !== 'view-' + id);
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.view === id));
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  window.scrollTo({ top: 0 });
  if (id !== 'f3') stopCam();
  if (id === 'f4') renderMenu();
  if (id === 'f5') renderDiary();
  if (id === 'f6') renderGame();
  if (id === 'f1') renderProfile();
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-view]');
  if (a) { e.preventDefault(); show(a.dataset.view); }
});
window.addEventListener('hashchange', () => show(location.hash.slice(1) || 'home'));

/* ================= Điểm / huy hiệu ================= */
const BADGES = [
  { id: 'new', e: '🌱', n: 'Người mới', d: 'Tạo hồ sơ' },
  { id: 'explorer', e: '🧭', n: 'Nhà thám hiểm', d: 'Tra cứu 10 món' },
  { id: 'healthy', e: '🥦', n: 'Ăn uống lành mạnh', d: 'Một ngày đủ calo & có rau' },
  { id: 'diary20', e: '📒', n: 'Chăm ghi chép', d: '20 món trong nhật ký' },
  { id: 'streak7', e: '🔥', n: '7 ngày liên tục', d: 'Mở app 7 ngày liền' },
  { id: 'quiz', e: '🧠', n: 'Bộ óc dinh dưỡng', d: 'Đúng cả 5 câu đố' },
];
function award(pts, why) { S.points += pts; save(); header(); if (why) toast(`+${pts} điểm · ${why}`); }
function giveBadge(id) {
  if (S.badges.includes(id)) return;
  S.badges.push(id); save();
  const b = BADGES.find(x => x.id === id); toast(`🏅 Huy hiệu mới: ${b.n}`);
}
function header() { $('#ptsTxt').textContent = fmt(S.points); $('#streakTxt').textContent = S.streak.n; }
function touchStreak() {
  const t = dayKey(), y = dayKey(new Date(Date.now() - 864e5));
  if (S.streak.last === t) return;
  S.streak.n = S.streak.last === y ? S.streak.n + 1 : 1; S.streak.last = t;
  if (S.streak.n >= 7) giveBadge('streak7');
  save();
}
const dayState = () => (S.daily[dayKey()] ??= { look: [], logs: 0, healthy: false });

/* ================= Tính năng 1 ================= */
$('#allergyChecks').innerHTML = ALLERGENS.map(a => `<label><input type="checkbox" value="${esc(a)}">${esc(a)}</label>`).join('');
function renderProfile() {
  const p = S.profile;
  if (p) {
    $('#pName').value = p.name; $('#pAge').value = p.age; $('#pSex').value = p.sex; $('#pAct').value = p.act; $('#pH').value = p.h; $('#pW').value = p.w;
    $$('#allergyChecks input').forEach(c => c.checked = p.allergens.includes(c.value));
    const r = calcProfile(p);
    $('#profileResult').innerHTML = `<h3>Kết quả của ${esc(p.name)}</h3>
      <div class="kpis">
        <div class="kpi ${r.cls}"><small>Chỉ số BMI</small><b>${fmt(r.bmi, 1)}</b><br><em>${r.cat}</em></div>
        <div class="kpi"><small>Calo mỗi ngày</small><b>${fmt(r.kcal)}</b><br><em>kcal</em></div>
        <div class="kpi"><small>Nước mỗi ngày</small><b>${fmt(r.water, 1)}</b><br><em>lít</em></div>
      </div>
      ${p.allergens.length ? `<div class="alert">⚠️ <div>Hồ sơ dị ứng đã lưu: ${p.allergens.map(esc).join(', ')}.<br><span style="font-weight:500">Mọi món bạn tra cứu hoặc chụp ảnh sẽ được đối chiếu tự động.</span></div></div>` : `<div class="ok">✅ Bạn chưa khai báo dị ứng. Có thể cập nhật bất cứ lúc nào.</div>`}
      <p class="hint">BMI phân loại theo ngưỡng châu Á – Thái Bình Dương; calo theo công thức Mifflin–St Jeor nhân hệ số vận động; nước ≈ 33 ml/kg. Đây là ước tính tham khảo.</p>`;
  }
}
$('#profileForm').addEventListener('submit', e => {
  e.preventDefault();
  const age = +$('#pAge').value;
  if (age < 15 || age > 22) return toast('Tuổi hợp lệ từ 15 đến 22.');
  const first = !S.profile;
  S.profile = { name: $('#pName').value.trim(), age, sex: $('#pSex').value, act: +$('#pAct').value, h: +$('#pH').value, w: +$('#pW').value, allergens: $$('#allergyChecks input:checked').map(c => c.value) };
  save(); renderProfile(); toast('Đã lưu hồ sơ ✔');
  giveBadge('new'); if (first) award(10, 'tạo hồ sơ');
});

/* ================= Tính năng 2 ================= */
let region = 'Tất cả';
const REGIONS = ['Tất cả', 'Bắc', 'Trung', 'Nam', 'Hiện đại', 'Cơ bản'];
$('#regionFilters').innerHTML = REGIONS.map(r => `<button data-r="${r}" class="${r === region ? 'on' : ''}">${r === 'Hiện đại' ? 'Ăn vặt & đồ uống' : r === 'Cơ bản' ? 'Món cơ bản' : r === 'Tất cả' ? 'Tất cả' : 'Miền ' + r}</button>`).join('');
$('#regionFilters').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  region = b.dataset.r; $$('#regionFilters button').forEach(x => x.classList.toggle('on', x === b)); renderSuggest();
});
$('#foodlist').innerHTML = FOODS.map(f => `<option value="${esc(f.name)}">`).join('');

function searchFoods(q) {
  const n = norm(q), toks = n.split(/\s+/).filter(Boolean);
  let list = FOODS.filter(f => region === 'Tất cả' || f.region === region);
  if (!toks.length) return list;
  list = list.filter(f => { const m = norm(f.name); return toks.every(t => m.includes(t)); });
  return list.sort((a, b) => (norm(a.name).startsWith(n) ? 0 : 1) - (norm(b.name).startsWith(n) ? 0 : 1));
}
function renderSuggest() {
  const q = $('#q').value, list = searchFoods(q).slice(0, 60);
  $('#suggest').innerHTML = list.length ? list.map(f => `<button class="sug" data-id="${f.id}"><b>${esc(f.name)}</b><small>${fmt(f.kcal)} kcal · ${esc(f.serving)}</small></button>`).join('')
    : `<div class="muted" style="grid-column:1/-1">Không có trong cơ sở dữ liệu. ${getKey() ? '<button class="btn ghost" id="aiLookup">✨ Tra cứu bằng AI</button>' : 'Thêm khóa Gemini trong ⚙️ để tra cứu món bất kỳ bằng AI.'}</div>`;
}
$('#q').addEventListener('input', renderSuggest);
$('#qBtn').addEventListener('click', () => { const l = searchFoods($('#q').value); if (l.length) showFood(l[0]); else if (getKey()) aiLookup(); else renderSuggest(); });
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter') $('#qBtn').click(); });
$('#suggest').addEventListener('click', e => {
  if (e.target.id === 'aiLookup') return aiLookup();
  const b = e.target.closest('.sug'); if (b) showFood(FOODS.find(f => String(f.id) === b.dataset.id));
});

function advise(f, m) {
  const k = f.kcal * m, t = target(), tips = [];
  if (k > 0.4 * t) tips.push('Món này chiếm hơn 40% nhu cầu calo cả ngày — nên ăn nhẹ hơn ở các bữa còn lại.');
  if (f.fat * m > 25) tips.push('Khá nhiều chất béo, hạn chế ăn thường xuyên và nên kèm rau xanh.');
  if (f.carb * m > 70 && f.protein * m < 12) tips.push('Nhiều tinh bột/đường, ít đạm: nên bổ sung thêm trứng, cá, đậu hoặc thịt nạc.');
  if (f.protein * m >= 20) tips.push('Giàu đạm, tốt cho cơ và phát triển chiều cao.');
  if (!isVeg(f) && f.basic !== 'fruit') tips.push('Ăn kèm một đĩa rau hoặc trái cây để đủ chất xơ và vitamin.');
  if (f.region === 'Hiện đại' && f.carb * m > 35 && f.protein * m < 6) tips.push('Đồ uống/ăn vặt nhiều đường, chỉ nên dùng thỉnh thoảng; thay bằng nước lọc là tốt nhất.');
  if (isVeg(f)) tips.unshift('Món nhiều rau/trái cây, giúp bổ sung chất xơ và vitamin.');
  return tips.slice(0, 3);
}

/* Thẻ hiển thị món (dùng cho tra cứu và AI). mode: 'size' (S/M/L) hoặc 'qty' (Ít/Vừa/Nhiều) */
function foodCardHTML(f, m, mode) {
  const hit = hits(f), v = x => fmt(x * m, 1);
  const sizeBtns = mode === 'size' ? `<div class="seg" data-seg>${[['S', .7], ['M', 1], ['L', 1.3]].map(([l, x]) => `<button data-m="${x}" class="${x === m ? 'on' : ''}">Size ${l}</button>`).join('')}</div>` : '';
  return `<div class="food card">
    <h2>${esc(f.name)}</h2>
    <p class="muted">Khẩu phần chuẩn: ${esc(f.serving)}${f.province ? ` · Đặc sản: <b>${esc(f.province)}</b>` : ''}</p>
    ${hit.length ? `<div class="alert" role="alert">⚠️ <div>CẢNH BÁO: món này có chứa ${hit.map(esc).join(', ')}!<br><span style="font-weight:500">Trùng với hồ sơ dị ứng của bạn — không nên ăn.</span></div></div>` : (myAllergens().length ? `<div class="ok">✅ Không phát hiện thành phần trong hồ sơ dị ứng của bạn.</div>` : '')}
    ${sizeBtns}
    <div class="nutri">
      <div><b>${v(f.kcal)}</b><span>Calo (kcal)</span></div>
      <div><b>${v(f.protein)}</b><span>Đạm (g)</span></div>
      <div><b>${v(f.fat)}</b><span>Béo (g)</span></div>
      <div><b>${v(f.carb)}</b><span>Carb (g)</span></div>
    </div>
    <p><b>Vitamin &amp; khoáng chất nổi bật:</b> ${esc(f.micro || '—')} <span class="muted">(ước tính theo nhóm thực phẩm)</span></p>
    ${(f.allergens || []).length ? `<p><b>Có thể chứa:</b> ${f.allergens.map(a => `<span class="badge-tag ${myAllergens().includes(a) ? 'al' : ''}">${esc(a)}</span>`).join('')}</p>` : ''}
    ${advise(f, m).map(t => `<div class="tip">💡 ${esc(t)}</div>`).join('')}
    <div class="actions"><select data-meal style="width:auto;margin:0"><option>Sáng</option><option>Trưa</option><option>Tối</option><option>Phụ</option></select><button class="btn primary" data-save>📒 Lưu vào nhật ký</button></div>
  </div>`;
}
function mountFood(container, f, mode, m0 = 1) {
  let m = m0;
  const draw = () => {
    container.innerHTML = foodCardHTML(f, m, mode);
    $$('[data-seg] button', container).forEach(b => b.onclick = () => { m = +b.dataset.m; draw(); });
    $('[data-save]', container).onclick = () => { addEntry(f, m, $('[data-meal]', container).value); };
  };
  draw();
  return { set(x) { m = x; draw(); } };
}
function showFood(f) {
  if (!f) return;
  mountFood($('#foodDetail'), f, 'size');
  $('#foodDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const d = dayState();
  if (!S.lookups.includes(f.name)) { S.lookups.push(f.name); if (S.lookups.length >= 10) giveBadge('explorer'); }
  if (!d.look.includes(f.name) && d.look.length < 5) { d.look.push(f.name); award(2, 'tra cứu'); } else save();
}

/* ================= Gemini ================= */
const MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
async function gemini(parts, { json = true } = {}) {
  const key = getKey();
  if (!key) throw new Error('NOKEY');
  const custom = getModel();
  let cand = custom ? [custom] : MODELS;
  let remembered = ''; try { remembered = sessionStorage.getItem('nf_okmodel') || ''; } catch (e) { /* */ }
  if (!custom && remembered) cand = [remembered, ...cand.filter(x => x !== remembered)];
  let lastErr;
  for (const m of cand) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.2, ...(json ? { responseMimeType: 'application/json' } : {}) } }),
    }).catch(() => null);
    if (!r) { lastErr = new Error('NETWORK'); continue; }
    if (r.ok) {
      const data = await r.json();
      const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      if (!txt) { lastErr = new Error('EMPTY'); continue; }
      try { sessionStorage.setItem('nf_okmodel', m); } catch (e) { /* */ }
      return json ? JSON.parse(txt.replace(/^```(?:json)?|```$/g, '').trim()) : txt;
    }
    if (r.status === 429) throw new Error('QUOTA');
    if (r.status === 400 || r.status === 403) { const t = await r.text(); if (/API key|API_KEY|PERMISSION/i.test(t)) throw new Error('BADKEY'); }
    lastErr = new Error('HTTP' + r.status);
  }
  throw lastErr || new Error('FAIL');
}
function aiError(e) {
  const m = { NOKEY: 'Chưa có khóa Gemini. Bấm ⚙️ để nhập (xem README).', BADKEY: 'Khóa API không hợp lệ. Kiểm tra lại trong ⚙️.', QUOTA: 'Đã hết hạn mức miễn phí tạm thời. Hãy thử lại sau ít phút.', NETWORK: 'Không kết nối được tới Gemini. Kiểm tra mạng.', EMPTY: 'AI không trả về kết quả. Thử ảnh/từ khóa khác.' };
  return m[e.message] || 'Lỗi AI (' + esc(e.message) + '). Thử lại sau.';
}
const FOOD_PROMPT = `Bạn là chuyên gia dinh dưỡng Việt Nam. Phân tích món ăn được cung cấp (ảnh hoặc tên) và CHỈ trả về JSON:
{"recognized":true|false,"name":"tên món tiếng Việt","serving":"khẩu phần chuẩn, vd 1 tô (450g)","kcal":number,"protein":number,"fat":number,"carb":number,"allergens":[...],"province":"","micro":"2-3 vitamin/khoáng chất nổi bật","is_veg":true|false}
- Giá trị dinh dưỡng cho 1 khẩu phần chuẩn của món.
- "allergens" chỉ gồm các giá trị trong danh sách: ${ALLERGENS.join(' | ')}. Liệt kê MỌI thành phần có thể gây dị ứng (kể cả nước chấm, nước dùng).
- "province": tỉnh/thành phố đặc sản theo đơn vị hành chính mới (sau sáp nhập 2025); để "" nếu món phổ biến khắp nơi.
- Nếu không phải món ăn/thực phẩm, đặt "recognized": false.`;
function toFood(r) {
  const n = x => Math.max(0, +x || 0);
  return { id: 'ai-' + Date.now(), name: String(r.name || 'Món ăn'), serving: String(r.serving || '1 phần'), kcal: n(r.kcal), protein: n(r.protein), fat: n(r.fat), carb: n(r.carb), province: String(r.province || ''), allergens: (r.allergens || []).filter(a => ALLERGENS.includes(a)), micro: String(r.micro || ''), veg: !!r.is_veg, region: 'AI', ai: true };
}
async function aiLookup() {
  const q = $('#q').value.trim(); if (!q) return;
  const box = $('#foodDetail'); box.innerHTML = `<div class="card"><span class="spin"></span>AI đang tra cứu “${esc(q)}”…</div>`;
  try {
    const r = await gemini([{ text: FOOD_PROMPT + '\nTên món: ' + q }]);
    if (!r.recognized) { box.innerHTML = '<div class="card">Không nhận ra đây là món ăn. Hãy thử từ khóa khác.</div>'; return; }
    showFoodObj(toFood(r));
  } catch (e) { box.innerHTML = `<div class="card alert">${aiError(e)}</div>`; }
}
function showFoodObj(f) { mountFood($('#foodDetail'), f, 'size'); const d = dayState(); if (!d.look.includes(f.name) && d.look.length < 5) { d.look.push(f.name); award(2, 'tra cứu'); } }

/* ================= Tính năng 3: camera ================= */
let stream = null, qtyM = 1, lastAI = null, aiView = null;
const video = $('#video'), prev = $('#preview');
async function startCam() {
  if (!navigator.mediaDevices?.getUserMedia) { toast('Trình duyệt không hỗ trợ camera — hãy dùng “Thêm hình ảnh”.'); return false; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = stream; await video.play(); video.style.display = 'block'; prev.hidden = true; $('#camEmpty').hidden = true; $('#camStart').textContent = 'Tắt camera'; return true;
  } catch (e) { toast('Không mở được camera (cần cho phép quyền, và chạy qua https).'); return false; }
}
function stopCam() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } video.style.display = 'none'; $('#camStart').textContent = 'Bật camera'; if (prev.hidden) $('#camEmpty').hidden = false; }
video.style.display = 'none';
$('#camStart').onclick = () => stream ? stopCam() : startCam();
$('#shutter').onclick = async () => {
  if (!stream) { await startCam(); return; }
  const c = document.createElement('canvas'); await shrink(video, video.videoWidth, video.videoHeight, c);
  stopCam(); analyze(c.toDataURL('image/jpeg', .82));
};
$('#fileIn').onchange = e => {
  const file = e.target.files[0]; if (!file) return; e.target.value = '';
  const img = new Image(); img.onload = async () => { const c = document.createElement('canvas'); await shrink(img, img.naturalWidth, img.naturalHeight, c); URL.revokeObjectURL(img.src); stopCam(); analyze(c.toDataURL('image/jpeg', .82)); };
  img.onerror = () => toast('Không đọc được ảnh này.'); img.src = URL.createObjectURL(file);
};
async function shrink(src, w, h, c) { const s = Math.min(1, 768 / Math.max(w, h)); c.width = Math.round(w * s); c.height = Math.round(h * s); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); }
$('#qtySeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#qtySeg button').forEach(x => x.classList.toggle('on', x === b)); qtyM = +b.dataset.q; if (aiView) aiView.set(qtyM);
});
async function analyze(dataUrl) {
  prev.src = dataUrl; prev.hidden = false; $('#camEmpty').hidden = true;
  const out = $('#aiResult'); out.innerHTML = '<h3>Kết quả</h3><p><span class="spin"></span>AI đang nhận diện món ăn…</p>'; aiView = null;
  try {
    const r = await gemini([{ text: FOOD_PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: dataUrl.split(',')[1] } }]);
    if (!r.recognized) { out.innerHTML = '<h3>Kết quả</h3><p>Không nhận ra món ăn trong ảnh. Hãy chụp gần hơn, đủ sáng.</p>'; return; }
    lastAI = toFood(r); out.innerHTML = '<h3>Kết quả</h3><div id="aiCard"></div>';
    aiView = mountFood($('#aiCard'), lastAI, 'qty', qtyM);
    const d = dayState(); if (!d.look.includes(lastAI.name) && d.look.length < 5) { d.look.push(lastAI.name); award(2, 'nhận diện món'); }
  } catch (e) { out.innerHTML = `<h3>Kết quả</h3><div class="alert">${aiError(e)}</div>`; }
}

/* ================= Tính năng 4: thực đơn ================= */
const pick = a => a[Math.floor(Math.random() * a.length)];
const safe = f => hits(f).length === 0;
function pools() {
  const base = FOODS.filter(f => !f.basic && f.region !== 'Hiện đại' && safe(f));
  const sweet = /chè|bánh (cốm|khảo|đậu xanh|phu|tro|ít|thuẫn|in|bò|chuối|pía|da lợn|ống|gừng)|kẹo|mè xửng|sữa chua|rau câu|sương sáo|chuối nếp|khoai/i;
  const bf = base.filter(f => /phở|bún|miến|bánh cuốn|xôi|cháo|bánh mì|bánh canh|hủ tiếu|bánh bèo|bánh giò|bánh đúc|mì quảng|bánh khúc|bánh hỏi|cao lầu/i.test(f.name) && f.kcal <= 560 && !/đậu mắm|giả cầy|bung/i.test(f.name));
  const veg = base.filter(f => VEG_RE.test(f.name) && f.kcal <= 200 && !sweet.test(f.name));
  const main = base.filter(f => /kho|luộc|nướng|xào|hấp|rim|chiên|gà|cá|sườn|thịt|bò|vịt|tôm|chả|đậu/i.test(f.name) && !bf.includes(f) && !veg.includes(f) && !sweet.test(f.name) && f.kcal <= 480 && f.protein >= 14 && !/lẩu|bánh|nem rán|nem chua|gà tần/i.test(f.name));
  const fruit = BASICS.filter(f => f.basic === 'fruit' && safe(f));
  const rice = BASICS[0];
  return { bf, veg, main, fruit, rice };
}
function buildMenu() {
  const T = target(), P = pools(), meals = [];
  const split = [['Bữa sáng', .27], ['Bữa trưa', .40], ['Bữa tối', .33]];
  split.forEach(([name, share], i) => {
    let best = null;
    for (let t = 0; t < 80; t++) {
      let items;
      if (i === 0) items = [{ f: pick(P.bf), m: 1 }, { f: pick(P.fruit), m: 1 }];
      else items = [{ f: P.rice, m: 1 }, { f: pick(P.main), m: 1 }, { f: pick(P.veg), m: 1 }, { f: pick(P.fruit), m: 1 }];
      if (items.some(x => !x.f)) continue;
      // chỉnh khẩu phần cơm/món chính (S/M/L) cho sát mục tiêu bữa
      const goal = T * share;
      const tot = () => items.reduce((s, x) => s + x.f.kcal * x.m, 0);
      for (const idx of (i === 0 ? [0] : [0, 1])) { let bm = 1, bd = Infinity; for (const m of [.7, 1, 1.3]) { items[idx].m = m; const d = Math.abs(tot() - goal); if (d < bd) { bd = d; bm = m; } } items[idx].m = bm; }
      const diff = Math.abs(tot() - goal);
      if (!best || diff < best.diff) best = { diff, items: items.map(x => ({ f: x.f, m: x.m })) };
    }
    meals.push({ name, items: best ? best.items : [] });
  });
  return meals;
}
function renderMenu() {
  const out = $('#menuOut');
  if (!S.menu) return;
  const meals = S.menu.map(m => ({ name: m.name, items: m.items.map(x => ({ f: FOODS.find(f => String(f.id) === String(x.id)), m: x.m })).filter(x => x.f) }));
  const T = target(), sum = (k) => meals.reduce((s, m) => s + m.items.reduce((a, x) => a + x.f[k] * x.m, 0), 0);
  const all = meals.flatMap(m => m.items.map(x => x.f));
  const groups = [['Bột đường', all.some(f => f.carb >= 30 || f.basic === 'rice')], ['Đạm', all.some(f => f.protein >= 14 || f.basic === 'protein')], ['Béo', all.some(f => f.fat >= 5)], ['Vitamin & khoáng', all.some(f => isVeg(f))]];
  const sz = m => m === .7 ? 'S' : m === 1.3 ? 'L' : m === 1.6 ? 'XL' : 'M';
  out.innerHTML = `<p>Mục tiêu: <b>${fmt(T)} kcal</b> · Thực đơn: <b>${fmt(sum('kcal'))} kcal</b> · Đạm ${fmt(sum('protein'))}g · Béo ${fmt(sum('fat'))}g · Carb ${fmt(sum('carb'))}g</p>
    <div class="groups">${groups.map(([n, ok]) => `<span class="badge-tag ${ok ? '' : 'al'}">${ok ? '✔' : '✖'} ${n}</span>`).join('')}<span class="badge-tag">🥬 Có rau xanh</span><span class="badge-tag">🍊 Có trái cây</span></div>
    ${myAllergens().length ? `<div class="ok">Đã loại các món chứa: ${myAllergens().map(esc).join(', ')}.</div>` : ''}
    <div class="meals">${meals.map(m => `<div class="meal"><h4>${m.name}<small>${fmt(m.items.reduce((a, x) => a + x.f.kcal * x.m, 0))} kcal</small></h4><ul>${m.items.map(x => `<li>${esc(x.f.name)} <small class="muted">(${sz(x.m)} · ${fmt(x.f.kcal * x.m)} kcal)</small></li>`).join('')}</ul><button class="btn ghost" data-logmeal="${esc(m.name)}" style="margin-top:8px;padding:6px 10px">📒 Ghi vào nhật ký</button></div>`).join('')}</div>`;
  $('#menuAgain').hidden = false; $('#menuGen').textContent = 'Tạo lại thực đơn';
  $$('[data-logmeal]', out).forEach(b => b.onclick = () => { const m = meals.find(x => x.name === b.dataset.logmeal); const tag = m.name.replace('Bữa ', '').replace(/^./, c => c.toUpperCase()); m.items.forEach(x => addEntry(x.f, x.m, tag, true)); toast('Đã ghi ' + m.name.toLowerCase() + ' vào nhật ký'); });
}
function genMenu() {
  const meals = buildMenu();
  if (meals.some(m => !m.items.length)) return toast('Không đủ món phù hợp với hồ sơ dị ứng của bạn.');
  S.menu = meals.map(m => ({ name: m.name, items: m.items.map(x => ({ id: x.f.id, m: x.m })) })); save(); renderMenu();
}
$('#menuGen').onclick = genMenu; $('#menuAgain').onclick = genMenu;

/* ================= Tính năng 5: nhật ký ================= */
let curDay = dayKey();
function addEntry(f, m, meal, quiet) {
  const hit = hits(f);
  if (hit.length && !quiet && !confirm(`Món này chứa ${hit.join(', ')} — trùng hồ sơ dị ứng của bạn. Vẫn lưu vào nhật ký?`)) return;
  const day = (S.diary[dayKey()] ??= []);
  day.push({ id: Date.now() + Math.random(), name: f.name, kcal: round1(f.kcal * m), protein: round1(f.protein * m), fat: round1(f.fat * m), carb: round1(f.carb * m), m, meal, veg: isVeg(f), vegetable: isVegetable(f.name) || f.veg === true });
  const d = dayState(); d.logs++;
  const total = Object.values(S.diary).reduce((s, a) => s + a.length, 0); if (total >= 20) giveBadge('diary20');
  checkHealthy(dayKey());
  save(); if (!quiet) toast('Đã lưu vào nhật ký ✔');
  if (d.logs <= 6) award(5, 'ghi nhật ký'); else save();
  if (!$('#view-f5').hidden) renderDiary();
}
function checkHealthy(k) {
  const es = S.diary[k] || [], kcal = es.reduce((s, e) => s + e.kcal, 0), t = target(), d = (S.daily[k] ??= { look: [], logs: 0, healthy: false });
  if (!d.healthy && kcal >= .85 * t && kcal <= 1.15 * t && es.filter(e => e.veg).length >= 2) { d.healthy = true; giveBadge('healthy'); award(20, 'ngày ăn uống lành mạnh'); }
}
function renderDiary() {
  $('#dDate').value = curDay;
  const es = S.diary[curDay] || [], t = target();
  const sum = k => es.reduce((s, e) => s + e[k], 0), kcal = sum('kcal');
  drawDonut(kcal, t);
  const tg = { carb: t * .55 / 4, protein: t * .15 / 4, fat: t * .30 / 9 };
  const rows = [['Carb', 'carb', 'g'], ['Đạm (Protein)', 'protein', 'g'], ['Béo (Fat)', 'fat', 'g']];
  $('#macroBars').innerHTML = rows.map(([n, k]) => { const v = sum(k), p = Math.min(100, v / tg[k] * 100); return `<div class="bar-row"><small><span>${n}</span><span>${fmt(v)} / ${fmt(tg[k])} g</span></small><div class="track"><i style="width:${p}%"></i></div></div>`; }).join('');
  const adv = [], veg = es.filter(e => e.veg).length;
  if (!es.length) adv.push('Hãy thêm món bạn đã ăn để nhận lời khuyên.');
  else {
    if (veg < 2) adv.push('Hôm nay bạn thiếu chất xơ — thêm rau xanh hoặc trái cây nhé.');
    if (kcal < .7 * t) adv.push(`Mới nạp ${fmt(kcal / t * 100)}% nhu cầu năng lượng; đừng bỏ bữa.`);
    if (kcal > 1.15 * t) adv.push('Bạn đã vượt mục tiêu calo; chọn món nhẹ hơn cho bữa sau.');
    if (sum('protein') < .7 * tg.protein && kcal > .5 * t) adv.push('Lượng đạm còn thấp — thêm trứng, cá, thịt nạc hoặc đậu.');
    if (sum('fat') > 1.25 * tg.fat) adv.push('Chất béo hơi cao — hạn chế đồ chiên rán.');
    if (!adv.length) adv.push('Tuyệt vời! Khẩu phần hôm nay khá cân đối.');
  }
  $('#advice').innerHTML = `<h3>💡 Lời khuyên hôm nay</h3><ul class="advice">${adv.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
  $('#entries').innerHTML = es.length ? es.map(e => `<li><div><b>${esc(e.name)}</b> <span class="badge-tag">${esc(e.meal)}</span><small>${fmt(e.kcal)} kcal · Đ ${fmt(e.protein, 1)}g · B ${fmt(e.fat, 1)}g · C ${fmt(e.carb, 1)}g</small></div><button data-del="${e.id}" aria-label="Xóa">✕</button></li>`).join('') : '<li class="muted">Chưa có món nào.</li>';
}
function drawDonut(v, t) {
  const c = $('#donut'), x = c.getContext('2d'), W = c.width, cs = getComputedStyle(document.documentElement);
  x.clearRect(0, 0, W, W); const r = W / 2 - 22, cx = W / 2, p = Math.min(v / t, 1);
  x.lineWidth = 26; x.lineCap = 'round';
  x.strokeStyle = cs.getPropertyValue('--line').trim(); x.beginPath(); x.arc(cx, cx, r, 0, 7); x.stroke();
  if (v > 0) { x.strokeStyle = v > 1.15 * t ? '#dc2626' : v > t ? '#f59e0b' : cs.getPropertyValue('--brand').trim(); x.beginPath(); x.arc(cx, cx, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); x.stroke(); }
  x.fillStyle = cs.getPropertyValue('--ink').trim(); x.textAlign = 'center'; x.font = '700 40px system-ui,sans-serif'; x.fillText(fmt(v), cx, cx + 8);
  x.fillStyle = cs.getPropertyValue('--muted').trim(); x.font = '500 16px system-ui,sans-serif'; x.fillText(`/ ${fmt(t)} kcal`, cx, cx + 34);
}
$('#entries').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; S.diary[curDay] = (S.diary[curDay] || []).filter(x => String(x.id) !== b.dataset.del); save(); renderDiary(); });
$('#dDate').onchange = e => { curDay = e.target.value || dayKey(); renderDiary(); };
$('#dPrev').onclick = () => { const d = new Date(curDay); d.setDate(d.getDate() - 1); curDay = dayKey(d); renderDiary(); };
$('#dNext').onclick = () => { const d = new Date(curDay); d.setDate(d.getDate() + 1); curDay = dayKey(d); renderDiary(); };
$('#diaryAdd').onclick = () => {
  const f = FOODS.find(x => norm(x.name) === norm($('#diaryQ').value)) || searchFoods($('#diaryQ').value)[0];
  if (!f) return toast('Không tìm thấy món này.');
  const saved = dayKey; addEntryTo(curDay, f, +$('#diarySize').value, $('#diaryMeal').value); $('#diaryQ').value = '';
};
function addEntryTo(day, f, m, meal) { const real = dayKey(); if (day === real) return addEntry(f, m, meal); (S.diary[day] ??= []).push({ id: Date.now() + Math.random(), name: f.name, kcal: round1(f.kcal * m), protein: round1(f.protein * m), fat: round1(f.fat * m), carb: round1(f.carb * m), m, meal, veg: isVeg(f), vegetable: isVegetable(f.name) }); save(); renderDiary(); }
$('#expBtn').onclick = () => {
  const blob = new Blob([JSON.stringify({ app: 'NutriFuture', version: 1, exported: new Date().toISOString(), state: { profile: S.profile, diary: S.diary, points: S.points, streak: S.streak, badges: S.badges, lookups: S.lookups, themes: S.themes, theme: S.theme } }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nutrifuture-${dayKey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('#impIn').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); if (j.app !== 'NutriFuture' || !j.state) throw 0;
    const s = j.state; if (typeof s.diary !== 'object') throw 0;
    S = Object.assign(defState(), S, { profile: s.profile ?? S.profile, diary: s.diary, points: +s.points || 0, streak: s.streak || S.streak, badges: Array.isArray(s.badges) ? s.badges : [], lookups: Array.isArray(s.lookups) ? s.lookups : [], themes: Array.isArray(s.themes) ? s.themes : ['default'], theme: s.theme || 'default' });
    save(); applyTheme(); header(); renderDiary(); toast('Đã khôi phục dữ liệu ✔');
  } catch (err) { toast('File JSON không hợp lệ.'); }
};

/* ================= Tính năng 6: gamification ================= */
const QBANK = [
  [1, 'Nhóm chất nào là nguồn năng lượng chính của cơ thể?', ['Chất bột đường (carb)', 'Vitamin', 'Chất khoáng', 'Nước'], 0, 'Carbohydrate cung cấp phần lớn năng lượng cho cơ thể.'],
  [1, 'Một người trưởng thành nên uống khoảng bao nhiêu nước mỗi ngày?', ['200 ml', '1,5–2 lít', '5 lít', 'Chỉ khi khát'], 1, 'Khoảng 1,5–2 lít (tùy cân nặng, thời tiết, vận động).'],
  [1, 'Thực phẩm nào giàu chất đạm?', ['Kẹo', 'Trứng', 'Nước ngọt', 'Mỡ heo'], 1, 'Trứng, thịt, cá, đậu là nguồn đạm tốt.'],
  [1, 'Rau xanh chủ yếu cung cấp gì?', ['Chất xơ và vitamin', 'Chỉ có đường', 'Chỉ có mỡ', 'Không có gì'], 0, 'Rau cung cấp chất xơ, vitamin và khoáng chất.'],
  [1, 'Bữa nào không nên bỏ để có đủ năng lượng học tập?', ['Bữa sáng', 'Không bữa nào', 'Chỉ bữa khuya', 'Bữa vặt'], 0, 'Bữa sáng giúp tỉnh táo, tập trung.'],
  [2, '1 gram chất béo cung cấp khoảng bao nhiêu kcal?', ['4 kcal', '7 kcal', '9 kcal', '2 kcal'], 2, 'Béo 9 kcal/g; đạm và carb đều 4 kcal/g.'],
  [2, 'Chất dinh dưỡng nào giúp xây dựng và sửa chữa cơ bắp?', ['Protein', 'Muối', 'Đường', 'Nước đá'], 0, 'Protein là “viên gạch” của cơ bắp.'],
  [2, 'Canxi và vitamin D quan trọng nhất cho bộ phận nào?', ['Xương', 'Tóc', 'Móng tay', 'Mắt'], 0, 'Chúng giúp xương chắc khỏe, rất cần khi dậy thì.'],
  [2, 'Vitamin C có nhiều trong…', ['Cam, ổi', 'Mỡ lợn', 'Muối', 'Đường'], 0, 'Cam, ổi, bưởi, ớt chuông giàu vitamin C.'],
  [2, 'Chỉ số BMI được tính bằng công thức nào?', ['Cân nặng (kg) / chiều cao² (m)', 'Chiều cao / cân nặng', 'Cân nặng × chiều cao', 'Tuổi / cân nặng'], 0, 'BMI = kg / m².'],
  [2, 'Thiếu sắt lâu ngày dễ gây ra tình trạng nào?', ['Thiếu máu', 'Cao lên nhanh', 'Béo phì', 'Sâu răng'], 0, 'Sắt cần để tạo hồng cầu.'],
  [2, 'Cách chế biến nào thường ít béo nhất?', ['Luộc, hấp', 'Chiên ngập dầu', 'Rán giòn', 'Xào nhiều mỡ'], 0, 'Luộc, hấp, nướng ít dầu giúp giảm béo.'],
  [3, 'Chất xơ có lợi chính nào sau đây?', ['Hỗ trợ tiêu hóa, no lâu', 'Tăng cholesterol', 'Cung cấp nhiều calo', 'Phá hủy vitamin'], 0, 'Chất xơ giúp nhu động ruột tốt và no lâu.'],
  [3, 'Với người dị ứng đậu phộng, nên làm gì?', ['Đọc kỹ thành phần, tránh hoàn toàn', 'Ăn một ít để quen', 'Chỉ tránh khi ăn nhiều', 'Không cần quan tâm'], 0, 'Dị ứng có thể nguy hiểm, cần tránh hoàn toàn và đọc nhãn.'],
  [3, 'Theo khuyến nghị chung, năng lượng từ chất béo nên chiếm khoảng bao nhiêu % tổng calo?', ['20–35%', '70–80%', '0%', '50–60%'], 0, 'Khoảng 20–35% tổng năng lượng.'],
  [3, 'Vì sao nên hạn chế đồ uống có đường (trà sữa, nước ngọt)?', ['Nhiều calo “rỗng”, dễ thừa cân, sâu răng', 'Chứa quá nhiều chất xơ', 'Làm cao nhanh', 'Giàu đạm'], 0, 'Đường tự do cho năng lượng cao nhưng ít dưỡng chất.'],
  [3, 'Omega-3 có nhiều trong…', ['Cá béo (cá hồi, cá thu)', 'Bánh kẹo', 'Nước ngọt', 'Cơm trắng'], 0, 'Cá béo cung cấp omega-3 tốt cho tim mạch và não.'],
  [3, 'Chỉ số “khẩu phần” S/M/L trong NutriFuture dùng để…', ['Điều chỉnh lượng calo theo phần ăn thực tế', 'Đổi tên món', 'Xóa nhật ký', 'Tăng điểm'], 0, 'Lượng dinh dưỡng được nhân theo 70% / 100% / 130%.'],
];
function seedRand(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
function localQuiz(k) {
  const R = seedRand(k + (S.quiz?.gen || 0)), by = d => QBANK.filter(q => q[0] === d).sort(() => R() - .5);
  const sel = [...by(1).slice(0, 2), ...by(2).slice(0, 2), ...by(3).slice(0, 1)];
  return sel.map(q => ({ d: q[0], q: q[1], o: q[2], a: q[3], e: q[4] }));
}
async function ensureQuiz(force) {
  const k = dayKey();
  if (!force && S.quiz && S.quiz.date === k) return;
  const gen = force ? (S.quiz?.gen || 0) + 1 : 0;
  let qs = null, src = 'bộ câu hỏi có sẵn';
  if (getKey()) {
    $('#quiz').innerHTML = '<p><span class="spin"></span>AI đang tạo 5 câu đố mới…</p>';
    try {
      const r = await gemini([{ text: `Tạo 5 câu hỏi trắc nghiệm tiếng Việt về dinh dưỡng cho học sinh THPT, độ khó tăng dần từ dễ đến khó (d=1,1,2,2,3). Chủ đề đa dạng, mỗi lần khác nhau (mã ngẫu nhiên: ${Math.random().toString(36).slice(2, 8)}). Chỉ trả JSON dạng mảng: [{"d":1,"q":"câu hỏi","o":["A","B","C","D"],"a":0,"e":"giải thích ngắn"}] với a là chỉ số đáp án đúng (0-3), đúng 4 lựa chọn, chỉ một đáp án đúng, thông tin khoa học chính xác.` }]);
      if (Array.isArray(r) && r.length >= 5 && r.every(x => x.q && Array.isArray(x.o) && x.o.length === 4 && Number.isInteger(x.a) && x.a >= 0 && x.a < 4)) { qs = r.slice(0, 5).map((x, i) => ({ d: x.d || [1, 1, 2, 2, 3][i], q: String(x.q), o: x.o.map(String), a: x.a, e: String(x.e || '') })); src = 'tạo bởi AI Gemini'; }
    } catch (e) { /* dùng bộ có sẵn */ }
  }
  S.quiz = { date: k, gen, src, qs: qs || localQuiz(k), ans: [null, null, null, null, null] }; save();
}
async function renderGame() {
  const wk = weeklyInfo();
  $('#gameStats').innerHTML = `<div class="kpi"><small>Điểm thưởng</small><b>⭐ ${fmt(S.points)}</b></div><div class="kpi"><small>Chuỗi ngày</small><b>🔥 ${S.streak.n}</b></div><div class="kpi"><small>Huy hiệu</small><b>🏅 ${S.badges.length}/${BADGES.length}</b></div>`;
  $('#weekly').innerHTML = `<p><b>Ăn 5 loại rau củ khác nhau</b> trong tuần này.</p><div class="track"><i style="width:${Math.min(100, wk.n / 5 * 100)}%"></i></div><p class="muted">${wk.n}/5 loại${wk.list.length ? ': ' + wk.list.map(esc).join(', ') : ''}${wk.done ? ' · 🎉 Hoàn thành (+50 điểm)' : ''}</p>`;
  $('#badges').innerHTML = BADGES.map(b => `<div class="bdg ${S.badges.includes(b.id) ? '' : 'off'}"><span class="e">${b.e}</span><b>${esc(b.n)}</b><small>${esc(b.d)}</small></div>`).join('');
  const TH = [['default', 'Xanh lá', '#16a34a', 0], ['sunset', 'Hoàng hôn', '#ea580c', 100], ['ocean', 'Đại dương', '#0284c7', 200], ['grape', 'Nho tím', '#7c3aed', 300]];
  $('#themes').innerHTML = TH.map(([id, n, c, cost]) => { const own = S.themes.includes(id); return `<button class="theme ${S.theme === id ? 'on' : ''}" data-theme="${id}" data-cost="${cost}"><i style="background:${c}"></i>${n}${own ? '' : ` · 🔒 ${cost}⭐`}</button>`; }).join('');
  await ensureQuiz(false); renderQuiz();
}
function renderQuiz() {
  const q = S.quiz; if (!q) return;
  $('#quizSrc').textContent = '· ' + q.src;
  const done = q.ans.every(a => a !== null), score = q.qs.reduce((s, x, i) => s + (q.ans[i] === x.a ? 1 : 0), 0);
  $('#quiz').innerHTML = q.qs.map((x, i) => `<div class="q"><small>Câu ${i + 1} · ${['', 'Dễ', 'Vừa', 'Khó'][x.d] || 'Vừa'}</small><div><b>${esc(x.q)}</b></div><div class="opts">${x.o.map((o, j) => { const a = q.ans[i]; const cls = a === null ? '' : j === x.a ? 'right' : j === a ? 'wrong' : ''; return `<button data-q="${i}" data-o="${j}" class="${cls}" ${a !== null ? 'disabled' : ''}>${esc(o)}</button>`; }).join('')}</div>${q.ans[i] !== null && x.e ? `<small>💬 ${esc(x.e)}</small>` : ''}</div>`).join('')
    + (done ? `<div class="ok">Kết quả: ${score}/5 ${score === 5 ? '🎉' : ''}</div><button class="btn ghost" id="newQuiz">🔄 Bộ câu hỏi mới${getKey() ? ' (AI)' : ''}</button>` : '');
}
$('#quiz').addEventListener('click', async e => {
  if (e.target.id === 'newQuiz') { await ensureQuiz(true); return renderQuiz(); }
  const b = e.target.closest('[data-q]'); if (!b) return;
  const i = +b.dataset.q, j = +b.dataset.o, q = S.quiz; if (q.ans[i] !== null) return;
  q.ans[i] = j; save();
  if (j === q.qs[i].a) award(10, 'trả lời đúng');
  if (q.ans.every(a => a !== null) && q.qs.every((x, n) => q.ans[n] === x.a)) { giveBadge('quiz'); }
  renderQuiz(); renderGameStatsOnly();
});
function renderGameStatsOnly() { $('#gameStats').innerHTML = `<div class="kpi"><small>Điểm thưởng</small><b>⭐ ${fmt(S.points)}</b></div><div class="kpi"><small>Chuỗi ngày</small><b>🔥 ${S.streak.n}</b></div><div class="kpi"><small>Huy hiệu</small><b>🏅 ${S.badges.length}/${BADGES.length}</b></div>`; }
function weeklyInfo() {
  const now = new Date(), dow = (now.getDay() + 6) % 7, mon = new Date(now); mon.setDate(now.getDate() - dow);
  const wkKey = dayKey(mon), set = new Set();
  for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); (S.diary[dayKey(d)] || []).filter(e => e.vegetable).forEach(e => set.add(e.name)); }
  const done = set.size >= 5;
  if (done && !S.weeklyDone[wkKey]) { S.weeklyDone[wkKey] = true; save(); award(50, 'hoàn thành thử thách tuần'); }
  return { n: Math.min(set.size, 99), list: [...set], done: done || !!S.weeklyDone[wkKey] };
}
$('#themes').addEventListener('click', e => {
  const b = e.target.closest('.theme'); if (!b) return;
  const id = b.dataset.theme, cost = +b.dataset.cost;
  if (!S.themes.includes(id)) { if (S.points < cost) return toast(`Cần ${cost} điểm để mở khóa (bạn có ${S.points}).`); S.points -= cost; S.themes.push(id); header(); }
  S.theme = id; save(); applyTheme(); renderGame();
});
function applyTheme() { if (S.theme && S.theme !== 'default') document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; }

/* ================= Cài đặt AI ================= */
$('#settingsBtn').onclick = () => { $('#keyIn').value = getKey(); $('#modelIn').value = getModel(); $('#settings').showModal(); };
$('#saveKey').onclick = () => { try { localStorage.setItem('nf_key', $('#keyIn').value.trim()); localStorage.setItem('nf_model', $('#modelIn').value.trim()); sessionStorage.removeItem('nf_okmodel'); } catch (e) { /* */ } toast('Đã lưu cài đặt AI'); renderSuggest(); };

/* ================= Khởi động ================= */
applyTheme(); touchStreak(); header(); renderSuggest();
show(location.hash.slice(1) || 'home');
