# Feature: Mapa do Tesouro

## Visão Geral

A barra de progresso do `HeroCard` **permanece exatamente como está** — leitura rápida, sempre visível. A novidade é que ela se torna **clicável**: ao clicar na barra (ou no HeroCard), um modal abre revelando o mapa completo da jornada narrativa.

O usuário encarna um aventureiro que percorre um mundo fantástico dividido em fases — cada fase representa uma faixa de progresso em direção à meta de R$100K. O modal transforma um número frio (% da meta) em uma **experiência emocional e narrativa** que gera curiosidade genuína sobre o que vem a seguir.

### Por que modal em vez de substituir a barra?

- **Dashboard já está denso** — substituir ocuparia espaço para algo visto toda hora
- **A barra é leitura rápida** — em 1 segundo o usuário sabe onde está; o mapa é experiência sob demanda
- **Cria curiosidade** — uma barra clicável com hint sutil (ícone 🗺️) convida à exploração
- **Menos disruptivo** — zero mudança no layout atual, apenas adiciona um modal

---

## Fases da Jornada

Cada fase cobre uma faixa de progresso e tem identidade visual e narrativa própria.

| # | Nome | Faixa | Emoji/Arte | Descrição narrativa |
|---|------|-------|------------|---------------------|
| 1 | **Vila da Partida** | 0–9% | 🏡 | Todo herói começa em algum lugar. Você deu o primeiro passo e saiu da vila. |
| 2 | **Floresta dos Primeiros Passos** | 10–24% | 🌲 | A jornada começa a valer. A floresta é densa, mas cada poupança abre um novo caminho. |
| 3 | **Planície da Determinação** | 25–39% | 🌾 | O horizonte se abre. Você passou do primeiro grande marco — 1/4 da meta. |
| 4 | **Montanha da Disciplina** | 40–54% | ⛰️ | A subida fica mais difícil. Aqui a maioria desiste. Você está no meio do caminho. |
| 5 | **Caverna do Ouro** | 55–69% | 🪨✨ | Você encontrou as profundezas. O brilho do ouro começa a aparecer nas paredes. |
| 6 | **Fortaleza dos Guardiões** | 70–84% | 🏰 | Os últimos obstáculos protegem o tesouro. Você chegou onde poucos chegam. |
| 7 | **Portal da Riqueza** | 85–94% | 🌟 | A energia do portal pulsa. O tesouro está logo além — você consegue quase tocar. |
| 8 | **Ante-Sala do Tesouro** | 95–99% | 💎 | Você está a centímetros do fim. Cada real poupado agora é histórico. |
| 9 | **O Grande Tesouro** | 100% | 👑 | Missão cumprida. Você conquistou os R$100K. Bem-vindo à lenda. |

---

## Fluxo de Interação

```
Dashboard (HeroCard com barra normal)
  → usuário vê hint sutil: ícone 🗺️ no canto da barra + cursor pointer
  → clica na barra de progresso
  → modal abre com o mapa completo
  → usuário explora as fases, clica em fases conquistadas/futuras
  → fecha o modal → volta ao dashboard sem nenhuma mudança de layout
```

### Hint visual na barra (HeroCard)

Adicionar ao canto direito da barra de progresso atual um texto pequeno clicável:

```
████████░░░░░░░░  18%   🗺️ Ver jornada
```

Ao passar o mouse (hover), a barra inteira ganha um leve highlight indicando que é clicável.

---

## Modal do Mapa

### Layout do modal

```
┌──────────────────────────────────────────────┐
│  🗺️ Mapa da Jornada               [✕ fechar] │
├──────────────────────────────────────────────┤
│                                              │
│  🌲                                          │
│  Floresta dos Primeiros Passos               │  ← fase atual
│  "A jornada começa a valer. A floresta é     │
│   densa, mas cada poupança abre caminho."    │
│                                              │
├──────────────────────────────────────────────┤
│  [🏡]──[🌲]──[🌾]──[⛰️]──[🪨]──[🏰]──[🌟]──[💎]──[👑] │
│   ✓     ◉     ○     ○     ○     ○     ○     ○     ○  │
├──────────────────────────────────────────────┤
│                                              │
│  Progresso na fase atual                     │
│  ███████░░░░░░░  53% da Floresta             │
│                                              │
│  Próxima fase: 🌾 Planície da Determinação   │
│  Faltam R$ 6.800 (você está em R$ 18.200)   │
│                                              │
└──────────────────────────────────────────────┘
```

