import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { ToastProvider, Spinner } from '@/components/ui'
import AuthPage from '@/pages/AuthPage'
import FeedPage from '@/pages/FeedPage'
import RankingsPage from '@/pages/RankingsPage'

// Lazy pages — agregar a medida que se desarrollen
// import TrainPage from '@/pages/TrainPage'
// import HistoryPage from '@/pages/HistoryPage'
import ProfilePage from '@/pages/ProfilePage'

// Placeholder para páginas en desarrollo
function ComingSoon({ title }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚧</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>En construcción — próximamente</p>
    </div>
  )
}

// Route guard
function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Spinner size={40} color="var(--accent)" />
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<Navigate to="/feed" replace />} />

          <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
          <Route path="/rankings" element={<PrivateRoute><RankingsPage /></PrivateRoute>} />
          <Route path="/train" element={<PrivateRoute><ComingSoon title="Planificador" /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><ComingSoon title="Historial" /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}


