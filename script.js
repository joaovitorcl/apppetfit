/**
 * ═══════════════════════════════════════════════════════════════
 *  PETFIT SYNC v7.0 — script.js
 *  PWA de Gestão de Hábitos para Pets e Tutores
 *  Features: Skeletons | DataLayer | Gestures (Pull, Swipe, Long-Press)
 *            + Dark Mode Adaptativo | Microinterações | Tipografia Escalonável
 *            + Exercícios por categoria com vídeo-tutorial no YouTube (v6.0)
 *            + Exercícios ligados ao contexto da tarefa: fase, título, horário e segurança (v7.0)
 *  ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 1: FIREBASE CONFIG (DESCOMENTE PARA USAR)
// ═══════════════════════════════════════════════════════════════
/*
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const auth = firebase.auth();
*/

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 2: DATALAYER
// ═══════════════════════════════════════════════════════════════
const CONFIG = { useFirebase: false };

const DataLayer = {
  _local: {
    keys: {
      habits: 'petfit_habits', profile: 'petfit_profile',
      history: 'petfit_history', exercises: 'petfit_exercises',
      lastDate: 'petfit_lastDate', gestureHint: 'petfit_gestureHint'
    },
    async getAll() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            habits: this._get(this.keys.habits, null),
            profile: this._get(this.keys.profile, null),
            history: this._get(this.keys.history, []),
            exercises: this._get(this.keys.exercises, 0),
            lastDate: this._get(this.keys.lastDate, ''),
            gestureHint: this._get(this.keys.gestureHint, false)
          });
        }, 700);
      });
    },
    async saveHabits(h) { this._set(this.keys.habits, h); return true; },
    async saveProfile(p) { this._set(this.keys.profile, p); return true; },
    async saveHistory(h) { this._set(this.keys.history, h); return true; },
    async saveExercises(c) { this._set(this.keys.exercises, c); return true; },
    async saveLastDate(d) { this._set(this.keys.lastDate, d); return true; },
    async saveGestureHint(s) { this._set(this.keys.gestureHint, s); return true; },
    _get(key, def) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; } },
    _set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; } }
  },

  _firebase: {
    async getAll() {
      const user = firebase.auth().currentUser;
      if (!user) await firebase.auth().signInAnonymously();
      const uid = firebase.auth().currentUser.uid;
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        return { habits: data.habits || null, profile: data.profile || null, history: data.history || [], exercises: data.exercises || 0, lastDate: data.lastDate || '', gestureHint: data.gestureHint || false };
      }
      return { habits: null, profile: null, history: [], exercises: 0, lastDate: '', gestureHint: false };
    },
    async saveHabits(h) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ habits: h }); return true; },
    async saveProfile(p) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ profile: p }); return true; },
    async saveHistory(h) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ history: h }); return true; },
    async saveExercises(c) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ exercises: c }); return true; },
    async saveLastDate(d) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ lastDate: d }); return true; },
    async saveGestureHint(s) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ gestureHint: s }); return true; }
  },

  driver() { return CONFIG.useFirebase ? this._firebase : this._local; },
  async getAll() { return this.driver().getAll(); },
  async saveHabits(h) { return this.driver().saveHabits(h); },
  async saveProfile(p) { return this.driver().saveProfile(p); },
  async saveHistory(h) { return this.driver().saveHistory(h); },
  async saveExercises(c) { return this.driver().saveExercises(c); },
  async saveLastDate(d) { return this.driver().saveLastDate(d); },
  async saveGestureHint(s) { return this.driver().saveGestureHint(s); }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 3: EXERCÍCIOS
// ═══════════════════════════════════════════════════════════════
/**
 * Biblioteca de vídeos (YouTube) — um por TIPO de exercício.
 * Vários exercícios/categorias podem apontar para o mesmo vídeo.
 * Para trocar um vídeo, mude só o `id` (o trecho depois de "watch?v=" na URL).
 */
const ExerciseVideos = {
  // força e cardio
  agachamento:    { nome: 'Agachamento',                 id: 'bxq2eVZl9nY' },
  agachamentoIso: { nome: 'Agachamento isométrico',      id: '9SykC08Be-I' },
  parede:         { nome: 'Agachamento na parede',       id: 'zyg4o-91JrY' },
  afundo:         { nome: 'Afundo alternado',            id: 'gFzol9TFkGM' },
  panturrilha:    { nome: 'Elevação de panturrilha',     id: 'fymX9oQ8IRM' },
  polichinelo:    { nome: 'Polichinelo',                 id: 'S2uqQ9zHZMc' },
  corda:          { nome: 'Pular corda imaginária',      id: 'VeVuFwdJf-M' },
  joelhos:        { nome: 'Corrida parada, joelho alto', id: 'fnv5fgl03Oo' },
  tiros:          { nome: 'Tiros de corrida',            id: 'ckADsFBJ4jo' },
  caminhada:      { nome: 'Caminhada acelerada',         id: 'DoPDU149KvU' },
  escada:         { nome: 'Subir escadas',               id: 'Wsm9NBIjQyI' },
  prancha:        { nome: 'Prancha',                     id: 'Yu0wjtD5FkU' },
  flexao:         { nome: 'Flexão de braço',             id: 'Azw6BZ8-wSM' },
  abdominal:      { nome: 'Abdominal',                   id: 'w08qG9nQZ_Q' },
  equilibrio:     { nome: 'Equilíbrio em um pé só',      id: 'DzWX2a5Psxc' },   // v7.0
  // mobilidade
  ombros:         { nome: 'Mobilidade de ombros',        id: 'kycQbO08Pg4' },
  punhos:         { nome: 'Mobilidade de punhos',        id: 'S1BqYYaZz3Y' },
  tornozelo:      { nome: 'Mobilidade de tornozelo',     id: 'hUc-BV3tQP8' },
  tronco:         { nome: 'Rotação de tronco',           id: 'ecdia5Nyjvs' },
  gatoCamelo:     { nome: 'Gato-camelo (coluna)',        id: 'QKOxQMx5dk4' },   // v7.0
  // alongamentos e relaxamento
  alongamento:    { nome: 'Alongamento em pé',           id: 'Ty5kwQgXUrI' },
  lateral:        { nome: 'Alongamento lateral',         id: 'uesSifgbdpI' },
  pescoco:        { nome: 'Alongamento de pescoço',      id: 'UPJh_JI35IQ' },   // v7.0
  alongPanturrilha: { nome: 'Alongamento de panturrilha', id: 'ltH2dnWUnPY' },  // v7.0
  alongQuadriceps:  { nome: 'Alongamento de quadríceps',  id: '4sEq7OYYee0' },  // v7.0
  alongPosterior:   { nome: 'Alongamento de posterior de coxa', id: 'zllICZRjSj0' }, // v7.0
  respiracao:     { nome: 'Respiração diafragmática',    id: 'mfTdcEvqm0w' }    // v7.0
};
const youtubeUrl = id => 'https://www.youtube.com/watch?v=' + id;

/**
 * v7.0 — CONTEXTO DE CADA CATEGORIA
 *  nome/artigo : para montar "Durante o passeio", "Antes da medicação"…
 *  seguranca   : aviso padrão exibido quando o exercício não tem dica própria
 *  subs        : subcontextos detectados pelo TÍTULO do hábito (palavras-chave, sem acento).
 *                Ex.: "Passeio no parque" ativa o subcontexto `parque`.
 */
const ExerciseContext = {
  alimentacao: {
    nome: 'alimentação', artigo: 'a', emoji: '🍖',
    seguranca: 'Perto do pote, movimentos suaves e sem barulho: o pet come melhor sem distração.',
    subs: { agua: ['agua','hidrat','bebedouro'], petisco: ['petisco','biscoito','snack','recompensa','osso'] }
  },
  passeio: {
    nome: 'passeio', artigo: 'o', emoji: '🦮',
    seguranca: 'Guia numa mão e pet ao seu lado: só faça o exercício em local seguro, longe de ruas e carros.',
    subs: { parque: ['parque','praca','trilha','campo','corrida'], rapido: ['rapid','curto','xixi','necessidade'] }
  },
  medicacao: {
    nome: 'medicação', artigo: 'a', emoji: '💊',
    seguranca: 'O pet precisa de calma: movimentos lentos e sem barulho. Exercícios mais intensos só depois de medicar.',
    subs: { topico: ['colirio','pomada','gota','ouvido','curativo','ferida','olho'] }
  },
  escovacao: {
    nome: 'escovação', artigo: 'a', emoji: '🪮',
    seguranca: 'Se ficar muito tempo agachado, alterne a postura e proteja as costas.',
    subs: { dentes: ['dente','dental','oral','boca'] }
  },
  brincadeira: {
    nome: 'brincadeira', artigo: 'a', emoji: '🎾',
    seguranca: 'Cuidado para não tropeçar no pet: escolha um espaço livre e sem piso escorregadio.',
    subs: { bola: ['bola','buscar','frisbee','disco'], laser: ['laser','varinha','pena','gato','caca'] }
  },
  higiene: {
    nome: 'higiene', artigo: 'a', emoji: '🛁',
    seguranca: 'Piso molhado escorrega: nada de saltos ou equilíbrio em um pé, e tenha sempre um apoio por perto.',
    subs: { unhas: ['unha','corte'], limpeza: ['areia','caixa','coco','limpeza','tapete'] }
  },
  outro: {
    nome: '', artigo: '', emoji: '✨',
    seguranca: 'Escolha um espaço seguro e respeite o seu ritmo.',
    subs: {}
  }
};

