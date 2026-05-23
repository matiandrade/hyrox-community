import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { to: '/feed',      label: 'Feed',      icon: FeedIcon },
  { to: '/rankings',  label: 'Rankings',  icon: TrophyIcon },
  { to: '/train',     label: 'Entrenar',  icon: TrainIcon },
  { to: '/history',   label: 'Historial', icon: HistoryIcon },
  { to: '/profile',   label: 'Perfil',    icon: ProfileIcon },
]

export function AppLayout({ children }) {
  const { profile, signOut } = useAuthStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '70px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(19,21,27,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffd700, #ff9f00)',
            color: '#0a0b0e', width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem',
            boxShadow: '0 0 15px rgba(255,215,0,0.3)'
          }}>H</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900,
              letterSpacing: '1px', textTransform: 'uppercase'
            }}>HYROX</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '2px', marginTop: '-2px' }}>
              COMMUNITY
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: '4px' }} className="desktop-nav">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600,
              color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              transition: 'all 0.2s'
            })}>
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Profile badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
          padding: '6px 12px', borderRadius: '20px', cursor: 'pointer'
        }} onClick={signOut} title="Cerrar sesión">
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--accent)', color: 'var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.75rem'
          }}>
            {(profile?.full_name || profile?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {profile?.username || 'Atleta'}
          </span>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        <div className="page-enter">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(19,21,27,0.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-color)',
        display: 'grid', gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`,
        height: '65px', zIndex: 900
      }} className="mobile-nav">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '3px',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.5px', transition: 'color 0.2s'
          })}>
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (min-width: 769px) { .mobile-nav { display: none !important; } }
        @media (max-width: 768px) { .desktop-nav { display: none !important; } main { padding: 16px !important; } }
      `}</style>
    </div>
  )
}

// SVG Icons
function FeedIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/></svg>
}
function TrophyIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
}
function TrainIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>
}
function HistoryIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
}
function ProfileIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
}
