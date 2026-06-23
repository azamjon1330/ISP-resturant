import React, { useState, useEffect, useRef, useCallback } from 'react'
import { courierAPI } from '../../api'
import toast from 'react-hot-toast'
import {
  Truck, MapPin, Phone, User, Package, CheckCircle2,
  Navigation2, Wifi, WifiOff, LogOut, RefreshCw,
  Clock, ShieldCheck, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, Eye, EyeOff, ChevronRight,
  CircleDot, Circle, CheckCircle
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

/* ─── Map init ─── */
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 40], className: '',
  })

  const deliveryIcon = L.divIcon({
    html: `<div class="cr-map-marker cr-map-marker--delivery">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 40], className: '',
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

  return { map, markers, L, routeLine: null }
}

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
  } catch {
    return null
  }
}

/* ─── Compact Order Card (for bottom list) ─── */
function CompactOrderCard({ order, selected, onSelect }) {
  const isActive = order.status === 'on_way'
  const isDone   = order.status === 'served'
  return (
    <div
      className={[
        'cr-coc',
        isActive  ? 'cr-coc--active'   : '',
        isDone    ? 'cr-coc--done'     : '',
        selected  ? 'cr-coc--selected' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onSelect(order)}
    >
      <div className="cr-coc-left">
        {isActive && <span className="cr-oc-pulse" />}
        <span className="cr-coc-code">#{order.order_code}</span>
        {order.customer_first_name && (
          <span className="cr-coc-name">{order.customer_first_name}</span>
        )}
      </div>
      <div className="cr-coc-right">
        <span className={`cr-coc-status cr-coc-status--${order.status}`}>
          {order.status === 'ready'  && 'Tayyor'}
          {order.status === 'on_way' && "Yo'lda"}
          {order.status === 'served' && '✓'}
        </span>
        <ChevronRight size={13} className="cr-coc-arrow" />
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
  const [available,     setAvailable] = useState([])
  const [mine,          setMine]      = useState([])
  const [tab,           setTab]       = useState('available')
  const [selectedOrder, setSelected]  = useState(null)
  const [detailOrder,   setDetail]    = useState(null)

  /* ─ Actions ─ */
  const [accepting,  setAccepting]  = useState(null)
  const [completing, setCompleting] = useState(null)

  /* ─ Location ─ */
  const [online,     setOnline]    = useState(false)
  const [courierPos, setCourierPos] = useState(null)
  const locationInterval = useRef(null)

  /* ─ Map ─ */
  const mapContainerRef = useRef(null)
  const leafletRef      = useRef(null)
  const [routeInfo,    setRouteInfo]    = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  /* ─ WS ─ */
  const wsRef      = useRef(null)
  const reconnRef  = useRef(null)
  const seenIdsRef = useRef(new Set())
  const [, tick]   = useState(0)

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
    if (authPhone.length < 9 || authPin.length < 1) {
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
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Sizning hisobingiz faolsiz. Admin bilan bog'laning")
      } else {
        toast.error("Telefon yoki PIN noto'g'ri")
      }
    }
    setAL(false)
  }, [authPhone, authPin])

  /* ─ Restore auth ─ */
  useEffect(() => {
    const token = localStorage.getItem('eco_courier_token')
    if (!token) return
    courierAPI
      .me()
      .then((r) => { if (r.data?.id) setCourier(r.data) })
      .catch(() => { localStorage.removeItem('eco_courier_token') })
  }, [])

  /* ─ Load orders ─ */
  const loadOrders = useCallback(async () => {
    if (!localStorage.getItem('eco_courier_token')) return { available: [], mine: [] }
    try {
      const [av, mn] = await Promise.all([courierAPI.available(), courierAPI.mine()])
      const availableData = av.data || []
      const mineData = mn.data || []
      setAvailable(availableData)
      setMine(mineData)
      return { available: availableData, mine: mineData }
    } catch {
      return { available: [], mine: [] }
    }
  }, [])

  useEffect(() => {
    if (!courier) return
    loadOrders()
    const iv     = setInterval(loadOrders, 5000)
    const tickIv = setInterval(() => tick((n) => n + 1), 30000)
    return () => { clearInterval(iv); clearInterval(tickIv) }
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
    ws.onerror = () => { try { ws.close() } catch {} }
    wsRef.current = ws
  }, [loadOrders, playBeep])

  useEffect(() => {
    if (!courier) return
    connectWS()
    return () => { wsRef.current?.close(); clearTimeout(reconnRef.current) }
  }, [courier, connectWS])

  /* ─ Location ─ */
  const pushLocation = useCallback((lat, lng) => {
    setCourierPos([lat, lng])
    courierAPI.updateLocation(lat, lng).catch(() => {})
  }, [])

  const geoErrorToast = useCallback((err) => {
    if (err.code === 1) toast.error("Joylashuvga ruxsat berilmadi", { duration: 6000 })
    else if (err.code === 2) toast.error("GPS signal yo'q")
    else toast.error("Joylashuv aniqlanmadi, qaytadan urinib ko'ring")
  }, [])

  const startLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error("Geolokatsiya qo'llab-quvvatlanmaydi"); setOnline(false); return }
    if (!window.isSecureContext) { toast.error("HTTPS ulanish kerak", { duration: 8000 }); setOnline(false); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => { geoErrorToast(err); setOnline(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
    locationInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }, 20000)
  }, [pushLocation, geoErrorToast])

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

  /* ─ OSRM route ─ */
  useEffect(() => {
    const orderPos =
      selectedOrder?.delivery_lat && selectedOrder?.delivery_lng
        ? [selectedOrder.delivery_lat, selectedOrder.delivery_lng]
        : null
    if (!courierPos || !orderPos) { setRouteInfo(null); return }
    let active = true
    setRouteLoading(true)
    fetchOSRMRoute(courierPos, orderPos).then((info) => {
      if (active) { setRouteInfo(info); setRouteLoading(false) }
    })
    return () => { active = false }
  }, [selectedOrder, courierPos])

  /* ─ Auto-select active delivery ─ */
  useEffect(() => {
    if (selectedOrder) return
    const firstActive = mine.find((o) => o.status === 'on_way')
    if (firstActive) setSelected(firstActive)
  }, [mine, selectedOrder])

  /* ─ Keep the open detail panel in sync with fresh data ─
     Without this the panel holds a stale snapshot: its status badge and
     action button (Olaman / Yetkazildi) would not reflect server changes,
     and the panel would not close after the order leaves the lists. */
  useEffect(() => {
    setDetail((prev) => {
      if (!prev) return prev
      const fresh = mine.find((o) => o.id === prev.id) || available.find((o) => o.id === prev.id)
      if (!fresh) return null               // order gone → close the panel
      if (fresh.status === prev.status) return prev   // unchanged → keep ref
      return fresh
    })
  }, [mine, available])

  /* ─ Keep the selected order fresh; drop it only when gone from both lists ─
     Identity is preserved unless status / coords change, so the map effect
     does not refit and yank the view away every poll. */
  useEffect(() => {
    setSelected((prev) => {
      if (!prev) return prev
      const fresh = mine.find((o) => o.id === prev.id) || available.find((o) => o.id === prev.id)
      if (!fresh) return null
      if (
        fresh.status === prev.status &&
        fresh.delivery_lat === prev.delivery_lat &&
        fresh.delivery_lng === prev.delivery_lng
      ) return prev
      return fresh
    })
  }, [mine, available])

  /* ─ Map init / update ─ */
  useEffect(() => {
    if (!courier) return
    if (!mapContainerRef.current) return

    const orderPos =
      selectedOrder?.delivery_lat && selectedOrder?.delivery_lng
        ? [selectedOrder.delivery_lat, selectedOrder.delivery_lng]
        : null

    const applyState = ({ map, markers, L }) => {
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
      } else if (markers.delivery) {
        markers.delivery.remove()
        markers.delivery = null
      }

      if (routeInfo?.coords?.length) {
        if (leafletRef.current.routeLine) {
          leafletRef.current.routeLine.setLatLngs(routeInfo.coords)
        } else {
          leafletRef.current.routeLine = L.polyline(routeInfo.coords, {
            color: '#FF6B35', weight: 5, opacity: 0.85, lineJoin: 'round',
          }).addTo(map)
        }
        map.fitBounds(L.latLngBounds(routeInfo.coords), { padding: [70, 70] })
      } else {
        if (leafletRef.current.routeLine) {
          leafletRef.current.routeLine.remove()
          leafletRef.current.routeLine = null
        }
        if (courierPos && orderPos) {
          map.fitBounds([courierPos, orderPos], { padding: [60, 60] })
        } else if (courierPos) {
          map.setView(courierPos, 15)
        } else if (orderPos) {
          map.setView(orderPos, 15)
        }
      }
    }

    if (leafletRef.current) { applyState(leafletRef.current); return }
    initLeafletMap(mapContainerRef.current, courierPos, orderPos)
      .then((result) => { leafletRef.current = result; applyState(result) })
      .catch(() => {})
  }, [courier, courierPos, selectedOrder, routeInfo])

  useEffect(() => () => {
    if (leafletRef.current) { leafletRef.current.map.remove(); leafletRef.current = null }
  }, [])

  /* ─ Actions ─ */
  const acceptOrder = async (id, onSuccess) => {
    setAccepting(id)
    try {
      await courierAPI.accept(id)
      toast.success('Buyurtma qabul qilindi!')
      setTab('active')
      const { mine: freshMine } = await loadOrders()
      const accepted = freshMine.find((o) => o.id === id)
      if (accepted) setSelected(accepted)
      onSuccess?.()
    } catch {
      toast.error('Xatolik yuz berdi')
    }
    setAccepting(null)
  }

  const completeOrder = async (id, onSuccess) => {
    setCompleting(id)
    try {
      await courierAPI.complete(id)
      toast.success('Yetkazildi! Rahmat', { duration: 5000 })
      setSelected(null)
      await loadOrders()
      onSuccess?.()
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
    setAvailable([]); setMine([])
    setOnline(false); setSelected(null); setDetail(null)
    if (leafletRef.current) { leafletRef.current.map.remove(); leafletRef.current = null }
  }

  /* ─ Computed ─ */
  const activeOrders = mine.filter((o) => o.status === 'on_way')
  const doneOrders   = mine.filter((o) => o.status === 'served')
  const currentList  =
    tab === 'available' ? available
    : tab === 'active'  ? activeOrders
    : doneOrders

  /* ═══════════ LOGIN PAGE ═══════════ */
  if (!courier) {
    return (
      <div className="cr-login-page">
        <div className="background-container">
          <img className="moon" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png" alt="" />
          <div className="stars" />
          <div className="twinkling" />
          <div className="clouds" />
        </div>
        <div className="cr-login-card">
          <div className="cr-login-logo">
            <div className="cr-login-logo-icon"><Truck size={24} color="#FF6B35" /></div>
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
                type="tel" placeholder="90 123 45 67"
                value={authPhone} maxLength={9}
                onChange={(e) => setAPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
            </div>
          </div>
          <div className="cr-login-field">
            <label><ShieldCheck size={13} /> PIN-kod</label>
            <div className="cr-login-pin-row">
              <input
                type={showPin ? 'text' : 'password'} placeholder="• • • •"
                value={authPin} maxLength={10}
                onChange={(e) => setAPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
              <button type="button" className="cr-pin-toggle" onClick={() => setShowPin((x) => !x)}>
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="cr-login-btn" onClick={doLogin} disabled={authLoading}>
            {authLoading ? <Loader2 size={18} className="cr-spin" /> : <><ArrowRight size={18} /> Kirish</>}
          </button>
        </div>
      </div>
    )
  }

  /* ═══════════ MAIN DASHBOARD ═══════════ */
  return (
    <div className="cr-page">
      <div className="background-container">
        <img className="moon" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png" alt="" />
        <div className="stars" />
        <div className="twinkling" />
        <div className="clouds" />
      </div>

      {/* ── COMPACT HEADER ── */}
      <header className="cr-header">
        <div className="cr-h-left">
          <div className="cr-courier-av">{courier.first_name?.[0]?.toUpperCase()}</div>
          <div className="cr-courier-info">
            <span className="cr-courier-name">{courier.first_name} {courier.last_name || ''}</span>
            <span className="cr-courier-phone"><Phone size={10} /> {courier.phone}</span>
          </div>
        </div>

        <div className="cr-h-stats">
          <button
            className={`cr-hstat ${tab === 'available' ? 'cr-hstat--active' : ''}`}
            onClick={() => setTab('available')}
          >
            <Package size={13} />
            {available.length > 0 && <span className="cr-hstat-badge">{available.length}</span>}
          </button>
          <button
            className={`cr-hstat ${tab === 'active' ? 'cr-hstat--active' : ''}`}
            onClick={() => setTab('active')}
          >
            <Truck size={13} />
            {activeOrders.length > 0 && <span className="cr-hstat-badge cr-hstat-badge--on">{activeOrders.length}</span>}
          </button>
          <button
            className={`cr-hstat ${tab === 'done' ? 'cr-hstat--active' : ''}`}
            onClick={() => setTab('done')}
          >
            <CheckCircle size={13} />
            {doneOrders.length > 0 && <span className="cr-hstat-badge cr-hstat-badge--done">{doneOrders.length}</span>}
          </button>
        </div>

        <div className="cr-h-right">
          <button
            className={`cr-online-btn${online ? ' cr-online-btn--on' : ''}`}
            onClick={toggleOnline}
            title={online ? 'Faol' : 'Offline'}
          >
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="cr-online-label">{online ? 'Faol' : 'Offline'}</span>
          </button>
          <button className="cr-icon-btn" onClick={loadOrders} title="Yangilash">
            <RefreshCw size={14} />
          </button>
          <button className="cr-icon-btn cr-icon-btn--danger" onClick={logout} title="Chiqish">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="cr-body">

        {/* MAP — PRIMARY, takes most space */}
        <div className="cr-map-panel">
          <div ref={mapContainerRef} className="cr-leaflet-map" />

          {/* Floating route info badge */}
          {routeLoading && (
            <div className="cr-map-badge">
              <Loader2 size={11} className="cr-spin" /> Yo'l hisoblanmoqda...
            </div>
          )}
          {!routeLoading && routeInfo && (
            <div className="cr-map-badge">
              <Navigation2 size={11} />
              {(routeInfo.distance / 1000).toFixed(1)} km · {Math.round(routeInfo.duration / 60)} daq
            </div>
          )}

          {/* Floating "Delivered" FAB on map */}
          {activeOrders.length > 0 && !detailOrder && (
            <button
              className="cr-map-fab"
              disabled={completing !== null}
              onClick={() => {
                const order = (selectedOrder?.status === 'on_way' ? selectedOrder : null) || activeOrders[0]
                if (order) completeOrder(order.id)
              }}
            >
              {completing !== null
                ? <Loader2 size={16} className="cr-spin" />
                : <><CheckCircle2 size={16} /> Yetkazildi</>
              }
            </button>
          )}
        </div>

        {/* BOTTOM SHEET — orders list */}
        <div className="cr-sheet">
          <div className="cr-sheet-handle" />

          {/* Compact tabs */}
          <div className="cr-tabs">
            <button className={tab === 'available' ? 'active' : ''} onClick={() => setTab('available')}>
              <Package size={12} /> Tayyor
              {available.length > 0 && <span className="cr-tab-badge">{available.length}</span>}
            </button>
            <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
              <Truck size={12} /> Yo'lda
              {activeOrders.length > 0 && <span className="cr-tab-badge">{activeOrders.length}</span>}
            </button>
            <button className={tab === 'done' ? 'active' : ''} onClick={() => setTab('done')}>
              <CheckCircle size={12} /> Bajarildi
            </button>
          </div>

          {/* Compact order list */}
          <div className="cr-order-list">
            {currentList.length === 0 ? (
              <div className="cr-empty-sm">
                {tab === 'available' && "Tayyor buyurtmalar yo'q"}
                {tab === 'active'    && "Faol buyurtmalar yo'q"}
                {tab === 'done'      && "Yetkazilgan buyurtmalar yo'q"}
              </div>
            ) : (
              currentList.map((order) => (
                <CompactOrderCard
                  key={order.id}
                  order={order}
                  selected={selectedOrder?.id === order.id}
                  onSelect={(o) => {
                    setSelected(o)
                    setDetail(o)
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* ORDER DETAIL PANEL — slides up */}
        {detailOrder && (
          <div className="cr-detail">
            {/* Header */}
            <div className="cr-detail-hd">
              <button className="cr-detail-back" onClick={() => setDetail(null)}>
                <ArrowLeft size={15} /> Orqaga
              </button>
              <span className="cr-detail-code">#{detailOrder.order_code}</span>
              <span className={`cr-detail-badge cr-detail-badge--${detailOrder.status}`}>
                {detailOrder.status === 'ready'  && <><Circle size={9} /> Tayyor</>}
                {detailOrder.status === 'on_way' && <><CircleDot size={9} /> Yo'lda</>}
                {detailOrder.status === 'served' && <><CheckCircle size={9} /> Yetkazildi</>}
              </span>
            </div>

            {/* Scrollable body */}
            <div className="cr-detail-body">
              {/* Time */}
              <div className="cr-detail-row cr-detail-row--time">
                <Clock size={13} />
                <span>{fmtTime(detailOrder.created_at)} · {fmtElapsed(detailOrder.created_at)}</span>
              </div>

              {/* Customer */}
              {(detailOrder.customer_first_name || detailOrder.customer_phone) && (
                <div className="cr-detail-card">
                  {detailOrder.customer_first_name && (
                    <div className="cr-detail-row">
                      <User size={13} />
                      <span>{detailOrder.customer_first_name} {detailOrder.customer_last_name || ''}</span>
                    </div>
                  )}
                  {detailOrder.customer_phone && (
                    <a href={`tel:${detailOrder.customer_phone}`} className="cr-detail-row cr-detail-phone">
                      <Phone size={13} />
                      <span>{detailOrder.customer_phone}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Address */}
              {detailOrder.delivery_address && (
                <div className="cr-detail-card">
                  <div className="cr-detail-row">
                    <MapPin size={13} style={{ color: '#FF6B35', flexShrink: 0 }} />
                    <span>{detailOrder.delivery_address}</span>
                  </div>
                </div>
              )}

              {/* Items */}
              {detailOrder.items?.length > 0 && (
                <div className="cr-detail-card">
                  <div className="cr-detail-section-label">
                    <Package size={11} /> Mahsulotlar ({detailOrder.items.length} ta)
                  </div>
                  {detailOrder.items.map((it, i) => (
                    <div key={i} className="cr-detail-item">
                      <span className="cr-detail-qty">×{it.quantity}</span>
                      <span className="cr-detail-item-name">{it.item_name}</span>
                      <span className="cr-detail-item-price">{fmt(it.unit_price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              {detailOrder.note && (
                <div className="cr-detail-note">
                  <AlertCircle size={12} /> {detailOrder.note}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="cr-detail-foot">
              <div className="cr-detail-total">{fmt(detailOrder.final_price || detailOrder.total_price)}</div>
              {detailOrder.status === 'ready' && (
                <button
                  className="cr-detail-action cr-detail-action--accept"
                  disabled={accepting === detailOrder.id}
                  onClick={() => acceptOrder(detailOrder.id, () => setDetail(null))}
                >
                  {accepting === detailOrder.id
                    ? <Loader2 size={16} className="cr-spin" />
                    : <><Truck size={16} /> Olaman</>
                  }
                </button>
              )}
              {detailOrder.status === 'on_way' && (
                <button
                  className="cr-detail-action cr-detail-action--complete"
                  disabled={completing === detailOrder.id}
                  onClick={() => completeOrder(detailOrder.id, () => setDetail(null))}
                >
                  {completing === detailOrder.id
                    ? <Loader2 size={16} className="cr-spin" />
                    : <><CheckCircle2 size={16} /> Yetkazildi</>
                  }
                </button>
              )}
              {detailOrder.status === 'served' && (
                <span className="cr-detail-done"><CheckCircle size={15} /> Yetkazildi</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
