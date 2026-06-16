import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ordersAPI } from '../../api'
import toast from 'react-hot-toast'
import { ChefHat, Bell, Home, RefreshCw, CheckCircle, Clock, MapPin, Phone, Truck, Store, User, Navigation2, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './KitchenPage.css'

/* ─── OSRM route helper ─── */
async function fetchOSRMRoute(start, end) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null
    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance,
      duration: route.duration,
    }
  } catch { return null }
}

/* ─── Kitchen Route Map Modal ─── */
function KitchenRouteModal({ order, onClose }) {
  const mapElRef = useRef(null)
  const mapRef   = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [info, setInfo]     = useState(null)

  useEffect(() => {
    if (!order?.delivery_lat || !order?.delivery_lng) { setStatus('error'); return }
    const delivPos = [order.delivery_lat, order.delivery_lng]

    const initMap = async (userPos) => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      delete L.Icon.Default.prototype._getIconUrl
      if (!mapElRef.current || mapRef.current) return

      const center = userPos || delivPos
      const map = L.map(mapElRef.current, { zoomControl: true }).setView(center, 13)
      mapRef.current = map

      L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0','1','2','3'], maxZoom: 21, attribution: '© Google Maps',
      }).addTo(map)

      const delivIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#FF6B35;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(255,107,53,0.5)"></div>`,
        iconSize: [32,32], iconAnchor: [16,32], className: '',
      })
      L.marker(delivPos, { icon: delivIcon }).addTo(map).bindPopup(`<b>${order.delivery_address || 'Yetkazish manzili'}</b>`, { closeButton: false })

      if (userPos) {
        const myIcon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#2196F3;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(33,150,243,0.55)"></div>`,
          iconSize: [18,18], iconAnchor: [9,9], className: '',
        })
        L.marker(userPos, { icon: myIcon }).addTo(map).bindPopup('<b>Mening joylashuvim</b>', { closeButton: false })

        const route = await fetchOSRMRoute(userPos, delivPos)
        if (route?.coords?.length) {
          setInfo(route)
          L.polyline(route.coords, { color: '#FF6B35', weight: 5, opacity: 0.85, lineJoin: 'round' }).addTo(map)
          map.fitBounds(L.latLngBounds(route.coords), { padding: [50, 50] })
        } else {
          map.fitBounds([userPos, delivPos], { padding: [60, 60] })
        }
      } else {
        map.setView(delivPos, 15)
      }

      setStatus('ok')
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMap([pos.coords.latitude, pos.coords.longitude]),
        () => initMap(null),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      initMap(null)
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [order])

  return (
    <div className="km-overlay" onClick={onClose}>
      <div className="km-modal" onClick={e => e.stopPropagation()}>
        <div className="km-head">
          <div className="km-head-info">
            <Navigation2 size={15} />
            <span>#{order.order_code} — {order.delivery_address || 'Yetkazish manzili'}</span>
            {info && (
              <span className="km-route-info">
                {(info.distance / 1000).toFixed(1)} km · {Math.round(info.duration / 60)} daq
              </span>
            )}
          </div>
          <button className="km-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="km-map-wrap">
          {status === 'loading' && (
            <div className="km-loading">
              <Loader2 size={32} className="km-spin" />
              <span>Xarita yuklanmoqda...</span>
            </div>
          )}
          <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}

const fmtTime = (iso) => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fmtElapsed = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return 'Hozir'
  if (diff === 1) return '1 daqiqa'
  return `${diff} daqiqa`
}

