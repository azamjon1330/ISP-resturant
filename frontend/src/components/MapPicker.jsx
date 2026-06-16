import { useEffect, useRef, useState, useCallback } from 'react'

const DEFAULT = { lat: 41.2995, lng: 69.2401 }

async function photonSearch(query) {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=default`
  )
  const data = await res.json()
  return data.features.map(f => {
    const p = f.properties
    const label = [
      p.name,
      p.street ? `${p.street}${p.housenumber ? ' ' + p.housenumber : ''}` : null,
      p.city || p.town || p.village,
    ].filter(Boolean).join(', ')
    return { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], label }
  })
}

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

export default function MapPicker({
  lat, lng,
  onChange,
  readonly = false,
  isPickup = false,
  zoom = 14,
  showSearch = false,
  userLat,
  userLng,
}) {
  const mapElRef    = useRef(null)
  const mapRef      = useRef(null)
  const markerRef   = useRef(null)
  const userMkRef   = useRef(null)
  const LRef        = useRef(null)
  const [searchQ,   setSearchQ]   = useState('')
  const [suggests,  setSuggests]  = useState([])
  const [searching, setSearching] = useState(false)
  const [gpsLoad,   setGpsLoad]   = useState(false)

  const orangeIcon = useCallback((L) => L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:#FF6B35;
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 4px 14px rgba(255,107,53,0.55);
    "></div>`,
    iconSize: [28, 28], iconAnchor: [14, 28],
    popupAnchor: [0, -28], className: '',
  }), [])

  const pickupIcon = useCallback((L) => L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:#1c1c2e;
      border:3px solid #FF6B35;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 4px 14px rgba(255,107,53,0.4);
    "></div>`,
    iconSize: [28, 28], iconAnchor: [14, 28],
    popupAnchor: [0, -28], className: '',
  }), [])

  useEffect(() => {
    let active = true

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Fix Vite/Webpack icon paths
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!active || !mapElRef.current || mapRef.current) return
      LRef.current = L

      const center = lat && lng ? [lat, lng] : [DEFAULT.lat, DEFAULT.lng]
      const map = L.map(mapElRef.current, { zoomControl: true }).setView(center, zoom)
      mapRef.current = map

      // Google Maps hybrid tiles (satellite + labels) — no API key needed
      L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 21,
        attribution: '© Google Maps',
      }).addTo(map)

      const icon = isPickup ? pickupIcon(L) : orangeIcon(L)

      if (lat && lng) {
        const m = L.marker([lat, lng], { icon, draggable: !readonly }).addTo(map)
        markerRef.current = m
        if (!readonly) {
          m.on('dragend', async () => {
            const p = m.getLatLng()
            const address = await reverseGeocode(p.lat, p.lng)
            onChange?.({ lat: p.lat, lng: p.lng, address })
          })
        }
      }

      if (!readonly) {
        map.on('click', async (e) => {
          const { lat: clat, lng: clng } = e.latlng
          if (markerRef.current) {
            markerRef.current.setLatLng([clat, clng])
          } else {
            const m = L.marker([clat, clng], { icon: orangeIcon(L), draggable: true }).addTo(map)
            markerRef.current = m
            m.on('dragend', async () => {
              const p = m.getLatLng()
              const address = await reverseGeocode(p.lat, p.lng)
              onChange?.({ lat: p.lat, lng: p.lng, address })
            })
          }
          const address = await reverseGeocode(clat, clng)
          onChange?.({ lat: clat, lng: clng, address })
        })
      }
    })()

    return () => {
      active = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, []) // run once on mount

  // Sync marker when lat/lng prop changes from parent
  useEffect(() => {
    if (!mapRef.current || !lat || !lng || !LRef.current) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current.panTo([lat, lng])
    }
  }, [lat, lng])

  // Show/update "my location" blue dot when userLat/userLng prop changes
  useEffect(() => {
    if (!mapRef.current || !userLat || !userLng || !LRef.current) return
    const L = LRef.current
    const myIcon = L.divIcon({
      html: `<div style="width:18px;height:18px;background:#2196F3;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(33,150,243,0.55)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9], className: '',
    })
    if (userMkRef.current) {
      userMkRef.current.setLatLng([userLat, userLng])
    } else {
      userMkRef.current = L.marker([userLat, userLng], { icon: myIcon, interactive: false }).addTo(mapRef.current)
      userMkRef.current.bindPopup('Mening joylashuvim', { closeButton: false })
    }
    mapRef.current.panTo([userLat, userLng])
  }, [userLat, userLng])

  const doSearch = async (e) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    setSearching(true)
    setSuggests([])
    try { setSuggests(await photonSearch(searchQ)) } catch {}
    setSearching(false)
  }

  const pickSuggestion = (s) => {
    setSuggests([])
    setSearchQ(s.label)
    onChange?.({ lat: s.lat, lng: s.lng, address: s.label })
    mapRef.current?.setView([s.lat, s.lng], 16)
    // Move / create marker
    if (mapRef.current && LRef.current) {
      const L = LRef.current
      if (markerRef.current) {
        markerRef.current.setLatLng([s.lat, s.lng])
      } else {
        const m = L.marker([s.lat, s.lng], { icon: orangeIcon(L), draggable: true }).addTo(mapRef.current)
        markerRef.current = m
        m.on('dragend', async () => {
          const p = m.getLatLng()
          const address = await reverseGeocode(p.lat, p.lng)
          onChange?.({ lat: p.lat, lng: p.lng, address })
        })
      }
    }
  }

  const handleGPS = () => {
    if (!navigator.geolocation) return
    setGpsLoad(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: la, longitude: lo } = pos.coords
        const address = await reverseGeocode(la, lo)
        onChange?.({ lat: la, lng: lo, address })
        setSearchQ(address)
        mapRef.current?.setView([la, lo], 16)
        if (mapRef.current && LRef.current) {
          const L = LRef.current
          if (markerRef.current) {
            markerRef.current.setLatLng([la, lo])
          } else {
            const m = L.marker([la, lo], { icon: orangeIcon(L), draggable: true }).addTo(mapRef.current)
            markerRef.current = m
            m.on('dragend', async () => {
              const p = m.getLatLng()
              const adr = await reverseGeocode(p.lat, p.lng)
              onChange?.({ lat: p.lat, lng: p.lng, address: adr })
            })
          }
        }
        setGpsLoad(false)
      },
      () => setGpsLoad(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {showSearch && !readonly && (
        <div style={{ padding: '8px 8px 4px', background: '#16162a', borderBottom: '1px solid rgba(255,107,53,0.2)', flexShrink: 0 }}>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: 6 }}>
            <input
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSuggests([]) }}
              placeholder="Manzilni qidiring..."
              style={{
                flex: 1, height: 36, padding: '0 12px',
                borderRadius: 8, border: '1px solid rgba(255,107,53,0.35)',
                background: '#0f0f1a', color: '#f0f0f0',
                fontSize: 13, outline: 'none',
              }}
            />
            <button type="submit" style={{
              height: 36, padding: '0 14px', borderRadius: 8, border: 'none',
              background: '#FF6B35', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              {searching ? '...' : '🔍'}
            </button>
            <button type="button" onClick={handleGPS} title="GPS" style={{
              height: 36, width: 36, borderRadius: 8,
              border: '1px solid rgba(255,107,53,0.35)',
              background: '#0f0f1a', color: '#FF6B35',
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {gpsLoad ? '⌛' : '📍'}
            </button>
          </form>

          {suggests.length > 0 && (
            <div style={{
              position: 'absolute', top: 56, left: 8, right: 8, zIndex: 9999,
              background: '#1e1e35', border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: 8, overflow: 'hidden',
              boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
            }}>
              {suggests.map((s, i) => (
                <div
                  key={i}
                  onClick={() => pickSuggestion(s)}
                  style={{
                    padding: '10px 14px', fontSize: 13, color: '#f0f0f0', cursor: 'pointer',
                    borderBottom: i < suggests.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  📍 {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div ref={mapElRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  )
}
