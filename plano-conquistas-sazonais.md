# Plano de Implementação — Conquistas Sazonais

> Elaborado em 03/03/2026. Baseado na análise do código existente em `lib/achievements.ts`, `lib/gamification.ts`, `lib/actions/gamification.ts` e `app/(protected)/conquistas/page.tsx`.

---

## 1. Visão Geral

### O que é?
Conquistas que só podem ser desbloqueadas dentro de uma **janela de tempo específica** do ano (ex: somente em dezembro, somente no dia 31/10, somente na semana do Carnaval). Criam urgência e FOMO real — o usuário que não agiu perdeu aquela edição para sempre.

### Por que é especial?
Diferente das conquistas atuais (que dependem apenas de valores acumulados e streak), as sazonais dependem de **quando** o usuário age. Isso muda o comportamento: o usuário volta ao app em datas comemorativas mesmo que já tenha atingido suas metas.

---

## 2. Decisão Arquitetural Central — Escopo por Ano

### O problema
O modelo `UserAchievement` usa `@@unique([userId, key])`. Sem o ano na chave, a conquista `carnaval_imune` de 2026 e a de 2027 seriam a **mesma entrada no banco** — o usuário desbloquearia uma vez e nunca mais poderia ganhar novamente nas edições futuras, além de impossibilitar a criação de variações temáticas entre anos.

### A solução — Chaves com sufixo de ano
Todas as conquistas sazonais têm o ano embutido na `key`:

```
carnaval_imune_2026   ← edição 2026
carnaval_imune_2027   ← edição 2027 (pode ter condição diferente no futuro)
```

Isso garante que:
- Cada ano gera uma conquista **distinta e independente** no banco
- É possível **variar a temática ou dificuldade** de um ano para o outro sem afetar dados históricos
- O histórico do usuário mostra **em qual ano** cada edição sazonal foi conquistada
- Futuramente, é possível criar `halloween_poupador_2027` com uma condição diferente de `halloween_poupador_2026`

### Geração dinâmica via função
Em vez de um array estático, as conquistas sazonais são geradas por uma função que recebe o ano como parâmetro:

```typescript
// lib/achievements.ts
export function generateSeasonalAchievements(year: number): SeasonalAchievementDef[]
```

A função retorna os 55 templates com `key` já estampada com o ano (ex: `ano_novo_2026`). O `checkSeasonalAchievements` chama essa função passando o ano corrente, garantindo que só conquistas do ano atual sejam avaliadas.

### Título e descrição com o ano
Cada conquista sazonal exibe o ano na interface para contextualizar:

- **`title`**: permanece atemporal (ex: `"Carnaval Imune"`)
- **`seasonLabel`**: inclui o ano (ex: `"Carnaval 2026"`)
- **Descrição**: pode referenciar o ano quando fizer sentido (ex: `"Fevereiro de 2026 sem uma despesa sequer durante os 4 dias de Carnaval."`)
- **UI**: badge `📅 2026` aparece discretamente no card, abaixo do `🗓️ SAZONAL`

---

## 3. Tipo `SeasonalAchievementDef` — Estrutura Completa

