import React, { useState, useEffect, useRef } from 'react'
import { menuAPI, ordersAPI, agentsAPI } from '../../api'
import toast from 'react-hot-toast'
import {
  ShoppingCart, Plus, Minus, Trash2, X, CheckCircle, Search,
  QrCode, ChefHat, Home, Camera, RefreshCw, Globe, Phone, MapPin, Truck, Store, User, Bell,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode'
import './CashierPage.css'

const statusLabels = {
  pending:  'Yangi (online)',
  cooking:  'Tayyorlanmoqda',
  ready:    'Tayyor',
  on_way:   'Yetkazilmoqda',
  served:   'Berildi',
  rejected: 'Rad etildi',
}
const statusColors = {
  pending:  'badge-yellow',
  cooking:  'badge-orange',
  ready:    'badge-green',
  on_way:   'badge-blue',
  served:   'badge-gray',
  rejected: 'badge-red',
}

export default function CashierPage() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [cardCode, setCardCode] = useState('')
  const [cardInfo, setCardInfo] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('menu')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const scanCardRef = useRef(null)
  const seenOrderIdsRef = useRef(new Set())

  useEffect(() => {
    loadMenu()
    loadOrders()
    connectWS()
    // Refresh orders list every 10s as fallback
    const poll = setInterval(loadOrders, 10000)
    return () => {
      clearInterval(poll)
      wsRef.current?.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [])

  // Count pending online orders to show badge on tab
  useEffect(() => {
    setPendingCount(orders.filter(o => o.status === 'pending').length)
  }, [orders])

  const connectWS = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
      ws.onmessage = (e) => {
        let msg
        try { msg = JSON.parse(e.data) } catch { return }

        if (msg.type === 'new_order') {
          const order = msg.payload
          // Only notify for online orders (those with customer info)
          if (order && order.id && (order.customer_phone || order.customer_first_name)) {
            if (!seenOrderIdsRef.current.has(order.id)) {
              seenOrderIdsRef.current.add(order.id)
              setOrders(prev => {
                if (prev.some(o => o.id === order.id)) return prev
                return [order, ...prev]
              })
              playNotification()
              toast(`🌐 Onlayn buyurtma! #${order.order_code}`, {
                duration: 10000,
                style: { background: '#1e3a5f', color: '#fff', border: '1px solid #3b82f6' },
              })
            }
          }
        }

        if (msg.type === 'order_status_changed') {
          const updated = msg.payload
          setOrders(prev =>
            prev
              .map(o => o.id === updated.id ? { ...o, status: updated.status } : o)
              .filter(o => o.status !== 'served' && o.status !== 'rejected')
          )
        }
      }
      ws.onclose = () => {
        if (reconnectRef.current) clearTimeout(reconnectRef.current)
        reconnectRef.current = setTimeout(connectWS, 3000)
      }
      ws.onerror = () => { try { ws.close() } catch {} }
      wsRef.current = ws
    } catch {
      reconnectRef.current = setTimeout(connectWS, 3000)
    }
  }

  const playNotification = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(1000, ctx.currentTime)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  const loadMenu = async () => {
    try {
      const res = await menuAPI.getAll()
      setMenu(res.data)
    } catch { toast.error('Menyu yuklanmadi') }
  }

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getAll()
      const active = (res.data || []).filter(o => o.status !== 'served' && o.status !== 'rejected').slice(0, 50)
      active.forEach(o => seenOrderIdsRef.current.add(o.id))
      setOrders(active)
    } catch {}
  }

  const categories = ['all', ...new Set(menu.map(m => m.category))]

  const filtered = menu
    .filter(m => {
      const matchCat = category === 'all' || m.category === category
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch && m.available
    })
    .sort((a, b) => b.price - a.price)

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id)
      if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const discount = cardInfo?.discount || 0
  const finalTotal = Math.max(0, cartTotal - discount)

  const scanCard = async (codeOverride) => {
    const code = ((codeOverride ?? cardCode) || '').trim()
    if (!code) return
    try {
      const res = await agentsAPI.scanCard({ card_code: code, order_total: cartTotal })
      setCardInfo(res.data)
      setCardCode(code)
      toast.success(`Karta: ${res.data.agent_name} — chegirma ${res.data.discount.toLocaleString()} so'm`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Karta topilmadi')
      setCardInfo(null)
    }
  }
  scanCardRef.current = scanCard

  useEffect(() => {
    if (!scannerOpen) return
    let scanner
    let handled = false
    let cancelled = false
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner('qr-scanner-target', {
          fps: 10, qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true, showTorchButtonIfSupported: true,
          videoConstraints: { facingMode: { ideal: 'environment' } }, aspectRatio: 1.0,
        }, false)
        scanner.render(
          (decoded) => {
            if (handled || cancelled) return
            handled = true
            try { scanner.clear() } catch {}
            setScannerOpen(false)
            scanCardRef.current?.(decoded)
          },
          () => {},
        )
      } catch { toast.error("Skanerni ochib bo'lmadi") }
    }, 80)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (scanner) { try { scanner.clear() } catch {} }
    }
  }, [scannerOpen])

  // Cashier creates a counter order → auto-confirm (set to cooking) so kitchen sees it immediately
  const submitOrder = async () => {
    if (cart.length === 0) { toast.error("Savat bo'sh"); return }
    setSubmitting(true)
    try {
      const res = await ordersAPI.create({
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty })),
        card_code: cardCode || undefined,
        note,
      })
      const newOrder = res.data
      // Immediately confirm the counter order (cashier already knows what was ordered)
      await ordersAPI.updateStatus(newOrder.id, 'cooking')
      setLastOrder(newOrder)
      setCart([])
      setCardCode('')
      setCardInfo(null)
      setNote('')
      toast.success(`Buyurtma №${newOrder.order_code} oshpazxonaga yuborildi!`)
      loadOrders()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  // Cashier confirms an online order → sends to kitchen
  const confirmOrder = async (order) => {
    setConfirming(order.id)
    try {
      await ordersAPI.updateStatus(order.id, 'cooking')
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cooking' } : o))
      toast.success(`#${order.order_code} oshpazxonaga yuborildi!`, { icon: '👨‍🍳' })
    } catch { toast.error('Xatolik yuz berdi') }
    finally { setConfirming(null) }
  }

  const rejectOrder = async (order) => {
    setConfirming(order.id)
    try {
      await ordersAPI.updateStatus(order.id, 'rejected')
      setOrders(prev => prev.filter(o => o.id !== order.id))
      toast(`#${order.order_code} rad etildi`, { icon: '❌' })
    } catch { toast.error('Xatolik yuz berdi') }
    finally { setConfirming(null) }
  }

  const tabOrderCount = orders.length
  const onlineTab = activeTab === 'orders'

  return (
    <div className="cashier-page">
      <div className="background-container">
        <img className="moon" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png" alt="" />
        <div className="stars" />
        <div className="twinkling" />
        <div className="clouds" />
      </div>

      <header className="cashier-header">
        <div className="cashier-header-left">
          <button className="btn-icon" onClick={() => navigate('/staff')}><Home size={20} /></button>
          <div className="cashier-logo">
            <span className="logo-text">ECO taomlar</span>
            <span className="logo-sub">Kassa paneli</span>
          </div>
        </div>
        <div className="cashier-tabs">
          <button className={`tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            Yangi buyurtma
          </button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            Joriy buyurtmalar
            {tabOrderCount > 0 && (
              <span className={`tab-badge ${pendingCount > 0 ? 'tab-badge-alert' : ''}`}>
                {tabOrderCount}
                {pendingCount > 0 && <Bell size={10} />}
              </span>
            )}
          </button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kitchen')}>
          <ChefHat size={16} /> Oshpaz
        </button>
      </header>

      {activeTab === 'menu' ? (
        <div className="cashier-body">
          <div className="menu-section">
            <div className="menu-controls glass-panel">
              <div className="search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  className="glass-input search-input"
                  placeholder="Taom qidirish..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="category-tabs">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`cat-tab ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat === 'all' ? 'Barchasi' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="menu-grid">
              {filtered.map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <div
                    key={item.id}
                    className={`menu-card glass-card ${inCart ? 'in-cart' : ''}`}
                    onClick={() => addToCart(item)}
                  >
                    <div className="menu-card-body">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="menu-card-footer">
                      <span className="price">{item.price.toLocaleString()} so'm</span>
                      {inCart ? (
                        <span className="qty-badge">{inCart.qty}</span>
                      ) : (
                        <Plus size={18} className="add-icon" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="cart-section glass-panel">
            <div className="cart-header">
              <ShoppingCart size={20} />
              <span>Savat ({cart.reduce((s, c) => s + c.qty, 0)} ta)</span>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingCart size={40} opacity={0.2} />
                  <p>Savat bo'sh</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">{(item.price * item.qty).toLocaleString()} so'm</span>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                      <button className="delete-btn" onClick={() => setCart(c => c.filter(i => i.id !== item.id))}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="card-scan">
                <div className="card-input-row">
                  <input
                    className="glass-input"
                    placeholder="Karta kodini kiriting..."
                    value={cardCode}
                    onChange={e => setCardCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && scanCard()}
                  />
                  <button className="btn btn-secondary" onClick={() => scanCard()} title="Tekshirish">
                    <CheckCircle size={16} />
                  </button>
                  <button className="btn btn-secondary" onClick={() => setScannerOpen(true)} title="Kamera bilan skanerlash">
                    <QrCode size={16} />
                  </button>
                </div>
                {cardInfo && (
                  <div className="card-info">
                    <CheckCircle size={14} color="#10B981" />
                    <span>{cardInfo.agent_name}</span>
                    <span className="discount-amount">-{cardInfo.discount.toLocaleString()} so'm</span>
                    <button onClick={() => { setCardInfo(null); setCardCode('') }}><X size={14} /></button>
                  </div>
                )}
              </div>

              <input
                className="glass-input"
                placeholder="Izoh (ixtiyoriy)..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <div className="cart-totals">
                <div className="total-row"><span>Jami:</span><span>{cartTotal.toLocaleString()} so'm</span></div>
                {discount > 0 && <div className="total-row discount"><span>Chegirma:</span><span>-{discount.toLocaleString()} so'm</span></div>}
                <div className="total-row final"><span>To'lov:</span><span>{finalTotal.toLocaleString()} so'm</span></div>
              </div>

              <button
                className="checkout-btn"
                onClick={submitOrder}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Yuborilmoqda...' : 'Buyurtma bering'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="orders-list-section">
          <div className="orders-list-toolbar">
            <span className="orders-list-title">
              Joriy buyurtmalar ({orders.length})
              {pendingCount > 0 && (
                <span className="pending-alert">
                  <Bell size={14} /> {pendingCount} ta tasdiqlash kutilmoqda
                </span>
              )}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={loadOrders}>
              <RefreshCw size={14} /> Yangilash
            </button>
          </div>
          <div className="orders-grid">
            {orders.length === 0 ? (
              <div className="empty-state">Joriy buyurtmalar yo'q</div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className={`order-card glass-card status-${order.status} ${order.status === 'pending' ? 'order-card-online' : ''}`}
                >
                  <div className="order-card-header">
                    <div className="order-card-title">
                      <span className="order-number">#{order.order_code}</span>
                      {order.status === 'pending' && (
                        <span className="online-badge"><Globe size={12} /> Online</span>
                      )}
                    </div>
                    <span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>

                  {(order.customer_first_name || order.customer_phone) && (
                    <div className="order-card-customer">
                      {order.customer_first_name && (
                        <div><User size={12} /> {order.customer_first_name} {order.customer_last_name || ''}</div>
                      )}
                      {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`}><Phone size={12} /> {order.customer_phone}</a>
                      )}
                      {order.delivery_type === 'delivery' ? (
                        <div><Truck size={12} /> {order.delivery_address || 'Manzil yo\'q'}</div>
                      ) : (
                        <div><Store size={12} /> Olib ketadi</div>
                      )}
                    </div>
                  )}

                  <div className="order-card-body">
                    <span className="order-total">{order.final_price?.toLocaleString()} so'm</span>
                    {order.card_code && <span className="order-card-code"><QrCode size={12} /> {order.card_code}</span>}
                    {order.note && <p className="order-note">{order.note}</p>}
                  </div>
                  <div className="order-time">
                    {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {order.status === 'pending' && (
                    <div className="order-card-actions">
                      <button
                        className="btn-confirm"
                        onClick={() => confirmOrder(order)}
                        disabled={confirming === order.id}
                      >
                        <ChefHat size={15} />
                        {confirming === order.id ? 'Yuborilmoqda...' : 'Oshpazga yuborish'}
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => rejectOrder(order)}
                        disabled={confirming === order.id}
                      >
                        <X size={15} />
                        Rad etish
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {lastOrder && (
        <div className="order-success-modal">
          <div className="order-success-card slide-in">
            <button className="modal-close" onClick={() => setLastOrder(null)}><X size={20} /></button>
            <div className="success-icon">✅</div>
            <h2>Buyurtma oshpazxonaga yuborildi!</h2>
            <div className="order-code-big">#{lastOrder.order_code}</div>
            <p>Mijozga ushbu raqamni bering</p>
            <div className="order-summary">
              <div className="summary-row"><span>Jami:</span><span>{lastOrder.total_price?.toLocaleString()} so'm</span></div>
              {lastOrder.discount_amount > 0 && (
                <div className="summary-row green"><span>Chegirma:</span><span>-{lastOrder.discount_amount?.toLocaleString()} so'm</span></div>
              )}
              <div className="summary-row bold"><span>To'lov:</span><span>{lastOrder.final_price?.toLocaleString()} so'm</span></div>
            </div>
            <button className="checkout-btn" onClick={() => setLastOrder(null)}>Tushunarli</button>
          </div>
        </div>
      )}

      {scannerOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setScannerOpen(false)}
        >
          <div style={{
            background: '#1a1a1a', borderRadius: 14, padding: 18, maxWidth: 480, width: '100%',
            color: 'white', maxHeight: '95vh', overflowY: 'auto',
            border: '1px solid rgba(255,107,53,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FF6B35' }}>
                <Camera size={22} />
                <h2 style={{ margin: 0, fontSize: 17 }}>QR kodni skanerlash</h2>
              </div>
              <button onClick={() => setScannerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 6 }}>
                <X size={22} />
              </button>
            </div>

            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px', borderRadius: 10, background: 'linear-gradient(135deg, #FF6B35, #E85A24)',
              color: 'white', cursor: 'pointer', marginBottom: 16,
              fontSize: 15, fontWeight: 700, boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
            }}>
              <Camera size={20} />
              <span>📷 Rasm yuklash yoki surat olish</span>
              <input
                type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  try {
                    const tmp = new Html5Qrcode('qr-reader-file')
                    const decoded = await tmp.scanFile(file, false)
                    try { tmp.clear() } catch {}
                    setScannerOpen(false)
                    scanCardRef.current?.(decoded)
                  } catch {
                    toast.error("Rasmda QR topilmadi — yaqinroq surat oling")
                  }
                }}
              />
            </label>
            <div id="qr-reader-file" style={{ display: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
              <span>yoki</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 10 }}>
              Live skaner (kamera orqali)
            </div>
            <div id="qr-scanner-target" style={{
              width: '100%', minHeight: 80, background: '#0a0a0a',
              borderRadius: 10, border: '1px solid rgba(255,107,53,0.3)',
              padding: 4, color: 'white',
            }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 6 }}>
              «Request Camera Permissions» tugmasini bosib kamera so'rovini bering
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
