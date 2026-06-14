import { useState, useEffect, useRef, useCallback } from 'react'
import { menuAPI, ordersAPI, customerAPI } from '../../api'
import toast from 'react-hot-toast'
import {
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight, ChevronLeft,
  MapPin, Phone, User, Truck, Star, Clock, Leaf, Globe, LogOut,
  ClipboardList, Check, Loader, ChevronDown,
} from 'lucide-react'
import './LandingPage.css'

/* ── TRANSLATIONS ──────────────────────────────────────────── */
const LANG = {
  uz: {
    appName: 'ECO Taomlar',
    navMenu: 'Menyu', navAbout: 'Biz haqimizda', navContact: 'Aloqa',
    btnSignup: "Ro'yxat / Kirish",
    myOrders: 'Buyurtmalarim', logout: 'Chiqish',
    heroTag:   ['🥘 Milliy taom', '🍲 Sho\'rva', '🍜 Lagman'],
    heroTitle: ['Mazali O\'zbek', 'Issiq va To\'yimli', 'Qo\'lda Tayyorlangan'],
    heroAccent:['Plov', 'Sho\'rva', 'Lagman'],
    heroSub: [
      'An\'anaviy retsept bo\'yicha tayyorlangan, siz uchun yetkaziladi',
      'Ko\'p soatlik pishirilgan, to\'yimli va mazali',
      'Uy uslubida, sevgi bilan tayyorlangan taom',
    ],
    heroCta: 'Hozir buyurtma bering',
    heroBrowse: 'Menyu ko\'rish',
    stat1: 'Mamnun mijoz', stat2: 'Taom turi',
    stat3: 'Yetkazish', stat4: 'Halol',
    catsTitle: 'Kategoriyani tanlang',
    catAll: 'Barchasi',
    popularTitle: 'Mashhur Taomlar',
    popularSub: 'Har kuni yangi tayyorlangan',
    addCart: 'Savatga', addedCart: 'Savatda',
    offersTitle: 'Maxsus Takliflar',
    offer1t: '🚚 Bepul yetkazish', offer1s: '50 000 so\'mdan yuqori buyurtmaga',
    offer2t: '🔥 Birinchi buyurtma', offer2s: 'Birinchi buyurtmada 10% chegirma',
    offer3t: '⭐ VIP bonus', offer3s: 'Har 10 buyurtmada bepul taom',
    howTitle: 'Qanday ishlaydi?',
    step1t: 'Tanlang', step1s: 'Menyudan sevimli taomingizni tanlang',
    step2t: 'Buyurtma bering', step2s: 'Manzilingizni kiriting va tasdiqlang',
    step3t: 'Oling', step3s: '45 daqiqada eshigingizga yetkazamiz',
    reviewsTitle: 'Mijozlar fikri',
    r1n: 'Aziz T.', r1t: 'Plov juda mazali! Har doim shu yerdan buyurtma qilaman.',
    r2n: 'Malika S.', r2t: 'Tez yetkazildi, taomlar juda chiroyli va issiq edi.',
    r3n: 'Bobur K.', r3t: 'Lagman ajoyib! Uy uslubida tayyorlangan kabi.',
    footerDesc: 'O\'zbek milliy oshxonasining eng yaxshi ta\'mi',
    footerLinks: 'Sahifalar', footerContact: 'Aloqa',
    footerStaff: 'Xodimlar paneli',
    cartTitle: 'Savat', cartEmpty: 'Savat bo\'sh', cartBrowse: 'Menyudan tanlang',
    cartCheckout: 'Buyurtma berish',
    cartTotal: 'Jami',
    authTitle: "Ro'yxatdan o'ting",
    authSubtitle: "Ro'yxatdan o'ting yoki kiring",
    tabRegister: "Ro'yxat", tabLogin: 'Kirish',
    phoneLbl: 'Telefon raqami', phonePh: '+998 90 123 45 67',
    nameLbl: 'Ism *', namePh: 'Ismingiz',
    lastNameLbl: 'Familiya', lastNamePh: 'Familiyangiz (ixtiyoriy)',
    regBtn: "Ro'yxatdan o'tish", loginBtn: 'Kirish',
    regNote: 'Telefon raqamingiz orqali tanib olamiz',
    switchToLogin: 'Hisobingiz bormi? Kiring',
    switchToReg: "Ro'yxatdan o'tmadingizmi? Ro'yxat",
    checkoutTitle: 'Buyurtmani rasmiylashtirish',
    addrLbl: 'Yetkazish manzili *', addrPh: 'Ko\'cha, uy, xonadon...',
    noteLbl: 'Izoh', notePh: 'Oshpazga izoh (ixtiyoriy)',
    promoLbl: 'Promokod', promoPh: 'Promokodingiz',
    promoBtn: 'Qo\'llash',
    orderBtn: 'Buyurtma berish', ordering: 'Yuborilmoqda...',
    ordersTitle: 'Mening buyurtmalarim',
    ordersEmpty: 'Hali buyurtma yo\'q',
    ordersHint: 'Birinchi buyurtmangizni qiling!',
    cancelBtn: 'Bekor qilish',
    cancelConfirm: 'Buyurtmani bekor qilmoqchimisiz?',
    orderDate: 'Sana',
    statusPending: 'Qabul qilindi', statusCooking: 'Tayyorlanmoqda',
    statusReady: 'Tayyor', statusOnWay: 'Yo\'lda', statusServed: 'Yetkazildi',
    statusRejected: 'Bekor qilindi',
    sum: 'so\'m',
  },
  ru: {
    appName: 'ECO Taomlar',
    navMenu: 'Меню', navAbout: 'О нас', navContact: 'Контакты',
    btnSignup: 'Войти / Регистрация',
    myOrders: 'Мои заказы', logout: 'Выйти',
    heroTag:   ['🥘 Нац. блюдо', '🍲 Шурпа', '🍜 Лагман'],
    heroTitle: ['Вкусный Узбекский', 'Горячая и Сытная', 'Домашний'],
    heroAccent:['Плов', 'Шурпа', 'Лагман'],
    heroSub: [
      'Приготовлен по традиционному рецепту, доставим к вам',
      'Часами томлённый, сытный и ароматный',
      'Приготовлен дома, с любовью и заботой',
    ],
    heroCta: 'Заказать сейчас',
    heroBrowse: 'Смотреть меню',
    stat1: 'Довольных клиентов', stat2: 'Видов блюд',
    stat3: 'Доставка', stat4: 'Халяль',
    catsTitle: 'Выберите категорию',
    catAll: 'Все',
    popularTitle: 'Популярные блюда',
    popularSub: 'Ежедневно свежеприготовленные',
    addCart: 'В корзину', addedCart: 'В корзине',
    offersTitle: 'Специальные предложения',
    offer1t: '🚚 Бесплатная доставка', offer1s: 'На заказы от 50 000 сум',
    offer2t: '🔥 Первый заказ', offer2s: 'Скидка 10% на первый заказ',
    offer3t: '⭐ VIP бонус', offer3s: 'Каждый 10-й заказ бесплатно',
    howTitle: 'Как это работает?',
    step1t: 'Выберите', step1s: 'Выберите любимые блюда из меню',
    step2t: 'Закажите', step2s: 'Укажите адрес и подтвердите заказ',
    step3t: 'Получите', step3s: 'Доставим за 45 минут к вашей двери',
    reviewsTitle: 'Отзывы клиентов',
    r1n: 'Азиз Т.', r1t: 'Плов очень вкусный! Всегда заказываю здесь.',
    r2n: 'Малика С.', r2t: 'Быстрая доставка, блюда горячие и красивые.',
    r3n: 'Бобур К.', r3t: 'Лагман отличный! Как домашний.',
    footerDesc: 'Лучший вкус узбекской национальной кухни',
    footerLinks: 'Страницы', footerContact: 'Контакты',
    footerStaff: 'Панель сотрудников',
    cartTitle: 'Корзина', cartEmpty: 'Корзина пуста', cartBrowse: 'Выбрать из меню',
    cartCheckout: 'Оформить заказ',
    cartTotal: 'Итого',
    authTitle: 'Регистрация / Вход',
    authSubtitle: 'Зарегистрируйтесь или войдите',
    tabRegister: 'Регистрация', tabLogin: 'Войти',
    phoneLbl: 'Номер телефона', phonePh: '+998 90 123 45 67',
    nameLbl: 'Имя *', namePh: 'Ваше имя',
    lastNameLbl: 'Фамилия', lastNamePh: 'Фамилия (необязательно)',
    regBtn: 'Зарегистрироваться', loginBtn: 'Войти',
    regNote: 'Узнаём вас по номеру телефона',
    switchToLogin: 'Уже есть аккаунт? Войти',
    switchToReg: 'Нет аккаунта? Регистрация',
    checkoutTitle: 'Оформление заказа',
    addrLbl: 'Адрес доставки *', addrPh: 'Улица, дом, квартира...',
    noteLbl: 'Комментарий', notePh: 'Комментарий для повара (необязательно)',
    promoLbl: 'Промокод', promoPh: 'Ваш промокод',
    promoBtn: 'Применить',
    orderBtn: 'Заказать', ordering: 'Отправляется...',
    ordersTitle: 'Мои заказы',
    ordersEmpty: 'Заказов пока нет',
    ordersHint: 'Сделайте первый заказ!',
    cancelBtn: 'Отменить',
    cancelConfirm: 'Отменить заказ?',
    orderDate: 'Дата',
    statusPending: 'Принят', statusCooking: 'Готовится',
    statusReady: 'Готов', statusOnWay: 'В пути', statusServed: 'Доставлен',
    statusRejected: 'Отменён',
    sum: 'сум',
  },
}

