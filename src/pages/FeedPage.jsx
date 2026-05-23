import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { Card, Button, Badge, SectionHeader, EmptyState, Spinner } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const FEELING_MAP = {
  Excelente: '🔥', Fuerte: '💪', Cansado: '🏃', Agotado: '🥵', Molestias: '🤕'
}

export default function FeedPage() {
  const { feed, feedLoading, fetchFeed, giveKudo } = useAppStore()
  const { user } = useAuthStore()

  useEffect(() => { fetchFeed(true) }, [])

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return (
    <div>
      <SectionHeader
        title="Feed de Actividad"
        subtitle="Seguí los entrenamientos de la comunidad en tiempo real"
      />

      {feedLoading && feed.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size={32} color="var(--accent)" />
        </div>
      ) : feed.length === 0 ? (
        <EmptyState icon="🏋️" title="El feed está vacío" subtitle="Sé el primero en registrar un entrenamiento" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: 680, margin: '0 auto' }}>
          {feed.map(item => (
            <FeedCard key={item.id} item={item} formatTime={formatTime} onKudo={() => giveKudo(user?.id, item.id)} />
          ))}

          <Button variant="secondary" style={{ width: '100%' }} onClick={() => fetchFeed(false)} loading={feedLoading}>
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}

function FeedCard({ item, formatTime, onKudo }) {
  const timeAgo = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })
    : ''

  return (
    <Card>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #ff9f00)',
            color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1rem'
          }}>
            {(item.full_name || item.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.full_name || item.username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>@{item.username} · {timeAgo}</div>
          </div>
        </div>
        <span style={{ fontSize: '1.3rem' }}>{FEELING_MAP[item.feeling] || '💪'}</span>
      </div>

      {/* Workout info */}
      <div style={{
        background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '14px 16px',
        marginBottom: '14px', borderLeft: '3px solid var(--accent)'
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
          {item.plan_name}
        </div>
        <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
          {formatTime(item.time_seconds)}
        </div>
        {item.date && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
            {new Date(item.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        )}
      </div>

      {item.notes && (
        <p style={{
          fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          marginBottom: '14px', fontStyle: 'italic'
        }}>
          "{item.notes}"
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <button onClick={onKudo} style={{
          background: 'none', border: '1px solid var(--border-color)', borderRadius: '20px',
          padding: '6px 14px', cursor: 'pointer', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
          transition: 'all 0.2s'
        }}>
          ⚡ Kudos {item.kudos_count > 0 && <span style={{ color: 'var(--accent)' }}>{item.kudos_count}</span>}
        </button>
      </div>
    </Card>
  )
}
