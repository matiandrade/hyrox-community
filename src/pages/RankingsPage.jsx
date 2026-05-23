import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { SectionHeader, Spinner, EmptyState } from '@/components/ui'

const COUNTRIES = [
  { code: null, label: 'Global 🌍' },
  { code: 'AR', label: '🇦🇷 Argentina' },
  { code: 'ES', label: '🇪🇸 España' },
  { code: 'MX', label: '🇲🇽 México' },
  { code: 'CL', label: '🇨🇱 Chile' },
  { code: 'CO', label: '🇨🇴 Colombia' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingsPage() {
  const { rankings, rankingsLoading, fetchRankings } = useAppStore()
  const [country, setCountry] = useState(null)

  useEffect(() => { fetchRankings(country) }, [country])

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return (
    <div>
      <SectionHeader
        title="Rankings"
        subtitle="Mejores tiempos en HYROX Full Simulation de la comunidad"
      />

      {/* Country filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {COUNTRIES.map(c => (
          <button key={c.code || 'global'} onClick={() => setCountry(c.code)} style={{
            padding: '8px 16px', borderRadius: '20px', border: '1px solid',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            background: country === c.code ? 'var(--accent)' : 'var(--bg-secondary)',
            borderColor: country === c.code ? 'var(--accent)' : 'var(--border-color)',
            color: country === c.code ? 'var(--bg-primary)' : 'var(--text-secondary)'
          }}>
            {c.label}
          </button>
        ))}
      </div>

      {rankingsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size={32} color="var(--accent)" />
        </div>
      ) : rankings.length === 0 ? (
        <EmptyState icon="🏆" title="Sin rankings aún" subtitle="Registrá un Full Simulation para aparecer acá" />
      ) : (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--card-radius)', overflow: 'hidden'
        }}>
          {rankings.map((entry, i) => (
            <div key={entry.log_id} style={{
              display: 'grid', gridTemplateColumns: '50px 1fr auto',
              alignItems: 'center', padding: '16px 20px', gap: '16px',
              borderBottom: i < rankings.length - 1 ? '1px solid var(--border-color)' : 'none',
              background: i === 0 ? 'rgba(255,215,0,0.04)' : 'transparent',
              transition: 'background 0.2s'
            }}>
              {/* Rank */}
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 900,
                fontSize: i < 3 ? '1.5rem' : '1.1rem',
                color: i < 3 ? 'var(--accent)' : 'var(--text-muted)',
                textAlign: 'center'
              }}>
                {i < 3 ? MEDALS[i] : `#${entry.rank}`}
              </div>

              {/* Athlete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: i === 0
                    ? 'linear-gradient(135deg, var(--accent), #ff9f00)'
                    : 'var(--bg-tertiary)',
                  color: i === 0 ? 'var(--bg-primary)' : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                }}>
                  {(entry.full_name || entry.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{entry.full_name || entry.username}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    @{entry.username} · {entry.city ? `${entry.city}, ` : ''}{entry.country}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 900,
                  fontSize: '1.4rem', color: i === 0 ? 'var(--accent)' : 'var(--text-primary)'
                }}>
                  {formatTime(entry.time_seconds)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES') : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
