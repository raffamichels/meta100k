# Feature: Orçamento Mensal com Alertas

## Visão Geral

O **Orçamento Mensal** é um sistema de limites de gasto por categoria que o usuário define para cada mês. A cada novo gasto registrado, o sistema compara automaticamente o total da categoria com o limite definido e emite alertas visuais progressivos.

A feature resolve um problema central: **saber que gastou demais só no final do mês é tarde demais**. Com limites ativos, o usuário passa a ter consciência em tempo real de onde está indo seu dinheiro — antes de ultrapassar.

O acesso é intencional e exclusivo: o botão de Orçamento Mensal existe **apenas na página de Perfil**, reforçando que é uma configuração pessoal e deliberada, não um recurso de consulta rápida.

---

## Princípio de Design

> "Um orçamento não é uma prisão — é um mapa."

O tom da feature deve ser **orientativo, não punitivo**. Ultrapassar um limite não bloqueia nada; apenas informa. A decisão continua sendo do usuário. O sistema celebra quando os limites são respeitados e registra isso como conquista.

---

## Acesso e Navegação

### Único ponto de entrada: Perfil

Na página `/perfil`, adicionar o botão:

```
┌───────────────────────────────────────┐
│  📊 Orçamento Mensal                  │
│  Defina limites de gasto por categoria │
│                                  →    │
└───────────────────────────────────────┘
```

Ao clicar, o usuário é redirecionado para `/orcamento`.

**Nenhum outro lugar no app** terá link ou acesso direto a esta página. Ela não aparece na `BottomNav`, no `Header`, nem em qualquer outro card ou menu.

### Página de Orçamento (`/orcamento`)

A página é dividida em duas seções:

1. **Resumo do mês atual** — progresso de cada categoria com limite definido
2. **Gerenciador de limites** — criar, editar e excluir limites por categoria

---

## Fluxo do Usuário

### 1. Primeiro acesso — definir limites

O usuário acessa pelo Perfil e vê uma tela vazia com a mensagem:

> "Você ainda não definiu nenhum limite. Comece adicionando uma categoria."

Botão **"+ Adicionar limite"** abre um formulário inline:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Categoria | Select | Mesmas categorias usadas em Gastos |
| Limite mensal | Número (R$) | Valor máximo para a categoria no mês |

Ao salvar, o sistema cria o `Budget` e já calcula o progresso do mês atual.

---

### 2. Visualização do progresso

Cada categoria com limite aparece como um card com barra de progresso:

```
┌──────────────────────────────────────────────────┐
│  🍔 Alimentação                                   │
│                                                    │
│  R$ 620 gastos de R$ 800 limite                   │
│  ████████████████████░░░░░  77%                   │
│                                                    │
│  R$ 180 restantes · 12 dias até o fim do mês      │
└──────────────────────────────────────────────────┘
```

#### Estados visuais da barra de progresso

| Faixa de uso | Cor da barra | Mensagem |
|---|---|---|
| 0% – 59% | Verde `#60d060` | Normal — dentro do orçamento |
| 60% – 79% | Amarelo `#f0d040` | Atenção — mais da metade usada |
| 80% – 99% | Laranja `#f08020` | Alerta — próximo do limite |
| 100%+ | Vermelho `#f04040` | Limite ultrapassado |

Ao ultrapassar 100%, o card exibe o valor excedido:
```
🔴 Alimentação — R$ 120 ACIMA do limite
```

---

### 3. Alertas em tempo real (no lançamento de gastos)

Quando o usuário registra um gasto em `ExpenseForm` e aquela categoria tem limite definido:

- **Após salvar**, o toast de confirmação inclui o status do orçamento:
  - Abaixo de 80%: Toast normal sem menção ao orçamento
  - Entre 80% e 99%: Toast amarelo → `"Gasto salvo! ⚠️ Você usou 85% do seu orçamento de Alimentação este mês."`
  - Acima de 100%: Toast vermelho → `"Gasto salvo! 🔴 Você ultrapassou seu orçamento de Alimentação em R$ 50."`

O alerta não bloqueia o lançamento — apenas informa.

---

