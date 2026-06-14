import { useState, useEffect, useRef } from 'react'
import { menuAPI, ordersAPI, customerAPI } from '../../api'
import toast from 'react-hot-toast'
import {
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight,
  MapPin, Phone, User, Lock, Eye, EyeOff, Truck, Star, Clock, Leaf
} from 'lucide-react'
import './LandingPage.css'

const EMOJI = {
  "Sho'rva": '🍲', "Shurpa": '🍲', "Lagman": '🍜',
  "Ikkinchi taom": '🍛', "Milliy taomlar": '🫕', "Salatlar": '🥗',
  "Ichimliklar": '🥤', "Dessert": '🍮', "Xamirli": '🥐',
  "Non": '🫓', "default": '🍽️'
}

const GRADIENT = {
  "Sho'rva": 'linear-gradient(135deg,#ff6b35,#e8511a)',
  "Shurpa": 'linear-gradient(135deg,#ff6b35,#e8511a)',
  "Ikkinchi taom": 'linear-gradient(135deg,#ffb347,#ff6b35)',
  "Milliy taomlar": 'linear-gradient(135deg,#f7971e,#ffd200)',
  "Salatlar": 'linear-gradient(135deg,#56ab2f,#a8e063)',
  "Ichimliklar": 'linear-gradient(135deg,#667eea,#764ba2)',
  "Dessert": 'linear-gradient(135deg,#f857a6,#ff5858)',
  "default": 'linear-gradient(135deg,#ff6b35,#ffb347)'
}

function getEmoji(cat) { return EMOJI[cat] || EMOJI.default }
function getGrad(cat)  { return GRADIENT[cat] || GRADIENT.default }

