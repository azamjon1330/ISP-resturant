import React, { useState, useEffect, useRef } from 'react'
import { menuAPI, ordersAPI, agentsAPI } from '../../api'
import toast from 'react-hot-toast'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, X, CheckCircle, Search, QrCode, ChefHat, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './CashierPage.css'

const statusLabels = { pending: "Kutilmoqda", cooking: "Tayyorlanmoqda", ready: "Tayyor", served: "Berildi" }
const statusColors = { pending: 'badge-yellow', cooking: 'badge-orange', ready: 'badge-green', served: 'badge-gray' }
const ORDER_TYPE_LABELS = { delivery: '🚚 Yetkazish', dine_in: '🍽️ Ichkarida' }

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
  const wsRef = useRef(null)

  useEffect(() => {
    loadMenu()
    loadOrders()
    connectWS()
    return () => wsRef.current?.close()
  }, [])

  const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'order_status_changed') {
        setOrders(prev => prev.map(o => o.id === msg.payload.id ? { ...o, status: msg.payload.status } : o))
        if (msg.payload.status === 'served') {
          toast.success(`Buyurtma №${msg.payload.order_code} tayyor va berildi!`, { duration: 6000, icon: '🍽️' })
        }
      }
    }
    wsRef.current = ws
  }

  const loadMenu = async () => {
    try {
      const res = await menuAPI.getAll()
      setMenu(res.data)
    } catch { toast.error("Menyu yuklanmadi") }
  }

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getAll()
      setOrders(res.data.filter(o => o.status !== 'served').slice(0, 20))
    } catch {}
  }

  const categories = ['all', ...new Set(menu.map(m => m.category))]

  const filtered = menu.filter(m => {
    const matchCat = category === 'all' || m.category === category
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && m.available
  })

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id)
      if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      return updated.filter(c => c.qty > 0)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const discount = cardInfo?.discount || 0
  const finalTotal = Math.max(0, cartTotal - discount)

  const scanCard = async () => {
    if (!cardCode.trim()) return
    try {
      const res = await agentsAPI.scanCard({ card_code: cardCode.trim(), order_total: cartTotal })
      setCardInfo(res.data)
      toast.success(`Karta: ${res.data.agent_name} — chegirma ${res.data.discount.toLocaleString()} so'm`)
    } catch (e) {
      toast.error(e.response?.data?.error || "Karta topilmadi")
      setCardInfo(null)
    }
  }

  const submitOrder = async () => {
    if (cart.length === 0) { toast.error("Savat bo'sh"); return }
    setSubmitting(true)
    try {
      const res = await ordersAPI.create({
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty })),
        card_code: cardCode || undefined,
        note,
      })
      setLastOrder(res.data)
      setCart([])
      setCardCode('')
      setCardInfo(null)
      setNote('')
      toast.success(`Buyurtma №${res.data.order_code} qabul qilindi!`)
      loadOrders()
    } catch (e) {
      toast.error(e.response?.data?.error || "Xatolik yuz berdi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="cashier-page">
      {/* Animated background blobs */}
      <div className="cashier-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
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
            {orders.length > 0 && <span className="tab-badge">{orders.length}</span>}
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
                  <div key={item.id} className={`menu-card glass-card ${inCart ? 'in-cart' : ''}`} onClick={() => addToCart(item)}>
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
                  <button className="btn btn-secondary" onClick={scanCard}>
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
                {submitting ? 'Yuborilmoqda...' : "Buyurtma bering"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="orders-list-section">
          <div className="orders-grid">
            {orders.length === 0 ? (
              <div className="empty-state">Joriy buyurtmalar yo'q</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className={`order-card glass-card status-${order.status}`}>
                  <div className="order-card-header">
                    <span className="order-number">#{order.order_code}</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {order.order_type === 'delivery' && (
                        <span className="badge badge-blue" style={{ background: '#1d4ed8', color: '#fff' }}>
                          🚚 Yetkazish
                        </span>
                      )}
                      <span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                    </div>
                  </div>
                  <div className="order-card-body">
                    <span className="order-total">{order.final_price?.toLocaleString()} so'm</span>
                    {order.customer_name && (
                      <p className="order-note" style={{ color: '#3b82f6', marginBottom: 4 }}>
                        👤 {order.customer_name} {order.customer_phone ? `· ${order.customer_phone}` : ''}
                      </p>
                    )}
                    {order.delivery_address && (
                      <p className="order-note" style={{ color: '#059669' }}>
                        📍 {order.delivery_address}
                      </p>
                    )}
                    {order.card_code && <span className="order-card-code"><QrCode size={12} /> {order.card_code}</span>}
                    {order.note && <p className="order-note">{order.note}</p>}
                  </div>
                  <div className="order-time">
                    {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
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
            <h2>Buyurtma qabul qilindi!</h2>
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
    </div>
  )
}
