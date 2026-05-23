import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Button, SectionHeader, EmptyState, useToast } from '@/components/ui'
import RunTracker from './RunTracker'

// ============================================
// DATA — mismo contenido que el HTML original
// ============================================
const HYROX_EXERCISES = [
  {
    id: 'ex-run', nombre: 'Run (Carrera)', categoria: 'cardio',
    descShort: 'La columna vertebral de la prueba. 1 km antes de cada estación.',
    sugerido: '1 km x 8 veces',
    datosClave: { distancia: '1000 metros por ronda', carga: 'Peso corporal', estandar: 'Circuito plano marcado' },
    consejos: [
      'Establecé un ritmo (pace) controlado. Empezar demasiado rápido arruinará tus estaciones de fuerza.',
      'Usá el tramo de carrera para recuperar el aliento y estabilizar las pulsaciones.',
      'Entrenás transiciones: correr después de un ejercicio pesado requiere memoria muscular específica.'
    ]
  },
  {
    id: 'ex-skierg', nombre: 'SkiErg (Estación 1)', categoria: 'cardio',
    descShort: 'Simulación de esquí que exige resistencia en el tren superior y fuerza del core.',
    sugerido: '1000 metros',
    datosClave: { distancia: '1000 metros', carga: 'Resistencia ajustable (damper 4-7)', estandar: 'Completar la distancia en monitor' },
    consejos: [
      'No usés solo los brazos. Iniciá el tirón usando el peso del cuerpo, flexionando cadera y rodillas.',
      'Mantené el core rígido y extendé completamente los brazos arriba para maximizar el rango.',
      'Establecé un ritmo estable. Es la primera estación, no te quemes en los primeros 3 minutos.'
    ]
  },
  {
    id: 'ex-sled-push', nombre: 'Sled Push (Estación 2)', categoria: 'fuerza',
    descShort: 'Empuje de trineo pesado. Máximo esfuerzo muscular de piernas y glúteos.',
    sugerido: '50 metros (4x12.5m)',
    datosClave: { distancia: '50 metros', carga: 'Open Masc: 152 kg | Fem: 102 kg', estandar: 'Toda la base del trineo cruza la línea' },
    consejos: [
      'Mantené los brazos completamente rectos para transferir la fuerza de las piernas al trineo.',
      'Mantené la cadera baja y el cuerpo a unos 45 grados respecto al suelo.',
      'Pasos cortos, firmes y rápidos. Mantené el trineo en movimiento continuo.'
    ]
  },
  {
    id: 'ex-sled-pull', nombre: 'Sled Pull (Estación 3)', categoria: 'fuerza',
    descShort: 'Arrastre de trineo con cuerda. Foco intenso en tren superior y cadena posterior.',
    sugerido: '50 metros (4x12.5m)',
    datosClave: { distancia: '50 metros', carga: 'Open Masc: 103 kg | Fem: 78 kg', estandar: 'El trineo entra completamente a la caja de meta' },
    consejos: [
      'Usá el peso corporal. Inclinarte hacia atrás y tirar con tu peso, no solo con los brazos.',
      'Mantené los pies firmes en la plataforma de agarre antideslizante.',
      'Recogé la cuerda rápido con manos alternadas, evitando pisarla.'
    ]
  },
  {
    id: 'ex-burpee-broad', nombre: 'Burpee Broad Jumps (Estación 4)', categoria: 'mixto',
    descShort: 'Burpee clásico combinado con salto horizontal para avanzar distancia.',
    sugerido: '80 metros',
    datosClave: { distancia: '80 metros', carga: 'Peso corporal', estandar: 'Pecho toca el suelo, pies detrás de línea antes del salto' },
    consejos: [
      'Encontrá un ritmo sostenible. No te apures en la caída ni te levantes bruscamente.',
      'Usá los brazos activamente al levantarte para impulsarte en el salto horizontal.',
      'Saltos medianos y consistentes en lugar de forzar saltos máximos.'
    ]
  },
  {
    id: 'ex-rowing', nombre: 'Rowing (Estación 5)', categoria: 'cardio',
    descShort: 'Remo indoor de cuerpo completo enfocado en resistencia y distribución de fuerza.',
    sugerido: '1000 metros',
    datosClave: { distancia: '1000 metros', carga: 'Damper regulado (sugerido 5-6)', estandar: 'Completar la distancia en monitor' },
    consejos: [
      'Secuencia: empujá con piernas, incliná la espalda (core) y jalá el manillar al esternón.',
      'En el retorno: extendé brazos, incliná torso hacia adelante, flexioná las piernas.',
      'Controlá el ritmo respiratorio. Inspirá en flexión, exhalá con potencia en extensión.'
    ]
  },
  {
    id: 'ex-farmers-carry', nombre: 'Farmers Carry (Estación 6)', categoria: 'fuerza',
    descShort: 'Caminar cargando dos kettlebells pesadas. Grip y core de acero.',
    sugerido: '200 metros (4x50m)',
    datosClave: { distancia: '200 metros', carga: 'Open Masc: 2x24 kg | Fem: 2x16 kg', estandar: 'Cruzar líneas delimitadas cargando ambas pesas' },
    consejos: [
      'Postura erguida: hombros hacia atrás y abajo (retracción escapular), core fuertemente activo.',
      'Pasos cortos, rápidos y rítmicos. Evitá zancadas largas.',
      'Si el agarre falla, apoyá controladamente, descansá sacudiendo los brazos y volvé a levantarlas.'
    ]
  },
  {
    id: 'ex-sandbag-lunges', nombre: 'Sandbag Lunges (Estación 7)', categoria: 'mixto',
    descShort: 'Estocadas dinámicas cargando un saco de arena sobre la espalda/hombros.',
    sugerido: '100 metros (4x25m)',
    datosClave: { distancia: '100 metros', carga: 'Open Masc: 20 kg | Fem: 10 kg', estandar: 'Rodilla trasera hace contacto con el suelo en cada paso' },
    consejos: [
      'Colocá el saco balanceado en tu parte alta de la espalda o detrás del cuello.',
      'La rodilla del pie trasero debe tocar suavemente el suelo en cada repetición para que sea válida.',
      'Mantené el pecho arriba e impulsate con el talón del pie delantero.'
    ]
  },
  {
    id: 'ex-wall-balls', nombre: 'Wall Balls (Estación 8)', categoria: 'mixto',
    descShort: 'Lanzamientos de balón medicinal a blanco tras una sentadilla profunda.',
    sugerido: '100 repeticiones',
    datosClave: { repeticiones: '100 lanzamientos válidos', carga: 'Open Masc: 9 kg (3m) | Fem: 6 kg (2.7m)', estandar: 'Sentadilla profunda, balón toca el blanco' },
    consejos: [
      'Dividí las 100 reps en series manejables (4x25 o 5x20) con descansos cortos de 5-10 segundos.',
      'Usá la inercia de la extensión de piernas para lanzar el balón.',
      'Mantené el balón pegado a la barbilla durante la sentadilla.'
    ]
  }
]