```typescript
// Adicionar em lib/achievements.ts, após ACHIEVEMENT_MAP

export interface SeasonalWindow {
  monthStart: number;   // 1–12
  dayStart: number;     // 1–31
  monthEnd: number;     // 1–12
  dayEnd: number;       // 1–31
  crossYear?: boolean;  // true para janelas como 28/12 – 02/01
  floating?: boolean;   // true para datas calculadas (Páscoa, Carnaval, Black Friday)
}

export interface SeasonalAchievementDef extends AchievementDef {
  seasonal: true;
  year: number;                  // ano ao qual esta instância pertence (ex: 2026)
  window: SeasonalWindow;
  seasonLabel: string;           // ex: "Carnaval 2026", "Black Friday 2026"
  conditionType: SeasonalConditionType;
  conditionParam?: number;       // valor numérico usado na condição
  requiresActiveWindow?: boolean; // se true: só verifica enquanto a janela estiver aberta
}

export type SeasonalConditionType =
  | "saving_on_date"                 // ≥1 saving entry numa data exata
  | "saving_on_any_date_in_window"   // ≥1 saving entry em qualquer dia da janela
  | "saving_days_in_window"          // dias distintos com saving ≥ conditionParam
  | "saving_entries_in_window"       // count de entries ≥ conditionParam
  | "savings_sum_in_window"          // soma das savings na janela ≥ conditionParam
  | "savings_sum_month"              // soma das savings do mês ≥ conditionParam
  | "savings_rate_month"             // savings/salary no mês ≥ conditionParam
  | "savings_all_days_in_month"      // saving entry em todos os dias do mês
  | "savings_all_days_in_two_months" // saving entry em todos os dias de 2 meses
  | "savings_sum_in_season"          // savings ≥ conditionParam em cada um dos 3 meses da estação
  | "expenses_zero_on_date"          // zero despesas numa data exata
  | "expenses_reduced_vs_prev_month" // expenses < expenses_mes_anterior * conditionParam
  | "expenses_capped_in_window"      // soma expenses na janela ≤ média_semanal * conditionParam
  | "expense_max_in_month"           // nenhuma despesa > conditionParam no mês
  | "extra_in_window"                // ≥1 extra ≥ conditionParam na janela
  | "extra_count_in_window"          // count de extras ≥ conditionParam na janela
  | "streak_in_window"               // streak ≥ conditionParam durante o mês
  | "salary_and_saving_in_window"    // salary > 0 e ≥1 saving entry na janela
  | "months_with_savings_count"      // count de meses com savings > 0 ≥ conditionParam
  | "all_months_in_quarter"          // todos os 3 meses de um quartil com savings > 0
  | "all_months_in_year"             // todos os 12 meses do ano com savings > 0
  | "total_saved_threshold"          // totalSaved ≥ conditionParam
  | "saving_on_friday_13"            // ≥1 saving entry em qualquer sexta-feira 13
  | "saving_on_leap_day"             // ≥1 saving entry no dia 29/02
```

---

## 4. Função `generateSeasonalAchievements(year)`

A função recebe o ano e retorna os templates com `key` e `seasonLabel` estampados:

```typescript
export function generateSeasonalAchievements(year: number): SeasonalAchievementDef[] {
  // Helper interno: estampa o ano na key e no seasonLabel
  const stamp = (template: Omit<SeasonalAchievementDef, "year" | "key"> & { keyBase: string }): SeasonalAchievementDef => ({
    ...template,
    year,
    key: `${template.keyBase}_${year}`,
    seasonLabel: `${template.seasonLabel} ${year}`,
    seasonal: true,
  });

  return [
    stamp({ keyBase: "ano_novo", seasonLabel: "Janeiro", ... }),
    stamp({ keyBase: "virada_disciplinada", seasonLabel: "Janeiro", ... }),
    // ... todos os 55 templates
  ];
}

// Mapa gerado sob demanda (usado no check e na UI)
export function getSeasonalAchievementMap(year: number): Map<string, SeasonalAchievementDef> {
  return new Map(generateSeasonalAchievements(year).map((a) => [a.key, a]));
}
```

---

## 5. Lista Completa de Conquistas Sazonais (55 templates)

> As chaves abaixo são os **templates base** (`keyBase`). Na geração, viram `ano_novo_2026`, `carnaval_imune_2026`, etc.
> Formato: `keyBase` | Ícone | Título | Raridade | XP | Janela | Condição

---

### 🎆 Janeiro / Ano Novo

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `ano_novo` | 🎆 | Ano Novo, Conta Nova | Comum | 30 | 01/01 | ≥1 saving entry no dia 01/01 |
| `virada_disciplinada` | 🌅 | Virada Disciplinada | Raro | 80 | 01/01 – 07/01 | saving entries em ≥7 dias distintos nessa janela |
| `resolucao_cumprida` | 📋 | Resolução Cumprida | Raro | 60 | 01/01 – 07/01 | salary > 0 em janeiro + ≥1 saving entry antes do dia 07 |
| `janeiro_milionario` | 💰 | Janeiro Milionário | Épico | 150 | 01/01 – 31/01 | soma savings de janeiro ≥ R$2.000 |
| `reveillon_de_campeao` | 🥂 | Réveillon de Campeão | Comum | 25 | 28/12 – 02/01 (cross-year) | ≥1 saving entry nesse período |

