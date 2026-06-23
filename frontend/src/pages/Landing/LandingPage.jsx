import { useState, useEffect, useRef, useCallback } from 'react'
import { menuAPI, ordersAPI, customerAPI } from '../../api'
import {
  ShoppingCart, X, Plus, Minus, ChevronLeft, ChevronRight,
  User, LogOut, ClipboardList, Star, Truck, Package,
  Search, ClipboardCheck, Rocket, MapPin, Phone, Utensils,
  CheckCircle, Loader, ChevronDown, Send, Moon, Sun, Menu,
  Clock, Map as MapIcon,
} from 'lucide-react'
import FullscreenMap from '../../components/FullscreenMap'
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
  getMine: () => {
    const token = localStorage.getItem('eco_customer_token')
    return fetch('/api/customer/reviews', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
  },
  deleteMine: (id) => {
    const token = localStorage.getItem('eco_customer_token')
    return fetch(`/api/customer/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
  },
}

/* ─── Translations ────────────────────────────────────────────────────────────── */
const LANG = {
  uz: {
    nav_menu: 'Menyu', nav_about: 'Haqimizda', nav_contact: 'Aloqa', nav_reviews: 'Sharhlar',
    auth_btn: "Kirish / Ro'yxat", orders_btn: 'Buyurtmalarim', logout: 'Chiqish',
    slides: [
      { eye: "O'ZBEK MILLIY TAOMI",  title: "Yoqimli",        accent: "O'zbek Oshi", sub: "Qo'zichoq go'shti, ziravorlar va yangi guruchdan tayyorlangan an'anaviy plov. Har bir qoshiq — milliy meros." },
      { eye: "TENDER VA SHIRINLIK",  title: "Nozik va Mazali", accent: "Manti",       sub: "Yupqa xamirga o'ralgan, bug'da pishirilgan mol go'shtli manti. Bir tekis va to'yimli." },
      { eye: "ISSIQ VA TO'YIMLI",    title: "Badanga Shifo",   accent: "Sho'rva",     sub: "Qo'y go'shtidan sekin pishirilgan, ko'katlar va sabzavotlar bilan boyitilgan milliy sho'rva." },
      { eye: "TANDIRDA PISHIRILGAN", title: "Qaynoq va Yangi", accent: "Samsa",       sub: "Tandir issiqligida oltin rangga pishirilgan, go'sht yoki sabzavot to'ldirmalari bilan samsa." },
      { eye: "QO'LDA TAYYORLANGAN",  title: "Uy Ta'midi",      accent: "Lagman",      sub: "Yangi qo'lda yoylgan xamir, go'sht va rang-barang sabzavotlar bilan tayyorlangan issiq lagman." },
    ],
    hero_tag: '🔥 ISSIQ VA YANGI',
    hero_title: "O'zbek Milliy Taomlarining Eng Sara Ta'mi",
    hero_sub: "Har kuni yangi tayyorlangan, milliy retseptlar asosida taomlar. Tez yetkazish va mazali ta'm kafolatlangan.",
    order_now: 'Hozir buyurtma bering', view_menu: "Menyuni ko'rish",
    menu_eye: 'BIZNING MENYU', menu_title: 'Sevimli Taomlaringiz', menu_sub: 'Har kuni yangi tayyorlangan, milliy retseptlar asosida',
    cat_all: 'Barchasi',
    cat_title: "Kategoriyalarni Ko'ring",
    add: "Qo'shish", in_cart: 'Savatda',
    how_eye: 'QANDAY ISHLAYDI', how_title: 'Uchta oddiy qadam',
    how1_ttl: 'Tanlang', how1_sub: "Menyudan sevimli taomingizni savatga qo'shing",
    how2_ttl: 'Buyurtma bering', how2_sub: "Manzil va to'lov usulini kiriting, tasdiqlang",
    how3_ttl: 'Oling', how3_sub: "45 daqiqada issiq holda eshigingizga yetkazamiz",
    rv_eye: 'MIJOZLAR SHARHLARI', rv_title: "Mehmonlarimiz nima deyishadi",
    rv_cta_ttl: 'Buyurtmangizdan mamnunmisiz?', rv_cta_sub: "Fikringizni qoldiring — boshqalarga yordam bo'ladi",
    rv_btn: 'Fikr qoldirish', rv_login_hint: 'Fikr qoldirish uchun avval kiring',
    rv_empty: "Hali fikrlar yo'q. Birinchi bo'lib fikr qoldiring!",
    footer_desc: "O'zbek milliy oshxonasining eng sara ta'mi. Har kuni yangi, har kuni mazali.",
    footer_pages: 'Sahifalar', footer_contact: 'Aloqa',
    my_reviews: 'Mening sharhlarim', rv_delete: "O'chirish", rv_no_reviews: "Siz hali sharh qoldirmagansingiz",
    rv_load_more: "Ko'proq ko'rsatish", rv_all_shown: "Barcha sharhlar ko'rsatildi",
    staff: 'Xodimlar paneli', privacy: 'Maxfiylik', terms: 'Shartlar',
    cart_ttl: 'Savat', cart_empty: "Savat bo'sh", cart_empty_hint: "Menyudan taom qo'shing",
    cart_total: 'Jami', cart_btn: 'Buyurtma berish',
    tab_cart: 'Savat', tab_orders: 'Buyurtmalarim', tab_history: 'Tarix',
    auth_ttl: 'Xush kelibsiz', tab_reg: "Ro'yxat", tab_login: 'Kirish',
    fname_lbl: 'Ism *', fname_ph: 'Ismingiz',
    lname_lbl: 'Familiya', lname_ph: 'Familiyangiz (ixtiyoriy)',
    phone_lbl: 'Telefon raqami *', phone_ph: '90 123 45 67',
    pass_lbl: 'Parol *', pass_ph: 'Parolingiz',
    reg_btn: "Ro'yxatdan o'tish", login_btn: 'Kirish',
    reg_note: "Telefon va parol kiritish majburiy. Minimal 4 ta belgi.",
    login_note: "Telefon raqami va parolingizni kiriting.",
    co_ttl: 'Buyurtmani rasmiylashtirish',
    delivery: 'Yetkazish', pickup: 'Olib ketish',
    addr_lbl: 'Yetkazish manzili *', addr_ph: "Ko'cha, uy, xonadon...",
    note_lbl: 'Izoh', note_ph: 'Oshpazga xabar (ixtiyoriy)',
    promo_ph: 'Promokod', promo_btn: "Qo'llash",
    total: 'Jami', discount: 'Chegirma',
    place_order: 'Buyurtma berish', placing: 'Yuborilmoqda...',
    co_ok_ttl: 'Buyurtma qabul qilindi!', co_ok_sub: "Buyurtmangiz tayyorlanmoqda. Holati \"Buyurtmalarim\"da ko'rinadi.",
    del_time_delivery: '~30-45 daqiqada yetkaziladi',
    del_time_pickup:   '~15-20 daqiqada tayyor bo\'ladi',
    del_est: 'Taxminiy vaqt',
    orders_ttl: 'Mening buyurtmalarim', orders_empty: "Hali buyurtma yo'q",
    orders_empty_hint: 'Birinchi buyurtmangizni qiling!',
    st_pending: 'Qabul qilindi', st_cooking: 'Tayyorlanmoqda', st_ready: 'Tayyor',
    st_on_way: "Yo'lda", st_served: 'Yetkazildi', st_rejected: 'Bekor qilindi', st_cancelled: 'Bekor qilindi',
    cancel_btn: 'Bekor qilish',
    rv_modal_ttl: 'Fikr qoldiring', rv_modal_sub: 'Buyurtmangiz yetkazildi. Qanday bo\'ldi?',
    rv_comment_lbl: 'Izoh (ixtiyoriy)', rv_comment_ph: 'Taom haqida fikringiz...',
    rv_submit: 'Yuborish', rv_skip: 'Keyinroq',
    rv_thanks: 'Fikringiz uchun rahmat!',
    err_fill: "Maydonlarni to'ldiring", err_phone: 'Telefon raqamini kiriting',
    err_addr: 'Yetkazish manzilini kiriting',
    ok_order: 'Buyurtma qabul qilindi!',
    ok_cancelled: 'Buyurtma bekor qilindi',
    err_cancel: 'Bekor qilishda xatolik',
    delivered_notif: 'Buyurtmangiz yetkazildi!',
    off1_ttl: "Birinchi buyurtmaga 20% chegirma",
    off1_sub: "FIRST20 promokodini ishlating",
    off2_ttl: "50 000 so'mdan bepul yetkazish",
    off2_sub: "Minimum buyurtma miqdori 50 000 so'm",
    off3_ttl: "Har 5 ta buyurtmaga bonus",
    off3_sub: "Sodiqlik dasturimizga qo'shiling",
  },
  ru: {
    nav_menu: 'Меню', nav_about: 'О нас', nav_contact: 'Контакты', nav_reviews: 'Отзывы',
    auth_btn: 'Войти / Регистрация', orders_btn: 'Мои заказы', logout: 'Выйти',
    slides: [
      { eye: 'УЗБЕКСКАЯ КУХНЯ',   title: 'Настоящий',       accent: 'Узбекский Плов', sub: 'Традиционный плов из баранины, приправ и свежего риса. Каждая ложка — частица национального наследия.' },
      { eye: 'НЕЖНОЕ И ВКУСНОЕ',  title: 'Нежное и Сытное', accent: 'Манты',          sub: 'Тонкое тесто с мясной начинкой, приготовленное на пару. Сочно и питательно.' },
      { eye: 'ГОРЯЧЕЕ И СЫТНОЕ',  title: 'Целебный',        accent: 'Шурпа',          sub: 'Медленно приготовленная шурпа из баранины, обогащённая зеленью и овощами.' },
      { eye: 'ИЗ ТАНДИРА',        title: 'Горячее и Свежее', accent: 'Самса',         sub: 'Самса, запечённая в тандире до золотистой корочки, с мясом или овощами.' },
      { eye: 'РУЧНАЯ РАБОТА',     title: 'Домашний вкус',   accent: 'Лагман',         sub: 'Лапша ручного приготовления с мясом и овощами. Горячий и ароматный.' },
    ],
    hero_tag: '🔥 ГОРЯЧЕЕ И СВЕЖЕЕ',
    hero_title: 'Лучшие Блюда Узбекской Национальной Кухни',
    hero_sub: 'Каждый день свежее, по национальным рецептам. Быстрая доставка и гарантированный вкус.',
    order_now: 'Заказать сейчас', view_menu: 'Смотреть меню',
    menu_eye: 'НАШЕ МЕНЮ', menu_title: 'Ваши любимые блюда', menu_sub: 'Каждый день свежее, по национальным рецептам',
    cat_all: 'Все',
    cat_title: 'Изучите Наши Категории',
    add: 'Добавить', in_cart: 'В корзине',
    how_eye: 'КАК ЭТО РАБОТАЕТ', how_title: 'Три простых шага',
    how1_ttl: 'Выберите', how1_sub: 'Добавьте любимые блюда из меню в корзину',
    how2_ttl: 'Оформите', how2_sub: 'Введите адрес и подтвердите заказ',
    how3_ttl: 'Получите', how3_sub: 'Доставим горячим к вашей двери за 45 минут',
    rv_eye: 'ОТЗЫВЫ ГОСТЕЙ', rv_title: 'Что говорят наши гости',
    rv_cta_ttl: 'Довольны заказом?', rv_cta_sub: 'Оставьте отзыв — помогите другим',
    rv_btn: 'Оставить отзыв', rv_login_hint: 'Войдите, чтобы оставить отзыв',
    rv_empty: 'Пока отзывов нет. Будьте первым!',
    footer_desc: 'Лучшие вкусы узбекской национальной кухни. Каждый день свежее.',
    footer_pages: 'Страницы', footer_contact: 'Контакты',
    my_reviews: 'Мои отзывы', rv_delete: 'Удалить', rv_no_reviews: 'Вы ещё не оставляли отзывов',
    rv_load_more: 'Показать ещё', rv_all_shown: 'Все отзывы показаны',
    staff: 'Панель сотрудников', privacy: 'Конфиденциальность', terms: 'Условия',
    cart_ttl: 'Корзина', cart_empty: 'Корзина пуста', cart_empty_hint: 'Добавьте блюда из меню',
    cart_total: 'Итого', cart_btn: 'Оформить заказ',
    tab_cart: 'Корзина', tab_orders: 'Мои заказы', tab_history: 'История',
    auth_ttl: 'Добро пожаловать', tab_reg: 'Регистрация', tab_login: 'Войти',
    fname_lbl: 'Имя *', fname_ph: 'Ваше имя',
    lname_lbl: 'Фамилия', lname_ph: 'Ваша фамилия (необязательно)',
    phone_lbl: 'Номер телефона *', phone_ph: '90 123 45 67',
    pass_lbl: 'Пароль *', pass_ph: 'Ваш пароль',
    reg_btn: 'Зарегистрироваться', login_btn: 'Войти',
    reg_note: 'Телефон и пароль обязательны. Минимум 4 символа.',
    login_note: 'Введите номер телефона и пароль.',
    co_ttl: 'Оформление заказа',
    delivery: 'Доставка', pickup: 'Самовывоз',
    addr_lbl: 'Адрес доставки *', addr_ph: 'Улица, дом, квартира...',
    note_lbl: 'Комментарий', note_ph: 'Пожелания повару (необязательно)',
    promo_ph: 'Промокод', promo_btn: 'Применить',
    total: 'Итого', discount: 'Скидка',
    place_order: 'Оформить заказ', placing: 'Отправка...',
    co_ok_ttl: 'Заказ принят!', co_ok_sub: 'Ваш заказ готовится. Статус виден в «Мои заказы».',
    del_time_delivery: '~30-45 минут до доставки',
    del_time_pickup:   '~15-20 минут до готовности',
    del_est: 'Примерное время',
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
    off1_ttl: 'Скидка 20% на первый заказ',
    off1_sub: 'Используйте промокод FIRST20',
    off2_ttl: 'Бесплатная доставка от 50 000 сум',
    off2_sub: 'Минимальная сумма заказа 50 000 сум',
    off3_ttl: 'Бонус за каждые 5 заказов',
    off3_sub: 'Присоединяйтесь к программе лояльности',
  },
}

/* ─── Slide images ───────────────────────────────────────────────────────────── */
const SLIDES_IMG = [
  '/images/plov.jpg',
  '/images/manti.jpg',
  '/images/shorva.jpg',
  '/images/samsa.jpg',
  '/images/lagman.jpg',
]

/* ─── Category image & color config ─────────────────────────────────────────── */
const CAT_CFG = {
  "Asosiy taomlar": { img: '/images/plov.jpg',   color: '#FF6B35' },
  "Sho'rvalar":     { img: '/images/shorva.jpg',  color: '#f59e0b' },
  "Mantí":          { img: '/images/manti.jpg',   color: '#8b5cf6' },
  "Samsalar":       { img: '/images/samsa.jpg',   color: '#e85a24' },
  "Lagmon":         { img: '/images/lagman.jpg',  color: '#10b981' },
}
const catImg   = name => CAT_CFG[name]?.img   || null
const catColor = name => CAT_CFG[name]?.color || '#FF6B35'

/* ─── Status config ──────────────────────────────────────────────────────────── */
const STATUS_STEPS = ['pending', 'cooking', 'ready', 'on_way', 'served']
const STATUS_KEY   = { pending: 'st_pending', cooking: 'st_cooking', ready: 'st_ready', on_way: 'st_on_way', served: 'st_served', rejected: 'st_rejected', cancelled: 'st_cancelled' }

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const fmt = n => Math.round(n).toLocaleString('uz-UZ') + " so'm"

const fmtDate = iso => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  return `${dd}.${mm}.${yy}`
}
const initials = name => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

let toastId = 0

/* ═══════════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  // ── Core
  const [lang, setLang] = useState(() => localStorage.getItem('eco_lang') || 'uz')
  const T = LANG[lang]

  // ── Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('eco_dark') === 'true')

  // ── Hero
  const [slide, setSlide] = useState(0)
  const slideTimer = useRef(null)

  // ── Menu
  const [menu, setMenu]       = useState([])
  const [menuLoading, setML]  = useState(true)
  const [cat, setCat]         = useState('all')

  // ── Cart
  const [cart, setCart]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('eco_lp_cart') || '[]') } catch { return [] }
  })
  const [cartOpen, setCO]     = useState(false)
  const [cartTab, setCartTab] = useState('cart')

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
  const [delivLat, setDLat]    = useState(null)
  const [delivLng, setDLng]    = useState(null)
  const [restSettings, setRS]  = useState({ pickup_lat: 40.808673, pickup_lng: 72.327401, pickup_address: '' })
  const [mapOpen, setMapOpen]  = useState(false)
  const [mapMode, setMapMode]  = useState('delivery')
  const [noteVal, setNote]     = useState('')
  const [promoVal, setPromo]   = useState('')
  const [promoRes, setPromoR]  = useState(null)
  const [promoErr, setPromoE]  = useState('')
  const [promoChecking, setPCk] = useState(false)
  const [lastOrderCode, setLastOC] = useState('')

  // ── Reviews
  const [reviews, setRvs]      = useState([])
  const [reviewOpen, setRvO]   = useState(false)
  const [reviewOrder, setRvOrd] = useState(null)
  const [rvRating, setRvR]     = useState(0)
  const [rvComment, setRvC]    = useState('')
  const [rvSending, setRvS]    = useState(false)
  const [reviewedCodes, setRC] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('eco_reviewed_codes') || '[]')) } catch { return new Set() }
  })
  const [rvVisible, setRvVisible] = useState(10)
  // ── My Reviews panel
  const [myReviewsOpen, setMRO]  = useState(false)
  const [myReviews, setMRvs]     = useState([])
  const [myRvLoading, setMRL]    = useState(false)
  const [deletingRvId, setDelRv] = useState(null)

  // ── Header scroll
  const [scrolled, setScrolled] = useState(false)

  // ── Mobile menu
  const [mobileMenuOpen, setMobileMenu] = useState(false)

  // ── Toast queue
  const [toasts, setToasts]    = useState([])

  // ── WS
  const wsRef       = useRef(null)
  const reconnRef   = useRef(null)

  // ─── Dark mode effect ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('eco_dark', darkMode)
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // ─── Cart persistence ─────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('eco_lp_cart', JSON.stringify(cart))
  }, [cart])

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
    // Sync theme to html element on mount
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')

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

    // Restaurant settings (pickup location)
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.pickup_lat) setRS({
        pickup_lat: parseFloat(s.pickup_lat),
        pickup_lng: parseFloat(s.pickup_lng),
        pickup_address: s.pickup_address || '',
      })
    }).catch(() => {})

    // Preload hero images
    SLIDES_IMG.forEach(src => { const img = new Image(); img.src = src })

    // Check for pending review (persisted after delivery)
    const pendingReview = localStorage.getItem('eco_pending_review')
    if (pendingReview && raw) {
      try {
        const ord = JSON.parse(pendingReview)
        // Show review modal after a short delay so page loads first
        setTimeout(() => { setRvOrd(ord); setRvO(true) }, 1500)
      } catch {}
    }
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
                  // Persist pending review so it survives page refresh
                  localStorage.setItem('eco_pending_review', JSON.stringify(ord))
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
  const [authPhone, setAuthPhone]       = useState('')
  const [authFName, setAuthFName]       = useState('')
  const [authLName, setAuthLName]       = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authErr, setAuthErr]           = useState('')
  const [authLoading, setAuthL]         = useState(false)

  const openAuth = (tab = 'register') => {
    setATab(tab); setAuthErr(''); setAuthPhone(''); setAuthPassword(''); setAO(true)
  }

  const handleAuth = async () => {
    const fullPhone = '+998' + authPhone.replace(/\D/g, '')
    if (authPhone.replace(/\D/g, '').length !== 9) { setAuthErr(T.err_phone); return }
    if (!authPassword || authPassword.length < 4) { setAuthErr(T.err_fill); return }
    if (authTab === 'register' && !authFName.trim()) { setAuthErr(T.err_fill); return }
    setAuthL(true); setAuthErr('')
    try {
      let res
      if (authTab === 'register') {
        res = await customerAPI.register({ phone: fullPhone, first_name: authFName, last_name: authLName, password: authPassword })
      } else {
        res = await customerAPI.login({ phone: fullPhone, password: authPassword })
      }
      const { token, customer } = res.data || {}
      if (!token) { setAuthErr(res.data?.error || 'Xatolik'); return }
      localStorage.setItem('eco_customer_token', token)
      localStorage.setItem('eco_customer_data', JSON.stringify(customer))
      setCust(customer)
      setAO(false)
      showToast(`Xush kelibsiz, ${customer?.first_name || ''}!`, 'success')
      // Auto-open checkout if cart has items
      if (cart.length > 0) {
        setCkD(false); setPromoR(null); setPromoE(''); setPromo('')
        setCkO(true)
      }
    } catch { setAuthErr('Serverda xatolik') }
    finally { setAuthL(false) }
  }

  const logout = () => {
    localStorage.removeItem('eco_customer_token')
    localStorage.removeItem('eco_customer_data')
    setCust(null); setDrop(false); setMO([])
  }

  // ─── My orders ───────────────────────────────────────────────────────────────
  const openOrders = (tab = 'orders') => {
    setCartTab(tab)
    setCO(true)
  }

  // Load orders when cart opens and customer is logged in
  useEffect(() => {
    if (cartOpen && customer) {
      customerAPI.orders().then(res => setMO(res.data || [])).catch(() => {})
    }
  }, [cartOpen, customer])

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
    setCkD(false); setPromoR(null); setPromoE(''); setPromo('')
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
      if (!res.ok) { setPromoE(d.error || "Noto'g'ri promokod"); return }
      setPromoR(d)
    } catch { setPromoE('Xatolik') }
    finally { setPCk(false) }
  }

  const finalTotal = () => {
    if (!promoRes) return cartTotal
    return promoRes.final_price || Math.max(0, cartTotal - (promoRes.discount_value || 0))
  }

  const placeOrder = async () => {
    if (delivType === 'delivery' && !addrVal.trim()) { showToast(T.err_addr, 'error'); return }
    setPlacing(true)
    try {
      const payload = {
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity })),
        delivery_type: delivType,
        delivery_address: delivType === 'delivery' ? addrVal : '',
        delivery_lat: delivType === 'delivery' ? delivLat : null,
        delivery_lng: delivType === 'delivery' ? delivLng : null,
        note: noteVal,
        customer_first_name: customer?.first_name || '',
        customer_last_name:  customer?.last_name  || '',
        customer_phone:      customer?.phone       || '',
        card_code:           promoRes ? promoVal : '',
      }
      const res = await ordersAPI.create(payload)
      if (!res.data?.id) throw new Error()
      setLastOC(res.data.order_code || '')
      setCkD(true)
      setCart([])
      localStorage.removeItem('eco_lp_cart')
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
      setRC(prev => {
        const next = new Set([...prev, reviewOrder.order_code])
        localStorage.setItem('eco_reviewed_codes', JSON.stringify([...next]))
        return next
      })
      localStorage.removeItem('eco_pending_review')
      setRvO(false); setRvR(0); setRvC('')
      // Keep max 30 in display, newest first
      setRvs(prev => [res.data, ...prev].slice(0, 30))
      setRvVisible(v => Math.min(v + 1, 30))
    } else {
      showToast(res.data?.error || 'Xatolik', 'error')
    }
  }

  // ─── My Reviews ──────────────────────────────────────────────────────────────
  const openMyReviews = async () => {
    setMRO(true)
    setMRL(true)
    try {
      const data = await reviewsAPI.getMine()
      setMRvs(Array.isArray(data) ? data : [])
    } catch { setMRvs([]) }
    finally { setMRL(false) }
  }

  const deleteMyReview = async (id, orderCode) => {
    setDelRv(id)
    try {
      await reviewsAPI.deleteMine(id)
      setMRvs(prev => prev.filter(r => r.id !== id))
      // Remove from public reviews list too
      setRvs(prev => prev.filter(r => r.id !== id))
      // Remove from reviewed codes if we have the order code
      if (orderCode) {
        setRC(prev => {
          const next = new Set(prev)
          next.delete(orderCode)
          localStorage.setItem('eco_reviewed_codes', JSON.stringify([...next]))
          return next
        })
      }
      showToast(lang === 'uz' ? "Sharh o'chirildi" : 'Отзыв удалён', 'info')
    } catch { showToast('Xatolik', 'error') }
    finally { setDelRv(null) }
  }

  // ─── Category list ────────────────────────────────────────────────────────────
  const cats = ['all', ...new Set(menu.map(m => m.category).filter(Boolean))]
  const filteredMenu = cat === 'all' ? menu : menu.filter(m => m.category === cat)

  // ─── Scroll helpers ───────────────────────────────────────────────────────────
  const scrollToMenu = () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })

  // ─── Offers ───────────────────────────────────────────────────────────────────
  const OFFERS = [
    { emoji: '🎁', title: T.off1_ttl, sub: T.off1_sub, color: 'linear-gradient(135deg, #FF6B35, #e85a24)' },
    { emoji: '🚚', title: T.off2_ttl, sub: T.off2_sub, color: 'linear-gradient(135deg, #10b981, #059669)' },
    { emoji: '⭐', title: T.off3_ttl, sub: T.off3_sub, color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  ]

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="lp-root" data-theme={darkMode ? 'dark' : 'light'}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <a className="lp-logo" href="/">
            <div className="lp-logo-icon"><Utensils size={18} color="#fff" /></div>
            <span className="lp-logo-name">ECO <em>Taomlar</em></span>
          </a>

          <nav className={`lp-nav${mobileMenuOpen ? ' lp-nav--open' : ''}`}>
            <a href="#menu" onClick={e => { e.preventDefault(); scrollToMenu(); setMobileMenu(false) }}>{T.nav_menu}</a>
            <a href="#how" onClick={e => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false) }}>{T.nav_about}</a>
            <a href="#reviews" onClick={e => { e.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false) }}>{T.nav_reviews}</a>
          </nav>

          <div className="lp-header-right">
            {/* Dark mode toggle — shown only when NOT logged in */}
            {!customer && (
              <button className="lp-icon-btn" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Cart */}
            <button className="lp-icon-btn lp-cart-btn" onClick={() => setCO(true)}>
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="lp-cart-badge">{cartCount}</span>}
            </button>

            {/* Auth / Profile */}
            {customer ? (
              <div className="lp-profile">
                <button className="lp-profile-btn" onClick={() => setDrop(d => !d)}>
                  <span className="lp-profile-av">{initials(customer.first_name)}</span>
                  <span className="lp-profile-name">{customer.first_name}</span>
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>
                {dropOpen && (
                  <div className="lp-drop">
                    <button onClick={() => { setDrop(false); openOrders() }}>
                      <ClipboardList size={15} /> {T.orders_btn}
                    </button>
                    <button onClick={() => { setDrop(false); openMyReviews() }}>
                      <Star size={15} /> {T.my_reviews}
                    </button>
                    <div className="lp-drop-sep" />
                    {/* Theme switcher — Day / Night */}
                    <div className="lp-drop-theme">
                      <button className={!darkMode ? 'active' : ''} onClick={() => setDarkMode(false)}>
                        <Sun size={12} /> {lang === 'uz' ? 'Kun' : 'День'}
                      </button>
                      <button className={darkMode ? 'active' : ''} onClick={() => setDarkMode(true)}>
                        <Moon size={12} /> {lang === 'uz' ? 'Tun' : 'Ночь'}
                      </button>
                    </div>
                    <div className="lp-drop-sep" />
                    {/* Language inside profile */}
                    <div className="lp-drop-lang">
                      <button className={lang === 'uz' ? 'active' : ''} onClick={() => changeLang('uz')}>UZ</button>
                      <button className={lang === 'ru' ? 'active' : ''} onClick={() => changeLang('ru')}>RU</button>
                    </div>
                    <div className="lp-drop-sep" />
                    <button className="danger" onClick={logout}>
                      <LogOut size={15} /> {T.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="lp-auth-group">
                <div className="lp-lang-mini">
                  <button className={lang === 'uz' ? 'active' : ''} onClick={() => changeLang('uz')}>UZ</button>
                  <button className={lang === 'ru' ? 'active' : ''} onClick={() => changeLang('ru')}>RU</button>
                </div>
                <button className="lp-auth-btn" onClick={() => openAuth('register')}>
                  <User size={14} /> {T.auth_btn}
                </button>
              </div>
            )}

            {/* Hamburger */}
            <button className="lp-hamburger" onClick={() => setMobileMenu(m => !m)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner container">
          {/* Left: text content */}
          <div className="lp-hero-left">
            <span className="lp-hero-tag">{T.hero_tag}</span>
            <h1 className="lp-hero-title">{T.hero_title}</h1>
            <p className="lp-hero-sub">{T.hero_sub}</p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={() => { setCO(true) }}>
                <ShoppingCart size={16} /> {T.order_now}
              </button>
              <button className="lp-btn-outline" onClick={scrollToMenu}>{T.view_menu}</button>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-hero-stat">
                <Clock size={17} />
                <span>30-45 min</span>
              </div>
              <div className="lp-hero-stat">
                <Truck size={17} />
                <span>Yetkazish</span>
              </div>
              <div className="lp-hero-stat">
                <Star size={17} />
                <span>5.0 reyting</span>
              </div>
            </div>
          </div>

          {/* Right: rotating food image */}
          <div className="lp-hero-right">
            <div className="lp-hero-img-ring">
              {SLIDES_IMG.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="ECO Taomlar"
                  className={`lp-hero-img${i === slide ? ' active' : ''}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
            <div className="lp-hero-dots">
              {SLIDES_IMG.map((_, i) => (
                <button key={i} className={`lp-dot${i === slide ? ' active' : ''}`} onClick={() => goSlide(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ──────────────────────────────────────────────────────── */}
      <section className="lp-categories">
        <div className="container">
          <div className="lp-sec-head lp-reveal">
            <h2 className="lp-sec-title">{T.cat_title}</h2>
          </div>
          <div className="lp-cat-scroll lp-reveal">
            {cats.filter(c => c !== 'all').map(c => (
              <button
                key={c}
                className={`lp-cat-circle${cat === c ? ' active' : ''}`}
                onClick={() => { setCat(c); scrollToMenu() }}
              >
                <div className="lp-cat-circle-img" style={{ borderColor: catColor(c) }}>
                  {catImg(c)
                    ? <img src={catImg(c)} alt={c} />
                    : <div className="lp-cat-circle-fallback" style={{ background: catColor(c) }}>
                        <Utensils size={28} color="rgba(255,255,255,0.85)" />
                      </div>
                  }
                </div>
                <span className="lp-cat-label">{c}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR DISHES / MENU ─────────────────────────────────────────── */}
      <section id="menu" className="lp-menu-section">
        <div className="container">
          <div className="lp-sec-head lp-reveal">
            <p className="lp-sec-eye">{T.menu_eye}</p>
            <h2 className="lp-sec-title">{T.menu_title}</h2>
            <p className="lp-sec-sub">{T.menu_sub}</p>
          </div>

          {/* Category filter pills */}
          <div className="lp-filter-pills lp-reveal">
            {cats.map(c => (
              <button key={c} className={`lp-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
                {c === 'all' ? T.cat_all : c}
              </button>
            ))}
          </div>

          {/* Grid */}
          {menuLoading ? (
            <div className="lp-menu-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="lp-skel" style={{ height: 340 }} />
              ))}
            </div>
          ) : (
            <div className="lp-menu-grid">
              {filteredMenu.map((item, i) => {
                const inCart = cart.some(c => c.id === item.id)
                const qty = cart.find(c => c.id === item.id)?.quantity || 0
                return (
                  <div key={item.id} className="lp-menu-card lp-reveal" style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
                    <div className="lp-mc-img">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} loading="lazy" />
                        : <div className="lp-mc-placeholder" style={{ background: catColor(item.category) }}>
                            <Utensils size={40} color="rgba(255,255,255,0.7)" />
                          </div>
                      }
                      {item.category && <span className="lp-mc-cat">{item.category}</span>}
                      {qty > 0 && <span className="lp-mc-qty-badge">×{qty}</span>}
                    </div>
                    <div className="lp-mc-body">
                      <div className="lp-mc-stars">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} fill="#FF6B35" color="#FF6B35" />
                        ))}
                      </div>
                      <h3 className="lp-mc-name">{item.name}</h3>
                      {item.description && <p className="lp-mc-desc">{item.description}</p>}
                      <div className="lp-mc-footer">
                        <span className="lp-mc-price">{fmt(item.price)}</span>
                        <button
                          className={`lp-mc-add${inCart ? ' active' : ''}`}
                          onClick={() => addToCart(item)}
                        >
                          {inCart ? <CheckCircle size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how" className="lp-how-section">
        <div className="container">
          <div className="lp-sec-head lp-reveal">
            <p className="lp-sec-eye">{T.how_eye}</p>
            <h2 className="lp-sec-title">{T.how_title}</h2>
          </div>
          <div className="lp-how-grid">
            {/* Step 1 – Browse menu & add to cart */}
            <div className="lp-how-card lp-reveal">
              <div className="lp-how-img-wrap lp-how-photo-wrap">
                <img
                  src="/images/01.png"
                  alt="Menyudan tanlash"
                  className="lp-how-photo"
                  loading="lazy"
                />
                <div className="lp-how-photo-overlay" />
                <span className="lp-how-n">01</span>
              </div>
              <div className="lp-how-body">
                <div className="lp-how-ico"><Search size={20} /></div>
                <p className="lp-how-ttl">{T.how1_ttl}</p>
                <p className="lp-how-sub">{T.how1_sub}</p>
              </div>
            </div>

            {/* Step 2 – Enter address & confirm */}
            <div className="lp-how-card lp-reveal" style={{ transitionDelay: '100ms' }}>
              <div className="lp-how-img-wrap lp-how-photo-wrap">
                <img
                  src="/images/02.png"
                  alt="Buyurtma berish"
                  className="lp-how-photo"
                  loading="lazy"
                />
                <div className="lp-how-photo-overlay" />
                <span className="lp-how-n">02</span>
              </div>
              <div className="lp-how-body">
                <div className="lp-how-ico"><ClipboardCheck size={20} /></div>
                <p className="lp-how-ttl">{T.how2_ttl}</p>
                <p className="lp-how-sub">{T.how2_sub}</p>
              </div>
            </div>

            {/* Step 3 – Courier delivery */}
            <div className="lp-how-card lp-reveal" style={{ transitionDelay: '200ms' }}>
              <div className="lp-how-img-wrap lp-how-photo-wrap">
                <img
                  src="/images/03.png"
                  alt="Yetkazib olish"
                  className="lp-how-photo"
                  loading="lazy"
                />
                <div className="lp-how-photo-overlay" />
                <span className="lp-how-n">03</span>
              </div>
              <div className="lp-how-body">
                <div className="lp-how-ico"><Truck size={20} /></div>
                <p className="lp-how-ttl">{T.how3_ttl}</p>
                <p className="lp-how-sub">{T.how3_sub}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ──────────────────────────────────────────────────────────── */}
      <section id="reviews" className="lp-reviews-section">
        <div className="container">
          <div className="lp-sec-head lp-reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <p className="lp-sec-eye">{T.rv_eye}</p>
              <h2 className="lp-sec-title">{T.rv_title}</h2>
            </div>
            {reviews.length > 0 && (
              <div className="lp-rv-summary">
                <span className="lp-rv-avg">{(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}</span>
                <div>
                  <div className="lp-rv-stars" style={{ gap: 2 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= Math.round(reviews.reduce((a,r)=>a+r.rating,0)/reviews.length) ? '#D4A853' : 'none'} color={s <= Math.round(reviews.reduce((a,r)=>a+r.rating,0)/reviews.length) ? '#D4A853' : 'var(--text3)'} />)}
                  </div>
                  <p className="lp-rv-count">{reviews.length} {lang === 'uz' ? 'ta sharh' : 'отзывов'}</p>
                </div>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="lp-reveal lp-empty-msg">{T.rv_empty}</p>
          ) : (
            <>
              <div className="lp-rv-grid">
                {reviews.slice(0, rvVisible).map((rv, i) => (
                  <div key={rv.id} className="lp-rv-card lp-reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                    <div className="lp-rv-card-top">
                      <div className="lp-rv-stars">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={16}
                            fill={s <= rv.rating ? '#D4A853' : 'none'}
                            color={s <= rv.rating ? '#D4A853' : 'var(--text3)'}
                          />
                        ))}
                      </div>
                      <span className="lp-rv-verified">
                        <CheckCircle size={12} /> {lang === 'uz' ? 'Tasdiqlangan' : 'Подтверждён'}
                      </span>
                    </div>
                    <p className="lp-rv-comment">{rv.comment || '—'}</p>
                    <div className="lp-rv-author">
                      <div className="lp-rv-av">{initials(rv.customer_name)}</div>
                      <div>
                        <p className="lp-rv-name">{rv.customer_name || (lang === 'uz' ? 'Mijoz' : 'Клиент')}</p>
                        <p className="lp-rv-date">{fmtDate(rv.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {rvVisible < reviews.length && (
                <div className="lp-rv-more-wrap">
                  <button
                    className="lp-rv-load-more"
                    onClick={() => setRvVisible(v => Math.min(v + 10, 30))}
                  >
                    {T.rv_load_more}
                  </button>
                </div>
              )}
              {rvVisible >= reviews.length && reviews.length > 10 && (
                <p className="lp-rv-all-shown">{T.rv_all_shown}</p>
              )}
            </>
          )}

          <div className="lp-rv-cta lp-reveal">
            <div className="lp-rv-cta-txt">
              <strong>{T.rv_cta_ttl}</strong>
              <span>{T.rv_cta_sub}</span>
            </div>
            {customer ? (
              <button className="lp-btn-primary lp-btn-sm" onClick={() => { setRvOrd(null); setRvO(true) }}>
                <Star size={14} /> {T.rv_btn}
              </button>
            ) : (
              <button className="lp-btn-outline lp-btn-sm" onClick={() => openAuth('register')}>
                {T.rv_login_hint}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="container">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-footer-logo">
                <div className="lp-logo-icon"><Utensils size={18} color="#fff" /></div>
                <span className="lp-logo-name">ECO <em>Taomlar</em></span>
              </div>
              <p className="lp-footer-desc">{T.footer_desc}</p>
              <div className="lp-footer-contact-row">
                <span><Phone size={14} /> +998 90 123 45 67</span>
                <span><MapPin size={14} /> Toshkent, O'zbekiston</span>
              </div>
            </div>
            <div>
              <p className="lp-footer-col-head">{T.footer_pages}</p>
              <div className="lp-footer-links">
                <a href="#menu" onClick={e => { e.preventDefault(); scrollToMenu() }}>{T.nav_menu}</a>
                <a href="#how">{T.nav_about}</a>
                <a href="#reviews">{T.nav_reviews}</a>
                <a href="/staff">{T.staff}</a>
              </div>
            </div>
            <div>
              <p className="lp-footer-col-head">{T.footer_contact}</p>
              <div className="lp-footer-links">
                <a href="tel:+998901234567">+998 90 123 45 67</a>
                <a href="mailto:info@ecotaomlar.uz">info@ecotaomlar.uz</a>
                <button onClick={() => openAuth('register')}>{T.auth_btn}</button>
              </div>
            </div>
            <div>
              <p className="lp-footer-col-head">Ijtimoiy tarmoqlar</p>
              <div className="lp-footer-links">
                <a href="#">Telegram</a>
                <a href="#">Instagram</a>
                <a href="#">Facebook</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bot">
            <span>© {new Date().getFullYear()} ECO Taomlar. Barcha huquqlar himoyalangan.</span>
            <a href="/staff" className="lp-footer-staff-link">{T.staff} →</a>
          </div>
        </div>
      </footer>

      {/* ════════════════ PANELS ═══════════════════════════════════════════════ */}

      {/* ─── CART DRAWER (combined: cart + orders + history) ──────────────────── */}
      {cartOpen && (
        <>
          <div className="lp-overlay" onClick={() => setCO(false)} />
          <aside className="lp-cart-drawer">
            <div className="lp-drawer-hd">
              <h3><ShoppingCart size={18} /> {T.cart_ttl}</h3>
              <button className="lp-close-btn" onClick={() => setCO(false)}><X size={16} /></button>
            </div>

            {/* Tabs */}
            <div className="lp-cart-tabs">
              <button className={cartTab === 'cart' ? 'active' : ''} onClick={() => setCartTab('cart')}>
                <ShoppingCart size={13} /> {T.tab_cart}
                {cartCount > 0 && <span className="lp-ctab-badge">{cartCount}</span>}
              </button>
              {customer && (
                <button className={cartTab === 'orders' ? 'active' : ''} onClick={() => setCartTab('orders')}>
                  <Clock size={13} /> {T.tab_orders}
                  {myOrders.filter(o => ['pending','cooking','ready','on_way'].includes(o.status)).length > 0 && (
                    <span className="lp-ctab-badge">
                      {myOrders.filter(o => ['pending','cooking','ready','on_way'].includes(o.status)).length}
                    </span>
                  )}
                </button>
              )}
              {customer && (
                <button className={cartTab === 'history' ? 'active' : ''} onClick={() => setCartTab('history')}>
                  <ClipboardList size={13} /> {T.tab_history}
                </button>
              )}
            </div>

            {/* ── Tab: Cart ── */}
            {cartTab === 'cart' && (
              <div className="lp-drawer-body">
                {cart.length === 0 ? (
                  <div className="lp-empty-state">
                    <div className="lp-empty-icon"><ShoppingCart size={48} strokeWidth={1} /></div>
                    <p>{T.cart_empty}</p>
                    <p className="lp-empty-hint">{T.cart_empty_hint}</p>
                  </div>
                ) : (
                  <div className="lp-cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="lp-cart-item">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="lp-cart-item-img" />
                          : <div className="lp-cart-item-img lp-cart-item-img--empty"><Utensils size={22} /></div>
                        }
                        <div className="lp-cart-item-info">
                          <p className="lp-cart-item-name">{item.name}</p>
                          <p className="lp-cart-item-price">{fmt(item.price)}</p>
                        </div>
                        <div className="lp-qty-ctrl">
                          <button onClick={() => updateQty(item.id, -1)}><Minus size={13} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, +1)}><Plus size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {cartTab === 'cart' && cart.length > 0 && (
              <div className="lp-drawer-ft">
                <div className="lp-cart-total-row">
                  <span>{T.cart_total}</span>
                  <span className="lp-cart-total-val">{fmt(cartTotal)}</span>
                </div>
                <button className="lp-btn-primary lp-btn-full" onClick={() => { setCO(false); openCheckout() }}>
                  {T.cart_btn}
                </button>
              </div>
            )}

            {/* ── Tab: Active Orders ── */}
            {cartTab === 'orders' && (() => {
              const activeOrders = myOrders.filter(o => ['pending','cooking','ready','on_way'].includes(o.status))
              return (
                <div className="lp-drawer-body">
                  {activeOrders.length === 0 ? (
                    <div className="lp-empty-state">
                      <div className="lp-empty-icon"><ClipboardList size={48} strokeWidth={1} /></div>
                      <p>{T.orders_empty}</p>
                      <p className="lp-empty-hint">{T.orders_empty_hint}</p>
                    </div>
                  ) : activeOrders.map(order => {
                    const stepIdx = STATUS_STEPS.indexOf(order.status)
                    const canCancel = order.status === 'pending'
                    return (
                      <div key={order.id} className={`lp-ocard${flashId === order.id ? ' lp-ocard--flash' : ''}`}>
                        <div className="lp-ocard-top">
                          <span className="lp-ocard-code">#{order.order_code}</span>
                          <span className={`lp-ocard-st lp-ocard-st--${order.status}`}>
                            {T[STATUS_KEY[order.status]] || order.status}
                          </span>
                        </div>
                        <div className="lp-ocard-items">
                          {(order.items || []).map((it, j) => (
                            <span key={j}>{it.item_name || it.name || `#${it.menu_item_id}`}{it.quantity > 1 ? ` ×${it.quantity}` : ''}{j < (order.items.length - 1) ? ', ' : ''}</span>
                          ))}
                        </div>
                        <div className="lp-sbar">
                          <div className="lp-sbar-steps">
                            {STATUS_STEPS.map((step, si) => (
                              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                <div className={`lp-sstep${si === stepIdx ? ' lp-sstep--active' : ''}${si < stepIdx ? ' lp-sstep--done' : ''}`}>
                                  <div className="lp-sstep-dot" />
                                  <span className="lp-sstep-lbl">{T[STATUS_KEY[step]]}</span>
                                </div>
                                {si < STATUS_STEPS.length - 1 && (
                                  <div className={`lp-sconn${si < stepIdx ? ' lp-sconn--done' : ''}`} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="lp-ocard-foot">
                          <span className="lp-ocard-total">{fmt(order.final_price || order.total_price || 0)}</span>
                          {canCancel && (
                            <button className="lp-ocard-cancel" onClick={() => cancelOrder(order.order_code)}>
                              <X size={12} /> {T.cancel_btn}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* ── Tab: Order History ── */}
            {cartTab === 'history' && (() => {
              const historyOrders = myOrders.filter(o => ['served','rejected','cancelled'].includes(o.status))
              return (
                <div className="lp-drawer-body">
                  {historyOrders.length === 0 ? (
                    <div className="lp-empty-state">
                      <div className="lp-empty-icon"><ClipboardList size={48} strokeWidth={1} /></div>
                      <p>{T.orders_empty}</p>
                      <p className="lp-empty-hint">{T.orders_empty_hint}</p>
                    </div>
                  ) : historyOrders.map(order => {
                    const isCancelled = order.status === 'rejected' || order.status === 'cancelled'
                    const canReview = order.status === 'served' && !reviewedCodes.has(order.order_code)
                    return (
                      <div key={order.id} className="lp-ocard">
                        <div className="lp-ocard-top">
                          <span className="lp-ocard-code">#{order.order_code}</span>
                          <span className={`lp-ocard-st lp-ocard-st--${order.status}`}>
                            {T[STATUS_KEY[order.status]] || order.status}
                          </span>
                        </div>
                        <div className="lp-ocard-items">
                          {(order.items || []).map((it, j) => (
                            <span key={j}>{it.item_name || it.name || `#${it.menu_item_id}`}{it.quantity > 1 ? ` ×${it.quantity}` : ''}{j < (order.items.length - 1) ? ', ' : ''}</span>
                          ))}
                        </div>
                        <div className="lp-ocard-foot">
                          <span className="lp-ocard-total">{fmt(order.final_price || order.total_price || 0)}</span>
                          {canReview && (
                            <button className="lp-ocard-review" onClick={() => { setRvOrd(order); setRvO(true) }}>
                              <Star size={12} /> {T.rv_btn}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </aside>
        </>
      )}

      {/* ─── AUTH MODAL ───────────────────────────────────────────────────────── */}
      {authOpen && (
        <div className="lp-modal-wrap" onClick={e => e.target === e.currentTarget && setAO(false)}>
          <div className="lp-modal">
            <div className="lp-modal-hd">
              <h3>{T.auth_ttl}</h3>
              <button className="lp-close-btn" onClick={() => setAO(false)}><X size={16} /></button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-tabs">
                <button className={authTab === 'register' ? 'active' : ''} onClick={() => { setATab('register'); setAuthErr('') }}>{T.tab_reg}</button>
                <button className={authTab === 'login'    ? 'active' : ''} onClick={() => { setATab('login');    setAuthErr('') }}>{T.tab_login}</button>
              </div>

              {authTab === 'register' && (
                <div className="lp-field">
                  <label>{T.fname_lbl}</label>
                  <input placeholder={T.fname_ph} value={authFName} onChange={e => setAuthFName(e.target.value)} autoFocus />
                </div>
              )}
              {authTab === 'register' && (
                <div className="lp-field">
                  <label>{T.lname_lbl}</label>
                  <input placeholder={T.lname_ph} value={authLName} onChange={e => setAuthLName(e.target.value)} />
                </div>
              )}
              <div className="lp-field">
                <label>{T.phone_lbl}</label>
                <div className="lp-phone-row">
                  <span className="lp-phone-prefix">+998</span>
                  <input
                    type="tel"
                    placeholder={T.phone_ph}
                    value={authPhone}
                    maxLength={9}
                    onChange={e => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                  />
                </div>
              </div>
              <div className="lp-field">
                <label>{T.pass_lbl}</label>
                <input
                  type="password"
                  placeholder={T.pass_ph}
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                />
              </div>

              {authErr && <p className="lp-form-err">{authErr}</p>}

              <button className="lp-btn-primary lp-btn-full lp-btn-mt" onClick={handleAuth} disabled={authLoading}>
                {authLoading
                  ? <Loader size={16} className="lp-spin" />
                  : (authTab === 'register' ? T.reg_btn : T.login_btn)
                }
              </button>
              <p className="lp-form-note">{authTab === 'register' ? T.reg_note : T.login_note}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHECKOUT MODAL ───────────────────────────────────────────────────── */}
      {checkoutOpen && (
        <div className="lp-modal-wrap" onClick={e => e.target === e.currentTarget && !placing && setCkO(false)}>
          <div className="lp-modal lp-modal--wide">
            <div className="lp-modal-hd">
              <h3>{T.co_ttl}</h3>
              {!placing && <button className="lp-close-btn" onClick={() => setCkO(false)}><X size={16} /></button>}
            </div>
            <div className="lp-modal-body">
              {checkoutDone ? (
                <div className="lp-co-success">
                  <div className="lp-co-success-ring">
                    <CheckCircle size={60} color="#FF6B35" strokeWidth={1.5} />
                  </div>
                  <h2>{T.co_ok_ttl}</h2>
                  {lastOrderCode && <div className="lp-co-code">#{lastOrderCode}</div>}
                  <p className="lp-co-est">
                    <Clock size={15} />
                    {delivType === 'delivery' ? T.del_time_delivery : T.del_time_pickup}
                  </p>
                  <p className="lp-co-ok-sub">{T.co_ok_sub}</p>
                  <button className="lp-btn-primary lp-btn-full lp-btn-mt"
                    onClick={() => { setCkO(false); openOrders('orders') }}>
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
                    <div className="lp-field">
                      <label>{T.addr_lbl}</label>
                      <button type="button" className="lp-map-open-btn"
                        onClick={() => { setMapMode('delivery'); setMapOpen(true) }}>
                        <MapIcon size={16} />
                        {delivLat
                          ? (lang === 'uz' ? 'Manzilni o\'zgartirish' : 'Изменить место на карте')
                          : (lang === 'uz' ? 'Xaritadan tanlash' : 'Выбрать на карте')}
                      </button>
                      {delivLat && (
                        <div className="lp-map-sel-info">
                          <CheckCircle size={13} /> {addrVal || `${delivLat.toFixed(4)}, ${delivLng.toFixed(4)}`}
                        </div>
                      )}
                    </div>
                  )}
                  {delivType === 'pickup' && (
                    <div className="lp-pickup-map">
                      <p className="lp-pickup-label">
                        <MapPin size={13} />
                        {lang === 'uz' ? "Olib ketish manzili" : "Место самовывоза"}
                        {restSettings.pickup_address && <span style={{ fontWeight: 400, marginLeft: 6 }}>— {restSettings.pickup_address}</span>}
                      </p>
                      <button type="button" className="lp-map-open-btn"
                        onClick={() => { setMapMode('pickup'); setMapOpen(true) }}>
                        <MapIcon size={16} />
                        {lang === 'uz' ? 'Xaritani ochish' : 'Открыть карту'}
                      </button>
                    </div>
                  )}

                  <FullscreenMap
                    open={mapOpen}
                    mode={mapMode}
                    lang={lang}
                    initialLat={mapMode === 'pickup' ? (restSettings.pickup_lat || 40.8086726) : delivLat}
                    initialLng={mapMode === 'pickup' ? (restSettings.pickup_lng || 72.3274106) : delivLng}
                    restLabel={restSettings.pickup_address}
                    onConfirm={({ lat, lng, address }) => {
                      setDLat(lat); setDLng(lng)
                      if (address) setAddr(address)
                    }}
                    onClose={() => setMapOpen(false)}
                  />

                  <div className="lp-field">
                    <label>{T.note_lbl}</label>
                    <input placeholder={T.note_ph} value={noteVal} onChange={e => setNote(e.target.value)} />
                  </div>

                  {/* Promo */}
                  <div className="lp-promo">
                    <input placeholder={T.promo_ph} value={promoVal} onChange={e => { setPromo(e.target.value); setPromoR(null); setPromoE('') }} />
                    <button onClick={checkPromo} disabled={promoChecking}>{promoChecking ? '...' : T.promo_btn}</button>
                  </div>
                  {promoRes && <p className="lp-promo-ok"><CheckCircle size={13} /> {promoRes.message || "Promokod qo'llandi"}</p>}
                  {promoErr && <p className="lp-promo-err"><X size={13} /> {promoErr}</p>}

                  {/* Total */}
                  <div className="lp-co-total">
                    <span>{T.total}</span>
                    <span>
                      {promoRes && <span className="lp-strike">{fmt(cartTotal)}</span>}
                      {fmt(finalTotal())}
                    </span>
                  </div>

                  <button className="lp-btn-primary lp-btn-full lp-btn-mt" onClick={placeOrder} disabled={placing}>
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

      {/* MY ORDERS PANEL — merged into cart drawer tabs above */}

      {/* ─── REVIEW MODAL ─────────────────────────────────────────────────────── */}
      {reviewOpen && (
        <div className="lp-modal-wrap" onClick={e => e.target === e.currentTarget && setRvO(false)}>
          <div className="lp-modal">
            <div className="lp-modal-hd">
              <h3>{T.rv_modal_ttl}</h3>
              <button className="lp-close-btn" onClick={() => setRvO(false)}><X size={16} /></button>
            </div>
            <div className="lp-modal-body">
              {reviewOrder && (
                <p className="lp-rv-modal-sub">
                  {T.rv_modal_sub} <strong>#{reviewOrder.order_code}</strong>
                </p>
              )}
              {!reviewOrder && (
                <p className="lp-rv-modal-sub">{T.rv_cta_sub}</p>
              )}
              <div className="lp-stars">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRvR(s)}>
                    <Star size={28} fill={s <= rvRating ? '#D4A853' : 'none'} color={s <= rvRating ? '#D4A853' : 'var(--text3)'} />
                  </button>
                ))}
              </div>
              <div className="lp-field">
                <label>{T.rv_comment_lbl}</label>
                <textarea placeholder={T.rv_comment_ph} value={rvComment} onChange={e => setRvC(e.target.value)} />
              </div>
              <div className="lp-rv-actions">
                <button className="lp-btn-outline lp-btn-sm" style={{ flex: 1 }} onClick={() => setRvO(false)}>
                  {T.rv_skip}
                </button>
                <button className="lp-btn-primary lp-btn-sm" style={{ flex: 2 }} onClick={submitReview} disabled={!rvRating || rvSending}>
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

      {/* ─── MY REVIEWS DRAWER ───────────────────────────────────────────────── */}
      {myReviewsOpen && (
        <>
          <div className="lp-overlay" onClick={() => setMRO(false)} />
          <aside className="lp-cart-drawer">
            <div className="lp-drawer-hd">
              <h3><Star size={18} /> {T.my_reviews}</h3>
              <button className="lp-close-btn" onClick={() => setMRO(false)}><X size={16} /></button>
            </div>
            <div className="lp-drawer-body">
              {myRvLoading ? (
                <div className="lp-empty-state">
                  <Loader size={32} className="lp-spin" style={{ borderTopColor: 'var(--orange)' }} />
                </div>
              ) : myReviews.length === 0 ? (
                <div className="lp-empty-state">
                  <div className="lp-empty-icon"><Star size={48} strokeWidth={1} /></div>
                  <p>{T.rv_no_reviews}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {myReviews.map(rv => (
                    <div key={rv.id} className="lp-my-rv-card">
                      <div className="lp-my-rv-top">
                        <div className="lp-rv-stars">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={13}
                              fill={s <= rv.rating ? '#D4A853' : 'none'}
                              color={s <= rv.rating ? '#D4A853' : 'var(--text3)'}
                            />
                          ))}
                        </div>
                        <span className="lp-my-rv-date">{fmtDate(rv.created_at)}</span>
                      </div>
                      {rv.order_code && (
                        <p className="lp-my-rv-order">#{rv.order_code}</p>
                      )}
                      {rv.comment && (
                        <p className="lp-my-rv-comment">{rv.comment}</p>
                      )}
                      <button
                        className="lp-my-rv-del"
                        onClick={() => deleteMyReview(rv.id, rv.order_code)}
                        disabled={deletingRvId === rv.id}
                      >
                        {deletingRvId === rv.id
                          ? <Loader size={13} className="lp-spin" />
                          : <><X size={12} /> {T.rv_delete}</>
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </>
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
