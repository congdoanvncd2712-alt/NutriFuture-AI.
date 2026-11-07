/* NutriFuture — toàn bộ logic chạy trên trình duyệt (phù hợp GitHub Pages) */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const F=window.NF_FOODS.map(r=>({id:r[0],n:r[1],p:r[2],k:r[3],pr:r[4],f:r[5],c:r[6],reg:r[7],prov:r[8],al:r[9]}));
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10),week=()=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return d.toISOString().slice(0,10)};
const fmt=n=>Math.round(n).toLocaleString('vi-VN');
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}

/* ---------- Điều hướng: 6 tính năng ---------- */
const FEATS=[['f1','🧑‍🎓','Hồ sơ & dị ứng','Nhập thông tin cá nhân, tính BMI, nhu cầu calo và nước. Lưu hồ sơ dị ứng để bảo vệ bạn.'],
['f2','🔎','Tra cứu dinh dưỡng','Tìm nhanh 253 món ba miền, chọn khẩu phần S/M/L và nhận cảnh báo dị ứng ngay.'],
['f3','📷','Nhận diện bằng AI','Chụp ảnh món ăn, AI Gemini phân tích thành phần dinh dưỡng và cảnh báo kép.'],
['f4','🥗','Thực đơn khoa học','Gợi ý 3 bữa cân đối theo nhu cầu của bạn, đổi thực đơn khác chỉ với một chạm.'],
['f5','📒','Nhật ký & theo dõi','Biểu đồ vòng so calo với mục tiêu, phân tích Carb – Đạm – Béo, sao lưu JSON.'],
['f6','🎮','Học mà chơi','Điểm thưởng, chuỗi ngày, câu đố mỗi ngày, huy hiệu và 9 giao diện sưu tầm.']];
const NAV=['Hồ sơ & dị ứng','Tra cứu','Camera AI','Thực đơn','Nhật ký','Học mà chơi'];
$('#nav').innerHTML=FEATS.map((f,i)=>`<button data-s="${f[0]}">${f[1]} ${NAV[i]}</button>`).join('');
$('#feats').innerHTML=FEATS.map(f=>`<div class="card feat" onclick="go('${f[0]}')"><div class="ic">${f[1]}</div><h3>${f[2]}</h3><p>${f[3]}</p></div>`).join('');
$$('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.s));
function go(id){$$('section').forEach(s=>s.classList.toggle('on',s.id===id));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.s===id));
 location.hash=id==='home'?'':id;scrollTo({top:0,behavior:'smooth'});({f1:fillProfile,f4:()=>$('#menu').innerHTML||genMenu(),f5:renderDiary,f6:renderGame})[id]?.()}
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&$('#'+h))go(h)});

/* ---------- 1. Hồ sơ & dị ứng ---------- */
const ALG=['đậu phộng','hải sản','sữa','trứng','gluten','đậu nành'];let myAlg=[];
const P=()=>L('nf_profile',null);
function calc(p){const bmr=10*p.w+6.25*p.h-5*p.a+(p.s==='m'?5:-161),bmi=p.w/((p.h/100)**2);
 return{bmi,kcal:Math.round(bmr*p.v/50)*50,water:p.w*33/1000,cat:bmi<18.5?'Thiếu cân':bmi<23?'Bình thường':bmi<25?'Thừa cân nhẹ':'Thừa cân'}}
function renderAlg(){$('#alg').innerHTML=ALG.map(a=>`<button class="chip ${myAlg.includes(a)?'on':''}" data-a="${a}">${a}</button>`).join('');
 $$('#alg .chip').forEach(c=>c.onclick=()=>{const a=c.dataset.a;myAlg=myAlg.includes(a)?myAlg.filter(x=>x!==a):[...myAlg,a];renderAlg()})}
function fillProfile(){const p=P();if(p){$('#pn').value=p.n;$('#pa').value=p.a;$('#ps').value=p.s;$('#pv').value=p.v;$('#ph').value=p.h;$('#pw').value=p.w;myAlg=p.al||[];$('#pc').value=(p.custom||[]).join(', ');showRes(p)}renderAlg()}
function showRes(p){const r=calc(p);$('#pres').innerHTML=`<div><b>${r.bmi.toFixed(1)}</b><span>BMI · ${r.cat}</span></div><div><b>${fmt(r.kcal)}</b><span>kcal/ngày</span></div><div><b>${r.water.toFixed(1)}</b><span>lít nước/ngày</span></div>`;
 $('#pnote').innerHTML=p.al?.length||p.custom?.length?`🛡 Đã lưu dị ứng: <b>${esc([...p.al,...(p.custom||[])].join(', '))}</b>. NutriFuture sẽ cảnh báo khi tra cứu và quét món ăn.`:'Bạn chưa khai báo dị ứng. Hãy chọn nếu có để được bảo vệ.'}