---

### 🎭 Carnaval / Fevereiro

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `amor_pela_meta` | 💘 | Amor pela Meta | Raro | 100 | 01/02 – 14/02 | saving entries em ≥10 dias distintos nessa janela |
| `carnaval_imune` | 🎭 | Carnaval Imune | Épico | 200 | Sáb–Qua do Carnaval (flutuante) | zero despesas nos 4 dias de Carnaval |
| `carnaval_poupador` | 🥁 | Poupador do Carnaval | Comum | 40 | Sáb–Qua do Carnaval (flutuante) | ≥1 saving entry nos dias de Carnaval |
| `fevereiro_completo` | 📅 | Fevereiro sem Falhas | Épico | 300 | 01/02 – fim de fevereiro | saving entry em todos os dias do mês |
| `sao_valentim_consciente` | 💝 | São Valentim Consciente | Comum | 20 | 01/02 – 14/02 | ≥1 extra entry em fevereiro |

---

### 🌷 Março

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `dia_das_mulheres` | 👩 | Dia das Mulheres | Comum | 25 | 08/03 | ≥1 saving entry no dia 08/03 |
| `resistencia_total` | 🛡️ | Resistência Total | Raro | 80 | 15/03 (Dia do Consumidor) | zero despesas no dia 15/03 |
| `marco_renovado` | 🌷 | Março Renovado | Raro | 100 | 01/03 – 31/03 | savings/salary ≥ 20% em março |
| `pascoa_financeira` | 🐣 | Páscoa Financeira | Raro | 80 | Semana Santa (flutuante) | ≥5 saving entries nos 7 dias antes da Páscoa |

---

### 🐣 Abril

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `primeiro_de_abril_real` | 🤡 | Não É Mentira! | Comum | 20 | 01/04 | ≥1 saving entry no dia 01/04 |
| `q1_sobrevivente` | 🏅 | Sobrevivente do Q1 | Raro | 120 | 01/04 – 07/04 | savings > 0 nos 3 meses do Q1 (jan, fev, mar) |
| `abril_produtivo` | 🌸 | Abril Produtivo | Raro | 90 | 01/04 – 30/04 | ≥15 saving entries em abril |

---

### 🌻 Maio / Dia do Trabalhador

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `primeiro_de_maio` | ✊ | Dia do Trabalhador Poupador | Comum | 25 | 01/05 | ≥1 saving entry no dia 01/05 |
| `dia_das_maes_consciente` | 💐 | Dia das Mães com Meta | Raro | 70 | 2º domingo de maio ±3 dias (flutuante) | ≥3 saving entries nessa semana |
| `maio_forte` | 💪 | Maio Forte | Raro | 100 | 01/05 – 31/05 | soma savings de maio ≥ R$1.500 |
| `maio_enxuto` | ✂️ | Maio Enxuto | Épico | 180 | 01/05 – 31/05 | nenhuma despesa individual > R$200 em maio |

---

### ❤️ Junho / Festa Junina

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `dia_dos_namorados_meta` | ❤️ | Casal que Poupa Junto... | Comum | 25 | 12/06 | ≥1 saving entry no dia 12/06 |
| `festa_junina_parcimoniosa` | 🎉 | Festa Junina Econômica | Raro | 70 | 23/06 – 25/06 | ≥1 saving entry em cada um dos 3 dias |
| `junho_arrochado` | 🎯 | Junho Arrochado | Épico | 200 | 01/06 – 30/06 | expenses de junho < expenses de maio × 0,90 |
| `solsticio_de_poupanca` | ☀️ | Solstício de Poupança | Comum | 30 | 21/06 | ≥1 saving entry no dia 21/06 |
| `inverno_financeiro` | ❄️ | Inverno Financeiro | Épico | 250 | 01/06 – 31/08 | savings ≥ R$500 em jun, jul e ago individualmente |

