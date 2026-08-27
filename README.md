# 🐾 PetFit Sync

PWA de Gestão de Hábitos para **Pets e Tutores**.

> **Versão atual:** 3.0 | **Gestures + Skeletons + Firebase-ready**

---

## 📜 Histórico de Versões

### 🚀 v1.0 — Fundação
> *Lançamento inicial com conceito Thumb-Friendly*

- ✅ **Acompanhamento Duplo**: Hábitos do pet + exercícios para o tutor
- ✅ **Microexercícios Dinâmicos**: Sugestões por categoria (alimentação, passeio, medicação, etc.)
- ✅ **Energia da Dupla**: Indicador visual de sintonia pet + tutor
- ✅ **Thumb-Friendly Zone**: Navegação inferior, ações na base, touch targets ≥48px
- ✅ **PWA Completo**: Manifest, Service Worker, offline support
- ✅ **localStorage**: Persistência local de dados
- ✅ **Reset Diário Automático**: Hábitos resetam a cada dia com histórico
- ✅ **7 Hábitos Padrão**: Alimentação, passeio, escovação, medicação, brincadeira
- ✅ **Dark/Warm Theme**: Paleta off-white + laranja coral
- ✅ **Fonte Inter**: Ótima legibilidade mobile
- ✅ **Swipe-to-Dismiss nos Modais**: Fechar arrastando para baixo
- ✅ **Haptic Feedback**: Vibração sutil nos botões

---

### 🔥 v2.0 — Skeletons + Firebase
> *Estados de carregamento e camada de dados abstrata*

#### 🦴 Skeleton Screens
- Skeleton com **efeito shimmer** em toda a interface
- Estados de carregamento em: Progresso do Dia, Energia da Dupla, Lista de Hábitos
- **Fade suave** ao trocar skeleton → conteúdo real
- Simula latência de rede para garantir visualização do skeleton

#### 🔥 DataLayer — Firebase-ready
- **Camada de dados abstrata**: troque `localStorage` ↔ `Firebase Firestore` com 1 linha
- Driver `localStorage` (padrão, zero config, offline)
- Driver `Firebase` (cloud, sincronização entre dispositivos)
- Autenticação anônima integrada
- Para ativar: mude `useFirebase: true` e descomente os SDKs

---

### 👆 v3.0 — Gestures (ATUAL)
> *Navegação por gestos nativos de mobile*

#### ⬇️ Pull-to-Refresh
- **Puxe para baixo** na lista de hábitos para sincronizar dados
- Indicador visual com ícone rotativo e texto de status
- Animação suave de retorno após sincronização

#### 👈👉 Swipe nos Cards de Hábito
- **Deslize para a ESQUERDA** → Completa o hábito (abre modal de exercício)
- **Deslize para a DIREITA** → Desmarca o hábito (se já estiver concluído)
- Background colorido revela a ação durante o swipe (verde = completar, vermelho = desfazer)
- Snap automático com animação elástica

#### 👆 Long-Press (Toque Longo)
- **Segure** qualquer card de hábito por 500ms
- Abre **menu de contexto** com opções:
  - ✅ Concluir / ↩️ Desmarcar
  - 💪 Ver exercício
  - ✏️ Editar (em breve)
  - 🗑️ Excluir
- Vibração tátil ao ativar (haptic feedback)
- Fecha ao tocar fora do menu

#### 💡 Gesture Hint
- Banner educativo na primeira abertura explicando os gestos
- "Deslize o hábito para ações rápidas · Segure para menu"
- Fecha permanentemente após dismiss (salvo no localStorage/Firebase)

---

## 📁 Estrutura (3 arquivos principais)

```
petfit-sync/
├── index.html       ← Skeletons + Firebase SDK + Gesture areas
├── style.css        ← Skeleton shimmer + Thumb Zone + Gesture styles
├── script.js        ← DataLayer + SkeletonManager + GestureEngine + App
├── manifest.json    ← PWA manifest
└── assets/
    └── icons/       ← Placeholders (substitua por PNGs reais)
```

---

## 🚀 Como ativar o Firebase

1. Crie projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Firestore Database** (modo teste) e **Authentication** (Anonymous)
3. No `script.js`, descomente a seção Firebase e mude `useFirebase: true`
4. No `index.html`, descomente os 3 scripts do Firebase SDK
5. Substitua as credenciais pelo seu `firebaseConfig`

---

## 🚀 Deploy no Vercel

```bash
cd petfit-sync
npx vercel --prod
```

Ou arraste o `.zip` em [vercel.com/new](https://vercel.com/new).

---

## ⚡ Funcionalidades Completas (v3.0)

| Categoria | Feature | Status |
|---|---|---|
| **Gestures** | Pull-to-Refresh | ✅ |
| **Gestures** | Swipe Left/Right nos cards | ✅ |
| **Gestures** | Long-Press menu de contexto | ✅ |
| **Gestures** | Swipe-to-Dismiss nos modais | ✅ |
| **Gestures** | Gesture Hint educativo | ✅ |
| **UI** | Skeleton Screens com shimmer | ✅ |
| **UI** | Thumb-Friendly Zone | ✅ |
| **Dados** | DataLayer (localStorage/Firebase) | ✅ |
| **Dados** | Reset diário automático | ✅ |
| **Dados** | Histórico 7 dias com gráfico | ✅ |
| **Dados** | Streak de dias consecutivos | ✅ |
| **PWA** | Service Worker (offline) | ✅ |
| **PWA** | Manifest + Ícones | ✅ |
| **UX** | Haptic feedback | ✅ |
| **UX** | Toast notifications | ✅ |
| **UX** | Offline banner | ✅ |

---

<p align="center">Feito com 🐾 pensando na saúde da dupla</p>
