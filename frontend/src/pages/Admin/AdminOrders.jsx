import React, { useState, useEffect } from 'react'
import { ordersAPI } from '../../api'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'
import '../Admin/AdminLayout.css'

const STATUS = {
  pending:  { label: 'Кутилмоқда',    cls: 'adm-badge-yellow' },
  cooking:  { label: 'Тайёрланмоқда', cls: 'adm-badge-orange' },
  ready:    { label: 'Тайёр',          cls: 'adm-badge-green'  },
  served:   { label: 'Берилди',        cls: 'adm-badge-gray'   },
}

const fmtDate = (iso) => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll(filter || undefined)
      setOrders(res.data)
    } catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  const filters = [
    { val: '', label: 'Барчаси' },
    { val: 'pending', label: 'Кутилмоқда' },
    { val: 'cooking', label: 'Тайёрланмоқда' },
    { val: 'ready', label: 'Тайёр' },
    { val: 'served', label: 'Берилди' },
  ]

  return (
    <div>
      <div className="adm-page-header">
        <h1>📋 Буюртмалар тарихи</h1>
        <p>Барча буюртмалар рўйхати</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1.5px solid', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              background: filter === f.val ? '#FF6B35' : 'white',
              color: filter === f.val ? 'white' : '#374151',
              borderColor: filter === f.val ? '#FF6B35' : '#E5E7EB',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={load}
          style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}
        >
          <RefreshCw size={14} /> Янгилаш
        </button>
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Юкланмоқда...</span></div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Рақам</th>
                <th>Таомлар</th>
                <th>Жами</th>
                <th>Чегирма</th>
                <th>Тўлов</th>
                <th>Карта</th>
                <th>Ҳолат</th>
                <th>Вақт</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px' }}>Буюртма топилмади</td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#FF6B35', fontSize: 15 }}>#{o.order_code}</span>
                  </td>
                  <td>
                    {o.items?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#374151' }}>
                            <span style={{ fontWeight: 600 }}>×{item.quantity}</span>{' '}
                            {item.item_name}
                            {item.price && (
                              <span style={{ color: '#9CA3AF', marginLeft: 6 }}>
                                {(item.price * item.quantity).toLocaleString()} сум
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>}
                  </td>
                  <td>{o.total_price?.toLocaleString()} сум</td>
                  <td style={{ color: o.discount_amount > 0 ? '#10B981' : '#9CA3AF' }}>
                    {o.discount_amount > 0 ? `-${o.discount_amount?.toLocaleString()} сум` : '—'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{o.final_price?.toLocaleString()} сум</td>
                  <td style={{ color: '#6B7280', fontSize: 13 }}>{o.card_code || '—'}</td>
                  <td>
                    <span className={`adm-badge ${STATUS[o.status]?.cls || 'adm-badge-gray'}`}>
                      {STATUS[o.status]?.label || o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