---

### 🏖️ Julho / Férias

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `ferias_disciplinadas` | 🏖️ | Férias Disciplinadas | Raro | 100 | 01/07 – 31/07 | savings/salary ≥ 15% em julho |
| `julho_resistente` | 🌊 | Julho Resistente | Épico | 180 | 01/07 – 31/07 | ≥20 dias distintos com saving entry em julho |
| `q2_consistente` | 🏅 | Consistência no Q2 | Raro | 120 | 01/07 – 07/07 | savings > 0 nos 3 meses do Q2 (abr, mai, jun) |
| `meio_de_ano` | 🗓️ | Metade do Ano | Lendário | 400 | 01/07 – 15/07 | savings > 0 em todos os meses de jan–jun do mesmo ano |

---

### 👨‍👧 Agosto / Dia dos Pais

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `dia_dos_pais_planejado` | 👨‍👧 | Dia dos Pais Planejado | Raro | 70 | 2º domingo de agosto ±3 dias (flutuante) | ≥3 saving entries nessa semana |
| `agosto_em_chamas` | 🔥 | Agosto em Chamas | Épico | 200 | 01/08 – 31/08 | streak ≥ 25 dias durante agosto |
| `agosto_milionario` | 💎 | Agosto Milionário | Épico | 180 | 01/08 – 31/08 | soma savings de agosto ≥ R$2.500 |
| `renda_extra_agosto` | 💼 | Extra de Agosto | Raro | 80 | 01/08 – 31/08 | ≥2 extra entries em agosto |

---

### 🌺 Setembro / Independência

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `independencia_financeira` | 🇧🇷 | Independência Financeira | Comum | 30 | 07/09 | ≥1 saving entry no dia 07/09 |
| `primavera_renovada` | 🌸 | Primavera Renovada | Raro | 70 | 01/09 – 07/09 | salary > 0 e ≥1 saving entry em setembro antes do dia 07 |
| `setembro_verde` | 🌿 | Setembro Verde | Épico | 200 | 01/09 – 30/09 | savings/salary ≥ 25% em setembro |
| `q3_firme` | 🏅 | Q3 Inabalável | Raro | 120 | 01/10 – 07/10 | savings > 0 nos 3 meses do Q3 (jul, ago, set) |
| `primavera_florida` | 🌺 | Primavera Florescendo | Épico | 250 | 01/09 – 30/11 | savings ≥ R$500 em set, out e nov individualmente |

---

### 🎃 Outubro / Halloween

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `outubro_assustador` | 🎃 | Outubro Assustador | Raro | 130 | 01/10 – 31/10 | expenses de outubro < expenses de setembro × 0,87 |
| `crianca_responsavel` | 🧒 | Criança Responsável | Raro | 60 | 12/10 (Dia das Crianças) | zero despesas no dia 12/10 |
| `outubro_mistico` | 🔮 | Outubro Místico | Raro | 100 | 01/10 – 31/10 | ≥13 saving entries em outubro |
| `halloween_poupador` | 👻 | Halloween Poupador | Comum | 30 | 31/10 (Dia Mundial da Poupança) | ≥1 saving entry no dia 31/10 |
| `semana_do_horror` | 🕷️ | Semana do Horror | Épico | 180 | 25/10 – 31/10 | saving entry em todos os dias 25–31/10 |

---

