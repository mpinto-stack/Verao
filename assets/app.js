(function(){
  const $=(s,e=document)=>e.querySelector(s);
  const $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
  const store={
    get(k,d=null){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch{return d;}},
    set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
  };

  // offline cache
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});
  }

  const offlineBanner=$('#offlineBanner');
  function updateOnline(){ if(offlineBanner) offlineBanner.hidden = navigator.onLine; }
  window.addEventListener('online',updateOnline);
  window.addEventListener('offline',updateOnline);
  updateOnline();

  // theme
  const themeBtn=$('#themeBtn');
  const themeKey='ui.theme';
  function setTheme(t){
    document.body.classList.toggle('dark',t==='dark');
    store.set(themeKey,t);
    if(themeBtn) themeBtn.textContent = t==='dark' ? '☀️' : '🌗';
  }
  setTheme(store.get(themeKey,'light'));
  themeBtn?.addEventListener('click',()=>setTheme(document.body.classList.contains('dark')?'light':'dark'));

  // tabs
  const tabs=$('#tabs');
  const menuBtn=$('#menuBtn');
  const tabBtns=$$('.tab');
  const panels=$$('.panel');
  const defaultTabKey='ui.defaultTab';
  const allowed=['road','today','trip','map','home','food','ev','checks','notes','overview'];

  function activateTab(id,pushHash=true){
    tabBtns.forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
    panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===id));
    store.set(defaultTabKey,id);
    if(pushHash) location.hash=id;
    tabs?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded','false');
    try{window.scrollTo({top:0,behavior:'smooth'});}catch{window.scrollTo(0,0);} 
  }

  tabBtns.forEach(b=>b.addEventListener('click',()=>activateTab(b.dataset.tab)));
  menuBtn?.addEventListener('click',()=>{const open=tabs.classList.toggle('open'); menuBtn.setAttribute('aria-expanded',String(open));});
  $$('.brand').forEach(el=>{el.addEventListener('click',()=>activateTab('overview')); el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ') activateTab('overview');});});

  // open EV tab shortcut
  $('[data-open-tab="ev"]')?.addEventListener('click',(e)=>{e.preventDefault(); activateTab('ev');});

  const initial=(location.hash||'').replace('#','') || store.get(defaultTabKey,'road');
  activateTab(allowed.includes(initial)?initial:'road',false);

  // toast
  function toast(msg){
    let t=$('#toast');
    if(!t){
      t=document.createElement('div');
      t.id='toast';
      t.style.position='fixed';
      t.style.left='50%';
      t.style.bottom='18px';
      t.style.transform='translateX(-50%)';
      t.style.background='rgba(0,0,0,.72)';
      t.style.color='white';
      t.style.padding='10px 12px';
      t.style.borderRadius='14px';
      t.style.zIndex='100';
      t.style.fontSize='13px';
      document.body.appendChild(t);
    }
    t.textContent=msg;
    t.style.opacity='1';
    clearTimeout(toast._timer);
    toast._timer=setTimeout(()=>{t.style.opacity='0';},2200);
  }
  function copyText(txt){
    if(!navigator.clipboard){toast('Clipboard não disponível');return;}
    navigator.clipboard.writeText(txt).then(()=>toast('Copiado ✅')).catch(()=>toast('Não consegui copiar'));
  }

  $('#copyTripIda')?.addEventListener('click',()=>copyText('Ida: Porto → Leiria → Lisboa (Pavilhão + AC Vasco da Gama) → Almodôvar → Aljezur.'));
  $('#copyTripVolta')?.addEventListener('click',()=>copyText('Volta: Aljezur → Almodôvar → Lisboa → Leiria → Porto.'));

  // data renders
  function renderPOI(){
    const el=$('#poiList');
    if(!el||!window.TRIP_DATA) return;
    el.innerHTML=(window.TRIP_DATA.poi||[]).map(p=>
      `<div class="slot"><div class="slot__t">${p.name}</div><div class="muted">${p.note||''}</div>`+
      `<div style="margin-top:6px"><a class="link" target="_blank" rel="noopener" href="${p.maps}">Abrir no Maps</a></div></div>`
    ).join('');
  }
  function renderDirections(){
    const el=$('#offlineDirections');
    if(!el||!window.TRIP_DATA) return;
    el.innerHTML=(window.TRIP_DATA.offlineDirections||[]).map(s=>
      `<div class="slot"><div class="slot__t">${s.title}</div><ul class="list">${(s.lines||[]).map(l=>`<li>${l}</li>`).join('')}</ul></div>`
    ).join('');
  }
  function renderFood(){
    const el=$('#foodList');
    if(!el||!window.TRIP_DATA) return;
    el.innerHTML=(window.TRIP_DATA.food||[]).map(f=>
      `<div class="slot"><div class="slot__t">${f.name}</div><div class="muted">${f.type||''}${f.note?(' • '+f.note):''}</div>`+
      `<div style="margin-top:6px"><a class="link" target="_blank" rel="noopener" href="${f.maps}">Abrir no Maps</a></div></div>`
    ).join('');
  }

  $('#food_copy_msg')?.addEventListener('click',()=>{
    const msg='Olá! Somos 2 adultos + uma criança (4 anos) + um bebé (3 meses). Gostávamos de reservar mesa para hoje às 19:15/19:30. Precisamos de espaço para carrinho. Obrigado!';
    copyText(msg);
    const out=$('#food_msg_out');
    if(out) out.textContent=msg;
  });

  // day mode
  const daySelect=$('#daySelect');
  const dayMode=$('#dayMode');
  const dayOut=$('#dayOut');
  const dayKey='day.default';

  function slotHTML(s){
    return `<div class="slot"><div class="slot__t">${s.title}</div><div>${s.text||''}</div></div>`;
  }
  function renderDay(){
    if(!window.TRIP_DATA||!daySelect||!dayMode||!dayOut) return;
    const idx=parseInt(daySelect.value,10);
    const mode=dayMode.value;
    const d=(window.TRIP_DATA.dailyPlans||[])[idx];
    if(!d) return;
    const p=d[mode];
    dayOut.innerHTML=`<h2>${d.date} — ${d.title}</h2>` + slotHTML(p.morning) + slotHTML(p.midday) + slotHTML(p.evening);
  }
  function initDay(){
    if(!window.TRIP_DATA||!daySelect) return;
    daySelect.innerHTML=(window.TRIP_DATA.dailyPlans||[]).map((d,i)=>`<option value="${i}">${d.date} — ${d.title}</option>`).join('');
    daySelect.value=String(store.get(dayKey,0));
    renderDay();
  }
  daySelect?.addEventListener('change',renderDay);
  dayMode?.addEventListener('change',renderDay);
  $('#dayCopy')?.addEventListener('click',()=>{
    if(!window.TRIP_DATA) return;
    const idx=parseInt(daySelect.value,10);
    const mode=dayMode.value;
    const d=(window.TRIP_DATA.dailyPlans||[])[idx];
    const p=d[mode];
    copyText(`${d.date} — ${d.title} (${mode})\nManhã: ${p.morning.text}\nMeio-dia: ${p.midday.text}\nFim de tarde: ${p.evening.text}`);
  });
  $('#dayPin')?.addEventListener('click',()=>{store.set(dayKey,parseInt(daySelect.value,10)); toast('Dia fixado ✅');});

  // persistence helper
  function bindPersist(ids,prefix){
    ids.forEach(id=>{
      const el=$('#'+id);
      if(!el) return;
      const k=`${prefix}.${id}`;
      const saved=store.get(k,null);
      if(saved!==null && saved!==undefined && saved!=='') el.value=saved;
      el.addEventListener('input',()=>store.set(k,el.value));
    });
  }
  bindPersist(['t_cons','t_buffer','t_batt','t_eff','t_km1','t_km2','t_km3','t_km4'],'targets');
  bindPersist(['road_depart','road_interval','road_drive','road_break'],'road');
  bindPersist(['home_hours','home_kw','home_eff','home_batt'],'home');

  function fmt(n,d=1){return (Math.round(n*10**d)/10**d).toFixed(d);}

  // targets SOC calc (ONLY fixed version)
  const tOut=$('#t_out');
  function calcTargets(){
    const cons=+$('#t_cons').value;
    const buffer=+$('#t_buffer').value;
    const batt=+$('#t_batt').value;
    const kms=[+($('#t_km1').value||0),+($('#t_km2').value||0),+($('#t_km3').value||0),+($('#t_km4').value||0)];
    const minsArr=[20,20,20,30];

    function leg(km){
      const energy=km*cons/100;
      const pct=energy/batt*100;
      return {energy,pct};
    }

    const dep=[];
    const rows=[];
    for(let i=0;i<4;i++){
      if(!(kms[i]>0)){ rows.push(`<li>Troço ${i+1}: inserir km para calcular.</li>`); dep.push(null); continue; }
      const need=leg(kms[i]);
      const req=minsArr[i]+buffer+need.pct;
      dep.push(req);
      rows.push(`<li><strong>Troço ${i+1}</strong> (${kms[i]} km): ${fmt(need.energy,1)} kWh (~${fmt(need.pct,1)}%). Saída mínima: <strong>${fmt(req,1)}%</strong>.</li>`);
    }

    const anyOver=dep.some(v=>v!==null && v>100);
    let warn='';
    if(anyOver){ warn=`<div class="slot"><div class="slot__t">⚠️ Atenção</div><div>Algum troço requer saída >100% com estes parâmetros. Reduz buffer/consumo, confirma km, ou adiciona paragem.</div></div>`; }

    if(tOut) tOut.innerHTML = `${warn}<ul class="list">${rows.join('')}</ul>`;

    const summary={kms,cons,buffer,batt,minsArr,dep:dep.map(v=>v===null?null:Math.min(100,v))};
    store.set('targets.summary',summary);
    return summary;
  }
  $('#t_calc')?.addEventListener('click',()=>{calcTargets(); toast('Targets calculados ✅');});

  // road quick targets
  const roadSocOut=$('#road_soc_out');
  function roadSocQuick(){
    const s=store.get('targets.summary',null);
    if(!roadSocOut) return;
    if(!s){ roadSocOut.textContent='Ainda não há targets guardados. Vai a EV e calcula.'; return; }
    const [a,b,c,d]=s.dep;
    roadSocOut.innerHTML=`Saídas mínimas (buffer ${s.buffer}%):`+
      `<br>Porto→Leiria: <strong>${a?fmt(a,1):'?'}%</strong>`+
      `<br>Leiria→Lisboa: <strong>${b?fmt(b,1):'?'}%</strong>`+
      `<br>Lisboa→Almodôvar: <strong>${c?fmt(c,1):'?'}%</strong>`+
      `<br>Almodôvar→Vila da Telha: <strong>${d?fmt(d,1):'?'}%</strong>`;
  }
  $('#road_soc_quick')?.addEventListener('click',roadSocQuick);

  // road breaks
  const roadBreaksOut=$('#road_breaks_out');
  function addMinutes(t,mins){
    const [h,m]=t.split(':').map(Number);
    const total=h*60+m+mins;
    const hh=((Math.floor(total/60)%24)+24)%24;
    const mm=((total%60)+60)%60;
    return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  }
  function roadBreaksCalc(){
    if(!roadBreaksOut) return;
    const depart=$('#road_depart').value;
    const intervalH=+$('#road_interval').value;
    const driveH=+$('#road_drive').value;
    const breakMin=+$('#road_break').value;
    const intervalMin=Math.round(intervalH*60);
    const totalDriveMin=Math.round(driveH*60);
    let t=depart, driven=0, i=1;
    const lines=[];
    while(driven+intervalMin<totalDriveMin){
      t=addMinutes(t,intervalMin);
      driven+=intervalMin;
      const end=addMinutes(t,breakMin);
      lines.push(`Pausa ${i}: ${t} → ${end}`);
      t=end; i++;
    }
    roadBreaksOut.innerHTML = lines.length ? '<pre style="margin:0">'+lines.join('\n')+'</pre>' : 'Sem pausas intermédias.';
  }
  $('#road_breaks_calc')?.addEventListener('click',roadBreaksCalc);

  // notes
  const notes=$('#notes');
  const notesKey='notes.text';
  if(notes){ notes.value=store.get(notesKey,''); }
  $('#notesSave')?.addEventListener('click',()=>{store.set(notesKey,notes?.value||''); toast('Notas guardadas ✅');});
  $('#notesClear')?.addEventListener('click',()=>{ if(notes) notes.value=''; store.set(notesKey,''); toast('Notas apagadas');});

  const roadNotes=$('#road_notes');
  const roadNotesKey='road.notes';
  if(roadNotes){ roadNotes.value=store.get(roadNotesKey,''); }
  $('#road_notes_save')?.addEventListener('click',()=>{store.set(roadNotesKey,roadNotes?.value||''); toast('Guardado ✅');});
  $('#road_notes_clear')?.addEventListener('click',()=>{ if(roadNotes) roadNotes.value=''; store.set(roadNotesKey,''); toast('Apagado');});

  // home calc
  const homeOut=$('#home_out');
  function homeCalc(){
    if(!homeOut) return;
    const h=+$('#home_hours').value;
    const kw=+$('#home_kw').value;
    const eff=+$('#home_eff').value/100;
    const batt=+$('#home_batt').value;
    const kwh=h*kw*eff;
    const pct=kwh/batt*100;
    homeOut.innerHTML=`Ganho: <strong>${fmt(kwh,1)} kWh</strong> ≈ <strong>${fmt(pct,1)}%</strong>`;
  }
  $('#home_calc')?.addEventListener('click',homeCalc);

  // checklists (simple)
  const ctn=$('#checklistsContainer');
  const search=$('#checkSearch');
  const resetBtn=$('#checkReset');
  const stateKey='check.state';
  let checked=store.get(stateKey,{});

  function renderChecks(){
    if(!ctn||!window.TRIP_DATA) return;
    const q=(search?.value||'');
    ctn.innerHTML='';
    (window.TRIP_DATA.checklists||[]).forEach(list=>{
      const card=document.createElement('article'); card.className='card';
      const title=document.createElement('div'); title.className='card__title'; title.textContent=list.title;
      const body=document.createElement('div'); body.className='card__body';
      const ul=document.createElement('ul'); ul.style.listStyle='none'; ul.style.padding='0'; ul.style.margin='0';
      list.items.forEach((item,idx)=>{
        if(q && !item.toLowerCase().includes(q.toLowerCase())) return;
        const id=`${list.id}.${idx}`;
        const li=document.createElement('li'); li.style.display='flex'; li.style.alignItems='center'; li.style.gap='10px'; li.style.padding='8px 0';
        const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!checked[id];
        const span=document.createElement('span'); span.textContent=item;
        function sync(){ span.style.color=cb.checked?'var(--muted)':'var(--text)'; span.style.textDecoration=cb.checked?'line-through':'none'; }
        sync();
        cb.addEventListener('change',()=>{checked[id]=cb.checked; store.set(stateKey,checked); sync();});
        li.appendChild(cb); li.appendChild(span); ul.appendChild(li);
      });
      body.appendChild(ul); card.appendChild(title); card.appendChild(body); ctn.appendChild(card);
    });
  }
  search?.addEventListener('input',renderChecks);
  resetBtn?.addEventListener('click',()=>{checked={}; store.set(stateKey,checked); renderChecks(); toast('Checklists limpas');});

  // init
  renderPOI();
  renderDirections();
  renderFood();
  initDay();
  renderChecks();
  roadBreaksCalc();
  roadSocQuick();
  homeCalc();

})();