function saveProfile(){const p={n:$('#pn').value.trim().slice(0,40),a:+$('#pa').value,s:$('#ps').value,v:+$('#pv').value,h:+$('#ph').value,w:+$('#pw').value,al:myAlg,custom:$('#pc').value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)};
 if(!(p.a>=15&&p.a<=22))return toast('Tuổi cần từ 15 đến 22');if(!(p.h>=120&&p.h<=220))return toast('Chiều cao cần từ 120 đến 220 cm');if(!(p.w>=30&&p.w<=150))return toast('Cân nặng cần từ 30 đến 150 kg');
 W('nf_profile',p);showRes(p);toast('Đã lưu hồ sơ');award('profile',20)}
const target=()=>{const p=P();return p?calc(p).kcal:2200};
/* cảnh báo dị ứng: nhóm (món trong CSDL) hoặc từ khóa (kết quả AI) */
function warn(name,groups=[],text=''){const p=P();if(!p)return[];const hit=new Set(),t=norm(name+' '+text);
 (p.al||[]).forEach(a=>{if(groups.includes(a))hit.add(a)});
 [...(p.al||[]),...(p.custom||[])].forEach(a=>{if(t.includes(norm(a)))hit.add(a)});
 if(text&&(p.al||[]).includes('đậu phộng')&&/lạc|đậu phộng|peanut/.test(t))hit.add('đậu phộng');return[...hit]}
const alertHTML=h=>h.length?`<div class="alert">⚠️ Cảnh báo: món này có chứa ${esc(h.join(', '))}!</div>`:'';

/* ---------- 2. Tra cứu ---------- */
let cur=null,size=1;const SZ={S:.7,M:1,L:1.3};
$('#q').addEventListener('input',e=>{const v=norm(e.target.value);if(!v){$('#sug').innerHTML='';return}
 const m=F.filter(f=>norm(f.n).includes(v)).slice(0,30);
 $('#sug').innerHTML=m.length?`<div class="sug">${m.map(f=>`<div data-i="${f.id}"><span>${esc(f.n)}</span><small>${f.k} kcal</small></div>`).join('')}</div>`:`<div class="sug"><div data-ai="1">Không có trong CSDL — hỏi AI về “${esc(e.target.value)}”</div></div>`;
 $$('#sug [data-i]').forEach(d=>d.onclick=()=>pick(+d.dataset.i));$$('#sug [data-ai]').forEach(d=>d.onclick=()=>aiLookup(e.target.value))});
$('#q').addEventListener('keydown',e=>{if(e.key==='Enter'){const f=F.find(x=>norm(x.n)===norm(e.target.value))||F.find(x=>norm(x.n).includes(norm(e.target.value)));f?pick(f.id):aiLookup(e.target.value)}});
function advice(f){const a=[];if(f.k>=550)a.push('Món khá nhiều năng lượng, nên chia sẻ hoặc ăn kèm rau xanh.');else if(f.k<=200)a.push('Món nhẹ, hãy bổ sung thêm đạm hoặc tinh bột để đủ no.');
 if(f.f>=25)a.push('Lượng béo cao, hạn chế ăn thường xuyên.');if(f.pr>=25)a.push('Giàu đạm, tốt cho cơ bắp và tăng trưởng.');if(f.c>=70)a.push('Nhiều tinh bột, cân đối bằng rau và đạm.');
 if(/trà sữa|chè|bánh pía|kẹo/i.test(f.n)||f.c>=65&&f.pr<8)a.push('Nhiều đường, nên uống ít đường hoặc chia nhỏ khẩu phần.');return a.length?a.join(' '):'Khẩu phần hợp lý, ăn kèm rau và trái cây để đủ vitamin và khoáng chất.'}