### 🛒 Novembro / Black Friday

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `proclamacao_poupadora` | 🇧🇷 | Proclamação Poupadora | Comum | 25 | 15/11 | ≥1 saving entry no dia 15/11 |
| `black_friday_survivor` | 🛒 | Black Friday Survivor | Épico | 250 | 25/11 – 30/11 | soma expenses na semana ≤ média semanal × 0,60 |
| `anti_black_friday` | 🛡️ | Anti Black Friday | Lendário | 500 | Última sexta de novembro (flutuante) | zero despesas na sexta da Black Friday |
| `novembro_reflexivo` | 📊 | Novembro Reflexivo | Raro | 150 | 01/11 – 30/11 | ≥10 meses do ano corrente com savings > 0 |
| `pre_natal_planejado` | 🎁 | Pré-Natal Planejado | Comum | 30 | 01/11 – 30/11 | ≥1 extra entry em novembro |

---

### 🎄 Dezembro / Natal

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `dezembro_disciplinado` | 🎁 | Dezembro Disciplinado | Raro | 120 | 01/12 – 31/12 | savings/salary ≥ 10% em dezembro |
| `natal_economico` | 🎄 | Natal Econômico | Épico | 200 | 01/12 – 26/12 | expenses de dezembro ≤ expenses de novembro |
| `ceia_de_campeao` | 🍽️ | Ceia de Campeão | Raro | 50 | 24/12 | ≥1 saving entry no dia 24/12 |
| `presente_de_si_mesmo` | 🎀 | O Melhor Presente | Raro | 80 | 01/12 – 25/12 | ≥1 extra ≥ R$500 em dezembro |
| `fechamento_de_ouro` | 🌟 | Fechamento de Ouro | Épico | 300 | 01/12 – 31/12 | savings/salary ≥ 30% em dezembro |
| `ano_virado_na_meta` | 👑 | Ano Virado na Meta | Lendário | 600 | 20/12 – 31/12 | totalSaved ≥ R$60.000 |
| `maratona_fim_de_ano` | 🏃 | Maratona de Fim de Ano | Lendário | 700 | 01/11 – 31/12 | saving entry em todos os dias de nov e dez |
| `q4_invencivel` | 🏆 | Q4 Invencível | Épico | 200 | 01/01 – 07/01 (ano seguinte) | savings > 0 nos 3 meses do Q4 (out, nov, dez) do ano anterior |

---

### 🏆 Milestones Anuais

| keyBase | Ícone | Título | Raridade | XP | Janela | Condição |
|---------|-------|--------|----------|----|--------|----------|
| `ano_perfeito` | ✨ | Ano Perfeito | Lendário | 1000 | 01/01 – 31/12 | savings > 0 em todos os 12 meses do ano |
| `verao_de_fogo` | ☀️ | Verão de Fogo | Épico | 250 | 01/12 – 28/02 (cross-year) | savings ≥ R$500 em dez, jan e fev individualmente |
| `ano_bissexto` | 📅 | Dia Raro | Lendário | 300 | 29/02 (só em anos bissextos) | ≥1 saving entry no dia 29/02 |
| `sexta_13_sortuda` | 🍀 | Sexta-13 da Sorte | Raro | 100 | Qualquer sexta-feira 13 do ano | ≥1 saving entry numa sexta-feira 13 |
| `inicio_de_trimestre` | 📆 | Início de Trimestre | Raro | 80 | 01/01, 01/04, 01/07 ou 01/10 ±2 dias | salary > 0 e saving entry nos primeiros 3 dias de qualquer trimestre |

---

**Total de conquistas sazonais por ano: 55**
**Total combinado com conquistas permanentes: 77**

---

## 6. Mudanças nos Arquivos

### 6.1 `lib/achievements.ts`

**Adicionar:**
- Interface `SeasonalWindow`
- Interface `SeasonalAchievementDef extends AchievementDef`
- Type `SeasonalConditionType`
- Função `generateSeasonalAchievements(year: number): SeasonalAchievementDef[]`
- Função helper `getSeasonalAchievementMap(year: number): Map<string, SeasonalAchievementDef>`

Tamanho estimado: **+500 linhas**

---

### 6.2 `lib/gamification.ts`

**Alterar `CheckContext`** — adicionar campo `today: string`:

```typescript
type CheckContext = {
  // ... campos existentes ...
  today: string; // YYYY-MM-DD — NOVO
};
```

