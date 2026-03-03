# Sugestões de Features — Meta 100K

> Análise realizada em 02/03/2026. Baseada no código atual, regras de negócio e UX patterns de apps de finanças pessoais.

---

### 1. Desafios Entre Amigos (Social Savings)
**Por quê?** Accountability social é o multiplicador de retenção mais comprovado em apps de hábito.

**MVP simples (sem back-end complexo):**
- Usuário gera um link único de "desafio", que pode selecionar entre dois modos. O primeiro modo, e principal, é o modo de Desafio hard, que é para competir quem chega no objetivo principal primeiro (que obviamente é chegar a 100k, seguindo a lógica do app). O segundo modo é criar um desafio de economia, que pode escolher entre 30, 60 e 90 dias.
- Amigo clica no link e decide se aceita ou não participar
- Se o modo for o primeiro, basicamente vence quem chegar a 100 mil primeiro. Deve haver uma tela que mostre, de forma extremamente gamificada, quem está ganhando. Deve ser utilizado para comparação com base no total guardado de cada um. Se o modo for o segundo, vence quem economizar mais no período estipulado
- Haverá uma badge para cada modo


---

## Prioridade Média — Analytics e Insights

### 6. Relatório Mensal de Saúde Financeira
**Por quê?** Os dados já existem no banco (salário, despesas, extras, poupança). Só falta apresentá-los de forma visual e contextualizada.

**Conteúdo do relatório (nova rota `/relatorio/[YYYY-MM]`):**
- Taxa de poupança (% do salário): `savings / salary × 100`
- Comparativo vs mês anterior (setas ↑↓)
- Top 3 categorias de despesa (já existe `category` no Expense)
- "Você poupou X% a mais que no mês passado" — mensagem motivacional
- Projeção atualizada: "No ritmo atual, atinge a meta em Julho 2027"

**Conquista nova:** `analyst` — abrir o relatório por 3 meses consecutivos.

---

### 7. Gráfico de Evolução da Poupança
**Por quê?** A `ProjectionCard` já mostra uma projeção linear, mas não tem histórico visual.

**Funcionalidade:**
- Gráfico de linha simples no dashboard (ou em `/relatorio`)
- Eixo X: meses (Jan, Fev, Mar...)
- Eixo Y: poupança acumulada
- Linha sólida: histórico real
- Linha tracejada: projeção até a meta
- Implementação sem biblioteca: SVG puro ou `recharts` (leve)

---

### 8. Score de Consistência
**Por quê?** XP e streak medem atividade, mas não qualidade financeira. Um "score" sintético dá feedback mais rico.

**Cálculo sugerido (0–100):**
- 40pts — Taxa de poupança do mês (40% = 40pts)
- 30pts — Streak ativo (30 dias+ = 30pts)
- 20pts — Desafios completados no mês (1 por desafio, máx 2)
- 10pts — Despesas dentro do orçamento

**UI:** Número grande colorido (verde/amarelo/vermelho) no topo do `/perfil`.

---

## Prioridade Média — UX e Produtividade

### 9. Lançamentos Recorrentes
**Por quê?** Despesas fixas (aluguel, internet, academia) são lançadas todo mês manualmente. Isso é fricção desnecessária.

**Funcionalidade:**
- Ao criar uma despesa, opção "repetir todo mês"
- Sistema cria automaticamente a despesa no início de cada mês
- Gerenciamento em `/perfil` ou `/meta`

**Schema:**
```prisma
model RecurringExpense {
  id       String @id @default(cuid())
  userId   String
  desc     String
  value    Float
  category String
  active   Boolean @default(true)
}
```

**Implementação:** Vercel Cron Job no dia 1 de cada mês cria as despesas recorrentes.

---

### 10. Quick Add via Barra de Lançamento Flutuante
**Por quê?** O `/lancamentos` tem 4 formulários completos, mas às vezes o usuário só quer registrar "poupei R$50 hoje" com 2 toques.

**Funcionalidade:**
- Botão FAB (+) no dashboard leva a um modal rápido
- Campo único: valor + tipo (savings/expense/extra com ícones)
- Usa data de hoje e descrição padrão ("Poupança rápida")
- Fecha o modal e mostra XP popup imediatamente

---

### 11. Importação de Extrato (CSV)
**Por quê?** Reduz drasticamente o atrito de entrada para usuários com muitas transações.

**Funcionalidade:**
- Upload de CSV no `/lancamentos`
- Parser simples: colunas `data,descrição,valor,tipo`
- Preview das linhas antes de confirmar
- Classificação automática por palavras-chave (ex: "ifood" → Alimentação)

---

## Prioridade Baixa — Personalização e Expansão

### 12. Múltiplas Metas
**Por quê?** R$100K é a meta do app, mas usuários podem ter sub-metas (viagem, carro, reserva de emergência).

**Funcionalidade:**
- `/meta` permite criar sub-metas com nome, valor alvo e deadline
- Barra de progresso individual por meta
- Poupança pode ser "alocada" em uma meta específica
- Conquistas por meta completada

**Schema:**
```prisma
model Goal {
  id        String   @id @default(cuid())
  userId    String
  name      String
  target    Float
  current   Float    @default(0)
  deadline  DateTime?
  color     String   @default("#60d4f0")
  completed Boolean  @default(false)
}
```

---

