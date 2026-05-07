import React, { useState, useEffect } from 'react'
import { ordersAPI } from '../../api'
import toast from 'react-hot-toast'
import { RefreshCw, Filter } from 'lucide-react'
import './AdminOrders.css'

const statusLabels = { pending: 'Кутилмоқда', cooking: 'Тайёрланмоқда', ready: 'Тайёр', served: 'Берилди' }
const statusColors = { pending: 'badge-yellow', cooking: 'badge-orange', ready: 'badge-green', served: 'badge-gray' }

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadOrders() }, [filter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll(filter || undefined)
      setOrders(res.data)
    } catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Буюртмалар тарихи</h1>
        <div className="header-actions">
          <div className="filter-tabs">
            {['', 'pending', 'cooking', 'ready', 'served'].map(s => (
              <button
                key={s}
                className={`filter-tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === '' ? 'Барчаси' : statusLabels[s]}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadOrders}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">Юкланмоқда...</div>
      ) : (
        <div className="card">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Рақам</th>
                <th>Жами</th>
                <th>Скидка</th>
                <th>Тўлов</th>
                <th>Карта</th>
                <th>Ҳолат</th>
                <th>Вақт</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="empty-td">Буюртма топилмади</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td><span className="order-code-cell">#{order.order_code}</span></td>
                    <td>{order.total_price?.toLocaleString()} сум</td>
                    <td className="discount-cell">
                      {order.discount_amount > 0 ? `-${order.discount_amount?.toLocaleString()} сум` : '—'}
                    </td>
                    <td className="final-cell">{order.final_price?.toLocaleString()} сум</td>
                    <td>{order.card_code || '—'}</td>
                    <td><span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span></td>
                    <td className="time-cell">
                      {new Date(order.created_at).toLocaleString('ru-RU', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
