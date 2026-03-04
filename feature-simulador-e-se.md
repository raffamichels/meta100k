# Feature: Simulador de "E Se?"

## Visão Geral

O **Simulador de "E Se?"** é uma ferramenta interativa na página de Meta que permite ao usuário explorar cenários hipotéticos e ver instantaneamente como cada mudança impactaria a data de conclusão da meta.

Com sliders e campos numéricos, o usuário manipula variáveis como "e se eu guardar R$200 a mais por mês?" ou "e se meu salário crescer 15%?" e vê a nova projeção recalcular em tempo real — sem alterar nenhum dado real do banco.

O simulador é uma ferramenta de **motivação por visualização**: ao ver que uma mudança pequena e concreta encurta a meta em meses, o usuário tem um impulso prático para agir.

---

## Princípio de Design

> "Ver o futuro muda o presente."

O simulador não julga o passado do usuário. Ele parte dos dados reais atuais e projeta o que é possível. Cada cenário deve ser apresentado com otimismo: não "você está atrasado", mas "aqui está o que uma pequena mudança pode fazer".

O design deve ser **imediato**: qualquer ajuste no slider reage em milissegundos, sem botão "calcular". A projeção atualiza enquanto o usuário arrasta.

---

## Onde Fica

### Localização na página Meta (`/meta`)

O simulador é adicionado como uma nova seção **abaixo** das seções existentes de Meta, sem substituir nada.

```
[Seção: Total salvo + progresso]        ← já existe
[Seção: Análise financeira]             ← já existe
[Seção: Configurar meta]               ← já existe
─────────────────────────────────────
[Seção: ✨ Simulador "E Se?"]           ← novo
```

No desktop (grid 2 colunas), o simulador ocupa **largura total** (as duas colunas), pois precisa de espaço horizontal para os controles e a projeção lado a lado.

---

## Estrutura Visual

```
┌───────────────────────────────────────────────────────────────────┐
│  ✨ Simulador "E Se?"                                              │
│  Ajuste os controles e veja como muda sua projeção em tempo real  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  CONTROLES                          RESULTADO                      │
│  ─────────                          ─────────                      │
│  💰 Poupança mensal extra           Meta atual: set/2028           │
│  + R$ 0  [───────●──────────]       ↓                             │
│         +R$0  até +R$2.000          Com seus ajustes:             │
│                                                                    │
│  ✂️ Redução de gastos               ┌────────────────────────┐    │
│  0%  [●──────────────────]          │  📅 mai/2027           │    │
│      0% até 50%                     │  4 meses mais cedo     │    │
│                                     │  💰 R$ 2.340/mês médio │    │
│  📈 Crescimento de renda             └────────────────────────┘    │
│  0%  [●──────────────────]                                        │
│      0% até 100%                    Você vai economizar            │
│                                     R$ 18.720 em 8 meses          │
└───────────────────────────────────────────────────────────────────┘
```

No mobile, os controles ficam empilhados acima e o resultado aparece abaixo, com destaque em card grande.

---

## Variáveis Simuladas

### Controle 1 — Poupança mensal extra

**Tipo:** Slider + input numérico
**Range:** R$0 a R$2.000
**Step:** R$50
**Default:** R$0
**Label:** "Quanto a mais por mês você consegue guardar?"

```
+ R$ 0   [───────●──────────────────]   + R$ 2.000
```

**Impacto no cálculo:**
```ts
novaMediaMensal = mediaAtual + extraMensal
```

---

### Controle 2 — Redução percentual nos gastos

**Tipo:** Slider
**Range:** 0% a 50%
**Step:** 5%
**Default:** 0%
**Label:** "Em quanto você reduziria seus gastos mensais?"

```
0%   [●──────────────────]   50%
```

**Impacto no cálculo:**
```ts
// A redução de gastos libera dinheiro que pode virar poupança
gastoMedioAtual = mediaGastosMensais
economiaExtra = gastoMedioAtual * (reducaoPercent / 100)
novaMediaMensal += economiaExtra
```

> A lógica assume que a redução de gastos converte-se integralmente em poupança. Isso é uma simplificação favorável à motivação — se o usuário reduz R$200 em gastos, o simulador assume que esses R$200 vão para a meta.

---

### Controle 3 — Crescimento de renda

**Tipo:** Slider
**Range:** 0% a 100%
**Step:** 5%
**Default:** 0%
**Label:** "E se sua renda crescer?"

```
0%   [●──────────────────]   100%
```

Com sub-label dinâmica:
```
"Seu salário médio de R$ 4.200 → R$ 4.830 (+15%)"
```

**Impacto no cálculo:**
```ts
// Assume que 50% do aumento de renda vira poupança (taxa conservadora padrão)
aumentoRenda = salarioMedio * (crescimentoPercent / 100)
poupancaDoAumento = aumentoRenda * 0.5
novaMediaMensal += poupancaDoAumento
```

A taxa de 50% é exibida como informação:
> "Simulando que 50% do aumento vira poupança"