### 13. Temas e Customização Visual
**Por quê?** O app usa `--accent` (verde) e `--accent2` (ciano) como variáveis CSS. Adicionar temas é trivial.

**Temas sugeridos:**
- 🌿 **Verde** (padrão atual)
- 🌊 **Oceano** (azul/teal)
- 🔥 **Chama** (laranja/vermelho)
- 🌙 **Noite** (roxo/índigo)
- ⚡ **Ouro** (amarelo/âmbar) — desbloqueável ao atingir nível 5+

**Implementação:** `user.theme` no schema + CSS variables no `:root` baseado na preferência.

---

### 14. Conquistas Sazonais
**Por quê?** Cria urgência e FOMO — conquistas que só existem em períodos específicos.

**Exemplos:**
- 🎆 `ano_novo` — Lançar poupança no dia 01/01
- 💘 `amor_pela_meta` — Poupar nos 14 dias de fevereiro sem falhar
- 🎃 `outubro_assustador` — Reduzir despesas em 13% em outubro
- 🎁 `dezembro_disciplinado` — Manter taxa de poupança em dezembro (mês mais difícil)

---

### 15. Modo "Desafio 30 Dias"
**Por quê?** Programa estruturado para novos usuários — reduz abandono nas primeiras semanas.

**Funcionalidade:**
- Ao criar conta, opção de entrar no "Desafio 30 Dias"
- Cada dia tem uma missão pequena (ex: "Registre uma despesa", "Poupe pelo menos R$10")
- Progresso visual estilo onboarding
- Ao completar: badge exclusivo `challenger_30` + 500 XP

---

## Melhorias de Qualidade (Quick Wins)

### 16. Correção: BottomNav com 5 itens
O `MEMORY.md` menciona "BottomNav com 5 itens: + Troféus (/conquistas)", mas o código atual tem 3. Adicionar `/conquistas` e `/historico` ao BottomNav.

### 17. Página `/perfil` Completa
A página existe como arquivo mas pode estar incompleta. Sugestão de conteúdo:
- Score de consistência (item 8)
- Configurações (tema, meta, recorrentes)
- Estatísticas pessoais (total poupado, dias ativos, melhor streak)
- Zona de perigo (deletar conta, limpar dados)
- Logout com confirmação

### 18. Conquista `expense_cutter` Revisão
A conquista `expense_cutter` ("Reduziu despesas vs mês anterior") está definida em `lib/achievements.ts` mas a lógica de check em `runGamificationCheck` não tem acesso fácil ao mês anterior. Verificar se está sendo checada corretamente ou se precisa de query adicional.

### 19. Validação de Data Retroativa
Formulários aceitam datas no passado (bom para correções), mas um lançamento retroativo de 6 meses poderia "inflar" artificialmente o streak. Considerar regra: lançamentos com mais de 30 dias de atraso não contam para streak.

### 20. Skeleton Loading States
Atualmente os dados são carregados com `async/await` no server component. Adicionar `loading.tsx` em cada rota do `app/(protected)/` para mostrar skeletons enquanto carrega, melhorando a percepção de velocidade.

---

## Resumo por Impacto vs Esforço

| # | Feature | Impacto | Esforço | Prioridade |
|---|---------|---------|---------|------------|
| 1 | Email/Push de resumo semanal | ⭐⭐⭐⭐⭐ | Médio | 🔴 Alta |
| 2 | Daily Check-In | ⭐⭐⭐⭐ | Baixo | 🔴 Alta |
| 3 | Orçamento por categoria | ⭐⭐⭐⭐ | Médio | 🔴 Alta |
| 4 | Streak Calendar Visual | ⭐⭐⭐⭐ | Baixo | 🔴 Alta |
| 5 | Desafios entre amigos | ⭐⭐⭐⭐⭐ | Alto | 🟡 Média |
| 6 | Relatório mensal | ⭐⭐⭐⭐ | Médio | 🟡 Média |
| 7 | Gráfico de evolução | ⭐⭐⭐ | Baixo | 🟡 Média |
| 8 | Score de consistência | ⭐⭐⭐ | Baixo | 🟡 Média |
| 9 | Lançamentos recorrentes | ⭐⭐⭐⭐ | Médio | 🟡 Média |
| 10 | Quick Add flutuante | ⭐⭐⭐⭐ | Baixo | 🟡 Média |
| 11 | Importação CSV | ⭐⭐⭐ | Alto | 🟢 Baixa |
| 12 | Múltiplas metas | ⭐⭐⭐⭐ | Alto | 🟢 Baixa |
| 13 | Temas visuais | ⭐⭐ | Baixo | 🟢 Baixa |
| 14 | Conquistas sazonais | ⭐⭐⭐ | Médio | 🟢 Baixa |
| 15 | Desafio 30 dias (onboarding) | ⭐⭐⭐⭐ | Alto | 🟢 Baixa |
| 16 | BottomNav 5 itens | ⭐⭐⭐ | Muito baixo | 🔴 Quick win |
| 17 | Página /perfil completa | ⭐⭐⭐ | Médio | 🟡 Média |
| 18 | Fix conquista expense_cutter | ⭐⭐ | Baixo | 🔴 Quick win |
| 19 | Validação data retroativa | ⭐⭐ | Baixo | 🟡 Média |
| 20 | Skeleton loading states | ⭐⭐⭐ | Baixo | 🟡 Média |