### 4. Gerenciar limites existentes

Na seção de gerenciamento, cada limite salvo exibe:

```
Alimentação    R$ 800/mês    [Editar]  [Excluir]
Lazer          R$ 300/mês    [Editar]  [Excluir]
Transporte     R$ 200/mês    [Editar]  [Excluir]
```

- **Editar**: altera o valor do limite (não apaga histórico de gastos)
- **Excluir**: remove o limite da categoria (gastos continuam existindo, mas sem controle)

---

### 5. Troca de mês

Os limites são **permanentes por padrão** — se o usuário define R$800 para Alimentação, esse limite vale em janeiro, fevereiro, março, etc. O progresso zera automaticamente com a virada do mês.

O usuário pode, opcionalmente, criar um **limite específico para um mês** ao marcar "Apenas este mês" no formulário. Isso é útil para meses atípicos (férias, natal, etc.).

---

## Banco de Dados

### Novo model: `Budget`

```prisma
model Budget {
  id          String   @id @default(cuid())
  category    String                          // "Alimentação", "Lazer", etc.
  limit       Float                           // 800.00
  monthKey    String?                         // null = recorrente | "2026-12" = específico
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, category, monthKey])     // evita limite duplicado por categoria/mês
}
```

### Relação no model `User`

```prisma
budgets  Budget[]
```

### Campos calculados (sem banco — calculados em runtime)

Para exibir o progresso, o sistema cruza `Budget` com `Expense`:

```ts
// Para cada Budget do usuário:
const spent = expenses
  .filter(e => e.category === budget.category && e.monthId === currentMonthKey)
  .reduce((sum, e) => sum + e.value, 0)

const percentage = (spent / budget.limit) * 100
const remaining = budget.limit - spent
```

Nenhum campo derivado é persistido — tudo calculado na hora da renderização.

---

## Arquitetura de Dados — Resolução de Limite Ativo

Para cada categoria, o limite ativo de um dado mês é determinado assim:

```
1. Existe Budget com category=X e monthKey="YYYY-MM"?  → usa esse (específico)
2. Existe Budget com category=X e monthKey=null?        → usa esse (recorrente)
3. Nenhum dos dois?                                    → sem limite para essa categoria
```

Isso permite que o usuário tenha limites recorrentes com exceções pontuais.

---

## Componentes

### `app/(protected)/orcamento/page.tsx` (novo)

Página principal — carrega os budgets do usuário e os gastos do mês atual, passa tudo para o componente cliente.

### `components/orcamento/BudgetManager.tsx` (novo)

Componente cliente que gerencia toda a UI da página:
- Lista de progresso por categoria
- Formulário de criação/edição
- Confirmação de exclusão
- Toast de feedback

### `components/orcamento/BudgetProgressCard.tsx` (novo)

Card individual de categoria com barra de progresso, valores e estado visual por faixa de uso.

### `components/orcamento/BudgetForm.tsx` (novo)

Formulário inline para criar ou editar um limite:
- Select de categoria (excluindo categorias que já têm limite recorrente)
- Input de valor
- Checkbox "Apenas este mês"

---

## Actions

### `lib/actions/budget.ts` (novo)

```ts
// Buscar todos os budgets do usuário + progresso calculado do mês
getBudgets(userId, currentMonthKey)
  → Budget[] com campo calculado: spent, percentage, remaining

// Criar ou atualizar um limite
upsertBudget(userId, category, limit, monthKey?)
  → Budget criado/atualizado

// Excluir um limite
deleteBudget(id, userId)
  → confirma que pertence ao usuário antes de deletar
```

### Modificação em `lib/actions/expenses.ts`

Após salvar um gasto, verificar se a categoria tem limite ativo:

```ts
// Após criar o expense:
const activeBudget = await getActiveBudget(userId, category, monthKey)
if (activeBudget) {
  const totalSpent = await calcCategorySpent(userId, category, monthKey)
  const percentage = totalSpent / activeBudget.limit

  return {
    success: true,
    budgetAlert: percentage >= 0.8 ? {
      category,
      percentage: Math.round(percentage * 100),
      over: percentage >= 1,
      overAmount: percentage >= 1 ? totalSpent - activeBudget.limit : null
    } : null
  }
}
```

