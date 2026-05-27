(function(){
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const store = {
    get(k, d=null){ try{ const v = localStorage.getItem(k); return v===null? d : JSON.parse(v);}catch{ return d;} },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
  };

  // --- Service Worker (offline cache)
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    });
  }

  // Offline banner
  const offlineBanner = $('#offlineBanner');
  function updateOnline(){
    const online = navigator.onLine;
    if(offlineBanner) offlineBanner.hidden = online;
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // Toast
  function toast(msg){
    let t = $('#toast');
    if(!t){
      t = document.createElement('div');
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
    t.textContent = msg;
    t.style.opacity='1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(()=>{t.style.opacity='0';}, 2200);
  }

  // Theme toggle
  const themeBtn = $('#themeBtn');
  const themeKey = 'ui.theme';
  function setTheme(t){
    document.body.classList.toggle('dark', t==='dark');
    store.set(themeKey, t);
    if(themeBtn) themeBtn.textContent = t==='dark' ? '☀️' : '🌗';
  }
  setTheme(store.get(themeKey, 'light'));
  themeBtn?.addEventListener('click', ()=>{
    setTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
  });

  // Tabs
  const tabs = $('#tabs');
  const menuBtn = $('#menuBtn');
  const tabBtns = $$('.tab');
  const panels = $$('.panel');
  const defaultTabKey = 'ui.defaultTab';
  const allowed = ['road','today','trip','map','home','food','ev','checks','notes','overview'];

  function activateTab(id, pushHash=true){
    tabBtns.forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
    panels.forEach(p=>p.classList.toggle('active', p.dataset.panel===id));
    store.set(defaultTabKey, id);
    if(pushHash) location.hash = id;
    tabs?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded','false');
    try{ window.scrollTo({top:0, behavior:'smooth'});}catch{ window.scrollTo(0,0); }
  }

  tabBtns.forEach(b=>b.addEventListener('click', ()=> activateTab(b.dataset.tab)));
  menuBtn?.addEventListener('click', ()=>{
    const open = tabs.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('.brand').forEach(el=>{
    el.addEventListener('click', ()=> activateTab('overview'));
    el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') activateTab('overview'); });
  });

  // open tab links
  $('[data-open-tab="ev"]')?.addEventListener('click', (e)=>{ e.preventDefault(); activateTab('ev'); });
  $('#openSocTargets')?.addEventListener('click', (e)=>{ e.preventDefault(); activateTab('ev'); });

  const initial = (location.hash||'').replace('#','') || store.get(defaultTabKey, 'road');
  activateTab(allowed.includes(initial) ? initial : 'road', false);

  // Copy helpers
  function copyText(txt){
    if(!navigator.clipboard){ toast('Clipboard não disponível'); return; }
    navigator.clipboard.writeText(txt).then(()=>toast('Copiado ✅')).catch(()=>toast('Não consegui copiar'));
  }
  $('#copyTripIda')?.addEventListener('click', ()=>copyText(
    'Ida: Porto → IONITY Leiria (pausa + DC 15–25 min) → Lisboa Parque das Nações (Pavilhão + almoço + AC Vasco da Gama) → IONITY Almodôvar (top-up 10–20 min) → Aljezur (Vila da Telha). Regras: ≥20% no carregador, ≥30% no destino.'
  ));
  $('#copyTripVolta')?.addEventListener('click', ()=>copyText(
    'Volta: (véspera carregar 10A para 90–100%) → Almodôvar (pausa/top-up) → Lisboa (almoço + AC se útil) → Leiria (último top-up) → Porto. Regras: ≥20% no carregador, ≥30% no destino.'
  ));

  // --- Utils
  function fmt(n, d=1){ return (Math.round(n*10**d)/10**d).toFixed(d); }
  function norm(s){
    return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  }

  // --- Modo Plano do dia
  const daySelect = $('#daySelect');
  const dayMode = $('#dayMode');
  const dayOut = $('#dayOut');
  const dayCopy = $('#dayCopy');
  const dayPin = $('#dayPin');
  const dayKey = 'day.default';

  function slotHTML(s){
    const link = s.link ? `<div style="margin-top:6px"><a class="link" target="_blank" rel="noopener" href="${s.link}">${s.linkText||'Abrir no Maps'}</a></div>` : '';
    return `<div class="slot"><div class="slot__t">${s.title}</div><div>${s.text||''}</div>${link}</div>`;
  }

  function renderDay(){
    if(!window.TRIP_DATA || !daySelect || !dayMode || !dayOut) return;
    const idx = parseInt(daySelect.value, 10);
    const mode = dayMode.value;
    const d = window.TRIP_DATA.dailyPlans[idx];
    const plan = d[mode];
    dayOut.innerHTML = `
      <h2>${d.date} — ${d.title}</h2>
      ${slotHTML(plan.morning)}
      ${slotHTML(plan.midday)}
      ${slotHTML(plan.evening)}
    `;
  }

  function initDay(){
    if(!window.TRIP_DATA || !daySelect) return;
    daySelect.innerHTML = window.TRIP_DATA.dailyPlans
      .map((d,i)=>`<option value="${i}">${d.date} — ${d.title}</option>`).join('');
    const saved = store.get(dayKey, 0);
    daySelect.value = String(saved);
    renderDay();
  }

  daySelect?.addEventListener('change', renderDay);
  dayMode?.addEventListener('change', renderDay);
  dayCopy?.addEventListener('click', ()=>{
    if(!window.TRIP_DATA) return;
    const idx = parseInt(daySelect.value, 10);
    const mode = dayMode.value;
    const d = window.TRIP_DATA.dailyPlans[idx];
    const p = d[mode];
    const txt = `${d.date} — ${d.title} (${mode==='A'?'Plano A':'Plano B'})
`+
      `Manhã: ${p.morning.text}
`+
      `Meio‑dia: ${p.midday.text}
`+
      `Fim de tarde: ${p.evening.text}`;
    copyText(txt);
  });
  dayPin?.addEventListener('click', ()=>{
    store.set(dayKey, parseInt(daySelect.value,10));
    toast('Dia fixado ✅');
  });

  // --- POIs + offline directions
  const poiList = $('#poiList');
  const offlineDirections = $('#offlineDirections');
  function renderPOI(){
    if(!window.TRIP_DATA || !poiList) return;
    poiList.innerHTML = window.TRIP_DATA.poi.map(p=>
      `<div class="slot"><div class="slot__t">${p.name}</div><div class="muted">${p.note||''}</div>`+
      `<div style="margin-top:6px"><a class="link" target="_blank" rel="noopener" href="${p.maps}">Abrir no Maps</a></div></div>`
    ).join('');
  }
  function renderDirections(){
    if(!window.TRIP_DATA || !offlineDirections) return;
    offlineDirections.innerHTML = window.TRIP_DATA.offlineDirections.map(s=>
      `<div style="margin-bottom:12px"><div style="font-weight:900;margin-bottom:6px">${s.title}</div>`+
      `<ul class="list">${s.lines.map(l=>`<li>${l}</li>`).join('')}</ul></div>`
    ).join('');
  }

  // --- Food list
  const foodList = $('#foodList');
  function renderFood(){
    if(!window.TRIP_DATA || !foodList) return;
    const food = window.TRIP_DATA.food || [];
    if(!food.length){ foodList.innerHTML = '<p class="muted">Sem itens.</p>'; return; }
    foodList.innerHTML = food.map(f=>
      `<div class="slot"><div class="slot__t">${f.name}</div>`+
      `<div class="muted">${f.type||''}${f.note?(' • '+f.note):''}</div>`+
      `<div style="margin-top:6px"><a class="link" target="_blank" rel="noopener" href="${f.maps}">Abrir no Maps</a></div></div>`
    ).join('');
  }

  $('#food_copy_msg')?.addEventListener('click', ()=>{
    const msg = 'Olá! Somos 2 adultos + uma criança (4 anos) + um bebé (3 meses). Gostávamos de reservar mesa para hoje às 19:15/19:30. Precisamos de espaço para carrinho. Obrigado!';
    copyText(msg);
    $('#food_msg_out').textContent = msg;
  });

  // --- EV calculators persistence
  function bindPersist(ids, prefix){
    ids.forEach(id=>{
      const el = $('#'+id);
      if(!el) return;
      const k = `${prefix}.${id}`;
      const saved = store.get(k, null);
      if(saved !== null && saved !== undefined && saved !== '') el.value = saved;
      el.addEventListener('input', ()=> store.set(k, el.value));
    });
  }

  bindPersist(['soc_distance','soc_consumption','soc_battery','soc_start','soc_min_arrive','soc_buffer'], 'ev');
  bindPersist(['ct_from','ct_to','ct_battery','ct_power','ct_eff','ct_overhead'], 'ev');
  bindPersist(['bp_depart','bp_interval','bp_drive','bp_break'], 'ev');
  bindPersist(['conv_battery','conv_kwh','conv_pct'], 'ev');
  bindPersist(['home_hours','home_kw','home_eff','home_batt'], 'home');

  // Targets SOC persistence
  bindPersist(['t_cons','t_buffer','t_batt','t_eff','t_km1','t_km2','t_km3','t_km4'], 'targets');

  // Road persistence
  bindPersist(['road_depart','road_interval','road_drive','road_break'], 'road');

  // --- SOC planner
  const socOut = $('#soc_out');
  function socCalc(){
    const km = +$('#soc_distance').value;
    const cons = +$('#soc_consumption').value;
    const batt = +$('#soc_battery').value;
    const start = +$('#soc_start').value;
    const minArr = +$('#soc_min_arrive').value;
    const buffer = +$('#soc_buffer').value;

    const energy = km * cons / 100.0;
    const pctUsed = energy / batt * 100.0;
    const arrive = start - pctUsed - buffer;
    const ok = arrive >= minArr;
    const neededStart = minArr + pctUsed + buffer;

    socOut.innerHTML = `Energia: <strong>${fmt(energy,1)} kWh</strong>`+
      `<br>% usado: <strong>${fmt(pctUsed,1)}%</strong> (+ buffer ${buffer}%)`+
      `<br>SOC chegada: <strong style="color:${ok?'#16a34a':'#dc2626'}">${fmt(arrive,1)}%</strong>`+
      `<br>${ok?'✅ Cumpre mínimo.':'⚠️ Abaixo do mínimo.'} `+
      `${ok?'':'Precisas de sair com '}<strong>${fmt(neededStart,1)}%</strong>.`;
  }
  $('#soc_calc')?.addEventListener('click', socCalc);
  $('#soc_reset')?.addEventListener('click', ()=>{
    $('#soc_distance').value=200;
    $('#soc_consumption').value=19.5;
    $('#soc_battery').value=66;
    $('#soc_start').value=80;
    $('#soc_min_arrive').value=30;
    $('#soc_buffer').value=5;
    socCalc();
  });

  // --- Charge time
  const ctOut = $('#ct_out');
  function ctCalc(){
    const from = +$('#ct_from').value;
    const to = +$('#ct_to').value;
    const batt = +$('#ct_battery').value;
    const p = +$('#ct_power').value;
    const eff = +$('#ct_eff').value/100;
    const overhead = +$('#ct_overhead').value;

    const deltaPct = Math.max(0, to-from);
    const kwh = batt * deltaPct/100;
    const hours = (kwh/(p*eff));
    const mins = hours*60 + overhead;

    ctOut.innerHTML = `Energia: <strong>${fmt(kwh,1)} kWh</strong>`+
      `<br>Tempo: <strong>${Math.round(mins)} min</strong> (inclui +${overhead} min)`+
      `<br><span class="muted">Dica: DC abranda acima de ~70–80%.</span>`;
  }
  $('#ct_calc')?.addEventListener('click', ctCalc);

  // --- Break planners
  function addMinutes(t, mins){
    const [h,m] = t.split(':').map(Number);
    const total = h*60+m+mins;
    const hh = ((Math.floor(total/60)%24)+24)%24;
    const mm = ((total%60)+60)%60;
    return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  }

  const bpOut = $('#bp_out');
  function bpCalc(){
    const depart = $('#bp_depart').value;
    const intervalH = +$('#bp_interval').value;
    const driveH = +$('#bp_drive').value;
    const breakMin = +$('#bp_break').value;

    const intervalMin = Math.round(intervalH*60);
    const totalDriveMin = Math.round(driveH*60);

    let t = depart;
    let driven = 0;
    let i = 1;
    const lines = [];
    while(driven + intervalMin < totalDriveMin){
      t = addMinutes(t, intervalMin);
      driven += intervalMin;
      const end = addMinutes(t, breakMin);
      lines.push(`Pausa ${i}: ${t} → ${end} (≈ ${breakMin} min)`);
      t = end;
      i++;
    }
    bpOut.innerHTML = lines.length ? '<pre style="margin:0">'+lines.join('
')+'</pre>' : 'Sem pausas intermédias (duração curta).';
  }
  $('#bp_calc')?.addEventListener('click', bpCalc);

  // Road breaks
  const roadOut = $('#road_breaks_out');
  function roadBreaksCalc(){
    const depart = $('#road_depart').value;
    const intervalH = +$('#road_interval').value;
    const driveH = +$('#road_drive').value;
    const breakMin = +$('#road_break').value;

    const intervalMin = Math.round(intervalH*60);
    const totalDriveMin = Math.round(driveH*60);

    let t = depart;
    let driven = 0;
    let i = 1;
    const lines = [];
    while(driven + intervalMin < totalDriveMin){
      t = addMinutes(t, intervalMin);
      driven += intervalMin;
      const end = addMinutes(t, breakMin);
      lines.push(`Pausa ${i}: ${t} → ${end}`);
      t = end;
      i++;
    }
    roadOut.innerHTML = lines.length ? '<pre style="margin:0">'+lines.join('
')+'</pre>' : 'Sem pausas intermédias.';
  }
  $('#road_breaks_calc')?.addEventListener('click', roadBreaksCalc);

  // --- Converter
  const convOut = $('#conv_out');
  function kwhToPct(){
    const batt = +$('#conv_battery').value;
    const kwh = +$('#conv_kwh').value;
    const pct = (kwh/batt)*100;
    $('#conv_pct').value = fmt(pct,1);
    convOut.textContent = `${kwh} kWh ≈ ${fmt(pct,1)}%`;
  }
  function pctToKwh(){
    const batt = +$('#conv_battery').value;
    const pct = +$('#conv_pct').value;
    const kwh = batt*(pct/100);
    $('#conv_kwh').value = fmt(kwh,1);
    convOut.textContent = `${pct}% ≈ ${fmt(kwh,1)} kWh`;
  }
  $('#conv_kwh_to_pct')?.addEventListener('click', kwhToPct);
  $('#conv_pct_to_kwh')?.addEventListener('click', pctToKwh);

  // --- Home charging calculator
  const homeOut = $('#home_out');
  function homeCalc(){
    const h = +$('#home_hours').value;
    const kw = +$('#home_kw').value;
    const eff = +$('#home_eff').value/100;
    const batt = +$('#home_batt').value;
    const kwh = h*kw*eff;
    const pct = (kwh/batt)*100;
    homeOut.innerHTML = `Ganho: <strong>${fmt(kwh,1)} kWh</strong> ≈ <strong>${fmt(pct,1)}%</strong> (bateria ${batt} kWh)`;
  }
  $('#home_calc')?.addEventListener('click', homeCalc);

  // --- Targets SOC
  const tOut = $('#t_out');

  function calcTargets(){
    const cons = +$('#t_cons').value;      // kWh/100km
    const buffer = +$('#t_buffer').value; // %
    const batt = +$('#t_batt').value;     // kWh
    const eff = +$('#t_eff').value/100;   // used only to show required energy from charger

    const kms = [
      +($('#t_km1').value||0),
      +($('#t_km2').value||0),
      +($('#t_km3').value||0),
      +($('#t_km4').value||0)
    ];

    const minsArr = [20,20,20,30];

    function legNeedPct(km){
      const energy = km * cons / 100.0;
      const pct = (energy / batt)*100.0;
      return {energy, pct};
    }

    // compute required departure SOC for each leg
    const dep = [];
    const rows = [];
    for(let i=0;i<4;i++){
      if(!(kms[i]>0)){
        rows.push(`<li>Troço ${i+1}: inserir km para calcular.</li>`);
        dep.push(null);
        continue;
      }
      const need = legNeedPct(kms[i]);
      const req = minsArr[i] + buffer + need.pct;
      dep.push(req);
      const reqKwhFromGrid = (batt*(req/100)) / eff; // approx energy that must be in battery / eff to account for losses (rough)
      rows.push(`<li><strong>Troço ${i+1}</strong> (${kms[i]} km): usar ${fmt(need.energy,1)} kWh → ${fmt(need.pct,1)}%. `+
        `Saída mínima: <strong>${fmt(req,1)}%</strong> (chegar ≥${minsArr[i]}% + buffer ${buffer}%).</li>`);
    }

    // sanity: cap >100
    const caps = dep.map(v => (v===null?null: Math.min(100, v)));
    const anyOver = dep.some(v => v!==null and v>100);

    let warn = '';
    if(anyOver){
      warn = `<div class="slot"><div class="slot__t">⚠️ Atenção</div><div>Algum troço requer saída >100% com estes parâmetros. Revê consumo/buffer/distância ou adiciona paragem.</div></div>`;
    }

    tOut.innerHTML = `${warn}<ul class="list">${rows.join('')}</ul>`;

    // store compact summary for Road tab
    const summary = { kms, cons, buffer, batt, minsArr, dep: caps };
    store.set('targets.summary', summary);
    return summary;
  }

  // helper fix for python mistake: use correct JS boolean
  function hasOver(dep){
    return dep.some(v => v!==null && v>100);
  }

  function calcTargetsFixed(){
    const cons = +$('#t_cons').value;
    const buffer = +$('#t_buffer').value;
    const batt = +$('#t_batt').value;
    const eff = +$('#t_eff').value/100;
    const kms = [
      +($('#t_km1').value||0),
      +($('#t_km2').value||0),
      +($('#t_km3').value||0),
      +($('#t_km4').value||0)
    ];
    const minsArr = [20,20,20,30];

    function legNeedPct(km){
      const energy = km * cons / 100.0;
      const pct = (energy / batt)*100.0;
      return {energy, pct};
    }

    const dep = [];
    const rows = [];
    for(let i=0;i<4;i++){
      if(!(kms[i]>0)){
        rows.push(`<li>Troço ${i+1}: inserir km para calcular.</li>`);
        dep.push(null);
        continue;
      }
      const need = legNeedPct(kms[i]);
      const req = minsArr[i] + buffer + need.pct;
      dep.push(req);
      rows.push(`<li><strong>Troço ${i+1}</strong> (${kms[i]} km): usar ${fmt(need.energy,1)} kWh → ${fmt(need.pct,1)}%. `+
        `Saída mínima: <strong>${fmt(req,1)}%</strong> (chegar ≥${minsArr[i]}% + buffer ${buffer}%).</li>`);
    }

    const caps = dep.map(v => (v===null?null: Math.min(100, v)));
    const anyOver = hasOver(dep);
    let warn = '';
    if(anyOver){
      warn = `<div class="slot"><div class="slot__t">⚠️ Atenção</div><div>Algum troço requer saída >100% com estes parâmetros. Revê consumo/buffer/distância ou adiciona paragem.</div></div>`;
    }

    // extra: show how much to add at each stop if you choose to depart at the minimum
    const extra = [];
    // assume you arrive at minimum (minsArr) each time (conservative), then you need to charge up to dep for next leg.
    // charging needed from Leiria for leg2, from Lisboa for leg3, from Almodovar for leg4
    for(let i=1;i<4;i++){
      if(dep[i]===null) { extra.push(null); continue; }
      const addPct = Math.max(0, dep[i] - minsArr[i-1]);
      const addKwh = (addPct/100)*batt;
      extra.push({addPct, addKwh});
    }

    const extraHtml = `<div class="slot"><div class="slot__t">Carga mínima (se chegares nos mínimos)</div>`+
      `<div class="muted">Leiria: +${extra[1]?fmt(extra[1].addPct,1):'?'}% (${extra[1]?fmt(extra[1].addKwh,1):'?'} kWh) • `+
      `Lisboa: +${extra[2]?fmt(extra[2].addPct,1):'?'}% (${extra[2]?fmt(extra[2].addKwh,1):'?'} kWh) • `+
      `Almodôvar: +${extra[3]?fmt(extra[3].addPct,1):'?'}% (${extra[3]?fmt(extra[3].addKwh,1):'?'} kWh)</div></div>`;

    tOut.innerHTML = `${warn}${extraHtml}<ul class="list">${rows.join('')}</ul>`;

    const summary = { kms, cons, buffer, batt, minsArr, dep: caps };
    store.set('targets.summary', summary);
    return summary;
  }

  $('#t_calc')?.addEventListener('click', calcTargetsFixed);
  $('#t_fill')?.addEventListener('click', ()=>{
    // example-only values; user should replace with real Maps distances
    if(!$('#t_km1').value) $('#t_km1').value = 190;
    if(!$('#t_km2').value) $('#t_km2').value = 140;
    if(!$('#t_km3').value) $('#t_km3').value = 170;
    if(!$('#t_km4').value) $('#t_km4').value = 140;
    calcTargetsFixed();
  });

  // Road quick calc uses saved values
  const roadSocOut = $('#road_soc_out');
  function roadSocQuick(){
    const s = store.get('targets.summary', null);
    if(!s){ roadSocOut.textContent = 'Ainda não há targets guardados. Vai à tab EV → Targets de SOC e calcula.'; return; }
    const [a,b,c,d] = s.dep;
    roadSocOut.innerHTML = `Saídas mínimas (com buffer ${s.buffer}%):`+
      `<br>Porto→Leiria: <strong>${a?fmt(a,1):'?'}%</strong>`+
      `<br>Leiria→Lisboa: <strong>${b?fmt(b,1):'?'}%</strong>`+
      `<br>Lisboa→Almodôvar: <strong>${c?fmt(c,1):'?'}%</strong>`+
      `<br>Almodôvar→Vila da Telha: <strong>${d?fmt(d,1):'?'}%</strong>`;
  }
  $('#road_soc_quick')?.addEventListener('click', roadSocQuick);

  // --- Checklists
  const ctn = $('#checklistsContainer');
  const search = $('#checkSearch');
  const resetBtn = $('#checkReset');
  const stateKey = 'check.state';
  let checked = store.get(stateKey, {});

  function renderChecks(){
    if(!ctn || !window.TRIP_DATA) return;
    const q = norm(search?.value || '');
    ctn.innerHTML = '';
    window.TRIP_DATA.checklists.forEach(list=>{
      const card = document.createElement('article');
      card.className = 'card';
      const title = document.createElement('div');
      title.className = 'card__title';
      title.textContent = list.title;
      const body = document.createElement('div');
      body.className = 'card__body';
      const ul = document.createElement('ul');
      ul.style.listStyle='none';
      ul.style.padding='0';
      ul.style.margin='0';

      let shown = 0;
      list.items.forEach((item, idx)=>{
        const id = `${list.id}.${idx}`;
        if(q && !norm(item).includes(q)) return;
        shown++;
        const li = document.createElement('li');
        li.style.display='flex';
        li.style.alignItems='center';
        li.style.gap='10px';
        li.style.padding='8px 0';
        li.style.borderBottom='1px solid var(--border)';
        const cb = document.createElement('input');
        cb.type='checkbox';
        cb.checked = !!checked[id];
        const span = document.createElement('span');
        span.textContent = item;
        function sync(){
          span.style.color = cb.checked ? 'var(--muted)' : 'var(--text)';
          span.style.textDecoration = cb.checked ? 'line-through' : 'none';
        }
        sync();
        cb.addEventListener('change', ()=>{
          checked[id] = cb.checked;
          store.set(stateKey, checked);
          sync();
        });
        li.appendChild(cb);
        li.appendChild(span);
        ul.appendChild(li);
      });

      if(shown === 0){
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'Sem itens a mostrar com este filtro.';
        body.appendChild(p);
      } else {
        body.appendChild(ul);
      }

      card.appendChild(title);
      card.appendChild(body);
      ctn.appendChild(card);
    });
  }

  search?.addEventListener('input', renderChecks);
  resetBtn?.addEventListener('click', ()=>{
    checked = {};
    store.set(stateKey, checked);
    renderChecks();
    toast('Checklists limpas');
  });

  // Notes
  const notes = $('#notes');
  const notesKey = 'notes.text';
  if(notes){
    notes.value = store.get(notesKey, '');
    $('#notesSave')?.addEventListener('click', ()=>{ store.set(notesKey, notes.value); toast('Notas guardadas ✅'); });
    $('#notesClear')?.addEventListener('click', ()=>{ notes.value=''; store.set(notesKey,''); toast('Notas apagadas'); });
  }

  // Road notes
  const roadNotes = $('#road_notes');
  const roadNotesKey = 'road.notes';
  if(roadNotes){
    roadNotes.value = store.get(roadNotesKey, '');
    $('#road_notes_save')?.addEventListener('click', ()=>{ store.set(roadNotesKey, roadNotes.value); toast('Guardado ✅'); });
    $('#road_notes_clear')?.addEventListener('click', ()=>{ roadNotes.value=''; store.set(roadNotesKey,''); toast('Apagado'); });
  }

  // Init
  function init(){
    renderPOI();
    renderDirections();
    renderFood();
    initDay();
    renderChecks();
    // run defaults
    socCalc(); ctCalc(); bpCalc(); kwhToPct(); homeCalc();
    roadBreaksCalc();
    // try render saved targets in road
    roadSocQuick();
    // compute targets if already filled
    if($('#t_km1')?.value || $('#t_km2')?.value || $('#t_km3')?.value || $('#t_km4')?.value) calcTargetsFixed();
  }

  init();

})();
