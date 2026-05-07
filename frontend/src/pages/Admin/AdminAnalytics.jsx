import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, X, Check, TrendingUp, DollarSign, ShoppingBag, Tag } from 'lucide-react'
import '../Admin/AdminLayout.css'

const PERIODS = [
  { val: 'today', label: 'Бугун' },
  { val: 'week', label: 'Ҳафта' },
  { val: 'month', label: '30 кун' },
  { val: 'year', label: 'Йил' },
]

const EXP_CATS = ['Маҳсулотлар', 'Ходимлар', 'Коммунал', 'Таъмирлаш', 'Бошқа']

const fmt = (v) => v ? `${Number(v).toLocaleString()} сум` : '0 сум'

const fmtDate = (iso) => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [modal, setModal] = useState(false)
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'Маҳсулотлар' })

  useEffect(() => { loadAnalytics() }, [period])
  useEffect(() => { loadExpenses() }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try { const r = await analyticsAPI.get(period); setData(r.data) }
    catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  const loadExpenses = async () => {
    try { const r = await analyticsAPI.getExpenses(); setExpenses(r.data) } catch {}
  }

  const addExpense = async (e) => {
    e.preventDefault()
    try {
      await analyticsAPI.createExpense({ ...expForm, amount: +expForm.amount })
      toast.success('Харажат қўшилди')
      setModal(false)
      setExpForm({ description: '', amount: '', category: 'Маҳсулотлар' })
      loadExpenses()
      loadAnalytics()
    } catch { toast.error('Хатолик') }
  }

  const ef = (k) => (e) => setExpForm(p => ({ ...p, [k]: e.target.value }))

  const stats = data ? [
    { icon: DollarSign, color: '#FF6B35', bg: '#FFF4EF', label: 'Тушум', value: fmt(data.total_revenue) },
    { icon: TrendingUp, color: '#EF4444', bg: '#FEE2E2', label: 'Харажатлар', value: fmt(data.total_expenses) },
    { icon: Tag, color: '#10B981', bg: '#D1FAE5', label: 'Соф фойда', value: fmt(data.net_profit) },
    { icon: ShoppingBag, color: '#3B82F6', bg: '#DBEAFE', label: 'Буюртмалар', value: data.total_orders ?? 0 },
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="adm-page-header" style={{ margin: 0 }}>
          <h1>📊 Аналитика</h1>
          <p>Даромад ва харажатлар</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map(p => (
              <button
                key={p.val}
                onClick={() => setPeriod(p.val)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: period === p.val ? '#FF6B35' : 'white',
                  color: period === p.val ? 'white' : '#374151',
                  borderColor: period === p.val ? '#FF6B35' : '#E5E7EB',
                }}
              >{p.label}</button>
            ))}
          </div>
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setModal(true)}>
            <Plus size={14} /> Харажат
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Юкланмоқда...</span></div>
      ) : data && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            {stats.map((s, i) => (
              <div key={i} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 3px', fontWeight: 500 }}>{s.label}</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Daily revenue chart (CSS bars) */}
          {data.daily_revenue?.length > 0 && (
            <div className="adm-card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>📈 Кунлик тушум</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflowX: 'auto', paddingBottom: 8 }}>
                {(() => {
                  const max = Math.max(...data.daily_revenue.map(d => d.revenue || 0))
                  return data.daily_revenue.map((d, i) => {
                    const pct = max > 0 ? (d.revenue / max) * 100 : 0
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 28, gap: 4 }}>
                        <div
                          title={`${d.date}: ${Number(d.revenue).toLocaleString()} сум`}
                          style={{ width: 18, height: `${Math.max(pct, 4)}%`, background: 'linear-gradient(to top, #E85A24, #FF8C5A)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 9, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{d.date?.slice(8)}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Category sales */}
            {data.category_sales?.length > 0 && (
              <div className="adm-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 14 }}>🏷️ Категориялар</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.category_sales.map((cat, i) => {
                    const max = Math.max(...data.category_sales.map(c => c.revenue))
                    const pct = max > 0 ? (cat.revenue / max) * 100 : 0
                    const colors = ['#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                          <span style={{ fontWeight: 500, color: '#374151' }}>{cat.category}</span>
                          <span style={{ fontWeight: 700, color: '#111827' }}>{cat.revenue?.toLocaleString()} сум</span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 100, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Popular items */}
            {data.popular_items?.length > 0 && (
              <div className="adm-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 14 }}>🏆 Машҳур таомлар</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.popular_items.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#FEF3C7' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#92400E' : '#6B7280', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{item.total_sold} та сотилди</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35', flexShrink: 0 }}>{item.revenue?.toLocaleString()} сум</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expenses table */}
          {expenses.length > 0 && (
            <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0 }}>💸 Сўнгги харажатлар</h3>
              </div>
              <table className="adm-table">
                <thead>
                  <tr><th>Тавсиф</th><th>Категория</th><th>Миқдор</th><th>Сана</th></tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 10).map(e => (
                    <tr key={e.id}>
                      <td>{e.description}</td>
                      <td><span className="adm-badge adm-badge-gray">{e.category}</span></td>
                      <td style={{ color: '#EF4444', fontWeight: 700 }}>{e.amount?.toLocaleString()} сум</td>
                      <td style={{ fontSize: 12, color: '#6B7280' }}>{fmtDate(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="adm-modal" style={{ maxWidth: 400 }}>
            <div className="adm-modal-header">
              <h2>Харажат қўшиш</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={addExpense}>
              <div className="adm-field">
                <label className="adm-label">Тавсиф *</label>
                <input className="adm-input" value={expForm.description} onChange={ef('description')} required />
              </div>
              <div className="adm-field">
                <label className="adm-label">Миқдор (сум) *</label>
                <input className="adm-input" type="number" value={expForm.amount} onChange={ef('amount')} required min="0" />
              </div>
              <div className="adm-field">
                <label className="adm-label">Категория</label>
                <select className="adm-input" value={expForm.category} onChange={ef('category')}>
                  {EXP_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setModal(false)}>Бекор</button>
                <button type="submit" className="adm-btn adm-btn-primary"><Check size={16} /> Сақлаш</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
