# 🐾 PetFit Sync v2.0

PWA de Gestão de Hábitos para **Pets e Tutores** com **Skeleton Screens** e **DataLayer Firebase-ready**.

## ✨ Novidades v2.0

### 🦴 Skeleton Screens
- Estados de carregamento visuais (shimmer effect) em **toda a interface**
- Progresso, Energia da Dupla e Lista de Hábitos possuem skeletons dedicados
- Fade suave ao trocar de skeleton para conteúdo real
- Simula latência de rede para garantir que o skeleton apareça

### 🔥 DataLayer — Troque facilmente para Firebase
O código possui uma **camada de dados abstrata** que permite alternar entre:
- ✅ **localStorage** (padrão — funciona offline, zero config)
- 🔥 **Firebase Firestore** (cloud — sincronização entre dispositivos)

## 🚀 Como ativar o Firebase

### Passo 1: Crie o projeto no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Add project"** → dê um nome → **Continue**
3. Ative o **Firestore Database** (modo de teste)
4. Ative a **Authentication** → método **Anonymous**

### Passo 2: Copie as credenciais
No menu **Project Settings → General → Your apps → Web app**, copie o objeto `firebaseConfig`.

### Passo 3: Configure no projeto
Edite o arquivo `script.js`:

```javascript
// 1. DESCOMENTE a seção de configuração do Firebase (linha ~20)
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  // ... restante das credenciais
};

// 2. DESCOMENTE a inicialização
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 3. ATIVE o driver Firebase
const CONFIG = {
  useFirebase: true,  // ← mude de false para true
  // ...
};
```

### Passo 4: Ative os scripts no HTML
No `index.html`, **descomente** as 3 linhas do Firebase SDK (no `<head>`):

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
```

Pronto! Agora os dados serão salvos no Firestore e sincronizados entre dispositivos. 🎉

## 📁 Estrutura (3 arquivos principais)

```
petfit-sync/
├── index.html       ← Skeletons + Firebase SDK (comentado)
├── style.css        ← Skeleton Screens com shimmer + Thumb Zone
├── script.js        ← DataLayer (localStorage/Firebase) + SkeletonManager
├── manifest.json    ← PWA manifest
└── assets/
    └── icons/       ← Ícones placeholder
```

## 🎨 Skeleton Screens implementados

| Área | Skeleton | Efeito |
|---|---|---|
| **Progresso do Dia** | Barra + texto | Shimmer horizontal |
| **Energia da Dupla** | Círculo + 3 linhas | Shimmer horizontal |
| **Lista de Hábitos** | 5 cards esqueleto | Shimmer + layout real |

## 🚀 Deploy no Vercel

```bash
cd petfit-sync
npx vercel --prod
```

Ou arraste o `.zip` em [vercel.com/new](https://vercel.com/new).

## ⚡ Funcionalidades completas
- ✅ **Skeleton Screens** com efeito shimmer em toda a UI
- ✅ **DataLayer abstrata** — troque localStorage ↔ Firebase com 1 linha
- ✅ **Thumb-Friendly Zone** — navegação e ações na parte inferior
- ✅ **Microexercícios** — sugestões dinâmicas por categoria
- ✅ **Reset diário automático** — hábitos resetam a cada dia
- ✅ **Histórico 7 dias** — gráfico de barras na tela de Evolução
- ✅ **Streak** — dias consecutivos com ≥50% de conclusão
- ✅ **Service Worker** — funcionamento offline
- ✅ **Haptic feedback** — vibração sutil nos botões
- ✅ **Swipe to dismiss** — gesto natural nos modais