/**
 * Exercícios por categoria. Cada item:
 *  text  : frase mostrada ao usuário
 *  video : chave de ExerciseVideos
 *  fase  : 'antes' | 'durante' | 'depois' | 'qualquer' (quando fazer em relação à tarefa)
 *  sub   : (opcional) só aparece se o título do hábito ativar esse subcontexto
 *  noite : false = não sugerir à noite (barulho, saltos, pouca luz)
 *  dica  : (opcional) cuidado específico deste exercício nesta tarefa
 *
 * Critério: o exercício nunca atrapalha a tarefa.
 *  · alimentação → silencioso e perto da bancada, sem assustar o pet que come
 *  · passeio     → de pé, com uma mão livre para a guia; nada no chão
 *  · medicação   → calmo antes; o que cansa fica para depois da dose
 *  · escovação   → poupa costas, punhos e ombros, que trabalham na tarefa
 *  · brincadeira → dinâmico, aproveitando os momentos em que o pet corre
 *  · higiene     → sem saltos nem equilíbrio (piso molhado)
 */
const ExerciseDB = {
  alimentacao: [
    { text: "Ao pegar o pote, desça em agachamento e suba devagar (10 vezes)", video: 'agachamento', fase: 'antes', dica: "Costas retas e joelhos alinhados com os pés." },
    { text: "Enquanto o pet come, fique num pé só por 20s de cada lado", video: 'equilibrio', fase: 'durante', dica: "Fique perto da bancada para se apoiar, se precisar." },
    { text: "Enquanto o pet come, faça 12 elevações de panturrilha", video: 'panturrilha', fase: 'durante' },
    { text: "Encoste na parede e segure o agachamento por 30 segundos", video: 'parede', fase: 'durante' },
    { text: "Rode os ombros 15 vezes para trás e para frente", video: 'ombros', fase: 'durante' },
    { text: "Quando ele terminar, estique os braços para cima e alongue por 20 segundos", video: 'alongamento', fase: 'depois' },
    { text: "Ao encher o bebedouro, faça 12 elevações de panturrilha", video: 'panturrilha', fase: 'antes', sub: 'agua' },
    { text: "Ao colocar o bebedouro no chão, desça em 10 agachamentos lentos", video: 'agachamento', fase: 'durante', sub: 'agua' },
    { text: "A cada petisco entregue, faça 1 agachamento (até 10)", video: 'agachamento', fase: 'durante', sub: 'petisco', dica: "Peça \"senta\" e agache enquanto ele espera." },
    { text: "Depois do petisco, alongue o pescoço por 15s para cada lado", video: 'pescoco', fase: 'depois', sub: 'petisco' }
  ],
  passeio: [
    { text: "Enquanto coloca a guia, faça 10 círculos com cada tornozelo", video: 'tornozelo', fase: 'antes', dica: "Segure no batente da porta para se apoiar." },
    { text: "Acelere o passo por 2 minutos, com o pet trotando ao seu lado", video: 'caminhada', fase: 'durante', dica: "Só aumente o ritmo se o pet acompanhar sem puxar a guia." },
    { text: "Enquanto o pet fareja, faça 12 afundos alternados", video: 'afundo', fase: 'durante', dica: "Segure a guia curta e mantenha os pés firmes." },
    { text: "Ao recolher o cocô, desça em agachamento com as costas retas", video: 'agachamento', fase: 'durante', dica: "Agache de verdade, sem curvar as costas para pegar." },
    { text: "Se houver um degrau baixo, suba e desça 2 vezes", video: 'escada', fase: 'durante', noite: false, dica: "Escolha um degrau firme e bem iluminado." },
    { text: "Quando o pet parar, levante os joelhos alternadamente por 30 segundos", video: 'joelhos', fase: 'durante' },
    { text: "Ao chegar em casa, alongue as panturrilhas por 30s cada", video: 'alongPanturrilha', fase: 'depois' },
    { text: "Ao chegar em casa, alongue a frente da coxa por 20s cada perna", video: 'alongQuadriceps', fase: 'depois', dica: "Apoie-se na parede para não perder o equilíbrio." },
    { text: "Ao chegar em casa, alongue a parte de trás da coxa por 20 segundos", video: 'alongPosterior', fase: 'depois' },
    { text: "Em área cercada e segura, faça 3 tiros curtos de 20s com o pet", video: 'tiros', fase: 'durante', sub: 'parque', noite: false, dica: "Nunca enrole a guia na mão e corra só onde não há trânsito." },
    { text: "Faça 3 minutos de caminhada acelerada e 1 minuto em ritmo normal", video: 'caminhada', fase: 'durante', sub: 'parque' },
    { text: "Enquanto ele faz as necessidades, faça 15 elevações de panturrilha", video: 'panturrilha', fase: 'durante', sub: 'rapido' },
    { text: "Enquanto espera, rode os ombros 15 vezes", video: 'ombros', fase: 'durante', sub: 'rapido' }
  ],
  medicacao: [
    { text: "Antes de chamar o pet, faça 5 respirações lentas: inspire 4s, solte 6s", video: 'respiracao', fase: 'antes', dica: "Pets percebem a tensão do tutor: um tutor calmo facilita a dose." },
    { text: "Enquanto separa o remédio, faça 10 rotações lentas de ombros", video: 'ombros', fase: 'antes' },
    { text: "Antes de medicar, incline a cabeça para cada lado e segure 15s", video: 'pescoco', fase: 'antes' },
    { text: "Depois de medicar, estique os braços para cima e segure por 15s", video: 'alongamento', fase: 'depois' },
    { text: "Depois de medicar, gire o tronco 10 vezes para cada lado", video: 'tronco', fase: 'depois' },
    { text: "Depois de medicar, segure a prancha por 20 segundos", video: 'prancha', fase: 'depois', dica: "Só depois que o pet estiver calmo e longe de você." },
    { text: "Depois de medicar e elogiar o pet, faça 8 flexões de braço", video: 'flexao', fase: 'depois', dica: "Só depois que o pet estiver calmo e longe de você." },
    { text: "Depois de medicar, faça 12 abdominais curtos", video: 'abdominal', fase: 'depois' },
    { text: "Antes de aplicar, faça 5 respirações lentas para firmar as mãos", video: 'respiracao', fase: 'antes', sub: 'topico', dica: "Mãos firmes evitam acidentes na aplicação." },
    { text: "Antes de aplicar, aqueça os punhos: 10 círculos para cada lado", video: 'punhos', fase: 'antes', sub: 'topico' },
    { text: "Depois de aplicar, alongue o pescoço por 15s para cada lado", video: 'pescoco', fase: 'depois', sub: 'topico' }
  ],
  escovacao: [
    { text: "Antes de começar, faça 10 rotações de ombros", video: 'ombros', fase: 'antes' },
    { text: "Aqueça os punhos: 10 círculos para cada lado", video: 'punhos', fase: 'antes' },
    { text: "Escove com os joelhos dobrados em agachamento isométrico por 30s", video: 'agachamentoIso', fase: 'durante', dica: "Alterne a perna de apoio e mantenha as costas retas." },
    { text: "Se escovar em pé, levante os calcanhares 15 vezes", video: 'panturrilha', fase: 'durante' },
    { text: "Faça 10 círculos com cada tornozelo enquanto o pet relaxa", video: 'tornozelo', fase: 'durante' },
    { text: "Depois de escovar, incline o tronco para os lados 8 vezes cada", video: 'lateral', fase: 'depois' },
    { text: "Depois de escovar, faça o gato-camelo 10 vezes", video: 'gatoCamelo', fase: 'depois', dica: "Alivia as costas depois de ficar curvado sobre o pet." },
    { text: "Antes de escovar os dentes dele, faça 5 respirações lentas", video: 'respiracao', fase: 'antes', sub: 'dentes', dica: "Calma e mãos firmes deixam a escovação mais tranquila." },
    { text: "Antes de escovar os dentes, aqueça os punhos: 10 círculos para cada lado", video: 'punhos', fase: 'antes', sub: 'dentes' },
    { text: "Depois da escovação dental, alongue o pescoço por 15s para cada lado", video: 'pescoco', fase: 'depois', sub: 'dentes' }
  ],
  brincadeira: [
    { text: "Antes de começar, aqueça com 10 agachamentos", video: 'agachamento', fase: 'antes' },
    { text: "Faça 3 tiros curtos de 15s correndo junto com o pet", video: 'tiros', fase: 'durante', noite: false, dica: "Cuidado para não pisar no pet nas mudanças de direção." },
    { text: "Pule corda imaginária por 30 segundos", video: 'corda', fase: 'durante', noite: false },
    { text: "Faça 15 polichinelos", video: 'polichinelo', fase: 'durante', noite: false },
    { text: "Corra no lugar com joelhos altos por 30 segundos", video: 'joelhos', fase: 'durante' },
    { text: "Faça 12 afundos alternados enquanto o pet brinca", video: 'afundo', fase: 'durante' },
    { text: "Depois de brincar, alongue a parte de trás da coxa por 20s", video: 'alongPosterior', fase: 'depois' },
    { text: "Depois de brincar, alongue a frente da coxa por 20s cada perna", video: 'alongQuadriceps', fase: 'depois' },
    { text: "Depois de brincar, faça 15 abdominais", video: 'abdominal', fase: 'depois' },
    { text: "A cada arremesso de bola, faça 3 agachamentos", video: 'agachamento', fase: 'durante', sub: 'bola', dica: "Agache enquanto ele busca a bola e levante quando ele voltar." },
    { text: "Enquanto ele vai buscar a bola, corra no lugar com joelhos altos", video: 'joelhos', fase: 'durante', sub: 'bola' },
    { text: "Enquanto o gato persegue a varinha, faça 12 afundos alternados", video: 'afundo', fase: 'durante', sub: 'laser', dica: "Movimentos suaves: o gato não se assusta e a brincadeira continua." },
    { text: "Enquanto ele caça o laser, fique 20s em cada pé (equilíbrio)", video: 'equilibrio', fase: 'durante', sub: 'laser' }
  ],
  higiene: [
    { text: "Enquanto a água esquenta, faça 10 agachamentos devagar", video: 'agachamento', fase: 'antes' },
    { text: "Enquanto a banheira enche, faça parede sentada por 20s", video: 'parede', fase: 'antes' },
    { text: "Enquanto enxágua, levante os calcanhares 15 vezes segurando na borda", video: 'panturrilha', fase: 'durante', dica: "Segure firme na borda e mantenha os pés bem apoiados." },
    { text: "Enquanto o pet seca, faça 10 círculos com cada tornozelo", video: 'tornozelo', fase: 'durante' },
    { text: "Depois do banho, gire o tronco 10 vezes para cada lado", video: 'tronco', fase: 'depois' },
    { text: "Com o piso seco, faça o gato-camelo 10 vezes", video: 'gatoCamelo', fase: 'depois', dica: "Alivia as costas depois de ficar curvado sobre a banheira." },
    { text: "Depois do banho, incline o tronco para os lados 8 vezes cada", video: 'lateral', fase: 'depois' },
    { text: "Antes de cortar as unhas, aqueça os punhos: 10 círculos para cada lado", video: 'punhos', fase: 'antes', sub: 'unhas', dica: "Mãos soltas e firmes deixam o corte mais seguro." },
    { text: "Antes de cortar as unhas, faça 5 respirações lentas", video: 'respiracao', fase: 'antes', sub: 'unhas', dica: "Mãos calmas cortam melhor e o pet fica mais tranquilo." },
    { text: "Depois das unhas, alongue o pescoço por 15s para cada lado", video: 'pescoco', fase: 'depois', sub: 'unhas', dica: "Sem forçar: incline só até sentir o alongamento." },
    { text: "Ao limpar, agache com as costas retas em vez de curvar (10 agachamentos)", video: 'agachamento', fase: 'durante', sub: 'limpeza', dica: "Dobre os joelhos para pegar do chão: poupa a lombar." },
    { text: "Depois da limpeza, faça o gato-camelo 10 vezes", video: 'gatoCamelo', fase: 'depois', sub: 'limpeza', dica: "Movimentos lentos, sem forçar a lombar." },
    { text: "Depois da limpeza, alongue a parte de trás da coxa por 20s", video: 'alongPosterior', fase: 'depois', sub: 'limpeza', dica: "Segure parado, sem balançar, e lave as mãos em seguida." }
  ],
  outro: [
    { text: "Faça 10 agachamentos", video: 'agachamento', fase: 'qualquer' },
    { text: "Segure prancha por 30 segundos", video: 'prancha', fase: 'qualquer' },
    { text: "Faça 15 polichinelos", video: 'polichinelo', fase: 'qualquer', noite: false },
    { text: "Gire os braços 20 vezes", video: 'ombros', fase: 'qualquer' },
    { text: "Levante os calcanhares 20 vezes", video: 'panturrilha', fase: 'qualquer' },
    { text: "Faça 12 flexões de braço", video: 'flexao', fase: 'qualquer' },
    { text: "Fique 20s em cada pé (equilíbrio)", video: 'equilibrio', fase: 'qualquer' }
  ]
};