export default function LandingPage() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [authModal, setAuthModal] = useState(null)   // 'login'|'register'
  const [authTab, setAuthTab] = useState('login')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [address, setAddress] = useState('')
  const [customer, setCustomer] = useState(null)
  const [paymentPopup, setPaymentPopup] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [ordering, setOrdering] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', last_name: '', phone: '', password: '', confirm: '' })
  const menuRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    menuAPI.getAll()
      .then(r => {
        const avail = r.data.filter(i => i.available)
        setMenu(avail)
        setCategories([...new Set(avail.map(i => i.category))])
      })
      .catch(() => {})

    try {
      const saved = localStorage.getItem('customer_data')
      if (saved) setCustomer(JSON.parse(saved))
    } catch {}

    const onScroll = () => setScrolled(window.scrollY > 70)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!paymentPopup) return
    setCountdown(10)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); setPaymentPopup(false); return 10 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [paymentPopup])

  const filtered = activeCat === 'all' ? menu : menu.filter(i => i.category === activeCat)
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0)

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex
        ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { ...item, qty: 1 }]
    })
    toast.success(`${item.name} savatga qo'shildi`, { duration: 1200, icon: '✅' })
  }

  const updateQty = (id, delta) =>
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0))

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id))

  const handleAddClick = (item) => { addToCart(item); setCartOpen(true) }

  const handleCheckout = () => {
    if (!cart.length) { toast.error("Savat bo'sh"); return }
    if (!customer) { setAuthModal('login'); setAuthTab('login'); return }
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  const submitOrder = async () => {
    if (!address.trim()) { toast.error("Manzilni kiriting"); return }
    setOrdering(true)
    try {
      await ordersAPI.create({
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty })),
        order_type: 'delivery',
        delivery_address: address.trim(),
        customer_name: `${customer.name} ${customer.last_name || ''}`.trim(),
        customer_phone: customer.phone || '',
        customer_id: customer.id || 0,
        note: '',
      })
      setCart([])
      setAddress('')
      setCheckoutOpen(false)
      setPaymentPopup(true)
    } catch (e) {
      toast.error(e.response?.data?.error || "Xatolik yuz berdi")
    } finally {
      setOrdering(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthBusy(true)
    try {
      const r = await customerAPI.login(loginForm)
      localStorage.setItem('customer_token', r.data.token)
      localStorage.setItem('customer_data', JSON.stringify(r.data.customer))
      setCustomer(r.data.customer)
      setAuthModal(null)
      toast.success(`Xush kelibsiz, ${r.data.customer.name}!`)
      if (cart.length) setCheckoutOpen(true)
    } catch (e) {
      toast.error(e.response?.data?.error || "Xatolik")
    } finally {
      setAuthBusy(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (regForm.password !== regForm.confirm) { toast.error("Parollar mos kelmaydi"); return }
    setAuthBusy(true)
    try {
      const r = await customerAPI.register({
        name: regForm.name, last_name: regForm.last_name,
        phone: regForm.phone, password: regForm.password,
      })
      localStorage.setItem('customer_token', r.data.token)
      localStorage.setItem('customer_data', JSON.stringify(r.data.customer))
      setCustomer(r.data.customer)
      setAuthModal(null)
      toast.success(`Xush kelibsiz, ${r.data.customer.name}!`)
      if (cart.length) setCheckoutOpen(true)
    } catch (e) {
      toast.error(e.response?.data?.error || "Xatolik")
    } finally {
      setAuthBusy(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_data')
    setCustomer(null)
    toast.success("Chiqildi")
  }

  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: 'smooth' })

  const closePayment = () => { clearInterval(timerRef.current); setPaymentPopup(false) }

  return (
    <div className="lp">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav--solid' : ''}`}>
        <div className="lp-nav__inner">
          <div className="lp-logo">
            <span className="lp-logo__emoji">🍽️</span>
            <span className="lp-logo__text">ECO<span className="lp-logo__accent"> Taomlar</span></span>
          </div>
          <div className="lp-nav__links">
            <button className="lp-nav__link" onClick={scrollToMenu}>Menyu</button>
            <a className="lp-nav__link" href="/staff">Xodimlar</a>
          </div>
          <div className="lp-nav__actions">
            {customer ? (
              <>
                <span className="lp-nav__user">👤 {customer.name}</span>
                <button className="lp-btn lp-btn--ghost lp-btn--sm" onClick={logout}>Chiqish</button>
              </>
            ) : (
              <>
                <button className="lp-btn lp-btn--ghost lp-btn--sm"
                  onClick={() => { setAuthModal('login'); setAuthTab('login') }}>Kirish</button>
                <button className="lp-btn lp-btn--orange lp-btn--sm"
                  onClick={() => { setAuthModal('register'); setAuthTab('register') }}>Ro'yxat</button>
              </>
            )}
            <button className="lp-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="lp-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__glow lp-hero__glow--1" />
        <div className="lp-hero__glow lp-hero__glow--2" />
        <div className="lp-hero__glow lp-hero__glow--3" />
        <div className="lp-hero__inner">
          <div className="lp-hero__text">
            <div className="lp-hero__tag">🌿 Halol &bull; Yangi &bull; Mazali</div>
            <h1 className="lp-hero__title">
              O'zbek milliy<br/>
              <span className="lp-hero__accent">taomlarini</span><br/>
              onlayn buyurtma&nbsp;qiling
            </h1>
            <p className="lp-hero__sub">
              Oshpazlarimiz tomonidan sevgi bilan tayyorlangan taomlar — to'g'ridan-to'g'ri eshigingizga
            </p>
            <div className="lp-hero__btns">
              <button className="lp-btn lp-btn--hero-primary" onClick={scrollToMenu}>
                Menyu ko'rish <ChevronRight size={18} />
              </button>
              <button className="lp-btn lp-btn--hero-secondary"
                onClick={() => { scrollToMenu(); }}>
                Buyurtma berish
              </button>
            </div>
            <div className="lp-hero__stats">
              <div className="lp-stat"><span className="lp-stat__num">500+</span><span className="lp-stat__label">Mamnun mijoz</span></div>
              <div className="lp-stat__div"/>
              <div className="lp-stat"><span className="lp-stat__num">30+</span><span className="lp-stat__label">Taom turi</span></div>
              <div className="lp-stat__div"/>
              <div className="lp-stat"><span className="lp-stat__num">45 min</span><span className="lp-stat__label">Yetkazish</span></div>
            </div>
          </div>
          <div className="lp-hero__visual">
            <div className="lp-orbit">
              <div className="lp-orb lp-orb--1">🥘</div>
              <div className="lp-orb lp-orb--2">🍛</div>
              <div className="lp-orb lp-orb--3">🫕</div>
              <div className="lp-orb lp-orb--4">🍲</div>
              <div className="lp-orb lp-orb--5">🥗</div>
              <div className="lp-orbit__center">🍽️</div>
            </div>
          </div>
        </div>
        <div className="lp-hero__wave">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path d="M0,45 C480,90 960,0 1440,45 L1440,90 L0,90 Z" fill="#fff9f5"/>
          </svg>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-feature">
          <div className="lp-feature__icon"><Truck size={28}/></div>
          <h3>Tez yetkazish</h3>
          <p>Shahar bo'ylab 45 daqiqada</p>
        </div>
        <div className="lp-feature">
          <div className="lp-feature__icon"><Leaf size={28}/></div>
          <h3>Yangi mahsulotlar</h3>
          <p>Har kuni yangi, sifatli taomlar</p>
        </div>
        <div className="lp-feature">
          <div className="lp-feature__icon"><Star size={28}/></div>
          <h3>Milliy ta'm</h3>
          <p>An'anaviy o'zbek oshxonasi</p>
        </div>
        <div className="lp-feature">
          <div className="lp-feature__icon"><Clock size={28}/></div>
          <h3>Qabul qilishda to'lov</h3>
          <p>Taom olayotganingizda to'lang</p>
        </div>
      </section>

      {/* ── MENU ─────────────────────────────────────────────── */}
      <section className="lp-menu" ref={menuRef}>
        <div className="lp-section-header">
          <h2 className="lp-section-title">Bizning <span className="lp-accent">Menyumiz</span></h2>
          <p className="lp-section-sub">Har bir taom oshpazlarimiz tomonidan sevgi bilan tayyorlanadi</p>
        </div>

        <div className="lp-cats">
          <button className={`lp-cat ${activeCat === 'all' ? 'lp-cat--active' : ''}`}
            onClick={() => setActiveCat('all')}>🍽️ Barchasi</button>
          {categories.map(cat => (
            <button key={cat}
              className={`lp-cat ${activeCat === cat ? 'lp-cat--active' : ''}`}
              onClick={() => setActiveCat(cat)}>
              {getEmoji(cat)} {cat}
            </button>
          ))}
        </div>

        {menu.length === 0 ? (
          <div className="lp-loading"><div className="lp-spinner"/><p>Menyu yuklanmoqda...</p></div>
        ) : filtered.length === 0 ? (
          <div className="lp-loading"><p>Bu kategoriyada taom topilmadi</p></div>
        ) : (
          <div className="lp-menu-grid">
            {filtered.map((item, i) => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <div key={item.id} className="lp-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="lp-card__img"
                    style={{ background: item.image_url ? undefined : getGrad(item.category) }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} loading="lazy" />
                      : <span className="lp-card__emoji">{getEmoji(item.category)}</span>}
                    <span className="lp-card__cat-badge">{item.category}</span>
                    {inCart && <span className="lp-card__in-cart">✓ {inCart.qty} ta</span>}
                  </div>
                  <div className="lp-card__body">
                    <h3 className="lp-card__name">{item.name}</h3>
                    {item.description && <p className="lp-card__desc">{item.description}</p>}
                    <div className="lp-card__footer">
                      <span className="lp-card__price">
                        {item.price.toLocaleString()}<span className="lp-card__unit"> so'm</span>
                      </span>
                      <button className={`lp-add-btn ${inCart ? 'lp-add-btn--active' : ''}`}
                        onClick={() => handleAddClick(item)}>
                        <Plus size={16}/> {inCart ? 'Yana' : 'Savatga'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── BANNER ───────────────────────────────────────────── */}
      <section className="lp-banner">
        <div className="lp-banner__inner">
          <h2>Birinchi buyurtmangiz<br/><span>maxsus narxda!</span></h2>
          <p>Ro'yxatdan o'ting va birinchi buyurtmangizdan zavqlaning</p>
          {!customer && (
            <button className="lp-btn lp-btn--white-orange"
              onClick={() => { setAuthModal('register'); setAuthTab('register') }}>
              Hoziroq ro'yxatdan o'ting
            </button>
          )}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer__top">
          <div className="lp-footer__brand">
            <div className="lp-logo">
              <span className="lp-logo__emoji">🍽️</span>
              <span className="lp-logo__text">ECO<span className="lp-logo__accent"> Taomlar</span></span>
            </div>
            <p>O'zbek milliy oshxonasining eng yaxshi ta'mi</p>
          </div>
          <div className="lp-footer__links">
            <h4>Sahifalar</h4>
            <a href="/staff">Xodimlar paneli</a>
            <a href="/cashier">Kassa</a>
            <a href="/kitchen">Oshxona</a>
            <a href="/admin">Admin</a>
          </div>
          <div className="lp-footer__contact">
            <h4>Aloqa</h4>
            <p>📞 +998 90 000 00 00</p>
            <p>📍 Toshkent sh.</p>
            <p>🕐 09:00 – 22:00</p>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <p>© 2024 ECO Taomlar. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>

      {/* ── CART SIDEBAR ─────────────────────────────────────── */}
      {cartOpen && (
        <div className="lp-overlay" onClick={() => setCartOpen(false)}>
          <div className="lp-cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="lp-cart-sidebar__head">
              <h3><ShoppingCart size={20}/> Savat ({cartCount} ta)</h3>
              <button onClick={() => setCartOpen(false)}><X size={22}/></button>
            </div>
            <div className="lp-cart-sidebar__items">
              {!cart.length ? (
                <div className="lp-cart-empty">
                  <span>🛒</span>
                  <p>Savat bo'sh</p>
                  <button className="lp-btn lp-btn--orange" onClick={() => setCartOpen(false)}>
                    Menyu ko'rish
                  </button>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="lp-cart-line">
                  <div className="lp-cart-line__emoji">{getEmoji(item.category)}</div>
                  <div className="lp-cart-line__info">
                    <span className="lp-cart-line__name">{item.name}</span>
                    <span className="lp-cart-line__price">{(item.price * item.qty).toLocaleString()} so'm</span>
                  </div>
                  <div className="lp-cart-line__ctrl">
                    <button onClick={() => updateQty(item.id, -1)}><Minus size={13}/></button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}><Plus size={13}/></button>
                    <button className="lp-cart-line__del" onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="lp-cart-sidebar__foot">
                <div className="lp-cart-total">
                  <span>Jami:</span>
                  <span className="lp-cart-total__amount">{cartTotal.toLocaleString()} so'm</span>
                </div>
                <button className="lp-btn lp-btn--checkout" onClick={handleCheckout}>
                  <Truck size={18}/> Buyurtma berish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AUTH MODAL ───────────────────────────────────────── */}
      {authModal && (
        <div className="lp-overlay lp-overlay--center" onClick={() => setAuthModal(null)}>
          <div className="lp-auth-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setAuthModal(null)}><X size={20}/></button>
            <div className="lp-auth-tabs">
              <button className={authTab === 'login' ? 'active' : ''} onClick={() => setAuthTab('login')}>Kirish</button>
              <button className={authTab === 'register' ? 'active' : ''} onClick={() => setAuthTab('register')}>Ro'yxatdan o'tish</button>
            </div>

            {authTab === 'login' ? (
              <form className="lp-auth-form" onSubmit={handleLogin}>
                <div className="lp-field">
                  <label><Phone size={13}/> Telefon raqami</label>
                  <input type="tel" placeholder="+998 90 123 45 67"
                    value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} required/>
                </div>
                <div className="lp-field">
                  <label><Lock size={13}/> Parol</label>
                  <div className="lp-pw-wrap">
                    <input type={showPw ? 'text' : 'password'} placeholder="Parolingiz"
                      value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required/>
                    <button type="button" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <button className="lp-btn lp-btn--orange lp-btn--full" disabled={authBusy}>
                  {authBusy ? 'Kirish...' : 'Kirish'}
                </button>
                <p className="lp-auth-switch">
                  Hisobingiz yo'qmi?{' '}
                  <button type="button" onClick={() => setAuthTab('register')}>Ro'yxatdan o'ting</button>
                </p>
              </form>
            ) : (
              <form className="lp-auth-form" onSubmit={handleRegister}>
                <div className="lp-field-row">
                  <div className="lp-field">
                    <label><User size={13}/> Ism *</label>
                    <input type="text" placeholder="Ismingiz"
                      value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} required/>
                  </div>
                  <div className="lp-field">
                    <label><User size={13}/> Familiya</label>
                    <input type="text" placeholder="Familiyangiz"
                      value={regForm.last_name} onChange={e => setRegForm({...regForm, last_name: e.target.value})}/>
                  </div>
                </div>
                <div className="lp-field">
                  <label><Phone size={13}/> Telefon raqami *</label>
                  <input type="tel" placeholder="+998 90 123 45 67"
                    value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} required/>
                </div>
                <div className="lp-field">
                  <label><Lock size={13}/> Parol *</label>
                  <div className="lp-pw-wrap">
                    <input type={showPw ? 'text' : 'password'} placeholder="Kamida 6 ta belgi"
                      value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} required minLength={6}/>
                    <button type="button" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <div className="lp-field">
                  <label><Lock size={13}/> Parolni tasdiqlang *</label>
                  <div className="lp-pw-wrap">
                    <input type={showCfm ? 'text' : 'password'} placeholder="Parolni takrorlang"
                      value={regForm.confirm} onChange={e => setRegForm({...regForm, confirm: e.target.value})} required/>
                    <button type="button" onClick={() => setShowCfm(v => !v)}>
                      {showCfm ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <button className="lp-btn lp-btn--orange lp-btn--full" disabled={authBusy}>
                  {authBusy ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
                </button>
                <p className="lp-auth-switch">
                  Hisobingiz bormi?{' '}
                  <button type="button" onClick={() => setAuthTab('login')}>Kirish</button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL ───────────────────────────────────── */}
      {checkoutOpen && (
        <div className="lp-overlay lp-overlay--center" onClick={() => setCheckoutOpen(false)}>
          <div className="lp-checkout-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setCheckoutOpen(false)}><X size={20}/></button>
            <h2 className="lp-checkout-title"><MapPin size={22}/> Yetkazish manzili</h2>
            {customer && (
              <div className="lp-checkout-customer">
                <User size={14}/> {customer.name} {customer.last_name || ''}
                &nbsp;·&nbsp;<Phone size={14}/> {customer.phone}
              </div>
            )}
            <div className="lp-order-summary">
              {cart.map(item => (
                <div key={item.id} className="lp-summary-line">
                  <span>{getEmoji(item.category)} {item.name} × {item.qty}</span>
                  <span>{(item.price * item.qty).toLocaleString()} so'm</span>
                </div>
              ))}
              <div className="lp-summary-total">
                <span>Jami:</span>
                <span>{cartTotal.toLocaleString()} so'm</span>
              </div>
            </div>
            <div className="lp-field">
              <label><MapPin size={13}/> To'liq manzil (ko'cha, uy, xonadon) *</label>
              <textarea
                className="lp-address-input"
                placeholder="Masalan: Yunusobod tumani, Amir Temur ko'chasi, 45-uy, 12-xonadon"
                rows={3}
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <button className="lp-btn lp-btn--checkout lp-btn--full"
              onClick={submitOrder}
              disabled={ordering || !address.trim()}>
              {ordering ? 'Yuborilmoqda...' : <><Truck size={18}/> Buyurtma berish</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PAYMENT POPUP ────────────────────────────────────── */}
      {paymentPopup && (
        <div className="lp-payment-popup">
          <button className="lp-payment-popup__close" onClick={closePayment}><X size={15}/></button>
          <div className="lp-payment-popup__icon">✅</div>
          <h4>Buyurtmangiz qabul qilindi!</h4>
          <p>To'lov yetkazib berilganda amalga oshiriladi</p>
          <div className="lp-payment-popup__bar">
            <div className="lp-payment-popup__bar-fill" style={{ animationDuration: '10s' }}/>
          </div>
          <span className="lp-payment-popup__timer">{countdown} soniya</span>
        </div>
      )}
    </div>
  )
}
