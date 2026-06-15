import { useState, useCallback, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'water', stylers: [{ color: '#0f0f2a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

const containerStyle = { width: '100%', height: '100%' }

export default function MapPicker({ lat, lng, onChange, readonly, zoom = 14 }) {
  const center = { lat: lat || 41.2995, lng: lng || 69.2401 }
  const mapRef = useRef(null)
  const [markerPos, setMarkerPos] = useState(center)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
    libraries: ['places'],
  })

  const onMapClick = useCallback((e) => {
    if (readonly) return
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setMarkerPos(pos)
    onChange?.(pos)
  }, [readonly, onChange])

  if (loadError) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text3)', fontSize:13 }}>
      Карта недоступна (проверьте API ключ)
    </div>
  )

  if (!isLoaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text3)', fontSize:13 }}>
      Загрузка карты...
    </div>
  )

  if (!MAPS_KEY || MAPS_KEY === 'YOUR_API_KEY_HERE') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:8, color:'var(--text3)', fontSize:13, textAlign:'center', padding:16 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      <span>Добавьте VITE_GOOGLE_MAPS_API_KEY в .env файл</span>
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={lat && lng ? { lat, lng } : center}
      zoom={zoom}
      options={{ styles: mapStyle, disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
      onClick={onMapClick}
      onLoad={map => { mapRef.current = map }}
    >
      <Marker
        position={lat && lng ? { lat, lng } : markerPos}
        icon={{
          url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="#FF6B35"/>
              <circle cx="18" cy="18" r="8" fill="white"/>
            </svg>
          `),
          scaledSize: { width: 36, height: 48 },
          anchor: { x: 18, y: 48 },
        }}
      />
    </GoogleMap>
  )
}