**Adicionar helpers de data:**

```typescript
// Calcula a data da Páscoa (algoritmo de Meeus/Butcher)
function getEasterDate(year: number): Date

// Carnaval = 47 dias antes da Páscoa; retorna {start, end} dos 4 dias
function getCarnavalDates(year: number): { start: Date; end: Date }

// 2º domingo de maio (Dia das Mães BR)
function getMothersDayBR(year: number): Date

// 2º domingo de agosto (Dia dos Pais BR)
function getFathersDayBR(year: number): Date

// Última sexta de novembro (Black Friday)
function getBlackFridayDate(year: number): Date

// true se a data YYYY-MM-DD for uma sexta-feira 13
function isFriday13(dateStr: string): boolean

// true se a data estiver dentro da janela sazonal
// suporta cross-year (crossYear: true)
function isDateInSeasonalWindow(dateStr: string, window: SeasonalWindow, year: number): boolean
```

**Adicionar `checkSeasonalAchievements`:**

```typescript
export async function checkSeasonalAchievements(ctx: CheckContext): Promise<string[]> {
  const newKeys: string[] = [];
  const [year] = ctx.today.split("-").map(Number);
  const seasonalList = generateSeasonalAchievements(year);

  for (const ach of seasonalList) {
    if (ctx.unlockedKeys.has(ach.key)) continue;

    // 1. A janela está ativa hoje?
    const windowActive = isDateInSeasonalWindow(ctx.today, ach.window, year);
    if (!windowActive) continue;

    // 2. A condição foi atendida?
    const met = evaluateSeasonalCondition(ach, ctx, year);
    if (!met) continue;

    // 3. Desbloquear
    try {
      await prisma.userAchievement.create({ data: { userId: ctx.userId, key: ach.key } });
      ctx.unlockedKeys.add(ach.key);
      newKeys.push(ach.key);
      if (ach.xpReward > 0) {
        await prisma.user.update({ where: { id: ctx.userId }, data: { xp: { increment: ach.xpReward } } });
      }
    } catch { /* unique constraint: já existe */ }
  }

  return newKeys;
}

function evaluateSeasonalCondition(
  ach: SeasonalAchievementDef,
  ctx: CheckContext,
  year: number
): boolean {
  // switch/case por ach.conditionType
  // usa ctx.allSavingEntries, ctx.months, ctx.totalSaved, ctx.streak, etc.
}
```

Tamanho estimado: **+220 linhas**

---

### 6.3 `lib/actions/gamification.ts`

**Alterar `runGamificationCheck`** — passar `today` e chamar a nova função:

```typescript
// Após checkAndUnlockAchievements existente:
const seasonalNewKeys = await checkSeasonalAchievements({
  userId,
  totalSaved,
  streak,
  allSavingEntries,
  months: user.months,
  xp: freshUser?.xp ?? user.xp,
  level: currentLevel,
  unlockedKeys,
  today, // NOVO
});

const allNewAchievements = [...newAchievements, ...seasonalNewKeys];
// Retornar allNewAchievements no lugar de newAchievements
```

Tamanho estimado: **+12 linhas**

---

### 6.4 `app/(protected)/conquistas/page.tsx`

**Importar** `generateSeasonalAchievements` de `lib/achievements`.

---

#### Regra de Visibilidade — Revelação Progressiva

Conquistas sazonais de **meses futuros não são exibidas** na página. O usuário só descobre a existência de uma conquista sazonal quando o mês dela chega. Isso preserva o fator surpresa e evita que o usuário se sinta sobrecarregado vendo 55 conquistas bloqueadas de uma vez só.

**Regra de exibição por categoria de conquista:**

| Categoria | Exibida? |
|-----------|----------|
| Conquistas permanentes (as 22 existentes) | Sempre — todas visíveis, bloqueadas ou não |
| Sazonal cujo mês de início **já passou ou é o atual** | Sim — aparece na seção sazonal |
| Sazonal cujo mês de início **ainda não chegou** | Não — completamente oculta |

