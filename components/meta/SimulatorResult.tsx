'use client'

// Painel de resultado do Simulador "E Se?" — exibe projeção atual ou ajustada

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatDate(date: Date): string {
  return `${MONTHS_PT[date.getMonth()]}/${date.getFullYear()}`
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export type ForwardResult =
  | { possible: false }
  | {
      possible: true
      newMonthlyAvg: number
      monthsToGoal: number
      targetDate: Date
      monthsSaved: number | null
      moneySaved: number | null
    }

interface SimulatorResultProps {
  mode: 'forward' | 'inverse'
  isDefault: boolean
  forwardResult: ForwardResult | null
  inverseResult: { required: number; difference: number; months: number } | null
  avgMonthlySavings: number
}

export default function SimulatorResult({
  mode,
  isDefault,
  forwardResult,
  inverseResult,
  avgMonthlySavings,
}: SimulatorResultProps) {
  const baseCard = {
    background: 'rgba(200,240,96,0.06)',
    border: '1px solid rgba(200,240,96,0.2)',
    borderRadius: 16,
    padding: 20,
    minHeight: 160,
  }

  // ── Modo inverso ──────────────────────────────────────────────────────────
  if (mode === 'inverse') {
    if (!inverseResult) {
      return (
        <div style={baseCard}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            Cálculo inverso
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Selecione uma data alvo para ver quanto você precisaria guardar por mês.
          </div>
        </div>
      )
    }

    const isMore = inverseResult.difference > 0
    return (
      <div style={{ ...baseCard, background: 'rgba(96,212,240,0.06)', border: '1px solid rgba(96,212,240,0.25)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
          Para atingir a meta nessa data
        </div>
        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--accent2)' }}>
          {fmt(inverseResult.required)}
          <span style={{ fontSize: 14, fontWeight: 400 }}>/mês</span>
        </div>
        <div style={{ fontSize: 13, color: isMore ? 'var(--danger)' : 'var(--success)', marginTop: 8, fontWeight: 600 }}>
          {isMore
            ? `+${fmt(inverseResult.difference)} vs hoje`
            : `${fmt(Math.abs(inverseResult.difference))} a menos que hoje`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          em {inverseResult.months} {inverseResult.months === 1 ? 'mês' : 'meses'}
        </div>
      </div>
    )
  }

  // ── Modo forward ──────────────────────────────────────────────────────────
  if (!forwardResult) return null

  // Média atual zerada: impossível calcular projeção de base
  if (!forwardResult.possible) {
    return (
      <div style={{ ...baseCard, background: 'rgba(240,96,96,0.06)', border: '1px solid rgba(240,96,96,0.3)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, color: 'var(--danger)', fontWeight: 500 }}>
          Com esses números, a meta não seria atingida no prazo calculável.
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          Tente aumentar a poupança extra.
        </div>
      </div>
    )
  }

  const { newMonthlyAvg, targetDate, monthsSaved } = forwardResult
  const isImproved = monthsSaved !== null && monthsSaved > 0

  // Estado padrão: todos os sliders em zero
  if (isDefault) {
    return (
      <div style={baseCard}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
          Cenário atual
        </div>
        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--accent2)' }}>
          📅 {formatDate(targetDate)}
        </div>
        {avgMonthlySavings > 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
            Guardando {fmt(avgMonthlySavings)}/mês em média
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, fontStyle: 'italic' }}>
          ← Ajuste os controles para explorar cenários
        </div>
      </div>
    )
  }

  // Estado com ajustes
  return (
    <div
      style={{
        ...baseCard,
        border: isImproved ? '1px solid rgba(200,240,96,0.45)' : '1px solid rgba(200,240,96,0.2)',
        background: isImproved ? 'rgba(200,240,96,0.09)' : 'rgba(200,240,96,0.04)',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
        Com seus ajustes
      </div>
      <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>
        📅 {formatDate(targetDate)}
      </div>
      {isImproved && (
        <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600, marginTop: 6 }}>
          {monthsSaved} {monthsSaved === 1 ? 'mês' : 'meses'} mais cedo 🎉
        </div>
      )}
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
        💰 {fmt(newMonthlyAvg)}/mês médio
        {avgMonthlySavings > 0 && (
          <span style={{ color: 'var(--accent2)' }}>
            {' '}(+{fmt(newMonthlyAvg - avgMonthlySavings)} vs hoje)
          </span>
        )}
      </div>
    </div>
  )
}
