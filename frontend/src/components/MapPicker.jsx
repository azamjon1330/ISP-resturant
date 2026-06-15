import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, useJsApiLoader, Autocomplete, DirectionsRenderer } from '@react-google-maps/api'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const LIBS = ['places']

const darkMapStyle = [
  { elementType: 'geometry',           stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'road',               elementType: 'geometry',       stylers: [{ color: '#2d2d55' }] },
  { featureType: 'road',               elementType: 'geometry.stroke', stylers: [{ color: '#1a1a40' }] },
  { featureType: 'road',               elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water',              stylers: [{ color: '#0a0a2a' }] },
  { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',            stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative',     elementType: 'geometry', stylers: [{ color: '#2d2d55' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9da5b3' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c9c9c9' }] },
]

const orangeMarker = (label) => ({
  path: 'M12 0C5.37 0 0 5.37 0 12C0 21 12 33 12 33C12 33 24 21 24 12C24 5.37 18.63 0 12 0Z',
  fillColor: '#FF6B35',
  fillOpacity: 1,
  strokeColor: '#fff',
  strokeWeight: 2,
  scale: 1.5,
  anchor: { x: 12, y: 33 },
  labelOrigin: { x: 12, y: 12 },
})

const pickupMarker = {
  path: 'M12 0C5.37 0 0 5.37 0 12C0 21 12 33 12 33C12 33 24 21 24 12C24 5.37 18.63 0 12 0Z',
  fillColor: '#1c1c2e',
  fillOpacity: 1,
  strokeColor: '#FF6B35',
  strokeWeight: 2.5,
  scale: 1.6,
  anchor: { x: 12, y: 33 },
}

const container = { width: '100%', height: '100%' }

export default function MapPicker({
  lat, lng,
  onChange,
  readonly = false,
  isPickup = false,
  zoom = 14,
  showSearch = false,
  routeFrom = null, // { lat, lng } – draw route from here to marker
}) {
  const defaultCenter = { lat: 41.2995, lng: 69.2401 }
  const center = lat && lng ? { lat, lng } : defaultCenter

  const [markerPos, setMarkerPos] = useState(center)
  const [directions, setDirections] = useState(null)
  const mapRef = useRef(null)
  const acRef  = useRef(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
    libraries: LIBS,
    id: 'google-map-script',
  })

  // Draw route when routeFrom changes
  useEffect(() => {
    if (!isLoaded || !routeFrom || !lat || !lng) return
    const svc = new window.google.maps.DirectionsService()
    svc.route({
      origin:      new window.google.maps.LatLng(routeFrom.lat, routeFrom.lng),
      destination: new window.google.maps.LatLng(lat, lng),
      travelMode:  window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') setDirections(result)
    })
  }, [isLoaded, routeFrom, lat, lng])

  const onMapClick = useCallback((e) => {
    if (readonly) return
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setMarkerPos(pos)
    onChange?.(pos)
    // Reverse geocode to get address
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: pos }, (res, status) => {
        if (status === 'OK' && res[0]) {
          onChange?.({ ...pos, address: res[0].formatted_address })
        }
      })
    }
  }, [readonly, onChange])

  const onPlaceSelected = useCallback(() => {
    const place = acRef.current?.getPlace()
    if (!place?.geometry) return
    const pos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address,
    }
    setMarkerPos({ lat: pos.lat, lng: pos.lng })
    onChange?.(pos)
    mapRef.current?.panTo({ lat: pos.lat, lng: pos.lng })
  }, [onChange])

  if (loadError) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#f87171', fontSize:13, padding:12, textAlign:'center' }}>
      Ошибка загрузки карты. Проверьте API ключ.
    </div>
  )
  if (!isLoaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#666', fontSize:13 }}>
      Загрузка карты...
    </div>
  )

  const pos = lat && lng ? { lat, lng } : markerPos

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showSearch && !readonly && (
        <Autocomplete
          onLoad={ac => { acRef.current = ac }}
          onPlaceChanged={onPlaceSelected}
        >
          <input
            type="text"
            placeholder="Поиск адреса..."
            style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, width: '80%', maxWidth: 340,
              height: 38, padding: '0 14px',
              borderRadius: 8, border: '1px solid rgba(255,107,53,0.4)',
              background: '#1e1e35', color: '#f0f0f0',
              fontSize: 13, outline: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          />
        </Autocomplete>
      )}
      <GoogleMap
        mapContainerStyle={container}
        center={pos}
        zoom={zoom}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          fullscreenControl: false,
        }}
        onClick={onMapClick}
        onLoad={map => { mapRef.current = map }}
      >
        {directions
          ? <DirectionsRenderer directions={directions} options={{ suppressMarkers: false, polylineOptions: { strokeColor: '#FF6B35', strokeWeight: 4 } }} />
          : <Marker
              position={pos}
              icon={isPickup ? pickupMarker : orangeMarker()}
              draggable={!readonly}
              onDragEnd={e => {
                if (readonly) return
                const p = { lat: e.latLng.lat(), lng: e.latLng.lng() }
                setMarkerPos(p)
                onChange?.(p)
              }}
            />
        }
      </GoogleMap>
    </div>
  )
}
