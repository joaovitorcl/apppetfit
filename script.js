/**
 * ═══════════════════════════════════════════════════════════════
 *  PETFIT SYNC v4.0 — script.js
 *  PWA de Gestão de Hábitos para Pets e Tutores
 *  Features: Skeletons | DataLayer | Gestures | Microinterações Progressivas
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
      lastDate: 'petfit_lastDate', gestureHint: 'petfit_gestureHint',
      highFiveHint: 'petfit_highFiveHint'
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
            gestureHint: this._get(this.keys.gestureHint, false),
            highFiveHint: this._get(this.keys.highFiveHint, false)
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
    async saveHighFiveHint(s) { this._set(this.keys.highFiveHint, s); return true; },
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
        return { habits: data.habits || null, profile: data.profile || null, history: data.history || [], exercises: data.exercises || 0, lastDate: data.lastDate || '', gestureHint: data.gestureHint || false, highFiveHint: data.highFiveHint || false };
      }
      return { habits: null, profile: null, history: [], exercises: 0, lastDate: '', gestureHint: false, highFiveHint: false };
    },
    async saveHabits(h) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ habits: h }); return true; },
    async saveProfile(p) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ profile: p }); return true; },
    async saveHistory(h) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ history: h }); return true; },
    async saveExercises(c) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ exercises: c }); return true; },
    async saveLastDate(d) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ lastDate: d }); return true; },
    async saveGestureHint(s) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ gestureHint: s }); return true; },
    async saveHighFiveHint(s) { const uid = firebase.auth().currentUser.uid; await db.collection('users').doc(uid).update({ highFiveHint: s }); return true; }
  },

  driver() { return CONFIG.useFirebase ? this._firebase : this._local; },
  async getAll() { return this.driver().getAll(); },
  async saveHabits(h) { return this.driver().saveHabits(h); },
  async saveProfile(p) { return this.driver().saveProfile(p); },
  async saveHistory(h) { return this.driver().saveHistory(h); },
  async saveExercises(c) { return this.driver().saveExercises(c); },
  async saveLastDate(d) { return this.driver().saveLastDate(d); },
  async saveGestureHint(s) { return this.driver().saveGestureHint(s); },
  async saveHighFiveHint(s) { return this.driver().saveHighFiveHint(s); }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 3: EXERCÍCIOS
// ═══════════════════════════════════════════════════════════════
const ExerciseDB = {
  alimentacao: ["Enquanto prepara a ração, faça 15 agachamentos","Segure a vasilha com os braços estendidos por 20 segundos","Faça 10 polichinelos enquanto o pet come","Fique na ponta dos pés por 30 segundos","Faça 12 elevações de panturrilha esperando o pet terminar","Rode os ombros 15 vezes para trás e para frente"],
  passeio: ["Durante o passeio, faça 3 tiros curtos de corrida de 20 segundos","A cada esquina, faça 5 polichinelos","Suba e desça uma escada 2 vezes","Faça caminhada acelerada por 2 minutos","Pare e faça 10 agachamentos em um ponto do percurso","Levante os joelhos alternadamente por 30 segundos"],
  medicacao: ["Enquanto prepara o remédio, faça 10 rotações de ombros","Segure a posição de prancha por 20 segundos","Faça 8 flexões de braço no chão","Gire o tronco 10 vezes para cada lado","Faça 12 abdominais curtos","Estique os braços para cima e segure por 15 segundos"],
  escovacao: ["Faça agachamento isométrico enquanto escova o pet (30s)","Levante os calcanhares 15 vezes","Contraia o abdômen por 20 segundos","Faça 10 elevações de panturrilha","Rode os punhos 10 vezes em cada sentido","Incline o tronco para os lados 8 vezes cada"],
  brincadeira: ["Corra junto com o pet por 1 minuto","Faça 20 jumping jacks","Deite e levante 10 vezes","Faça 15 abdominais","Pule corda imaginária por 30 segundos","Faça 12 lunges alternados"],
  higiene: ["Enquanto prepara o banho, faça 10 agachamentos","Segure a posição de parede sentada por 20 segundos","Faça 15 rotações de tornozelo","Estique a coluna: braços para cima, segure 15s","Faça 10 polichinelos entre uma etapa e outra","Contraia o glúteo por 15 segundos de cada lado"],
  outro: ["Faça 10 agachamentos","Segure prancha por 30 segundos","Faça 15 polichinelos","Gire os braços 20 vezes","Levante os calcanhares 20 vezes","Faça 12 flexões de braço"]
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
    document.getElementById('weeklyTrailBlock').style.display = 'none';
  },
  hide() {
    ['skeletonProgress','skeletonEnergy','skeletonHabitsList'].forEach(id => {
      const el = document.getElementById(id); if(el) el.style.display = 'none';
    });
    ['realProgress','realEnergy','habitsList'].forEach(id => {
      const el = document.getElementById(id);
      if(el) { el.style.display = id==='realEnergy'?'flex':'block'; el.classList.add('fade-in'); }
    });
    const trail = document.getElementById('weeklyTrailBlock');
    if(trail) { trail.style.display = 'block'; trail.classList.add('visible'); }
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 5: GESTURE ENGINE
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
    startX:0, currentX:0, isSwiping:false, currentCard:null, threshold:80,
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
      this.currentCard = card;
      this.isSwiping = true;
      card.classList.add('swiping');
      card.classList.remove('snap-back','swiped-left','swiped-right');
    },
    onTouchMove(e) {
      if(!this.isSwiping || !this.currentCard) return;
      this.currentX = e.touches[0].clientX;
      const diff = this.currentX - this.startX;
      if(Math.abs(diff) > 5) this.currentCard.style.transform = `translateX(${diff}px)`;
    },
    onTouchEnd(e) {
      if(!this.isSwiping || !this.currentCard) return;
      this.isSwiping = false;
      const diff = this.currentX - this.startX;
      const card = this.currentCard;
      card.classList.remove('swiping');
      card.style.transform = '';
      if(diff < -this.threshold) {
        const habitId = card.closest('.habit-card-wrapper')?.dataset.id;
        if(habitId) {
          const habit = App.habits.find(h=>h.id===habitId);
          if(habit && !habit.completed) {
            App.pendingHabitId = habitId; App.pendingHabitAction = 'complete';
            App.showHighFiveModal(habit);
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
        <button class="long-press-menu-item" onclick="GestureEngine.longPress.action('toggle','${habitId}')">${isCompleted?'↩️ Desmarcar':'🐾 High-Five'}</button>
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
//  SEÇÃO 6: HIGH-FIVE ENGINE v4
// ═══════════════════════════════════════════════════════════════
const HighFiveEngine = {
  progress: 0, interval: null, completed: false, circumference: 0,

  init() {
    const circle = document.getElementById('hfProgressCircle');
    if(circle) {
      const r = 64;
      this.circumference = 2 * Math.PI * r;
      circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
      circle.style.strokeDashoffset = this.circumference;
    }
    this.bindEvents();
  },

  bindEvents() {
    const btn = document.getElementById('hfHoldBtn');
    if(!btn) return;

    const startEvents = ['mousedown', 'touchstart'];
    const endEvents = ['mouseup', 'mouseleave', 'touchend', 'touchcancel'];

    startEvents.forEach(evt => {
      btn.addEventListener(evt, (e) => {
        e.preventDefault();
        if(this.completed) { this.reset(); return; }
        this.start();
      }, {passive: false});
    });

    endEvents.forEach(evt => {
      btn.addEventListener(evt, (e) => {
        if(!this.completed) this.reset();
      });
    });

    document.getElementById('dismissHighFive')?.addEventListener('click', () => {
      App.closeModal('modalHighFive');
      this.reset();
    });
  },

  start() {
    if(this.completed) return;
    const circle = document.getElementById('hfProgressCircle');
    const petAvatar = document.getElementById('hfAvatarPet');
    const tutorAvatar = document.getElementById('hfAvatarTutor');
    const hapticBars = document.querySelectorAll('.haptic-bar');

    this.interval = setInterval(() => {
      this.progress += 2.5;
      const offset = this.circumference - (this.progress / 100) * this.circumference;
      if(circle) circle.style.strokeDashoffset = offset;

      // Avatars move closer
      const movePct = Math.min(this.progress / 100, 1);
      if(petAvatar) petAvatar.style.transform = `translateX(${movePct * 32}px) scale(${1 + movePct * 0.15})`;
      if(tutorAvatar) tutorAvatar.style.transform = `translateX(${-movePct * 32}px) scale(${1 + movePct * 0.15})`;

      // Haptic bars visual feedback
      const activeBars = Math.floor((this.progress / 100) * 5);
      hapticBars.forEach((bar, i) => {
        bar.classList.toggle('active', i < activeBars);
      });

      // Actual haptic feedback
      if(this.progress % 20 === 0 && navigator.vibrate) {
        navigator.vibrate(10 + (this.progress / 5));
      }

      if(this.progress >= 100) {
        this.complete();
      }
    }, 30);
  },

  complete() {
    clearInterval(this.interval);
    this.completed = true;

    const btn = document.getElementById('hfHoldBtn');
    const btnIcon = document.getElementById('hfBtnIcon');
    const btnLabel = document.getElementById('hfBtnLabel');
    const spark = document.getElementById('highfiveSpark');
    const petAvatar = document.getElementById('hfAvatarPet');
    const tutorAvatar = document.getElementById('hfAvatarTutor');

    if(btn) btn.classList.add('complete');
    if(btnIcon) btnIcon.style.display = 'none';
    if(btnLabel) btnLabel.style.display = 'block';
    if(spark) spark.classList.add('show');
    if(petAvatar) petAvatar.classList.add('highfiving');
    if(tutorAvatar) tutorAvatar.classList.add('highfiving');

    this.createConfetti();

    // Strong haptic
    if(navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 50]);

    // Complete the habit after animation
    setTimeout(() => {
      App.completeHighFiveHabit();
    }, 1200);
  },

  createConfetti() {
    const container = document.getElementById('hfConfettiArea');
    if(!container) return;
    const particles = ['🐾', '✨', '⭐', '🎉', '🔥', '💫', '🌟', '⚡'];

    for(let i = 0; i < 16; i++) {
      const p = document.createElement('span');
      p.className = 'hf-particle';
      p.textContent = particles[Math.floor(Math.random() * particles.length)];
      container.appendChild(p);

      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 50 + Math.random() * 60;
      const rot = Math.random() * 360;

      requestAnimationFrame(() => {
        p.style.transition = 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        p.style.opacity = '1';
        p.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${rot}deg) scale(${0.6 + Math.random() * 0.8})`;
      });

      setTimeout(() => {
        p.style.opacity = '0';
        p.style.transform += ' scale(0)';
      }, 500);
      setTimeout(() => p.remove(), 1000);
    }
  },

  reset() {
    clearInterval(this.interval);
    this.progress = 0;
    this.completed = false;

    const circle = document.getElementById('hfProgressCircle');
    const btn = document.getElementById('hfHoldBtn');
    const btnIcon = document.getElementById('hfBtnIcon');
    const btnLabel = document.getElementById('hfBtnLabel');
    const spark = document.getElementById('highfiveSpark');
    const petAvatar = document.getElementById('hfAvatarPet');
    const tutorAvatar = document.getElementById('hfAvatarTutor');
    const hapticBars = document.querySelectorAll('.haptic-bar');

    if(circle) circle.style.strokeDashoffset = this.circumference;
    if(btn) btn.classList.remove('complete');
    if(btnIcon) btnIcon.style.display = 'block';
    if(btnLabel) btnLabel.style.display = 'none';
    if(spark) spark.classList.remove('show');
    if(petAvatar) { petAvatar.style.transform = ''; petAvatar.classList.remove('highfiving'); }
    if(tutorAvatar) { tutorAvatar.style.transform = ''; tutorAvatar.classList.remove('highfiving'); }
    hapticBars.forEach(bar => bar.classList.remove('active'));
  },

  setAvatars(petAvatar, tutorAvatar) {
    const petImg = document.getElementById('hfPetImg');
    const tutorImg = document.getElementById('hfTutorImg');
    if(petImg) petImg.src = petAvatar;
    if(tutorImg) tutorImg.src = tutorAvatar;
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 7: WEEKLY TRAIL ENGINE v4
// ═══════════════════════════════════════════════════════════════
const WeeklyTrailEngine = {
  init(containerId, isDetail = false) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';

    const width = container.offsetWidth || (isDetail ? 400 : 300);
    const height = container.offsetHeight || (isDetail ? 80 : 70);
    const segments = 7;
    const segWidth = (width - (isDetail ? 40 : 30)) / segments;

    for(let i = 0; i < segments; i++) {
      const x = (isDetail ? 20 : 12) + i * segWidth;
      const y = height / 2 + Math.sin(i * 0.9) * (isDetail ? 18 : 15);

      const seg = document.createElement('div');
      seg.className = 'trail-segment';
      seg.style.left = x + 'px';
      seg.style.top = y + 'px';
      seg.style.width = (segWidth - 4) + 'px';
      seg.id = `${containerId}-seg-${i}`;
      container.appendChild(seg);

      const fpHuman = document.createElement('span');
      fpHuman.className = 'trail-footprint';
      fpHuman.textContent = '👟';
      fpHuman.style.left = (x + segWidth * 0.2) + 'px';
      fpHuman.style.top = (y - 18) + 'px';
      fpHuman.id = `${containerId}-fp-h-${i}`;
      container.appendChild(fpHuman);

      const fpPaw = document.createElement('span');
      fpPaw.className = 'trail-footprint';
      fpPaw.textContent = '🐾';
      fpPaw.style.left = (x + segWidth * 0.55) + 'px';
      fpPaw.style.top = (y + 6) + 'px';
      fpPaw.id = `${containerId}-fp-p-${i}`;
      container.appendChild(fpPaw);
    }
  },

  stampDay(containerId, dayIndex, history, streak) {
    const seg = document.getElementById(`${containerId}-seg-${dayIndex}`);
    const fpH = document.getElementById(`${containerId}-fp-h-${dayIndex}`);
    const fpP = document.getElementById(`${containerId}-fp-p-${dayIndex}`);

    if(seg) seg.classList.add('active');
    setTimeout(() => { if(fpH) fpH.classList.add('stamped'); }, 200);
    setTimeout(() => { if(fpP) fpP.classList.add('stamped'); }, 400);

    // Play stamp sound effect (visual only since we can't guarantee audio)
    // Trophy shine if all 7 days
    if(dayIndex === 6) {
      const trophyId = containerId === 'trailPath' ? 'trailTrophy' : 'trailDetailTrophy';
      const trophy = document.getElementById(trophyId);
      if(trophy) {
        setTimeout(() => trophy.classList.add('shine'), 600);
      }
    }
  },

  render(history, streak) {
    this.init('trailPath');
    this.init('trailDetailPath', true);

    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const todayIdx = new Date().getDay();

    // Update streak label
    const streakLabel = document.getElementById('trailStreak');
    if(streakLabel) streakLabel.textContent = `🔥 ${streak} dia${streak !== 1 ? 's' : ''}`;

    // Stamp completed days from history
    for(let i = 0; i < 7; i++) {
      const dayOffset = 6 - i;
      const dateStr = App.getDateString(dayOffset);
      const record = history.find(h => h.date === dateStr);

      if(record && record.percentage >= 50) {
        setTimeout(() => {
          this.stampDay('trailPath', i, history, streak);
          this.stampDay('trailDetailPath', i, history, streak);
        }, i * 150 + 500);
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
//  SEÇÃO 8: APLICAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const App = {
  habits:[], profile:{petName:'Rex', tutorName:'Tutor', avatar:'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Rex&backgroundColor=ffdfbf'},
  history:[], exercisesDone:0, currentFilter:'all', pendingHabitId:null, pendingHabitAction:null, isLoading:false, gestureHintShown:false, highFiveHintShown:false,

  async init() {
    SkeletonManager.show();
    this.setupEventListeners();
    GestureEngine.ptr.init();
    GestureEngine.swipe.init();
    GestureEngine.longPress.init();
    HighFiveEngine.init();
    this.setupServiceWorker();
    this.checkOnlineStatus();
    await this.loadData();
    await this.checkDayReset();
    SkeletonManager.hide();
    this.renderAll();
    this.showGestureHint();
    WeeklyTrailEngine.render(this.history, this.calculateStreak());
  },

  async refreshData() {
    SkeletonManager.show();
    await this.loadData();
    await this.checkDayReset();
    SkeletonManager.hide();
    this.renderAll();
    WeeklyTrailEngine.render(this.history, this.calculateStreak());
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
    this.highFiveHintShown = data.highFiveHint || false;
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
  async saveProfile() { await DataLayer.saveProfile(this.profile); },

  renderAll() { this.renderHeader(); this.renderDashboard(); this.renderHabits(); this.renderStats(); },

  renderHeader() {
    const img = document.getElementById('headerAvatarImg');
    if(img) img.src = this.profile.avatar;
  },

  renderDashboard() {
    const total = this.habits.length;
    const completed = this.habits.filter(h=>h.completed).length;
    const percentage = total>0 ? Math.round((completed/total)*100) : 0;
    document.getElementById('progressValue').textContent = percentage+'%';
    document.getElementById('progressFill').style.width = percentage+'%';
    const subTexts = ['Nenhum hábito concluído ainda','Bom começo! Continue assim','Metade do caminho! 💪','Quase lá! Faltam poucos','Incrível! Dupla em sintonia! 🔥'];
    document.getElementById('progressSub').textContent = subTexts[Math.min(Math.floor(percentage/25),4)];

    const energyBlock = document.getElementById('realEnergy');
    energyBlock.classList.remove('high','medium','low');
    const ei = document.getElementById('energyIcon');
    const el = document.getElementById('energyLevel');
    const eh = document.getElementById('energyHint');

    // Avatar de Energia v4
    const avatar = document.getElementById('energyAvatar');
    const avatarFace = document.getElementById('energyAvatarFace');

    if(percentage>=80) { 
      energyBlock.classList.add('high'); 
      if(ei) ei.textContent='🔥'; 
      if(el) el.textContent='Alta'; 
      if(eh) eh.textContent='Vocês estão imparáveis! 🚀'; 
      if(avatar) { avatar.className = 'energy-avatar happy'; avatarFace.textContent = '🤩'; }
    }
    else if(percentage>=50) { 
      energyBlock.classList.add('medium'); 
      if(ei) ei.textContent='⚡'; 
      if(el) el.textContent='Média'; 
      if(eh) eh.textContent='Bom ritmo! Continue sincronizando'; 
      if(avatar) { avatar.className = 'energy-avatar run'; avatarFace.textContent = '🏃'; }
    }
    else if(percentage>0) { 
      energyBlock.classList.add('low'); 
      if(ei) ei.textContent='💡'; 
      if(el) el.textContent='Aquecendo'; 
      if(eh) eh.textContent='Cada hábito conta! Vamos lá'; 
      if(avatar) { avatar.className = 'energy-avatar'; avatarFace.textContent = '🐕'; }
    }
    else { 
      energyBlock.classList.add('low'); 
      if(ei) ei.textContent='💤'; 
      if(el) el.textContent='Baixa'; 
      if(eh) eh.textContent='Complete hábitos para energizar!'; 
      if(avatar) { avatar.className = 'energy-avatar sad'; avatarFace.textContent = '😔'; }
    }
  },

  renderHabits() {
    const container = document.getElementById('habitsList');
    let filtered = this.habits;
    if(this.currentFilter !== 'all') filtered = this.habits.filter(h=>h.category===this.currentFilter);
    if(filtered.length===0) {
      container.innerHTML = `<div class="habit-card" style="justify-content:center;padding:32px 16px;opacity:0.7;"><span style="font-size:2rem;margin-bottom:8px;">🐾</span><p style="color:var(--text-muted);font-size:0.875rem;text-align:center;">Nenhum hábito nesta categoria.<br>Toque em "Novo Hábito" para adicionar!</p></div>`;
      return;
    }
    const sorted = [...filtered].sort((a,b)=>{ if(a.completed!==b.completed) return a.completed?1:-1; return (a.time||'00:00').localeCompare(b.time||'00:00'); });
    container.innerHTML = sorted.map(habit=>`
      <div class="habit-card-wrapper" data-id="${habit.id}">
        <div class="habit-card-bg swipe-left"><span class="swipe-action-icon">🐾</span></div>
        <div class="habit-card-bg swipe-right"><span class="swipe-action-icon">↩️</span></div>
        <div class="habit-card ${habit.completed?'completed':''}">
          <div class="habit-icon">${habit.icon||'✨'}</div>
          <div class="habit-info">
            <span class="habit-title">${this.escapeHtml(habit.title)}</span>
            <span class="habit-meta">${this.getCategoryLabel(habit.category)} · ${habit.time||'--:--'}</span>
          </div>
          <button class="habit-toggle ${habit.completed?'checked':''}" onclick="App.toggleHabit('${habit.id}')" aria-label="${habit.completed?'Desmarcar':'Concluir'} ${this.escapeHtml(habit.title)}"></button>
          <button class="habit-delete" onclick="App.deleteHabit('${habit.id}')" aria-label="Excluir ${this.escapeHtml(habit.title)}">🗑️</button>
        </div>
      </div>
    `).join('');
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

  // v4: High-Five Modal
  showHighFiveModal(habit) {
    document.getElementById('highfiveHabitName').textContent = habit.title;
    HighFiveEngine.setAvatars(
      this.profile.avatar,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.profile.tutorName)}&backgroundColor=d1fae5`
    );
    this.openModal('modalHighFive');
  },

  async completeHighFiveHabit() {
    if(this.pendingHabitId) {
      const habit = this.habits.find(h=>h.id===this.pendingHabitId);
      if(habit) {
        habit.completed = true;
        this.exercisesDone++;
        await DataLayer.saveExercises(this.exercisesDone);
        await this.saveHabits();
        this.renderAll();
        WeeklyTrailEngine.render(this.history, this.calculateStreak());
        this.showToast('🔥 High-Five completo! Dupla sincronizada!', 'success');
        if(navigator.vibrate) navigator.vibrate([30,50,30]);
      }
    }
    this.pendingHabitId = null; 
    this.pendingHabitAction = null;
    setTimeout(() => {
      this.closeModal('modalHighFive');
      HighFiveEngine.reset();
    }, 800);
  },

  async toggleHabit(id) {
    const habit = this.habits.find(h=>h.id===id);
    if(!habit) return;
    if(!habit.completed) {
      this.pendingHabitId = id; this.pendingHabitAction = 'complete';
      this.showHighFiveModal(habit);
    } else {
      habit.completed = false;
      await this.saveHabits();
      this.renderAll();
      WeeklyTrailEngine.render(this.history, this.calculateStreak());
      this.showToast('🔄 Hábito desmarcado', 'info');
    }
  },

  async deleteHabit(id) {
    if(!confirm('Tem certeza que deseja excluir este hábito?')) return;
    this.habits = this.habits.filter(h=>h.id!==id);
    await this.saveHabits();
    this.renderAll();
    WeeklyTrailEngine.render(this.history, this.calculateStreak());
    this.showToast('🗑️ Hábito removido', 'info');
  },

  async addHabit() {
    const title = document.getElementById('habitTitle').value.trim();
    const category = document.getElementById('habitCategory').value;
    const time = document.getElementById('habitTime').value;
    if(!title) { this.showToast('✍️ Digite um nome para o hábito', 'error'); return; }
    const icons = {alimentacao:'🍖',passeio:'🦮',medicacao:'💊',escovacao:'🪮',brincadeira:'🎾',higiene:'🛁',outro:'✨'};
    const newHabit = {id:'h'+Date.now(), title, category, time:time||'12:00', completed:false, icon:icons[category]||'✨', createdAt:Date.now()};
    this.habits.push(newHabit);
    await this.saveHabits();
    this.closeModal('modalAddHabit');
    this.renderAll();
    this.showToast('🎉 Hábito adicionado! Que tal um exercício?', 'success');
    setTimeout(()=>{ this.pendingHabitId=newHabit.id; this.pendingHabitAction='complete'; this.showHighFiveModal(newHabit); }, 400);
  },

  getRandomExercise(category) { const list=ExerciseDB[category]||ExerciseDB.outro; return list[Math.floor(Math.random()*list.length)]; },
  getRandomEmoji() { return ExerciseEmojis[Math.floor(Math.random()*ExerciseEmojis.length)]; },

  showExerciseModal(habit) {
    document.getElementById('exerciseEmoji').textContent = this.getRandomEmoji();
    document.getElementById('exerciseTitle').textContent = 'Hora de se mexer, '+this.profile.tutorName+'!';
    document.getElementById('exerciseText').textContent = 'Você está prestes a completar "'+habit.title+'" com '+this.profile.petName+'.';
    document.getElementById('exerciseSuggestion').textContent = this.getRandomExercise(habit.category);
    this.openModal('modalExercise');
  },

  async completeExerciseAndHabit() {
    if(this.pendingHabitId) {
      const habit = this.habits.find(h=>h.id===this.pendingHabitId);
      if(habit) {
        habit.completed = true;
        this.exercisesDone++;
        await DataLayer.saveExercises(this.exercisesDone);
        await this.saveHabits();
        this.renderAll();
        WeeklyTrailEngine.render(this.history, this.calculateStreak());
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
    document.getElementById('petName').value = this.profile.petName;
    document.getElementById('tutorName').value = this.profile.tutorName;
    document.getElementById('profileAvatarImg').src = this.profile.avatar;
    document.getElementById('statStreak').textContent = this.calculateStreak();
    document.getElementById('statTotal').textContent = this.habits.length;
    document.getElementById('statDone').textContent = this.habits.filter(h=>h.completed).length;
    this.openModal('modalProfile');
  },

  async saveProfile() {
    const petName = document.getElementById('petName').value.trim()||'Rex';
    const tutorName = document.getElementById('tutorName').value.trim()||'Tutor';
    this.profile.petName = petName;
    this.profile.tutorName = tutorName;
    this.profile.avatar = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed='+encodeURIComponent(petName)+'&backgroundColor=ffdfbf';
    await this.saveProfile();
    this.renderHeader();
    this.closeModal('modalProfile');
    this.showToast('🐾 Perfil atualizado!', 'success');
  },

  async openStats() {
    const total = this.habits.length;
    const done = this.habits.filter(h=>h.completed).length;
    const percentage = total>0 ? Math.round((done/total)*100) : 0;
    document.getElementById('statsStreak').textContent = this.calculateStreak();
    document.getElementById('statsTotalDone').textContent = done;
    document.getElementById('statsEnergy').textContent = percentage+'%';
    document.getElementById('statsExercises').textContent = this.exercisesDone;
    this.renderHistoryBars();
    WeeklyTrailEngine.render(this.history, this.calculateStreak());
    this.openModal('modalStats');
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
    container.innerHTML = displayData.map(d=>`<div class="history-bar-wrap"><div class="history-bar" style="height:${Math.max((d.percentage/maxVal)*100,4)}%;opacity:${d.isToday?1:0.7};"></div><span class="history-bar-label">${d.label}</span></div>`).join('');
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
    else if(tabName==='settings') this.showToast('⚙️ Configurações em breve!', 'info');
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
    document.getElementById('btnProfile').addEventListener('click', ()=>this.openProfile());
    document.getElementById('btnSyncNow').addEventListener('click', ()=>{ this.refreshData(); if(navigator.vibrate) navigator.vibrate(20); });
    document.getElementById('btnAddHabit').addEventListener('click', ()=>{ this.openModal('modalAddHabit'); if(navigator.vibrate) navigator.vibrate(15); });
    document.getElementById('closeAddHabit').addEventListener('click', ()=>this.closeModal('modalAddHabit'));
    document.getElementById('closeProfile').addEventListener('click', ()=>this.closeModal('modalProfile'));
    document.getElementById('closeStats').addEventListener('click', ()=>this.closeModal('modalStats'));
    document.getElementById('closeStatsBtn').addEventListener('click', ()=>this.closeModal('modalStats'));
    document.getElementById('saveHabitBtn').addEventListener('click', ()=>this.addHabit());
    document.getElementById('saveProfileBtn').addEventListener('click', ()=>this.saveProfile());
    document.getElementById('dismissExercise').addEventListener('click', ()=>this.dismissExercise());
    document.getElementById('doneExercise').addEventListener('click', ()=>this.completeExerciseAndHabit());
    document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click', ()=>this.switchTab(item.dataset.tab)));
    document.querySelectorAll('.filter-chip').forEach(chip=>chip.addEventListener('click', (e)=>{
      document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      e.target.classList.add('active');
      this.currentFilter = e.target.dataset.filter;
      this.renderHabits();
    }));
    document.querySelectorAll('.modal-overlay').forEach(overlay=>overlay.addEventListener('click', (e)=>{
      if(e.target===overlay) { 
        const id=overlay.id; 
        if(id==='modalExercise') this.dismissExercise(); 
        else if(id==='modalHighFive') { this.closeModal(id); HighFiveEngine.reset(); }
        else this.closeModal(id); 
      }
    }));
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape') { 
        document.querySelectorAll('.modal-overlay.active').forEach(modal=>{ 
          if(modal.id==='modalExercise') this.dismissExercise(); 
          else if(modal.id==='modalHighFive') { this.closeModal(modal.id); HighFiveEngine.reset(); }
          else this.closeModal(modal.id); 
        }); 
      }
      if(e.key==='Enter' && document.activeElement.id==='habitTitle') this.addHabit();
    });
    let touchStartY=0;
    document.querySelectorAll('.modal-sheet').forEach(sheet=>{
      sheet.addEventListener('touchstart', (e)=>{ touchStartY=e.touches[0].clientY; }, {passive:true});
      sheet.addEventListener('touchend', (e)=>{
        const diff = e.changedTouches[0].clientY - touchStartY;
        if(diff>100) { 
          const modal=sheet.closest('.modal-overlay'); 
          if(modal){ 
            if(modal.id==='modalExercise') this.dismissExercise(); 
            else if(modal.id==='modalHighFive') { this.closeModal(modal.id); HighFiveEngine.reset(); }
            else this.closeModal(modal.id); 
          } 
        }
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