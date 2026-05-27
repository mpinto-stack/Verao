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

  // Tabs logic
  const tabs = $('#tabs');
  const menuBtn = $('#menuBtn');
  const tabBtns = $$('.tab');
  const panels = $$('.panel');
  const defaultTabKey = 'ui.defaultTab';

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

  const initial = (location.hash||'').replace('#','') || store.get(defaultTabKey, 'today');
  const allowed = ['today','trip','map','home','ev','checks','notes','overview'];
  activateTab(allowed.includes(initial) ? initial : 'today', false);

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

  // --- EV calculators persistence
  function bindPersist(ids, prefix){
    ids.forEach(id=>{
      const el = $('#'+id);
      if(!el) return;
      const k = `${prefix}.${id}`;
      const saved = store.get(k, null);
      if(saved !== null && saved !== undefined) el.value = saved;
      el.addEventListener('input', ()=> store.set(k, el.value));
    });
  }
  bindPersist(['soc_distance','soc_consumption','soc_battery','soc_start','soc_min_arrive','soc_buffer'], 'ev');
  bindPersist(['ct_from','ct_to','ct_battery','ct_power','ct_eff','ct_overhead'], 'ev');
  bindPersist(['bp_depart','bp_interval','bp_drive','bp_break'], 'ev');
  bindPersist(['conv_battery','conv_kwh','conv_pct'], 'ev');
  bindPersist(['home_hours','home_kw','home_eff','home_batt'], 'home');

  function fmt(n, d=1){ return (Math.round(n*10**d)/10**d).toFixed(d); }

  // SOC planner
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

  // Charge time
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

  // Break planner
  const bpOut = $('#bp_out');
  function addMinutes(t, mins){
    const [h,m] = t.split(':').map(Number);
    const total = h*60+m+mins;
    const hh = ((Math.floor(total/60)%24)+24)%24;
    const mm = ((total%60)+60)%60;
    return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  }
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

  // Converter
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

  // Home charging calculator
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

  // Checklists
  const ctn = $('#checklistsContainer');
  const search = $('#checkSearch');
  const resetBtn = $('#checkReset');
  const stateKey = 'check.state';
  let checked = store.get(stateKey, {});
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''); }

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

  // Init content
  function init(){
    renderPOI();
    renderDirections();
    initDay();
    renderChecks();
    // run default calculations
    socCalc(); ctCalc(); bpCalc(); kwhToPct(); homeCalc();
  }

  function initDay(){
    if(!window.TRIP_DATA || !daySelect) return;
    daySelect.innerHTML = window.TRIP_DATA.dailyPlans
      .map((d,i)=>`<option value="${i}">${d.date} — ${d.title}</option>`).join('');
    const saved = store.get(dayKey, 0);
    daySelect.value = String(saved);
    renderDay();
  }

  init();

})();
