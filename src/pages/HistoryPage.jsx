import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Button, SectionHeader, EmptyState, Spinner, useToast } from '@/components/ui'

const FEELINGS = [
  { value: 'Excelente', emoji: '🔥', label: 'Excelente' },
  { value: 'Fuerte',    emoji: '💪', label: 'Fuerte' },
  { value: 'Cansado',   emoji: '🏃', label: 'Cansado' },
  { value: 'Agotado',   emoji: '🥵', label: 'Agotado' },
  { value: 'Molestias', emoji: '🤕', label: 'Molestia' },
]

const FEELING_MAP = { Excelente: '🔥', Fuerte: '💪', Cansado: '🏃', Agotado: '🥵', Molestias: '🤕' }

function pad(n) { return String(n).padStart(2, '0') }
function secondsToDisplay(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

export default function HistoryPage() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { logs, logsLoading, fetchMyLogs, saveLog, deleteLog } = useAppStore()
  const toast = useToast()

  // Stopwatch state
  const [swRunning, setSwRunning] = useState(false)
  const [swAccum, setSwAccum]     = useState(0)
  const [swDisplay, setSwDisplay] = useState('00:00:00.00')
  const swStartRef  = useRef(0)
  const swIntervalRef = useRef(null)

  // Form state
  const today = new Date().toISOString().substring(0, 10)
  const [form, setForm] = useState({
    plan_name: '',
    date: today,
    hours: 0,
    minutes: 45,
    seconds: 0,
    feeling: 'Excelente',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  // Load logs on mount
  useEffect(() => {
    if (user) fetchMyLogs(user.id)
  }, [user])

  // Pre-fill from TrainPage "Iniciar WOD"
  useEffect(() => {
    if (location.state?.workoutName) {
      setForm(f => ({ ...f, plan_name: location.state.workoutName }))
      startStopwatch()
      toast('WOD cargado — ¡cronómetro iniciado!')
    }
  }, [])

  // Stopwatch
  const startStopwatch = () => {
    if (swRunning) return
    setSwRunning(true)
    swStartRef.current = Date.now() - swAccum
    swIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - swStartRef.current
      const h   = Math.floor(elapsed / 3600000)
      const m   = Math.floor((elapsed % 3600000) / 60000)
      const s   = Math.floor((elapsed % 60000) / 1000)
      const cs  = Math.floor((elapsed % 1000) / 10)
      setSwDisplay(`${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`)
      setSwAccum(elapsed)
    }, 50)
  }

  const pauseStopwatch = () => {
    if (!swRunning) return
    setSwRunning(false)
    clearInterval(swIntervalRef.current)
  }

  const resetStopwatch = () => {
    setSwRunning(false)
    clearInterval(swIntervalRef.current)
    setSwAccum(0)
    setSwDisplay('00:00:00.00')
  }

  const useStopwatchTime = () => {
    const parts = swDisplay.split(':')
    const h = parseInt(parts[0]) || 0
    const m = parseInt(parts[1]) || 0
    const s = parseInt(parts[2]?.split('.')[0]) || 0
    setForm(f => ({ ...f, hours: h, minutes: m, seconds: s }))
    toast('Tiempo copiado al formulario')
  }

  // Save result
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.plan_name.trim()) { toast('Ingresá el nombre de la rutina'); return }
    setSaving(true)
    const { error } = await saveLog(user.id, {
      plan_name: form.plan_name,
      date: form.date,
      hours: form.hours,
      minutes: form.minutes,
      seconds: form.seconds,
      feeling: form.feeling,
      notes: form.notes,
      is_public: true
    })
    if (error) { toast('Error al guardar', 'error'); setSaving(false); return }
    toast('Entrenamiento guardado en el historial ✅')
    setForm({ plan_name: '', date: today, hours: 0, minutes: 45, seconds: 0, feeling: 'Excelente', notes: '' })
    setSaving(false)
  }

  const handleDelete = async (logId) => {
    if (!window.confirm('¿Eliminar este registro?')) return
    await deleteLog(logId)
    toast('Registro eliminado')
  }

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <SectionHeader title="Rendimiento e Historial" subtitle="Cronometrá tus entrenamientos y registrá tus progresos." />

      {/* STOPWATCH */}
      <div style={{
        background: 'linear-gradient(135deg, #161922 0%, #0d0f14 100%)',
        border: '2px solid var(--accent)', borderRadius: 'var(--card-radius)',
        padding: '28px', textAlign: 'center', marginBottom: '28px',
        boxShadow: '0 0 25px rgba(255,215,0,0.1)'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '8px' }}>
          Cronómetro Live
        </div>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: '3.5rem', fontWeight: 'bold',
          color: 'var(--accent)', margin: '8px 0 24px',
          textShadow: '0 0 15px rgba(255,215,0,0.25)', letterSpacing: '2px'
        }}>
          {swDisplay}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="success" onClick={startStopwatch} disabled={swRunning}>▶ Iniciar</Button>
          <button onClick={pauseStopwatch} style={{
            padding: '11px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'var(--warning)', color: 'var(--bg-primary)', fontWeight: 700, fontSize: '0.95rem'
          }}>⏸ Pausar</button>
          <Button variant="danger" onClick={resetStopwatch}>↺ Reiniciar</Button>
          <Button variant="primary" onClick={useStopwatchTime}>Usar Tiempo →</Button>
        </div>
      </div>

      {/* LAYOUT: Form + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }} className="history-grid">

        {/* FORM */}
        <Card accent>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '20px' }}>Registrar Entrenamiento</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <FormField label="Nombre de Rutina">
              <input value={form.plan_name} onChange={setF('plan_name')} required
                placeholder="Ej. HYROX Full Simulation, Mi WOD..."
                style={inputStyle} />
            </FormField>

            <FormField label="Fecha">
              <input type="date" value={form.date} onChange={setF('date')} required style={inputStyle} />
            </FormField>

            <div>
              <label style={labelStyle}>Tiempo Empleado</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {[
                  { key: 'hours',   label: 'Horas',    max: 9 },
                  { key: 'minutes', label: 'Minutos',  max: 59 },
                  { key: 'seconds', label: 'Segundos', max: 59 },
                ].map(f => (
                  <div key={f.key}>
                    <select value={form[f.key]} onChange={setF(f.key)} style={inputStyle}>
                      {Array.from({ length: f.max + 1 }, (_, i) => (
                        <option key={i} value={i}>{pad(i)}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>{f.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Sensaciones / Esfuerzo</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' }}>
                {FEELINGS.map(f => (
                  <button type="button" key={f.value} onClick={() => setForm(prev => ({ ...prev, feeling: f.value }))}
                    style={{
                      padding: '10px 4px', borderRadius: '8px', border: '1px solid',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      background: form.feeling === f.value ? 'rgba(255,215,0,0.1)' : 'var(--bg-tertiary)',
                      borderColor: form.feeling === f.value ? 'var(--accent)' : 'var(--border-color)',
                      transition: 'all 0.2s'
                    }}>
                    <span style={{ fontSize: '1.4rem' }}>{f.emoji}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: form.feeling === f.value ? 'var(--accent)' : 'var(--text-secondary)' }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Notas del Entrenamiento">
              <textarea value={form.notes} onChange={setF('notes')} rows={3}
                placeholder="Comentarios sobre pesos, split de tiempos, ritmo, sensaciones..."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </FormField>

            <Button type="submit" variant="success" size="lg" loading={saving} style={{ width: '100%' }}>
              💾 Guardar en Historial
            </Button>
          </form>
        </Card>

        {/* HISTORY LIST */}
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '20px' }}>Historial de Sesiones</h3>
          {logsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Spinner size={28} color="var(--accent)" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState icon="📋" title="Sin entrenamientos aún" subtitle="Registrá tu primer sesión usando el formulario" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {logs.map(log => (
                <HistoryCard key={log.id} log={log} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .history-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================
function HistoryCard({ log, onDelete }) {
  const formattedDate = log.date
    ? new Date(log.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--card-radius)', padding: '20px', position: 'relative' }}>
      <button onClick={() => onDelete(log.id)} style={{
        position: 'absolute', top: '16px', right: '16px',
        width: 28, height: 28, borderRadius: '6px',
        border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.1)',
        color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem'
      }}>✕</button>

      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px', paddingRight: '36px' }}>
        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{log.plan_name}</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{formattedDate}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tiempo Total</div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            {secondsToDisplay(log.time_seconds)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem' }}>
          <span>{FEELING_MAP[log.feeling] || '💪'}</span>
          <span style={{ fontWeight: 700 }}>{log.feeling?.toUpperCase()}</span>
        </div>
      </div>

      {log.notes && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid var(--border-color)', lineHeight: 1.5 }}>
          {log.notes}
        </p>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--text-secondary)', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: '6px'
}

const inputStyle = {
  width: '100%', background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)', borderRadius: '8px',
  padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem',
  outline: 'none', fontFamily: 'inherit'
}
