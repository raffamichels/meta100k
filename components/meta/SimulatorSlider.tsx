'use client'

// Slider reutilizável do Simulador "E Se?" — label, valor atual e sub-label dinâmica
interface SimulatorSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  subLabel?: string
  disabled?: boolean
  onChange: (v: number) => void
}

export default function SimulatorSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  subLabel,
  disabled,
  onChange,
}: SimulatorSliderProps) {
  return (
    <div style={{ marginBottom: 20, opacity: disabled ? 0.4 : 1 }}>
      {/* Label descritiva */}
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>
        {label}
      </div>

      {/* Slider com limites */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 38, textAlign: 'right' }}>
          {format(min)}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: 'var(--accent)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 38 }}>
          {format(max)}
        </span>
      </div>

      {/* Valor atual em destaque */}
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: value > min ? 'var(--accent)' : 'var(--muted)',
          }}
        >
          {format(value)}
        </span>
      </div>

      {/* Sub-label dinâmica com impacto calculado */}
      {subLabel && (
        <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 4, textAlign: 'center' }}>
          {subLabel}
        </div>
      )}
    </div>
  )
}
