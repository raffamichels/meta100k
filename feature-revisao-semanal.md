# Feature: Revisão Semanal

## Visão Geral

A **Revisão Semanal** é uma tela especial que aparece automaticamente no dashboard toda segunda-feira, exibindo um resumo completo da semana anterior: quanto o usuário guardou, gastou, resistiu e evoluiu em comparação à semana passada.

A premissa comportamental vem da psicologia de hábitos: **revisões periódicas aumentam a consistência em até 40%**. Ver o número da semana passada — bom ou ruim — cria ancoragem mental e motivação para a semana seguinte.

A revisão não exige ação do usuário. Ela aparece, informa e sai do caminho.

---

## Princípio de Design

> "Cada segunda-feira é um planejamento. Cada revisão é um espelho."

A tela deve ter **energia positiva independente do resultado**. Uma semana ruim é apresentada como oportunidade, não fracasso. Uma semana excelente é celebrada com entusiasmo.

A revisão nunca é obrigatória. Um botão "Ver depois" ou "X" a dispensa. Mas ela sempre estará disponível no histórico para quem quiser rever.

---

## Quando Aparece

### Gatilho automático

A revisão é exibida como **modal sobreposto ao dashboard** nas seguintes condições:

1. É segunda-feira (dia da semana = 1)
2. O usuário ainda não dispensou ou visualizou a revisão desta semana
3. O usuário tinha pelo menos **1 lançamento** na semana anterior (sábado a sexta-feira)

Se nenhuma dessas condições for atendida, o modal não aparece. Nunca exibir revisão de semana completamente vazia — não há o que revisar.

### Controle de estado

O estado "revisão já vista esta semana" é armazenado no `localStorage` do navegador com a chave:

```
meta100k_weekly_review_seen_YYYY-WW
```

Onde `YYYY-WW` é o ano e o número da semana ISO. Isso garante que o modal apareça apenas uma vez por semana, mesmo que o usuário feche e reabra o app.

### Acesso manual

Além do modal automático, um botão **"📋 Ver Revisão da Semana"** fica disponível na página de Perfil para o usuário revisar a qualquer momento. O modal pode ser aberto manualmente quantas vezes quiser.

---

## Estrutura do Modal

O modal ocupa a tela inteira no mobile e ~65% no desktop, com fundo levemente escurecido.

### Cabeçalho

```
┌────────────────────────────────────────────┐
│  📋  Revisão da Semana                      │
│  24 fev – 1 mar · 2026                     │
│                                    [X]      │
└────────────────────────────────────────────┘
```

### Seção 1 — Resumo Financeiro

```
┌────────────────────────────────────────────┐
│           SEMANA EM NÚMEROS                │
│                                            │
│  💰 Guardado       R$ 480,00               │
│                    ↑ +R$ 130 vs semana ant.│
│                                            │
│  💸 Gasto          R$ 310,00               │
│                    ↓ -R$ 40 vs semana ant. │
│                                            │
│  😈 Resistido      R$ 1.200,00             │
│                    (3 tentações)           │
└────────────────────────────────────────────┘
```

Setas coloridas indicam direção:
- Guardado ↑ = verde | Guardado ↓ = vermelho
- Gasto ↓ = verde | Gasto ↑ = vermelho
- Resistido: sempre neutro (qualquer valor é positivo)

Se for a primeira semana do usuário (sem semana anterior para comparar), as setas e comparações são omitidas.

---

### Seção 2 — Destaques da Semana

Três "troféus" automáticos baseados nos dados reais:

**Melhor dia da semana:**
```
⭐ Melhor dia: Quarta-feira
   Você guardou R$ 200 em um único dia.
```

**Categoria mais controlada (se houver orçamento):**
```
🎯 Categoria campeã: Alimentação
   Usou só R$ 180 de R$ 800 do limite.
```

Se não tiver orçamento, exibe:
```
🎯 Menor gasto: Transporte
   Apenas R$ 45 na categoria.
```

**Conquista ou desafio completado na semana:**
```
🏆 Conquista desbloqueada: "Semana Blindada"
   7 dias registrando tentações.
```

Se não houve conquista, exibe progresso:
```
📈 Progresso: 65% → 82% na meta
   +17pp de progresso esta semana!
```

---

### Seção 3 — Termômetro da Semana

Um placar visual de avaliação automática:

```
┌────────────────────────────────────────────┐
│           COMO FOI SUA SEMANA?             │
│                                            │
│   💪 Excelente                             │
│   ████████████████████  100%               │
│                                            │
│   Você guardou em 5 de 7 dias.             │
│   Sua taxa de poupança foi de 34%.         │
└────────────────────────────────────────────┘
```

#### Critérios de avaliação automática

| Classificação | Condições |
|---|---|
| 💪 Excelente | Guardou em ≥5 dias OU taxa de poupança ≥30% |
| 😊 Boa | Guardou em 3–4 dias OU taxa ≥20% |
| 😐 Regular | Guardou em 1–2 dias OU taxa ≥10% |
| 😔 Fraca | Não guardou nada OU taxa <10% |

A classificação é sempre apresentada de forma amigável. "Fraca" nunca aparece com tom acusatório.

---

### Seção 4 — Mensagem Personalizada

Uma frase gerada com base nos dados reais, selecionada de um banco de templates:

**Se foi excelente:**
> "🔥 Que semana! Você guardou R$480 e resistiu R$1.200 em tentações. Continue assim e a meta vai chegar antes do previsto."

**Se melhorou vs. semana anterior:**
> "📈 Evolução real! Você guardou R$130 a mais que na semana passada. Esse é o caminho."

**Se piorou vs. semana anterior:**
> "Semanas assim existem. O importante é estar aqui, revisando. Já é mais que a maioria faz. 💡"

**Se não guardou nada:**
> "Nenhum lançamento de poupança esta semana — mas você chegou até aqui, e isso conta. Que tal uma meta pequenininha para a próxima semana?"

**Se tem streak ativo:**
> "🔥 Seu streak está em 12 dias. Não deixe esfriar — cada dia guardado protege sua sequência."

---

### Seção 5 — Projeção Atualizada

```
┌────────────────────────────────────────────┐
│           SE VOCÊ MANTER ESTE RITMO...     │
│                                            │
│  Com R$ 480/semana → R$ 1.920/mês          │
│  Você atingiria R$100K em set/2028         │
│                                            │
│  💡 Guardando R$ 100 a mais por semana:    │
│     Chegaria em mai/2028 (+4 meses antes)  │
└────────────────────────────────────────────┘
```

A projeção usa a média das últimas 4 semanas para ser mais estável que usar apenas a semana atual.

O gancho "+R$100/semana" é fixo e pequeno de propósito — não sobrecarregar, apenas instigar.

---

### Rodapé do Modal

```
[ 📋 Ver histórico de revisões ]  [ Entendido → ]
```

- **Ver histórico**: abre `/revisoes` com todas as revisões passadas
- **Entendido**: fecha o modal e marca como visto no localStorage

---

## Dados Utilizados (Sem Novo Banco)

A Revisão Semanal é **100% calculada a partir de dados já existentes**. Não requer nenhuma nova tabela no banco.

### Período da semana

```ts
// Segunda a sexta-feira anterior (semana ISO: segunda = dia 1)
const weekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }) // última segunda
const weekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })     // último domingo
```

### Métricas calculadas

```ts
// Todos os dados do usuário já existem no banco

// Guardado na semana
const savedThisWeek = savingEntries
  .filter(s => isWithinInterval(parseISO(s.date), { start: weekStart, end: weekEnd }))
  .reduce((sum, s) => sum + s.value, 0)

// Gasto na semana
const spentThisWeek = expenses
  .filter(e => isWithinInterval(parseISO(e.date), { start: weekStart, end: weekEnd }))
  .reduce((sum, e) => sum + e.value, 0)

// Resistido na semana (Cofre do Diabo)
const resistedThisWeek = temptations
  .filter(t => isWithinInterval(parseISO(t.date), { start: weekStart, end: weekEnd }))
  .reduce((sum, t) => sum + t.value, 0)

// Semana anterior para comparação
const savedPrevWeek = /* mesma lógica com subWeeks(today, 2) */

// Melhor dia
const bestDay = /* agrupa saving por data, pega o maior */

// Dias com poupança
const activeDays = /* distinct dates com saving > 0 na semana */
```

---

## Componentes

### `components/dashboard/WeeklyReviewModal.tsx` (novo)

Componente cliente completo do modal. Recebe os dados pré-calculados como props.

Responsável por:
- Renderizar todas as seções
- Controlar abertura/fechamento
- Escrever no localStorage ao fechar
- Animação de entrada/saída (fade-in suave)

### `components/dashboard/WeeklyReviewTrigger.tsx` (novo)