---

## Conquistas

### Novas conquistas permanentes

| Chave | Título | Descrição | Raridade | XP |
|-------|--------|-----------|----------|----|
| `budget_first` | Planejador | Definiu seu primeiro limite de orçamento | Common | 25 |
| `budget_perfect_month` | Mês Controlado | Encerrou um mês inteiro dentro de todos os limites | Rare | 150 |
| `budget_perfect_3` | Disciplina Financeira | Três meses consecutivos dentro de todos os limites | Epic | 400 |
| `budget_five_categories` | Arquiteto do Orçamento | Definiu limites em 5 categorias diferentes | Common | 75 |
| `budget_under_50` | Frugal | Usou menos de 50% do orçamento em uma categoria num mês | Common | 50 |

### Verificação de conquistas

As conquistas de orçamento são verificadas:
- `budget_first`: ao criar o primeiro Budget
- `budget_perfect_month`: na virada do mês (ou quando o usuário abre a página em um novo mês)
- `budget_perfect_3`: acumulado ao longo dos meses
- `budget_five_categories`: ao atingir 5 budgets únicos
- `budget_under_50`: ao calcular progresso no fim do mês

---

## Integração com Desafios Semanais

Adicionar ao pool de desafios:

| Template | Tipo | Meta | XP |
|---|---|---|---|
| `budget_week_control` | weekly | Não ultrapassar nenhum limite de orçamento na semana | 100 XP |
| `budget_stay_green` | weekly | Manter todas as categorias abaixo de 80% ao final da semana | 80 XP |

---

## Considerações de UX

### Acesso exclusivo pelo Perfil — por que?

A decisão de colocar o acesso apenas no Perfil é deliberada:

1. **Sinaliza intenção** — Configurar um orçamento é um ato consciente, não algo que se faz impulsivamente. Esconder atrás de um menu de configurações cria a fricção saudável para que o usuário pense antes de definir limites.

2. **Reduz poluição visual** — Não adicionar mais uma aba na `BottomNav` mantém o fluxo principal limpo. O usuário que quer orçamento encontra; quem não precisa não vê.

3. **Diferencia perfis de uso** — Usuários avançados (que querem controle detalhado) usam orçamento. Usuários iniciantes (que ainda estão no hábito de guardar) não são sobrecarregados.

### Categorias sincronizadas

As categorias de `Budget` são exatamente as mesmas de `Expense`. Se o app tiver uma categoria "Academia", ela aparece em ambos os lugares, sem necessidade de mapeamento adicional.

### Mês sem dados não é erro

Se o usuário definiu um orçamento mas não registrou nenhum gasto naquela categoria ainda, exibir:
```
🟢 Lazer — R$ 0 de R$ 300 · 0% usado
```
Isso é positivo — mostra que ainda há todo o orçamento disponível.

### Limite excedido não bloqueia lançamentos

Nunca impedir o registro de gastos. O sistema é informativo, não restritivo. Bloquear lançamentos geraria frustração e abandono da feature.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `prisma/schema.prisma` | Modificar | Adicionar model `Budget` + relação em `User` |
| `lib/actions/budget.ts` | Criar | Server actions de CRUD de orçamentos |
| `lib/actions/expenses.ts` | Modificar | Retornar `budgetAlert` após salvar gasto |
| `app/(protected)/orcamento/page.tsx` | Criar | Página principal de orçamentos |
| `components/orcamento/BudgetManager.tsx` | Criar | Componente cliente principal |
| `components/orcamento/BudgetProgressCard.tsx` | Criar | Card de progresso por categoria |
| `components/orcamento/BudgetForm.tsx` | Criar | Formulário de criação/edição de limite |
| `app/(protected)/perfil/page.tsx` | Modificar | Adicionar botão "Orçamento Mensal" |
| `lib/achievements.ts` | Modificar | Adicionar 5 novas conquistas de orçamento |
| `lib/gamification.ts` | Modificar | Adicionar 2 novos templates de desafio semanal |
