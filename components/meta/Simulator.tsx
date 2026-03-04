'use client'

// Simulador "E Se?" — componente principal, 100% client-side
// Recebe dados reais como props e gerencia estado dos controles localmente
import { useState, useMemo } from 'react'
import SimulatorSlider from './SimulatorSlider'
import SimulatorResult, { type ForwardResult } from './SimulatorResult'

interface SimulatorProps {
  totalSaved: number
  goal: number
  avgMonthlySavings: number
  avgSalary: number
  avgMonthlyExpenses: number
}

// Adiciona meses a uma data sem mutação
function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// Diferença em meses entre duas datas (arredondada para baixo)
function differenceInMonths(future: Date, now: Date): number {
  return (
    (future.getFullYear() - now.getFullYear()) * 12 +
    (future.getMonth() - now.getMonth())
  )
}

export default function Simulator({
  totalSaved,
  goal,
  avgMonthlySavings,
  avgSalary,
  avgMonthlyExpenses,
}: SimulatorProps) {
  // ── Estado dos controles ─────────────────────────────────────────────────
  const [extra, setExtra] = useState(0)                  // R$ a mais/mês
  const [expenseReduction, setExpenseReduction] = useState(0) // 0–0.5 (0%–50%)
  const [incomeGrowth, setIncomeGrowth] = useState(0)    // 0–1.0 (0%–100%)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [mode, setMode] = useState<'forward' | 'inverse'>('forward')

  const remaining = Math.max(goal - totalSaved, 0)
  const goalReached = totalSaved >= goal

  // ── Cálculo da projeção simulada (modo forward) ──────────────────────────
  const forwardResult = useMemo((): ForwardResult => {
    // Economia dos gastos reduzidos converte-se integralmente em poupança
    const savingsFromExpenses = avgMonthlyExpenses * expenseReduction
    // 50% do aumento de renda vira poupança (taxa conservadora)
    const savingsFromIncome = avgSalary * incomeGrowth * 0.5
    const newMonthlyAvg = avgMonthlySavings + extra + savingsFromExpenses + savingsFromIncome

    if (newMonthlyAvg <= 0) return { possible: false }

    const monthsToGoal = Math.ceil(remaining / newMonthlyAvg)
    const projectedDate = addMonths(new Date(), monthsToGoal)

    const currentMonthsToGoal =
      avgMonthlySavings > 0 ? Math.ceil(remaining / avgMonthlySavings) : null
    const monthsSaved =
      currentMonthsToGoal !== null ? currentMonthsToGoal - monthsToGoal : null

    return {
      possible: true,
      newMonthlyAvg,
      monthsToGoal,
      targetDate: projectedDate,
      monthsSaved,
      moneySaved: monthsSaved !== null ? monthsSaved * newMonthlyAvg : null,
    }
  }, [extra, expenseReduction, incomeGrowth, remaining, avgMonthlySavings, avgMonthlyExpenses, avgSalary])

  // ── Cálculo inverso (modo: quando quero atingir) ─────────────────────────
  const inverseResult = useMemo(() => {
    if (!targetDate) return null
    const months = differenceInMonths(targetDate, new Date())
    if (months <= 0) return null
    const required = Math.ceil(remaining / months)
    return { required, difference: required - avgMonthlySavings, months }
  }, [targetDate, remaining, avgMonthlySavings])

  const isDefaultState = extra === 0 && expenseReduction === 0 && incomeGrowth === 0

  // ── Salva última simulação no localStorage (para conquista Profecia Cumprida) ──
  function trackSimulation() {
    try {
      localStorage.setItem('meta100k_simulator_used', 'true')
      if (forwardResult.possible && forwardResult.targetDate) {
        const d = forwardResult.targetDate
        const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
        localStorage.setItem(
          'meta100k_last_simulation',
          JSON.stringify({
            targetDate: `${months[d.getMonth()]}/${d.getFullYear()}`,
            savedAt: new Date().toISOString().split('T')[0],
          })
        )
      }
    } catch { /* localStorage indisponível */ }
  }

  // Wrapper que aciona o tracking ao interagir com um slider
  function withTracking(setter: (v: number) => void) {
    return (v: number) => {
      setter(v)
      trackSimulation()
    }
  }

  // Valor do input[type=month] para o modo inverso
  const targetDateStr = targetDate
    ? targetDate.toISOString().split('T')[0].slice(0, 7)
    : ''

  return (
    <div style={{ marginTop: 32 }}>
      {/* Título da seção */}
      <div
        style={{
          fontFamily: 'var(--font-syne), sans-serif',
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--muted)',
          marginBottom: 14,
        }}
      >
        ✨ Simulador &quot;E Se?&quot;
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 24,
        }}
      >
        {/* Estado: meta já atingida */}
        {goalReached ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
              Você já atingiu sua meta!
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              O simulador está disponível para explorar uma nova meta.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Ajuste os controles e veja como muda sua projeção em tempo real
            </div>

            {/* Toggle de modo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button
                onClick={() => setMode('forward')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1px solid ${mode === 'forward' ? 'var(--accent)' : 'var(--border)'}`,
                  background: mode === 'forward' ? 'rgba(200,240,96,0.12)' : 'transparent',
                  color: mode === 'forward' ? 'var(--accent)' : 'var(--muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Simular ajustes
              </button>
              <button
                onClick={() => setMode('inverse')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1px solid ${mode === 'inverse' ? 'var(--accent2)' : 'var(--border)'}`,
                  background: mode === 'inverse' ? 'rgba(96,212,240,0.12)' : 'transparent',
                  color: mode === 'inverse' ? 'var(--accent2)' : 'var(--muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quando quero atingir
              </button>
            </div>

            {/* Layout principal: controles + resultado
                .simulator-layout → no desktop: grid 2 colunas (3fr | 2fr)
                No mobile: empilhado, resultado aparece primeiro */}
            <div className="simulator-layout">

              {/* Resultado aparece primeiro no DOM para ficar acima no mobile */}
              <div className="simulator-result-panel">
                <SimulatorResult
                  mode={mode}
                  isDefault={isDefaultState}
                  forwardResult={mode === 'forward' ? forwardResult : null}
                  inverseResult={mode === 'inverse' ? inverseResult : null}
                  avgMonthlySavings={avgMonthlySavings}
                />
              </div>

              {/* Controles */}
              <div className="simulator-controls">
                {mode === 'forward' ? (
                  <>
                    <SimulatorSlider
                      label="💰 Quanto a mais por mês você consegue guardar?"
                      value={extra}
                      min={0}
                      max={2000}
                      step={50}
                      format={(v) => `+ R$ ${v.toLocaleString('pt-BR')}`}
                      onChange={withTracking(setExtra)}
                    />
                    <SimulatorSlider
                      label="✂️ Em quanto você reduziria seus gastos mensais?"
                      value={expenseReduction}
                      min={0}
                      max={0.5}
                      step={0.05}
                      format={(v) => `${(v * 100).toFixed(0)}%`}
                      subLabel={
                        expenseReduction > 0 && avgMonthlyExpenses > 0
                          ? `Economizaria ~R$ ${(avgMonthlyExpenses * expenseReduction).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês em gastos`
                          : undefined
                      }
                      onChange={withTracking(setExpenseReduction)}
                    />
                    <SimulatorSlider
                      label="📈 E se sua renda crescer?"
                      value={incomeGrowth}
                      min={0}
                      max={1}
                      step={0.05}
                      format={(v) => `+${(v * 100).toFixed(0)}%`}
                      subLabel={
                        incomeGrowth > 0 && avgSalary > 0
                          ? `Salário médio R$ ${avgSalary.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} → R$ ${(avgSalary * (1 + incomeGrowth)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} · Simulando 50% do aumento vira poupança`
                          : undefined
                      }
                      onChange={withTracking(setIncomeGrowth)}
                    />

                  </>
                ) : (
                  /* Modo inverso: date picker */
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
                      Quero atingir a meta em:
                    </div>
                    <input
                      type="month"
                      value={targetDateStr}
                      min={new Date().toISOString().split('T')[0].slice(0, 7)}
                      onChange={(e) => {
                        setTargetDate(e.target.value ? new Date(e.target.value + '-01') : null)
                        trackSimulation()
                      }}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        color: 'var(--text)',
                        fontSize: 14,
                        width: '100%',
                        maxWidth: 220,
                        outline: 'none',
                      }}
                    />
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                      Calculamos quanto você precisa guardar por mês para atingir a meta nessa data.
                    </div>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}