export default function KitchenPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null)
  const [kMapOrder, setKMapOrder] = useState(null)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const pollRef = useRef(null)
  const tickRef = useRef(null)
  const seenIdsRef = useRef(new Set())
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    initialLoad()
    connectWS()
    // Polling fallback every 3s — catches orders if WS drops
    pollRef.current = setInterval(() => pollOrders(), 3000)
    // Refresh elapsed-time labels every 30s
    tickRef.current = setInterval(() => forceUpdate(n => n + 1), 30000)
    return () => {
      wsRef.current?.close()
      clearInterval(pollRef.current)
      clearInterval(tickRef.current)
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [])

  // Kitchen only handles orders that are in 'cooking' status.
  // Cashier confirms pending orders → they become 'cooking' → kitchen sees them.
  const isCooking = (o) => o.status === 'cooking'

  const handleNewCookingOrder = (order) => {
    if (!order || !order.id) return
    if (seenIdsRef.current.has(order.id)) return
    seenIdsRef.current.add(order.id)
    setOrders(prev => {
      if (prev.some(o => o.id === order.id)) return prev
      return [order, ...prev]
    })
    playSound()
    toast(`Yangi buyurtma! #${order.order_code}`, { icon: '🔔', duration: 6000 })
  }

  const connectWS = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
      ws.onmessage = (e) => {
        let msg
        try { msg = JSON.parse(e.data) } catch { return }

        if (msg.type === 'order_status_changed') {
          const updated = msg.payload
          if (updated.status === 'cooking') {
            // Order was confirmed by cashier — add to kitchen display
            handleNewCookingOrder(updated)
          } else {
            // Order left cooking state (ready/served/rejected) — remove from display
            setOrders(prev => prev.filter(o => o.id !== updated.id))
          }
        }
        // 'new_order' events are ignored here — orders start as 'pending' and
        // must be confirmed by the cashier (status → 'cooking') before appearing here
      }
      ws.onclose = () => {
        if (reconnectRef.current) clearTimeout(reconnectRef.current)
        reconnectRef.current = setTimeout(connectWS, 2000)
      }
      ws.onerror = () => {
        try { ws.close() } catch {}
      }
      wsRef.current = ws
    } catch {
      reconnectRef.current = setTimeout(connectWS, 2000)
    }
  }

  const pollOrders = async () => {
    try {
      const res = await ordersAPI.getAll()
      const active = (res.data || []).filter(isCooking)
      // On first run, seed seenIds so we don't beep for everything
      if (seenIdsRef.current.size === 0) {
        active.forEach(o => seenIdsRef.current.add(o.id))
        setOrders(active)
        return
      }
      // Detect newly cooking orders we haven't seen yet
      const fresh = active.filter(o => !seenIdsRef.current.has(o.id))
      fresh.forEach(o => handleNewCookingOrder(o))
      // Drop orders that are no longer cooking (marked ready/served elsewhere)
      setOrders(prev => prev.filter(o => active.some(p => p.id === o.id)))
    } catch {}
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
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  const initialLoad = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll()
      const active = (res.data || []).filter(isCooking)
      active.forEach(o => seenIdsRef.current.add(o.id))
      setOrders(active)
    } catch { toast.error('Yuklanmadi') }
    finally { setLoading(false) }
  }

  const markDone = async (order) => {
    setCompleting(order.id)
    try {
      await ordersAPI.updateStatus(order.id, 'ready')
      setOrders(prev => prev.filter(o => o.id !== order.id))
      toast.success(`Buyurtma #${order.order_code} tayyor!`, { icon: '✅', duration: 4000 })
    } catch { toast.error('Xatolik yuz berdi') }
    finally { setCompleting(null) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e' }}>
      <ChefHat size={48} color="#FF6B35" className="animate-spin" />
    </div>
  )

  return (
    <div className="kitchen-page">
      {kMapOrder && <KitchenRouteModal order={kMapOrder} onClose={() => setKMapOrder(null)} />}
      <div className="background-container">
        <img className="moon" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png" alt="" />
        <div className="stars" />
        <div className="twinkling" />
        <div className="clouds" />
      </div>
      <header className="kitchen-header">
        <div className="kh-left">
          <button className="kh-icon-btn" onClick={() => navigate('/staff')}><Home size={20} /></button>
          <ChefHat size={24} color="white" />
          <h1 className="kh-title">Oshpazxona paneli</h1>
        </div>
        <div className="kh-center">
          {orders.length > 0 ? (
            <span className="kh-badge-new">
              <Bell size={15} />
              {orders.length} ta buyurtma
            </span>
          ) : (
            <span className="kh-badge-empty">Buyurtma yo'q</span>
          )}
        </div>
        <button className="kh-refresh" onClick={() => pollOrders()}>
          <RefreshCw size={16} /> Yangilash
        </button>
      </header>

      <div className="kitchen-main">
        {orders.length === 0 ? (
          <div className="kitchen-empty">
            <ChefHat size={72} color="rgba(255,107,53,0.25)" />
            <h2>Yangi buyurtmalar yo'q</h2>
            <p>Buyurtmalar kelganda bu yerda ko'rinadi</p>
          </div>
        ) : (
          <div className="korders-grid">
            {orders.map(order => (
              <div key={order.id} className="korder-card">
                <div className="korder-header">
                  <span className="korder-code">#{order.order_code}</span>
                  <span className="korder-time">
                    <Clock size={13} />
                    {fmtTime(order.created_at)} · {fmtElapsed(order.created_at)}
                  </span>
                </div>

                {(order.customer_first_name || order.customer_phone) && (
                  <div className="korder-customer">
                    {order.customer_first_name && (
                      <div><User size={12} /> {order.customer_first_name} {order.customer_last_name || ''}</div>
                    )}
                    {order.customer_phone && (
                      <a href={`tel:${order.customer_phone}`}><Phone size={12} /> {order.customer_phone}</a>
                    )}
                    {order.delivery_type === 'delivery' ? (
                      <div className="korder-delivery">
                        <Truck size={12} />
                        <span>{order.delivery_address || 'Manzil yo\'q'}</span>
                        {order.delivery_lat && order.delivery_lng && (
                          <button
                            className="korder-map-link"
                            onClick={() => setKMapOrder(order)}
                          >
                            <Navigation2 size={12} /> Yo'l
                          </button>
                        )}
                      </div>
                    ) : order.customer_phone ? (
                      <div className="korder-delivery"><Store size={12} /> Olib ketadi</div>
                    ) : null}
                  </div>
                )}

                {order.items?.length > 0 && (
                  <ul className="korder-items">
                    {order.items.map((item, i) => (
                      <li key={i} className="korder-item">
                        <span className="korder-qty">×{item.quantity}</span>
                        <span className="korder-name">{item.item_name}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {order.note && (
                  <p className="korder-note">💬 {order.note}</p>
                )}

                <div className="korder-footer">
                  <span className="korder-total">{order.final_price?.toLocaleString()} so'm</span>
                  <button
                    className={`korder-done-btn ${completing === order.id ? 'loading' : ''}`}
                    onClick={() => markDone(order)}
                    disabled={completing === order.id}
                  >
                    <CheckCircle size={18} />
                    {completing === order.id ? 'Saqlanmoqda...' : 'Tayyor!'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
