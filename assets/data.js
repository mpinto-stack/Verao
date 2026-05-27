window.TRIP_DATA={
  poi:[
    {name:'IONITY Leiria (A1)',note:'Pausa + DC 15–25 min',maps:'https://www.google.com/maps/search/?api=1&query=IONITY%20Leiria%20A1%20%C3%A1rea%20de%20servi%C3%A7o%20Cepsa'},
    {name:'Pavilhão do Conhecimento',note:'Paragem grande (indoor)',maps:'https://www.google.com/maps/dir/?api=1&destination=Pavilh%C3%A3o%20do%20Conhecimento%2C%20Lisboa'},
    {name:'Centro Vasco da Gama (AC)',note:'AC 22 kW (cabo Type2)',maps:'https://www.google.com/maps/dir/?api=1&destination=Centro%20Vasco%20da%20Gama%2C%20Lisboa'},
    {name:'IONITY Almodôvar (A2)',note:'Top-up 10–20 min',maps:'https://www.google.com/maps/search/?api=1&query=IONITY%20Almod%C3%B4var%20A2%20%C3%A1rea%20de%20servi%C3%A7o'}
  ],
  offlineDirections:[
    {title:'Ida',lines:['Porto → A1 → Leiria.','Leiria → Lisboa (Parque das Nações).','Lisboa → A2 → Almodôvar.','Almodôvar → Aljezur (Vila da Telha).']},
    {title:'Volta',lines:['Sair com SOC alto.','Aljezur → Almodôvar.','Almodôvar → Lisboa.','Lisboa → Leiria → Porto.']}
  ],
  dailyPlans:[
    {date:'Dom 28/06',title:'Aterragem',A:{morning:{title:'Manhã',text:'Piscina e unpack.'},midday:{title:'Meio‑dia',text:'Sombra/piscina + sesta.'},evening:{title:'Fim de tarde',text:'Miradouro curto.'}},B:{morning:{title:'Manhã',text:'Calmo.'},midday:{title:'Meio‑dia',text:'Calmo.'},evening:{title:'Fim de tarde',text:'Regressar cedo.'}}}
  ],
  food:[
    {name:'Vale da Telha (perto)',type:'Casual',note:'Ir cedo',maps:'https://www.google.com/maps/search/?api=1&query=restaurante%20Vale%20da%20Telha'},
    {name:'Arrifana',type:'Peixe',note:'Reservar se possível',maps:'https://www.google.com/maps/search/?api=1&query=restaurante%20Arrifana'}
  ],
  checklists:[{id:'estrada',title:'Estrada',items:['Cabo Type2','Granny 10A','Toalhitas','Resguardos']}]
};
