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

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('youit_token')
  return token ? children : <Navigate to="/admin" replace />
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
      </Routes>
    </BrowserRouter>
  )
}
