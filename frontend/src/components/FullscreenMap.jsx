import { useEffect, useRef, useState, useCallback } from 'react'
import { Navigation2, Check, ArrowLeft, Route, Loader2 } from 'lucide-react'
import './FullscreenMap.css'

const REST_DEFAULT = [40.8086726, 72.3274106]

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=ru`)
    const data = await res.json()
    const p = data.features[0]?.properties
    if (!p) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    return [
      p.name,
      p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street,
      p.city || p.town,
    ].filter(Boolean).join(', ')
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
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

/*
 * FullscreenMap — a full-screen Leaflet overlay used by the order checkout.
 *
 *  mode="delivery": user picks WHERE to deliver.
 *    • "Найти меня"        → geolocate, drop the point there, recenter
 *    • tap / drag on map   → move the point
 *    • "Выбрать это место" → confirm the point as the delivery address, close
 *
 *  mode="pickup": shows the restaurant location (marker + label).
 *    • "Показать маршрут"  → geolocate the user and draw the OSRM driving route
 *
 *  "Назад" closes the overlay; the parent keeps the last confirmed selection.
 */
export default function FullscreenMap({
  open, mode, lang = 'ru',
  initialLat, initialLng, restLabel,
  onConfirm, onClose,
}) {
  const elRef     = useRef(null)
  const mapRef    = useRef(null)
  const LRef      = useRef(null)
  const markerRef = useRef(null)  // delivery point OR pickup restaurant
  const meRef     = useRef(null)  // user's current location
  const routeRef  = useRef(null)
  const selRef    = useRef(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null)

  const [busy, setBusy]           = useState(false)
  const [hasSel, setHasSel]       = useState(!!(initialLat && initialLng))
  const [routeInfo, setRouteInfo] = useState(null)

  const t = (uz, ru) => (lang === 'uz' ? uz : ru)

  const pinIcon = useCallback((L) => L.divIcon({
    html: `<div style="width:30px;height:30px;background:#FF6B35;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(255,107,53,0.6)"></div>`,
    iconSize: [30, 30], iconAnchor: [15, 30], className: '',
  }), [])

  const restIcon = useCallback((L) => L.divIcon({
    html: `<div style="width:32px;height:32px;background:#1c1c2e;border:3px solid #FF6B35;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:15px">🍽️</span></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -30], className: '',
  }), [])

  const meIcon = useCallback((L) => L.divIcon({
    html: `<div style="width:20px;height:20px;background:#2196F3;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(33,150,243,0.6)"></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], className: '',
  }), [])

  // Place / move the delivery point.
  const placeDelivery = useCallback((lat, lng) => {
    const L = LRef.current, map = mapRef.current
    if (!L || !map) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const m = L.marker([lat, lng], { icon: pinIcon(L), draggable: true }).addTo(map)
      markerRef.current = m
      m.on('dragend', () => {
        const p = m.getLatLng()
        selRef.current = { lat: p.lat, lng: p.lng }
        setHasSel(true)
      })
    }
    selRef.current = { lat, lng }
    setHasSel(true)
  }, [pinIcon])

  // Init the map every time the overlay opens.
  useEffect(() => {
    if (!open) return
    let active = true
    selRef.current = initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    setHasSel(!!(initialLat && initialLng))
    setRouteInfo(null)

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (!active || !elRef.current || mapRef.current) return
      LRef.current = L

      const center = (initialLat && initialLng) ? [initialLat, initialLng] : REST_DEFAULT
      const map = L.map(elRef.current, { zoomControl: true }).setView(center, mode === 'pickup' ? 16 : 15)
      mapRef.current = map

      L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'], maxZoom: 21, attribution: '© Google Maps',
      }).addTo(map)

      if (mode === 'pickup') {
        const m = L.marker(center, { icon: restIcon(L) }).addTo(map)
        m.bindPopup(`<b>${restLabel || t('Milliy taomlar restorani', 'Ресторан национальных блюд')}</b>`, { closeButton: false }).openPopup()
        markerRef.current = m
      } else {
        if (selRef.current) placeDelivery(selRef.current.lat, selRef.current.lng)
        map.on('click', (e) => placeDelivery(e.latlng.lat, e.latlng.lng))
      }

      // Leaflet needs a nudge when it boots inside a freshly shown container.
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize() }, 120)
    })()

    return () => {
      active = false
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      markerRef.current = null
      meRef.current = null
      routeRef.current = null
    }
  }, [open, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Delivery: "Найти меня"
  const findMe = () => {
    if (!navigator.geolocation) return
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: la, longitude: lo } = pos.coords
        placeDelivery(la, lo)
        mapRef.current?.setView([la, lo], 17)
        setBusy(false)
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Delivery: "Выбрать это место"
  const confirmDelivery = async () => {
    const s = selRef.current
    if (!s) return
    setBusy(true)
    const address = await reverseGeocode(s.lat, s.lng)
    setBusy(false)
    onConfirm?.({ lat: s.lat, lng: s.lng, address })
    onClose?.()
  }

  // Pickup: "Показать маршрут"
  const showRoute = () => {
    if (!navigator.geolocation) return
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: la, longitude: lo } = pos.coords
        const L = LRef.current, map = mapRef.current
        if (!L || !map) { setBusy(false); return }
        if (meRef.current) meRef.current.setLatLng([la, lo])
        else meRef.current = L.marker([la, lo], { icon: meIcon(L), interactive: false }).addTo(map)

        const dest = (initialLat && initialLng) ? [initialLat, initialLng] : REST_DEFAULT
        const route = await fetchOSRMRoute([la, lo], dest)
        if (route?.coords?.length) {
          if (routeRef.current) routeRef.current.setLatLngs(route.coords)
          else routeRef.current = L.polyline(route.coords, { color: '#FF6B35', weight: 5, opacity: 0.85, lineJoin: 'round' }).addTo(map)
          map.fitBounds(L.latLngBounds(route.coords), { padding: [60, 60] })
          setRouteInfo(route)
        } else {
          map.fitBounds([[la, lo], dest], { padding: [60, 60] })
        }
        setBusy(false)
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (!open) return null

  return (
    <div className="fsm-root">
      <div className="fsm-topbar">
        <button className="fsm-back" onClick={onClose}>
          <ArrowLeft size={18} /> {t('Orqaga', 'Назад')}
        </button>
        <span className="fsm-title">
          {mode === 'pickup' ? t('Olib ketish', 'Самовывоз') : t('Yetkazish manzili', 'Адрес доставки')}
        </span>
      </div>

      <div ref={elRef} className="fsm-map" />

      {routeInfo && (
        <div className="fsm-route-badge">
          <Route size={13} /> {(routeInfo.distance / 1000).toFixed(1)} km · {Math.round(routeInfo.duration / 60)} {t('daq', 'мин')}
        </div>
      )}

      <div className="fsm-actions">
        {mode === 'delivery' ? (
          <>
            <button className="fsm-btn fsm-btn-ghost" onClick={findMe} disabled={busy}>
              {busy ? <Loader2 size={16} className="fsm-spin" /> : <Navigation2 size={16} />}
              {t('Meni toping', 'Найти меня')}
            </button>
            <button className="fsm-btn fsm-btn-primary" onClick={confirmDelivery} disabled={busy || !hasSel}>
              <Check size={16} /> {t('Shu joyni tanlash', 'Выбрать это место')}
            </button>
          </>
        ) : (
          <button className="fsm-btn fsm-btn-primary fsm-btn-wide" onClick={showRoute} disabled={busy}>
            {busy ? <Loader2 size={16} className="fsm-spin" /> : <Route size={16} />}
            {t('Yo\'lni ko\'rsatish', 'Показать маршрут')}
          </button>
        )}
      </div>
    </div>
  )
}