---

### Controle 4 — Prazo alvo (inverso)

**Tipo:** Date picker ou slider de meses
**Funcionamento:** Inverso dos demais — o usuário define **quando quer atingir a meta** e o simulador calcula **quanto precisa guardar por mês**.

```
Quero atingir a meta em: [ dezembro/2026 ▼ ]

Para isso, você precisaria guardar:
┌─────────────────────────────┐
│  R$ 3.847 / mês             │
│  (+R$ 1.647 vs hoje)        │
└─────────────────────────────┘
```

Este controle é **exclusivo** — ao interagir com ele, os outros três controles ficam desabilitados (são modos diferentes de usar o simulador).

---

## Lógica de Cálculo

### Dados de entrada (reais, do banco)

```ts
const baseInputs = {
  totalSaved: calcTotalSaved(data),          // quanto já tem
  goal: user.goal,                            // meta total
  remaining: goal - totalSaved,              // quanto falta
  avgMonthlySavings: calcAvgMonthlySavings(data), // média atual
  avgSalary: calcAvgSalary(data),            // salário médio atual
  avgMonthlyExpenses: calcAvgMonthlyExpenses(data) // gasto médio atual
}
```

### Cálculo da projeção simulada

```ts
function calcSimulatedProjection(inputs, adjustments) {
  const {
    totalSaved, goal, remaining,
    avgMonthlySavings, avgSalary, avgMonthlyExpenses
  } = inputs

  const {
    extraSavings,       // slider 1: R$ a mais por mês
    expenseReduction,   // slider 2: % de redução nos gastos
    incomeGrowth        // slider 3: % de crescimento de renda
  } = adjustments

  // Economia dos gastos reduzidos
  const savingsFromExpenses = avgMonthlyExpenses * expenseReduction

  // Poupança adicional do aumento de renda (50% do aumento)
  const salaryIncrease = avgSalary * incomeGrowth
  const savingsFromIncome = salaryIncrease * 0.5

  // Nova média mensal
  const newMonthlyAvg = avgMonthlySavings + extraSavings + savingsFromExpenses + savingsFromIncome

  // Projeção
  if (newMonthlyAvg <= 0) return { possible: false }

  const monthsToGoal = Math.ceil(remaining / newMonthlyAvg)
  const targetDate = addMonths(new Date(), monthsToGoal)

  // Comparação
  const currentMonthsToGoal = avgMonthlySavings > 0
    ? Math.ceil(remaining / avgMonthlySavings)
    : null

  const monthsSaved = currentMonthsToGoal !== null
    ? currentMonthsToGoal - monthsToGoal
    : null

  return {
    possible: true,
    newMonthlyAvg,
    monthsToGoal,
    targetDate,
    monthsSaved,
    moneySaved: monthsSaved !== null ? monthsSaved * newMonthlyAvg : null
  }
}
```

### Cálculo inverso (controle 4)

```ts
function calcRequiredMonthlySavings(remaining, targetDate) {
  const today = new Date()
  const months = differenceInMonths(targetDate, today)

  if (months <= 0) return null

  const required = Math.ceil(remaining / months)
  const difference = required - avgMonthlySavings

  return { required, difference, months }
}
```

---

## Painel de Resultado

### Estado padrão (todos os sliders em zero)

```
┌────────────────────────────────────┐
│  Cenário atual                     │
│                                    │
│  📅 set/2028                       │
│  Guardando R$ 1.200/mês em média   │
│                                    │
│  ← Ajuste os controles ao lado    │
│     para explorar cenários         │
└────────────────────────────────────┘
```

### Estado com ajustes

```
┌────────────────────────────────────┐
│  Com seus ajustes                  │
│                                    │
│  📅 jan/2027                       │
│  20 meses mais cedo 🎉             │
│                                    │
│  💰 R$ 2.150/mês médio             │
│  (+ R$ 950 vs cenário atual)       │
│                                    │
│  Você economizaria                 │
│  R$ 43.000 em juros e tempo        │
└────────────────────────────────────┘
```

### Estado impossível (meta nunca atingida)

Só ocorre se a média simulada for ≤ 0:
```
⚠️ Com esses números, a meta não seria
   atingida no prazo calculável.
   Tente aumentar a poupança extra.
```

### Estado "meta já atingida"

Se `totalSaved >= goal`:
```
🏆 Você já atingiu sua meta!
   O simulador está disponível para
   explorar uma nova meta.
```

---

## Componentes

### `components/meta/Simulator.tsx` (novo)

Componente cliente completo do simulador. Recebe os dados reais como props e gerencia o estado dos sliders localmente (sem servidor).

Estrutura interna:

