import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Plus, X, Check } from 'lucide-react'
import './AdminAnalytics.css'

const PERIOD_LABELS = { today: 'Бугун', week: 'Ҳафта', month: '30 кун', year: 'Йил' }
const COLORS = ['#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('month')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExpense, setShowExpense] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'Маҳсулотлар' })

  useEffect(() => { loadAnalytics() }, [period])
  useEffect(() => { loadExpenses() }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try { const r = await analyticsAPI.get(period); setAnalytics(r.data) }
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
      setShowExpense(false)
      setExpForm({ description: '', amount: '', category: 'Маҳсулотлар' })
      loadExpenses()
      loadAnalytics()
    } catch { toast.error('Хатолик') }
  }

  const formatMoney = (v) => v ? `${Number(v).toLocaleString()} сум` : '0 сум'

  return (
    <div>
      <div className="page-header-row">
        <div><h1>Аналитика</h1></div>
        <div style={{display:'flex',gap:8}}>
          <div className="period-tabs">
            {Object.entries(PERIOD_LABELS).map(([k, v]) => (
              <button key={k} className={`filter-tab ${period === k ? 'active' : ''}`} onClick={() => setPeriod(k)}>{v}</button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowExpense(true)}><Plus size={14} /> Харажат</button>
        </div>
      </div>

      {loading ? <div className="page-loading">Юкланмоқда...</div> : analytics && (
        <>
          <div className="analytics-stats">
            <div className="astat-card orange"><p className="astat-label">Тушум</p><p className="astat-val">{formatMoney(analytics.total_revenue)}</p></div>
            <div className="astat-card red"><p className="astat-label">Харажатлар</p><p className="astat-val">{formatMoney(analytics.total_expenses)}</p></div>
            <div className="astat-card green"><p className="astat-label">Соф фойда</p><p className="astat-val">{formatMoney(analytics.net_profit)}</p></div>
            <div className="astat-card blue"><p className="astat-label">Скидкалар</p><p className="astat-val">{formatMoney(analytics.total_discount)}</p></div>
            <div className="astat-card gray"><p className="astat-label">Буюртмалар</p><p className="astat-val">{analytics.total_orders}</p></div>
          </div>

          <div className="analytics-grid">
            {analytics.daily_revenue?.length > 0 && (
              <div className="card chart-card">
                <h3 className="section-title">Кунлик тушум (30 кун)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.daily_revenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`${Number(v).toLocaleString()} сум`, 'Тушум']} labelStyle={{fontSize:12}} />
                    <Area type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {analytics.category_sales?.length > 0 && (
              <div className="card chart-card">
                <h3 className="section-title">Категориялар</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={analytics.category_sales} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {analytics.category_sales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${Number(v).toLocaleString()} сум`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {analytics.popular_items?.length > 0 && (
            <div className="card" style={{marginTop:16}}>
              <h3 className="section-title">Машҳур таомлар</h3>
              <table className="data-table">
                <thead><tr><th>#</th><th>Таом</th><th>Сотилди</th><th>Тушум</th></tr></thead>
                <tbody>
                  {analytics.popular_items.map((item, i) => (
                    <tr key={i}>
                      <td><span className="rank">{i+1}</span></td>
                      <td>{item.name}</td>
                      <td><span className="badge badge-orange">{item.total_sold} та</span></td>
                      <td className="text-bold">{item.revenue?.toLocaleString()} сум</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="card" style={{marginTop:16}}>
              <h3 className="section-title">Сўнгги харажатлар</h3>
              <table className="data-table">
                <thead><tr><th>Тавсиф</th><th>Категория</th><th>Миқдор</th><th>Сана</th></tr></thead>
                <tbody>
                  {expenses.slice(0,10).map(e => (
                    <tr key={e.id}>
                      <td>{e.description}</td>
                      <td><span className="badge badge-gray">{e.category}</span></td>
                      <td className="text-red">{e.amount?.toLocaleString()} сум</td>
                      <td className="time-cell">{new Date(e.created_at).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showExpense && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExpense(false)}>
          <div className="modal-card slide-in" style={{width: 400}}>
            <div className="modal-header">
              <h2>Харажат қўшиш</h2>
              <button onClick={() => setShowExpense(false)}><X size={20} /></button>
            </div>
            <form onSubmit={addExpense}>
              <div className="form-group">
                <label className="label">Тавсиф *</label>
                <input className="input" value={expForm.description} onChange={e => setExpForm(f => ({...f, description: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="label">Миқдор (сум) *</label>
                <input className="input" type="number" value={expForm.amount} onChange={e => setExpForm(f => ({...f, amount: e.target.value}))} required min="0" />
              </div>
              <div className="form-group">
                <label className="label">Категория</label>
                <select className="input" value={expForm.category} onChange={e => setExpForm(f => ({...f, category: e.target.value}))}>
                  {['Маҳсулотлар','Ходимлар','Коммунал','Таъмирлаш','Бошқа'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpense(false)}>Бекор</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Сақлаш</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
