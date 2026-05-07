import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CashierPage from './pages/Cashier/CashierPage'
import KitchenPage from './pages/Kitchen/KitchenPage'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminOrders from './pages/Admin/AdminOrders'
import AdminMenu from './pages/Admin/AdminMenu'
import AdminAgents from './pages/Admin/AdminAgents'
import AdminAnalytics from './pages/Admin/AdminAnalytics'
import HomePage from './pages/Home/HomePage'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, fontFamily: 'monospace', background: '#FF6B35', minHeight: '100vh', color: 'white' }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>⚠️ Рендер хатоси:</h2>
        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {this.state.error?.message}
          {'\n\n'}
          {this.state.error?.stack}
        </pre>
        <button onClick={() => { localStorage.removeItem('youit_token'); window.location.href = '/admin'; }}
          style={{ marginTop: 20, padding: '12px 24px', background: 'white', color: '#FF6B35', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
          Токенни тозалаш ва қайта кириш
        </button>
      </div>
    )
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('youit_token')
  if (!token) return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '10px' },
          success: { iconTheme: { primary: '#FF6B35', secondary: '#fff' } },
        }}
      />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cashier" element={<CashierPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/admin" element={<AdminLogin />} />

          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