### Elementos do modal

1. **Banner da fase atual** — emoji grande, nome e frase narrativa
2. **Trilha de fases** — 9 ícones em linha horizontal com estados:
   - ✓ Fase conquistada — cor sólida, clicável
   - ◉ Fase atual — destacado com pulso animado
   - ○ Fase futura — cinza/bloqueado, clicável para prévia
3. **Barra de progresso interna** — quanto da fase atual foi completado (não da meta global)
4. **Call-to-action** — próxima fase + quanto falta em reais

### Interatividade dentro do modal

- Clicar em fase **conquistada** → exibe tooltip/popover com:
  - Data em que o usuário chegou nela (via `UserAchievement.unlockedAt`)
  - Saldo que tinha na época
  - XP ganho ao entrar

- Clicar em fase **futura** → exibe tooltip/popover com:
  - Nome e frase narrativa da fase
  - Quanto falta em reais para chegar lá
  - XP que vai ganhar ao entrar

- Clicar na fase **atual** → nenhuma ação (já está no banner)

---

## Marcos e Gatilhos

### Ao entrar em uma nova fase

Quando o saldo total cruza o limiar de uma nova fase, disparar:

1. **Toast comemorativo** com emoji e nome da fase — "Você chegou na Floresta dos Primeiros Passos! 🌲"
2. **Conquista automática** — cada fase desbloqueada conta como conquista (ver seção Conquistas abaixo)
3. **XP bônus** — concedido automaticamente ao entrar na fase

### XP por fase atingida

| Fase | XP bônus |
|------|----------|
| Floresta | 100 XP |
| Planície | 200 XP |
| Montanha | 350 XP |
| Caverna | 500 XP |
| Fortaleza | 700 XP |
| Portal | 1000 XP |
| Ante-Sala | 1500 XP |
| Tesouro | 3000 XP |

---

## Integração com Conquistas

Criar conquistas permanentes para cada fase atingida, seguindo o padrão do sistema atual em `lib/achievements.ts`:

```ts
{ key: 'map_forest',    title: 'Desbravador',       desc: 'Entrou na Floresta dos Primeiros Passos', rarity: 'common',    xp: 100  }
{ key: 'map_plains',    title: 'Horizonte Aberto',  desc: 'Chegou à Planície da Determinação',       rarity: 'common',    xp: 200  }
{ key: 'map_mountain',  title: 'Escalador',         desc: 'Conquistou a Montanha da Disciplina',     rarity: 'rare',      xp: 350  }
{ key: 'map_cave',      title: 'Caçador de Ouro',   desc: 'Adentrou a Caverna do Ouro',              rarity: 'rare',      xp: 500  }
{ key: 'map_fortress',  title: 'Desafiante',        desc: 'Chegou à Fortaleza dos Guardiões',        rarity: 'epic',      xp: 700  }
{ key: 'map_portal',    title: 'Iluminado',         desc: 'Cruzou o Portal da Riqueza',              rarity: 'epic',      xp: 1000 }
{ key: 'map_antechamber', title: 'Quase Lá',        desc: 'Entrou na Ante-Sala do Tesouro',          rarity: 'epic',      xp: 1500 }
{ key: 'map_treasure',  title: 'Lendário',          desc: 'Conquistou o Grande Tesouro',             rarity: 'legendary', xp: 3000 }
```

---

## Banco de Dados

Nenhum campo novo é necessário no banco. O mapa é **calculado em tempo real** a partir de dados já existentes:

- `user.baseAmount` + soma de `Month.savings` = saldo total
- `user.goal` = meta
- `(saldo / goal) * 100` = percentual → determina a fase atual