function pick(id){cur=F.find(f=>f.id===id);size=1;$('#sug').innerHTML='';$('#q').value=cur.n;drawFood();award('look',3,5)}
function drawFood(){const f=cur,s=size,h=warn(f.n,f.al);
 $('#lres').innerHTML=`<h3 style="margin-top:20px">${esc(f.n)}</h3><small style="color:var(--mute)">${esc(f.p)}${f.prov?' · Đặc sản '+esc(f.prov):''} · ${f.reg==='Quốc tế'&&f.id>=253?'Phổ biến':f.reg}</small>${alertHTML(h)}
 <div style="margin:12px 0"><div class="seg">${Object.keys(SZ).map(k=>`<button data-z="${k}" class="${SZ[k]===s?'on':''}">Size ${k}</button>`).join('')}</div> <small style="color:var(--mute)">S 70% · M 100% · L 130%</small></div>
 <div class="nut"><div><b>${fmt(f.k*s)}</b><span>kcal</span></div><div><b>${(f.pr*s).toFixed(1)}g</b><span>Đạm</span></div><div><b>${(f.f*s).toFixed(1)}g</b><span>Béo</span></div><div><b>${(f.c*s).toFixed(1)}g</b><span>Carb</span></div></div>
 <div class="tip">💡 ${advice(f)}<br><small>Vitamin và khoáng chất: tùy nguyên liệu, hãy ăn đa dạng rau củ và trái cây.</small></div><br><button class="btn" onclick="logFood()">Lưu vào nhật ký</button>`;
 $$('#lres [data-z]').forEach(b=>b.onclick=()=>{size=SZ[b.dataset.z];drawFood()})}
function logFood(){if(!cur)return;addLog({n:cur.n+(size!==1?` (size ${size===.7?'S':'L'})`:''),k:cur.k*size,pr:cur.pr*size,f:cur.f*size,c:cur.c*size,veg:/rau|canh|gỏi|nộm|cải|muống|dưa/i.test(cur.n)});}

/* ---------- 3. Camera AI (Gemini) ---------- */
const KEY=()=>(window.NF_CONFIG&&NF_CONFIG.GEMINI_API_KEY)||L('nf_key','');
async function gem(parts){const k=KEY();if(!k)throw new Error('Chưa có API key Gemini.');
 for(const m of [NF_CONFIG.MODEL,NF_CONFIG.FALLBACK]){
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts}],generationConfig:{responseMimeType:'application/json',temperature:.2,maxOutputTokens:700}})});
  if(r.ok){const j=await r.json();return JSON.parse(j.candidates[0].content.parts[0].text.replace(/```json|```/g,''))}
  if(r.status!==429&&r.status!==404&&r.status!==503)throw new Error('Lỗi Gemini '+r.status+(r.status===400||r.status===403?': kiểm tra lại API key.':'.'))}
 throw new Error('Hết hạn mức Gemini miễn phí, vui lòng thử lại sau ít phút.')}
const PROMPT=`Bạn là chuyên gia dinh dưỡng Việt Nam cho học sinh THPT. Trả về DUY NHẤT JSON: {"name":"tên món tiếng Việt","portion":"khẩu phần ước tính","kcal":số,"protein":số,"fat":số,"carb":số,"vitamins":"vitamin và khoáng chất chính","allergens":["thành phần dễ gây dị ứng"],"province":"tỉnh/thành đặc sản theo đơn vị hành chính mới hoặc rỗng nếu món phổ biến khắp nơi","advice":"1-2 câu khuyên"}. Nếu ảnh không phải món ăn: {"error":"..."}.`;
function aiCard(r,mul=1){if(r.error)return`<h3>Kết quả</h3><div class="tip">${esc(r.error)}</div>`;
 const h=warn(r.name,[],(r.allergens||[]).join(' '));cur={n:r.name,k:r.kcal*mul,pr:r.protein*mul,f:r.fat*mul,c:r.carb*mul};
 return`<h3>${esc(r.name)}</h3><small style="color:var(--mute)">${esc(r.portion||'')}${r.province?' · Đặc sản '+esc(r.province):''}</small>${alertHTML(h)}
 <div class="nut"><div><b>${fmt(cur.k)}</b><span>kcal</span></div><div><b>${cur.pr.toFixed(1)}g</b><span>Đạm</span></div><div><b>${cur.f.toFixed(1)}g</b><span>Béo</span></div><div><b>${cur.c.toFixed(1)}g</b><span>Carb</span></div></div>
 <p><small>🥕 ${esc(r.vitamins||'')}</small></p><div class="tip">💡 ${esc(r.advice||'')}</div><br><button class="btn" onclick="size=1;logFood()">Lưu vào nhật ký</button>`}
