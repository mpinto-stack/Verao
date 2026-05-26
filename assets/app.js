(function(){
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const store = {
    get(k, d=null){ try{ const v = localStorage.getItem(k); return v===null? d : JSON.parse(v);}catch{ return d;} },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
  };

  // Mobile menu
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  if(menuBtn){
    menuBtn.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    $$('#nav a').forEach(a=>a.addEventListener('click', ()=>{
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false');
    }));
  }

  // Copy summary
  const copyBtn = $('#copySummaryBtn');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      const txt = `Plano Porto⇄Aljezur (Vila da Telha) 27/06–03/07/2026\n`+
        `Carro: XPeng G6 Standard MY24 | Condução: 120 km/h\n`+
        `Regras: chegar a carregadores ≥20% e ao destino ≥30%\n`+
        `Ida (sugestão): IONITY Leiria → Lisboa (Pavilhão do Conhecimento + AC no Vasco da Gama) → IONITY Almodôvar → Aljezur\n`+
        `Volta: espelho da ida | Véspera: carregar em tomada 10A para 90–100%\n`;
      try{
        await navigator.clipboard.writeText(txt);
        toast('Resumo copiado ✅');
      }catch{
        toast('Não consegui copiar. Seleciona e copia manualmente.');
      }
    });
  }

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
      t.style.background='rgba(15,27,47,.95)';
      t.style.border='1px solid rgba(255,255,255,.12)';
      t.style.padding='10px 12px';
      t.style.borderRadius='14px';
      t.style.boxShadow='0 12px 30px rgba(0,0,0,.35)';
      t.style.zIndex='100';
      t.style.fontSize='13px';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity='1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(()=>{t.style.opacity='0';}, 2200);
  }

  // EV calculators persistence
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

  // SOC planner
  const socOut = $('#soc_out');
  function fmt(n, d=1){ return (Math.round(n*10**d)/10**d).toFixed(d); }
  function socCalc(){
    const km = +$('#soc_distance').value;
    const cons = +$('#soc_consumption').value; // kWh/100km
    const batt = +$('#soc_battery').value;
    const start = +$('#soc_start').value;
    const minArr = +$('#soc_min_arrive').value;
    const buffer = +$('#soc_buffer').value;

    const energy = km * cons / 100.0;
    const pctUsed = energy / batt * 100.0;
    const arrive = start - pctUsed - buffer;
    const ok = arrive >= minArr;

    const neededStart = minArr + pctUsed + buffer;
    const extraPct = Math.max(0, neededStart - start);
    const extraKwh = extraPct/100*batt;

    socOut.innerHTML = `Energia estimada: <strong>${fmt(energy,1)} kWh</strong>\n`+
      `<br>% usado: <strong>${fmt(pctUsed,1)}%</strong> ( + buffer ${buffer}%)`+
      `<br>SOC ao chegar: <strong style="color:${ok?'#22c55e':'#ef4444'}">${fmt(arrive,1)}%</strong>`+
      `<br>${ok?'✅ Cumpre mínimo.':'⚠️ Abaixo do mínimo.'} `+
      `${ok?'':'Precisas de sair com '}<strong>${fmt(neededStart,1)}%</strong>`+
      `${ok?'':' (+'+fmt(extraPct,1)+'% ≈ '+fmt(extraKwh,1)+' kWh)'}.`;
  }
  $('#soc_calc')?.addEventListener('click', socCalc);
  $('#soc_reset')?.addEventListener('click', ()=>{
    $('#soc_distance').value=200;
    $('#soc_consumption').value=19.0;
    $('#soc_battery').value=66;
    $('#soc_start').value=80;
    $('#soc_min_arrive').value=30;
    $('#soc_buffer').value=5;
    socCalc();
  });
  socCalc();

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

    ctOut.innerHTML = `Energia a carregar: <strong>${fmt(kwh,1)} kWh</strong>`+
      `<br>Tempo estimado: <strong>${Math.round(mins)} min</strong> (inclui +${overhead} min de overhead)`+
      `<br><span class="muted">Dica: se o tempo estiver longo, baixa o alvo para 70–80% e faz um top-up extra mais tarde.</span>`;
  }
  $('#ct_calc')?.addEventListener('click', ctCalc);
  ctCalc();

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
    bpOut.innerHTML = lines.length ? '<pre>'+lines.join('\n')+'</pre>' : 'Sem pausas intermédias (duração curta).';
  }
  $('#bp_calc')?.addEventListener('click', bpCalc);
  bpCalc();

  // Converter
  const convOut = $('#conv_out');
  function kwhToPct(){
    const batt = +$('#conv_battery').value;
    const kwh = +$('#conv_kwh').value;
    const pct = (kwh/batt)*100;
    $('#conv_pct').value = fmt(pct,1);
    convOut.textContent = `${kwh} kWh ≈ ${fmt(pct,1)}% (bateria ${batt} kWh)`;
  }
  function pctToKwh(){
    const batt = +$('#conv_battery').value;
    const pct = +$('#conv_pct').value;
    const kwh = batt*(pct/100);
    $('#conv_kwh').value = fmt(kwh,1);
    convOut.textContent = `${pct}% ≈ ${fmt(kwh,1)} kWh (bateria ${batt} kWh)`;
  }
  $('#conv_kwh_to_pct')?.addEventListener('click', kwhToPct);
  $('#conv_pct_to_kwh')?.addEventListener('click', pctToKwh);
  kwhToPct();

  // Checklists
  const ctn = $('#checklistsContainer');
  const search = $('#checkSearch');
  const resetBtn = $('#checkReset');
  const stateKey = 'check.state';
  let checked = store.get(stateKey, {});

  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''); }

  function render(){
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
      ul.className = 'check';
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
        li.style.borderBottom='1px solid rgba(255,255,255,.06)';

        const cb = document.createElement('input');
        cb.type='checkbox';
        cb.checked = !!checked[id];
        cb.addEventListener('change', ()=>{
          checked[id] = cb.checked;
          store.set(stateKey, checked);
        });

        const span = document.createElement('span');
        span.textContent = item;
        span.style.color = cb.checked ? '#a7b0c0' : '#e5e7eb';
        span.style.textDecoration = cb.checked ? 'line-through' : 'none';

        cb.addEventListener('change', ()=>{
          span.style.color = cb.checked ? '#a7b0c0' : '#e5e7eb';
          span.style.textDecoration = cb.checked ? 'line-through' : 'none';
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
      }else{
        body.appendChild(ul);
      }

      card.appendChild(title);
      card.appendChild(body);
      ctn.appendChild(card);
    });
  }

  search?.addEventListener('input', render);
  resetBtn?.addEventListener('click', ()=>{
    checked = {};
    store.set(stateKey, checked);
    render();
    toast('Checklists limpas');
  });
  render();

  // Notes
  const notes = $('#notes');
  const notesKey = 'notes.text';
  if(notes){
    notes.value = store.get(notesKey, '');
    $('#notesSave')?.addEventListener('click', ()=>{ store.set(notesKey, notes.value); toast('Notas guardadas ✅'); });
    $('#notesClear')?.addEventListener('click', ()=>{ notes.value=''; store.set(notesKey,''); toast('Notas apagadas'); });
  }

})();
