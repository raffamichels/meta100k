# Feature: Cofre do Diabo

## Visão Geral

O **Cofre do Diabo** é um sistema de registro de **tentações resistidas** — compras que o usuário quase fez, mas decidiu não fazer. Em vez de rastrear só o que foi gasto, o app passa a reconhecer e recompensar o que *não* foi gasto por força de vontade.

O valor acumulado de tentações resistidas forma um **"saldo invisível"** — dinheiro que o usuário protegeu de si mesmo. Esse número é exibido com orgulho, cria XP e desbloqueia conquistas próprias, tornando a autodisciplina financeira algo tangível, mensurável e celebrado.

A premissa comportamental é simples: **o que não é medido não é valorizado**. Ao nomear e registrar a tentação, o usuário reforça positivamente a decisão de não gastar.

---

## Fluxo do Usuário

### 1. Registrar uma tentação

O usuário abre a página de Lançamentos e vê uma quarta opção além de Salário, Poupança e Gastos:

> **"+ Registrar tentação resistida"**

Ao clicar, abre um formulário com:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| O que era? | Texto livre | "Tênis Nike", "iPhone 15", "Jantar no restaurante caro" |
| Valor que teria gasto | Número (R$) | Valor estimado da compra não realizada |
| Categoria | Select | Igual às categorias de gastos: Vestuário, Tecnologia, Alimentação, Lazer, etc. |
| Onde você quase comprou? | Texto livre (opcional) | "Shopping Iguatemi", "Amazon", "iFood" |
| Data | Date picker | Default: hoje |

Ao salvar:
- Registra no banco (model `Temptation`)
- Concede XP (ver tabela abaixo)
- Verifica conquistas
- Toast: "Tentação resistida! Você protegeu R$[X] de si mesmo 😈🔒"

---

### 2. Visualização no Dashboard

No dashboard principal, adicionar um card **"Cofre do Diabo"** ao lado ou abaixo do HeroCard:

```
┌─────────────────────────────────────────┐
│  😈 Cofre do Diabo                      │
│                                          │
│  R$ 4.750                               │
│  protegidos de você mesmo               │
│                                          │
│  12 tentações resistidas                │
│  Última: "AirPods Pro" · R$ 1.799       │
│                                          │
│  Top categoria: Tecnologia (R$ 3.200)   │
└─────────────────────────────────────────┘
```

---

### 3. Página dedicada (aba no Histórico ou seção própria)

Uma visão completa do Cofre com:

- **Total acumulado** — valor total de todas as tentações resistidas
- **Quantidade de tentações** — contagem total
- **Série atual** — quantas tentações registradas nos últimos 7 dias
- **Lista cronológica** — todas as tentações com data, descrição, valor e categoria
- **Ranking por categoria** — quais categorias o usuário resiste mais
- **Botão deletar** — caso o usuário tenha registrado por engano

#### Análise por categoria (tabela simples)

| Categoria | Qtd | Total resistido |
|-----------|-----|-----------------|
| Tecnologia | 5 | R$ 3.200 |
| Vestuário | 4 | R$ 980 |
| Alimentação | 3 | R$ 570 |

---

## Conquistas do Cofre do Diabo

Criar conquistas permanentes dedicadas exclusivamente ao Cofre:

| Chave | Título | Descrição | Raridade | XP |
|-------|--------|-----------|----------|----|
| `devil_first` | Primeira Tentação | Registrou sua primeira tentação resistida | Common | 30 |
| `devil_10` | Guardião | Resistiu a 10 tentações | Common | 75 |
| `devil_50` | Monge Digital | Resistiu a 50 tentações | Rare | 200 |
| `devil_100` | Asceta | Resistiu a 100 tentações | Epic | 500 |
| `devil_value_1k` | Mil Protegidos | Acumulou R$1.000 no cofre | Common | 100 |
| `devil_value_10k` | Cofre Robusto | Acumulou R$10.000 no cofre | Rare | 300 |
| `devil_value_50k` | Fortaleza Interior | Acumulou R$50.000 no cofre | Epic | 800 |
| `devil_week` | Semana Blindada | Registrou tentações em 7 dias seguidos | Rare | 150 |
| `devil_big` | Linha Tênue | Resistiu a uma tentação acima de R$5.000 | Epic | 400 |
| `devil_categories` | Generalista | Resistiu em 5 categorias diferentes | Rare | 200 |

---

## Banco de Dados