async function aiLookup(q){$('#sug').innerHTML='';$('#lres').innerHTML='<p><span class="spin"></span> AI đang phân tích…</p>';
 try{const r=await gem([{text:PROMPT+'\nMón cần tra cứu: '+q.slice(0,80)}]);$('#lres').innerHTML=aiCard(r);award('look',3,5)}catch(e){$('#lres').innerHTML=`<div class="alert">${esc(e.message)}</div>`}}
let stream=null,shot=null,lastR=null;
async function openCam(){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});const v=document.createElement('video');v.srcObject=stream;v.playsInline=true;v.muted=true;v.play();$('#cam').innerHTML='';$('#cam').append(v);shot=null}catch(e){toast('Không mở được camera. Hãy dùng “Thêm hình ảnh”.')}}
function toJpeg(src,w,h){const c=document.createElement('canvas'),m=Math.min(1,720/Math.max(w,h));c.width=w*m;c.height=h*m;c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.8)}
function snap(){const v=$('#cam video');if(!v){return toast('Hãy mở camera hoặc thêm hình ảnh trước')}shot=toJpeg(v,v.videoWidth,v.videoHeight);stream?.getTracks().forEach(t=>t.stop());stream=null;showShot();analyze()}
$('#file').onchange=e=>{const f=e.target.files[0];if(!f)return;const i=new Image();i.onload=()=>{shot=toJpeg(i,i.width,i.height);showShot();analyze()};i.src=URL.createObjectURL(f)};
function showShot(){$('#cam').innerHTML=`<img src="${shot}" alt="Ảnh món ăn">`}
$$('#amt button').forEach(b=>b.onclick=()=>{$$('#amt button').forEach(x=>x.classList.toggle('on',x===b));if(lastR)$('#cres').innerHTML=aiCard(lastR,+b.dataset.v)});
async function analyze(){const mul=+$('#amt .on').dataset.v;$('#cres').innerHTML='<p><span class="spin"></span> AI đang nhận diện món ăn…</p>';
 try{lastR=await gem([{text:PROMPT},{inline_data:{mime_type:'image/jpeg',data:shot.split(',')[1]}}]);$('#cres').innerHTML=aiCard(lastR,mul);award('cam',8,5)}catch(e){$('#cres').innerHTML=`<h3>Kết quả</h3><div class="alert">${esc(e.message)}</div>`}}

/* ---------- 4. Thực đơn ---------- */
const FRUIT=[['Chuối','1 quả',90,1,.3,23],['Cam','1 quả',62,1.2,.2,15],['Ổi','1 quả',68,2.6,.9,14],['Đu đủ','1 chén',62,.7,.4,16],['Dưa hấu','1 chén',46,.9,.2,11],['Thanh long','1/2 quả',55,1.1,.3,13]];
const VEG=F.filter(f=>/^(Rau|Canh cua rau|Canh cá nấu chua|Canh chua)/.test(f.n));
const okF=f=>!warn(f.n,f.al).length;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
let used=[];function near(pool,kc){return rnd(pool.filter(f=>okF(f)&&!used.includes(f.id)&&!/giả cầy/.test(f.n)).sort((a,b)=>Math.abs(a.k-kc)-Math.abs(b.k-kc)).slice(0,5))}
function genMenu(){used=[];const T=target(),fr=rnd(FRUIT),vg=rnd(VEG.filter(okF)),
 b=near(F.filter(f=>/^(Phở|Bún|Bánh cuốn|Xôi|Cháo|Bánh mì|Miến|Hủ tiếu|Bánh canh|Mì Quảng)/.test(f.n)&&f.k<=560),T*.27),
 l=(used.push(b.id),near(F.filter(f=>/^Cơm|Hủ tiếu|Bún thịt|Bún bò/.test(f.n)&&f.k>=450),T*.36)),
 d=(used.push(l.id),near(F.filter(f=>/^(Cá|Gà|Thịt|Canh|Sườn|Đậu|Bò|Tôm|Gỏi|Bún|Mì|Cháo)/.test(f.n)&&f.k<=520),T*.3));
 if(!b||!l||!d)return;const items=[['🌅 Bữa sáng',[b],null],['☀️ Bữa trưa',[l,vg],null],['🌙 Bữa tối',[d,vg===VEG[0]?VEG[1]:rnd(VEG.filter(okF))],fr]];
 let tot=0;const row=([t,fs,fruit])=>{const k=fs.reduce((s,f)=>s+f.k,0)+(fruit?fruit[2]:0);tot+=k;
  return`<div class="meal"><div style="flex:1"><h4>${t}</h4><p>${fs.map(f=>`<b>${esc(f.n)}</b> (${esc(f.p)})`).join(' + ')}${fruit?` + <b>${fruit[0]}</b> (${fruit[1]})`:''}</p></div><b style="color:var(--blue)">${fmt(k)} kcal</b></div>`};
 const html=items.map(row).join('');$('#menu').innerHTML=html+`<div class="tip">✅ Đủ 4 nhóm chất: bột đường, đạm, béo, vitamin và khoáng chất, kèm rau xanh và trái cây.<br>Tổng khoảng <b>${fmt(tot)} kcal</b> so với mục tiêu <b>${fmt(T)} kcal</b>${P()?'':' (mặc định, hãy tạo hồ sơ để cá nhân hóa)'}.</div>`}

