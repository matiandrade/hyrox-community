import clsx from 'clsx'

// ============ BUTTON ============
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  ...props
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer',
    border: '1px solid transparent', transition: 'all 0.2s ease',
    textDecoration: 'none', whiteSpace: 'nowrap'
  }

  const variants = {
    primary: {
      background: 'var(--accent)', color: 'var(--bg-primary)',
      borderColor: 'var(--accent)'
    },
    secondary: {
      background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
      borderColor: 'var(--border-color)'
    },
    danger: {
      background: 'rgba(239,68,68,0.12)', color: 'var(--danger)',
      borderColor: 'var(--danger)'
    },
    success: {
      background: 'rgba(16,185,129,0.12)', color: 'var(--success)',
      borderColor: 'var(--success)'
    },
    ghost: {
      background: 'transparent', color: 'var(--text-secondary)',
      borderColor: 'transparent'
    }
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px' },
    md: { padding: '11px 20px', fontSize: '0.95rem', borderRadius: '10px' },
    lg: { padding: '14px 28px', fontSize: '1.05rem', borderRadius: '12px' },
    icon: { padding: '0', width: '38px', height: '38px', borderRadius: '8px' }
  }

  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size], opacity: disabled ? 0.5 : 1 }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

// ============ CARD ============
export function Card({ children, className, accent = false, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid var(--border-color)`,
        borderRadius: 'var(--card-radius)',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...(accent ? { borderLeft: '4px solid var(--accent)' } : {}),
        ...style
      }}
    >
      {children}
    </div>
  )
}

// ============ INPUT ============
export function Input({ label, error, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', background: 'var(--bg-tertiary)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
          borderRadius: '8px', padding: '11px 14px',
          color: 'var(--text-primary)', fontSize: '0.95rem',
          outline: 'none', transition: 'border-color 0.2s',
          ...style
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-color)'}
        {...props}
      />
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

// ============ SELECT ============
export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)', borderRadius: '8px',
          padding: '11px 14px', color: 'var(--text-primary)',
          fontSize: '0.95rem', outline: 'none', cursor: 'pointer'
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// ============ BADGE ============
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:  { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af',  border: '#6b7280' },
    cardio:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa',  border: '#3b82f6' },
    fuerza:   { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24',  border: '#f59e0b' },
    mixto:    { bg: 'rgba(167,139,250,0.15)', color: '#c084fc',  border: '#a78bfa' },
    success:  { bg: 'rgba(16,185,129,0.15)',  color: '#10b981',  border: '#10b981' },
    danger:   { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444',  border: '#ef4444' },
    accent:   { bg: 'rgba(255,215,0,0.15)',   color: '#ffd700',  border: '#ffd700' },
  }
  const v = variants[variant] || variants.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '12px',
      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: v.bg, color: v.color, border: `1px solid ${v.border}`
    }}>
      {children}
    </span>
  )
}

// ============ SPINNER ============
export function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3"
        strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round"/>
    </svg>
  )
}

// ============ EMPTY STATE ============
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: '12px'
    }}>
      <span style={{ fontSize: '2.5rem' }}>{icon}</span>
      <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{title}</p>
      {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{subtitle}</p>}
    </div>
  )
}

// ============ SECTION HEADER ============
export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900,
        textTransform: 'uppercase', letterSpacing: '1px',
        position: 'relative', display: 'inline-block', paddingBottom: '10px'
      }}>
        {title}
        <span style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '40px', height: '4px', borderRadius: '2px',
          background: 'var(--accent)'
        }} />
      </h2>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ============ TOAST (context) ============
import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'default') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '90px', right: '20px',
        display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${t.type === 'error' ? 'var(--danger)' : 'var(--accent)'}`,
            padding: '12px 20px', borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            fontSize: '0.9rem', fontWeight: 600, maxWidth: '320px',
            animation: 'pageIn 0.3s ease'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