### Novo model: `Temptation`

Adicionar ao `schema.prisma`:

```prisma
model Temptation {
  id          String   @id @default(cuid())
  desc        String                          // "Tênis Nike Air Max"
  value       Float                           // 350.00
  category    String                          // "Vestuário"
  place       String?                         // "Shopping Iguatemi" (opcional)
  date        String                          // "2026-03-03"

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
}
```

### Relação no model `User`

```prisma
temptations  Temptation[]
```

### Campos calculados (sem banco, calculados em runtime)

- `totalResistido` = `SUM(temptation.value)` por userId
- `countTemptations` = `COUNT(*)` por userId
- `topCategory` = categoria com maior `SUM(value)`

---

## Novas API Actions

### `lib/actions/temptations.ts`

```ts
// Criar tentação
createTemptation(desc, value, category, place, date)
  → salva no banco
  → concede XP baseado no valor
  → chama checkAndUnlockAchievements()
  → retorna { success, xpGained, totalResistido }

// Deletar tentação
deleteTemptation(id)
  → verifica que pertence ao userId da sessão
  → remove do banco

// Listar tentações do usuário
getTemptations(userId)
  → retorna todas ordenadas por date DESC
```

---

## Desafios Pessoais Relacionados

Adicionar novos templates de desafio semanal em `lib/gamification.ts`:

| Template | Tipo | Meta | XP Recompensa |
|----------|------|------|---------------|
| `resist_3_temptations` | weekly | Registrar 3 tentações na semana | 80 XP |
| `resist_big` | weekly | Resistir a 1 tentação acima de R$500 | 120 XP |
| `resist_daily` | weekly | Registrar ao menos 1 tentação por 5 dias | 150 XP |

---

## Integração com Insights (gancho para feature futura)

O Cofre alimenta uma camada de análise comportamental:

- **"Seu maior inimigo é a Tecnologia"** — se Tecnologia lidera o ranking de tentações
- **"Você resistiu R$2.300 este mês — mais que poupou"** — comparação entre tentações e poupança real
- **"Seu pico de tentações é às sextas-feiras"** — análise por dia da semana (se `date` for aproveitado)

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `prisma/schema.prisma` | Modificar | Adicionar model `Temptation` + relação em `User` |
| `lib/actions/temptations.ts` | Criar | Server actions de criação, exclusão e listagem |
| `components/lancamentos/TemptationForm.tsx` | Criar | Formulário de registro de tentação |
| `components/dashboard/CofreCard.tsx` | Criar | Card do Cofre no dashboard |
| `app/(protected)/cofre/page.tsx` | Criar | Página dedicada com histórico e análise |
| `lib/achievements.ts` | Modificar | Adicionar 10 novas conquistas do Cofre |
| `lib/gamification.ts` | Modificar | XP por tentação + novos templates de desafio |
| `app/(protected)/lancamentos/page.tsx` | Modificar | Adicionar TemptationForm ao grid |
| `components/ui/BottomNav.tsx` | Opcional | Adicionar aba "Cofre" se virar seção principal |

---

## Considerações de UX

### Tom da feature

O nome "Cofre do Diabo" e o emoji 😈 são intencionalmente provocativos. A ideia é que o "diabo" representa o impulso de gastar — e o cofre guarda o que você salvou dele. Esse tom lúdico e auto-irônico ressoa com o público jovem e diferencia a feature de um simples registro de controle.

### Não é culpa — é orgulho

O design e a copy devem sempre **celebrar a resistência**, nunca punir o usuário por ter tido a tentação. A tentação é normal; o que importa é a decisão. Exemplos de copy:

- ✅ "Você protegeu R$350 de si mesmo!"
- ✅ "Mais um round para você: 1 × 0 contra o Diabo"
- ❌ "Você quase gastou R$350" (tom de vergonha — evitar)

### Campo "onde quase comprou" é opcional mas valioso

Mesmo sendo opcional, ele contextualiza e personaliza o registro. Com o tempo, o usuário pode perceber padrões ("Toda vez que entro no shopping gasto mais") sem que o app precise apontar diretamente.

### Valor mínimo sugerido: R$20

No formulário, mostrar aviso suave se o valor for menor que R$20:
> "Resistências pequenas também contam! Mas o Cofre brilha de verdade com tentações acima de R$20."

Isso evita que o sistema seja usado para microtransações sem significado, preservando o peso emocional da feature.
