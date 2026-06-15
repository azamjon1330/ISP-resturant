import React, { useState, useEffect, useRef, useCallback } from 'react'
import { courierAPI } from '../../api'
import toast from 'react-hot-toast'
import {
  Truck, MapPin, Phone, User, Package, CheckCircle2,
  Navigation2, Wifi, WifiOff, LogOut, RefreshCw,
  Clock, Layers, ChevronDown, ChevronUp,
  ShieldCheck, ArrowRight, Loader2,
  AlertCircle, Eye, EyeOff, CircleDot, Circle, CheckCircle
} from 'lucide-react'
import './CourierPage.css'

/* ─── Helpers ─── */
const fmtTime = (iso) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fmtElapsed = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return 'Hozir'
  if (diff < 60) return `${diff} daq`
  return `${Math.floor(diff / 60)}s ${diff % 60}d`
}

const fmt = (n) => `${Number(n || 0).toLocaleString('uz-UZ')} so'm`

/* ─── Map initialization using Leaflet + Google Maps tiles ─── */
async function initLeafletMap(containerEl, courierPos, orderPos) {
  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  const center = courierPos || orderPos || [41.2995, 69.2401]
  const map = L.map(containerEl, { zoomControl: true }).setView(center, 13)

  L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 21,
    attribution: '© Google Maps',
  }).addTo(map)

  const courierIcon = L.divIcon({
    html: `<div class="cr-map-marker cr-map-marker--courier">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    className: '',
  })

  const deliveryIcon = L.divIcon({
    html: `<div class="cr-map-marker cr-map-marker--delivery">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    className: '',
  })

  const markers = {}

  if (courierPos) {
    markers.courier = L.marker(courierPos, { icon: courierIcon }).addTo(map)
    markers.courier.bindPopup('<b>Mening joylashuvim</b>', { closeButton: false })
  }
  if (orderPos) {
    markers.delivery = L.marker(orderPos, { icon: deliveryIcon }).addTo(map)
    markers.delivery.bindPopup('<b>Yetkazish manzili</b>', { closeButton: false })
  }

  if (courierPos && orderPos) {
    map.fitBounds([courierPos, orderPos], { padding: [60, 60] })
  } else if (courierPos) {
    map.setView(courierPos, 15)
  } else if (orderPos) {
    map.setView(orderPos, 15)
  }

  return { map, markers, L }
}

