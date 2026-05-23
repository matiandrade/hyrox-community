import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Button, SectionHeader, Input, Select, useToast, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const COUNTRIES = [
  { code: 'AR', label: '🇦🇷 Argentina' },
  { code: 'ES', label: '🇪🇸 España' },
  { code: 'MX', label: '🇲🇽 México' },
  { code: 'CL', label: '🇨🇱 Chile' },
  { code: 'CO', label: '🇨🇴 Colombia' },
  { code: 'UY', label: '🇺🇾 Uruguay' },
  { code: 'PE', label: '🇵🇪 Perú' },
  { code: 'BR', label: '🇧🇷 Brasil' },
]

function secondsToDisplay(s) {
  if (!s) return '--:--:--'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function ProfilePage() {
  const { user, profile, fetchProfile, signOut } = useAuthStore()
  const { logs, fetchMyLogs } = useAppStore()
  const toast = useToast()

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    city: '',
    country: 'AR',
    bio: '',
    weight_unit: 'kg',
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('stats') // 'stats' | 'edit'

  useEffect(() => {
    if (user) {
      fetchMyLogs(user.id)
    }
  }, [user])

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:   profile.full_name   || '',
        username:    profile.username    || '',
        city:        profile.city        || '',
        country:     profile.country     || 'AR',
        bio:         profile.bio         || '',
        weight_unit: profile.weight_unit || 'kg',
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!form.username.trim()) { toast('El username es requerido', 'error'); return }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:   form.full_name,
        username:    form.username,
        city:        form.city,
        country:     form.country,
        bio:         form.bio,
        weight_unit: form.weight_unit,
        updated_at:  new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) { toast('Error al guardar perfil', 'error') }
    else {
      toast('Perfil actualizado ✅')
      fetchProfile(user.id)
    }
    setSaving(false)
  }

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Stats calculations
  const totalWorkouts = logs.length
  const bestTime = logs.length > 0
    ? Math.min(...logs.map(l => l.time_seconds))
    : null
  const avgTime = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + l.time_seconds, 0) / logs.length)
    : null
  const lastWorkout = logs.length > 0 ? logs[0] : null

  const feelingCounts = logs.reduce((acc, l) => {
    acc[l.feeling] = (acc[l.feeling] || 0) + 1
    return acc
  }, {})
  const topFeeling = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0]

  const FEELING_MAP = { Excelente: '🔥', Fuerte: '💪', Cansado: '🏃', Agotado: '🥵', Molestias: '🤕' }

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <Spinner size={32} color="var(--accent)" />
    </div>
  )

  const countryLabel = COUNTRIES.find(c => c.code === profile.country)?.label || profile.country

  return (
    <div>
      {/* Profile Header */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--card-radius)', padding: '28px',
        marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px',
        flexWrap: 'wrap'
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), #ff9f00)',
          color: 'var(--bg-primary)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '2rem', fontWeight: 900,
          boxShadow: '0 0 20px rgba(255,215,0,0.3)'
        }}>
          {(profile.full_name || profile.username || 'A').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
            {profile.full_name || profile.username}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            @{profile.username}
            {profile.city && ` · ${profile.city}`}
            {profile.country && ` · ${countryLabel}`}
          </p>
          {profile.bio && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', fontStyle: 'italic' }}>
              "{profile.bio}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={() => setActiveTab(activeTab === 'edit' ? 'stats' : 'edit')}>
            {activeTab === 'edit' ? '← Volver' : '✏️ Editar Perfil'}
          </Button>
          <Button variant="danger" size="sm" onClick={signOut}>Salir</Button>
        </div>
      </div>

      {/* Sub-tabs */}
      {activeTab === 'stats' && (
        <div>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Total Entrenamientos" value={totalWorkouts} icon="🏋️" />
            <StatCard label="Mejor Tiempo" value={bestTime ? secondsToDisplay(bestTime) : '—'} icon="⚡" accent />
            <StatCard label="Tiempo Promedio" value={avgTime ? secondsToDisplay(avgTime) : '—'} icon="📊" />
            <StatCard label="Sensación Frecuente" value={topFeeling ? `${FEELING_MAP[topFeeling[0]]} ${topFeeling[0]}` : '—'} icon="💡" />
          </div>

          {/* Recent workouts */}
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>Últimos Entrenamientos</h3>
          {logs.length === 0 ? (
            <Card>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                Aún no registraste entrenamientos. ¡Andá a Historial para cargar tu primera sesión!
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.slice(0, 5).map(log => (
                <div key={log.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', padding: '14px 18px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{log.plan_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.date ? new Date(log.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>
                      {secondsToDisplay(log.time_seconds)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {FEELING_MAP[log.feeling]} {log.feeling}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Form */}
      {activeTab === 'edit' && (
        <Card accent>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '20px' }}>Editar Perfil de Atleta</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Nombre completo" value={form.full_name} onChange={setF('full_name')} placeholder="Tu nombre real" />
            <Input label="Username (público)" value={form.username} onChange={setF('username')} placeholder="ej. matias_hyrox" />
            <Input label="Ciudad" value={form.city} onChange={setF('city')} placeholder="Buenos Aires" />
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>País</label>
              <select value={form.country} onChange={setF('country')}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Bio</label>
              <textarea value={form.bio} onChange={setF('bio')} rows={3}
                placeholder="Contá algo sobre vos como atleta..."
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Unidad de Peso</label>
              <select value={form.weight_unit} onChange={setF('weight_unit')}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                <option value="kg">Kilogramos (kg)</option>
                <option value="lbs">Libras (lbs)</option>
              </select>
            </div>
          </div>
          <Button variant="primary" size="lg" loading={saving} onClick={handleSave} style={{ marginTop: '20px' }}>
            Guardar Cambios
          </Button>
        </Card>
      )}
    </div>
  )
}

// Stat card component
function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: `1px solid ${accent ? 'var(--accent)' : 'var(--border-color)'}`,
      borderRadius: 'var(--card-radius)', padding: '20px',
      boxShadow: accent ? '0 0 15px rgba(255,215,0,0.1)' : 'none'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