/* ---------- 5. Nhật ký ---------- */
const D=()=>L('nf_diary',{});
function addLog(it){const d=D(),t=today();(d[t]=d[t]||[]).push(it);W('nf_diary',d);toast('Đã lưu vào nhật ký');award('log',10,10);if(it.veg)weekVeg(it.n)}
function renderDiary(){const items=D()[today()]||[],T=target(),s=k=>items.reduce((a,i)=>a+i[k],0),kc=s('k');
 $('#log').innerHTML=items.map((i,x)=>`<li><span>${esc(i.n)}</span><span>${fmt(i.k)} kcal <button onclick="delLog(${x})" aria-label="Xóa">✕</button></span></li>`).join('')||'<li>Chưa có món nào hôm nay.</li>';
 const pc=Math.min(100,kc/T*100);$('#donut').style.background=`conic-gradient(var(--blue) 0 ${pc}%,var(--ice) 0)`;$('#dk').innerHTML=`${fmt(kc)}<small>/ ${fmt(T)} kcal</small>`;
 const g=[['Carb',s('c')*4,'#4aa3ff'],['Protein',s('pr')*4,'#12a36b'],['Fat',s('f')*9,'#f5a524']],tot=g.reduce((a,x)=>a+x[1],0)||1;
 $('#macro').innerHTML=g.map(x=>`<div style="display:flex;justify-content:space-between;font-size:.88rem"><span>● <span style="color:${x[2]}">${x[0]}</span></span><b>${Math.round(x[1]/tot*100)}%</b></div><div class="bar2"><i style="width:${x[1]/tot*100}%;background:${x[2]}"></i></div>`).join('');
 let a=!items.length?'Hãy ghi món đầu tiên để nhận lời khuyên.':kc>T*1.1?'Bạn đã nạp dư năng lượng, hãy chọn bữa tiếp theo nhẹ hơn.':kc<T*.6?'Bạn còn thiếu nhiều năng lượng, đừng bỏ bữa nhé.':'Năng lượng hôm nay khá cân đối.';
 if(items.length&&!items.some(i=>i.veg))a+=' Hôm nay bạn thiếu chất xơ, hãy thêm rau xanh và trái cây.';$('#dadv').textContent='💡 '+a;
 if(items.length&&kc>=T*.9&&kc<=T*1.1)award('healthy',15,15,1)}
function delLog(i){const d=D();d[today()].splice(i,1);W('nf_diary',d);renderDiary()}
function exp(){const b=new Blob([JSON.stringify({v:1,profile:P(),diary:D(),game:L('nf_game',{})},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='nutrifuture-'+today()+'.json';a.click()}
$('#imp').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(j.profile)W('nf_profile',j.profile);if(j.diary)W('nf_diary',j.diary);if(j.game)W('nf_game',j.game);toast('Đã khôi phục dữ liệu');renderDiary()}catch(x){toast('File JSON không hợp lệ')}};r.readAsText(e.target.files[0])};

/* ---------- 6. Gamification ---------- */
const G=()=>Object.assign({pts:0,streak:0,last:'',caps:{},badges:{},veg:{},q:{day:'',list:[],i:0,ok:0}},L('nf_game',{}));
const LV=[['Khởi đầu xanh','Bong bóng nhẹ nổi lên',0],['Rạng đông','Tia nắng ban mai',100],['Thiên lam','Mây trôi, sóng nước',250],['Cực quang','Dải sáng bảy màu',450],['Hành tinh','Quỹ đạo & màn hình HUD',700],['Hoàng kim','Bụi vàng rơi, khung son',1000],['Thần quang','Thánh quang, lông vũ',1400],['Vĩnh Hằng','Lửa bất diệt',1900],['Ngân hà','Bắc Đẩu · Sao băng',2500]];
function award(key,pts,cap=1,once){const g=G(),k=key+today();g.caps[k]=(g.caps[k]||0)+1;if(g.caps[k]>cap)return;g.pts+=pts;
 if(key==='profile')g.badges.newbie=1;if(key==='healthy')g.badges.healthy=1;if(key==='cam')g.badges.cam=1;W('nf_game',g);if(!once)toast(`+${pts} điểm`);applyRealm()}