/** Escolhe o exercício que combina com o hábito (categoria + título + horário) */
const ExerciseEngine = {
  norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); },

  /** Hábitos à noite (≥ 19h ou < 6h, ou "noite/noturno" no título) evitam barulho, saltos e pouca luz */
  isNight(habit) {
    if(/\b(noit|notur)/.test(this.norm(habit.title))) return true;
    const m = /^(\d{1,2}):(\d{2})/.exec(habit.time || '');
    if(!m) return false;
    const h = +m[1];
    return h >= 19 || h < 6;
  },

  /** Subcontextos ativados pelas palavras do título (ex.: "Passeio no parque" → ['parque']) */
  detectSubs(category, title) {
    const subs = (ExerciseContext[category] || {}).subs || {};
    const t = this.norm(title);
    return Object.keys(subs).filter(k => subs[k].some(w => new RegExp('\\b' + w).test(t)));
  },

  pick(habit, last) {
    const category = ExerciseDB[habit.category] ? habit.category : 'outro';
    const all = ExerciseDB[category];
    const night = this.isNight(habit);
    const subs = this.detectSubs(category, habit.title);
    let pool = all.filter(e => !(night && e.noite === false));
    if(!pool.length) pool = all;
    const specific = pool.filter(e => e.sub && subs.includes(e.sub));
    const general  = pool.filter(e => !e.sub);
    let source = general;
    if(specific.length && (Math.random() < 0.7 || !general.length)) source = specific;
    if(!source.length) source = pool;
    let ex = source[Math.floor(Math.random() * source.length)];
    if(last && source.length > 1 && ex.text === last.text) ex = source[(source.indexOf(ex) + 1) % source.length];
    return ex;
  },

  /** "Durante o passeio", "Antes da medicação"… */
  whenLabel(ex, category) {
    const c = ExerciseContext[category] || ExerciseContext.outro;
    if(!c.nome || !ex.fase || ex.fase === 'qualquer') return '✨ Quando quiser';
    const prep = { antes: 'Antes d', durante: 'Durante ', depois: 'Depois d' }[ex.fase];
    return c.emoji + ' ' + prep + c.artigo + ' ' + c.nome;   // Durante a… · Antes do… · Depois da…
  },

  tip(ex, category) { return ex.dica || (ExerciseContext[category] || ExerciseContext.outro).seguranca; }
};

const ExerciseEmojis = ['🏃','🤸','💪','🧘','⚡','🔥','🦵','🏋️','⛹️','🤾'];