**Lógica de filtragem no servidor:**

```typescript
const today = new Date().toISOString().split("T")[0];
const [currentYear, currentMonth] = today.split("-").map(Number);

const allSeasonal = generateSeasonalAchievements(currentYear);

// Visível = mês de início da janela <= mês atual
// Para cross-year (ex: reveillon 28/12 → inicia em dezembro do ano anterior),
// a conquista gerada com o ano corrente só aparece quando monthStart <= currentMonth
const visibleSeasonal = allSeasonal.filter(
  (ach) => ach.window.monthStart <= currentMonth
);

// Conquistas sazonais do ano corrente já desbloqueadas pelo usuário
const unlockedSeasonalThisYear = user.achievements.filter(
  (a) => a.key.endsWith(`_${currentYear}`)
);
```

---

#### Contador de totais — `X de Y desbloqueadas`

O contador no header da página deve refletir apenas o universo **visível** para o usuário naquele momento:

```typescript
// Y = conquistas permanentes + sazonais já reveladas (mês atual e anteriores)
const totalVisible = ACHIEVEMENTS.length + visibleSeasonal.length;

// X = permanentes desbloqueadas + sazonais do ano corrente desbloqueadas
const totalUnlocked = permanentUnlocked.length + unlockedSeasonalThisYear.length;

// Exibe: "34 de 47 desbloqueadas" (em março, por ex.)
// Em dezembro: "X de 77 desbloqueadas" (todas as 55 sazonais visíveis)
```

Isso cria um efeito natural de progressão: o número total disponível **cresce ao longo do ano**, incentivando o usuário a voltar mês a mês.

---

#### Layout da seção sazonal

```
┌─────────────────────────────────────────┐
│  🗓️ Conquistas Sazonais · 2026          │
│  Edições únicas — aparecem mês a mês.  │
├─────────────────────────────────────────┤
│  🔥 Disponíveis Agora (mês atual)       │
│  ┌────────────────────────────────────┐ │
│  │ 🎃 Outubro Assustador   📅 2026    │ │
│  │ Épico · ···pulsante···   🔒        │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 👻 Halloween Poupador   📅 2026    │ │
│  │ Comum · ···pulsante···   🔒        │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  ✅ Conquistadas este ano               │
│  ┌────────────────────────────────────┐ │
│  │ 🎭 Carnaval Imune        📅 2026   │ │
│  │ Épico · desbloqueada 15/02/2026    │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  ⌛ Meses anteriores — janela encerrada │
│  ┌────────────────────────────────────┐ │
│  │ 🔒 [opacity 0.35]       📅 2026   │ │
│  │ Amor pela Meta · Fev · Não obtida  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘

    ← Meses futuros: completamente ocultos →
```

**Sub-seções renderizadas:**
1. **Disponíveis Agora** — sazonais do mês atual ainda não desbloqueadas; cards com borda pulsante
2. **Conquistadas este ano** — sazonais do ano corrente já desbloqueadas, em qualquer mês
3. **Janelas encerradas** — sazonais de meses já passados que o usuário não obteve; `opacity: 0.35` + label "Não obtida · disponível em 2027"
4. *(Meses futuros: sem renderização, sem placeholder, sem menção)*

**Badge visual nos cards sazonais:**
- Tag `🗓️ SAZONAL` + `📅 [ano]` no canto superior direito
- Cards "disponíveis agora": `box-shadow` pulsante via `@keyframes pulse` no `globals.css` + borda da raridade mais intensa
- Cards "janela encerrada": `opacity: 0.35` + texto `"Não obtida este ano · volta em 2027"`

Tamanho estimado: **+180 linhas**

---

## 7. Tratamento de Datas Flutuantes

