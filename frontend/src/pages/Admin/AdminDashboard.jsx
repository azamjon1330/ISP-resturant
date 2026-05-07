import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'
import { TrendingUp, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    analyticsAPI.get('today')
      .then(r => setAnalytics(r.data))
      .catch(e => setError(e?.response?.data?.error || 'Маълумот юкланмади'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-loading">
      <div className="loading-spinner" />
      <span>Юкланмоқда...</span>
    </div>
  )

  if (error) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <span style={{ color: '#EF4444' }}>{error}</span>
    </div>
  )

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>🍽️ Бош панель</h1>
        <p>Бугунги кун кўрсаткичлари</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={DollarSign} color="orange" label="Бугунги тушум" value={`${(analytics?.today_revenue || 0).toLocaleString()} сум`} />
        <StatCard icon={ShoppingBag} color="blue" label="Бугунги буюртмалар" value={analytics?.today_orders ?? 0} />
        <StatCard icon={TrendingUp} color="green" label="30 кунлик тушум" value={`${(analytics?.total_revenue || 0).toLocaleString()} сум`} />
        <StatCard icon={BarChart3} color="purple" label="Соф фойда (30 кун)" value={`${(analytics?.net_profit || 0).toLocaleString()} сум`} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="section-title">🏆 Машҳур таомлар</h2>
          {analytics?.popular_items?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Таом</th><th>Сотилди</th><th>Тушум</th></tr>
              </thead>
              <tbody>
                {analytics.popular_items.slice(0, 5).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td><span className="badge badge-orange">{item.total_sold} та</span></td>
                    <td className="text-bold">{item.revenue?.toLocaleString()} сум</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-text">Маълумот йўқ</p>}
        </div>

        <div className="card">
          <h2 className="section-title">📊 Категориялар бўйича</h2>
          {analytics?.category_sales?.length > 0 ? (
            <div className="category-bars">
              {analytics.category_sales.map((cat, i) => {
                const max = Math.max(...analytics.category_sales.map(c => c.revenue))
                const pct = max > 0 ? (cat.revenue / max) * 100 : 0
                return (
                  <div key={i} className="cat-bar-item">
                    <div className="cat-bar-label">
                      <span>{cat.category}</span>
                      <span>{cat.revenue?.toLocaleString()} сум</span>
                    </div>
                    <div className="cat-bar-track">
                      <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="empty-text">Маълумот йўқ</p>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon"><Icon size={22} /></div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}