function daily(){const g=G(),t=today();if(g.last===t)return;const y=new Date();y.setDate(y.getDate()-1);g.streak=g.last===y.toISOString().slice(0,10)?g.streak+1:1;g.last=t;g.pts+=5;if(g.streak>=7)g.badges.s7=1;W('nf_game',g)}
function weekVeg(n){const g=G(),w=week();g.veg[w]=[...new Set([...(g.veg[w]||[]),n])];W('nf_game',g)}
const QB=[['Nhóm chất nào là nguồn năng lượng chính của cơ thể?',['Bột đường (carbohydrate)','Vitamin','Nước','Chất khoáng'],0,1],['Bạn nên uống khoảng bao nhiêu nước mỗi ngày?',['Khoảng 2 lít','Dưới 500 ml','Chỉ khi khát','5 lít'],0,1],['Rau xanh cung cấp nhiều nhất chất nào?',['Chất xơ và vitamin','Chất béo bão hòa','Đường','Cholesterol'],0,1],['Bữa sáng quan trọng vì…',['Cung cấp năng lượng cho buổi học','Giúp ngủ ngon hơn','Làm giảm chiều cao','Không có tác dụng'],0,1],['Chất đạm giúp cơ thể…',['Xây dựng và sửa chữa cơ bắp','Hòa tan vitamin','Giữ ấm da','Tạo ra nước'],0,2],['BMI từ 18,5 đến dưới 23 ở người châu Á trưởng thành là…',['Bình thường','Thiếu cân','Béo phì','Suy dinh dưỡng nặng'],0,2],['Thực phẩm nào giàu canxi?',['Sữa và sữa chua','Nước ngọt','Khoai tây chiên','Kẹo'],0,2],['1 gram chất béo cung cấp bao nhiêu kcal?',['9 kcal','4 kcal','7 kcal','2 kcal'],0,3],['1 gram đạm hoặc tinh bột cung cấp bao nhiêu kcal?',['4 kcal','9 kcal','7 kcal','0 kcal'],0,3],['Thiếu vitamin A dễ gây vấn đề gì?',['Khô mắt, quáng gà','Gãy xương','Thiếu máu','Sâu răng'],0,3],['Sắt giúp cơ thể…',['Tạo hồng cầu, vận chuyển oxy','Làm cứng răng','Giảm huyết áp','Tăng đường huyết'],0,4],['Công thức Mifflin–St Jeor dùng để tính…',['Năng lượng chuyển hóa cơ bản (BMR)','Lượng nước','Chỉ số đường huyết','Huyết áp'],0,4],['Bánh tráng trộn, trà sữa có điểm chung gì cần lưu ý?',['Nhiều đường, béo, năng lượng cao','Rất nhiều rau','Rất ít calo','Không có carb'],0,3],['Người dị ứng đậu phộng cần làm gì?',['Đọc kỹ thành phần và tránh hoàn toàn','Ăn ít một','Uống nhiều nước','Không cần lo'],0,2],['Carb hấp thụ chậm, tốt cho đường huyết thường có nhiều…',['Chất xơ','Đường tinh luyện','Muối','Chất bảo quản'],0,5]];
async function buildQuiz(g){const seed=+today().replace(/-/g,'');let list=null;
 if(KEY()){try{const r=await gem([{text:`Tạo 5 câu hỏi trắc nghiệm dinh dưỡng cho học sinh THPT Việt Nam, từ dễ đến khó, khác nhau mỗi ngày (mã ngày ${seed}). JSON: {"q":[{"t":"câu hỏi","o":["đáp án đúng","sai","sai","sai"]}]}. Đáp án đúng luôn đứng đầu.`}]);list=r.q.slice(0,5).map(x=>[x.t,x.o,0]).filter(x=>x[1].length===4)}catch(e){}}
 if(!list||list.length<5){let a=QB.map((q,i)=>[q,(i*7919+seed*31)%97]).sort((x,y)=>x[1]-y[1]).slice(0,5).map(x=>x[0]);list=a.sort((x,y)=>x[3]-y[3])}
 g.q={day:today(),list,i:0,ok:0};W('nf_game',g);return g}
