Plano: Gamificação Extrema — Meta 100K
Contexto
O app é um rastreador de poupança pessoal (meta R$100K) com Next.js 15, Prisma/PostgreSQL e Tailwind CSS 4.
Gamificação atual: streak diário básico (🔥), barra de progresso, mensagens motivacionais no formulário de economia.
Objetivo: levar a gamificação ao nível máximo, inspirado em Duolingo, Mimo, Habitica e GitHub Contributions.

Visão Geral das 6 Fases

Fase 1 → XP + Níveis          (fundação de tudo)
Fase 2 → Conquistas / Badges  (recompensas permanentes)
Fase 3 → Streak Avançado      (escudo + recorde pessoal)
Fase 4 → Desafios Semanais    (missões dinâmicas)
Fase 5 → Heatmap + Marcos     (visualização épica)
Fase 6 → Polimento Animado    (celebrações CSS)

Fase 1 — Sistema de XP e Níveis (Duolingo-core)
Mudanças no schema (prisma/schema.prisma)
Adicionar ao model User:


xp        Int @default(0)
level     Int @default(1)
maxStreak Int @default(0)   // recorde de streak (usado na fase 3)
Novo arquivo lib/gamification.ts
Define toda a lógica de XP/nível:


// Fontes de XP
SAVE_ANY      = +10   // qualquer economia registrada
SAVE_100      = +25   // economia >= R$100 (acumulado no dia)
SAVE_1000     = +100  // economia >= R$1000 (acumulado no dia)
LOG_EXPENSE   = +5    // lançar despesa
LOG_SALARY    = +15   // registrar salário
LOG_EXTRA     = +8    // renda extra
STREAK_7      = +50   // bônus ao completar 7 dias seguidos
STREAK_30     = +200  // bônus ao completar 30 dias
STREAK_100    = +500  // bônus ao completar 100 dias

// Tabela de níveis (8 níveis)
1. 🌱 Semente        0–199 XP
2. 🌿 Broto          200–499 XP
3. 💰 Poupador       500–999 XP
4. 🛡️ Guardião      1000–1999 XP
5. 📈 Investidor     2000–3999 XP
6. 💎 Acumulador     4000–7999 XP
7. 👑 Magnata        8000–14999 XP
8. 🏆 Milionário     15000+ XP
Funções: calcLevel(xp), xpToNextLevel(xp), addXP(userId, amount, reason).

Arquivos de actions a modificar
Cada server action adiciona XP após salvar no banco:

lib/actions/savings.ts → +XP por economia
lib/actions/expenses.ts → +XP por despesa
lib/actions/salary.ts → +XP por salário
lib/actions/extras.ts → +XP por extra
Novos componentes de UI
components/gamification/XPBar.tsx — barra de XP com nível atual e nome do nível (fica no topo do dashboard, abaixo do header)
components/gamification/LevelBadge.tsx — badge compacto reutilizável (ícone + nível + nome)
Impacto visual
Header: mostra LevelBadge do usuário
Dashboard: XPBar abaixo do streak banner com animação de preenchimento
Fase 2 — Conquistas / Badges (Achievement System)
Mudanças no schema
Novo model UserAchievement:


model UserAchievement {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  key         String   // identificador da conquista
  unlockedAt  DateTime @default(now())
  @@unique([userId, key])
}
Arquivo lib/achievements.ts
Define as ~22 conquistas com: key, title, description, icon, rarity (common/rare/epic/legendary).

Conquistas planejadas:

Key	Ícone	Título	Gatilho
first_save	🥇	Primeiro Passo	Primeira economia registrada
first_expense	📋	Organizado	Primeira despesa lançada
first_salary	💼	Salário Registrado	Primeiro salário
streak_7	⚡	Semana de Fogo	7 dias consecutivos
streak_30	🔥	Mês Inabalável	30 dias consecutivos
streak_100	💎	Cem Dias	100 dias consecutivos
streak_365	🌟	Um Ano Inteiro	365 dias consecutivos
save_1k	🌱	Primeira Semente	R$1.000 acumulados
save_5k	🌿	Crescendo	R$5.000 acumulados
save_10k	🌳	Árvore Firme	R$10.000 acumulados
save_25k	🏅	Um Quarto	R$25.000 acumulados
save_50k	💰	Metade do Caminho	R$50.000 acumulados
save_75k	🚀	Sprint Final	R$75.000 acumulados
save_100k	👑	Meta Atingida!	R$100.000 acumulados
big_day	💥	Grande Salto	Economizou R$1.000+ em um dia
perfect_month	✨	Mês Perfeito	Economizou todos os dias do mês
level_5	📈	Investidor	Alcançou nível 5
level_8	🏆	Milionário	Alcançou nível 8
savings_rate_30	⭐	Taxa Excelente	Taxa de poupança ≥ 30% por 3 meses
consistent_3	📅	Consistência	Economizou em 3 meses seguidos
big_extra	🎁	Renda Extra	Registrou renda extra >= R$500
expense_cutter	✂️	Cortador	Reduziu despesas vs mês anterior
Lógica de check
Função checkAndUnlockAchievements(userId, context) chamada ao final de cada action.
Retorna lista de conquistas recém-desbloqueadas para mostrar popup.

Nova página /conquistas
app/(protected)/conquistas/page.tsx
Grid de cards de conquistas: desbloqueadas (coloridas) vs bloqueadas (cinza/blur)
Filtro por raridade
Data de desbloqueio nas conquistadas
Contador "X/22 conquistas"
Componente popup
components/gamification/AchievementPopup.tsx
Toast especial (diferente do toast normal) com animação de entrada + glow
Mostra ícone grande, título, e XP ganho
Desaparece após 4s
BottomNav
Adicionar item "Troféus" (/conquistas) com ícone de troféu. Colocar um badge de notificação quando há conquistas novas (usando cookie/session).

Fase 3 — Streak Avançado com Escudo (Duolingo Streak Freeze)
Schema — adicionar ao User

streakShields Int @default(0)  // máx 2
maxStreak já foi adicionado na Fase 1.

Lógica do escudo
A cada 7 dias consecutivos completos, o usuário ganha +1 escudo (máx 2)
Se o usuário quebra o streak e tem escudo: streak é preservado, 1 escudo é consumido
Verificação feita ao carregar o dashboard (server component)
Função applyStreakShield(userId) em lib/gamification.ts
Mudanças no dashboard
Banner de streak: mostrar escudos disponíveis como ícones 🛡️
"Você tem 2 escudos — sua sequência está protegida por 2 dias de falta"
Mostrar recorde pessoal: "Seu recorde: 45 dias"
Fase 4 — Desafios Semanais (Missões Dinâmicas)
Schema

model Challenge {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        String   // "weekly" | "monthly"
  key         String   // tipo do desafio
  target      Float    // valor alvo
  current     Float    @default(0)
  xpReward    Int
  startDate   String
  endDate     String
  completed   Boolean  @default(false)
  completedAt DateTime?
}
Tipos de desafio gerados automaticamente
Baseado no histórico do usuário:

save_target — "Guarde R$X esta semana" (target = média semanal * 1.1)
daily_streak — "Mantenha streak por 5 dias seguidos esta semana"
reduce_expenses — "Gaste menos de R$X este mês"
save_milestone — "Chegue a R$X total este mês"
log_all — "Registre todos os dias desta semana"
Função generateWeeklyChallenge(userId) em lib/gamification.ts, chamada ao abrir o app se não há desafio ativo.

Componente
components/gamification/ChallengeCard.tsx — aparece no dashboard com:

Barra de progresso do desafio
Tempo restante (dias)
XP disponível na conclusão
Animação de conclusão + XP reward
Fase 5 — Heatmap de Atividade + Marcos Nomeados
Heatmap (GitHub-style)
components/gamification/ActivityHeatmap.tsx

