# Sugestões de Features — Meta 100K

> Análise realizada em 02/03/2026. Baseada no código atual, regras de negócio e UX patterns de apps de finanças pessoais.

---
### 01. Conquistas Sazonais
**Por quê?** Cria urgência e FOMO — conquistas que só existem em períodos específicos.

**Exemplos:**
- 🎆 `ano_novo` — Lançar poupança no dia 01/01
- 💘 `amor_pela_meta` — Poupar nos 14 dias de fevereiro sem falhar
- 🎃 `outubro_assustador` — Reduzir despesas em 13% em outubro
- 🎁 `dezembro_disciplinado` — Manter taxa de poupança em dezembro (mês mais difícil)

---
### 11. Importação de Extrato (CSV)
**Por quê?** Reduz drasticamente o atrito de entrada para usuários com muitas transações.

**Funcionalidade:**
- Upload de CSV no `/lancamentos`
- Parser simples: colunas `data,descrição,valor,tipo`
- Preview das linhas antes de confirmar
- Classificação automática por palavras-chave (ex: "ifood" → Alimentação)

---
---

### 15. Modo "Desafio 30 Dias"
**Por quê?** Programa estruturado para novos usuários — reduz abandono nas primeiras semanas.

**Funcionalidade:**
- Ao criar conta, opção de entrar no "Desafio 30 Dias"
- Cada dia tem uma missão pequena (ex: "Registre uma despesa", "Poupe pelo menos R$10")
- Progresso visual estilo onboarding
- Ao completar: badge exclusivo `challenger_30` + 500 XP

---