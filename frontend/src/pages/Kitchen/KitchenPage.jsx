import React, { useState, useEffect, useRef } from 'react'
import { ordersAPI } from '../../api'
import toast from 'react-hot-toast'
import { ChefHat, Clock, CheckCircle, Bell, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './KitchenPage.css'

const COLUMNS = [
  { status: 'pending',  label: 'Янги',          color: 'yellow', nextStatus: 'cooking',  nextLabel: 'Тайёрлашни бошлаш' },
  { status: 'cooking',  label: 'Тайёрланмоқда', color: 'orange', nextStatus: 'ready',   nextLabel: 'Тайёр!' },
  { status: 'ready',    label: 'Тайёр',          color: 'green',  nextStatus: 'served',  nextLabel: 'Берилди' },
]

export default function KitchenPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const wsRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    loadOrders()
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

  const loadOrders = async () => {
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

  const getColumnOrders = (status) => orders.filter(o => o.status === status)

  const getElapsed = (createdAt) => {
    const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000)
    if (mins < 1) return 'Ҳозир'
    return `${mins} дақиқа`
  }

  if (loading) return <div className="kitchen-loading"><ChefHat size={40} className="animate-spin" color="var(--orange)" /></div>

  return (
    <div className="kitchen-page">
      <header className="kitchen-header">
        <button className="btn-icon" style={{color:'white'}} onClick={() => navigate('/')}><Home size={20} /></button>
        <div className="kitchen-title">
          <ChefHat size={24} color="white" />
          <h1>Ошпазхона панели</h1>
        </div>
        <div className="kitchen-stats">
          <span className="stat"><Bell size={14} /> {getColumnOrders('pending').length} янги</span>
          <span className="stat cooking">{getColumnOrders('cooking').length} тайёрланмоқда</span>
          <span className="stat ready">{getColumnOrders('ready').length} тайёр</span>
        </div>
        <button className="btn btn-sm" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'none'}} onClick={loadOrders}>Янгилаш</button>
      </header>

      <div className="kitchen-board">
        {COLUMNS.map(col => (
          <div key={col.status} className={`kitchen-column col-${col.color}`}>
            <div className="column-header">
              <span className={`col-dot dot-${col.color}`} />
              <h2>{col.label}</h2>
              <span className="col-count">{getColumnOrders(col.status).length}</span>
            </div>

            <div className="column-body">
              {getColumnOrders(col.status).length === 0 ? (
                <div className="col-empty">Буюртма йўқ</div>
              ) : (
                getColumnOrders(col.status).map(order => (
                  <div key={order.id} className={`kitchen-card card-${col.color}`}>
                    <div className="kcard-header">
                      <span className="kcard-code">#{order.order_code}</span>
                      <span className="kcard-time"><Clock size={12} /> {getElapsed(order.created_at)}</span>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <ul className="kcard-items">
                        {order.items.map((item, i) => (
                          <li key={i}>
                            <span className="item-qty">×{item.quantity}</span>
                            <span className="item-name">{item.item_name}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {order.note && <p className="kcard-note">💬 {order.note}</p>}

                    <div className="kcard-footer">
                      <span className="kcard-price">{order.final_price?.toLocaleString()} сум</span>
                      <button
                        className={`btn btn-sm status-btn btn-${col.color}`}
                        onClick={() => updateStatus(order, col.nextStatus)}
                      >
                        {col.nextStatus === 'ready' ? <CheckCircle size={14} /> : null}
                        {col.nextLabel}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
