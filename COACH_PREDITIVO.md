# Coach Preditivo — Especificação de Recurso

## Visão Geral

O Coach Preditivo transforma o orçamento de passivo (o usuário consulta) para ativo (o app alerta). Em vez de o usuário descobrir que estourou o orçamento só no fim do mês, o coach analisa o ritmo atual de gastos, projeta o fim do mês e entrega uma análise personalizada gerada pelo **Claude API** — em linguagem natural, adaptada ao perfil financeiro real de cada usuário.

---

## O Gatilho: Badge de Notificação no Chatbot

O ponto de entrada é um badge `"1"` no ícone do chatbot (FinancialAssistant), igual a uma notificação de mensagem não lida.

- Quando há uma análise nova disponível, o badge aparece
- Quando o usuário clica no botão do chatbot com o badge visível, **a primeira coisa que o chatbot envia é a análise** — sem o usuário precisar perguntar nada
- Após a leitura, o badge some
- Não há tela separada de notificações — tudo acontece dentro do chatbot já existente

---

## Dias de Análise

O coach envia análises em 4 momentos do mês:

| Dia | Tipo | Foco |
|-----|------|------|
| **Dia 8** | Alerta precoce | Ritmo da primeira semana vs mês anterior, projeção inicial |
| **Dia 15** | Análise de meio de mês | Comparativo com mês anterior + projeção para o fim do mês |
| **Dia 22** | Alerta final | Última chance de corrigir antes de fechar o mês |
| **Dia 1º** | Retrospectiva mensal | Análise do mês que fechou + sugestões concretas para o novo mês |

---

## Arquitetura: Claude API + Dados Calculados

O fluxo tem duas etapas separadas:

### Etapa 1 — Cálculos determinísticos (código)
Antes de chamar o Claude, o servidor calcula os números precisos:

```typescript
// lib/coach.ts

export function calcularDadosCoach(
  despesasMesAtual: Expense[],
  despesasMesAnterior: Expense[],
  extras: Extra[],
  salario: number,
  economias: number,
  orcamentos: Budget[],
  diaAtual: number,
  diasNoMes: number,
  metaTotal: number,
  totalAcumulado: number
) {
  const gastoAtual = despesasMesAtual.reduce((s, e) => s + e.value, 0)
  const gastoAnterior = despesasMesAnterior.reduce((s, e) => s + e.value, 0)

  // Projeção linear
  const projecao = (gastoAtual / diaAtual) * diasNoMes

  // Agrupamento por categoria
  const porCategoria = despesasMesAtual.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.value
    return acc
  }, {} as Record<string, number>)

  const porCategoriaAnterior = despesasMesAnterior.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.value
    return acc
  }, {} as Record<string, number>)

  // Orçamento total configurado
  const orcamentoTotal = orcamentos.reduce((s, b) => s + b.limit, 0)

  // Categorias acima do orçamento
  const categoriasEstouradas = orcamentos
    .filter(b => (porCategoria[b.category] || 0) > b.limit)
    .map(b => ({
      categoria: b.category,
      gasto: porCategoria[b.category],
      limite: b.limit,
      excesso: porCategoria[b.category] - b.limit
    }))

  // Taxa de poupança do mês atual
  const rendaTotal = salario + extras.reduce((s, e) => s + e.value, 0)
  const taxaPoupanca = rendaTotal > 0 ? (economias / rendaTotal) * 100 : 0

  // Progresso para a meta
  const progressoMeta = (totalAcumulado / metaTotal) * 100

  return {
    gastoAtual,
    gastoAnterior,
    projecao,
    porCategoria,
    porCategoriaAnterior,
    orcamentoTotal,
    categoriasEstouradas,
    rendaTotal,
    taxaPoupanca,
    progressoMeta,
    diasRestantes: diasNoMes - diaAtual
  }
}
```

### Etapa 2 — Claude API gera a análise personalizada

Com os dados calculados, o servidor monta um prompt rico e chama o Claude:

```typescript
// app/api/coach/route.ts

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  const { dados, tipoAnalise, nomeUsuario, historicoMeses } = await req.json()

  const systemPrompt = `
Você é o Coach Financeiro do META100K, um app que ajuda pessoas a economizar R$ 100.000.
Seu nome é Coach. Você fala em português brasileiro, de forma direta, encorajadora e sem julgamentos.
Você é um parceiro de confiança, não um auditor. Nunca use linguagem técnica sem explicar.
Responda sempre em texto corrido (sem listas longas), como se fosse uma mensagem de um amigo que entende de finanças.
Use emojis com moderação — apenas quando reforçar o sentido, não como decoração.
Máximo de 200 palavras por análise.
`

  const promptPorTipo = {
    dia8: `
Hoje é o dia 8 do mês. Analise o início do mês de ${nomeUsuario} com base nos dados abaixo
e gere um alerta precoce personalizado. Mencione o ritmo da primeira semana, compare com o
mês anterior se for relevante, faça a projeção para o fim do mês e indique se está no caminho certo.
Se houver categoria estourando, mencione diretamente pelo nome.
`,
    dia15: `
Hoje é o dia 15. É a metade do mês de ${nomeUsuario}. Analise a situação atual, compare com o
mês anterior, projete como o mês vai fechar e dê uma recomendação concreta de ação para os
próximos 15 dias. Seja específico com categorias e valores — use os dados reais.
`,
    dia22: `
Faltam 8 dias para fechar o mês de ${nomeUsuario}. Esta é a última chance de ajuste.
Seja direto: diga se a pessoa vai fechar no azul ou no vermelho, quanto tem disponível por dia,
quais categorias devem ser monitoradas agora. Termine com uma ação específica e possível.
`,
    dia1: `
O mês anterior de ${nomeUsuario} acabou. Faça uma retrospectiva completa: o que foi bem,
o que pode melhorar, qual padrão você identifica comparando com os meses anteriores.
Depois, dê 2 ou 3 sugestões CONCRETAS e personalizadas para o mês que está começando —
com valores específicos quando possível. Termine perguntando se quer configurar algum
orçamento novo com base na análise.
`
  }

  const dadosFormatados = `
DADOS FINANCEIROS DE ${nomeUsuario.toUpperCase()}:

Mês atual (até hoje, dia ${dados.diaAtual}):
- Total gasto: R$ ${dados.gastoAtual.toFixed(2)}
- Projeção para o fim do mês: R$ ${dados.projecao.toFixed(2)}
- Orçamento total configurado: R$ ${dados.orcamentoTotal.toFixed(2)}
- Renda do mês (salário + extras): R$ ${dados.rendaTotal.toFixed(2)}
- Já economizou: R$ ${dados.economiasAtual.toFixed(2)}
- Taxa de poupança atual: ${dados.taxaPoupanca.toFixed(1)}%

Gastos por categoria este mês:
${Object.entries(dados.porCategoria)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([cat, val]) => `  - ${cat}: R$ ${(val as number).toFixed(2)}`)
  .join('\n')}

Comparativo com mês anterior:
${Object.entries(dados.porCategoriaAnterior)
  .map(([cat, val]) => {
    const atual = dados.porCategoria[cat] || 0
    const variacao = val > 0 ? (((atual - (val as number)) / (val as number)) * 100).toFixed(0) : 'novo'
    return `  - ${cat}: R$ ${(val as number).toFixed(2)} → R$ ${atual.toFixed(2)} (${variacao}%)`
  })
  .join('\n')}

Categorias que estouraram orçamento:
${dados.categoriasEstouradas.length > 0
  ? dados.categoriasEstouradas.map((c: any) =>
      `  - ${c.categoria}: limite R$ ${c.limite.toFixed(2)}, gasto R$ ${c.gasto.toFixed(2)} (+R$ ${c.excesso.toFixed(2)})`
    ).join('\n')
  : '  Nenhuma categoria estourou ainda.'}

