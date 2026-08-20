/**
 * PETFIT SYNC — script.js
 * PWA de Gestão de Hábitos para Pets e Tutores
 * Thumb-Friendly | localStorage | Exercícios Dinâmicos
 */

// ===== BANCO DE DADOS LOCAL (localStorage) =====
const Storage = {
  keys: {
    habits: 'petfit_habits',
    profile: 'petfit_profile',
    history: 'petfit_history',
    exercises: 'petfit_exercises',
    lastDate: 'petfit_lastDate'
  },

  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

// ===== SUGESTÕES DE EXERCÍCIOS POR CATEGORIA =====
const ExerciseDB = {
  alimentacao: [
    "Enquanto prepara a ração, faça 15 agachamentos",
    "Segure a vasilha com os braços estendidos por 20 segundos",
    "Faça 10 polichinelos enquanto o pet come",
    "Fique na ponta dos pés por 30 segundos",
    "Faça 12 elevações de panturrilha esperando o pet terminar",
    "Rode os ombros 15 vezes para trás e para frente"
  ],
  passeio: [
    "Durante o passeio, faça 3 tiros curtos de corrida de 20 segundos",
    "A cada esquina, faça 5 polichinelos",
    "Suba e desça uma escada 2 vezes",
    "Faça caminhada acelerada por 2 minutos",
    "Pare e faça 10 agachamentos em um ponto do percurso",
    "Levante os joelhos alternadamente por 30 segundos"
  ],
  medicacao: [
    "Enquanto prepara o remédio, faça 10 rotações de ombros",
    "Segure a posição de prancha por 20 segundos",
    "Faça 8 flexões de braço no chão",
    "Gire o tronco 10 vezes para cada lado",
    "Faça 12 abdominais curtos",
    "Estique os braços para cima e segure por 15 segundos"
  ],
  escovacao: [
    "Faça agachamento isométrico enquanto escova o pet (30s)",
    "Levante os calcanhares 15 vezes",
    "Contraia o abdômen por 20 segundos",
    "Faça 10 elevações de panturrilha",
    "Rode os punhos 10 vezes em cada sentido",
    "Incline o tronco para os lados 8 vezes cada"
  ],
  brincadeira: [
    "Corra junto com o pet por 1 minuto",
    "Faça 20 jumping jacks",
    "Deite e levante 10 vezes",
    "Faça 15 abdominais",
    "Pule corda imaginária por 30 segundos",
    "Faça 12 lunges alternados"
  ],
  higiene: [
    "Enquanto prepara o banho, faça 10 agachamentos",
    "Segure a posição de parede sentada por 20 segundos",
    "Faça 15 rotações de tornozelo",
    "Estique a coluna: braços para cima, segure 15s",
    "Faça 10 polichinelos entre uma etapa e outra",
    "Contraia o glúteo por 15 segundos de cada lado"
  ],
  outro: [
    "Faça 10 agachamentos",
    "Segure prancha por 30 segundos",
    "Faça 15 polichinelos",
    "Gire os braços 20 vezes",
    "Levante os calcanhares 20 vezes",
    "Faça 12 flexões de braço"
  ]
};

const ExerciseEmojis = ['🏃', '🤸', '💪', '🧘', '⚡', '🔥', '🦵', '🏋️', '⛹️', '🤾'];

// ===== HÁBITOS PADRÃO =====
const DefaultHabits = [
  { id: 'h1', title: 'Alimentação da manhã', category: 'alimentacao', time: '08:00', completed: false, icon: '🍖', createdAt: Date.now() },
  { id: 'h2', title: 'Passeio matinal', category: 'passeio', time: '09:00', completed: false, icon: '🦮', createdAt: Date.now() },
  { id: 'h3', title: 'Escovação do pelo', category: 'escovacao', time: '10:00', completed: false, icon: '🪮', createdAt: Date.now() },
  { id: 'h4', title: 'Medicação (se necessário)', category: 'medicacao', time: '12:00', completed: false, icon: '💊', createdAt: Date.now() },
  { id: 'h5', title: 'Brincadeira ativa', category: 'brincadeira', time: '16:00', completed: false, icon: '🎾', createdAt: Date.now() },
  { id: 'h6', title: 'Alimentação da noite', category: 'alimentacao', time: '18:00', completed: false, icon: '🍖', createdAt: Date.now() },
  { id: 'h7', title: 'Passeio noturno', category: 'passeio', time: '20:00', completed: false, icon: '🌙', createdAt: Date.now() }
];

// ===== ESTADO DA APLICAÇÃO =====
const App = {
  habits: [],
  profile: { petName: 'Rex', tutorName: 'Tutor', avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Rex&backgroundColor=ffdfbf' },
  history: [],
  exercisesDone: 0,
  currentFilter: 'all',
  pendingHabitId: null,
  pendingHabitAction: null,

  // Inicialização
  init() {
    this.checkDayReset();
    this.loadData();
    this.setupEventListeners();
    this.setupServiceWorker();
    this.checkOnlineStatus();
    this.renderAll();
  },

  // Verifica se é um novo dia e reseta hábitos
  checkDayReset() {
    const lastDate = Storage.get(Storage.keys.lastDate, '');
    const today = new Date().toISOString().split('T')[0];

    if (lastDate !== today) {
      // Salvar histórico do dia anterior
      if (lastDate) {
        const prevHabits = Storage.get(Storage.keys.habits, []);
        const completedCount = prevHabits.filter(h => h.completed).length;
        const totalCount = prevHabits.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        let history = Storage.get(Storage.keys.history, []);
        history.push({ date: lastDate, completed: completedCount, total: totalCount, percentage });
        if (history.length > 30) history = history.slice(-30);
        Storage.set(Storage.keys.history, history);
      }

      // Resetar hábitos para o novo dia
      let habits = Storage.get(Storage.keys.habits, DefaultHabits);
      habits = habits.map(h => ({ ...h, completed: false }));
      Storage.set(Storage.keys.habits, habits);
      Storage.set(Storage.keys.lastDate, today);
    }
  },

  loadData() {
    this.habits = Storage.get(Storage.keys.habits, DefaultHabits);
    this.profile = Storage.get(Storage.keys.profile, this.profile);
    this.history = Storage.get(Storage.keys.history, []);
    this.exercisesDone = Storage.get(Storage.keys.exercises, 0);
  },

  saveHabits() {
    Storage.set(Storage.keys.habits, this.habits);
  },

  saveProfile() {
    Storage.set(Storage.keys.profile, this.profile);
  },

  // ===== RENDERIZAÇÃO =====
  renderAll() {
    this.renderHeader();
    this.renderDashboard();
    this.renderHabits();
    this.renderStats();
  },

  renderHeader() {
    const avatarImg = document.querySelector('.header-avatar');
    if (avatarImg) avatarImg.src = this.profile.avatar;
  },

  renderDashboard() {
    const total = this.habits.length;
    const completed = this.habits.filter(h => h.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Progresso
    document.getElementById('progressValue').textContent = percentage + '%';
    document.getElementById('progressFill').style.width = percentage + '%';

    const subTexts = [
      'Nenhum hábito concluído ainda',
      'Bom começo! Continue assim',
      'Metade do caminho! 💪',
      'Quase lá! Faltam poucos',
      'Incrível! Dupla em sintonia! 🔥'
    ];
    const subIndex = Math.min(Math.floor(percentage / 25), 4);
    document.getElementById('progressSub').textContent = subTexts[subIndex];

    // Energia da Dupla
    const energyBlock = document.getElementById('energyBlock');
    const energyIcon = document.getElementById('energyIcon');
    const energyLevel = document.getElementById('energyLevel');
    const energyHint = document.getElementById('energyHint');

    energyBlock.classList.remove('high', 'medium', 'low');

    if (percentage >= 80) {
      energyBlock.classList.add('high');
      energyIcon.textContent = '🔥';
      energyLevel.textContent = 'Alta';
      energyHint.textContent = 'Vocês estão imparáveis! 🚀';
    } else if (percentage >= 50) {
      energyBlock.classList.add('medium');
      energyIcon.textContent = '⚡';
      energyLevel.textContent = 'Média';
      energyHint.textContent = 'Bom ritmo! Continue sincronizando';
    } else if (percentage > 0) {
      energyBlock.classList.add('low');
      energyIcon.textContent = '💡';
      energyLevel.textContent = 'Aquecendo';
      energyHint.textContent = 'Cada hábito conta! Vamos lá';
    } else {
      energyBlock.classList.add('low');
      energyIcon.textContent = '💤';
      energyLevel.textContent = 'Baixa';
      energyHint.textContent = 'Complete hábitos para energizar!';
    }
  },

  renderHabits() {
    const container = document.getElementById('habitsList');
    let filtered = this.habits;

    if (this.currentFilter !== 'all') {
      filtered = this.habits.filter(h => h.category === this.currentFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="habit-card" style="justify-content:center; padding: 32px 16px; opacity: 0.7;">
          <span style="font-size: 2rem; margin-bottom: 8px;">🐾</span>
          <p style="color: var(--text-muted); font-size: 0.875rem; text-align: center;">
            Nenhum hábito nesta categoria.<br>Toque em "Novo Hábito" para adicionar!
          </p>
        </div>
      `;
      return;
    }

    // Ordenar: pendentes primeiro, depois por horário
    const sorted = [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

    container.innerHTML = sorted.map(habit => `
      <div class="habit-card ${habit.completed ? 'completed' : ''}" data-id="${habit.id}">
        <div class="habit-icon">${habit.icon || '✨'}</div>
        <div class="habit-info">
          <span class="habit-title">${this.escapeHtml(habit.title)}</span>
          <span class="habit-meta">${this.getCategoryLabel(habit.category)} · ${habit.time || '--:--'}</span>
        </div>
        <button class="habit-toggle ${habit.completed ? 'checked' : ''}" 
                onclick="App.toggleHabit('${habit.id}')"
                aria-label="${habit.completed ? 'Desmarcar' : 'Concluir'} ${this.escapeHtml(habit.title)}">
        </button>
        <button class="habit-delete" 
                onclick="App.deleteHabit('${habit.id}')"
                aria-label="Excluir ${this.escapeHtml(habit.title)}">
          🗑️
        </button>
      </div>
    `).join('');
  },

  getCategoryLabel(cat) {
    const labels = {
      alimentacao: 'Alimentação',
      passeio: 'Passeio',
      medicacao: 'Medicação',
      escovacao: 'Escovação',
      brincadeira: 'Brincadeira',
      higiene: 'Higiene',
      outro: 'Outro'
    };
    return labels[cat] || 'Outro';
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ===== AÇÕES DE HÁBITO =====
  toggleHabit(id) {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;

    // Se está marcando como concluído (não desmarcando), mostrar exercício primeiro
    if (!habit.completed) {
      this.pendingHabitId = id;
      this.pendingHabitAction = 'complete';
      this.showExerciseModal(habit);
    } else {
      // Desmarcar diretamente
      habit.completed = false;
      this.saveHabits();
      this.renderAll();
      this.showToast('🔄 Hábito desmarcado', 'info');
    }
  },

  deleteHabit(id) {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) return;
    this.habits = this.habits.filter(h => h.id !== id);
    this.saveHabits();
    this.renderAll();
    this.showToast('🗑️ Hábito removido', 'info');
  },

  addHabit() {
    const title = document.getElementById('habitTitle').value.trim();
    const category = document.getElementById('habitCategory').value;
    const time = document.getElementById('habitTime').value;

    if (!title) {
      this.showToast('✍️ Digite um nome para o hábito', 'error');
      return;
    }

    const icons = {
      alimentacao: '🍖', passeio: '🦮', medicacao: '💊',
      escovacao: '🪮', brincadeira: '🎾', higiene: '🛁', outro: '✨'
    };

    const newHabit = {
      id: 'h' + Date.now(),
      title,
      category,
      time: time || '12:00',
      completed: false,
      icon: icons[category] || '✨',
      createdAt: Date.now()
    };

    this.habits.push(newHabit);
    this.saveHabits();
    this.closeModal('modalAddHabit');
    this.renderAll();
    this.showToast('🎉 Hábito adicionado! Que tal um exercício?', 'success');

    // Mostrar sugestão de exercício ao adicionar
    setTimeout(() => {
      this.pendingHabitId = newHabit.id;
      this.pendingHabitAction = 'complete';
      this.showExerciseModal(newHabit);
    }, 400);
  },

  // ===== EXERCÍCIOS =====
  getRandomExercise(category) {
    const list = ExerciseDB[category] || ExerciseDB.outro;
    return list[Math.floor(Math.random() * list.length)];
  },

  getRandomEmoji() {
    return ExerciseEmojis[Math.floor(Math.random() * ExerciseEmojis.length)];
  },

  showExerciseModal(habit) {
    const suggestion = this.getRandomExercise(habit.category);
    const emoji = this.getRandomEmoji();

    document.getElementById('exerciseEmoji').textContent = emoji;
    document.getElementById('exerciseTitle').textContent = 'Hora de se mexer, ' + this.profile.tutorName + '!';
    document.getElementById('exerciseText').textContent = 
      'Você está prestes a completar "' + habit.title + '" com ' + this.profile.petName + '.';
    document.getElementById('exerciseSuggestion').textContent = suggestion;

    this.openModal('modalExercise');
  },

  completeExerciseAndHabit() {
    if (this.pendingHabitId) {
      const habit = this.habits.find(h => h.id === this.pendingHabitId);
      if (habit) {
        habit.completed = true;
        this.exercisesDone++;
        Storage.set(Storage.keys.exercises, this.exercisesDone);
        this.saveHabits();
        this.renderAll();
        this.showToast('🔥 Hábito + Exercício concluídos! Dupla sincronizada!', 'success');

        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      }
    }
    this.pendingHabitId = null;
    this.pendingHabitAction = null;
    this.closeModal('modalExercise');
  },

  dismissExercise() {
    this.pendingHabitId = null;
    this.pendingHabitAction = null;
    this.closeModal('modalExercise');
  },

  // ===== MODAIS =====
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focar no primeiro input se houver
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 300);
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Limpar formulários
    const titleInput = modal.querySelector('#habitTitle');
    if (titleInput) titleInput.value = '';
  },

  // ===== PERFIL =====
  openProfile() {
    document.getElementById('petName').value = this.profile.petName;
    document.getElementById('tutorName').value = this.profile.tutorName;

    const total = this.habits.length;
    const done = this.habits.filter(h => h.completed).length;
    document.getElementById('statStreak').textContent = this.calculateStreak();
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statDone').textContent = done;

    this.openModal('modalProfile');
  },

  saveProfile() {
    const petName = document.getElementById('petName').value.trim() || 'Rex';
    const tutorName = document.getElementById('tutorName').value.trim() || 'Tutor';

    this.profile.petName = petName;
    this.profile.tutorName = tutorName;
    this.profile.avatar = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=' + encodeURIComponent(petName) + '&backgroundColor=ffdfbf';

    this.saveProfile();
    this.renderHeader();
    this.closeModal('modalProfile');
    this.showToast('🐾 Perfil atualizado!', 'success');
  },

  // ===== ESTATÍSTICAS / EVOLUÇÃO =====
  openStats() {
    const total = this.habits.length;
    const done = this.habits.filter(h => h.completed).length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('statsStreak').textContent = this.calculateStreak();
    document.getElementById('statsTotalDone').textContent = done;
    document.getElementById('statsEnergy').textContent = percentage + '%';
    document.getElementById('statsExercises').textContent = this.exercisesDone;

    this.renderHistoryBars();
    this.openModal('modalStats');
  },

  renderHistoryBars() {
    const container = document.getElementById('historyBars');
    const history = this.history.slice(-7);

    // Preencher com dados fictícios se não tiver 7 dias
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayIdx = new Date().getDay();

    let displayData = [];
    for (let i = 6; i >= 0; i--) {
      const dayIdx = (todayIdx - i + 7) % 7;
      const dateStr = this.getDateString(i);
      const record = history.find(h => h.date === dateStr);
      displayData.push({
        label: days[dayIdx],
        percentage: record ? record.percentage : 0,
        isToday: i === 0
      });
    }

    const maxVal = Math.max(...displayData.map(d => d.percentage), 100);

    container.innerHTML = displayData.map(d => `
      <div class="history-bar-wrap">
        <div class="history-bar" style="height: ${Math.max((d.percentage / maxVal) * 100, 4)}%; opacity: ${d.isToday ? 1 : 0.7};"></div>
        <span class="history-bar-label">${d.label}</span>
      </div>
    `).join('');
  },

  getDateString(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  },

  calculateStreak() {
    if (!this.history.length) return 0;
    let streak = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].percentage >= 50) streak++;
      else break;
    }
    // Verificar se hoje conta
    const todayDone = this.habits.filter(h => h.completed).length;
    const todayTotal = this.habits.length;
    if (todayTotal > 0 && (todayDone / todayTotal) >= 0.5) streak++;
    return streak;
  },

  // ===== NAVEGAÇÃO =====
  switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    if (tabName === 'pet') {
      this.openProfile();
    } else if (tabName === 'stats') {
      this.openStats();
    } else if (tabName === 'settings') {
      this.showToast('⚙️ Configurações em breve!', 'info');
    }

    // Sempre volta para 'today' visualmente após abrir modal
    if (tabName !== 'today') {
      setTimeout(() => {
        document.querySelectorAll('.nav-item').forEach(item => {
          item.classList.toggle('active', item.dataset.tab === 'today');
        });
      }, 300);
    }
  },

  // ===== TOASTS =====
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  // ===== EVENT LISTENERS =====
  setupEventListeners() {
    // Botão de perfil no header
    document.getElementById('btnProfile').addEventListener('click', () => this.openProfile());

    // Quick Actions (Thumb Zone)
    document.getElementById('btnSyncNow').addEventListener('click', () => {
      this.showToast('⚡ Sincronizando dados...', 'success');
      this.renderAll();
      if (navigator.vibrate) navigator.vibrate(20);
    });

    document.getElementById('btnAddHabit').addEventListener('click', () => {
      this.openModal('modalAddHabit');
      if (navigator.vibrate) navigator.vibrate(15);
    });

    // Fechar modais
    document.getElementById('closeAddHabit').addEventListener('click', () => this.closeModal('modalAddHabit'));
    document.getElementById('closeProfile').addEventListener('click', () => this.closeModal('modalProfile'));
    document.getElementById('closeStats').addEventListener('click', () => this.closeModal('modalStats'));
    document.getElementById('closeStatsBtn').addEventListener('click', () => this.closeModal('modalStats'));

    // Ações dos modais
    document.getElementById('saveHabitBtn').addEventListener('click', () => this.addHabit());
    document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveProfile());
    document.getElementById('dismissExercise').addEventListener('click', () => this.dismissExercise());
    document.getElementById('doneExercise').addEventListener('click', () => this.completeExerciseAndHabit());

    // Navegação inferior
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.switchTab(item.dataset.tab));
    });

    // Filtros de categoria
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderHabits();
      });
    });

    // Fechar modal ao clicar no overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          const id = overlay.id;
          if (id === 'modalExercise') this.dismissExercise();
          else this.closeModal(id);
        }
      });
    });

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          if (modal.id === 'modalExercise') this.dismissExercise();
          else this.closeModal(modal.id);
        });
      }
      // Enter no input de título do hábito
      if (e.key === 'Enter' && document.activeElement.id === 'habitTitle') {
        this.addHabit();
      }
    });

    // Swipe para fechar modal (gesto natural mobile)
    let touchStartY = 0;
    document.querySelectorAll('.modal-sheet').forEach(sheet => {
      sheet.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      sheet.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchEndY - touchStartY;
        if (diff > 100) {
          const modal = sheet.closest('.modal-overlay');
          if (modal) {
            if (modal.id === 'modalExercise') this.dismissExercise();
            else this.closeModal(modal.id);
          }
        }
      }, { passive: true });
    });
  },

  // ===== SERVICE WORKER (Inline via Blob) =====
  setupServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const swCode = `
      const CACHE_NAME = 'petfit-sync-v1';
      const STATIC_ASSETS = [
        '/',
        '/index.html',
        '/style.css',
        '/script.js',
        '/manifest.json'
      ];

      self.addEventListener('install', (e) => {
        e.waitUntil(
          caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
        );
      });

      self.addEventListener('activate', (e) => {
        e.waitUntil(
          caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
          ).then(() => self.clients.claim())
        );
      });

      self.addEventListener('fetch', (e) => {
        if (e.request.method !== 'GET') return;
        e.respondWith(
          caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
              if (response && response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
              }
              return response;
            }).catch(() => new Response('Offline', { status: 503 }));
          })
        );
      });
    `;

    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    navigator.serviceWorker.register(swUrl)
      .then(reg => console.log('[PetFit] Service Worker registrado'))
      .catch(err => console.log('[PetFit] Erro no SW:', err));
  },

  // ===== STATUS ONLINE/OFFLINE =====
  checkOnlineStatus() {
    const banner = document.getElementById('offlineBanner');

    const update = () => {
      if (navigator.onLine) {
        banner.classList.remove('active');
      } else {
        banner.classList.add('active');
      }
    };

    window.addEventListener('online', () => {
      banner.classList.remove('active');
      this.showToast('🌐 Conexão restaurada!', 'success');
    });

    window.addEventListener('offline', () => {
      banner.classList.add('active');
    });

    update();
  }
};

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