async function renderQuiz(){let g=G();if(g.q.day!==today()||g.q.list.length<5){$('#quiz').innerHTML='<span class="spin"></span>';g=await buildQuiz(g)}
 const q=g.q;if(q.i>=5){$('#qn').textContent='';$('#quiz').innerHTML=`<div class="tip">🎉 Hoàn thành! Bạn đúng ${q.ok}/5 câu hôm nay. Mai sẽ có 5 câu mới.</div>`;return}
 $('#qn').textContent=`(${q.i+1}/5)`;const[t,o]=q.list[q.i],ord=o.map((x,i)=>[x,i]).sort((a,b)=>(a[0].length*7+q.i)%5-(b[0].length*7+q.i)%5);
 $('#quiz').innerHTML=`<p style="margin-top:8px"><b>${esc(t)}</b></p>`+ord.map(([x,i])=>`<button class="opt" data-c="${i===0?1:0}">${esc(x)}</button>`).join('');
 $$('#quiz .opt').forEach(b=>b.onclick=()=>{$$('#quiz .opt').forEach(x=>{x.disabled=true;if(x.dataset.c==='1')x.classList.add('ok')});const g=G();if(b.dataset.c==='1'){g.q.ok++;g.pts+=10;toast('Chính xác! +10 điểm')}else{b.classList.add('no');toast('Chưa đúng, thử câu tiếp nhé')}
  g.q.i++;W('nf_game',g);applyRealm();$('#gp').textContent=g.pts;setTimeout(renderQuiz,1100)})}
function renderGame(){daily();const g=G();$('#gp').textContent=g.pts;$('#gs').textContent=g.streak;
 const v=(g.veg[week()]||[]).length;$('#wk').style.width=Math.min(100,v/5*100)+'%';$('#wkt').textContent=`${Math.min(v,5)}/5 loại rau củ tuần này${v>=5?' — hoàn thành! 🎉':''}`;
 if(v>=5&&!g.badges.veg){g.badges.veg=1;g.pts+=30;W('nf_game',g)}
 const B=[['newbie','🌱 Người mới'],['healthy','🥦 Ăn uống lành mạnh'],['s7','🔥 7 ngày liên tục'],['cam','📷 Thợ săn món ngon'],['veg','🥕 Vua rau củ']];
 $('#badges').innerHTML=B.map(b=>`<span class="badge ${g.badges[b[0]]?'':'off'}">${b[1]}</span>`).join('');
 const r=realmLv(g.pts);$('#lvs').innerHTML=LV.map((l,i)=>`<div class="lv ${g.pts<l[2]?'lock':''} ${i===r?'cur':''}" data-i="${i}"><b>Cấp ${i+1}. ${l[0]}</b><small>${l[1]}</small><small>${g.pts<l[2]?'🔒 Cần '+l[2]+' điểm (xem thử 5 giây)':'✅ Đã mở khóa'}</small></div>`).join('');
 $$('#lvs .lv').forEach(e=>e.onclick=()=>{const i=+e.dataset.i;setRealm(i);if(g.pts<LV[i][2]){toast('Đang xem thử 5 giây…');setTimeout(applyRealm,5000)}});renderQuiz()}
const realmLv=p=>LV.reduce((a,l,i)=>p>=l[2]?i:a,0);
function setRealm(i){document.body.dataset.realm=i?'r'+(i+1):'';mode=i}
function applyRealm(){setRealm(realmLv(G().pts))}

