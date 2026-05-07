import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, X, Check, TrendingUp, DollarSign, ShoppingBag, Tag, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import '../Admin/AdminLayout.css'

const PERIODS = [
  { val: 'today', label: 'Бугун' },
  { val: 'week', label: 'Ҳафта' },
  { val: 'month', label: '30 кун' },
  { val: 'year', label: 'Йил' },
]

const EXP_CATS = ['Маҳсулотлар', 'Ходимлар', 'Коммунал', 'Таъмирлаш', 'Бошқа']
const CHART_COLORS = ['#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

const fmt = (v) => v ? `${Number(v).toLocaleString()} сум` : '0 сум'

const fmtDate = (iso) => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#FF6B35', margin: 0 }}>{Number(payload[0].value).toLocaleString()} сум</p>
    </div>
  )
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [modal, setModal] = useState(false)
  const [expForm, setExpForm] = useState({
    description: '', amount: '', category: 'Маҳсулотлар',
    expense_type: 'one_time', is_recurring: false,
  })

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
      setExpForm({ description: '', amount: '', category: 'Маҳсулотлар', expense_type: 'one_time', is_recurring: false })
      loadExpenses()
      loadAnalytics()
    } catch { toast.error('Хатолик') }
  }

  const ef = (k) => (e) => setExpForm(p => ({ ...p, [k]: e.target.value }))

  const setExpenseType = (type) => {
    setExpForm(p => ({ ...p, expense_type: type, is_recurring: type === 'monthly' }))
  }

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
          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => { loadAnalytics(); loadExpenses() }}>
            <RefreshCw size={14} />
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

          {/* Daily revenue chart — recharts AreaChart */}
          <div className="adm-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>📈 Кунлик тушум</h3>
            {data.daily_revenue?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.daily_revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => d?.slice(8) || ''}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF6B35"
                    strokeWidth={2.5}
                    fill="url(#gradRevenue)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#FF6B35' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
                Маълумот йўқ
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Category sales — recharts BarChart */}
            {data.category_sales?.length > 0 && (
              <div className="adm-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 14 }}>🏷️ Категориялар</h3>
                <ResponsiveContainer width="100%" height={Math.max(data.category_sales.length * 44, 120)}>
                  <BarChart
                    layout="vertical"
                    data={data.category_sales}
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fontSize: 12, fill: '#374151' }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip formatter={v => [`${Number(v).toLocaleString()} сум`, 'Тушум']} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                      {data.category_sales.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0 }}>💸 Харажатлар</h3>
                {data.monthly_expenses > 0 && (
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    Ойлик: <strong style={{ color: '#EF4444' }}>{data.monthly_expenses?.toLocaleString()} сум</strong>
                  </span>
                )}
              </div>
              <table className="adm-table">
                <thead>
                  <tr><th>Тавсиф</th><th>Тури</th><th>Категория</th><th>Миқдор</th><th>Сана</th></tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 15).map(e => (
                    <tr key={e.id}>
                      <td>{e.description}</td>
                      <td>
                        {e.is_recurring ? (
                          <span className="adm-badge adm-badge-orange">🔄 Ойлик</span>
                        ) : (
                          <span className="adm-badge adm-badge-gray">Бир марталик</span>
                        )}
                      </td>
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
          <div className="adm-modal" style={{ maxWidth: 420 }}>
            <div className="adm-modal-header">
              <h2>Харажат қўшиш</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={addExpense}>
              {/* Expense type toggle */}
              <div className="adm-field">
                <label className="adm-label">Харажат тури</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setExpenseType('one_time')}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1.5px solid', cursor: 'pointer',
                      background: expForm.expense_type === 'one_time' ? '#FF6B35' : 'white',
                      color: expForm.expense_type === 'one_time' ? 'white' : '#374151',
                      borderColor: expForm.expense_type === 'one_time' ? '#FF6B35' : '#E5E7EB',
                    }}
                  >
                    Бир марталик
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType('monthly')}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1.5px solid', cursor: 'pointer',
                      background: expForm.expense_type === 'monthly' ? '#FF6B35' : 'white',
                      color: expForm.expense_type === 'monthly' ? 'white' : '#374151',
                      borderColor: expForm.expense_type === 'monthly' ? '#FF6B35' : '#E5E7EB',
                    }}
                  >
                    🔄 Ойлик (авт.)
                  </button>
                </div>
                {expForm.is_recurring && (
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '6px 0 0' }}>
                    Ойлик харажатлар ҳар ойда аналитикага автоматик қўшилади
                  </p>
                )}
              </div>
              <div className="adm-field">
                <label className="adm-label">Тавсиф *</label>
                <input className="adm-input" value={expForm.description} onChange={ef('description')} required placeholder="Масалан: Ижара, Электр энергияси..." />
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