const DEFAULT_PRESETS = [
  {
    id: 'preset-full-simulation',
    nombre: 'HYROX Full Simulation',
    descripcion: 'Simulación completa oficial de la carrera HYROX en el orden real.',
    ejercicios: [
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Carrera inicial' },
      { nombre: 'SkiErg (Estación 1)', series: 1, valor: '1000 m', peso: 'Damper 6', notas: 'Estación 1' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 1' },
      { nombre: 'Sled Push (Estación 2)', series: 1, valor: '50 m', peso: '152kg / 102kg', notas: 'Estación 2' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 2' },
      { nombre: 'Sled Pull (Estación 3)', series: 1, valor: '50 m', peso: '103kg / 78kg', notas: 'Estación 3' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 3' },
      { nombre: 'Burpee Broad Jumps (Estación 4)', series: 1, valor: '80 m', peso: 'Corporal', notas: 'Estación 4' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 4' },
      { nombre: 'Rowing (Estación 5)', series: 1, valor: '1000 m', peso: 'Damper 6', notas: 'Estación 5' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 5' },
      { nombre: 'Farmers Carry (Estación 6)', series: 1, valor: '200 m', peso: '2x24kg / 2x16kg', notas: 'Estación 6' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 6' },
      { nombre: 'Sandbag Lunges (Estación 7)', series: 1, valor: '100 m', peso: '20kg / 10kg', notas: 'Estación 7' },
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Transición 7' },
      { nombre: 'Wall Balls (Estación 8)', series: 1, valor: '100 reps', peso: '9kg / 6kg', notas: 'Estación Final' }
    ]
  },
  {
    id: 'preset-costanera-circuit',
    nombre: 'Costanera Circuit',
    descripcion: 'Circuito dinámico de resistencia y potencia combinando intervalos de running.',
    ejercicios: [
      { nombre: 'Entrada en calor (Trote)', series: 1, valor: '10 min', peso: '', notas: 'Trote suave de adaptación' },
      { nombre: 'Run (Carrera)', series: 4, valor: '800 m', peso: '', notas: 'Pace sostenido de WOD' },
      { nombre: 'Burpee Broad Jumps (Estación 4)', series: 4, valor: '20 reps', peso: 'Corporal', notas: 'Zancadas explosivas' },
      { nombre: 'Farmers Carry (Estación 6)', series: 4, valor: '200 m', peso: 'KB Medianas', notas: 'Trabajo de agarre' },
      { nombre: 'Sandbag Lunges (Estación 7)', series: 4, valor: '20 reps', peso: 'Mochila o saco', notas: '10 por pierna' },
      { nombre: 'Wall Balls (Estación 8)', series: 4, valor: '20 reps', peso: 'Balón medicina', notas: 'Sentadilla profunda' },
      { nombre: 'Vuelta a la calma (Enfriamiento)', series: 1, valor: '8 min', peso: '', notas: 'Trote regenerativo y elongación' }
    ]
  },
  {
    id: 'preset-ocr-grip-engine',
    nombre: 'OCR Grip + Engine',
    descripcion: 'WOD centrado en fuerza de tracción, agarre y volumen cardiovascular.',
    ejercicios: [
      { nombre: 'Run (Carrera)', series: 1, valor: '1 km', peso: '', notas: 'Fase de activación' },
      { nombre: 'Farmers Carry (Estación 6)', series: 3, valor: '200 m', peso: 'Carga alta', notas: 'Agarre pesado' },
      { nombre: 'Sled Pull (Estación 3)', series: 3, valor: '50 m', peso: 'Carga media', notas: 'Jalar continuo' },
      { nombre: 'Rowing (Estación 5)', series: 1, valor: '1000 m', peso: '', notas: 'Fase aeróbica dura' },
      { nombre: 'Burpee Broad Jumps (Estación 4)', series: 1, valor: '80 m', peso: 'Corporal', notas: 'Salto dinámico' },
      { nombre: 'Core final (Planchas/Giros)', series: 3, valor: '5 min', peso: '', notas: 'Core y estabilidad' }
    ]
  },
  {
    id: 'preset-running-intervals',
    nombre: 'Running Intervals',
    descripcion: 'Trabajo fraccionado clásico enfocado en mejorar la velocidad de carrera base.',
    ejercicios: [
      { nombre: 'Entrada en calor (Trote)', series: 1, valor: '2 km', peso: '', notas: 'Trote progresivo' },
      { nombre: 'Run (Carrera)', series: 5, valor: '800 m', peso: '', notas: 'Ritmo rápido (Vo2 Max)' },
      { nombre: 'Descanso Activo (Caminata)', series: 5, valor: '2 min', peso: '', notas: 'Recuperación de FC' },
      { nombre: 'Vuelta a la calma (Enfriamiento)', series: 1, valor: '1.5 km', peso: '', notas: 'Trote regenerativo lento' }
    ]
  }
]

const BADGE_VARIANTS = { cardio: 'cardio', fuerza: 'fuerza', mixto: 'mixto' }
const BADGE_COLORS = {
  cardio: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '#3b82f6' },
  fuerza: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '#f59e0b' },
  mixto:  { bg: 'rgba(167,139,250,0.15)', color: '#c084fc', border: '#a78bfa' },
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function TrainPage() {
  const [activeTab, setActiveTab] = useState('planificador') // 'planificador' | 'ejercicios' | 'presets'
  const [activePlan, setActivePlan] = useState([])
  const [planName, setPlanName] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [detailModal, setDetailModal] = useState(null)
  const [savedPlans, setSavedPlans] = useState([])

  const { user, profile } = useAuthStore()
  const { savePlan, fetchMyPlans, plans, deletePlan } = useAppStore()
  const toast = useToast()
  const navigate = useNavigate()

  const weightUnit = profile?.weight_unit || 'kg'

  useEffect(() => {
    if (user) fetchMyPlans(user.id)
  }, [user])

  useEffect(() => {
    setSavedPlans(plans)
  }, [plans])

  // --- PLAN ACTIONS ---
  const addExercise = (nombre, valor = '1 km') => {
    setActivePlan(prev => [...prev, { nombre, series: 1, valor, peso: '', notas: '' }])
    toast(`${nombre} agregado al plan`)
  }

  const removeExercise = (index) => {
    setActivePlan(prev => prev.filter((_, i) => i !== index))
  }

  const moveExercise = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= activePlan.length) return
    const next = [...activePlan]
    ;[next[index], next[target]] = [next[target], next[index]]
    setActivePlan(next)
  }

  const updateExercise = (index, key, value) => {
    setActivePlan(prev => prev.map((item, i) =>
      i === index ? { ...item, [key]: key === 'series' ? parseInt(value) || 1 : value } : item
    ))
  }

  const clearPlan = () => {
    if (activePlan.length === 0) return
    if (window.confirm('¿Limpiar todo el plan activo?')) {
      setActivePlan([])
      setPlanName('')
    }
  }

  const handleSavePlan = async () => {
    if (activePlan.length === 0) { toast('Agregá al menos un ejercicio'); return }
    if (!planName.trim()) { toast('Asigná un nombre al plan'); return }
    const { error } = await savePlan(user.id, planName.trim(), activePlan)
    if (error) { toast('Error al guardar', 'error'); return }
    toast('Plan guardado en la nube ☁️')
    fetchMyPlans(user.id)
  }

  const loadPlan = (plan) => {
    setActivePlan(JSON.parse(JSON.stringify(plan.exercises)))
    setPlanName(plan.name)
    setActiveTab('planificador')
    toast(`Cargado: ${plan.name}`)
  }

  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`¿Eliminar "${planName}"?`)) return
    await deletePlan(planId)
    toast('Plan eliminado')
  }

  const loadPreset = (preset) => {
    setActivePlan(JSON.parse(JSON.stringify(preset.ejercicios)))
    setPlanName(preset.nombre)
    setActiveTab('planificador')
    toast(`Preset "${preset.nombre}" cargado`)
  }

  const startWOD = () => {
    if (activePlan.length === 0) { toast('El plan está vacío'); return }
    navigate('/history', { state: { workoutName: planName || 'Mi WOD', plan: activePlan } })
  }

  // --- EXERCISE FILTER ---
  const filteredExercises = HYROX_EXERCISES.filter(ex => {
    const matchSearch = ex.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ex.descShort.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'todas' || ex.categoria === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[
          { id: 'planificador', label: '📋 Planificador' },
          { id: 'ejercicios',   label: '💪 Ejercicios' },
          { id: 'presets',      label: '⚡ Presets' },
          { id: 'run',          label: '🏃 Run' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
            background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
            color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-secondary)'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================== PLANIFICADOR ======================== */}
      {activeTab === 'planificador' && (
        <div>
          <SectionHeader title="Planificador de WODs" subtitle="Diseñá tus rutinas de entrenamiento a medida." />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="planner-grid">
            {/* Editor */}
            <Card accent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.15rem' }}>Editor de Plan Activo</h3>
                <Button variant="danger" size="sm" onClick={clearPlan}>Limpiar Todo</Button>
              </div>

              {/* Add from list */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Agregar ejercicio oficial
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    <option value="">Seleccioná un movimiento...</option>
                    {HYROX_EXERCISES.map(ex => <option key={ex.id} value={ex.nombre}>{ex.nombre}</option>)}
                  </select>
                  <Button variant="primary" onClick={() => {
                    if (!selectedExercise) { toast('Seleccioná un movimiento'); return }
                    const ex = HYROX_EXERCISES.find(e => e.nombre === selectedExercise)
                    addExercise(selectedExercise, ex?.sugerido || '1 km')
                    setSelectedExercise('')
                  }}>+ Agregar</Button>
                </div>
              </div>

              {/* Add custom */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  O ejercicio personalizado
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={customExercise} onChange={e => setCustomExercise(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && customExercise.trim()) { addExercise(customExercise.trim()); setCustomExercise('') }}}
                    placeholder="Ej. Flexiones, Plancha..."
                    style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                  <Button variant="secondary" onClick={() => {
                    if (!customExercise.trim()) return
                    addExercise(customExercise.trim())
                    setCustomExercise('')
                  }}>+ Añadir</Button>
                </div>
              </div>

              {/* Exercise list */}
              <div style={{
                minHeight: 150, borderRadius: '12px', marginBottom: '20px',
                border: activePlan.length === 0 ? '2px dashed var(--border-color)' : 'none',
                padding: activePlan.length === 0 ? '16px' : '0',
                display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                {activePlan.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto', fontSize: '0.9rem' }}>
                    El planificador está vacío. Agregá ejercicios arriba.
                  </p>
                ) : activePlan.map((item, i) => (
                  <PlanItem key={i} item={item} index={i} total={activePlan.length}
                    weightUnit={weightUnit}
                    onUpdate={updateExercise}
                    onDelete={removeExercise}
                    onMove={moveExercise}
                  />
                ))}
              </div>

              {/* Save & Start */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Nombre del Plan
                </label>
                <input value={planName} onChange={e => setPlanName(e.target.value)}
                  placeholder="Ej. WOD Infierno del Sábado"
                  style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button variant="success" onClick={handleSavePlan}>
                  💾 Guardar en Mis Planes
                </Button>
                <button onClick={startWOD} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '11px 20px', borderRadius: '10px', border: 'none',
                  background: '#ff7700', color: 'white', fontWeight: 700,
                  fontSize: '0.95rem', cursor: 'pointer'
                }}>
                  ▶ Iniciar WOD
                </button>
              </div>
            </Card>

            {/* Saved Plans Sidebar */}
            <div>
              <Card>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>Mis Planes Guardados</h3>
                {savedPlans.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aún no guardaste planes.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {savedPlans.map(plan => (
                      <div key={plan.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)', borderRadius: '8px'
                      }}>
                        <div style={{ cursor: 'pointer', flexGrow: 1 }} onClick={() => loadPlan(plan)}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{plan.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {plan.exercises?.length || 0} ejercicios
                          </div>
                        </div>
                        <Button variant="danger" size="icon" onClick={() => handleDeletePlan(plan.id, plan.name)}>✕</Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ======================== EJERCICIOS ======================== */}
      {activeTab === 'ejercicios' && (
        <div>
          <SectionHeader title="Estaciones Oficiales" subtitle="Aprendé los movimientos clave y estándares de HYROX." />

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicios..."
                style={{ width: '100%', paddingLeft: '36px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px 11px 36px', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['todas', 'cardio', 'fuerza', 'mixto'].map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                  padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                  background: categoryFilter === cat ? 'var(--accent)' : 'var(--bg-secondary)',
                  borderColor: categoryFilter === cat ? 'var(--accent)' : 'var(--border-color)',
                  color: categoryFilter === cat ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredExercises.map(ex => {
              const colors = BADGE_COLORS[ex.categoria]
              return (
                <Card key={ex.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{ex.nombre}</h4>
                    <span style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {ex.categoria}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '12px', flexGrow: 1 }}>{ex.descShort}</p>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Carga/Reps sugerida:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{ex.sugerido}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <Button variant="secondary" size="sm" onClick={() => setDetailModal(ex)}>Ver Consejos</Button>
                    <Button variant="primary" size="sm" onClick={() => { addExercise(ex.nombre, ex.sugerido); setActiveTab('planificador') }}>
                      + Planificar
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ======================== PRESETS ======================== */}
      {activeTab === 'presets' && (
        <div>
          <SectionHeader title="Presets de Entrenamiento" subtitle="Planes prearmados oficiales y de entrenamiento estructurado." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {DEFAULT_PRESETS.map(preset => (
              <Card key={preset.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent)', marginBottom: '6px' }}>{preset.nombre}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{preset.descripcion}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', flexGrow: 1 }}>
                  {preset.ejercicios.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600 }}>{ex.series > 1 ? `${ex.series}x ` : ''}{ex.nombre}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{ex.peso ? `${ex.valor} (${ex.peso})` : ex.valor}</span>
                    </div>
                  ))}
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => loadPreset(preset)}>
                  Cargar en Planificador
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ======================== RUN TRACKER ======================== */}
      {activeTab === 'run' && <RunTracker />}

      {/* ======================== MODAL DETALLE ======================== */}
      {detailModal && (
        <div onClick={() => setDetailModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--card-radius)', width: '100%', maxWidth: 580,
            maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            animation: 'pageIn 0.3s ease'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem' }}>{detailModal.nombre}</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Specs */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '10px' }}>Especificaciones Oficiales</div>
                {Object.entries(detailModal.datosClave).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Tips */}
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Consejos de Rendimiento</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {detailModal.consejos.map((tip, i) => (
                  <li key={i} style={{ paddingLeft: '28px', position: 'relative', fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--accent)', fontWeight: 800 }}>✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
              <Button variant="primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => { addExercise(detailModal.nombre, detailModal.sugerido); setActiveTab('planificador'); setDetailModal(null) }}>
                + Agregar al Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .planner-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// SUB-COMPONENT: Plan Item Card
// ============================================
function PlanItem({ item, index, total, weightUnit, onUpdate, onDelete, onMove }) {
  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1rem' }}>
          <span style={{ background: 'var(--accent)', color: 'var(--bg-primary)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
            {index + 1}
          </span>
          {item.nombre}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => onMove(index, -1)} disabled={index === 0}
            style={{ width: 30, height: 30, borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}>▲</button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
            style={{ width: 30, height: 30, borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: index === total - 1 ? 'not-allowed' : 'pointer', opacity: index === total - 1 ? 0.4 : 1 }}>▼</button>
          <button onClick={() => onDelete(index)}
            style={{ width: 30, height: 30, borderRadius: '6px', border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { key: 'series', label: 'Series', type: 'number', placeholder: '1' },
          { key: 'valor', label: 'Distancia / Reps', type: 'text', placeholder: '1000m' },
          { key: 'peso', label: `Carga (${weightUnit})`, type: 'text', placeholder: '20kg' },
        ].map(field => (
          <div key={field.key}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>{field.label}</label>
            <input type={field.type} value={item[field.key]} placeholder={field.placeholder}
              onChange={e => onUpdate(index, field.key, e.target.value)}
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '7px 10px', color: 'var(--text-primary)', fontSize: '0.88rem' }} />
          </div>
        ))}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>Notas</label>
        <input value={item.notas} placeholder="Ej. Concentrá fuerza en piernas..."
          onChange={e => onUpdate(index, 'notas', e.target.value)}
          style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '7px 10px', color: 'var(--text-primary)', fontSize: '0.88rem' }} />
      </div>
    </div>
  )
}