/* ═══════════════════════════════════════════════════════
   ORDER CARD COMPONENT
═══════════════════════════════════════════════════════ */
function OrderCard({ order, onAccept, onComplete, accepting, completing, onSelect, selected }) {
  const [expanded, setExpanded] = useState(false)
  const isActive = order.status === 'on_way'
  const isDone   = order.status === 'served'

  const yandexUrl =
    order.delivery_lat && order.delivery_lng
      ? `https://yandex.uz/maps/?ll=${order.delivery_lng},${order.delivery_lat}&z=17&pt=${order.delivery_lng},${order.delivery_lat}`
      : null

  return (
    <div
      className={[
        'cr-order-card',
        isActive ? 'cr-order-card--active' : '',
        isDone   ? 'cr-order-card--done'   : '',
        selected ? 'cr-order-card--selected' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onSelect?.(order)}
    >
      {/* Header */}
      <div className="cr-oc-header">
        <div className="cr-oc-code">
          {isActive && <span className="cr-oc-pulse" />}
          #{order.order_code}
        </div>
        <div className="cr-oc-meta">
          <Clock size={12} />
          {fmtTime(order.created_at)} · {fmtElapsed(order.created_at)}
        </div>
      </div>

      {/* Status badge */}
      <div className={`cr-oc-status cr-oc-status--${order.status}`}>
        {order.status === 'ready'  && <><Circle size={10} /> Tayyor — qabul qiling</>}
        {order.status === 'on_way' && <><CircleDot size={10} /> Yo'lda — yetkazilmoqda</>}
        {order.status === 'served' && <><CheckCircle size={10} /> Yetkazildi</>}
      </div>

      {/* Customer */}
      {(order.customer_first_name || order.customer_phone) && (
        <div className="cr-oc-customer">
          {order.customer_first_name && (
            <div>
              <User size={12} /> {order.customer_first_name} {order.customer_last_name || ''}
            </div>
          )}
          {order.customer_phone && (
            <a href={`tel:${order.customer_phone}`} onClick={(e) => e.stopPropagation()}>
              <Phone size={12} /> {order.customer_phone}
            </a>
          )}
        </div>
      )}

      {/* Address */}
      {order.delivery_address && (
        <div className="cr-oc-addr">
          <MapPin size={13} />
          <span>{order.delivery_address}</span>
          {yandexUrl && (
            <a
              href={yandexUrl}
              target="_blank"
              rel="noreferrer"
              className="cr-oc-map-link"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation2 size={11} /> Xarita
            </a>
          )}
        </div>
      )}

      {/* Items toggle */}
      {order.items?.length > 0 && (
        <button
          className="cr-oc-items-toggle"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((x) => !x)
          }}
        >
          <Package size={13} /> {order.items.length} ta mahsulot
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      )}
      {expanded && (
        <ul className="cr-oc-items">
          {order.items.map((it, i) => (
            <li key={i}>
              <span className="cr-oc-qty">×{it.quantity}</span>
              <span>{it.item_name}</span>
              <span className="cr-oc-item-price">{fmt(it.unit_price * it.quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Note */}
      {order.note && (
        <div className="cr-oc-note">
          <AlertCircle size={12} /> {order.note}
        </div>
      )}

      {/* Footer */}
      <div className="cr-oc-footer">
        <span className="cr-oc-total">{fmt(order.final_price || order.total_price)}</span>
        {order.status === 'ready' && (
          <button
            className="cr-oc-btn cr-oc-btn--accept"
            disabled={accepting === order.id}
            onClick={(e) => {
              e.stopPropagation()
              onAccept(order.id)
            }}
          >
            {accepting === order.id
              ? <Loader2 size={14} className="cr-spin" />
              : <><Truck size={14} /> Olaman</>
            }
          </button>
        )}
        {order.status === 'on_way' && (
          <button
            className="cr-oc-btn cr-oc-btn--complete"
            disabled={completing === order.id}
            onClick={(e) => {
              e.stopPropagation()
              onComplete(order.id)
            }}
          >
            {completing === order.id
              ? <Loader2 size={14} className="cr-spin" />
              : <><CheckCircle2 size={14} /> Yetkazildi</>
            }
          </button>
        )}
        {order.status === 'served' && (
          <span className="cr-oc-done-badge">
            <CheckCircle size={14} /> Yetkazildi
          </span>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════ */
export default function CourierPage() {
  /* ─ Auth ─ */
  const [courier,     setCourier]  = useState(null)
  const [authPhone,   setAPhone]   = useState('')
  const [authPin,     setAPin]     = useState('')
  const [authLoading, setAL]       = useState(false)
  const [showPin,     setShowPin]  = useState(false)

  /* ─ Orders ─ */
  const [available,     setAvailable]    = useState([])
  const [mine,          setMine]         = useState([])
  const [tab,           setTab]          = useState('available') // 'available' | 'active' | 'done'
  const [selectedOrder, setSelected]     = useState(null)

  /* ─ Actions ─ */
  const [accepting,  setAccepting]  = useState(null)
  const [completing, setCompleting] = useState(null)

  /* ─ Location ─ */
  const [online,     setOnline]    = useState(false)
  const [courierPos, setCourierPos] = useState(null) // [lat, lng]
  const locationInterval = useRef(null)

  /* ─ Map ─ */
  const mapContainerRef = useRef(null)
  const leafletRef      = useRef(null) // { map, markers, L }
  const [showRoute, setShowRoute]   = useState(false)

  /* ─ WS ─ */
  const wsRef     = useRef(null)
  const reconnRef = useRef(null)
  const seenIdsRef = useRef(new Set())
  const [, tick]  = useState(0)

  /* ─ Sound ─ */
  const playBeep = useCallback(() => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }, [])

  /* ─ Login ─ */
  const doLogin = useCallback(async () => {
    if (authPhone.length < 9 || authPin.length < 4) {
      toast.error("Telefon va PIN to'ldiring")
      return
    }
    setAL(true)
    try {
      const res = await courierAPI.login({ phone: '+998' + authPhone, pin: authPin })
      if (res.data?.token) {
        localStorage.setItem('eco_courier_token', res.data.token)
        setCourier(res.data.courier)
        toast.success(`Xush kelibsiz, ${res.data.courier?.first_name || 'Kuryer'}!`)
      }
    } catch {
      toast.error("Telefon yoki PIN noto'g'ri")
    }
    setAL(false)
  }, [authPhone, authPin])

  /* ─ Restore auth ─ */
  useEffect(() => {
    const token = localStorage.getItem('eco_courier_token')
    if (!token) return
    courierAPI
      .me()
      .then((r) => {
        if (r.data?.id) setCourier(r.data)
      })
      .catch(() => {
        localStorage.removeItem('eco_courier_token')
      })
  }, [])

  /* ─ Load orders ─ */
  const loadOrders = useCallback(async () => {
    if (!localStorage.getItem('eco_courier_token')) return
    try {
      const [av, mn] = await Promise.all([courierAPI.available(), courierAPI.mine()])
      setAvailable(av.data || [])
      setMine(mn.data || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (!courier) return
    loadOrders()
    const iv     = setInterval(loadOrders, 5000)
    const tickIv = setInterval(() => tick((n) => n + 1), 30000)
    return () => {
      clearInterval(iv)
      clearInterval(tickIv)
    }
  }, [courier, loadOrders])

  /* ─ WebSocket ─ */
  const connectWS = useCallback(() => {
    if (!localStorage.getItem('eco_courier_token')) return
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws    = new WebSocket(`${proto}//${location.host}/ws`)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'new_ready_order') {
          const ord = msg.payload
          if (ord && !seenIdsRef.current.has(ord.id)) {
            seenIdsRef.current.add(ord.id)
            toast(`Yangi buyurtma #${ord.order_code}`, { icon: '🔔', duration: 6000 })
            playBeep()
          }
          loadOrders()
        }
        if (msg.type === 'order_status_changed') loadOrders()
      } catch {}
    }
    ws.onclose = () => {
      clearTimeout(reconnRef.current)
      reconnRef.current = setTimeout(connectWS, 2000)
    }
    ws.onerror = () => {
      try { ws.close() } catch {}
    }
    wsRef.current = ws
  }, [loadOrders, playBeep])

  useEffect(() => {
    if (!courier) return
    connectWS()
    return () => {
      wsRef.current?.close()
      clearTimeout(reconnRef.current)
    }
  }, [courier, connectWS])

  /* ─ Location sharing ─ */
  const pushLocation = useCallback((lat, lng) => {
    setCourierPos([lat, lng])
    courierAPI.updateLocation(lat, lng).catch(() => {})
  }, [])

  const startLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolokatsiya qo'llab-quvvatlanmaydi")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
      () => toast.error("Joylashuvni aniqlab bo'lmadi"),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    locationInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }, 20000)
  }, [pushLocation])

  const stopLocation = useCallback(() => {
    clearInterval(locationInterval.current)
    locationInterval.current = null
  }, [])

  const toggleOnline = () => {
    const next = !online
    setOnline(next)
    if (next) startLocation()
    else stopLocation()
  }

  useEffect(() => () => stopLocation(), [stopLocation])

  /* ─ Map init / update ─ */
  useEffect(() => {
    if (!courier) return
    if (!mapContainerRef.current) return

    const orderPos =
      selectedOrder?.delivery_lat && selectedOrder?.delivery_lng
        ? [selectedOrder.delivery_lat, selectedOrder.delivery_lng]
        : null

    if (leafletRef.current) {
      const { map, markers, L } = leafletRef.current

      if (courierPos) {
        if (markers.courier) {
          markers.courier.setLatLng(courierPos)
        } else {
          const icon = L.divIcon({
            html: `<div class="cr-map-marker cr-map-marker--courier"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>`,
            iconSize: [40, 40], iconAnchor: [20, 40], className: '',
          })
          markers.courier = L.marker(courierPos, { icon }).addTo(map)
        }
      }

      if (orderPos) {
        if (markers.delivery) {
          markers.delivery.setLatLng(orderPos)
        } else {
          const icon = L.divIcon({
            html: `<div class="cr-map-marker cr-map-marker--delivery"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
            iconSize: [40, 40], iconAnchor: [20, 40], className: '',
          })
          markers.delivery = L.marker(orderPos, { icon }).addTo(map)
        }
      }

      if (courierPos && orderPos) {
        map.fitBounds([courierPos, orderPos], { padding: [60, 60] })
      } else if (courierPos) {
        map.setView(courierPos, 15)
      } else if (orderPos) {
        map.setView(orderPos, 15)
      }

      return
    }

    // First init
    initLeafletMap(mapContainerRef.current, courierPos, orderPos)
      .then((result) => { leafletRef.current = result })
      .catch(() => {})
  }, [courier, courierPos, selectedOrder])

  // Cleanup map on unmount
  useEffect(() => () => {
    if (leafletRef.current) {
      leafletRef.current.map.remove()
      leafletRef.current = null
    }
  }, [])

  /* ─ Actions ─ */
  const acceptOrder = async (id) => {
    setAccepting(id)
    try {
      await courierAPI.accept(id)
      toast.success('Buyurtma qabul qilindi!')
      setTab('active')
      await loadOrders()
    } catch {
      toast.error('Xatolik yuz berdi')
    }
    setAccepting(null)
  }

  const completeOrder = async (id) => {
    setCompleting(id)
    try {
      await courierAPI.complete(id)
      toast.success('Yetkazildi! Rahmat', { duration: 5000 })
      setSelected(null)
      await loadOrders()
    } catch {
      toast.error('Xatolik yuz berdi')
    }
    setCompleting(null)
  }

  const logout = () => {
    stopLocation()
    wsRef.current?.close()
    localStorage.removeItem('eco_courier_token')
    setCourier(null)
    setAvailable([])
    setMine([])
    setOnline(false)
    setSelected(null)
    if (leafletRef.current) {
      leafletRef.current.map.remove()
      leafletRef.current = null
    }
  }

  /* ─ Computed ─ */
  const activeOrders = mine.filter((o) => o.status === 'on_way')
  const doneOrders   = mine.filter((o) => o.status === 'served')

  const currentList =
    tab === 'available' ? available
    : tab === 'active'  ? activeOrders
    : doneOrders

  const routeUrl =
    selectedOrder?.status === 'on_way' && courierPos && selectedOrder.delivery_lat
      ? `https://maps.google.com/maps?saddr=${courierPos[0]},${courierPos[1]}&daddr=${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}&dirflg=d&output=embed`
      : null

  /* ═══════════ LOGIN PAGE ═══════════ */
  if (!courier) {
    return (
      <div className="cr-login-page">
        <div className="background-container">
          <img
            className="moon"
            src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png"
            alt=""
          />
          <div className="stars" />
          <div className="twinkling" />
          <div className="clouds" />
        </div>

        <div className="cr-login-card">
          <div className="cr-login-logo">
            <div className="cr-login-logo-icon">
              <Truck size={24} color="#FF6B35" />
            </div>
            <div>
              <div className="cr-login-logo-name">ECO <span>Taomlar</span></div>
              <div className="cr-login-logo-sub">Kuryer paneli</div>
            </div>
          </div>

          <h2 className="cr-login-title">Tizimga kirish</h2>
          <p className="cr-login-hint">Telefon raqami va PIN-kodingizni kiriting</p>

          <div className="cr-login-field">
            <label><Phone size={13} /> Telefon raqami</label>
            <div className="cr-login-phone-row">
              <span className="cr-phone-prefix">+998</span>
              <input
                type="tel"
                placeholder="90 123 45 67"
                value={authPhone}
                maxLength={9}
                onChange={(e) => setAPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
            </div>
          </div>

          <div className="cr-login-field">
            <label><ShieldCheck size={13} /> PIN-kod</label>
            <div className="cr-login-pin-row">
              <input
                type={showPin ? 'text' : 'password'}
                placeholder="• • • •"
                value={authPin}
                maxLength={6}
                onChange={(e) => setAPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
              <button
                type="button"
                className="cr-pin-toggle"
                onClick={() => setShowPin((x) => !x)}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="cr-login-btn" onClick={doLogin} disabled={authLoading}>
            {authLoading
              ? <Loader2 size={18} className="cr-spin" />
              : <><ArrowRight size={18} /> Kirish</>
            }
          </button>
        </div>
      </div>
    )
  }

  /* ═══════════ MAIN DASHBOARD ═══════════ */
  return (
    <div className="cr-page">
      <div className="background-container">
        <img
          className="moon"
          src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png"
          alt=""
        />
        <div className="stars" />
        <div className="twinkling" />
        <div className="clouds" />
      </div>

      {/* ── HEADER ── */}
      <header className="cr-header">
        <div className="cr-header-left">
          <div className="cr-logo">
            <Truck size={20} color="#fff" /> ECO Taomlar
          </div>
          <div className="cr-courier-info">
            <div className="cr-courier-av">{courier.first_name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="cr-courier-name">
                {courier.first_name} {courier.last_name || ''}
              </div>
              <div className="cr-courier-phone">
                <Phone size={10} /> {courier.phone}
              </div>
            </div>
          </div>
        </div>

        <div className="cr-header-stats">
          <div className="cr-stat cr-stat--available" onClick={() => setTab('available')}>
            <Package size={16} />
            <span className="cr-stat-n">{available.length}</span>
            <span className="cr-stat-l">Tayyor</span>
          </div>
          <div className="cr-stat cr-stat--active" onClick={() => setTab('active')}>
            <Truck size={16} />
            <span className="cr-stat-n">{activeOrders.length}</span>
            <span className="cr-stat-l">Yo'lda</span>
          </div>
          <div className="cr-stat cr-stat--done" onClick={() => setTab('done')}>
            <CheckCircle size={16} />
            <span className="cr-stat-n">{doneOrders.length}</span>
            <span className="cr-stat-l">Yetkazildi</span>
          </div>
        </div>

        <div className="cr-header-right">
          <button
            className={`cr-online-btn${online ? ' cr-online-btn--on' : ''}`}
            onClick={toggleOnline}
          >
            {online
              ? <><Wifi size={15} /> Faol</>
              : <><WifiOff size={15} /> Offline</>
            }
          </button>
          <button className="cr-icon-btn" onClick={loadOrders} title="Yangilash">
            <RefreshCw size={16} />
          </button>
          <button className="cr-icon-btn cr-icon-btn--danger" onClick={logout} title="Chiqish">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="cr-body">

        {/* Left: Order Panel */}
        <div className="cr-panel">

          {/* Tabs */}
          <div className="cr-tabs">
            <button
              className={tab === 'available' ? 'active' : ''}
              onClick={() => setTab('available')}
            >
              <Package size={14} /> Tayyor
              {available.length > 0 && (
                <span className="cr-tab-badge">{available.length}</span>
              )}
            </button>
            <button
              className={tab === 'active' ? 'active' : ''}
              onClick={() => setTab('active')}
            >
              <Truck size={14} /> Yo'lda
              {activeOrders.length > 0 && (
                <span className="cr-tab-badge">{activeOrders.length}</span>
              )}
            </button>
            <button
              className={tab === 'done' ? 'active' : ''}
              onClick={() => setTab('done')}
            >
              <CheckCircle size={14} /> Yetkazildi
            </button>
          </div>

          {/* Location banner */}
          {tab === 'active' && (
            <div className={`cr-location-banner${online ? ' cr-location-banner--on' : ''}`}>
              <Navigation2 size={14} />
              {online
                ? courierPos
                  ? `Joylashuv: ${courierPos[0].toFixed(4)}, ${courierPos[1].toFixed(4)}`
                  : 'Joylashuv aniqlanmoqda...'
                : 'Joylashuvni ulash uchun "Faol" tugmasini bosing'
              }
            </div>
          )}

          {/* Order list */}
          <div className="cr-order-list">
            {currentList.length === 0 ? (
              <div className="cr-empty">
                {tab === 'available' && (
                  <>
                    <Package size={48} />
                    <p>Tayyor buyurtmalar yo'q</p>
                    <span>Yangi buyurtmalar kelganda bu yerda ko'rinadi</span>
                  </>
                )}
                {tab === 'active' && (
                  <>
                    <Truck size={48} />
                    <p>Faol buyurtmalar yo'q</p>
                    <span>Buyurtma qabul qiling</span>
                  </>
                )}
                {tab === 'done' && (
                  <>
                    <CheckCircle size={48} />
                    <p>Yetkazilgan buyurtmalar yo'q</p>
                    <span>Bajarilgan buyurtmalar bu yerda saqlanadi</span>
                  </>
                )}
              </div>
            ) : (
              currentList.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAccept={acceptOrder}
                  onComplete={completeOrder}
                  accepting={accepting}
                  completing={completing}
                  selected={selectedOrder?.id === order.id}
                  onSelect={(o) => {
                    setSelected((prev) => (prev?.id === o.id ? null : o))
                    setShowRoute(false)
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Map Panel */}
        <div className="cr-map-panel">

          {/* Map header */}
          <div className="cr-map-header">
            <div className="cr-map-title">
              <Layers size={16} />
              {selectedOrder
                ? `#${selectedOrder.order_code} — ${selectedOrder.delivery_address || "Manzil yo'q"}`
                : 'Xarita'
              }
            </div>
            {selectedOrder?.status === 'on_way' && courierPos && selectedOrder.delivery_lat && (
              <button
                className={`cr-route-toggle${showRoute ? ' active' : ''}`}
                onClick={() => setShowRoute((x) => !x)}
              >
                <Navigation2 size={14} /> {showRoute ? 'Xaritaga' : 'Marshrut'}
              </button>
            )}
          </div>

          {/* Map / Route */}
          <div className="cr-map-area">
            {showRoute && routeUrl ? (
              <iframe
                src={routeUrl}
                className="cr-route-iframe"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div ref={mapContainerRef} className="cr-leaflet-map" />
            )}
          </div>

          {/* Legend */}
          <div className="cr-map-legend">
            <div className="cr-legend-item">
              <div className="cr-legend-dot cr-legend-dot--courier" /> Mening joylashuvim
            </div>
            <div className="cr-legend-item">
              <div className="cr-legend-dot cr-legend-dot--delivery" /> Yetkazish manzili
            </div>
            {!online && (
              <div className="cr-legend-hint">
                <WifiOff size={11} /> Joylashuvni ulash uchun "Faol" tugmasini bosing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