const DefaultHabits = [
  { id:'h1', title:'Alimentação da manhã', category:'alimentacao', time:'08:00', completed:false, icon:'🍖', createdAt:Date.now() },
  { id:'h2', title:'Passeio matinal', category:'passeio', time:'09:00', completed:false, icon:'🦮', createdAt:Date.now() },
  { id:'h3', title:'Escovação do pelo', category:'escovacao', time:'10:00', completed:false, icon:'🪮', createdAt:Date.now() },
  { id:'h4', title:'Medicação (se necessário)', category:'medicacao', time:'12:00', completed:false, icon:'💊', createdAt:Date.now() },
  { id:'h5', title:'Brincadeira ativa', category:'brincadeira', time:'16:00', completed:false, icon:'🎾', createdAt:Date.now() },
  { id:'h6', title:'Alimentação da noite', category:'alimentacao', time:'18:00', completed:false, icon:'🍖', createdAt:Date.now() },
  { id:'h7', title:'Passeio noturno', category:'passeio', time:'20:00', completed:false, icon:'🌙', createdAt:Date.now() }
];

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 4: SKELETON MANAGER
// ═══════════════════════════════════════════════════════════════
const SkeletonManager = {
  show() {
    document.getElementById('skeletonProgress').style.display = 'block';
    document.getElementById('realProgress').style.display = 'none';
    document.getElementById('skeletonEnergy').style.display = 'flex';
    document.getElementById('realEnergy').style.display = 'none';
    document.getElementById('skeletonHabitsList').style.display = 'flex';
    document.getElementById('habitsList').style.display = 'none';
  },
  hide() {
    ['skeletonProgress','skeletonEnergy','skeletonHabitsList'].forEach(id => {
      const el = document.getElementById(id); if(el) el.style.display = 'none';
    });
    ['realProgress','realEnergy','habitsList'].forEach(id => {
      const el = document.getElementById(id);
      if(el) { el.style.display = id==='realEnergy'?'flex':'block'; el.classList.add('fade-in'); }
    });
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 4.1: MOTION — microinterações (zero dependências)
//  Web Animations API + CSS. Respeita "reduzir movimento" do sistema.
//  (Framer Motion é só para React e o Lottie exige arquivos .json +
//   CDN; aqui o app continua 100% offline e leve.)
// ═══════════════════════════════════════════════════════════════
const Motion = {
  _mq: window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null,
  reduced() { return !!(this._mq && this._mq.matches); },
  haptic(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} },

  /** Anima um número de `from` até `to` (ex.: 0% → 75%) */
  countUp(el, to, { from = null, duration = 650, suffix = '' } = {}) {
    if (!el) return;
    const start = from === null ? (parseFloat(el.textContent) || 0) : from;
    cancelAnimationFrame(el._raf);
    if (this.reduced() || start === to) { el.textContent = to + suffix; return; }
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const tick = now => {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = Math.round(start + (to - start) * ease(p)) + suffix;
      if (p < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  },

  /** "Pulinho" de atenção (ex.: ícone de energia mudou) */
  pop(el) {
    if (!el || this.reduced()) return;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  },

  /** Balança o campo quando há erro de validação */
  shake(el) {
    if (!el || this.reduced()) return;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  },

  /** Explosão de confete/patinhas na posição (x, y) da tela */
  burst(x, y, count = 14) {
    if (this.reduced()) return;
    const colors = ['#D8914F', '#4994A9', '#E3A266', '#8EC6D8', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'fx-particle';
      if (i % 5 === 0) el.textContent = '🐾'; else el.style.background = colors[i % colors.length];
      el.style.left = x + 'px'; el.style.top = y + 'px';
      document.body.appendChild(el);
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 50 + Math.random() * 80;
      const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist - 30;
      const spin = (Math.random() - 0.5) * 540;
      const anim = el.animate([
        { transform: 'translate(-50%,-50%) scale(0.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 46}px)) scale(0.6) rotate(${spin}deg)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = () => el.remove();
    }
  },

  /** Ripple (onda) no ponto tocado, em botões e chips */
  initRipple() {
    document.addEventListener('pointerdown', e => {
      if (this.reduced() || !e.target.closest) return;
      const host = e.target.closest('.btn-primary, .btn-secondary, .quick-btn, .filter-chip, .segmented button');
      if (!host) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      host.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
    }, { passive: true });
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 4.2: THEME MANAGER — Dark Mode Adaptativo
//  Preferência: 'auto' (segue o sistema) | 'light' | 'dark'
//  O <head> aplica o tema antes da 1ª pintura (sem flash).
// ═══════════════════════════════════════════════════════════════
const ThemeManager = {
  KEY: 'petfit_theme',
  COLORS: { light: '#043F41', dark: '#0E3032' },   // cor da barra de status = cor do header
  pref: 'auto',
  _mq: window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null,

  init() {
    this.pref = this._read();
    this._commit();
    const onSystemChange = () => { if (this.pref === 'auto') this.apply(); };
    if (this._mq) {
      if (this._mq.addEventListener) this._mq.addEventListener('change', onSystemChange);
      else if (this._mq.addListener) this._mq.addListener(onSystemChange);
    }
  },
  _read() { try { const v = localStorage.getItem(this.KEY); return ['auto', 'light', 'dark'].includes(v) ? v : 'auto'; } catch (e) { return 'auto'; } },
  _save() { try { localStorage.setItem(this.KEY, this.pref); } catch (e) {} },
  resolved() { return this.pref === 'auto' ? (this._mq && this._mq.matches ? 'dark' : 'light') : this.pref; },

  /** pref: 'auto' | 'light' | 'dark'. origin {x,y}: de onde a transição circular nasce */
  set(pref, origin) {
    if (!['auto', 'light', 'dark'].includes(pref) || pref === this.pref) return;
    this.pref = pref; this._save(); this.apply(origin);
  },
  toggle(origin) { this.set(this.resolved() === 'dark' ? 'light' : 'dark', origin); },

  apply(origin) {
    const root = document.documentElement;
    if (this.resolved() === root.dataset.theme) { this._commit(); return; }
    if (document.startViewTransition && !Motion.reduced() && origin) {
      // Melhoria progressiva: revelação circular a partir do botão tocado
      const { x, y } = origin;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(() => this._commit());
      vt.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 550, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
    } else if (!Motion.reduced()) {
      root.classList.add('theme-fade');      // fallback: fade suave das cores
      this._commit();
      clearTimeout(this._t);
      this._t = setTimeout(() => root.classList.remove('theme-fade'), 450);
    } else {
      this._commit();
    }
  },

  _commit() {
    const theme = this.resolved(), root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themePref = this.pref;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.COLORS[theme]);
    const btn = document.getElementById('btnTheme');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme, pref: this.pref } }));
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 4.3: TEXT SCALE — Tipografia Escalonável
//  Multiplica o tamanho-base (rem) do app. Soma-se à fonte do sistema.
// ═══════════════════════════════════════════════════════════════
const TextScale = {
  KEY: 'petfit_textScale',
  OPTIONS: [1, 1.125, 1.25],
  value: 1,
  init() { this.value = this._read(); this._apply(); },
  _read() { try { const v = parseFloat(localStorage.getItem(this.KEY)); return this.OPTIONS.includes(v) ? v : 1; } catch (e) { return 1; } },
  set(v) {
    if (!this.OPTIONS.includes(v)) return;
    this.value = v;
    try { localStorage.setItem(this.KEY, v); } catch (e) {}
    this._apply();
  },
  _apply() {
    document.documentElement.style.setProperty('--text-scale', this.value);
    document.dispatchEvent(new CustomEvent('textscalechange', { detail: { value: this.value } }));
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 4.4: AJUSTES (segmented controls) + LOGO DA MARCA
// ═══════════════════════════════════════════════════════════════
const SettingsUI = {
  init() {
    this._bind('themeSegment', (v, origin) => ThemeManager.set(v, origin));
    this._bind('textScaleSegment', v => TextScale.set(parseFloat(v)));
    document.addEventListener('themechange', () => this.sync());
    document.addEventListener('textscalechange', () => this.sync());
    this.sync();
  },
  _bind(id, onPick) {
    const seg = document.getElementById(id);
    if (!seg) return;
    seg.addEventListener('click', e => {
      const btn = e.target.closest('button[role="radio"]');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const origin = (e.clientX || e.clientY) ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      onPick(btn.dataset.value, origin);
      Motion.haptic(10);
    });
    seg.addEventListener('keydown', e => {           // setas ←/→ navegam no grupo
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const btns = [...seg.querySelectorAll('button[role="radio"]')];
      const cur = btns.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const next = btns[(cur + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
      next.focus(); next.click(); e.preventDefault();
    });
  },
  sync() {
    this._mark('themeSegment', ThemeManager.pref);
    this._mark('textScaleSegment', String(TextScale.value));
  },
  _mark(id, value) {
    const seg = document.getElementById(id);
    if (!seg) return;
    const btns = [...seg.querySelectorAll('button[role="radio"]')];
    let idx = btns.findIndex(b => b.dataset.value === value);
    if (idx < 0) idx = 0;
    btns.forEach((b, i) => { b.setAttribute('aria-checked', String(i === idx)); b.tabIndex = i === idx ? 0 : -1; });
    seg.style.setProperty('--i', idx);
  }
};

const BrandLogo = {
  /** Se o PNG do logo não existir/falhar, mostra 🐾 dentro do quadrado branco */
  init() {
    const box = document.getElementById('brandLogo');
    const img = box && box.querySelector('img');
    if (!img) return;
    const fallback = () => box.classList.add('is-fallback');
    if (img.complete && img.naturalWidth === 0) fallback();
    img.addEventListener('error', fallback);
    img.addEventListener('load', () => box.classList.remove('is-fallback'));
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 5: GESTURE ENGINE ⭐
// ═══════════════════════════════════════════════════════════════
const GestureEngine = {
  ptr: {
    startY:0, currentY:0, isPulling:false, threshold:80,
    indicator:null, mainContent:null,
    init() {
      this.indicator = document.getElementById('ptrIndicator');
      this.mainContent = document.getElementById('mainContent');
      if(!this.mainContent) return;
      this.mainContent.addEventListener('touchstart', e=>this.onTouchStart(e), {passive:true});
      this.mainContent.addEventListener('touchmove', e=>this.onTouchMove(e), {passive:true});
      this.mainContent.addEventListener('touchend', e=>this.onTouchEnd(e), {passive:true});
    },
    onTouchStart(e) {
      if(this.mainContent.scrollTop > 0) return;
      this.startY = e.touches[0].clientY;
      this.isPulling = true;
    },
    onTouchMove(e) {
      if(!this.isPulling) return;
      this.currentY = e.touches[0].clientY;
      const diff = this.currentY - this.startY;
      if(diff > 0 && this.mainContent.scrollTop <= 0) {
        const progress = Math.min(diff/this.threshold, 1);
        this.indicator.style.transform = `translateY(${diff*0.5}px)`;
        this.indicator.classList.add('visible');
        this.indicator.querySelector('.ptr-icon').style.transform = `rotate(${progress*360}deg)`;
      }
    },
    onTouchEnd(e) {
      if(!this.isPulling) return;
      this.isPulling = false;
      const diff = this.currentY - this.startY;
      this.indicator.style.transform = '';
      if(diff > this.threshold && this.mainContent.scrollTop <= 0) {
        this.indicator.classList.add('refreshing');
        this.indicator.querySelector('.ptr-text').textContent = 'Sincronizando...';
        App.refreshData().then(() => {
          this.indicator.classList.remove('refreshing','visible');
          this.indicator.querySelector('.ptr-text').textContent = 'Puxe para sincronizar';
        });
      } else {
        this.indicator.classList.remove('visible');
      }
    }
  },

  swipe: {
    startX:0, currentX:0, isSwiping:false, currentCard:null, threshold:80, armed:false,
    init() {
      document.addEventListener('touchstart', e=>this.onTouchStart(e), {passive:true});
      document.addEventListener('touchmove', e=>this.onTouchMove(e), {passive:false});
      document.addEventListener('touchend', e=>this.onTouchEnd(e), {passive:true});
      document.addEventListener('touchcancel', e=>this.onTouchEnd(e), {passive:true});
    },
    getCard(target) { return target.closest('.habit-card'); },
    onTouchStart(e) {
      const card = this.getCard(e.target);
      if(!card) return;
      this.startX = e.touches[0].clientX;
      this.currentX = this.startX;   // v4.0: um toque sem movimento não vira "swipe fantasma"
      this.armed = false;
      this.currentCard = card;
      this.isSwiping = true;
      card.classList.add('swiping');
      card.classList.remove('snap-back','swiped-left','swiped-right');
    },
    onTouchMove(e) {
      if(!this.isSwiping || !this.currentCard) return;
      this.currentX = e.touches[0].clientX;
      const diff = this.currentX - this.startX;
      if(Math.abs(diff) > 5) {
        this.currentCard.style.transform = `translateX(${diff}px)`;
        // v4.0: revela só a ação da direção do dedo e "arma" ao passar do limite
        const wrap = this.currentCard.closest('.habit-card-wrapper');
        if(wrap) {
          wrap.dataset.dir = diff < 0 ? 'left' : 'right';
          wrap.style.setProperty('--swipe-p', Math.min(Math.abs(diff)/this.threshold, 1).toFixed(2));
          const armed = Math.abs(diff) >= this.threshold;
          if(armed !== this.armed) { this.armed = armed; wrap.classList.toggle('armed', armed); if(armed) Motion.haptic(12); }
        }
      }
    },
    onTouchEnd(e) {
      if(!this.isSwiping || !this.currentCard) return;
      this.isSwiping = false;
      const diff = this.currentX - this.startX;
      const card = this.currentCard;
      const wrap = card.closest('.habit-card-wrapper');
      card.classList.remove('swiping');
      card.classList.add('snap-back');                       // retorno elástico
      setTimeout(() => card.classList.remove('snap-back'), 450);
      card.style.transform = '';
      if(wrap) { delete wrap.dataset.dir; wrap.classList.remove('armed'); wrap.style.setProperty('--swipe-p', 0); }
      if(diff < -this.threshold) {
        const habitId = card.closest('.habit-card-wrapper')?.dataset.id;
        if(habitId) {
          const habit = App.habits.find(h=>h.id===habitId);
          if(habit && !habit.completed) {
            App.pendingHabitId = habitId; App.pendingHabitAction = 'complete';
            App.showExerciseModal(habit);
          } else if(habit && habit.completed) {
            App.showToast('✅ Hábito já concluído!', 'info');
          }
        }
      } else if(diff > this.threshold) {
        const habitId = card.closest('.habit-card-wrapper')?.dataset.id;
        if(habitId) {
          const habit = App.habits.find(h=>h.id===habitId);
          if(habit && habit.completed) App.toggleHabit(habitId);
          else App.showToast('👈 Deslize para a esquerda para completar!', 'info');
        }
      }
      this.currentCard = null;
    }
  },

  longPress: {
    timer:null, target:null, duration:500, menu:null, overlay:null,
    init() {
      document.addEventListener('touchstart', e=>this.onTouchStart(e), {passive:true});
      document.addEventListener('touchend', e=>this.onTouchEnd(e), {passive:true});
      document.addEventListener('touchmove', e=>this.onTouchEnd(e), {passive:true});
    },
    getCard(target) { return target.closest('.habit-card'); },
    onTouchStart(e) {
      const card = this.getCard(e.target);
      if(!card) return;
      this.target = card;
      this.timer = setTimeout(() => { this.showMenu(e.touches[0].clientX, e.touches[0].clientY, card); }, this.duration);
    },
    onTouchEnd(e) { if(this.timer) { clearTimeout(this.timer); this.timer = null; } },
    showMenu(x, y, card) {
      if(this.menu) this.hideMenu();
      const habitId = card.closest('.habit-card-wrapper')?.dataset.id;
      if(!habitId) return;
      const habit = App.habits.find(h=>h.id===habitId);
      if(!habit) return;
      if(navigator.vibrate) navigator.vibrate(20);
      this.overlay = document.createElement('div');
      this.overlay.className = 'long-press-overlay';
      this.overlay.addEventListener('click', ()=>this.hideMenu());
      document.body.appendChild(this.overlay);
      this.menu = document.createElement('div');
      this.menu.className = 'long-press-menu';
      this.menu.style.left = Math.min(x, window.innerWidth-200)+'px';
      this.menu.style.top = Math.min(y, window.innerHeight-150)+'px';
      const isCompleted = habit.completed;
      this.menu.innerHTML = `
        <button class="long-press-menu-item" onclick="GestureEngine.longPress.action('toggle','${habitId}')">${isCompleted?'↩️ Desmarcar':'✅ Concluir'}</button>
        <button class="long-press-menu-item" onclick="GestureEngine.longPress.action('exercise','${habitId}')">💪 Ver exercício</button>
        <button class="long-press-menu-item" onclick="GestureEngine.longPress.action('edit','${habitId}')">✏️ Editar</button>
        <button class="long-press-menu-item danger" onclick="GestureEngine.longPress.action('delete','${habitId}')">🗑️ Excluir</button>
      `;
      document.body.appendChild(this.menu);
    },
    hideMenu() {
      if(this.menu) { this.menu.remove(); this.menu = null; }
      if(this.overlay) { this.overlay.remove(); this.overlay = null; }
    },
    action(type, habitId) {
      this.hideMenu();
      const habit = App.habits.find(h=>h.id===habitId);
      if(!habit) return;
      switch(type) {
        case 'toggle': App.toggleHabit(habitId); break;
        case 'exercise': App.pendingHabitId = habitId; App.pendingHabitAction = 'complete'; App.showExerciseModal(habit); break;
        case 'edit': App.showToast('✏️ Edição em breve!', 'info'); break;
        case 'delete': App.deleteHabit(habitId); break;
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 6: APLICAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const App = {
  habits:[], profile:{petName:'Rex', tutorName:'Tutor', avatar:'./assets/icons/iconpet1.png'},
  history:[], exercisesDone:0, currentFilter:'all', pendingHabitId:null, pendingHabitAction:null, currentExercise:null, isLoading:false, gestureHintShown:false,
  animateList:false, justCompletedId:null, _shownPercent:undefined,

  async init() {
    ThemeManager.init();
    TextScale.init();
    SettingsUI.init();
    BrandLogo.init();
    Motion.initRipple();
    SkeletonManager.show();
    this.setupEventListeners();
    GestureEngine.ptr.init();
    GestureEngine.swipe.init();
    GestureEngine.longPress.init();
    this.setupServiceWorker();
    this.checkOnlineStatus();
    await this.loadData();
    await this.checkDayReset();
    SkeletonManager.hide();
    this.animateList = true;
    this.renderAll();
    this.showGestureHint();
  },

  async refreshData() {
    SkeletonManager.show();
    await this.loadData();
    await this.checkDayReset();
    SkeletonManager.hide();
    this.animateList = true;
    this.renderAll();
    this.showToast('⚡ Dados sincronizados!', 'success');
  },

  async loadData() {
    this.isLoading = true;
    const data = await DataLayer.getAll();
    this.habits = data.habits || DefaultHabits;
    this.profile = data.profile || this.profile;
    this.history = data.history || [];
    this.exercisesDone = data.exercises || 0;
    this.gestureHintShown = data.gestureHint || false;
    this.isLoading = false;
  },

  async checkDayReset() {
    const data = await DataLayer.getAll();
    const lastDate = data.lastDate || '';
    const today = new Date().toISOString().split('T')[0];
    if(lastDate !== today) {
      if(lastDate) {
        const completedCount = this.habits.filter(h=>h.completed).length;
        const totalCount = this.habits.length;
        const percentage = totalCount>0 ? Math.round((completedCount/totalCount)*100) : 0;
        let history = this.history;
        history.push({date:lastDate, completed:completedCount, total:totalCount, percentage});
        if(history.length > 30) history = history.slice(-30);
        this.history = history;
        await DataLayer.saveHistory(history);
      }
      this.habits = this.habits.map(h => ({...h, completed:false}));
      await DataLayer.saveHabits(this.habits);
      await DataLayer.saveLastDate(today);
    }
  },

  async saveHabits() { await DataLayer.saveHabits(this.habits); },
  async persistProfile() { await DataLayer.saveProfile(this.profile); },

  renderAll() { this.renderHeader(); this.renderDashboard(); this.renderHabits(); },

 

renderHeader() {
  const petAvatar =
    this.profile.avatar || './assets/icons/iconpet1.png';

  const tutorAvatar =
    this.profile.tutorAvatar || './assets/icons/iconavatar1.png';

  const headerImg = document.getElementById('headerAvatarImg');
  const profilePetImg = document.getElementById('profileAvatarImg');
  const profileTutorImg = document.getElementById('tutorAvatarImg');

  if (headerImg) headerImg.src = petAvatar;
  if (profilePetImg) profilePetImg.src = petAvatar;
  if (profileTutorImg) profileTutorImg.src = tutorAvatar;
},


  renderDashboard() {
    const total = this.habits.length;
    const completed = this.habits.filter(h=>h.completed).length;
    const percentage = total>0 ? Math.round((completed/total)*100) : 0;
    const firstPaint = this._shownPercent === undefined;
    const prevPercent = firstPaint ? 0 : this._shownPercent;
    Motion.countUp(document.getElementById('progressValue'), percentage, { from: prevPercent, suffix: '%' });
    this._shownPercent = percentage;
    document.getElementById('progressFill').style.width = percentage+'%';
    if(!firstPaint && percentage === 100 && prevPercent < 100 && total > 0) this.celebrate();
    const subTexts = ['Nenhum hábito concluído ainda','Bom começo! Continue assim','Metade do caminho! 💪','Quase lá! Faltam poucos','Incrível! Dupla em sintonia! 🔥'];
    document.getElementById('progressSub').textContent = subTexts[Math.min(Math.floor(percentage/25),4)];

    const energyBlock = document.getElementById('realEnergy');
    energyBlock.classList.remove('high','medium','low');
    const ei = document.getElementById('energyIcon');
    const el = document.getElementById('energyLevel');
    const eh = document.getElementById('energyHint');
    const setEnergy = (cls, icon, level, hint) => {
      energyBlock.classList.add(cls);
      if(ei.textContent !== icon) { ei.textContent = icon; Motion.pop(ei); }   // ícone muda → "pulinho"
      el.textContent = level; eh.textContent = hint;
    };
    if(percentage>=80) setEnergy('high','🔥','Alta','Vocês estão imparáveis! 🚀');
    else if(percentage>=50) setEnergy('medium','⚡','Média','Bom ritmo! Continue sincronizando');
    else if(percentage>0) setEnergy('low','💡','Aquecendo','Cada hábito conta! Vamos lá');
    else setEnergy('low','💤','Baixa','Complete hábitos para energizar!');
  },

  celebrate() {
    const block = document.getElementById('realProgress');
    block.classList.remove('celebrate'); void block.offsetWidth; block.classList.add('celebrate');
    setTimeout(() => {
      const r = block.getBoundingClientRect();
      Motion.burst(r.left + r.width/2, r.top + r.height/2, 24);
    }, 350);
    Motion.haptic([20,40,20,40,60]);
  },

  renderHabits() {
    const container = document.getElementById('habitsList');
    // FLIP: guarda a posição de cada card antes de redesenhar, para animar a reordenação
    const prevTops = new Map();
    if(!this.animateList) container.querySelectorAll('.habit-card-wrapper').forEach(w=>prevTops.set(w.dataset.id, w.getBoundingClientRect().top));
    let filtered = this.habits;
    if(this.currentFilter !== 'all') filtered = this.habits.filter(h=>h.category===this.currentFilter);
    if(filtered.length===0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🐾</span><p class="empty-state-text">Nenhum hábito nesta categoria.<br>Toque em "Novo Hábito" para adicionar!</p></div>`;
      this.animateList = false; this.justCompletedId = null;
      return;
    }
    const sorted = [...filtered].sort((a,b)=>{ if(a.completed!==b.completed) return a.completed?1:-1; return (a.time||'00:00').localeCompare(b.time||'00:00'); });
    container.innerHTML = sorted.map((habit, idx)=>{
      const justDone = habit.id === this.justCompletedId;
      return `
      <div class="habit-card-wrapper" data-id="${habit.id}" style="--i:${idx}">
        <div class="habit-card-bg swipe-left"><span class="swipe-action-icon">✅</span></div>
        <div class="habit-card-bg swipe-right"><span class="swipe-action-icon">↩️</span></div>
        <div class="habit-card ${habit.completed?'completed':''} ${justDone?'just-completed':''}">
          <div class="habit-icon">${habit.icon||'✨'}</div>
          <div class="habit-info">
            <span class="habit-title">${this.escapeHtml(habit.title)}</span>
            <span class="habit-meta">${this.getCategoryLabel(habit.category)} · ${habit.time||'--:--'}</span>
          </div>
          <button class="habit-toggle ${habit.completed?'checked':''} ${justDone?'just-checked':''}" onclick="App.toggleHabit('${habit.id}')" aria-label="${habit.completed?'Desmarcar':'Concluir'} ${this.escapeHtml(habit.title)}"><svg class="habit-check" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M5.5 12.5l4.2 4.2L18.5 8"/></svg></button>
          <button class="habit-delete" onclick="App.deleteHabit('${habit.id}')" aria-label="Excluir ${this.escapeHtml(habit.title)}">🗑️</button>
        </div>
      </div>
    `;}).join('');

    const wrappers = [...container.querySelectorAll('.habit-card-wrapper')];
    if(this.animateList) {
      wrappers.forEach(w=>w.classList.add('enter'));                     // entrada em cascata
    } else if(!Motion.reduced()) {
      wrappers.forEach(w=>{
        if(!prevTops.has(w.dataset.id)) { w.classList.add('enter'); return; }   // hábito novo
        const dy = prevTops.get(w.dataset.id) - w.getBoundingClientRect().top;     // FLIP
        if(Math.abs(dy) > 1) w.animate([{transform:`translateY(${dy}px)`},{transform:'none'}], {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'});
      });
    }
    this.animateList = false; this.justCompletedId = null;
  },

  getCategoryLabel(cat) {
    const labels={alimentacao:'Alimentação',passeio:'Passeio',medicacao:'Medicação',escovacao:'Escovação',brincadeira:'Brincadeira',higiene:'Higiene',outro:'Outro'};
    return labels[cat]||'Outro';
  },
  escapeHtml(text) { const div=document.createElement('div'); div.textContent=text; return div.innerHTML; },

  showGestureHint() {
    const hint = document.getElementById('gestureHint');
    if(!hint) return;
    if(this.gestureHintShown) { hint.classList.add('hidden'); return; }
    hint.classList.remove('hidden');
    document.getElementById('closeGestureHint').addEventListener('click', ()=>{
      hint.classList.add('hidden');
      this.gestureHintShown = true;
      DataLayer.saveGestureHint(true);
    });
  },

  async toggleHabit(id) {
    const habit = this.habits.find(h=>h.id===id);
    if(!habit) return;
    if(!habit.completed) {
      this.pendingHabitId = id; this.pendingHabitAction = 'complete';
      this.showExerciseModal(habit);
    } else {
      habit.completed = false;
      await this.saveHabits();
      this.renderAll();
      this.showToast('🔄 Hábito desmarcado', 'info');
    }
  },

  async deleteHabit(id) {
    if(!confirm('Tem certeza que deseja excluir este hábito?')) return;
    const wrap = document.querySelector(`.habit-card-wrapper[data-id="${id}"]`);
    if(wrap && !Motion.reduced() && wrap.animate) {
      const h = wrap.offsetHeight;
      await wrap.animate(
        [{opacity:1, transform:'none', height:h+'px', marginBottom:'10px'}, {opacity:0, transform:'translateX(-40px)', height:'0px', marginBottom:'0px'}],
        {duration:280, easing:'ease-in', fill:'forwards'}
      ).finished.catch(()=>{});
    }
    this.habits = this.habits.filter(h=>h.id!==id);
    await this.saveHabits();
    this.renderAll();
    this.showToast('🗑️ Hábito removido', 'info');
  },

  async addHabit() {
    const title = document.getElementById('habitTitle').value.trim();
    const category = document.getElementById('habitCategory').value;
    const time = document.getElementById('habitTime').value;
    if(!title) {
      const input = document.getElementById('habitTitle');
      Motion.shake(input); Motion.haptic([30,40,30]); input.focus();
      this.showToast('✍️ Digite um nome para o hábito', 'error');
      return;
    }
    const icons = {alimentacao:'🍖',passeio:'🦮',medicacao:'💊',escovacao:'🪮',brincadeira:'🎾',higiene:'🛁',outro:'✨'};
    const newHabit = {id:'h'+Date.now(), title, category, time:time||'12:00', completed:false, icon:icons[category]||'✨', createdAt:Date.now()};
    this.habits.push(newHabit);
    await this.saveHabits();
    this.closeModal('modalAddHabit');
    this.renderAll();
    this.showToast('🎉 Hábito adicionado! Que tal um exercício?', 'success');
    setTimeout(()=>{ this.pendingHabitId=newHabit.id; this.pendingHabitAction='complete'; this.showExerciseModal(newHabit); }, 400);
  },

  /** v7.0: o exercício é escolhido pelo contexto do hábito (categoria, título e horário) */
  getRandomExercise(habit) { return ExerciseEngine.pick(habit, this.currentExercise); },
  getRandomEmoji() { return ExerciseEmojis[Math.floor(Math.random()*ExerciseEmojis.length)]; },

  showExerciseModal(habit) {
    document.getElementById('exerciseEmoji').textContent = this.getRandomEmoji();
    document.getElementById('exerciseTitle').textContent = 'Hora de se mexer, '+this.profile.tutorName+'!';
    document.getElementById('exerciseText').textContent = 'Você está prestes a completar "'+habit.title+'" com '+this.profile.petName+'.';
    const exercise = this.getRandomExercise(habit);
    this.currentExercise = exercise;
    const category = ExerciseDB[habit.category] ? habit.category : 'outro';
    document.getElementById('exerciseSuggestion').textContent = exercise.text;
    document.getElementById('exerciseWhen').textContent = ExerciseEngine.whenLabel(exercise, category);
    document.getElementById('exerciseTip').textContent = ExerciseEngine.tip(exercise, category);
    this.renderExerciseVideo(exercise);
    this.openModal('modalExercise');
  },

  /** Mostra (ou esconde) a ajuda discreta "Não sabe realizar?" com o link do vídeo */
  renderExerciseVideo(exercise) {
    const box = document.getElementById('exerciseHelp');
    const link = document.getElementById('exerciseVideoLink');
    if(!box || !link) return;
    const video = exercise && ExerciseVideos[exercise.video];
    if(!video) { box.hidden = true; link.removeAttribute('href'); return; }
    link.href = youtubeUrl(video.id);
    link.setAttribute('aria-label', 'Ver vídeo de como fazer: ' + video.nome + ' (abre o YouTube em outra aba)');
    box.hidden = false;
  },

  async completeExerciseAndHabit() {
    if(this.pendingHabitId) {
      const habit = this.habits.find(h=>h.id===this.pendingHabitId);
      if(habit) {
        const btn = document.getElementById('doneExercise').getBoundingClientRect();
        Motion.burst(btn.left + btn.width/2, btn.top + btn.height/2);
        habit.completed = true;
        this.justCompletedId = habit.id;
        this.exercisesDone++;
        await DataLayer.saveExercises(this.exercisesDone);
        await this.saveHabits();
        this.renderAll();
        this.showToast('🔥 Hábito + Exercício concluídos! Dupla sincronizada!', 'success');
        if(navigator.vibrate) navigator.vibrate([30,50,30]);
      }
    }
    this.pendingHabitId = null; this.pendingHabitAction = null;
    this.closeModal('modalExercise');
  },

  dismissExercise() { this.pendingHabitId=null; this.pendingHabitAction=null; this.closeModal('modalExercise'); },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input,select,textarea');
    if(firstInput) setTimeout(()=>firstInput.focus(), 300);
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    const titleInput = modal.querySelector('#habitTitle');
    if(titleInput) titleInput.value = '';
  },

  
async openProfile() {
  const petName = this.profile?.petName || 'Rex';
  const tutorName = this.profile?.tutorName || 'Tutor';
  const avatar = this.profile?.avatar || './assets/icons/iconpet1.png';

  document.getElementById('petName').value = petName;
  document.getElementById('tutorName').value = tutorName;

  ['headerAvatarImg', 'profileAvatarImg', 'customPetAvatar'].forEach(id => {
    const img = document.getElementById(id);
    if (img) img.src = avatar;
  });

  Motion.countUp(
    document.getElementById('statStreak'),
    this.calculateStreak(),
    { from: 0 }
  );

  Motion.countUp(
    document.getElementById('statTotal'),
    this.habits.length,
    { from: 0 }
  );

  Motion.countUp(
    document.getElementById('statDone'),
    this.habits.filter(h => h.completed).length,
    { from: 0 }
  );

  this.openModal('modalProfile');
},


 
async saveProfile() {
    const petName = document.getElementById('petName').value.trim() || 'Rex';
    const tutorName = document.getElementById('tutorName').value.trim() || 'Tutor';

    // Apenas fecha a janela de edição
    this.closeModal('modalProfile');
},


  openSettings() { SettingsUI.sync(); this.openModal('modalSettings'); },

  async openStats() {
    const total = this.habits.length;
    const done = this.habits.filter(h=>h.completed).length;
    const percentage = total>0 ? Math.round((done/total)*100) : 0;
    Motion.countUp(document.getElementById('statsStreak'), this.calculateStreak(), { from: 0 });
    Motion.countUp(document.getElementById('statsTotalDone'), done, { from: 0 });
    Motion.countUp(document.getElementById('statsEnergy'), percentage, { from: 0, suffix: '%' });
    Motion.countUp(document.getElementById('statsExercises'), this.exercisesDone, { from: 0 });
    this.renderHistoryBars();
    this.openModal('modalStats');
  },

async savePetStep() {
  const petName = document.getElementById('setupPetName').value.trim();
  const petSpecies = document.getElementById('setupPetSpecies').value.trim();
  const petBreed = document.getElementById('setupPetBreed').value.trim();

  if (!petName || !petSpecies) {
    alert('Preencha o nome e a espécie do pet.');
    return;
  }

  this.profile.petName = petName;
  this.profile.petSpecies = petSpecies;
  this.profile.petBreed = petBreed;

  const petImage = document.getElementById('customPetAvatar');

  if (petImage?.src && petImage.src.startsWith('data:image/')) {
    this.profile.avatar = petImage.src;
  }

  await this.persistProfile();

  this.closeModal('modalAddProfile');
  document.getElementById('tutorNameInput').value =
    this.profile.tutorName === 'Tutor' ? '' : this.profile.tutorName;

  const tutorImage = document.getElementById('customTutorAvatar');
  if (tutorImage) {
    tutorImage.src =
      this.profile.tutorAvatar || './assets/icons/iconavatar1.png';
  }

  this.openModal('modalTutorProfile');
},


async finishProfileSetup() {
  const tutorNameInput = document.getElementById('tutorNameInput');

  if (!tutorNameInput) {
    console.error('Campo tutorNameInput não encontrado no HTML.');
    return;
  }

  const tutorName = tutorNameInput.value.trim();

  if (!tutorName) {
    alert('Digite o nome do tutor.');
    tutorNameInput.focus();
    return;
  }

  this.profile.tutorName = tutorName;

  const tutorImage = document.getElementById('customTutorAvatar');

  if (tutorImage?.src && tutorImage.src.startsWith('data:image/')) {
    this.profile.tutorAvatar = tutorImage.src;
  }

  await this.persistProfile();

  this.closeModal('modalTutorProfile');
  this.renderHeader();

  this.showToast('🐾 Perfil da dupla salvo!', 'success');
},


  renderHistoryBars() {
    const container = document.getElementById('historyBars');
    const history = this.history.slice(-7);
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const todayIdx = new Date().getDay();
    let displayData = [];
    for(let i=6;i>=0;i--) {
      const dayIdx = (todayIdx-i+7)%7;
      const dateStr = this.getDateString(i);
      const record = history.find(h=>h.date===dateStr);
      displayData.push({label:days[dayIdx], percentage:record?record.percentage:0, isToday:i===0});
    }
    const maxVal = Math.max(...displayData.map(d=>d.percentage), 100);
    container.innerHTML = displayData.map((d,i)=>`<div class="history-bar-wrap"><div class="history-bar ${d.isToday?'today':''}" style="height:${Math.max((d.percentage/maxVal)*100,4)}%;--i:${i};" title="${d.percentage}%"></div><span class="history-bar-label">${d.label}</span></div>`).join('');
  },

  getDateString(daysAgo) { const d=new Date(); d.setDate(d.getDate()-daysAgo); return d.toISOString().split('T')[0]; },

  calculateStreak() {
    if(!this.history.length) return 0;
    let streak=0;
    for(let i=this.history.length-1;i>=0;i--) { if(this.history[i].percentage>=50) streak++; else break; }
    const todayDone = this.habits.filter(h=>h.completed).length;
    const todayTotal = this.habits.length;
    if(todayTotal>0 && (todayDone/todayTotal)>=0.5) streak++;
    return streak;
  },

  switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active', item.dataset.tab===tabName));
    if(tabName==='pet') this.openProfile();
    else if(tabName==='stats') this.openStats();
    else if(tabName==='settings') this.openSettings();
    if(tabName!=='today') setTimeout(()=>{ document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active', item.dataset.tab==='today')); }, 300);
  },

  showToast(message, type='success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast '+type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(()=>toast.remove(), 3000);
  },

  setupEventListeners() {
    
document.getElementById('btnProfile')?.addEventListener(
  'click',
  () => this.openProfile()
);

document.getElementById('savePetBtn')?.addEventListener(
  'click',
  () => this.savePetStep()
);

document.getElementById('finishProfileBtn')?.addEventListener(
  'click',
  () => this.finishProfileSetup()
);

document.getElementById('closeTutorProfile')?.addEventListener(
  'click',
  () => this.closeModal('modalTutorProfile')
);
document.getElementById('finishProfileBtn')
    ?.addEventListener('click', () => App.finishProfileSetup());
const tutorPhotoInput = document.getElementById('tutorPhotoInput');
const customTutorAvatar = document.getElementById('customTutorAvatar');

if (tutorPhotoInput && customTutorAvatar) {
  tutorPhotoInput.addEventListener('change', () => {
    const file = tutorPhotoInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      tutorPhotoInput.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      customTutorAvatar.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

    
    document.getElementById('btnProfile').addEventListener('click', ()=>this.openProfile());
    document.getElementById('savePetBtn')
  .addEventListener('click', () => this.savePetStep());
    document.getElementById('btnSyncNow').addEventListener('click', async (e)=>{
      const btn = e.currentTarget; btn.classList.add('is-syncing'); Motion.haptic(20);
      try { await this.refreshData(); } finally { btn.classList.remove('is-syncing'); }
    });
    document.getElementById('btnTheme').addEventListener('click', (e)=>{
      const r = e.currentTarget.getBoundingClientRect();
      ThemeManager.toggle({ x: r.left + r.width/2, y: r.top + r.height/2 });
      Motion.haptic(10);
    });
    document.getElementById('closeSettings').addEventListener('click', ()=>this.closeModal('modalSettings'));
    document.getElementById('closeSettingsBtn').addEventListener('click', ()=>this.closeModal('modalSettings'));
    document.getElementById('btnAddHabit').addEventListener('click', ()=>{ this.openModal('modalAddHabit'); if(navigator.vibrate) navigator.vibrate(15); });
    document.getElementById('closeAddHabit').addEventListener('click', ()=>this.closeModal('modalAddHabit'));
    document.getElementById('closeProfile').addEventListener('click', ()=>this.closeModal('modalProfile'));
    document.getElementById('openAddProfile').addEventListener('click', () => {this.openModal('modalAddProfile');});
    document.getElementById('closeAddProfile').addEventListener('click', () => {this.closeModal('modalAddProfile');});
    
      document.getElementById('resetDuoBtn')?.addEventListener('click', () => {
        const confirmar = confirm(
          'Tem certeza que deseja apagar os dados da dupla e voltar ao padrão? Essa ação não pode ser desfeita.'
        );

        if (!confirmar) return;

        // Remove somente os dados relacionados ao aplicativo
        const chaves = [
          'petfit_habits',
          'petfit_profile',
          'petfit_history',
          'petfit_exercises',
          'petfit_lastDate',
          'petfit_gestureHint'
        ];

        chaves.forEach(chave => localStorage.removeItem(chave));

        // Recarrega o aplicativo para inicializar os valores padrão
        window.location.reload();
      });

    
const petPhotoInput = document.getElementById('petPhotoInput');

if (petPhotoInput) {
  petPhotoInput.addEventListener('change', async () => {
    const file = petPhotoInput.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      petPhotoInput.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      const avatar = event.target.result;

      this.profile.avatar = avatar;

      await this.persistProfile();

      this.renderHeader();

      const customAvatar = document.getElementById('customPetAvatar');
      if (customAvatar) customAvatar.src = avatar;
    };

    reader.readAsDataURL(file);
  });
}

    const customPetAvatar = document.getElementById('customPetAvatar');

    if (petPhotoInput && customPetAvatar) {
      petPhotoInput.addEventListener('change', () => {
        const file = petPhotoInput.files[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
          alert('Selecione um arquivo de imagem válido.');
          return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
          customPetAvatar.src = event.target.result;
        };

        reader.readAsDataURL(file);
      });
    }

    document.getElementById('closeStats').addEventListener('click', ()=>this.closeModal('modalStats'));
    document.getElementById('closeStatsBtn').addEventListener('click', ()=>this.closeModal('modalStats'));
    document.getElementById('saveHabitBtn').addEventListener('click', ()=>this.addHabit());
    document.getElementById('saveProfileBtn').addEventListener('click', ()=>this.saveProfile());
    document.getElementById('dismissExercise').addEventListener('click', ()=>this.dismissExercise());
    document.getElementById('doneExercise').addEventListener('click', ()=>this.completeExerciseAndHabit());
    document.getElementById('exerciseVideoLink').addEventListener('click', ()=>Motion.haptic(10));
    document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click', ()=>this.switchTab(item.dataset.tab)));
    document.querySelectorAll('.filter-chip').forEach(chip=>chip.addEventListener('click', (e)=>{
      document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      this.currentFilter = e.currentTarget.dataset.filter;
      this.animateList = true;
      this.renderHabits();
    }));
    document.querySelectorAll('.modal-overlay').forEach(overlay=>overlay.addEventListener('click', (e)=>{
      if(e.target===overlay) { const id=overlay.id; if(id==='modalExercise') this.dismissExercise(); else this.closeModal(id); }
    }));
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape') { document.querySelectorAll('.modal-overlay.active').forEach(modal=>{ if(modal.id==='modalExercise') this.dismissExercise(); else this.closeModal(modal.id); }); }
      if(e.key==='Enter' && document.activeElement.id==='habitTitle') this.addHabit();
    });
    let touchStartY=0;
    document.querySelectorAll('.modal-sheet').forEach(sheet=>{
      sheet.addEventListener('touchstart', (e)=>{ touchStartY=e.touches[0].clientY; }, {passive:true});
      sheet.addEventListener('touchend', (e)=>{
        const diff = e.changedTouches[0].clientY - touchStartY;
        if(diff>100) { const modal=sheet.closest('.modal-overlay'); if(modal){ if(modal.id==='modalExercise') this.dismissExercise(); else this.closeModal(modal.id); } }
      }, {passive:true});
    });
  },

  setupServiceWorker() {
    if(!('serviceWorker' in navigator)) return;
    const swCode = `const CACHE_NAME='petfit-sync-v4'; const STATIC_ASSETS=['/','/index.html','/style.css','/script.js','/manifest.json']; self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting()))}); self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))}); self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>{if(cached)return cached;return fetch(e.request).then(response=>{if(response&&response.ok){const clone=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(e.request,clone));}return response;}).catch(()=>new Response('Offline',{status:503}));}));});`;
    const blob = new Blob([swCode], {type:'application/javascript'});
    const swUrl = URL.createObjectURL(blob);
    navigator.serviceWorker.register(swUrl).then(()=>console.log('[PetFit] SW v4 registrado')).catch(err=>console.log('[PetFit] Erro no SW:',err));
  },

  checkOnlineStatus() {
    const banner = document.getElementById('offlineBanner');
    const update = ()=>{ if(navigator.onLine) banner.classList.remove('active'); else banner.classList.add('active'); };
    window.addEventListener('online', ()=>{ banner.classList.remove('active'); this.showToast('🌐 Conexão restaurada!', 'success'); });
    window.addEventListener('offline', ()=>banner.classList.add('active'));
    update();
  }
};

document.addEventListener('DOMContentLoaded', ()=>{ App.init(); });


const tutorPhotoInput = document.getElementById('tutorPhotoInput');
const customTutorAvatar = document.getElementById('customTutorAvatar');

tutorPhotoInput.addEventListener('change', () => {
  const file = tutorPhotoInput.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Selecione uma imagem válida.');
    tutorPhotoInput.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    customTutorAvatar.src = event.target.result;
  };

  reader.readAsDataURL(file);
});
