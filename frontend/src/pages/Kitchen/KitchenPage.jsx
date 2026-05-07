import React, { useState, useEffect, useRef } from 'react'
import { ordersAPI } from '../../api'
import toast from 'react-hot-toast'
import { ChefHat, CheckCircle, Bell, Home, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './KitchenPage.css'

const COLUMNS = [
  { status: 'pending',  label: 'Янги',           color: 'yellow', nextStatus: 'cooking', nextLabel: 'Тайёрлашни бошлаш' },
  { status: 'cooking',  label: 'Тайёрланмоқда',  color: 'orange', nextStatus: 'ready',   nextLabel: 'Тайёр!' },
  { status: 'ready',    label: 'Тайёр',           color: 'green',  nextStatus: 'served',  nextLabel: 'Берилди ✓' },
]

const fmtTime = (iso) => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function KitchenPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const wsRef = useRef(null)

  useEffect(() => {
    load()
    connectWS()
    return () => wsRef.current?.close()
  }, [])

  const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'new_order') {
        setOrders(prev => [msg.payload, ...prev])
        playSound()
        toast('Янги буюртма! #' + msg.payload.order_code, { icon: '🔔', duration: 5000 })
      }
      if (msg.type === 'order_status_changed') {
        setOrders(prev => prev.map(o => o.id === msg.payload.id ? { ...o, ...msg.payload } : o))
      }
    }
    wsRef.current = ws
  }

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll()
      setOrders(res.data.filter(o => o.status !== 'served'))
    } catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  const updateStatus = async (order, nextStatus) => {
    try {
      await ordersAPI.updateStatus(order.id, nextStatus)
      setOrders(prev => {
        if (nextStatus === 'served') return prev.filter(o => o.id !== order.id)
        return prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o)
      })
      if (nextStatus === 'ready') toast.success(`Буюртма #${order.order_code} тайёр!`)
    } catch { toast.error('Ҳолатни янгилашда хато') }
  }

  const col = (status) => orders.filter(o => o.status === status)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F5F5' }}>
      <ChefHat size={44} color="#FF6B35" className="animate-spin" />
    </div>
  )

  return (
    <div className="kitchen-page">
      <header className="kitchen-header">
        <div className="kh-left">
          <button className="kh-icon-btn" onClick={() => navigate('/')}><Home size={20} /></button>
          <ChefHat size={22} color="white" />
          <h1 className="kh-title">Ошпазхона панели</h1>
        </div>
        <div className="kh-stats">
          <span className="kh-stat kh-stat-yellow"><Bell size={14} /> {col('pending').length} янги</span>
          <span className="kh-stat kh-stat-orange">{col('cooking').length} тайёрланмоқда</span>
          <span className="kh-stat kh-stat-green">{col('ready').length} тайёр</span>
        </div>
        <button className="kh-refresh" onClick={load}><RefreshCw size={16} /> Янгилаш</button>
      </header>

      <div className="kitchen-board">
        {COLUMNS.map(col => (
          <div key={col.status} className={`kboard-col col-${col.color}`}>
            <div className="kboard-col-head">
              <span className={`kdot dot-${col.color}`} />
              <h2>{col.label}</h2>
              <span className="kboard-count">{orders.filter(o => o.status === col.status).length}</span>
            </div>

            <div className="kboard-col-body">
              {orders.filter(o => o.status === col.status).length === 0 ? (
                <div className="kboard-empty">Буюртма йўқ</div>
              ) : orders.filter(o => o.status === col.status).map(order => (
                <div key={order.id} className={`kcard kcard-${col.color}`}>
                  <div className="kcard-top">
                    <span className="kcard-code">#{order.order_code}</span>
                    <span className="kcard-time">{fmtTime(order.created_at)}</span>
                  </div>

                  {order.items?.length > 0 && (
                    <ul className="kcard-items">
                      {order.items.map((item, i) => (
                        <li key={i} className="kcard-item">
                          <div className="kcard-item-left">
                            <span className="kcard-qty">×{item.quantity}</span>
                            <span className="kcard-name">{item.item_name}</span>
                          </div>
                          {(item.price || item.unit_price) && (
                            <span className="kcard-item-price">
                              {((item.price || item.unit_price) * item.quantity).toLocaleString()} сум
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {order.note && <p className="kcard-note">💬 {order.note}</p>}

                  <div className="kcard-foot">
                    <span className="kcard-total">{order.final_price?.toLocaleString()} сум</span>
                    <button
                      className={`kcard-btn kcard-btn-${col.color}`}
                      onClick={() => updateStatus(order, col.nextStatus)}
                    >
                      {col.nextStatus === 'ready' && <CheckCircle size={16} />}
                      {col.nextLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