Componente leve incluído no dashboard que:
1. Verifica se hoje é segunda-feira
2. Verifica o localStorage
3. Se necessário, renderiza `WeeklyReviewModal`

### `app/(protected)/revisoes/page.tsx` (novo)

Página de histórico de revisões — lista todas as semanas com dados, do mais recente ao mais antigo. Cada semana é um card colapsável com o resumo.

---

## Actions

### `lib/actions/weekly-review.ts` (novo)

```ts
// Buscar dados de uma semana específica
getWeeklyReviewData(userId, weekStartDate)
  → {
      saved: number,
      spent: number,
      resisted: number,
      temptationCount: number,
      activeDays: number,
      bestDay: { date: string, amount: number },
      achievementsUnlocked: string[],
      savingsRate: number,
      savedPrevWeek: number,  // para comparação
      spentPrevWeek: number,
      weeklyAvgLast4: number  // para projeção
    }

// Listar todas as semanas com dados (para a página /revisoes)
getAllWeeksWithData(userId)
  → { weekStart: string, weekEnd: string, saved: number, spent: number }[]
```

---

## Conquistas

### Novas conquistas permanentes

| Chave | Título | Descrição | Raridade | XP |
|-------|--------|-----------|----------|----|
| `review_first` | Reflexivo | Visualizou sua primeira Revisão Semanal | Common | 20 |
| `review_10` | Analítico | Visualizou 10 Revisões Semanais | Rare | 100 |
| `review_streak_4` | Mês Consciente | Revisou as 4 semanas de um mesmo mês | Rare | 150 |
| `perfect_week` | Semana Perfeita | Guardou em todos os 7 dias de uma semana | Epic | 300 |
| `improve_3_weeks` | Ascendência | Melhorou o valor guardado em 3 semanas consecutivas | Epic | 350 |

---

## Histórico de Revisões (`/revisoes`)

Página acessível pelo rodapé do modal ou pelo Perfil:

```
┌────────────────────────────────────────────┐
│  📋 Histórico de Revisões                   │
│                                            │
│  semana de 24/02 – 01/03  ▼               │
│    💰 R$ 480   💸 R$ 310   😈 R$ 1.200    │
│    💪 Excelente · 5 dias ativos            │
│                                            │
│  semana de 17/02 – 23/02  ▼               │
│    💰 R$ 350   💸 R$ 350   😈 R$ 0        │
│    😊 Boa · 3 dias ativos                  │
│                                            │
│  semana de 10/02 – 16/02  ▼               │
│    ...                                     │
└────────────────────────────────────────────┘
```

Cada semana pode ser expandida para ver os detalhes completos (mesma estrutura do modal).

---

## Considerações de UX

### Por que segunda-feira?

Segunda-feira é o dia de recomeço psicológico. O usuário já passou o fim de semana e está mentalmente "resetando". Ver a revisão na segunda de manhã estabelece o tom da semana que começa — não a punição pelo que passou.

### Modal vs. página

O modal foi escolhido sobre uma página dedicada porque:
- Não interrompe o fluxo — o usuário continua no dashboard
- Cria senso de "evento especial" (não é mais uma aba)
- Fácil de dispensar sem sentir que "pulou" algo importante

### Semana fraca não é fracasso

O design nunca deve envergonhar. Uma semana sem poupança pode ter inúmeras causas legítimas. A linguagem usa "desafios" e "oportunidade", nunca "você falhou".

### Primeiras semanas

Nas primeiras 2–3 semanas de uso, a comparação com semana anterior ainda está se construindo. Nesses casos:
- Semana 1: exibe dados sem comparação (sem seta ↑↓)
- Semana 2: primeira comparação disponível
- A projeção usa apenas os dados disponíveis, sem inventar médias

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `lib/actions/weekly-review.ts` | Criar | Buscar e calcular dados da semana |
| `components/dashboard/WeeklyReviewModal.tsx` | Criar | Modal completo da revisão |
| `components/dashboard/WeeklyReviewTrigger.tsx` | Criar | Lógica de disparo automático no dashboard |
| `app/(protected)/revisoes/page.tsx` | Criar | Histórico de todas as revisões |
| `app/(protected)/page.tsx` | Modificar | Incluir `WeeklyReviewTrigger` |
| `app/(protected)/perfil/page.tsx` | Modificar | Adicionar botão "Ver Revisão da Semana" |
| `lib/achievements.ts` | Modificar | Adicionar 5 novas conquistas |
