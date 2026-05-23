import { useState, useEffect, useRef } from 'react'
import RunTracker from './RunTracker'
import { Card, Button, SectionHeader } from '@/components/ui'

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXERCISES = [
  {
    id: 1, emoji: '🎿',
    official: 'SkiErg',
    adaptation: 'Pike Push-ups / Flexiones Explosivas',
    desc: 'Flexiones en V (Pike) para hombros o flexiones empujando explosivamente hacia arriba. Emula la demanda de hombros y core del SkiErg.',
  },
  {
    id: 2, emoji: '🐻',
    official: 'Sled Push',
    adaptation: 'Bear Crawls / Sprints Inclinados',
    desc: '30 metros de caminata de oso rozando el suelo, o piques cortos en subida empujando con puntas de los pies. Fatiga de piernas y hombros.',
  },
  {
    id: 3, emoji: '💪',
    official: 'Sled Pull',
    adaptation: 'Remos Australianos en Barra Baja',
    desc: 'Cuerpo rígido como tabla, talones clavados en el suelo, tirá llevando el pecho a la barra. Tracción pura.',
  },
  {
    id: 4, emoji: '🏅',
    official: 'Burpee Broad Jumps',
    adaptation: 'Igual al oficial (sin adaptación)',
    desc: 'El ejercicio rey. Burpee en el suelo, pararse de un salto y saltar largo hacia adelante. Medí 20 metros en la costanera.',
  },
  {
    id: 5, emoji: '🚣',
    official: 'Rowing',
    adaptation: 'Dominadas Pronas o Supinas',
    desc: 'Reemplazamos el volumen del remo por potencia de tracción en barra alta. Ensancha la espalda y trabaja bíceps.',
  },
  {
    id: 6, emoji: '🏋️',
    official: 'Farmers Carry',
    adaptation: 'Walking Lunges / Dead Hang',
    desc: 'Sin peso: Walking Lunges continuos para fatigar piernas bajo tensión, o Dead Hang en barra para reventar el grip.',
  },
  {
    id: 7, emoji: '🦵',
    official: 'Sandbag Lunges',
    adaptation: 'Walking Lunges de Potencia / Estocadas Búlgaras',
    desc: 'Pasos largos hacia adelante. Para más dificultad: Estocadas Búlgaras apoyando un pie en un banco de la costanera.',
  },
  {
    id: 8, emoji: '🏀',
    official: 'Wall Balls',
    adaptation: 'Squat Jumps + Fondos en Paralelas',
    desc: 'Sentadilla explosiva con salto vertical alto, luego directo a paralelas a meter dips. Fatiga piernas + empuje de brazos.',
  },
]

// ─── WOD Timer ────────────────────────────────────────────────────────────────

