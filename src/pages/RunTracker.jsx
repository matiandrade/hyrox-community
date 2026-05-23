import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button } from '@/components/ui'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function fmtPace(secsPerKm) {
  if (!secsPerKm || secsPerKm > 1800 || secsPerKm < 0) return '--:--'
  return fmt(secsPerKm)
}

const MAX_SPEED = 43 / 3.6  // m/s — saltos de GPS descartados
const MIN_ACC   = 30         // meters — lecturas ruidosas descartadas

// ─── Component ───────────────────────────────────────────────────────────────

export default function RunTracker() {
  const [phase,     setPhase]     = useState('idle')   // idle | countdown | running | finished
  const [countdown, setCountdown] = useState(3)
  const [elapsed,   setElapsed]   = useState(0)
  const [distance,  setDistance]  = useState(0)        // metros (para re-render)
  const [pace,      setPace]      = useState(null)     // segs/km
  const [splits,    setSplits]    = useState([])
  const [gpsError,  setGpsError]  = useState(null)
  const [history,   setHistory]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('hyrox-run-history') || '[]') }
    catch { return [] }
  })

  // refs para acceso sin stale closures en callbacks de geolocation/interval
  const audioRef     = useRef(null)
  const watchRef     = useRef(null)
  const timerRef     = useRef(null)
  const lastPosRef   = useRef(null)
  const startTimeRef = useRef(null)
  const splitTimeRef = useRef(null)
  const distRef      = useRef(0)
  const splitDistRef = useRef(0)
  const splitsRef    = useRef([])
  const elapsedRef   = useRef(0)
  const paceRef      = useRef(null)

  // ─── Audio ─────────────────────────────────────────────────────────────────

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

  function playCountdown() { beep(660, 0.15) }
  function playStart()     { beep(880, 0.2); beep(880, 0.2, 0.3) }
  function playFanfare()   { [523, 587, 659, 698, 784, 880].forEach((f, i) => beep(f, 0.25, i * 0.18)) }
  function playSplit()     { beep(1047, 0.3) }

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    clearInterval(timerRef.current)
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    timerRef.current = null
    watchRef.current = null
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  // ─── Countdown → Run ───────────────────────────────────────────────────────

  function startCountdown() {
    setPhase('countdown')
    let n = 3
    setCountdown(n)
    playCountdown()
    const iv = setInterval(() => {
      n--
      setCountdown(n)
      if (n > 0) playCountdown()
      if (n <= 0) { clearInterval(iv); beginRun() }
    }, 1000)
  }

  function beginRun() {
    distRef.current      = 0
    splitDistRef.current = 0
    splitsRef.current    = []
    elapsedRef.current   = 0
    paceRef.current      = null
    lastPosRef.current   = null
    startTimeRef.current = Date.now()
    splitTimeRef.current = Date.now()

    setPhase('running')
    setDistance(0)
    setSplits([])
    setPace(null)
    setElapsed(0)
    setGpsError(null)
    playStart()

    timerRef.current = setInterval(() => {
      elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(elapsedRef.current)
    }, 1000)

    if (!navigator.geolocation) { setGpsError('GPS no disponible en este dispositivo'); return }

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (accuracy > MIN_ACC) return

        if (lastPosRef.current) {
          const d  = haversine(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng)
          const dt = (pos.timestamp - lastPosRef.current.ts) / 1000
          if (dt <= 0) return
          if (d / dt > MAX_SPEED) {
            lastPosRef.current = { lat, lng, ts: pos.timestamp }
            return
          }

          distRef.current += d
          setDistance(distRef.current)

          if (d > 0) { paceRef.current = (dt / d) * 1000; setPace(paceRef.current) }

          splitDistRef.current += d
          if (splitDistRef.current >= 1000) {
            const splitSecs = (Date.now() - splitTimeRef.current) / 1000
            const splitPace = splitSecs / (splitDistRef.current / 1000)
            const newSplit  = { km: splitsRef.current.length + 1, time: splitSecs, pace: splitPace }
            splitsRef.current = [...splitsRef.current, newSplit]
            setSplits([...splitsRef.current])
            playSplit()
            splitDistRef.current = 0
            splitTimeRef.current = Date.now()
          }
        }

        lastPosRef.current = { lat, lng, ts: pos.timestamp }
      },
      err => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )
  }

  function finish() {
    stopAll()
    playFanfare()
    setPhase('finished')

    const run = {
      id:       Date.now(),
      date:     new Date().toLocaleDateString('es-AR'),
      distance: Math.round(distRef.current),
      time:     elapsedRef.current,
      pace:     paceRef.current,
      splits:   splitsRef.current,
    }
    const updated = [run, ...history].slice(0, 20)
    setHistory(updated)
    try { localStorage.setItem('hyrox-run-history', JSON.stringify(updated)) } catch {}
  }

  function reset() {
    stopAll()
    setPhase('idle'); setElapsed(0); setDistance(0)
    setPace(null); setSplits([]); setGpsError(null); setCountdown(3)
    distRef.current = 0
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const distKm     = (distance / 1000).toFixed(2)
  const progressPct = Math.min((distance / 8000) * 100, 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card style={{ padding: '28px 24px' }}>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏃</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6, fontSize: '0.95rem' }}>
              GPS pace en tiempo real · Splits por km · Filtro de ruido · Historial local
            </p>
            <Button variant="primary" size="lg" onClick={startCountdown}>Iniciar carrera</Button>
          </div>
        )}

        {phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
              {countdown > 0 ? countdown : '🚀'}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Preparate...</p>
          </div>
        )}

        {(phase === 'running' || phase === 'finished') && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
              {[
                { label: 'Pace',      value: fmtPace(pace), unit: '/km' },
                { label: 'Distancia', value: distKm,        unit: 'km' },
                { label: 'Tiempo',    value: fmt(elapsed),  unit: '' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '14px 6px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'monospace', lineHeight: 1 }}>
                    {m.value}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Progreso HYROX</span><span>{distKm} / 8 km</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 1s linear' }} />
              </div>
            </div>

            {phase === 'running' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="danger" style={{ flex: 1 }} onClick={finish}>Finalizar</Button>
                <Button variant="ghost" onClick={reset}>Cancelar</Button>
              </div>
            )}
            {phase === 'finished' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '16px' }}>🎉 ¡Run completado!</p>
                <Button variant="primary" onClick={reset}>Nueva carrera</Button>
              </div>
            )}
          </>
        )}

        {gpsError && (
          <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center' }}>
            GPS: {gpsError}
          </p>
        )}
      </Card>

      {splits.length > 0 && (
        <Card>
          <div style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '10px' }}>
            Splits
          </div>
          {splits.map(s => (
            <div key={s.km} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Km {s.km}</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{fmtPace(s.pace)} /km</span>
              <span>{fmt(Math.round(s.time))}</span>
            </div>
          ))}
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <div style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '10px' }}>
            Historial
          </div>
          {history.slice(0, 5).map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{r.date}</span>
              <span style={{ fontWeight: 800 }}>{(r.distance / 1000).toFixed(2)} km</span>
              <span>{fmt(r.time)}</span>
              <span style={{ color: 'var(--accent)' }}>{fmtPace(r.pace)} /km</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
