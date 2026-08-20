# 🐾 PetFit Sync

PWA de Gestão de Hábitos para **Pets e Tutores** com design **Thumb-Friendly**.

## Conceito
- **Acompanhamento Duplo**: Registre hábitos do pet (alimentação, passeio, medicação, escovação)
- **Microexercícios para o Tutor**: Sempre que registra um hábito, receba uma sugestão de movimento
- **Energia da Dupla**: Indicador de progresso e sintonia entre pet e tutor

## Estrutura (3 arquivos principais)
```
petfit-sync/
├── index.html      ← Estrutura semântica PWA
├── style.css       ← Mobile-First + Thumb Zone
├── script.js       ← Lógica completa + localStorage
├── manifest.json   ← Manifesto PWA (obrigatório)
└── assets/
    └── icons/      ← Ícones PWA
```

## 🚀 Deploy no Vercel

1. **Compacte** todos os arquivos em um `.zip`
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Arraste o `.zip` para a área indicada
4. Pronto! 🎉

Ou via CLI:
```bash
cd petfit-sync
npx vercel --prod
```

## 📱 Instalar como App
- **Android**: Menu Chrome → "Adicionar à tela inicial"
- **iOS**: Compartilhar Safari → "Adicionar à Tela de Início"

## ⚡ Funcionalidades
- ✅ Thumb-Friendly Zone (navegação e ações na parte inferior)
- ✅ Sugestões dinâmicas de exercícios por categoria
- ✅ localStorage com persistência total
- ✅ Reset automático diário dos hábitos
- ✅ Histórico de 7 dias com gráfico
- ✅ Streak de dias consecutivos
- ✅ Service Worker para funcionamento offline
- ✅ Touch targets mínimos de 48px
- ✅ Safe area support (notch/gesture areas)
- ✅ Swipe-to-dismiss nos modais
- ✅ Haptic feedback (quando suportado)

## 🎨 Design
- **Tema**: Warm & Energético (off-white + laranja coral)
- **Fonte**: Inter (Google Fonts)
- **Área Superior**: Informação estática (progresso, energia)
- **Área Inferior**: Toda interação principal (nav, botões, FAB)
- **Modais**: Sobem de baixo com ações na base (Thumb Zone)