Opcionalmente, para guardar a **data de entrada em cada fase** (para o modal de fases conquistadas), pode-se adicionar conquistas no `UserAchievement` — o campo `unlockedAt` já registra a data automaticamente.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `lib/mapa.ts` | Criar | Utilitário com FASES, getFaseAtual, getProgressoNaFase |
| `components/dashboard/MapaModal.tsx` | Criar | Modal completo do mapa (trilha + banner + progresso) |
| `components/dashboard/HeroCard.tsx` | Modificar | Adicionar hint 🗺️ + onClick na barra para abrir o modal |
| `lib/achievements.ts` | Modificar | Adicionar 8 novas conquistas de fase |
| `lib/gamification.ts` | Modificar | Adicionar verificação de fase atingida + XP bônus |
| `app/globals.css` | Modificar | Animação de pulso para fase atual na trilha |

> **Nota:** O `HeroCard` existente **não muda visualmente**. Apenas recebe um estado `modalAberto` e o hint clicável na barra. Zero impacto no layout do dashboard.

---

## Lógica de Cálculo da Fase

```ts
// lib/mapa.ts (novo arquivo utilitário)

export const FASES = [
  { key: 'village',      nome: 'Vila da Partida',            emoji: '🏡', min: 0,   max: 9,   xp: 0,    achievementKey: null             },
  { key: 'forest',       nome: 'Floresta dos Primeiros Passos', emoji: '🌲', min: 10,  max: 24,  xp: 100,  achievementKey: 'map_forest'     },
  { key: 'plains',       nome: 'Planície da Determinação',   emoji: '🌾', min: 25,  max: 39,  xp: 200,  achievementKey: 'map_plains'     },
  { key: 'mountain',     nome: 'Montanha da Disciplina',     emoji: '⛰️', min: 40,  max: 54,  xp: 350,  achievementKey: 'map_mountain'   },
  { key: 'cave',         nome: 'Caverna do Ouro',            emoji: '🪨', min: 55,  max: 69,  xp: 500,  achievementKey: 'map_cave'       },
  { key: 'fortress',     nome: 'Fortaleza dos Guardiões',    emoji: '🏰', min: 70,  max: 84,  xp: 700,  achievementKey: 'map_fortress'   },
  { key: 'portal',       nome: 'Portal da Riqueza',          emoji: '🌟', min: 85,  max: 94,  xp: 1000, achievementKey: 'map_portal'     },
  { key: 'antechamber',  nome: 'Ante-Sala do Tesouro',       emoji: '💎', min: 95,  max: 99,  xp: 1500, achievementKey: 'map_antechamber'},
  { key: 'treasure',     nome: 'O Grande Tesouro',           emoji: '👑', min: 100, max: 100, xp: 3000, achievementKey: 'map_treasure'   },
]

export function getFaseAtual(percentual: number) {
  return FASES.find(f => percentual >= f.min && percentual <= f.max) ?? FASES[0]
}

export function getProgressoNaFase(percentual: number, fase: typeof FASES[0]) {
  // Quanto % do intervalo da fase o usuário completou
  const faseRange = fase.max - fase.min
  if (faseRange === 0) return 100
  return Math.min(100, ((percentual - fase.min) / faseRange) * 100)
}

export function getFasesConquistadas(percentual: number) {
  return FASES.filter(f => percentual > f.max && f.max < 100)
}
```

---

## Estados Especiais

### Meta 100% — Tela do Tesouro

Ao atingir exatamente 100%, ao invés de apenas avançar de fase, exibir:
- Tela cheia comemorativa (overlay) com animação
- Mensagem: "Você chegou ao Grande Tesouro. R$100.000 conquistados."
- Data de conquista
- Botão para ativar o **Modo Prestígio** (feature futura)
- Botão para definir uma nova meta maior

### Modo Prestígio (gancho para feature futura)

Ao completar a jornada, exibir a opção de "Reiniciar jornada com nova meta". O mapa se reinicia, mas o usuário carrega um badge permanente de "Lendário" visível no perfil e no ranking.

---

## Considerações de UX

- O mapa deve ser **legível em mobile** — a trilha de ícones pode rolar horizontalmente (scroll suave) em telas pequenas, com a fase atual sempre centralizada.
- A **frase narrativa** de cada fase é o coração da feature — deve ser motivadora, não genérica.
- Usar emojis como arte principal mantém consistência com o estilo atual do projeto (sem imagens externas).
- A trilha de progresso é mais eficaz quando o usuário consegue ver **quantas fases já passou** e **quantas ainda faltam** simultaneamente.