```tsx
// Estado local — nenhuma chamada ao banco
const [extra, setExtra] = useState(0)
const [expenseReduction, setExpenseReduction] = useState(0)
const [incomeGrowth, setIncomeGrowth] = useState(0)
const [targetDate, setTargetDate] = useState<Date | null>(null)
const [mode, setMode] = useState<'forward' | 'inverse'>('forward')

// Resultado calculado em tempo real
const result = useMemo(() => {
  if (mode === 'inverse' && targetDate) {
    return calcRequiredMonthlySavings(remaining, targetDate)
  }
  return calcSimulatedProjection(baseInputs, { extra, expenseReduction, incomeGrowth })
}, [extra, expenseReduction, incomeGrowth, targetDate, mode])
```

### `components/meta/SimulatorSlider.tsx` (novo)

Slider reutilizável com:
- Label descritiva
- Valor atual exibido de forma legível (R$XXX ou XX%)
- Sub-label dinâmica com o impacto calculado
- Estilo inline consistente com o resto do app

### `components/meta/SimulatorResult.tsx` (novo)

Painel de resultado com animação de troca de valor ao mudar o estado:
- Data de conclusão em destaque
- Meses economizados
- Valor médio mensal necessário
- Diferença vs. cenário atual

---

## Sem Mudanças no Banco

O simulador é **100% client-side após carregamento**. Não faz nenhuma chamada adicional ao servidor durante a interação.

Os dados reais (médias, saldo atual, meta) são carregados uma única vez quando a página `/meta` abre — eles já são carregados pela página existente. O simulador apenas recebe esses valores como props.

```tsx
// Em app/(protected)/meta/page.tsx (já existe, apenas adicionar):
<Simulator
  totalSaved={totalSaved}
  goal={user.goal}
  avgMonthlySavings={avgMonthlySavings}
  avgSalary={avgSalary}
  avgMonthlyExpenses={avgMonthlyExpenses}
/>
```

---

## Conquistas

### Novas conquistas permanentes

| Chave | Título | Descrição | Raridade | XP |
|-------|--------|-----------|----------|----|
| `simulator_first` | Visionário | Usou o Simulador "E Se?" pela primeira vez | Common | 20 |
| `simulator_10` | Estrategista | Explorou 10 cenários diferentes no simulador | Rare | 80 |
| `simulator_achieved` | Profecia Cumprida | A data real de conclusão ficou dentro de 2 meses da projeção simulada | Legendary | 500 |

A conquista `simulator_achieved` é verificada automaticamente quando o usuário atinge a meta — comparando a data real com a última projeção simulada salva.

### Salvar última projeção simulada

Para habilitar `simulator_achieved`, salvar a última projeção simulada no `localStorage`:

```
meta100k_last_simulation = { targetDate: "2027-01", savedAt: "2026-03-04" }
```

Não é necessário banco — `localStorage` é suficiente para essa comparação.

---

## Cenários Pré-definidos (Atalhos)

Abaixo dos sliders, exibir 3 botões de cenário rápido:

```
[ ☕ Cortar café fora (+R$200/mês) ]
[ 🏋️ Cancelar assinaturas (+R$150/mês) ]
[ 📈 Promoção de 20% (+20% renda) ]
```

Ao clicar, os sliders se ajustam automaticamente para os valores do cenário. O usuário pode refinar a partir daí.

Os cenários são sugestões fixas, não personalizadas — simples e diretas.

---

## Considerações de UX

### Tempo real sem "calcular"

Nenhum botão de confirmação. O resultado atualiza a cada movimento do slider. Isso cria a sensação de "brincar" com os números — reduz a seriedade e aumenta o engajamento.

### Valores realistas nos limites

Os limites dos sliders são calibrados para valores realistas no contexto BR:
- Extra mensal: até R$2.000 (uma renda extra razoável)
- Redução de gastos: até 50% (corte agressivo mas possível)
- Crescimento de renda: até 100% (dobrar o salário — limite otimista mas não absurdo)

### Dados reais como âncora

O simulador parte sempre dos dados reais do usuário, não de médias genéricas. Um usuário que ganha R$3.000 e poupa R$500 vê projeções baseadas nesses valores — não em médias nacionais que nada têm a ver com sua realidade.

### Sem julgamento

O simulador nunca diz "você deveria poupar mais". Ele mostra o que acontece *se* o usuário decidir mudar. A agência é sempre do usuário.

### Resultado em destaque no mobile

No mobile, o resultado (data de conclusão) aparece no topo da seção, acima dos sliders. Isso garante que o usuário veja o impacto imediatamente, mesmo sem rolar a página.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `components/meta/Simulator.tsx` | Criar | Componente principal do simulador |
| `components/meta/SimulatorSlider.tsx` | Criar | Slider reutilizável com label e sub-label |
| `components/meta/SimulatorResult.tsx` | Criar | Painel de resultado com comparação |
| `app/(protected)/meta/page.tsx` | Modificar | Incluir `<Simulator>` com props dos dados reais |
| `lib/calculations.ts` | Modificar | Adicionar `calcAvgMonthlyExpenses()` e `calcSimulatedProjection()` |
| `lib/achievements.ts` | Modificar | Adicionar 3 novas conquistas do simulador |