/* ---------- Hiệu ứng nền: bong bóng + giao diện theo cấp ---------- */
const cv=$('#fx'),cx=cv.getContext('2d');let mode=0,PS=[],W_,H_,t0=0;
const rs=()=>{W_=cv.width=innerWidth;H_=cv.height=innerHeight};addEventListener('resize',rs);rs();
const R=(a,b)=>a+Math.random()*(b-a);
function mk(){const m=mode;return{x:R(0,W_),y:m>=5&&m<=6&&m!==4||m===0||m===7?(m===5||m===6?-20:H_+20):R(0,H_),r:R(4,m===0?30:12),v:R(.3,1.2),p:R(0,6.28),a:R(.15,.5),c:m===3?`hsl(${R(120,300)},80%,70%)`:m===8?`hsl(${R(30,45)},95%,60%)`:'#fff'}}
for(let i=0;i<60;i++){const q=mk();q.y=R(0,H_);q.m=0;PS.push(q)}
function frame(t){cx.clearRect(0,0,W_,H_);const m=mode;
 if(m===1){const g=cx.createRadialGradient(W_*.85,-40,10,W_*.85,-40,H_);g.addColorStop(0,'rgba(255,200,120,.55)');g.addColorStop(1,'rgba(255,200,120,0)');cx.fillStyle=g;cx.fillRect(0,0,W_,H_)}
 if(m===2){for(let i=0;i<4;i++){cx.fillStyle='rgba(255,255,255,.35)';const x=((t*.01*(i+1)+i*400)%(W_+400))-200;cx.beginPath();cx.ellipse(x,90+i*70,130,32,0,0,7);cx.fill()}cx.strokeStyle='rgba(5,79,212,.25)';for(let k=0;k<3;k++){cx.beginPath();for(let x=0;x<=W_;x+=12)cx.lineTo(x,H_-40-k*22+Math.sin(x/70+t/600+k)*10);cx.stroke()}}
 if(m===3){for(let i=0;i<5;i++){const g=cx.createLinearGradient(0,0,0,H_*.6);g.addColorStop(0,`hsla(${(t/30+i*60)%360},90%,65%,.35)`);g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.moveTo(0,0);for(let x=0;x<=W_;x+=20)cx.lineTo(x,60+i*30+Math.sin(x/160+t/900+i)*40);cx.lineTo(W_,0);cx.fill()}}
 if(m===4){cx.strokeStyle='rgba(120,180,255,.35)';[1,.7,.45].forEach((s,i)=>{cx.beginPath();cx.ellipse(W_*.8,H_*.28,170*s,60*s,t/3000*(i%2?-1:1),0,7);cx.stroke()});cx.fillStyle='rgba(74,163,255,.5)';cx.beginPath();cx.arc(W_*.8,H_*.28,26,0,7);cx.fill();cx.strokeStyle='rgba(120,200,255,.5)';cx.strokeRect(10,10,W_-20,H_-20)}
 if(m===5){cx.strokeStyle='rgba(155,28,28,.45)';cx.lineWidth=6;cx.strokeRect(6,6,W_-12,H_-12);cx.lineWidth=1}
 if(m===8){for(let i=0;i<70;i++){const x=(i*9973)%W_,y=(i*7919)%H_;cx.fillStyle=`rgba(255,255,255,${.3+.5*Math.abs(Math.sin(t/700+i))})`;cx.fillRect(x,y,2,2)}const s=(t/12)%(W_+300);cx.strokeStyle='#fff';cx.beginPath();cx.moveTo(s,s*.4%H_);cx.lineTo(s-90,(s-90)*.4%H_);cx.stroke()}
 PS.forEach(p=>{p.p+=.02;const dir=m===5||m===6?1:-1;p.y+=dir*p.v*(m===7?1.8:1);p.x+=Math.sin(p.p)*.5;
  if(p.y<-40||p.y>H_+40||m!==p.m){Object.assign(p,mk());p.m=m}
  cx.globalAlpha=p.a;
  if(m===0||m===2){cx.strokeStyle='rgba(5,79,212,.35)';cx.fillStyle='rgba(120,190,255,.22)';cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill();cx.stroke();cx.fillStyle='rgba(255,255,255,.7)';cx.beginPath();cx.arc(p.x-p.r*.35,p.y-p.r*.35,p.r*.2,0,7);cx.fill()}
  else if(m===5){cx.fillStyle='#e6a800';cx.fillRect(p.x,p.y,p.r/3,p.r/3)}
  else if(m===6){cx.fillStyle='#fff';cx.strokeStyle='#d9b84a';cx.beginPath();cx.ellipse(p.x,p.y,p.r*.4,p.r,p.p,0,7);cx.fill();cx.stroke()}
  else if(m===7){cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r*.4,0,7);cx.fill()}
  else if(m===8||m===3||m===4||m===1){cx.fillStyle=m===3?p.c:'#fff';cx.beginPath();cx.arc(p.x,p.y,p.r*.3,0,7);cx.fill()}
  cx.globalAlpha=1});
 requestAnimationFrame(frame)}
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)requestAnimationFrame(frame);

/* ---------- Khởi động ---------- */
setInterval(()=>{const e=$('#demoK');if(e){const v=1200+Math.round(Math.random()*40)*20;e.firstChild.nodeValue=fmt(v)}},3200);
daily();applyRealm();fillProfile();const h=location.hash.slice(1);if(h&&$('#'+h))go(h);