const HERO_IMGS = [
  'https://images.unsplash.com/photo-1645696301019-35adcc18b6da?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=90',
]

const CAT_EMOJI = {
  "Sho'rva":'🍲','Shurpa':'🍲','Ikkinchi taom':'🍛','Milliy taomlar':'🫕',
  'Salatlar':'🥗','Ichimliklar':'🥤','Dessert':'🍮','Non':'🫓',
  'Lagman':'🍜','Kebab':'🥩','Grill':'🔥','default':'🍽️',
}
const CAT_GRAD = {
  "Sho'rva":'linear-gradient(135deg,#ff6b35,#e8511a)',
  'Ikkinchi taom':'linear-gradient(135deg,#ffb347,#ff6b35)',
  'Milliy taomlar':'linear-gradient(135deg,#f7971e,#ffd200)',
  'Salatlar':'linear-gradient(135deg,#56ab2f,#a8e063)',
  'Ichimliklar':'linear-gradient(135deg,#667eea,#764ba2)',
  'Dessert':'linear-gradient(135deg,#f857a6,#ff5858)',
  'default':'linear-gradient(135deg,#ff6b35,#ffb347)',
}
const STATUS_STEPS = ['pending','cooking','ready','on_way','served']

function getEmoji(cat){ return CAT_EMOJI[cat]||CAT_EMOJI.default }
function getGrad(cat){ return CAT_GRAD[cat]||CAT_GRAD.default }
function statusLabel(s, T){
  const m = {
    pending: T.statusPending, cooking: T.statusCooking,
    ready: T.statusReady, on_way: T.statusOnWay,
    served: T.statusServed, rejected: T.statusRejected,
  }
  return m[s] || s
}
function fmtDate(iso){
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

/* ── INTERSECTION OBSERVER hook ──────────────────────────── */
function useReveal(ref) {
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible') }),
      { threshold: 0.12 }
    )
    ref.current.querySelectorAll('.lp-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [ref])
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [lang, setLang] = useState(() => localStorage.getItem('eco_lang') || 'uz')
  const T = LANG[lang]

  const [slide, setSlide]         = useState(0)
  const [menu, setMenu]           = useState([])
  const [cats, setCats]           = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const [cart, setCart]           = useState([])
  const [cartOpen, setCartOpen]   = useState(false)
  const [authOpen, setAuthOpen]   = useState(false)
  const [authTab, setAuthTab]     = useState('register')
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [customer, setCustomer]   = useState(null)
  const [myOrders, setMyOrders]   = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const [langOpen, setLangOpen]   = useState(false)

  // Auth form
  const [regPhone, setRegPhone]   = useState('')
  const [regName,  setRegName]    = useState('')
  const [regLast,  setRegLast]    = useState('')
  const [loginPhone, setLoginPhone] = useState('')
  const [authBusy, setAuthBusy]   = useState(false)

  // Checkout form
  const [address, setAddress]     = useState('')
  const [note, setNote]           = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoApplied, setPromoApplied]   = useState(false)
  const [promoLoading, setPromoLoading]   = useState(false)
  const [placing, setPlacing]     = useState(false)

  const wsRef = useRef(null)
  const slideTimer = useRef(null)
  const menuRef   = useRef(null)
  const catRef    = useRef(null)
  const howRef    = useRef(null)
  const revRef    = useRef(document)
  const profileRef = useRef(null)

  useReveal(revRef)

  /* ── LOAD ──────────────────────────────────────────────── */
  useEffect(() => {
    try {
      const d = localStorage.getItem('eco_customer_data')
      if (d) setCustomer(JSON.parse(d))
    } catch {}

    menuAPI.getAll().then(r => {
      const avail = r.data.filter(i => i.available)
      setMenu(avail)
      setCats([...new Set(avail.map(i => i.category))])
    }).catch(() => {})

    const onScroll = () => setNavScrolled(window.scrollY > 70)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── SLIDE TIMER (1 minute each) ───────────────────────── */
  useEffect(() => {
    slideTimer.current = setInterval(() => setSlide(s => (s+1)%3), 60000)
    return () => clearInterval(slideTimer.current)
  }, [])

  const goSlide = (dir) => {
    clearInterval(slideTimer.current)
    setSlide(s => (s + dir + 3) % 3)
    slideTimer.current = setInterval(() => setSlide(s => (s+1)%3), 60000)
  }

  /* ── WEBSOCKET ─────────────────────────────────────────── */
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`)
    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'order_status_changed') {
          setMyOrders(prev => prev.map(o =>
            o.id === msg.payload.id ? { ...o, status: msg.payload.status } : o
          ))
        }
      } catch {}
    }
    wsRef.current = ws
    return () => ws.close()
  }, [])

  /* ── CLOSE DROPDOWNS ON OUTSIDE CLICK ─────────────────── */
  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── CART HELPERS ──────────────────────────────────────── */
  const addToCart = useCallback(item => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex
        ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty+1 } : c)
        : [...prev, { ...item, qty: 1 }]
    })
  }, [])

  const updateQty = (id, d) =>
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty+d } : c).filter(c => c.qty > 0))

  const removeFromCart = id => setCart(prev => prev.filter(c => c.id !== id))

  const cartCount = cart.reduce((s,c) => s+c.qty, 0)
  const cartTotal = cart.reduce((s,c) => s+c.price*c.qty, 0)
  const finalTotal = Math.max(0, cartTotal - promoDiscount)

  /* ── AUTH ─────────────────────────────────────────────── */
  const handleRegister = async e => {
    e.preventDefault()
    if (!regPhone || !regName) { toast.error(T.errorRegister || 'Telefon va ism kiritilishi shart'); return }
    setAuthBusy(true)
    try {
      const r = await customerAPI.register({ phone: regPhone, first_name: regName, last_name: regLast })
      const cust = r.data.customer
      localStorage.setItem('eco_customer_token', r.data.token)
      localStorage.setItem('eco_customer_data', JSON.stringify(cust))
      setCustomer(cust)
      setAuthOpen(false)
      toast.success(`Xush kelibsiz, ${cust.first_name}! 🎉`)
      if (cart.length) setCheckoutOpen(true)
    } catch(err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi')
    } finally { setAuthBusy(false) }
  }

  const handleLogin = async e => {
    e.preventDefault()
    if (!loginPhone) { toast.error('Telefon raqamini kiriting'); return }
    setAuthBusy(true)
    try {
      const r = await customerAPI.login({ phone: loginPhone })
      const cust = r.data.customer
      localStorage.setItem('eco_customer_token', r.data.token)
      localStorage.setItem('eco_customer_data', JSON.stringify(cust))
      setCustomer(cust)
      setAuthOpen(false)
      toast.success(`Xush kelibsiz, ${cust.first_name}!`)
      if (cart.length) setCheckoutOpen(true)
    } catch(err) {
      toast.error(err.response?.data?.error || 'Foydalanuvchi topilmadi')
    } finally { setAuthBusy(false) }
  }

  const logout = () => {
    localStorage.removeItem('eco_customer_token')
    localStorage.removeItem('eco_customer_data')
    setCustomer(null)
    setProfileOpen(false)
    toast.success(T.logout)
  }

  /* ── MY ORDERS ─────────────────────────────────────────── */
  const openOrders = async () => {
    setOrdersOpen(true)
    setOrdersLoading(true)
    try {
      const r = await customerAPI.orders()
      setMyOrders(r.data || [])
    } catch { setMyOrders([]) }
    finally { setOrdersLoading(false) }
  }

  const cancelOrder = async (code) => {
    if (!window.confirm(T.cancelConfirm)) return
    try {
      await customerAPI.cancelOrder(code, '')
      setMyOrders(prev => prev.map(o => o.order_code === code ? { ...o, status: 'rejected' } : o))
      toast.success(T.statusRejected)
    } catch(err) {
      toast.error(err.response?.data?.error || 'Xatolik')
    }
  }

  /* ── CHECKOUT ──────────────────────────────────────────── */
  const handleCheckout = () => {
    if (!cart.length) return
    if (!customer) { setAuthOpen(true); setAuthTab('register'); return }
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const r = await fetch('/api/promo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), order_total: cartTotal }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setPromoDiscount(data.discount || 0)
      setPromoApplied(true)
      toast.success(T.promoApplied || 'Promokod qo\'llandi!')
    } catch(err) {
      toast.error(err.message || 'Noto\'g\'ri promokod')
    } finally { setPromoLoading(false) }
  }

  const submitOrder = async () => {
    if (!address.trim()) { toast.error(T.addrLbl); return }
    setPlacing(true)
    try {
      await ordersAPI.create({
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty })),
        order_type: 'delivery',
        delivery_address: address.trim(),
        customer_name: `${customer.first_name} ${customer.last_name||''}`.trim(),
        customer_phone: customer.phone || '',
        customer_id: customer.id || 0,
        note,
        promo_code: promoApplied ? promoCode : '',
      })
      setCart([])
      setAddress('')
      setNote('')
      setPromoCode('')
      setPromoDiscount(0)
      setPromoApplied(false)
      setCheckoutOpen(false)
      toast.success(T.orderAccepted || 'Buyurtma qabul qilindi! 🎉', { duration: 5000 })
    } catch(err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi')
    } finally { setPlacing(false) }
  }

  const changeLang = l => { setLang(l); localStorage.setItem('eco_lang', l); setLangOpen(false) }

  /* ── FILTERED MENU ─────────────────────────────────────── */
  const filtered = activeCat === 'all' ? menu : menu.filter(i => i.category === activeCat)

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="lp">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className={`lp-nav ${navScrolled ? 'lp-nav--solid' : ''}`}>
        <div className="lp-nav__inner">
          <a href="/" className="lp-logo">
            <span className="lp-logo__icon">🍽️</span>
            <span className="lp-logo__name">ECO<span className="lp-logo__accent"> Taomlar</span></span>
          </a>

          <div className="lp-nav__links">
            <button onClick={() => menuRef.current?.scrollIntoView({ behavior:'smooth' })}>{T.navMenu}</button>
            <button onClick={() => howRef.current?.scrollIntoView({ behavior:'smooth' })}>{T.navAbout}</button>
          </div>

          <div className="lp-nav__right">
            {/* Language */}
            <div className="lp-lang" ref={null}>
              <button className="lp-lang__btn" onClick={() => setLangOpen(v => !v)}>
                <Globe size={15}/> {lang === 'uz' ? 'O\'z' : 'Рус'} <ChevronDown size={12}/>
              </button>
              {langOpen && (
                <div className="lp-lang__drop">
                  <button onClick={() => changeLang('uz')}>🇺🇿 O'zbek</button>
                  <button onClick={() => changeLang('ru')}>🇷🇺 Русский</button>
                </div>
              )}
            </div>

            {/* Cart */}
            <button className="lp-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={20}/>
              {cartCount > 0 && <span className="lp-cart-badge">{cartCount}</span>}
            </button>

            {/* Auth */}
            {customer ? (
              <div className="lp-profile" ref={profileRef}>
                <button className="lp-profile__btn" onClick={() => setProfileOpen(v => !v)}>
                  <div className="lp-avatar">{customer.first_name[0]?.toUpperCase()}</div>
                  <span>{customer.first_name}</span>
                  <ChevronDown size={14}/>
                </button>
                {profileOpen && (
                  <div className="lp-profile__drop">
                    <button onClick={() => { openOrders(); setProfileOpen(false) }}>
                      <ClipboardList size={16}/> {T.myOrders}
                    </button>
                    <button onClick={logout} className="lp-profile__logout">
                      <LogOut size={16}/> {T.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="lp-btn lp-btn--orange lp-btn--sm"
                onClick={() => { setAuthOpen(true); setAuthTab('register') }}>
                {T.btnSignup}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO CAROUSEL ────────────────────────────────────── */}
      <section className="lp-hero">
        {HERO_IMGS.map((img, i) => (
          <div key={i} className={`lp-hero__slide ${slide === i ? 'lp-hero__slide--active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}/>
        ))}
        <div className="lp-hero__overlay"/>

        <button className="lp-hero__arrow lp-hero__arrow--left" onClick={() => goSlide(-1)}>
          <ChevronLeft size={28}/>
        </button>
        <button className="lp-hero__arrow lp-hero__arrow--right" onClick={() => goSlide(1)}>
          <ChevronRight size={28}/>
        </button>

        <div className="lp-hero__content">
          {HERO_IMGS.map((_, i) => (
            <div key={i} className={`lp-hero__text-block ${slide === i ? 'active' : ''}`}>
              <div className="lp-hero__tag">{T.heroTag[i]}</div>
              <h1 className="lp-hero__title">
                {T.heroTitle[i]}<br/>
                <span className="lp-hero__accent">{T.heroAccent[i]}</span>
              </h1>
              <p className="lp-hero__sub">{T.heroSub[i]}</p>
              <div className="lp-hero__btns">
                <button className="lp-btn lp-btn--hero-primary"
                  onClick={() => menuRef.current?.scrollIntoView({ behavior:'smooth' })}>
                  {T.heroCta} <ChevronRight size={18}/>
                </button>
                <button className="lp-btn lp-btn--hero-ghost"
                  onClick={() => menuRef.current?.scrollIntoView({ behavior:'smooth' })}>
                  {T.heroBrowse}
                </button>
              </div>
              <div className="lp-hero__badges">
                <div className="lp-hero__badge"><Truck size={14}/> 30-45 {lang==='uz'?'daqiqa':'мин'}</div>
                <div className="lp-hero__badge"><Leaf size={14}/> {T.stat4}</div>
                <div className="lp-hero__badge"><Star size={14}/> 4.9 ★</div>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-hero__dots">
          {[0,1,2].map(i => (
            <button key={i} className={`lp-hero__dot ${slide===i?'active':''}`}
              onClick={() => { clearInterval(slideTimer.current); setSlide(i); slideTimer.current=setInterval(()=>setSlide(s=>(s+1)%3),60000) }}/>
          ))}
        </div>

        <div className="lp-hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="#fff"/>
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <div className="lp-stats">
        <div className="lp-stat lp-reveal"><span className="lp-stat__n">500+</span><span className="lp-stat__l">{T.stat1}</span></div>
        <div className="lp-stat-divider"/>
        <div className="lp-stat lp-reveal"><span className="lp-stat__n">30+</span><span className="lp-stat__l">{T.stat2}</span></div>
        <div className="lp-stat-divider"/>
        <div className="lp-stat lp-reveal"><span className="lp-stat__n">30-45</span><span className="lp-stat__l">{T.stat3}</span></div>
        <div className="lp-stat-divider"/>
        <div className="lp-stat lp-reveal"><span className="lp-stat__n">100%</span><span className="lp-stat__l">{T.stat4}</span></div>
      </div>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <section className="lp-cats-section" ref={catRef}>
        <div className="lp-section-head lp-reveal"><h2>{T.catsTitle}</h2></div>
        <div className="lp-cats-scroll">
          <button className={`lp-cat-item ${activeCat==='all'?'active':''}`}
            onClick={() => setActiveCat('all')}>
            <div className="lp-cat-icon" style={{ background:'linear-gradient(135deg,#ff6b35,#ffb347)' }}>🍽️</div>
            <span>{T.catAll}</span>
          </button>
          {cats.map(cat => (
            <button key={cat} className={`lp-cat-item ${activeCat===cat?'active':''}`}
              onClick={() => setActiveCat(cat)}>
              <div className="lp-cat-icon" style={{ background: getGrad(cat) }}>{getEmoji(cat)}</div>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── POPULAR DISHES ──────────────────────────────────── */}
      <section className="lp-menu-section" ref={menuRef}>
        <div className="lp-section-head lp-reveal">
          <h2>{T.popularTitle}</h2>
          <p>{T.popularSub}</p>
        </div>
        {menu.length === 0 ? (
          <div className="lp-loading"><div className="lp-spinner"/></div>
        ) : (
          <div className="lp-menu-grid">
            {filtered.map((item, i) => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <div key={item.id} className="lp-dish-card lp-reveal"
                  style={{ animationDelay: `${(i%8)*0.07}s` }}>
                  <div className="lp-dish-card__img"
                    style={{ background: item.image_url ? undefined : getGrad(item.category) }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} loading="lazy"/>
                      : <span className="lp-dish-card__emoji">{getEmoji(item.category)}</span>
                    }
                    <div className="lp-dish-card__cat">{item.category}</div>
                    {inCart && <div className="lp-dish-card__in-cart">✓ {inCart.qty}</div>}
                  </div>
                  <div className="lp-dish-card__body">
                    <div className="lp-dish-card__stars">
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="#FF6B35" color="#FF6B35"/>)}
                    </div>
                    <h3 className="lp-dish-card__name">{item.name}</h3>
                    {item.description && <p className="lp-dish-card__desc">{item.description}</p>}
                    <div className="lp-dish-card__footer">
                      <span className="lp-dish-card__price">
                        {item.price.toLocaleString()} <span className="lp-price-unit">{T.sum}</span>
                      </span>
                      <button className={`lp-add-btn ${inCart?'lp-add-btn--added':''}`}
                        onClick={() => { addToCart(item); setCartOpen(true) }}>
                        {inCart ? <><Check size={15}/> {T.addedCart}</> : <><Plus size={15}/> {T.addCart}</>}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── OFFERS ──────────────────────────────────────────── */}
      <section className="lp-offers">
        <div className="lp-section-head lp-reveal"><h2>{T.offersTitle}</h2></div>
        <div className="lp-offers-grid">
          <div className="lp-offer-card lp-offer-card--dark lp-reveal">
            <div className="lp-offer-card__icon">🚚</div>
            <h3>{T.offer1t}</h3>
            <p>{T.offer1s}</p>
          </div>
          <div className="lp-offer-card lp-offer-card--orange lp-reveal" style={{ animationDelay:'.1s' }}>
            <div className="lp-offer-card__icon">🔥</div>
            <h3>{T.offer2t}</h3>
            <p>{T.offer2s}</p>
            <button className="lp-btn lp-btn--white-sm" onClick={() => { setAuthOpen(true); setAuthTab('register') }}>
              {T.btnSignup}
            </button>
          </div>
          <div className="lp-offer-card lp-offer-card--gold lp-reveal" style={{ animationDelay:'.2s' }}>
            <div className="lp-offer-card__icon">⭐</div>
            <h3>{T.offer3t}</h3>
            <p>{T.offer3s}</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="lp-how" ref={howRef}>
        <div className="lp-section-head lp-reveal"><h2>{T.howTitle}</h2></div>
        <div className="lp-how-steps">
          {[
            { icon:'🛒', t: T.step1t, s: T.step1s },
            { icon:'📋', t: T.step2t, s: T.step2s },
            { icon:'🚀', t: T.step3t, s: T.step3s },
          ].map((step, i) => (
            <div key={i} className="lp-how-step lp-reveal" style={{ animationDelay: `${i*0.15}s` }}>
              <div className="lp-how-step__num">{i+1}</div>
              <div className="lp-how-step__icon">{step.icon}</div>
              <h3>{step.t}</h3>
              <p>{step.s}</p>
              {i < 2 && <div className="lp-how-step__arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────────── */}
      <section className="lp-reviews">
        <div className="lp-section-head lp-reveal"><h2>{T.reviewsTitle}</h2></div>
        <div className="lp-reviews-grid">
          {[
            { n: T.r1n, t: T.r1t, avatar: '👨' },
            { n: T.r2n, t: T.r2t, avatar: '👩' },
            { n: T.r3n, t: T.r3t, avatar: '👨‍💼' },
          ].map((r, i) => (
            <div key={i} className="lp-review-card lp-reveal" style={{ animationDelay: `${i*0.1}s` }}>
              <div className="lp-review-stars">
                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#FF6B35" color="#FF6B35"/>)}
              </div>
              <p className="lp-review-text">"{r.t}"</p>
              <div className="lp-review-author">
                <span className="lp-review-avatar">{r.avatar}</span>
                <span className="lp-review-name">{r.n}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer__top">
          <div className="lp-footer__brand">
            <div className="lp-logo lp-logo--footer">
              <span className="lp-logo__icon">🍽️</span>
              <span className="lp-logo__name">ECO<span className="lp-logo__accent"> Taomlar</span></span>
            </div>
            <p>{T.footerDesc}</p>
          </div>
          <div className="lp-footer__col">
            <h4>{T.footerLinks}</h4>
            <button onClick={() => menuRef.current?.scrollIntoView({ behavior:'smooth' })}>{T.navMenu}</button>
            <button onClick={() => howRef.current?.scrollIntoView({ behavior:'smooth' })}>{T.navAbout}</button>
            <a href="/staff">{T.footerStaff}</a>
          </div>
          <div className="lp-footer__col">
            <h4>{T.footerContact}</h4>
            <p>📞 +998 90 000 00 00</p>
            <p>📍 Toshkent sh.</p>
            <p>🕐 09:00 – 22:00</p>
          </div>
        </div>
        <div className="lp-footer__bottom">
          © 2024 ECO Taomlar.{' '}
          <a href="/staff" style={{ color:'rgba(255,255,255,.4)', textDecoration:'none' }}> Xodimlar</a>
        </div>
      </footer>

      {/* ════ CART SIDEBAR ════════════════════════════════════ */}
      {cartOpen && (
        <div className="lp-overlay" onClick={() => setCartOpen(false)}>
          <div className="lp-cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="lp-panel-head">
              <h3><ShoppingCart size={20}/> {T.cartTitle} ({cartCount})</h3>
              <button className="lp-icon-btn" onClick={() => setCartOpen(false)}><X size={22}/></button>
            </div>
            <div className="lp-cart-items">
              {!cart.length ? (
                <div className="lp-empty-state">
                  <span>🛒</span><p>{T.cartEmpty}</p>
                  <button className="lp-btn lp-btn--orange" onClick={() => setCartOpen(false)}>{T.cartBrowse}</button>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="lp-cart-row">
                  <div className="lp-cart-row__img" style={{ background: getGrad(item.category) }}>
                    {item.image_url ? <img src={item.image_url} alt="" loading="lazy"/> : getEmoji(item.category)}
                  </div>
                  <div className="lp-cart-row__info">
                    <span className="lp-cart-row__name">{item.name}</span>
                    <span className="lp-cart-row__price">{(item.price*item.qty).toLocaleString()} {T.sum}</span>
                  </div>
                  <div className="lp-cart-row__ctrl">
                    <button onClick={() => updateQty(item.id,-1)}><Minus size={13}/></button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id,1)}><Plus size={13}/></button>
                    <button className="lp-del-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="lp-cart-footer">
                <div className="lp-cart-total-row">
                  <span>{T.cartTotal}</span>
                  <span className="lp-cart-total-amount">{cartTotal.toLocaleString()} {T.sum}</span>
                </div>
                <button className="lp-btn lp-btn--checkout-main" onClick={handleCheckout}>
                  <Truck size={18}/> {T.cartCheckout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ AUTH MODAL ══════════════════════════════════════ */}
      {authOpen && (
        <div className="lp-overlay lp-overlay--center" onClick={() => setAuthOpen(false)}>
          <div className="lp-modal lp-auth-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setAuthOpen(false)}><X size={20}/></button>
            <div className="lp-modal-icon">🍽️</div>
            <h2 className="lp-modal-title">{T.authTitle}</h2>
            <div className="lp-auth-tabs">
              <button className={authTab==='register'?'active':''} onClick={() => setAuthTab('register')}>{T.tabRegister}</button>
              <button className={authTab==='login'?'active':''} onClick={() => setAuthTab('login')}>{T.tabLogin}</button>
            </div>

            {authTab === 'register' ? (
              <form className="lp-auth-form" onSubmit={handleRegister}>
                <div className="lp-field">
                  <label><Phone size={13}/> {T.phoneLbl}</label>
                  <input type="tel" placeholder={T.phonePh} value={regPhone}
                    onChange={e => setRegPhone(e.target.value)} required/>
                </div>
                <div className="lp-field-row">
                  <div className="lp-field">
                    <label><User size={13}/> {T.nameLbl}</label>
                    <input type="text" placeholder={T.namePh} value={regName}
                      onChange={e => setRegName(e.target.value)} required/>
                  </div>
                  <div className="lp-field">
                    <label><User size={13}/> {T.lastNameLbl}</label>
                    <input type="text" placeholder={T.lastNamePh} value={regLast}
                      onChange={e => setRegLast(e.target.value)}/>
                  </div>
                </div>
                <p className="lp-field-note">{T.regNote}</p>
                <button className="lp-btn lp-btn--orange lp-btn--full" disabled={authBusy}>
                  {authBusy ? <Loader size={18} className="lp-spin"/> : T.regBtn}
                </button>
                <p className="lp-auth-switch">
                  <button type="button" onClick={() => setAuthTab('login')}>{T.switchToLogin}</button>
                </p>
              </form>
            ) : (
              <form className="lp-auth-form" onSubmit={handleLogin}>
                <div className="lp-field">
                  <label><Phone size={13}/> {T.phoneLbl}</label>
                  <input type="tel" placeholder={T.phonePh} value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)} required/>
                </div>
                <button className="lp-btn lp-btn--orange lp-btn--full" disabled={authBusy}>
                  {authBusy ? <Loader size={18} className="lp-spin"/> : T.loginBtn}
                </button>
                <p className="lp-auth-switch">
                  <button type="button" onClick={() => setAuthTab('register')}>{T.switchToReg}</button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ════ CHECKOUT MODAL ══════════════════════════════════ */}
      {checkoutOpen && (
        <div className="lp-overlay lp-overlay--center" onClick={() => setCheckoutOpen(false)}>
          <div className="lp-modal lp-checkout-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setCheckoutOpen(false)}><X size={20}/></button>
            <h2 className="lp-modal-title"><MapPin size={20}/> {T.checkoutTitle}</h2>

            {customer && (
              <div className="lp-checkout-customer">
                <div className="lp-avatar lp-avatar--sm">{customer.first_name[0]}</div>
                {customer.first_name} {customer.last_name || ''} · {customer.phone}
              </div>
            )}

            <div className="lp-order-summary">
              {cart.map(item => (
                <div key={item.id} className="lp-summary-row">
                  <span>{getEmoji(item.category)} {item.name} × {item.qty}</span>
                  <span>{(item.price*item.qty).toLocaleString()} {T.sum}</span>
                </div>
              ))}
              {promoDiscount > 0 && (
                <div className="lp-summary-row lp-summary-row--green">
                  <span>Chegirma</span><span>-{promoDiscount.toLocaleString()} {T.sum}</span>
                </div>
              )}
              <div className="lp-summary-row lp-summary-row--total">
                <span>{T.cartTotal}</span>
                <span>{finalTotal.toLocaleString()} {T.sum}</span>
              </div>
            </div>

            <div className="lp-field">
              <label><MapPin size={13}/> {T.addrLbl}</label>
              <textarea className="lp-textarea" placeholder={T.addrPh} rows={3}
                value={address} onChange={e => setAddress(e.target.value)} required/>
            </div>

            <div className="lp-promo-row">
              <input className="lp-promo-input" placeholder={T.promoPh}
                value={promoCode} onChange={e => setPromoCode(e.target.value)}
                disabled={promoApplied}/>
              <button className="lp-btn lp-btn--ghost-orange" onClick={applyPromo}
                disabled={promoLoading || promoApplied}>
                {promoLoading ? <Loader size={15} className="lp-spin"/> : T.promoBtn}
              </button>
            </div>

            <div className="lp-field">
              <label>{T.noteLbl}</label>
              <input type="text" placeholder={T.notePh} value={note} onChange={e => setNote(e.target.value)}/>
            </div>

            <button className="lp-btn lp-btn--checkout-main lp-btn--full"
              onClick={submitOrder} disabled={placing || !address.trim()}>
              {placing ? <Loader size={18} className="lp-spin"/> : <><Truck size={18}/> {T.orderBtn}</>}
            </button>
          </div>
        </div>
      )}

      {/* ════ MY ORDERS PANEL ═════════════════════════════════ */}
      {ordersOpen && (
        <div className="lp-overlay" onClick={() => setOrdersOpen(false)}>
          <div className="lp-orders-panel" onClick={e => e.stopPropagation()}>
            <div className="lp-panel-head">
              <h3><ClipboardList size={20}/> {T.ordersTitle}</h3>
              <button className="lp-icon-btn" onClick={() => setOrdersOpen(false)}><X size={22}/></button>
            </div>
            <div className="lp-orders-list">
              {ordersLoading ? (
                <div className="lp-loading"><div className="lp-spinner"/></div>
              ) : !myOrders.length ? (
                <div className="lp-empty-state">
                  <span>📋</span>
                  <p>{T.ordersEmpty}</p>
                  <p className="lp-empty-hint">{T.ordersHint}</p>
                  <button className="lp-btn lp-btn--orange"
                    onClick={() => { setOrdersOpen(false); menuRef.current?.scrollIntoView({ behavior:'smooth' }) }}>
                    {T.heroCta}
                  </button>
                </div>
              ) : myOrders.map(order => {
                const stepIdx = STATUS_STEPS.indexOf(order.status)
                const cancellable = ['pending','cooking'].includes(order.status)
                return (
                  <div key={order.id} className={`lp-order-card status-${order.status}`}>
                    <div className="lp-order-card__head">
                      <span className="lp-order-code">#{order.order_code}</span>
                      <span className={`lp-status-badge lp-status-badge--${order.status}`}>
                        {statusLabel(order.status, T)}
                      </span>
                    </div>

                    {/* Status progress */}
                    {order.status !== 'rejected' && (
                      <div className="lp-order-progress">
                        {STATUS_STEPS.map((step, si) => (
                          <div key={step} className={`lp-progress-step ${si <= stepIdx ? 'done' : ''} ${si === stepIdx ? 'active' : ''}`}>
                            <div className="lp-progress-dot"/>
                            <span>{statusLabel(step, T)}</span>
                            {si < STATUS_STEPS.length-1 && <div className={`lp-progress-line ${si < stepIdx ? 'done' : ''}`}/>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="lp-order-card__body">
                      {order.items?.map((item, ii) => (
                        <span key={ii} className="lp-order-item-chip">{item.item_name} ×{item.quantity}</span>
                      ))}
                    </div>
                    <div className="lp-order-card__foot">
                      <span className="lp-order-total">{order.final_price?.toLocaleString()} {T.sum}</span>
                      <span className="lp-order-date">{fmtDate(order.created_at)}</span>
                      {cancellable && (
                        <button className="lp-cancel-btn" onClick={() => cancelOrder(order.order_code)}>
                          <X size={13}/> {T.cancelBtn}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
