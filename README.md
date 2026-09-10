# 🐾 PetFit Sync

PWA de Gestão de Hábitos para **Pets e Tutores**.

> **Versão atual:** 4.0 | **Microinterações Progressivas**

---

## 📜 Histórico de Versões

### 🚀 v1.0 — Fundação
> *Lançamento inicial com conceito Thumb-Friendly*

- ✅ **Acompanhamento Duplo**: Hábitos do pet + exercícios para o tutor
- ✅ **Microexercícios Dinâmicos**: Sugestões por categoria
- ✅ **Energia da Dupla**: Indicador visual de sintonia pet + tutor
- ✅ **Thumb-Friendly Zone**: Navegação inferior, touch targets ≥48px
- ✅ **PWA Completo**: Manifest, Service Worker, offline support
- ✅ **localStorage**: Persistência local de dados
- ✅ **Reset Diário Automático**: Hábitos resetam a cada dia com histórico
- ✅ **7 Hábitos Padrão**: Alimentação, passeio, escovação, medicação, brincadeira
- ✅ **Dark/Warm Theme**: Paleta off-white + laranja coral

### 🔥 v2.0 — Skeletons + Firebase
> *Estados de carregamento e camada de dados abstrata*

- 🦴 **Skeleton Screens** com efeito shimmer
- 🔥 **DataLayer Firebase-ready**: troque localStorage ↔ Firestore com 1 linha
- Autenticação anônima integrada

### 👆 v3.0 — Gestures
> *Navegação por gestos nativos de mobile*

- ⬇️ **Pull-to-Refresh**
- 👈👉 **Swipe Left/Right** nos cards de hábito
- 👆 **Long-Press** menu de contexto
- 💡 **Gesture Hint** educativo

### ✨ v4.0 — Microinterações Progressivas (ATUAL)
> *Experiência tátil e visual imersiva*

---

## 🎨 Microinterações v4.0

### 🐾 1. Botão de Check-in "High-Five"
Substitui o simples botão de confirmar por uma experiência **Press & Hold** imersiva.

**Como funciona:**
- O usuário pressiona e segura o botão de pata (🐾)
- Um anel radial começa a encher progressivamente em torno do botão
- Os avatares do pet e do tutor se movem suavemente em direção um ao outro
- Barras de feedback háptico visual pulsam em sincronia
- O celular vibra com intensidade crescente (Haptic Feedback)
- Ao atingir 100%, os avatares se "encontram" em um high-five
- **Explosão de confete** com patas, estrelas e faíscas
- O botão se transforma em "✓ COMPLETO" com glow verde
- O hábito é marcado como concluído automaticamente

**Tecnologias:** SVG stroke-dasharray animation, CSS transforms, requestAnimationFrame, Vibration API

---

### ⚡ 4. Avatar de Energia (Estados do Pet)
O avatar do pet na tela inicial ganha **personalidade e estados emocionais** baseados no progresso.

**Estados:**
| Estado | Condição | Visual | Animação |
|--------|----------|--------|----------|
| 😔 **Triste** | 0% concluído | Avatar cinza, inclinado, expressão triste | Sombra alongada, sem movimento |
| 🐕 **Normal** | 1-49% | Avatar padrão, cor laranja | Estado estático |
| 🏃 **Correndo** | 50-79% | Avatar com glow pulsante ao redor | Animação contínua de corrida (shake lateral) |
| 🤩 **Feliz** | 80-100% | Avatar brilhante, expressão animada | Pulso de alegria com scale e bounce |

**Comportamento adicional:**
- Ao clicar em "Iniciar Exercício", o pet dá um **pulo animado** (jump) independente do estado
- Transições suaves entre estados com cubic-bezier easing
- O glow ao redor do avatar em estado "correndo" pulsa suavemente

---

### 👣 5. Trilha de Progresso Semanal (Pegadas)
Um componente visual gamificado que transforma o progresso semanal em uma **trilha no parque**.

**Como funciona:**
- Fundo simulando um parque com grama verde
- Trilha sinuosa com 7 segmentos (um para cada dia da semana)
- A cada dia concluído (≥50% dos hábitos), o segmento se ilumina
- **Carimbo animado**: uma pegada de tênis (👟) e uma pegada de pata (🐾) "carimbam" o caminho
- Animação de wiggle no carimbo para simular o impacto
- Os segmentos se iluminam sequencialmente com delay escalonado
- No final da semana, um **troféu (🏆)** brilha e pulsa ao ser atingido
- Mostrado tanto no dashboard quanto no modal de estatísticas

---

## 📁 Estrutura

```
petfit-sync/
├── index.html       ← Skeletons + Microinterações + Firebase SDK
├── style.css        ← Skeleton shimmer + Thumb Zone + Gestures + Microinterações
├── script.js        ← DataLayer + SkeletonManager + GestureEngine + HighFiveEngine + WeeklyTrailEngine + App
├── manifest.json    ← PWA manifest v4
└── assets/
    └── icons/       ← Ícones SVG (192x192, 512x512)
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

## ⚡ Funcionalidades Completas (v4.0)

| Categoria | Feature | Status |
|---|---|---|
| **Microinterações** | High-Five Press & Hold | ✅ |
| **Microinterações** | Avatar de Energia (4 estados) | ✅ |
| **Microinterações** | Trilha Semanal com Pegadas | ✅ |
| **Microinterações** | Confete de Patas | ✅ |
| **Microinterações** | Haptic Feedback Progressivo | ✅ |
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