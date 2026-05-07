import React, { useState, useEffect, useRef } from 'react'
import { menuAPI, ordersAPI, agentsAPI } from '../../api'
import toast from 'react-hot-toast'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, X, CheckCircle, Search, QrCode, ChefHat, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './CashierPage.css'

const statusLabels = { pending: 'Кутилмоқда', cooking: 'Тайёрланмоқда', ready: 'Тайёр', served: 'Берилди' }
const statusColors = { pending: 'badge-yellow', cooking: 'badge-orange', ready: 'badge-green', served: 'badge-gray' }

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
        if (msg.payload.status === 'ready') {
          toast.success(`Буюртма №${msg.payload.order_code} тайёр!`, { duration: 6000, icon: '🍽️' })
        }
      }
    }
    wsRef.current = ws
  }

  const loadMenu = async () => {
    try {
      const res = await menuAPI.getAll()
      setMenu(res.data)
    } catch { toast.error('Меню юкланмади') }
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
      toast.success(`Карта: ${res.data.agent_name} — скидка ${res.data.discount.toLocaleString()} сум`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Карта топилмади')
      setCardInfo(null)
    }
  }

  const submitOrder = async () => {
    if (cart.length === 0) { toast.error('Саватча бўш'); return }
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
      toast.success(`Буюртма №${res.data.order_code} қабул қилинди!`)
      loadOrders()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Хатолик юз берди')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="cashier-page">
      <header className="cashier-header">
        <div className="cashier-header-left">
          <button className="btn-icon" onClick={() => navigate('/')}><Home size={20} /></button>
          <div className="cashier-logo">
            <span className="logo-text">YouIt Café</span>
            <span className="logo-sub">Касса</span>
          </div>
        </div>
        <div className="cashier-tabs">
          <button className={`tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            Янги буюртма
          </button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            Жорий буюртмалар
            {orders.length > 0 && <span className="tab-badge">{orders.length}</span>}
          </button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kitchen')}>
          <ChefHat size={16} /> Ошпаз
        </button>
      </header>

      {activeTab === 'menu' ? (
        <div className="cashier-body">
          <div className="menu-section">
            <div className="menu-controls">
              <div className="search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  className="input search-input"
                  placeholder="Таом қидириш..."
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
                    {cat === 'all' ? 'Барчаси' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="menu-grid">
              {filtered.map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <div key={item.id} className={`menu-card ${inCart ? 'in-cart' : ''}`} onClick={() => addToCart(item)}>
                    <div className="menu-card-body">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="menu-card-footer">
                      <span className="price">{item.price.toLocaleString()} сум</span>
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

          <div className="cart-section">
            <div className="cart-header">
              <ShoppingCart size={20} />
              <span>Савача ({cart.reduce((s, c) => s + c.qty, 0)} та)</span>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingCart size={40} opacity={0.2} />
                  <p>Саватча бўш</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">{(item.price * item.qty).toLocaleString()} сум</span>
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
                    className="input"
                    placeholder="Карта кодини киритинг..."
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
                    <CheckCircle size={14} color="var(--green)" />
                    <span>{cardInfo.agent_name}</span>
                    <span className="discount-amount">-{cardInfo.discount.toLocaleString()} сум</span>
                    <button onClick={() => { setCardInfo(null); setCardCode('') }}><X size={14} /></button>
                  </div>
                )}
              </div>

              <input
                className="input"
                placeholder="Изоҳ (ихтиёрий)..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <div className="cart-totals">
                <div className="total-row"><span>Жами:</span><span>{cartTotal.toLocaleString()} сум</span></div>
                {discount > 0 && <div className="total-row discount"><span>Скидка:</span><span>-{discount.toLocaleString()} сум</span></div>}
                <div className="total-row final"><span>Тўлов:</span><span>{finalTotal.toLocaleString()} сум</span></div>
              </div>

              <button
                className="btn btn-primary btn-lg checkout-btn"
                onClick={submitOrder}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Юборилмоқда...' : 'Буюртма беринг'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="orders-list-section">
          <div className="orders-grid">
            {orders.length === 0 ? (
              <div className="empty-state">Жорий буюртмалар йўқ</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className={`order-card status-${order.status}`}>
                  <div className="order-card-header">
                    <span className="order-number">#{order.order_code}</span>
                    <span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                  <div className="order-card-body">
                    <span className="order-total">{order.final_price?.toLocaleString()} сум</span>
                    {order.card_code && <span className="order-card-code"><QrCode size={12} /> {order.card_code}</span>}
                    {order.note && <p className="order-note">{order.note}</p>}
                  </div>
                  <div className="order-time">
                    {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
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
            <h2>Буюртма қабул қилинди!</h2>
            <div className="order-code-big">#{lastOrder.order_code}</div>
            <p>Мижозга ушбу рақамни беринг</p>
            <div className="order-summary">
              <div className="summary-row"><span>Жами:</span><span>{lastOrder.total_price?.toLocaleString()} сум</span></div>
              {lastOrder.discount_amount > 0 && (
                <div className="summary-row green"><span>Скидка:</span><span>-{lastOrder.discount_amount?.toLocaleString()} сум</span></div>
              )}
              <div className="summary-row bold"><span>Тўлов:</span><span>{lastOrder.final_price?.toLocaleString()} сум</span></div>
            </div>
            <button className="btn btn-primary" onClick={() => setLastOrder(null)}>Тушунарли</button>
          </div>
        </div>
      )}
    </div>
  )
}