Progresso na meta R$ 100.000:
- Total acumulado: R$ ${dados.totalAcumulado.toFixed(2)} (${dados.progressoMeta.toFixed(1)}%)

Histórico dos últimos meses (economia):
${historicoMeses.map((m: any) => `  - ${m.key}: economizou R$ ${m.savings.toFixed(2)}`).join('\n')}
`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `${promptPorTipo[tipoAnalise as keyof typeof promptPorTipo]}\n\n${dadosFormatados}`
      }
    ]
  })

  const texto = message.content[0].type === 'text' ? message.content[0].text : ''

  return Response.json({ analise: texto })
}
```

---

## Por que isso é personalizável de verdade

Com os dados reais no prompt, o Claude consegue:

- **Chamar categorias pelo nome**: "Seu gasto com Delivery subiu 60% em relação a fevereiro"
- **Reconhecer padrões de histórico**: "Nos últimos 3 meses você sempre estoura em Saúde no final do mês"
- **Calibrar o tom pelo momento**: otimista quando está indo bem, direto quando está apertado
- **Personalizar a sugestão pelo perfil**: quem ganha mais recebe sugestões de valor diferente de quem ganha menos
- **Lembrar do contexto da meta**: quantos meses faltam, se está acelerando ou desacelerando

Isso é impossível com templates de variáveis — cada análise sai única.

---

## Estado de "Notificação Lida"

```typescript
// localStorage
coachNotification: {
  period: "2026-03-15",  // dia de análise mais recente
  read: false
}
```

- Badge aparece quando `read: false`
- Ao abrir o chat com badge ativo → chama a API, exibe a análise, seta `read: true`
- Reseta automaticamente no próximo dia de análise (8, 15, 22 ou 1º)

---

## Integração com o Chatbot Existente

Mudanças em `components/ui/FinancialAssistant.tsx`:

1. **Badge condicional** no botão de abrir o chat
2. **`useEffect` ao abrir** — verifica se há análise pendente
3. **Chama `/api/coach`** passando os dados do usuário (via Server Action ou fetch)
4. **Injeta a mensagem** como primeira resposta do assistente (antes do usuário digitar)
5. **Marca como lida** no localStorage após exibir

O usuário pode continuar a conversa normalmente depois da análise — perguntando detalhes, pedindo para ajustar orçamentos etc.

---

## Dados Necessários (já existem no banco)

| Dado | Origem |
|------|--------|
| Gastos do mês atual por categoria | `Expense` filtrado por `monthId` |
| Gastos do mês anterior por categoria | `Expense` do mês anterior |
| Orçamento por categoria | `Budget` do usuário |
| Salário e extras do mês | `Month.salary` + `Extra` |
| Economia acumulada | `Month.savings` + `User.baseAmount` |
| Histórico de meses anteriores | `Month[]` ordenado por `key` |

Nenhuma tabela nova precisa ser criada.

---

## Ordem de Implementação

1. Criar `lib/coach.ts` com a função `calcularDadosCoach`
2. Criar `app/api/coach/route.ts` com a chamada ao Claude API
3. Criar Server Action para buscar todos os dados necessários do banco
4. Adicionar lógica de badge + estado no `FinancialAssistant.tsx`
5. Implementar o auto-envio da análise ao abrir o chat com badge ativo
6. Testar cada tipo de análise (dia8, dia15, dia22, dia1) com dados reais

---

## Observações Finais

- Usar **`claude-opus-4-6`** para máxima qualidade nas análises (são chamadas raras — 4x/mês)
- O prompt de sistema define o tom de coach, não de auditor — isso não muda por tipo de análise
- Se o usuário não tiver orçamento configurado, passar `orcamentoTotal: 0` e deixar o Claude sugerir criá-lo
- A análise do dia 1º deve receber o histórico dos **últimos 3 meses** para o Claude identificar tendências
