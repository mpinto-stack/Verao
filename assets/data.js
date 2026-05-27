// v2 data (editável)
window.TRIP_DATA = {
  meta: {
    title: 'Aljezur 2026',
    dates: '27/06/2026 – 03/07/2026',
    base: 'Urbanização Vila da Telha',
    car: 'XPeng G6 Standard MY24',
    rules: ['Chegar aos carregadores ≥20%', 'Chegar ao destino ≥30%'],
  },

  poi: [
    { name: 'IONITY Leiria (A1)', note: 'Pausa + DC 15–25 min', maps: 'https://www.google.com/maps/search/?api=1&query=IONITY%20Leiria%20A1%20%C3%A1rea%20de%20servi%C3%A7o%20Cepsa' },
    { name: 'Pavilhão do Conhecimento', note: 'Paragem grande (indoor)', maps: 'https://www.google.com/maps/dir/?api=1&destination=Pavilh%C3%A3o%20do%20Conhecimento%2C%20Lisboa' },
    { name: 'Centro Vasco da Gama (AC)', note: 'Carregar 22 kW (cabo Type2)', maps: 'https://www.google.com/maps/dir/?api=1&destination=Centro%20Vasco%20da%20Gama%2C%20Lisboa' },
    { name: 'IONITY Almodôvar (A2)', note: 'Top-up 10–20 min', maps: 'https://www.google.com/maps/search/?api=1&query=IONITY%20Almod%C3%B4var%20A2%20%C3%A1rea%20de%20servi%C3%A7o' },
    { name: 'Mercado Municipal de Aljezur', note: '08:00–13:00 (seg–sáb)', maps: 'https://www.google.com/maps/search/?api=1&query=Mercado%20Municipal%20de%20Aljezur' },
    { name: 'Praia de Odeceixe', note: 'Rio+mar; lagoas na maré baixa', maps: 'https://www.google.com/maps/search/?api=1&query=Praia%20de%20Odeceixe' },
    { name: 'Rîbat da Arrifana', note: 'Ponta da Atalaia — curto e visual', maps: 'https://www.google.com/maps/search/?api=1&query=R%C3%AEbat%20da%20Arrifana%20Ponta%20da%20Atalaia' }
  ],

  offlineDirections: [
    { title: 'Ida (resumo)', lines: [
      'Porto → A1 → Leiria (pausa/carregar).',
      'Leiria → Lisboa (Parque das Nações) (visita + almoço + AC).',
      'Lisboa → A2 → Almodôvar (top-up curto).',
      'Almodôvar → IC1/A22 consoante rota → Aljezur (Vila da Telha).'
    ]},
    { title: 'Volta (resumo)', lines: [
      'Sair com SOC alto (ideal 90–100%).',
      'Aljezur → A2 (Almodôvar) pausa/top-up se necessário.',
      'Almodôvar → Lisboa (almoço + AC se útil).',
      'Lisboa → Leiria (último top-up) → Porto.'
    ]}
  ],

  dailyPlans: [
    {
      date: 'Dom 28/06',
      title: 'Aterragem',
      A: {
        morning: { title: 'Manhã', text: 'Piscina + unpack + compras pequenas se preciso.' },
        midday: { title: 'Meio‑dia', text: 'Sombra/piscina + sesta + refeição em casa.' },
        evening: { title: 'Fim de tarde', text: 'Arrifana: miradouro e passeio curto (sem ficar muito tempo).', linkText: 'Arrifana (Maps)', link: 'https://www.google.com/maps/search/?api=1&query=Praia%20da%20Arrifana' }
      },
      B: {
        morning: { title: 'Manhã', text: 'Só rotina calma + piscina.' },
        midday: { title: 'Meio‑dia', text: 'Sombra + sesta.' },
        evening: { title: 'Fim de tarde', text: 'Passeio de carro curto e regressar cedo.' }
      }
    },
    {
      date: 'Seg 29/06',
      title: 'Mercado + vila',
      A: {
        morning: { title: 'Manhã', text: 'Mercado Municipal (08:00–13:00) cedo; compras para refeições em casa.', linkText: 'Mercado (Maps)', link: 'https://www.google.com/maps/search/?api=1&query=Mercado%20Municipal%20de%20Aljezur' },
        midday: { title: 'Meio‑dia', text: 'Piscina + sesta + refeição em casa.' },
        evening: { title: 'Fim de tarde', text: 'Passeio curto na vila + castelo (se estiver fresco).', linkText: 'Aljezur (Maps)', link: 'https://www.google.com/maps/search/?api=1&query=Castelo%20de%20Aljezur' }
      },
      B: {
        morning: { title: 'Manhã', text: 'Mercado rápido + voltar.' },
        midday: { title: 'Meio‑dia', text: 'Piscina e descanso.' },
        evening: { title: 'Fim de tarde', text: 'Só vila/café (curto), sem castelo.' }
      }
    },
    {
      date: 'Ter 30/06',
      title: 'Praia fácil (cedo)',
      A: {
        morning: { title: 'Manhã', text: 'Praia cedo (escolher acesso fácil) + sair antes do pico.' },
        midday: { title: 'Meio‑dia', text: 'Piscina + sesta + refeição em casa.' },
        evening: { title: 'Fim de tarde', text: 'Jantar cedo (reservar se necessário).' }
      },
      B: {
        morning: { title: 'Manhã', text: 'Vento/cheio: miradouro + café curto.' },
        midday: { title: 'Meio‑dia', text: 'Piscina e descanso.' },
        evening: { title: 'Fim de tarde', text: 'Passeio curto perto de casa.' }
      }
    },
    {
      date: 'Qua 01/07',
      title: 'Odeceixe (rio + mar)',
      A: {
        morning: { title: 'Manhã', text: 'Odeceixe cedo (lagoas na maré baixa são ótimas para crianças).', linkText: 'Odeceixe (Maps)', link: 'https://www.google.com/maps/search/?api=1&query=Praia%20de%20Odeceixe' },
        midday: { title: 'Meio‑dia', text: 'Voltar para piscina + sesta.' },
        evening: { title: 'Fim de tarde', text: 'Compras rápidas + jantar em casa.' }
      },
      B: {
        morning: { title: 'Manhã', text: 'Se estacionamento estiver impossível: trocar por praia mais perto e sair cedo.' },
        midday: { title: 'Meio‑dia', text: 'Piscina e descanso.' },
        evening: { title: 'Fim de tarde', text: 'Miradouro local.' }
      }
    },
    {
      date: 'Qui 02/07',
      title: 'Rîbat + pôr do sol',
      A: {
        morning: { title: 'Manhã', text: 'Manhã livre/piscina — guardar energia para a volta.' },
        midday: { title: 'Meio‑dia', text: 'Sombra + refeição em casa.' },
        evening: { title: 'Fim de tarde', text: 'Rîbat da Arrifana (curto) + regressar cedo.', linkText: 'Rîbat (Maps)', link: 'https://www.google.com/maps/search/?api=1&query=R%C3%AEbat%20da%20Arrifana%20Ponta%20da%20Atalaia' }
      },
      B: {
        morning: { title: 'Manhã', text: 'Piscina e descanso.' },
        midday: { title: 'Meio‑dia', text: 'Sesta.' },
        evening: { title: 'Fim de tarde', text: 'Se vento forte: só passeio de carro curto e recolher cedo.' }
      }
    }
  ],

  checklists: [
    { id:'estrada', title:'Estrada (carro + miúdos)', items:[
      'Cabo Type 2 (AC)',
      'Carregador 10A (granny) + adaptadores necessários',
      'Toalhitas (muitas) + sacos do lixo',
      'Resguardos descartáveis (trocas no carro)',
      'Kit 1ª ajuda (termómetro, pensos, desinfetante)',
      'Muda de roupa rápida (1 por criança, 1 t-shirt adulto)',
      'Snacks simples + água',
      'Carregadores de telemóvel + powerbank',
      'Protetor solar + chapéu/boné',
      'Corta-vento leve (Costa Vicentina)',
      'Brinquedo “novo” pequeno para o de 4 anos',
      'Manta leve / muselina'
    ]},
    { id:'bebe', title:'Bebé (3 meses)', items:[
      'Fraldas + extra',
      'Toalhitas + creme barreira',
      '2–3 mudas completas por dia de viagem',
      'Muselinas (mín. 4)',
      'Biberões / fórmula / esterilização (se aplicável)',
      'Soro fisiológico + gaze',
      'Chupeta(s) extra',
      'Saco para roupa suja'
    ]},
    { id:'crianca', title:'Criança (4 anos)', items:[
      'Mochila com 2 brinquedos + 1 livro',
      'Caderno + canetas',
      'Roupa extra fácil (calções + t-shirt)',
      'Chapéu/boné + óculos (se usa)',
      'Calçado fácil',
      'Lanche + água'
    ]},
    { id:'praia', title:'Praia / Piscina', items:[
      'Tenda/guarda-sol (sombra)',
      'Toalhas (1 extra para pés/areia)',
      'Fato de banho + fralda de água (se aplicável)',
      'After-sun',
      'Sacos para roupa molhada',
      'Brinquedos de areia (1–2 apenas)'
    ]},
    { id:'casa', title:'Casa (mínimo)', items:[
      'Detergente roupa (pequeno) / cápsulas',
      '2 refeições fáceis para o 1º dia',
      'Farmácia mini (conforme orientação pediatra)'
    ]}
  ]
};