function WodTimer({ onActiveExIdx }) {
  const [config, setConfig] = useState({ rounds: 8, work: 60, rest: 30 })
  const [status, setStatus] = useState('idle')   // idle | running | done
  const [phase,  setPhase]  = useState('work')   // work | rest
  const [round,  setRound]  = useState(1)
  const [exIdx,  setExIdx]  = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)

  const audioRef = useRef(null)
  const timerRef = useRef(null)
  // All mutable timer state in ref — avoids stale closures inside setInterval
  const ts = useRef({})

  function getCtx() {
    if (!audioRef.current)
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioRef.current
  }

  function beep(freq, dur, delay = 0) {
    const c = getCtx()
    const osc  = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    const t = c.currentTime + delay
    gain.gain.setValueAtTime(0.4, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  function playWork()    { beep(880, 0.2); beep(880, 0.2, 0.3) }
  function playRest()    { beep(440, 0.4) }
  function playWarning() { beep(660, 0.1); beep(660, 0.1, 0.15); beep(660, 0.1, 0.3) }
  function playFinish()  { [523, 587, 659, 698, 784, 880].forEach((f, i) => beep(f, 0.25, i * 0.18)) }

  function start() {
    ts.current = { phase: 'work', round: 1, exIdx: 0, timeLeft: config.work, ...config }
    setStatus('running'); setPhase('work'); setRound(1); setExIdx(0); setTimeLeft(config.work)
    onActiveExIdx(0)
    playWork()

    timerRef.current = setInterval(() => {
      ts.current.timeLeft -= 1
      const tl = ts.current.timeLeft
      setTimeLeft(tl)

      if (tl === 3) playWarning()

      if (tl <= 0) {
        if (ts.current.phase === 'work') {
          ts.current.phase    = 'rest'
          ts.current.timeLeft = ts.current.rest
          setPhase('rest')
          setTimeLeft(ts.current.rest)
          onActiveExIdx(null)
          playRest()
        } else {
          ts.current.exIdx++
          if (ts.current.exIdx >= EXERCISES.length) {
            ts.current.exIdx = 0
            ts.current.round++
            if (ts.current.round > ts.current.rounds) {
              clearInterval(timerRef.current)
              setStatus('done')
              onActiveExIdx(null)
              playFinish()
              return
            }
            setRound(ts.current.round)
          }
          ts.current.phase    = 'work'
          ts.current.timeLeft = ts.current.work
          setExIdx(ts.current.exIdx)
          setPhase('work')
          setTimeLeft(ts.current.work)
          onActiveExIdx(ts.current.exIdx)
          playWork()
        }
      }
    }, 1000)
  }

  function stop() {
    clearInterval(timerRef.current)
    setStatus('idle')
    onActiveExIdx(null)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const totalIntervals = config.rounds * EXERCISES.length
  const doneIntervals  = (round - 1) * EXERCISES.length + exIdx
  const progress       = totalIntervals > 0 ? (doneIntervals / totalIntervals) * 100 : 0
  const currentEx      = EXERCISES[exIdx]

  return (
    <Card accent style={{ marginBottom: '28px' }}>
      <div style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '20px' }}>
        ⏱ Simulador WOD
      </div>

      {status === 'idle' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Rondas',         key: 'rounds', min: 1,  max: 8   },
              { label: 'Trabajo (seg)',   key: 'work',   min: 10, max: 180 },
              { label: 'Descanso (seg)', key: 'rest',   min: 10, max: 120 },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{f.label}</div>
                <input
                  type="number" min={f.min} max={f.max}
                  value={config[f.key]}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: Math.max(f.min, Math.min(f.max, +e.target.value)) }))}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)', borderRadius: '8px',
                    padding: '10px 8px', color: 'var(--text-primary)',
                    fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace',
                    textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={start}>
            🚀 Iniciar WOD ({config.rounds} rondas × {EXERCISES.length} ejercicios)
          </Button>
        </>
      )}

      {status === 'running' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Ronda {round} / {config.rounds}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
          </div>

          <div style={{
            background: phase === 'work' ? 'rgba(255,215,0,0.08)' : 'rgba(59,130,246,0.08)',
            border: `1px solid ${phase === 'work' ? 'rgba(255,215,0,0.4)' : 'rgba(59,130,246,0.4)'}`,
            borderRadius: '12px', padding: '20px 16px', marginBottom: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700, color: phase === 'work' ? 'var(--accent)' : '#60a5fa' }}>
              {phase === 'work' ? `💪 TRABAJO — ${currentEx.official}` : '😮‍💨 DESCANSO'}
            </div>
            {phase === 'work' && (
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                {currentEx.emoji} {currentEx.adaptation}
              </div>
            )}
            <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'monospace', color: phase === 'work' ? 'var(--accent)' : '#60a5fa', lineHeight: 1 }}>
              {timeLeft}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>segundos</div>
          </div>

          <Button variant="secondary" style={{ width: '100%' }} onClick={stop}>Detener WOD</Button>
        </>
      )}

      {status === 'done' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏆</div>
          <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent)', marginBottom: '8px' }}>¡WOD Completado!</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5, fontSize: '0.9rem' }}>
            {config.rounds} rondas × {EXERCISES.length} ejercicios.<br />Eso es HYROX nivel costanera.
          </p>
          <Button variant="primary" onClick={() => { setStatus('idle'); setRound(1); setExIdx(0) }}>
            Nuevo WOD
          </Button>
        </div>
      )}
    </Card>
  )
}

// ─── Exercise Card ─────────────────────────────────────────────────────────────

function ExerciseCard({ ex, isActive }) {
  const [open, setOpen] = useState(false)

  useEffect(() => { if (isActive) setOpen(true) }, [isActive])

  return (
    <div style={{
      border: `1px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px',
      background: isActive ? 'rgba(255,215,0,0.05)' : 'var(--bg-secondary)',
      overflow: 'hidden',
      transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
      boxShadow: isActive ? '0 0 20px rgba(255,215,0,0.12)' : 'none',
    }}>
      <div
        style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '14px' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{
          fontSize: '1.4rem', width: 42, height: 42, borderRadius: '10px',
          background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          {ex.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
            {ex.official}
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.3 }}>
            {ex.adaptation}
          </div>
          {isActive && (
            <span style={{ display: 'inline-block', marginTop: '5px', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 800, background: 'rgba(255,215,0,0.15)', padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px' }}>
              ▶ AHORA
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, paddingTop: '4px' }}>
          {open ? '▲' : '▼'}
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.65, marginTop: '12px' }}>
            {ex.desc}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OutdoorPage() {
  const [activeExIdx, setActiveExIdx] = useState(null)

  return (
    <div>
      <SectionHeader
        title="Outdoor"
        subtitle="HYROX al aire libre — GPS run + simulador de WOD en la costanera."
      />

      {/* Sección 1 — Costanera Run */}
      <section style={{ marginBottom: '48px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          🏃 Costanera Run
        </h3>
        <RunTracker />
      </section>

      {/* Sección 2 — Simulador HYROX Outdoor */}
      <section>
        <h3 style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          🌿 Armá tu HYROX al Aire Libre
        </h3>

        <WodTimer onActiveExIdx={setActiveExIdx} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {EXERCISES.map((ex, i) => (
            <ExerciseCard key={ex.id} ex={ex} isActive={activeExIdx === i} />
          ))}
        </div>
      </section>
    </div>
  )
}
