import { useState, useEffect, useRef, useCallback } from 'react'
import { menuAPI, ordersAPI, customerAPI } from '../../api'
import {
  ShoppingCart, X, Plus, Minus, ChevronLeft, ChevronRight,
  User, LogOut, ClipboardList, Star, Truck, Package,
  Search, ClipboardCheck, Rocket, MapPin, Phone, Utensils,
  CheckCircle, Loader, ChevronDown, Send,
} from 'lucide-react'
import './LandingPage.css'

/* ─── API helper for reviews ─────────────────────────────────────────────────── */
const reviewsAPI = {
  getAll: () => fetch('/api/reviews').then(r => r.json()),
  create: (code, data) => {
    const token = localStorage.getItem('eco_customer_token')
    return fetch(`/api/customer/orders/${code}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }).then(r => r.json().then(d => ({ ok: r.ok, data: d })))
  },
}

/* ─── Translations ────────────────────────────────────────────────────────────── */
const LANG = {
  uz: {
    nav_menu: 'Menyu', nav_about: 'Haqimizda', nav_contact: 'Aloqa',
    auth_btn: "Kirish / Ro'yxat", orders_btn: 'Buyurtmalarim', logout: 'Chiqish',
    slides: [
      { eye: '🥘 O\'ZBEK MILLIY TAOMI', title: "Yoqimli", accent: 'O\'zbek Oshi', sub: "Qo'zichoq go'shti, ziravorlar va yangi guruchdan tayyorlangan an'anaviy plov. Har bir qoshiq — milliy meros." },
      { eye: '🍲 ISSIQ VA TO\'YIMLI',    title: "Badanga Shifo",   accent: "Sho'rva",  sub: "Qo'y go'shtidan sekin pishirilgan, ko'katlar va sabzavotlar bilan boyitilgan milliy sho'rva." },
      { eye: '🍜 QO\'LDA TAYYORLANGAN', title: "Uy Ta'midi",      accent: 'Lagman',   sub: "Yangi qo'lda yoylgan xamir, go'sht va rang-barang sabzavotlar bilan tayyorlangan issiq lagman." },
      { eye: '🥟 TENDER VA SHIRINLIK',  title: "Nozik va Mazali", accent: 'Manti',    sub: "Yupqa xamirga o'ralgan, bug'da pishirilgan mol go'shtli manti. Bir tekis va to'yimli." },
      { eye: '🔥 TANDIRDA PISHIRILGAN', title: "Qaynoq va Yangi", accent: 'Samsa',   sub: "Tandir issiqligida oltin rangga pishirilgan, go'sht yoki sabzavot to'ldirmalari bilan samsa." },
    ],
    order_now: 'Hozir buyurtma bering', view_menu: "Menyuni ko'rish",
    menu_eye: 'BIZNING MENYU', menu_title: 'Sevimli Taomlaringiz', menu_sub: 'Har kuni yangi tayyorlangan, milliy retseptlar asosida',
    cat_all: 'Barchasi',
    add: 'Qo\'shish', in_cart: 'Savatda',
    how_eye: 'QANDAY ISHLAYDI', how_title: 'Uchta oddiy qadam',
    how1_ttl: 'Tanlang', how1_sub: 'Menyudan sevimli taomingizni savatga qo\'shing',
    how2_ttl: 'Buyurtma bering', how2_sub: 'Manzil va to\'lov usulini kiriting, tasdiqlang',
    how3_ttl: 'Oling', how3_sub: "45 daqiqada issiq holda eshigingizga yetkazamiz",
    rv_eye: 'MIJOZLAR FIKRI', rv_title: 'Ular bizni yaxshi ko\'rishadi',
    rv_cta_ttl: 'Buyurtmangizdan mamnunmisiz?', rv_cta_sub: 'Fikringizni qoldiring — boshqalarga yordam bo\'ladi',
    rv_btn: 'Fikr qoldirish', rv_login_hint: 'Fikr qoldirish uchun avval kiring',
    rv_empty: 'Hali fikrlar yo\'q. Birinchi bo\'lib fikr qoldiring!',
    footer_desc: "O'zbek milliy oshxonasining eng sara ta'mi. Har kuni yangi, har kuni mazali.",
    footer_pages: 'Sahifalar', footer_contact: 'Aloqa',
    staff: 'Xodimlar paneli', privacy: 'Maxfiylik', terms: 'Shartlar',
    cart_ttl: 'Savat', cart_empty: 'Savat bo\'sh', cart_empty_hint: 'Menyudan taom qo\'shing',
    cart_total: 'Jami', cart_btn: 'Buyurtma berish',
    auth_ttl: 'Xush kelibsiz', tab_reg: "Ro'yxat", tab_login: 'Kirish',
    fname_lbl: 'Ism *', fname_ph: 'Ismingiz',
    lname_lbl: 'Familiya', lname_ph: 'Familiyangiz (ixtiyoriy)',
    phone_lbl: 'Telefon raqami *', phone_ph: '+998 90 123 45 67',
    reg_btn: "Ro'yxatdan o'tish", login_btn: 'Kirish',
    reg_note: "Telefon raqamingizni kiriting. Hisobingiz bo'lsa, avtomatik kiriladi.",
    login_note: "Ro'yxatdan o'tgan raqamingizni kiriting.",
    co_ttl: 'Buyurtmani rasmiylashtirish',
    delivery: 'Yetkazish', pickup: 'Olib ketish',
    addr_lbl: 'Yetkazish manzili *', addr_ph: 'Ko\'cha, uy, xonadon...',
    note_lbl: 'Izoh', note_ph: 'Oshpazga xabar (ixtiyoriy)',
    promo_ph: 'Promokod', promo_btn: 'Qo\'llash',
    total: 'Jami', discount: 'Chegirma',
    place_order: 'Buyurtma berish', placing: 'Yuborilmoqda...',
    co_ok_ttl: 'Buyurtma qabul qilindi!', co_ok_sub: 'Buyurtmangiz tayyorlanmoqda. Holati "Buyurtmalarim"da ko\'rinadi.',
    orders_ttl: 'Mening buyurtmalarim', orders_empty: 'Hali buyurtma yo\'q',
    orders_empty_hint: 'Birinchi buyurtmangizni qiling!',
    st_pending: 'Qabul qilindi', st_cooking: 'Tayyorlanmoqda', st_ready: 'Tayyor',
    st_on_way: 'Yo\'lda', st_served: 'Yetkazildi', st_rejected: 'Bekor qilindi', st_cancelled: 'Bekor qilindi',
    cancel_btn: 'Bekor qilish',
    rv_modal_ttl: 'Fikr qoldiring', rv_modal_sub: 'Buyurtmangiz yetkazildi. Qanday bo\'ldi?',
    rv_comment_lbl: 'Izoh (ixtiyoriy)', rv_comment_ph: 'Taom haqida fikringiz...',
    rv_submit: 'Yuborish', rv_skip: 'Keyinroq',
    rv_thanks: 'Fikringiz uchun rahmat!',
    err_fill: 'Maydonlarni to\'ldiring', err_phone: 'Telefon raqamini kiriting',
    err_addr: 'Yetkazish manzilini kiriting',
    ok_order: 'Buyurtma qabul qilindi!',
    ok_cancelled: 'Buyurtma bekor qilindi',
    err_cancel: 'Bekor qilishda xatolik',
    delivered_notif: 'Buyurtmangiz yetkazildi!',
  },
  ru: {
    nav_menu: 'Меню', nav_about: 'О нас', nav_contact: 'Контакты',
    auth_btn: 'Войти / Регистрация', orders_btn: 'Мои заказы', logout: 'Выйти',
    slides: [
      { eye: '🥘 УЗБЕКСКАЯ КУХНЯ',    title: 'Настоящий',         accent: 'Узбекский Плов', sub: 'Традиционный плов из баранины, приправ и свежего риса. Каждая ложка — частица национального наследия.' },
      { eye: '🍲 ГОРЯЧЕЕ И СЫТНОЕ',   title: 'Целебный',           accent: 'Шурпа',          sub: 'Медленно приготовленная шурпа из баранины, обогащённая зеленью и овощами.' },
      { eye: '🍜 РУЧНАЯ РАБОТА',      title: 'Домашний вкус',      accent: 'Лагман',         sub: 'Лапша ручного приготовления с мясом и овощами. Горячий и ароматный.' },
      { eye: '🥟 НЕЖНОЕ И ВКУСНОЕ',   title: 'Нежное и Сытное',   accent: 'Манты',          sub: 'Тонкое тесто с мясной начинкой, приготовленное на пару. Сочно и питательно.' },
      { eye: '🔥 ИЗ ТАНДИРА',         title: 'Горячее и Свежее',   accent: 'Самса',          sub: 'Самса, запечённая в тандире до золотистой корочки, с мясом или овощами.' },
    ],
    order_now: 'Заказать сейчас', view_menu: 'Смотреть меню',
    menu_eye: 'НАШЕ МЕНЮ', menu_title: 'Ваши любимые блюда', menu_sub: 'Каждый день свежее, по национальным рецептам',
    cat_all: 'Все',
    add: 'Добавить', in_cart: 'В корзине',
    how_eye: 'КАК ЭТО РАБОТАЕТ', how_title: 'Три простых шага',
    how1_ttl: 'Выберите', how1_sub: 'Добавьте любимые блюда из меню в корзину',
    how2_ttl: 'Оформите', how2_sub: 'Введите адрес и подтвердите заказ',
    how3_ttl: 'Получите', how3_sub: 'Доставим горячим к вашей двери за 45 минут',
    rv_eye: 'ОТЗЫВЫ', rv_title: 'Они нас любят',
    rv_cta_ttl: 'Довольны заказом?', rv_cta_sub: 'Оставьте отзыв — помогите другим',
    rv_btn: 'Оставить отзыв', rv_login_hint: 'Войдите, чтобы оставить отзыв',
    rv_empty: 'Пока отзывов нет. Будьте первым!',
    footer_desc: 'Лучшие вкусы узбекской национальной кухни. Каждый день свежее.',
    footer_pages: 'Страницы', footer_contact: 'Контакты',
    staff: 'Панель сотрудников', privacy: 'Конфиденциальность', terms: 'Условия',
    cart_ttl: 'Корзина', cart_empty: 'Корзина пуста', cart_empty_hint: 'Добавьте блюда из меню',
    cart_total: 'Итого', cart_btn: 'Оформить заказ',
    auth_ttl: 'Добро пожаловать', tab_reg: 'Регистрация', tab_login: 'Войти',
    fname_lbl: 'Имя *', fname_ph: 'Ваше имя',
    lname_lbl: 'Фамилия', lname_ph: 'Ваша фамилия (необязательно)',
    phone_lbl: 'Номер телефона *', phone_ph: '+998 90 123 45 67',
    reg_btn: 'Зарегистрироваться', login_btn: 'Войти',
    reg_note: 'Введите номер телефона. Если аккаунт существует, вы войдёте автоматически.',
    login_note: 'Введите зарегистрированный номер телефона.',
    co_ttl: 'Оформление заказа',
    delivery: 'Доставка', pickup: 'Самовывоз',
    addr_lbl: 'Адрес доставки *', addr_ph: 'Улица, дом, квартира...',
    note_lbl: 'Комментарий', note_ph: 'Пожелания повару (необязательно)',
    promo_ph: 'Промокод', promo_btn: 'Применить',
    total: 'Итого', discount: 'Скидка',
    place_order: 'Оформить заказ', placing: 'Отправка...',
    co_ok_ttl: 'Заказ принят!', co_ok_sub: 'Ваш заказ готовится. Статус виден в «Мои заказы».',
    orders_ttl: 'Мои заказы', orders_empty: 'Заказов пока нет',
    orders_empty_hint: 'Сделайте первый заказ!',
    st_pending: 'Принят', st_cooking: 'Готовится', st_ready: 'Готов',
    st_on_way: 'В пути', st_served: 'Доставлен', st_rejected: 'Отменён', st_cancelled: 'Отменён',
    cancel_btn: 'Отменить',
    rv_modal_ttl: 'Оставьте отзыв', rv_modal_sub: 'Заказ доставлен. Как вам понравилось?',
    rv_comment_lbl: 'Комментарий (необязательно)', rv_comment_ph: 'Ваши впечатления о блюдах...',
    rv_submit: 'Отправить', rv_skip: 'Позже',
    rv_thanks: 'Спасибо за отзыв!',
    err_fill: 'Заполните все поля', err_phone: 'Введите номер телефона',
    err_addr: 'Введите адрес доставки',
    ok_order: 'Заказ принят!',
    ok_cancelled: 'Заказ отменён',
    err_cancel: 'Ошибка при отмене',
    delivered_notif: 'Ваш заказ доставлен!',
  },
}

/* ─── Slide images ───────────────────────────────────────────────────────────── */
const SLIDES_IMG = [
  'https://images.unsplash.com/photo-ojDzHZHcVx4?w=1920&q=85&auto=format&fit=crop',   // Plov - rice with meat & vegetables
  'https://images.unsplash.com/photo-qFpTSS7BSuM?w=1920&q=85&auto=format&fit=crop',   // Shorva - meat & vegetable soup/bone broth
  'https://images.unsplash.com/photo-xvAaSlU-zpM?w=1920&q=85&auto=format&fit=crop',   // Lagman - noodles with meat & vegetables
  'https://images.unsplash.com/photo-UCGeYgaAP0Y?w=1920&q=85&auto=format&fit=crop',   // Manti - steaming dumplings in bamboo basket
  'https://images.unsplash.com/photo-rjRctqPNCZU?w=1920&q=85&auto=format&fit=crop',   // Samsa - baked pastry
]

/* ─── Status config ──────────────────────────────────────────────────────────── */
const STATUS_STEPS = ['pending', 'cooking', 'ready', 'on_way', 'served']
const STATUS_KEY   = { pending: 'st_pending', cooking: 'st_cooking', ready: 'st_ready', on_way: 'st_on_way', served: 'st_served', rejected: 'st_rejected', cancelled: 'st_cancelled' }

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const fmt = n => Math.round(n).toLocaleString('uz-UZ') + ' so\'m'
const fmtDate = iso => new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
const initials = name => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

let toastId = 0

/* ═══════════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  // ── Core
  const [lang, setLang] = useState(() => localStorage.getItem('eco_lang') || 'uz')
  const T = LANG[lang]

  // ── Hero
  const [slide, setSlide] = useState(0)
  const slideTimer = useRef(null)

  // ── Menu
  const [menu, setMenu]       = useState([])
  const [menuLoading, setML]  = useState(true)
  const [cat, setCat]         = useState('all')

  // ── Cart
  const [cart, setCart]       = useState([])
  const [cartOpen, setCO]     = useState(false)

  // ── Auth
  const [authOpen, setAO]     = useState(false)
  const [authTab, setATab]    = useState('register')
  const [customer, setCust]   = useState(null)
  const [dropOpen, setDrop]   = useState(false)

  // ── Orders panel
  const [ordersOpen, setOO]   = useState(false)
  const [myOrders, setMO]     = useState([])
  const [flashId, setFlash]   = useState(null)

  // ── Checkout
  const [checkoutOpen, setCkO] = useState(false)
  const [placing, setPlacing]  = useState(false)
  const [checkoutDone, setCkD] = useState(false)
  const [delivType, setDT]     = useState('pickup')
  const [addrVal, setAddr]     = useState('')
  const [noteVal, setNote]     = useState('')
  const [promoVal, setPromo]   = useState('')
  const [promoRes, setPromoR]  = useState(null) // { discount, discount_type, message }
  const [promoErr, setPromoE]  = useState('')
  const [promoChecking, setPCk] = useState(false)

  // ── Reviews
  const [reviews, setRvs]      = useState([])
  const [reviewOpen, setRvO]   = useState(false)
  const [reviewOrder, setRvOrd] = useState(null)
  const [rvRating, setRvR]     = useState(0)
  const [rvComment, setRvC]    = useState('')
  const [rvSending, setRvS]    = useState(false)
  const [reviewedCodes, setRC] = useState(new Set())

  // ── Header scroll
  const [scrolled, setScrolled] = useState(false)

  // ── Toast queue
  const [toasts, setToasts]    = useState([])

  // ── WS
  const wsRef       = useRef(null)
  const reconnRef   = useRef(null)

  // ─── Toast system ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280)
    }, 3500)
  }, [])

  // ─── Lang change ─────────────────────────────────────────────────────────────
  const changeLang = l => { setLang(l); localStorage.setItem('eco_lang', l) }

  // ─── Scroll detect ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ─── Reveal observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.lp-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [menu, reviews])

  // ─── Hero timer (15s) ────────────────────────────────────────────────────────
  const startSlideTimer = useCallback(() => {
    clearInterval(slideTimer.current)
    slideTimer.current = setInterval(() => setSlide(s => (s + 1) % 5), 15000)
  }, [])

  useEffect(() => {
    startSlideTimer()
    return () => clearInterval(slideTimer.current)
  }, [startSlideTimer])

  const goSlide = n => { setSlide((n + 5) % 5); startSlideTimer() }

  // ─── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Auth restore
    const raw = localStorage.getItem('eco_customer_data')
    if (raw) try { setCust(JSON.parse(raw)) } catch {}

    // Menu
    menuAPI.getAll().then(r => {
      setMenu((r.data || []).filter(m => m.available !== false))
    }).catch(() => {}).finally(() => setML(false))

    // Reviews
    reviewsAPI.getAll().then(data => {
      if (Array.isArray(data)) setRvs(data)
    }).catch(() => {})

    // Preload hero images
    SLIDES_IMG.forEach(src => { const img = new Image(); img.src = src })
  }, [])

  // ─── WebSocket ────────────────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    try {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${proto}//${location.host}/ws`)
      ws.onmessage = e => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'order_status_changed' || msg.type === 'order_delivered') {
            const ord = msg.payload
            setMO(prev => prev.map(o => o.id === ord.id ? { ...o, status: ord.status } : o))
            if (msg.type === 'order_delivered') {
              const custRaw = localStorage.getItem('eco_customer_data')
              if (custRaw) {
                const cust = JSON.parse(custRaw)
                if (
                  (ord.customer_id && cust.id === ord.customer_id) ||
                  (ord.customer_phone && cust.phone === ord.customer_phone)
                ) {
                  showToast(T.delivered_notif, 'success')
                  setRvOrd(ord)
                  setRvO(true)
                  setFlash(ord.id)
                  setTimeout(() => setFlash(null), 3000)
                }
              }
            }
          }
        } catch {}
      }
      ws.onclose = () => {
        clearTimeout(reconnRef.current)
        reconnRef.current = setTimeout(connectWS, 2500)
      }
      ws.onerror = () => { try { ws.close() } catch {} }
      wsRef.current = ws
    } catch {
      reconnRef.current = setTimeout(connectWS, 2500)
    }
  }, [showToast, T.delivered_notif])

  useEffect(() => {
    connectWS()
    return () => { wsRef.current?.close(); clearTimeout(reconnRef.current) }
  }, [connectWS])

  // ─── Cart ─────────────────────────────────────────────────────────────────────
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const addToCart = item => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
    showToast(`${item.name} savatga qo'shildi`, 'success')
  }
  const updateQty = (id, d) => {
    setCart(prev => {
      const next = prev.map(c => c.id === id ? { ...c, quantity: c.quantity + d } : c).filter(c => c.quantity > 0)
      return next
    })
  }
  const removeFromCart = id => setCart(prev => prev.filter(c => c.id !== id))

  // ─── Auth ─────────────────────────────────────────────────────────────────────
  const [authPhone, setAuthPhone]   = useState('')
  const [authFName, setAuthFName]   = useState('')
  const [authLName, setAuthLName]   = useState('')
  const [authErr, setAuthErr]       = useState('')
  const [authLoading, setAuthL]     = useState(false)

  const openAuth = (tab = 'register') => { setATab(tab); setAuthErr(''); setAO(true) }

  const handleAuth = async () => {
    if (!authPhone.trim()) { setAuthErr(T.err_phone); return }
    if (authTab === 'register' && !authFName.trim()) { setAuthErr(T.err_fill); return }
    setAuthL(true); setAuthErr('')
    try {
      let res
      if (authTab === 'register') {
        res = await customerAPI.register({ phone: authPhone, first_name: authFName, last_name: authLName })
      } else {
        res = await customerAPI.login({ phone: authPhone })
      }
      const { token, customer } = res.data || {}
      if (!token) { setAuthErr(res.data?.error || 'Xatolik'); return }
      localStorage.setItem('eco_customer_token', token)
      localStorage.setItem('eco_customer_data', JSON.stringify(customer))
      setCust(customer)
      setAO(false)
      showToast(`Xush kelibsiz, ${customer?.first_name || ''}!`, 'success')
    } catch { setAuthErr('Serverda xatolik') }
    finally { setAuthL(false) }
  }

  const logout = () => {
    localStorage.removeItem('eco_customer_token')
    localStorage.removeItem('eco_customer_data')
    setCust(null); setDrop(false); setMO([])
  }

  // ─── My orders ───────────────────────────────────────────────────────────────
  const openOrders = async () => {
    setOO(true)
    if (!customer) return
    try {
      const res = await customerAPI.orders()
      setMO(res.data || [])
    } catch {}
  }

  const cancelOrder = async code => {
    try {
      await customerAPI.cancelOrder(code)
      setMO(prev => prev.map(o => o.order_code === code ? { ...o, status: 'cancelled' } : o))
      showToast(T.ok_cancelled, 'info')
    } catch { showToast(T.err_cancel, 'error') }
  }

  // ─── Checkout ─────────────────────────────────────────────────────────────────
  const openCheckout = () => {
    if (!customer) { openAuth(); return }
    setCkD(false); setPromoR(null); setPromoE(''); setPromoVal('')
    setCkO(true)
  }

  const checkPromo = async () => {
    if (!promoVal.trim()) return
    setPCk(true); setPromoE(''); setPromoR(null)
    try {
      const res = await fetch('/api/promo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoVal, order_total: cartTotal }),
      })
      const d = await res.json()
      if (!res.ok) { setPromoE(d.error || 'Noto\'g\'ri promokod'); return }
      setPromoR(d)
    } catch { setPromoE('Xatolik') }
    finally { setPCk(false) }
  }

  const finalTotal = () => {
    if (!promoRes) return cartTotal
    if (promoRes.discount_type === 'percent') return cartTotal * (1 - promoRes.discount / 100)
    return Math.max(0, cartTotal - promoRes.discount)
  }

  const placeOrder = async () => {
    if (delivType === 'delivery' && !addrVal.trim()) { showToast(T.err_addr, 'error'); return }
    setPlacing(true)
    try {
      const payload = {
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
        delivery_type: delivType,
        delivery_address: delivType === 'delivery' ? addrVal : '',
        note: noteVal,
        customer_first_name: customer?.first_name || '',
        customer_last_name:  customer?.last_name  || '',
        customer_phone:      customer?.phone       || '',
        promo_code:          promoRes ? promoVal : '',
      }
      const res = await ordersAPI.create(payload)
      if (!res.data?.id) throw new Error()
      setCkD(true); setCart([])
      showToast(T.ok_order, 'success')
      // refresh orders list
      const o = await customerAPI.orders()
      setMO(o.data || [])
    } catch { showToast('Xatolik yuz berdi', 'error') }
    finally { setPlacing(false) }
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  const submitReview = async () => {
    if (!rvRating || !reviewOrder) return
    setRvS(true)
    const res = await reviewsAPI.create(reviewOrder.order_code, { rating: rvRating, comment: rvComment })
    setRvS(false)
    if (res.ok) {
      showToast(T.rv_thanks, 'success')
      setReviewedCodes(prev => new Set([...prev, reviewOrder.order_code]))
      setRvO(false); setRvRating(0); setRvC('')
      // Prepend to local reviews list
      setRvs(prev => [res.data, ...prev])
    } else {
      showToast(res.data?.error || 'Xatolik', 'error')
    }
  }

  // ─── Category list ────────────────────────────────────────────────────────────
  const cats = ['all', ...new Set(menu.map(m => m.category).filter(Boolean))]
  const filteredMenu = cat === 'all' ? menu : menu.filter(m => m.category === cat)

  // ─── Scroll helpers ───────────────────────────────────────────────────────────
  const scrollToMenu = () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header className={`lp-header${scrolled ? ' lp-header--scrolled' : ''}`}>
        <a className="lp-header__logo" href="/">
          <div className="lp-header__logo-icon"><Utensils size={18} color="#fff" /></div>
          <span className="lp-header__logo-name">ECO <em>Taomlar</em></span>
        </a>

        <nav className="lp-header__nav">
          <a href="#menu"    onClick={e => { e.preventDefault(); scrollToMenu() }}>{T.nav_menu}</a>
          <a href="#how"     onClick={e => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }) }}>{T.nav_about}</a>
          <a href="#reviews" onClick={e => { e.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }) }}>{T.nav_contact}</a>
        </nav>

        <div className="lp-header__right">
          <div className="lp-lang">
            <button className={lang === 'uz' ? 'active' : ''} onClick={() => changeLang('uz')}>UZ</button>
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => changeLang('ru')}>RU</button>
          </div>

          <button className="lp-hcart" onClick={() => setCO(true)}>
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="lp-hcart-badge">{cartCount}</span>}
          </button>

          {customer ? (
            <div className="lp-hprofile">
              <button className="lp-hprofile-btn" onClick={() => setDrop(d => !d)}>
                <span className="lp-hprofile-av">{initials(customer.first_name)}</span>
                {customer.first_name}
                <ChevronDown size={14} style={{ opacity: 0.5 }} />
              </button>
              {dropOpen && (
                <div className="lp-hdrop">
                  <button onClick={() => { setDrop(false); openOrders() }}>
                    <ClipboardList size={15} /> {T.orders_btn}
                  </button>
                  <div className="lp-hdrop-sep" />
                  <button className="red" onClick={logout}>
                    <LogOut size={15} /> {T.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="lp-hauth" onClick={() => openAuth('register')}>
              <User size={14} /> {T.auth_btn}
            </button>
          )}
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__slides">
          {SLIDES_IMG.map((src, i) => (
            <div key={i} className={`lp-hero__slide${i === slide ? ' is-active' : ''}`}>
              <img src={src} alt="" className="lp-hero__img" loading={i === 0 ? 'eager' : 'lazy'} />
              <div className="lp-hero__overlay" />
            </div>
          ))}
          <div className="lp-hero__grad" />
        </div>

        <div className="lp-hero__content">
          <div className="lp-hero__text" key={slide}>
            <p className="lp-hero__eyebrow">{T.slides[slide].eye}</p>
            <h1 className="lp-hero__title">
              {T.slides[slide].title}<br />
              <em>{T.slides[slide].accent}</em>
            </h1>
            <p className="lp-hero__sub">{T.slides[slide].sub}</p>
          </div>

          <div className="lp-hero__btns">
            <button className="lp-btn lp-btn--primary" onClick={scrollToMenu}>
              <ShoppingCart size={16} /> {T.order_now}
            </button>
            <button className="lp-btn lp-btn--ghost" onClick={scrollToMenu}>{T.view_menu}</button>
          </div>

          <div className="lp-hero__nav">
            <button className="lp-hero__arrow" onClick={() => goSlide(slide - 1)}>
              <ChevronLeft size={20} />
            </button>
            <div className="lp-hero__dots">
              {[0,1,2,3,4].map(i => (
                <button key={i} className={`lp-hero__dot${i === slide ? ' is-active' : ''}`} onClick={() => goSlide(i)} />
              ))}
            </div>
            <button className="lp-hero__arrow" onClick={() => goSlide(slide + 1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── MENU ────────────────────────────────────────────────────────────── */}
      <div id="menu">
        <div className="lp-section">
          <div className="lp-section__head lp-reveal">
            <p className="lp-section__eye">{T.menu_eye}</p>
            <h2 className="lp-section__title">{T.menu_title}</h2>
            <p className="lp-section__sub">{T.menu_sub}</p>
          </div>

          {/* Category filter */}
          <div className="lp-cats lp-reveal">
            {cats.map(c => (
              <button key={c} className={`lp-cats__btn${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
                {c === 'all' ? T.cat_all : c}
              </button>
            ))}
          </div>

          {/* Grid */}
          {menuLoading ? (
            <div className="lp-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="lp-skel" style={{ height: 300 }} />
              ))}
            </div>
          ) : (
            <div className="lp-grid">
              {filteredMenu.map((item, i) => {
                const qty = cart.find(c => c.id === item.id)?.quantity || 0
                return (
                  <div key={item.id} className="lp-mcard lp-reveal" style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
                    <div className="lp-mcard__imgw">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="lp-mcard__img" loading="lazy" />
                        : <div className="lp-mcard__no-img"><Utensils size={36} color="var(--text3)" /></div>
                      }
                      {qty > 0 && <div className="lp-mcard__badge">×{qty}</div>}
                    </div>
                    <div className="lp-mcard__body">
                      {item.category && <p className="lp-mcard__cat">{item.category}</p>}
                      <p className="lp-mcard__name">{item.name}</p>
                      {item.description && <p className="lp-mcard__desc">{item.description}</p>}
                      <div className="lp-mcard__foot">
                        <span className="lp-mcard__price">{fmt(item.price)}</span>
                        <button
                          className={`lp-mcard__add${qty > 0 ? ' in-cart' : ''}`}
                          onClick={() => addToCart(item)}
                        >
                          {qty > 0
                            ? <><CheckCircle size={14} /> {T.in_cart}</>
                            : <><Plus size={14} /> {T.add}</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <div id="how" style={{ background: 'var(--surface)' }}>
        <div className="lp-section">
          <div className="lp-section__head lp-reveal">
            <p className="lp-section__eye">{T.how_eye}</p>
            <h2 className="lp-section__title">{T.how_title}</h2>
          </div>
          <div className="lp-how">
            {[
              { n: '01', ico: <Search size={22} color="var(--orange)" />,       t: T.how1_ttl, s: T.how1_sub },
              { n: '02', ico: <ClipboardCheck size={22} color="var(--orange)" />, t: T.how2_ttl, s: T.how2_sub },
              { n: '03', ico: <Truck size={22} color="var(--orange)" />,         t: T.how3_ttl, s: T.how3_sub },
            ].map((h, i) => (
              <div key={i} className="lp-how-card lp-reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="lp-how-n">{h.n}</div>
                <div className="lp-how-ico">{h.ico}</div>
                <p className="lp-how-ttl">{h.t}</p>
                <p className="lp-how-sub">{h.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── REVIEWS ──────────────────────────────────────────────────────────── */}
      <div id="reviews">
        <div className="lp-section">
          <div className="lp-section__head lp-reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <p className="lp-section__eye">{T.rv_eye}</p>
              <h2 className="lp-section__title">{T.rv_title}</h2>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="lp-reveal" style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px 0' }}>{T.rv_empty}</p>
          ) : (
            <div className="lp-rv-grid">
              {reviews.map((rv, i) => (
                <div key={rv.id} className="lp-rv-card lp-reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                  <div className="lp-rv-stars">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14}
                        fill={s <= rv.rating ? '#D4A853' : 'none'}
                        color={s <= rv.rating ? '#D4A853' : 'var(--text3)'}
                      />
                    ))}
                  </div>
                  <p className="lp-rv-comment">{rv.comment || '—'}</p>
                  <div className="lp-rv-author">
                    <div className="lp-rv-av">{initials(rv.customer_name)}</div>
                    <div>
                      <p className="lp-rv-name">{rv.customer_name}</p>
                      <p className="lp-rv-date">{fmtDate(rv.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="lp-rv-cta lp-reveal">
            <div className="lp-rv-cta-txt">
              <strong>{T.rv_cta_ttl}</strong>
              <span>{T.rv_cta_sub}</span>
            </div>
            {customer ? (
              <button className="lp-btn lp-btn--primary lp-btn--sm" onClick={() => { setRvOrd(null); setRvO(true) }}>
                <Star size={14} /> {T.rv_btn}
              </button>
            ) : (
              <button className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => openAuth('register')}>
                {T.rv_login_hint}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div>
            <div className="lp-footer__logo">
              <div className="lp-footer__logo-icon"><Utensils size={18} color="#fff" /></div>
              <span className="lp-footer__logo-name">ECO <em>Taomlar</em></span>
            </div>
            <p className="lp-footer__desc">{T.footer_desc}</p>
          </div>
          <div>
            <p className="lp-footer__col-head">{T.footer_pages}</p>
            <div className="lp-footer__links">
              <a href="#menu" onClick={e => { e.preventDefault(); scrollToMenu() }}>{T.nav_menu}</a>
              <a href="#how">{T.nav_about}</a>
              <a href="#reviews">{T.nav_contact}</a>
              <a href="/staff">{T.staff}</a>
            </div>
          </div>
          <div>
            <p className="lp-footer__col-head">{T.footer_contact}</p>
            <div className="lp-footer__links">
              <a href="tel:+998901234567">+998 90 123 45 67</a>
              <a href="mailto:info@ecotaomlar.uz">info@ecotaomlar.uz</a>
              <button onClick={() => openAuth('register')}>{T.auth_btn}</button>
            </div>
          </div>
        </div>
        <div className="lp-footer__bot">
          <span className="lp-footer__copy">© {new Date().getFullYear()} ECO Taomlar. Barcha huquqlar himoyalangan.</span>
          <a href="/staff" className="lp-footer__copy" style={{ color: 'var(--text3)', transition: 'color 0.3s' }}
             onMouseEnter={e => e.target.style.color = 'var(--orange)'}
             onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >{T.staff} →</a>
        </div>
      </footer>

      {/* ════════════════ PANELS ═══════════════════════════════════════════════ */}

      {/* ─── CART DRAWER ─────────────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div className="lp-ov" onClick={() => setCO(false)} />
          <aside className="lp-cart">
            <div className="lp-cart__hd">
              <h3 className="lp-cart__ttl"><ShoppingCart size={18} /> {T.cart_ttl}</h3>
              <button className="lp-close" onClick={() => setCO(false)}><X size={16} /></button>
            </div>
            <div className="lp-cart__body">
              {cart.length === 0 ? (
                <div className="lp-cart__empty">
                  <div className="lp-cart__empty-ico"><ShoppingCart size={48} strokeWidth={1} /></div>
                  <p>{T.cart_empty}</p>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>{T.cart_empty_hint}</p>
                </div>
              ) : (
                <div className="lp-cart__items">
                  {cart.map(item => (
                    <div key={item.id} className="lp-cart__item">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="lp-cart__item-img" />
                        : <div className="lp-cart__item-img" style={{ display:'flex',alignItems:'center',justifyContent:'center' }}><Utensils size={22} color="var(--text3)" /></div>
                      }
                      <div className="lp-cart__item-info">
                        <p className="lp-cart__item-name">{item.name}</p>
                        <p className="lp-cart__item-pr">{fmt(item.price)}</p>
                      </div>
                      <div className="lp-cart__ctrl">
                        <button onClick={() => updateQty(item.id, -1)}><Minus size={13} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, +1)}><Plus size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="lp-cart__ft">
                <div className="lp-cart__tot">
                  <span className="lp-cart__tot-lbl">{T.cart_total}</span>
                  <span className="lp-cart__tot-val">{fmt(cartTotal)}</span>
                </div>
                <button className="lp-cart__go" onClick={() => { setCO(false); openCheckout() }}>
                  {T.cart_btn}
                </button>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ─── AUTH MODAL ───────────────────────────────────────────────────────── */}
      {authOpen && (
        <div className="lp-mwrap" onClick={e => e.target === e.currentTarget && setAO(false)}>
          <div className="lp-m">
            <div className="lp-m__hd">
              <h3 className="lp-m__ttl">{T.auth_ttl}</h3>
              <button className="lp-close" onClick={() => setAO(false)}><X size={16} /></button>
            </div>
            <div className="lp-m__body">
              <div className="lp-tabs">
                <button className={authTab === 'register' ? 'active' : ''} onClick={() => { setATab('register'); setAuthErr('') }}>{T.tab_reg}</button>
                <button className={authTab === 'login'    ? 'active' : ''} onClick={() => { setATab('login');    setAuthErr('') }}>{T.tab_login}</button>
              </div>

              {authTab === 'register' && (
                <div className="lp-fld">
                  <label>{T.fname_lbl}</label>
                  <input placeholder={T.fname_ph} value={authFName} onChange={e => setAuthFName(e.target.value)} autoFocus />
                </div>
              )}
              {authTab === 'register' && (
                <div className="lp-fld">
                  <label>{T.lname_lbl}</label>
                  <input placeholder={T.lname_ph} value={authLName} onChange={e => setAuthLName(e.target.value)} />
                </div>
              )}
              <div className="lp-fld">
                <label>{T.phone_lbl}</label>
                <input type="tel" placeholder={T.phone_ph} value={authPhone} onChange={e => setAuthPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()} />
              </div>

              {authErr && <p className="lp-err">{authErr}</p>}

              <button className="lp-submit" onClick={handleAuth} disabled={authLoading}>
                {authLoading
                  ? <Loader size={16} className="lp-spin" />
                  : (authTab === 'register' ? T.reg_btn : T.login_btn)
                }
              </button>
              <p className="lp-note">{authTab === 'register' ? T.reg_note : T.login_note}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHECKOUT MODAL ───────────────────────────────────────────────────── */}
      {checkoutOpen && (
        <div className="lp-mwrap" onClick={e => e.target === e.currentTarget && !placing && setCkO(false)}>
          <div className="lp-m lp-m--wide">
            <div className="lp-m__hd">
              <h3 className="lp-m__ttl">{T.co_ttl}</h3>
              {!placing && <button className="lp-close" onClick={() => setCkO(false)}><X size={16} /></button>}
            </div>
            <div className="lp-m__body">
              {checkoutDone ? (
                <div className="lp-co-ok">
                  <div className="lp-co-ok-icon"><CheckCircle size={56} color="var(--orange)" strokeWidth={1.5} /></div>
                  <p className="lp-co-ok-ttl">{T.co_ok_ttl}</p>
                  <p className="lp-co-ok-sub">{T.co_ok_sub}</p>
                  <button className="lp-btn lp-btn--primary" style={{ marginTop: 20, width: '100%' }}
                    onClick={() => { setCkO(false); openOrders() }}>
                    <ClipboardList size={16} /> {T.orders_btn}
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart summary */}
                  <div className="lp-co-items">
                    {cart.map(c => (
                      <div key={c.id} className="lp-co-item">
                        <span>{c.name} × {c.quantity}</span>
                        <span>{fmt(c.price * c.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery toggle */}
                  <div className="lp-dtoggle">
                    <button className={delivType === 'pickup' ? 'active' : ''} onClick={() => setDT('pickup')}>
                      <Package size={15} /> {T.pickup}
                    </button>
                    <button className={delivType === 'delivery' ? 'active' : ''} onClick={() => setDT('delivery')}>
                      <Truck size={15} /> {T.delivery}
                    </button>
                  </div>

                  {delivType === 'delivery' && (
                    <div className="lp-fld">
                      <label>{T.addr_lbl}</label>
                      <input placeholder={T.addr_ph} value={addrVal} onChange={e => setAddr(e.target.value)} />
                    </div>
                  )}

                  <div className="lp-fld">
                    <label>{T.note_lbl}</label>
                    <input placeholder={T.note_ph} value={noteVal} onChange={e => setNote(e.target.value)} />
                  </div>

                  {/* Promo */}
                  <div className="lp-promo">
                    <input placeholder={T.promo_ph} value={promoVal} onChange={e => { setPromoVal(e.target.value); setPromoR(null); setPromoE('') }} />
                    <button onClick={checkPromo} disabled={promoChecking}>{promoChecking ? '...' : T.promo_btn}</button>
                  </div>
                  {promoRes && <p className="lp-promo-ok"><CheckCircle size={13} /> {promoRes.message || 'Promokod qo\'llandi'}</p>}
                  {promoErr && <p className="lp-promo-err"><X size={13} /> {promoErr}</p>}

                  {/* Total */}
                  <div className="lp-co-total">
                    <span>{T.total}</span>
                    <span>
                      {promoRes && <span className="strike">{fmt(cartTotal)}</span>}
                      {fmt(finalTotal())}
                    </span>
                  </div>

                  <button className="lp-submit" onClick={placeOrder} disabled={placing}>
                    {placing
                      ? <><Loader size={16} className="lp-spin" /> {T.placing}</>
                      : <><Send size={15} /> {T.place_order}</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MY ORDERS PANEL ──────────────────────────────────────────────────── */}
      {ordersOpen && (
        <>
          <div className="lp-ov" onClick={() => setOO(false)} />
          <aside className="lp-orders">
            <div className="lp-orders__hd">
              <h3 className="lp-orders__ttl"><ClipboardList size={18} /> {T.orders_ttl}</h3>
              <button className="lp-close" onClick={() => setOO(false)}><X size={16} /></button>
            </div>
            <div className="lp-orders__body">
              {myOrders.length === 0 ? (
                <div className="lp-orders__empty">
                  <div className="lp-orders__empty-ico"><ClipboardList size={48} strokeWidth={1} /></div>
                  <p>{T.orders_empty}</p>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>{T.orders_empty_hint}</p>
                </div>
              ) : myOrders.map(order => {
                const stepIdx = STATUS_STEPS.indexOf(order.status)
                const isCancelled = order.status === 'rejected' || order.status === 'cancelled'
                const canCancel   = order.status === 'pending'
                const canReview   = order.status === 'served' && !reviewedCodes.has(order.order_code)
                return (
                  <div key={order.id} className={`lp-ocard${flashId === order.id ? ' lp-ocard--flash' : ''}`}>
                    <div className="lp-ocard__top">
                      <span className="lp-ocard__code">#{order.order_code}</span>
                      <span className={`lp-ocard__st lp-ocard__st--${order.status}`}>
                        {T[STATUS_KEY[order.status]] || order.status}
                      </span>
                    </div>
                    <div className="lp-ocard__items">
                      {(order.items || []).map((it, j) => (
                        <span key={j}>{it.item_name || it.name || `#${it.menu_item_id}`}{it.quantity > 1 ? ` ×${it.quantity}` : ''}{j < (order.items.length - 1) ? ', ' : ''}</span>
                      ))}
                    </div>
                    {!isCancelled && (
                      <div className="lp-sbar">
                        <div className="lp-sbar__steps">
                          {STATUS_STEPS.map((step, si) => (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                              <div className={`lp-sstep${si === stepIdx ? ' lp-sstep--active' : ''}${si < stepIdx ? ' lp-sstep--done' : ''}`}>
                                <div className="lp-sstep__dot" />
                                <span className="lp-sstep__lbl">{T[STATUS_KEY[step]]}</span>
                              </div>
                              {si < STATUS_STEPS.length - 1 && (
                                <div className={`lp-sconn${si < stepIdx ? ' lp-sconn--done' : ''}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="lp-ocard__foot">
                      <span className="lp-ocard__total">{fmt(order.final_price || order.total_price || 0)}</span>
                      {canCancel && (
                        <button className="lp-ocard__cancel" onClick={() => cancelOrder(order.order_code)}>
                          <X size={12} /> {T.cancel_btn}
                        </button>
                      )}
                      {canReview && (
                        <button className="lp-ocard__review" onClick={() => { setRvOrd(order); setRvO(true) }}>
                          <Star size={12} /> {T.rv_btn}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </>
      )}

      {/* ─── REVIEW MODAL ─────────────────────────────────────────────────────── */}
      {reviewOpen && (
        <div className="lp-mwrap" onClick={e => e.target === e.currentTarget && setRvO(false)}>
          <div className="lp-m">
            <div className="lp-m__hd">
              <h3 className="lp-m__ttl">{T.rv_modal_ttl}</h3>
              <button className="lp-close" onClick={() => setRvO(false)}><X size={16} /></button>
            </div>
            <div className="lp-m__body">
              {reviewOrder && (
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                  {T.rv_modal_sub} <strong style={{ color: 'var(--text)' }}>#{reviewOrder.order_code}</strong>
                </p>
              )}
              {!reviewOrder && (
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{T.rv_cta_sub}</p>
              )}
              {/* Stars */}
              <div className="lp-stars">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRvR(s)}>
                    <Star size={28} fill={s <= rvRating ? '#D4A853' : 'none'} color={s <= rvRating ? '#D4A853' : 'var(--text3)'} />
                  </button>
                ))}
              </div>
              <div className="lp-fld">
                <label>{T.rv_comment_lbl}</label>
                <textarea placeholder={T.rv_comment_ph} value={rvComment} onChange={e => setRvC(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="lp-btn lp-btn--ghost lp-btn--sm" style={{ flex: 1 }} onClick={() => setRvO(false)}>
                  {T.rv_skip}
                </button>
                <button className="lp-submit" style={{ flex: 2, marginTop: 0 }} onClick={submitReview} disabled={!rvRating || rvSending}>
                  {rvSending
                    ? <Loader size={16} className="lp-spin" />
                    : <><Star size={14} /> {T.rv_submit}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOASTS ───────────────────────────────────────────────────────────── */}
      <div className="lp-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`lp-toast lp-toast--${t.type}${t.exiting ? ' lp-toast--out' : ''}`}>
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  )
}