Grid de 52 semanas × 7 dias (ou últimos 3 meses para mobile)
Células coloridas conforme valor guardado naquele dia:
Cinza: sem registro
Verde claro: R$1–R$99
Verde médio: R$100–R$499
Verde forte: R$500–R$999
Verde intenso / accent: R$1000+
Tooltip ao hover (desktop) mostrando data + valor
Localiza-se na página /conquistas ou em aba no histórico
Marcos na barra de progresso
Modificar components/dashboard/HeroCard.tsx:

Marcadores verticais em 10%, 25%, 50%, 75%, 90%, 100%
Cada marco tem nome ao hover/tap:
10%: "Iniciado" ✓ (se ultrapassado, ícone ✓ verde)
25%: "Um Quarto"
50%: "Metade"
75%: "Sprint Final"
90%: "Quase Lá"
100%: "Meta!"
Celebração especial ao cruzar cada marco (popup efêmero)
"Próximo Marco" card
Substituir ou complementar o ProjectionCard com:

Qual o próximo marco em R$ e %
Quanto falta para ele
Projeção de quando vai chegar baseado na média
Fase 6 — Polimento Visual e Animações
Animação de Level Up
components/gamification/LevelUpModal.tsx

Modal fullscreen temporário (2.5s) com:
Partículas/confetti em CSS puro (keyframes)
Novo nível em destaque
"LEVEL UP! Você é agora um [Nome do Nível]"
XP bar animada preenchendo até novo patamar
Streak Milestone Animation
Ao atingir 7, 30, 100 dias: banner especial no dashboard por 24h
Pequena animação de fogo pulsante no ícone 🔥
Confetti CSS em conquistas
Quando AchievementPopup aparece, confetti de 20 partículas CSS cai da parte superior
Micro-animations já existentes
Melhorar transição da progress bar (já tem transition: width 0.8s cubic-bezier)
Adicionar scale(1.05) no HeroCard ao carregar página pela primeira vez
Arquivos Críticos a Criar/Modificar
Novos arquivos

lib/gamification.ts                           ← lógica central XP/nível/escudo/desafios
lib/achievements.ts                           ← definições das 22 conquistas
lib/actions/gamification.ts                   ← addXP, checkAchievements, applyShield
components/gamification/XPBar.tsx
components/gamification/LevelBadge.tsx
components/gamification/AchievementPopup.tsx
components/gamification/AchievementsGrid.tsx
components/gamification/ChallengeCard.tsx
components/gamification/ActivityHeatmap.tsx
components/gamification/LevelUpModal.tsx
app/(protected)/conquistas/page.tsx
Arquivos existentes a modificar

prisma/schema.prisma                    ← +xp, +level, +maxStreak, +streakShields, +UserAchievement, +Challenge
lib/actions/savings.ts                  ← addXP após save + checkAchievements
lib/actions/expenses.ts                 ← addXP
lib/actions/salary.ts                   ← addXP
lib/actions/extras.ts                   ← addXP
app/(protected)/page.tsx                ← XPBar + ChallengeCard + shield no streak banner
components/dashboard/HeroCard.tsx       ← marcos nomeados na barra
components/ui/BottomNav.tsx             ← +item Troféus
components/ui/Header.tsx                ← +LevelBadge
Ordem de Implementação Recomendada
Schema + migration (Fase 1+2+3+4 schema de uma vez)
lib/gamification.ts + lib/achievements.ts (lógica pura, sem UI)
Integrar XP nas actions (savings, expenses, salary, extras)
XPBar + LevelBadge no dashboard e header
Conquistas: lógica de check + página /conquistas + popup
Streak avançado: escudos + maxStreak no banner
Desafios semanais: geração + ChallengeCard no dashboard
Heatmap na página de conquistas
Marcos na HeroCard
Polimento animado: LevelUpModal + confetti