import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom orange marker
const orangeIcon = new L.DivIcon({
  className: '',
  iconSize:  [30, 42],
  iconAnchor:[15, 42],
  popupAnchor:[0, -42],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
    <path d="M15 0C6.72 0 0 6.72 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.72 23.28 0 15 0Z" fill="#FF6B35" stroke="white" stroke-width="1.5"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
})

// Restaurant/pickup marker (darker)
const pickupIcon = new L.DivIcon({
  className: '',
  iconSize:  [34, 48],
  iconAnchor:[17, 48],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48">
    <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 48 17 48C17 48 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#1c1c2e" stroke="#FF6B35" stroke-width="2"/>
    <text x="17" y="22" text-anchor="middle" font-size="14">🍴</text>
  </svg>`,
})

// Click handler sub-component
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng) },
  })
  return null
}

// Fly-to when lat/lng change
function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], map.getZoom(), { duration: 0.8 })
  }, [lat, lng, map])
  return null
}

export default function MapPicker({
  lat, lng,
  onChange,
  readonly = false,
  zoom = 14,
  isPickup = false,
}) {
  const defaultCenter = [41.2995, 69.2401] // Tashkent
  const center = lat && lng ? [lat, lng] : defaultCenter
  const [pos, setPos] = useState(center)

  const handlePick = (latlng) => {
    if (readonly) return
    setPos([latlng.lat, latlng.lng])
    onChange?.({ lat: latlng.lat, lng: latlng.lng })
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      zoomControl
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {lat && lng && <FlyTo lat={lat} lng={lng} />}
      {!readonly && <ClickHandler onPick={handlePick} />}
      <Marker
        position={lat && lng ? [lat, lng] : pos}
        icon={isPickup ? pickupIcon : orangeIcon}
        draggable={!readonly}
        eventHandlers={readonly ? {} : {
          dragend(e) {
            const { lat: la, lng: lo } = e.target.getLatLng()
            setPos([la, lo])
            onChange?.({ lat: la, lng: lo })
          },
        }}
      />
    </MapContainer>
  )
}