| Data | Cálculo |
|------|---------|
| Páscoa | Algoritmo de Meeus/Butcher — determinístico para qualquer ano |
| Carnaval | Páscoa − 47 dias (sábado); duração: sáb a quarta-feira |
| Dia das Mães BR | 2º domingo de maio — loop pelos domingos do mês |
| Dia dos Pais BR | 2º domingo de agosto — loop pelos domingos do mês |
| Black Friday | Última sexta de novembro — loop reverso do mês |
| Sexta-Feira 13 | `new Date(y, m, 13).getDay() === 5` para cada mês do ano |
| Ano bissexto | `new Date(y, 1, 29).getDate() === 29` |

---

## 8. Considerações Especiais

### Conquistas cross-year
Janelas como `28/12 – 02/01` e `01/12 – 28/02` (Verão de Fogo) cruzam anos. Lógica:
```typescript
// Se crossYear: true, a chave usa o ano em que a janela COMEÇA
// Ex: reveillon_de_campeao_2026 cobre 28/12/2026 – 02/01/2027
```

### `q4_invencivel` — janela no ano seguinte
A conquista `q4_invencivel_2026` só pode ser verificada entre 01/01/2027 – 07/01/2027, mas avalia meses de out, nov, dez de **2026**. Lógica: quando `year` for 2027 e a janela for 01/01–07/01, buscar meses `2026-10`, `2026-11`, `2026-12`.

### `requiresActiveWindow`
Flag opcional para distinguir dois comportamentos:
- **`true` (estrito):** o `runGamificationCheck` precisa ser chamado **durante** a janela. Máxima urgência. Usado em conquistas de ação pontual (ex: `ano_novo`, `ceia_de_campeao`).
- **`false` (histórico):** verifica o histórico a qualquer momento dentro da janela. Mais justo. Usado em conquistas de meta mensal (ex: `dezembro_disciplinado`, `junho_arrochado`).

### Nenhuma migração de banco necessária
O modelo `UserAchievement` armazena qualquer string em `key`. As chaves `ano_novo_2026`, `carnaval_imune_2027`, etc. se encaixam naturalmente na estrutura existente.

---

## 9. Ordem de Implementação

| Passo | Arquivo | O que fazer |
|-------|---------|-------------|
| 1 | `lib/achievements.ts` | Adicionar tipos + `generateSeasonalAchievements(year)` com os 55 templates |
| 2 | `lib/gamification.ts` | Adicionar `today` ao `CheckContext` + helpers de data |
| 3 | `lib/gamification.ts` | Implementar `evaluateSeasonalCondition` + `checkSeasonalAchievements` |
| 4 | `lib/actions/gamification.ts` | Passar `today` + chamar `checkSeasonalAchievements` |
| 5 | `app/(protected)/conquistas/page.tsx` | Lógica de revelação progressiva + contador atualizado + 3 sub-seções sazonais |

---

## 10. Resumo por Raridade

| Raridade | Templates | XP médio por edição |
|----------|-----------|---------------------|
| Comum | 14 | 25 XP |
| Raro | 21 | 90 XP |
| Épico | 15 | 215 XP |
| Lendário | 5 | 600 XP |
| **Total** | **55** | — |

---

## 11. Notas de Desenvolvimento

- **Não criar componente novo** — renderizar inline em `conquistas/page.tsx` seguindo padrão de inline styles do projeto
- **Não alterar estilos visuais existentes** — os cards sazonais reutilizam `RARITY_COLORS` e `RARITY_LABELS`; apenas o badge e a pulsação são adicionais
- **Revelação progressiva:** meses futuros são filtrados no servidor antes de qualquer renderização — não chegam ao cliente, não há risco de spoiler via DevTools na estrutura do componente
- **Contador dinâmico:** o `totalCount` exibido no header da página (`X de Y`) varia ao longo do ano à medida que novos meses são revelados; isso é intencional e comunicado via tooltip `"Novas conquistas são reveladas todo mês"`
- **Edge cases para testar:** janelas cross-year, anos bissextos (2028), Carnaval em fevereiro vs março, `q4_invencivel` verificado em janeiro do ano seguinte
- **Performance:** O loop de 55 items em `checkSeasonalAchievements` é O(n) e não faz queries adicionais — reutiliza o `ctx` já carregado em `runGamificationCheck`
