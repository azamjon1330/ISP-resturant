import { useState, useEffect, useRef, useCallback } from 'react'
import { menuAPI, ordersAPI, customerAPI } from '../../api'
import './LandingPage.css'

// ─── Translations ─────────────────────────────────────────────────────────────
const LANG = {
  uz: {
    nav_menu: 'Menyu',
    nav_about: 'Haqimizda',
    cart: 'Savat',
    auth_btn: "Ro'yxat / Kirish",
    orders_btn: 'Buyurtmalarim',
    logout: 'Chiqish',
    hero_tag: '🥘 Milliy taom',
    hero_btn1: 'Buyurtma berish',
    hero_btn2: "Menyuni ko'rish",
    hero_badge1: 'Tez yetkazish',
    hero_badge2: '100% Halol',
    hero_badge3: 'Milliy taomlar',
    slides: [
      { title: "Mazali O'zbek", titleOrange: 'Plov', sub: "An'anaviy retsept bo'yicha tayyorlangan, qo'zichoq go'shti va ziravorlar bilan." },
      { title: "Issiq va To'yimli", titleOrange: "Sho'rva", sub: "Qo'y go'shtidan tayyorlangan milliy sho'rvamiz sizni to'yintiradi." },
      { title: "Qo'lda Tayyorlangan", titleOrange: 'Lagman', sub: "Yangi qo'lda yoylgan xamir va go'sht bilan tayyorlangan an'anaviy lagman." },
    ],
    stat1_num: '500+', stat1_lbl: 'Mamnun mijoz',
    stat2_num: '30+',  stat2_lbl: 'Taom turi',
    stat3_num: '30-45',stat3_lbl: 'daqiqa yetkazish',
    stat4_num: '100%', stat4_lbl: 'Halol taomlar',
    cat_all: 'Barchasi',
    menu_label: 'MENYU',
    menu_title: 'Mashhur',
    menu_title_orange: 'Taomlar',
    menu_sub: "Eng ko'p buyurtma qilingan taomlarimizdan tanlang",
    menu_add: 'Savatga',
    menu_empty: 'Taomlar topilmadi',
    offers_label: 'TAKLIFLAR',
    offers_title: 'Maxsus',
    offers_title_orange: 'Chegirmalar',
    offer1_title: 'Bepul yetkazish',
    offer1_desc: "50 000 so'm dan yuqori buyurtmalarda yetkazish bepul!",
    offer2_title: '20% Chegirma',
    offer2_desc: 'Birinchi buyurtmangizda 20% chegirma oling. Hoziroq buyurtma bering!',
    offer3_title: 'VIP Bonus',
    offer3_desc: "Har bir buyurtmadan ball to'plang va sovg'alar yuting!",
    how_label: 'JARAYON',
    how_title: 'Qanday',
    how_title_orange: 'Ishlaydi?',
    step1_title: 'Tanlang',
    step1_desc: 'Menyudan sevimli taomingizni tanlang',
    step2_title: 'Buyurtma bering',
    step2_desc: "Yetkazish manzilini kiriting va buyurtmani tasdiqlang",
    step3_title: 'Oling',
    step3_desc: "Taomingiz 30-45 daqiqada eshigingizga yetkaziladi",
    step_label: (n) => `0${n}-qadam`,
    test_label: 'SHARHLAR',
    test_title: 'Mijozlar',
    test_title_orange: 'Fikri',
    reviews: [
      { name: 'Aziz Karimov', sub: 'Toshkent', text: "ECO Taomlar plov tayyorlashda hech kimga o'xshamaydi! Har doim yangi va mazali. Tez yetkazishadi ham. Tavsiya qilaman!", avatar: '🧑', color: '#e05a28' },
      { name: 'Malika Yusupova', sub: 'Chilonzor', text: "Lagmanlari ajoyib! Qo'lda tayyorlangan, shundayi ko'rinadi. Narxi ham mos, sifati a'lo. Oila bilan mamnunmiz!", avatar: '👩', color: '#6366f1' },
      { name: 'Jasur Nazarov', sub: 'Yunusobod', text: "Sho'rvasi uyda tayyorlagandek mazali. Har haftada kamida bir marta buyurtma beraman. Xizmat ham zo'r!", avatar: '🧔', color: '#059669' },
    ],
    auth_register: "Ro'yxatdan o'tish",
    auth_login: 'Kirish',
    auth_phone: 'Telefon raqam',
    auth_fname: 'Ism (majburiy)',
    auth_lname: 'Familiya (ixtiyoriy)',
    auth_register_btn: 'Davom etish',
    auth_login_btn: 'Kirish',
    auth_note: "Ro'yxatdan o'ting — keyingi safar faqat telefon raqam bilan kirasiz",
    auth_login_note: 'Telefon raqamingizni kiriting va tizimga kiring',
    auth_error_phone: 'Telefon raqam kiriting (masalan: +998901234567)',
    auth_error_fname: 'Ismingizni kiriting',
    orders_title: 'Mening buyurtmalarim',
    orders_new: '+ Yangi buyurtma',
    orders_loading: 'Yuklanmoqda...',
    orders_empty: "Buyurtmalar yo'q",
    order_cancel: 'Bekor qilish',
    order_cancel_confirm: "Haqiqatan ham bekor qilmoqchimisiz?",
    order_total: 'Jami:',
    status_pending: 'Qabul',
    status_cooking: 'Tayyorlanmoqda',
    status_ready: 'Tayyor',
    status_on_way: "Yo'lda",
    status_delivered: 'Yetkazildi',
    status_cancelled: 'Bekor qilindi',
    checkout_title: 'Buyurtmani rasmiylashtirish',
    checkout_items: 'Tanlangan taomlar',
    checkout_address: 'Yetkazish manzili',
    checkout_address_ph: "Ko'cha, uy, xonadon raqami...",
    checkout_note: 'Izoh (ixtiyoriy)',
    checkout_note_ph: "Qo'shimcha ko'rsatma...",
    checkout_promo: 'Promo kod',
    checkout_promo_ph: 'Promo kodni kiriting',
    checkout_promo_apply: "Qo'llash",
    checkout_total: 'Jami:',
    checkout_discount: 'Chegirma:',
    checkout_btn: 'Buyurtma berish',
    checkout_required: 'Yetkazish manzilini kiriting',
    success_title: 'Buyurtma qabul qilindi!',
    success_sub: 'Taomingiz 30-45 daqiqa ichida yetkaziladi',
    toast_added: (n) => `"${n}" savatga qo'shildi`,
    toast_removed: (n) => `"${n}" savatdan olib tashlandi`,
    toast_order_ok: 'Buyurtma muvaffaqiyatli berildi!',
    toast_order_err: 'Xatolik yuz berdi',
    toast_login_ok: (n) => `Xush kelibsiz, ${n}!`,
    toast_reg_ok: (n) => `Ro'yxatdan o'tdingiz, ${n}!`,
    toast_cancel_ok: 'Buyurtma bekor qilindi',
    toast_promo_ok: (d) => `Promo qo'llandi! ${d}% chegirma`,
    toast_promo_err: 'Promo kod yaroqsiz',
    toast_ws_update: (c, s) => `#${c} buyurtma holati yangilandi: ${s}`,
    footer_desc: "O'zbek milliy taomlarini tez va sifatli yetkazamiz.",
    footer_links_title: 'Havolalar',
    footer_contact_title: "Bog'lanish",
    footer_staff_title: 'Xodimlar',
    footer_staff_link: 'Xodimlar paneli',
    footer_phone: '+998 71 123 45 67',
    footer_address: "Toshkent sh., Amir Temur ko'chasi 10",
    footer_hours: '09:00 — 23:00 (har kuni)',
    footer_copy: '© 2025 ECO Taomlar. Barcha huquqlar himoyalangan.',
    footer_tagline: 'Mazali taomlar — tez yetkazish',
    sum: "so'm",
  },
  ru: {
    nav_menu: 'Меню',
    nav_about: 'О нас',
    cart: 'Корзина',
    auth_btn: 'Войти / Регистрация',
    orders_btn: 'Мои заказы',
    logout: 'Выйти',
    hero_tag: '🥘 Национальная еда',
    hero_btn1: 'Сделать заказ',
    hero_btn2: 'Смотреть меню',
    hero_badge1: 'Быстрая доставка',
    hero_badge2: '100% Халяль',
    hero_badge3: 'Национальные блюда',
    slides: [
      { title: 'Вкусный Узбекский', titleOrange: 'Плов', sub: 'Приготовлен по традиционному рецепту с бараниной и специями.' },
      { title: 'Горячая и Сытная', titleOrange: 'Шурпа', sub: 'Наша национальная шурпа из баранины утолит любой голод.' },
      { title: 'Домашний', titleOrange: 'Лагман', sub: 'Традиционный лагман с ручной лапшой и сочным мясом.' },
    ],
    stat1_num: '500+', stat1_lbl: 'Довольных клиентов',
    stat2_num: '30+',  stat2_lbl: 'Видов блюд',
    stat3_num: '30-45',stat3_lbl: 'минут доставка',
    stat4_num: '100%', stat4_lbl: 'Халяль еда',
    cat_all: 'Все',
    menu_label: 'МЕНЮ',
    menu_title: 'Популярные',
    menu_title_orange: 'Блюда',
    menu_sub: 'Выберите из наших самых заказываемых блюд',
    menu_add: 'В корзину',
    menu_empty: 'Блюда не найдены',
    offers_label: 'ПРЕДЛОЖЕНИЯ',
    offers_title: 'Специальные',
    offers_title_orange: 'Скидки',
    offer1_title: 'Бесплатная доставка',
    offer1_desc: 'При заказе от 50 000 сум доставка бесплатная!',
    offer2_title: 'Скидка 20%',
    offer2_desc: 'Получите 20% скидку на первый заказ. Заказывайте сейчас!',
    offer3_title: 'VIP Бонус',
    offer3_desc: 'Копите баллы с каждого заказа и выигрывайте призы!',
    how_label: 'КАК ЭТО РАБОТАЕТ',
    how_title: 'Как это',
    how_title_orange: 'Работает?',
    step1_title: 'Выберите',
    step1_desc: 'Выберите любимое блюдо из меню',
    step2_title: 'Оформите заказ',
    step2_desc: 'Введите адрес доставки и подтвердите заказ',
    step3_title: 'Получите',
    step3_desc: 'Ваше блюдо будет доставлено за 30-45 минут',
    step_label: (n) => `Шаг 0${n}`,
    test_label: 'ОТЗЫВЫ',
    test_title: 'Мнения',
    test_title_orange: 'Клиентов',
    reviews: [
      { name: 'Азиз Каримов', sub: 'Ташкент', text: 'ECO Taomlar готовит плов как никто другой! Всегда свежо и вкусно. Доставляют быстро. Рекомендую!', avatar: '🧑', color: '#e05a28' },
      { name: 'Малика Юсупова', sub: 'Чиланзар', text: 'Лагман просто восхитительный! Ручной, это видно. Цена соответствует качеству. Вся семья в восторге!', avatar: '👩', color: '#6366f1' },
      { name: 'Жасур Назаров', sub: 'Юнусабад', text: 'Шурпа как домашняя! Заказываю минимум раз в неделю. Сервис тоже отличный!', avatar: '🧔', color: '#059669' },
    ],
    auth_register: 'Регистрация',
    auth_login: 'Войти',
    auth_phone: 'Номер телефона',
    auth_fname: 'Имя (обязательно)',
    auth_lname: 'Фамилия (необязательно)',
    auth_register_btn: 'Продолжить',
    auth_login_btn: 'Войти',
    auth_note: 'Зарегистрируйтесь — в следующий раз войдите только по номеру',
    auth_login_note: 'Введите номер телефона для входа',
    auth_error_phone: 'Введите номер телефона (например: +998901234567)',
    auth_error_fname: 'Введите ваше имя',
    orders_title: 'Мои заказы',
    orders_new: '+ Новый заказ',
    orders_loading: 'Загрузка...',
    orders_empty: 'Заказов нет',
    order_cancel: 'Отменить',
    order_cancel_confirm: 'Вы уверены, что хотите отменить?',
    order_total: 'Итого:',
    status_pending: 'Принят',
    status_cooking: 'Готовится',
    status_ready: 'Готов',
    status_on_way: 'В пути',
    status_delivered: 'Доставлен',
    status_cancelled: 'Отменён',
    checkout_title: 'Оформление заказа',
    checkout_items: 'Выбранные блюда',
    checkout_address: 'Адрес доставки',
    checkout_address_ph: 'Улица, дом, квартира...',
    checkout_note: 'Примечание (необязательно)',
    checkout_note_ph: 'Дополнительные инструкции...',
    checkout_promo: 'Промо код',
    checkout_promo_ph: 'Введите промо код',
    checkout_promo_apply: 'Применить',
    checkout_total: 'Итого:',
    checkout_discount: 'Скидка:',
    checkout_btn: 'Оформить заказ',
    checkout_required: 'Введите адрес доставки',
    success_title: 'Заказ принят!',
    success_sub: 'Ваше блюдо будет доставлено за 30-45 минут',
    toast_added: (n) => `"${n}" добавлен в корзину`,
    toast_removed: (n) => `"${n}" удалён из корзины`,
    toast_order_ok: 'Заказ успешно оформлен!',
    toast_order_err: 'Произошла ошибка',
    toast_login_ok: (n) => `Добро пожаловать, ${n}!`,
    toast_reg_ok: (n) => `Вы зарегистрированы, ${n}!`,
    toast_cancel_ok: 'Заказ отменён',
    toast_promo_ok: (d) => `Промо применён! ${d}% скидка`,
    toast_promo_err: 'Промо код недействителен',
    toast_ws_update: (c, s) => `Заказ #${c} обновлён: ${s}`,
    footer_desc: 'Доставляем узбекские национальные блюда быстро и качественно.',
    footer_links_title: 'Ссылки',
    footer_contact_title: 'Контакты',
    footer_staff_title: 'Сотрудники',
    footer_staff_link: 'Панель сотрудников',
    footer_phone: '+998 71 123 45 67',
    footer_address: 'г. Ташкент, ул. Амира Темура 10',
    footer_hours: '09:00 — 23:00 (ежедневно)',
    footer_copy: '© 2025 ECO Taomlar. Все права защищены.',
    footer_tagline: 'Вкусная еда — быстрая доставка',
    sum: 'сум',
  },
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1645696301019-35adcc18b6da?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=90',
]

const CAT_EMOJI_MAP = {
  plov: '🍚', lagman: '🍜', shorva: '🍲', kebab: '🥩',
  salat: '🥗', non: '🫓', somsa: '🥟', manti: '🥟',
  shashlik: '🔥', dimlama: '🫕', mastava: '🍲',
  ichimlik: '🥤', dessert: '🍮', default: '🍽️',
}

const getCatEmoji = (cat) => {
  if (!cat) return CAT_EMOJI_MAP.default
  const lower = cat.toLowerCase()
  for (const key of Object.keys(CAT_EMOJI_MAP)) {
    if (lower.includes(key)) return CAT_EMOJI_MAP[key]
  }
  return CAT_EMOJI_MAP.default
}

const STATUS_STEPS = ['pending', 'cooking', 'ready', 'on_way', 'delivered']
const STATUS_KEY = {
  pending: 'status_pending', cooking: 'status_cooking',
  ready: 'status_ready', on_way: 'status_on_way',
  delivered: 'status_delivered', cancelled: 'status_cancelled',
}

const fmt = (n) => `${Number(n || 0).toLocaleString('uz-UZ')} so'm`

let _toastId = 0

// ═════════════════════════════════════════════════════════════════════════════
//  LANDING PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {

  // ── Language ──────────────────────────────────────────────────────────────
  const [lang, setLang] = useState(() => localStorage.getItem('eco_lang') || 'uz')
  const T = LANG[lang]

  const switchLang = (l) => { setLang(l); localStorage.setItem('eco_lang', l) }

  // ── Customer auth ─────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eco_customer_data') || 'null') } catch { return null }
  })

  const doLogout = () => {
    localStorage.removeItem('eco_customer_token')
    localStorage.removeItem('eco_customer_data')
    setCustomer(null)
    setShowUserMenu(false)
  }

  // ── UI state ──────────────────────────────────────────────────────────────
  const [scrolled, setScrolled]         = useState(false)
  const [showCart, setShowCart]         = useState(false)
  const [showAuth, setShowAuth]         = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrders, setShowOrders]     = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [authTab, setAuthTab]           = useState('register')

  // ── Toasts ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'success') => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
    }, 3200)
  }, [])

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([])

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const i = prev.findIndex(c => c.item.id === item.id)
      if (i >= 0) { const n = [...prev]; n[i] = { ...n[i], qty: n[i].qty + 1 }; return n }
      return [...prev, { item, qty: 1 }]
    })
  }, [])

  const changeQty = useCallback((id, d) => {
    setCart(prev => {
      const n = prev.map(c => c.item.id === id ? { ...c, qty: c.qty + d } : c)
      return n.filter(c => c.qty > 0)
    })
  }, [])

  const removeItem = useCallback((id) => setCart(prev => prev.filter(c => c.item.id !== id)), [])

  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0)

  // ── Hero carousel ─────────────────────────────────────────────────────────
  const [heroSlide, setHeroSlide] = useState(0)
  const heroTimer = useRef(null)

  const startHeroTimer = useCallback(() => {
    clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => setHeroSlide(s => (s + 1) % 3), 60000)
  }, [])

  useEffect(() => { startHeroTimer(); return () => clearInterval(heroTimer.current) }, [startHeroTimer])

  const gotoSlide = (i) => { setHeroSlide(i); startHeroTimer() }
  const prevSlide = () => gotoSlide((heroSlide + 2) % 3)
  const nextSlide = () => gotoSlide((heroSlide + 1) % 3)

  // ── Menu data ─────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems]     = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [activeCat, setActiveCat]     = useState('all')

  useEffect(() => {
    menuAPI.getAll()
      .then(res => {
        const raw = res.data?.items || res.data || []
        setMenuItems(Array.isArray(raw) ? raw.filter(i => i.available !== false) : [])
      })
      .catch(() => setMenuItems([]))
      .finally(() => setMenuLoading(false))
  }, [])

  const categories = ['all', ...Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)))]
  const filtered   = activeCat === 'all' ? menuItems : menuItems.filter(i => i.category === activeCat)

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  // ── Scroll reveal ─────────────────────────────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal')
    if (!els.length) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  })

  // ── Close user menu on outside click ─────────────────────────────────────
  const userMenuRef = useRef(null)
  useEffect(() => {
    if (!showUserMenu) return
    const h = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showUserMenu])

  // ── Auth form ─────────────────────────────────────────────────────────────
  const [authPhone, setAuthPhone]       = useState('')
  const [authFName, setAuthFName]       = useState('')
  const [authLName, setAuthLName]       = useState('')
  const [authError, setAuthError]       = useState('')
  const [authLoading, setAuthLoading]   = useState(false)

  const openAuth = (tab = 'register') => {
    setAuthTab(tab); setAuthError(''); setAuthPhone(''); setAuthFName(''); setAuthLName('')
    setShowAuth(true)
  }

  const handleAuth = async () => {
    setAuthError('')
    if (!authPhone.trim()) { setAuthError(T.auth_error_phone); return }
    if (authTab === 'register' && !authFName.trim()) { setAuthError(T.auth_error_fname); return }
    setAuthLoading(true)
    try {
      const res = authTab === 'register'
        ? await customerAPI.register({ phone: authPhone.trim(), first_name: authFName.trim(), last_name: authLName.trim() || undefined })
        : await customerAPI.login({ phone: authPhone.trim() })
      const { token, customer: cust } = res.data
      localStorage.setItem('eco_customer_token', token)
      localStorage.setItem('eco_customer_data', JSON.stringify(cust))
      setCustomer(cust)
      setShowAuth(false)
      addToast(authTab === 'register' ? T.toast_reg_ok(cust.first_name) : T.toast_login_ok(cust.first_name))
    } catch (err) {
      setAuthError(err.response?.data?.error || err.response?.data?.message || T.toast_order_err)
    } finally { setAuthLoading(false) }
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  const [orders, setOrders]             = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [flashOrders, setFlashOrders]   = useState(new Set())

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await customerAPI.orders()
      const data = res.data?.orders || res.data || []
      setOrders(Array.isArray(data) ? data : [])
    } catch { setOrders([]) }
    finally { setOrdersLoading(false) }
  }

  const openOrders = () => {
    if (!customer) { openAuth('login'); return }
    setShowOrders(true); loadOrders()
  }

  const cancelOrder = async (code) => {
    if (!window.confirm(T.order_cancel_confirm)) return
    try {
      await customerAPI.cancelOrder(code, '')
      addToast(T.toast_cancel_ok)
      loadOrders()
    } catch (err) { addToast(err.response?.data?.error || T.toast_order_err, 'error') }
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const wsRef = useRef(null)
  useEffect(() => {
    if (!customer) return
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'order_status_changed') {
          const { order_code, status } = msg.payload
          setOrders(prev => prev.map(o => o.order_code === order_code ? { ...o, status } : o))
          setFlashOrders(prev => new Set([...prev, order_code]))
          setTimeout(() => setFlashOrders(prev => { const s = new Set(prev); s.delete(order_code); return s }), 3000)
          addToast(T.toast_ws_update(order_code, T[STATUS_KEY[status]] || status), 'info')
        }
      } catch {}
    }
    ws.onerror = () => {}
    return () => ws.close()
  }, [customer]) // eslint-disable-line

  // ── Checkout ──────────────────────────────────────────────────────────────
  const [coAddr, setCoAddr]           = useState('')
  const [coNote, setCoNote]           = useState('')
  const [coPromo, setCoPromo]         = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [coLoading, setCoLoading]     = useState(false)
  const [coSuccess, setCoSuccess]     = useState(false)
  const [coError, setCoError]         = useState('')

  const openCheckout = () => {
    if (!customer) { openAuth('login'); return }
    setCoAddr(''); setCoNote(''); setCoPromo(''); setPromoResult(null)
    setCoError(''); setCoSuccess(false); setShowCheckout(true)
  }

  const applyPromo = async () => {
    if (!coPromo.trim()) return
    setPromoLoading(true)
    try {
      const { promoAPI } = await import('../../api')
      const res = await promoAPI.check(coPromo.trim(), cartTotal)
      setPromoResult(res.data)
      addToast(T.toast_promo_ok(res.data.discount_percent))
    } catch { addToast(T.toast_promo_err, 'error'); setPromoResult(null) }
    finally { setPromoLoading(false) }
  }

  const discountedTotal = promoResult
    ? cartTotal - Math.round(cartTotal * promoResult.discount_percent / 100)
    : cartTotal

  const submitOrder = async () => {
    if (!coAddr.trim()) { setCoError(T.checkout_required); return }
    setCoLoading(true); setCoError('')
    try {
      await ordersAPI.create({
        items: cart.map(c => ({ menu_item_id: c.item.id, quantity: c.qty })),
        order_type: 'delivery',
        delivery_address: coAddr.trim(),
        customer_name: [customer.first_name, customer.last_name].filter(Boolean).join(' '),
        customer_phone: customer.phone,
        customer_id: customer.id,
        note: coNote.trim() || undefined,
        promo_code: coPromo.trim() || undefined,
      })
      setCart([]); setCoSuccess(true)
      addToast(T.toast_order_ok)
      setTimeout(() => { setShowCheckout(false); setShowCart(false) }, 2800)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || T.toast_order_err
      setCoError(msg); addToast(msg, 'error')
    } finally { setCoLoading(false) }
  }

  // ── Scroll to section ─────────────────────────────────────────────────────
  const scrollTo = (id) => { const el = document.getElementById(id); el?.scrollIntoView({ behavior: 'smooth' }) }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="lp-root">

      {/* ══════════ HEADER ══════════════════════════════════════════════ */}
      <header className={`lp-header${scrolled ? ' lp-header--scrolled' : ''}`}>
        <a className="lp-header__logo" href="/">🍽️ ECO <span>Taomlar</span></a>

        <nav className="lp-header__nav">
          <a href="#menu" onClick={e => { e.preventDefault(); scrollTo('menu') }}>{T.nav_menu}</a>
          <a href="#haqimizda" onClick={e => { e.preventDefault(); scrollTo('haqimizda') }}>{T.nav_about}</a>
        </nav>

        <div className="lp-header__right">
          <div className="lp-lang-toggle">
            <button className={lang === 'uz' ? 'active' : ''} onClick={() => switchLang('uz')}>🇺🇿 O'z</button>
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => switchLang('ru')}>🇷🇺 Рус</button>
          </div>

          <button className="lp-cart-btn" onClick={() => setShowCart(true)}>
            🛒 <span>{T.cart}</span>
            {cartCount > 0 && <span className="lp-cart-btn__badge">{cartCount}</span>}
          </button>

          {customer ? (
            <div className="lp-user-menu" ref={userMenuRef}>
              <button className="lp-user-menu__trigger" onClick={() => setShowUserMenu(v => !v)}>
                👤 {customer.first_name} ▾
              </button>
              {showUserMenu && (
                <div className="lp-user-menu__dropdown">
                  <button onClick={() => { setShowUserMenu(false); openOrders() }}>📦 {T.orders_btn}</button>
                  <button className="danger" onClick={doLogout}>🚪 {T.logout}</button>
                </div>
              )}
            </div>
          ) : (
            <button className="lp-auth-btn" onClick={() => openAuth('register')}>{T.auth_btn}</button>
          )}
        </div>
      </header>

      {/* ══════════ HERO CAROUSEL ════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="lp-hero__glow lp-hero__glow--1" />
        <div className="lp-hero__glow lp-hero__glow--2" />

        <div className="lp-hero__orbs">
          {['🍚','🥩','🍜','🥘','🫕','🍲'].map((e, i) => (
            <span key={i} className="lp-hero__orb" style={{
              left: `${12 + i * 14}%`,
              top: `${18 + (i % 3) * 22}%`,
              animationDuration: `${5.5 + i * 1.3}s`,
              animationDelay: `${i * 0.7}s`,
            }}>{e}</span>
          ))}
        </div>

        {[0, 1, 2].map(idx => (
          <div key={idx} className={`lp-hero__slide${heroSlide === idx ? ' lp-hero__slide--active' : ''}`}>
            <div className="lp-hero__content">
              <div className="lp-hero__tag">{T.hero_tag}</div>
              <h1 className="lp-hero__title">
                {T.slides[idx].title}<br /><em>{T.slides[idx].titleOrange}</em>
              </h1>
              <p className="lp-hero__sub">{T.slides[idx].sub}</p>
              <div className="lp-hero__actions">
                <button className="lp-btn-primary" onClick={() => scrollTo('menu')}>{T.hero_btn1}</button>
                <button className="lp-btn-secondary" onClick={() => scrollTo('menu')}>{T.hero_btn2}</button>
              </div>
              <div className="lp-hero__badges">
                {[T.hero_badge1, T.hero_badge2, T.hero_badge3].map((b, i) => (
                  <div key={i} className="lp-hero__badge">
                    <span className="lp-hero__badge-dot" />{b}
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-hero__image-side">
              <div
                className="lp-hero__bg-img"
                style={{ backgroundImage: `url(${HERO_IMAGES[idx]}), linear-gradient(135deg,#1a0a00,#0a0a0a)` }}
              />
              <div className="lp-hero__image-overlay" />
            </div>
          </div>
        ))}

        <div className="lp-hero__arrows">
          <button className="lp-hero__arrow" onClick={prevSlide} aria-label="prev">‹</button>
          <button className="lp-hero__arrow" onClick={nextSlide} aria-label="next">›</button>
        </div>

        <div className="lp-hero__dots">
          {[0, 1, 2].map(i => (
            <button key={i} className={`lp-hero__dot${heroSlide === i ? ' lp-hero__dot--active' : ''}`}
              onClick={() => gotoSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* ══════════ STATS BAR ════════════════════════════════════════════ */}
      <div className="lp-stats lp-reveal">
        <div className="lp-stats__inner">
          {[
            { num: T.stat1_num, lbl: T.stat1_lbl },
            { num: T.stat2_num, lbl: T.stat2_lbl },
            { num: T.stat3_num, lbl: T.stat3_lbl },
            { num: T.stat4_num, lbl: T.stat4_lbl },
          ].map((s, i) => (
            <div key={i} className="lp-stats__item">
              <div className="lp-stats__number">{s.num}</div>
              <div className="lp-stats__label">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ MENU SECTION ═════════════════════════════════════════ */}
      <section id="menu">
        <div className="lp-section">
          <div className="lp-section__header lp-reveal">
            <div className="lp-section__label">{T.menu_label}</div>
            <h2 className="lp-section__title">{T.menu_title} <em>{T.menu_title_orange}</em></h2>
            <p className="lp-section__sub">{T.menu_sub}</p>
          </div>

          <div className="lp-categories lp-reveal">
            {categories.map(cat => (
              <button
                key={cat}
                className={`lp-cat-pill${activeCat === cat ? ' lp-cat-pill--active' : ''}`}
                onClick={() => setActiveCat(cat)}
              >
                <span className="lp-cat-icon">{cat === 'all' ? '🍽️' : getCatEmoji(cat)}</span>
                {cat === 'all' ? T.cat_all : cat}
              </button>
            ))}
          </div>

          <div className="lp-menu-grid">
            {menuLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="lp-menu-card" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="lp-skeleton" style={{ height: 190 }} />
                    <div className="lp-menu-card__body">
                      <div className="lp-skeleton" style={{ height: 18, marginBottom: 8, borderRadius: 6 }} />
                      <div className="lp-skeleton" style={{ height: 13, marginBottom: 6, borderRadius: 6, width: '75%' }} />
                      <div className="lp-skeleton" style={{ height: 13, marginBottom: 16, borderRadius: 6, width: '55%' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="lp-skeleton" style={{ height: 20, width: 80, borderRadius: 6 }} />
                        <div className="lp-skeleton" style={{ height: 34, width: 90, borderRadius: 20 }} />
                      </div>
                    </div>
                  </div>
                ))
              : filtered.length === 0
                ? <div className="lp-menu-empty">🍽️ {T.menu_empty}</div>
                : filtered.map((item, i) => {
                    const inCart = cart.find(c => c.item.id === item.id)
                    const catBg = `linear-gradient(135deg, #1a0d06, #2d1608)`
                    return (
                      <div
                        key={item.id}
                        className="lp-menu-card"
                        style={{ animationDelay: `${(i % 8) * 0.07}s` }}
                      >
                        <div className="lp-menu-card__img">
                          {item.image_url
                            ? <img
                                src={item.image_url}
                                alt={item.name}
                                loading="lazy"
                                onError={e => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling && (e.target.nextSibling.style.display = 'flex')
                                }}
                              />
                            : null
                          }
                          <div
                            className="lp-menu-card__img-placeholder"
                            style={{ display: item.image_url ? 'none' : 'flex', background: catBg }}
                          >
                            {getCatEmoji(item.category)}
                          </div>
                          {item.category && <span className="lp-menu-card__badge">{item.category}</span>}
                          {inCart && <span className="lp-menu-card__qty">{inCart.qty}</span>}
                        </div>
                        <div className="lp-menu-card__body">
                          <div className="lp-menu-card__name">{item.name}</div>
                          <div className="lp-menu-card__desc">{item.description || ''}</div>
                          <div className="lp-menu-card__footer">
                            <div className="lp-menu-card__price">{fmt(item.price)}</div>
                            <button
                              className="lp-menu-card__add"
                              onClick={() => { addToCart(item); addToast(T.toast_added(item.name)) }}
                            >
                              + {T.menu_add}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
            }
          </div>
        </div>
      </section>

      {/* ══════════ OFFERS ════════════════════════════════════════════════ */}
      <div className="lp-section-wrap lp-section-wrap--alt">
        <div className="lp-section">
          <div className="lp-section__header lp-reveal">
            <div className="lp-section__label">{T.offers_label}</div>
            <h2 className="lp-section__title">{T.offers_title} <em>{T.offers_title_orange}</em></h2>
          </div>
          <div className="lp-offers-grid">
            {[
              { cls: 'lp-offer-card--1', icon: '🚚', title: T.offer1_title, desc: T.offer1_desc },
              { cls: 'lp-offer-card--2', icon: '🔥', title: T.offer2_title, desc: T.offer2_desc },
              { cls: 'lp-offer-card--3', icon: '⭐', title: T.offer3_title, desc: T.offer3_desc },
            ].map((o, i) => (
              <div key={i} className={`lp-offer-card ${o.cls} lp-reveal`} style={{ animationDelay: `${i * 0.12}s` }}>
                <span className="lp-offer-card__icon">{o.icon}</span>
                <div className="lp-offer-card__title">{o.title}</div>
                <div className="lp-offer-card__desc">{o.desc}</div>
                <div className="lp-offer-card__deco" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ HOW IT WORKS ══════════════════════════════════════════ */}
      <section id="haqimizda">
        <div className="lp-section">
          <div className="lp-section__header lp-reveal">
            <div className="lp-section__label">{T.how_label}</div>
            <h2 className="lp-section__title">{T.how_title} <em>{T.how_title_orange}</em></h2>
          </div>
          <div className="lp-steps">
            {[
              { icon: '🛒', title: T.step1_title, desc: T.step1_desc },
              { icon: '📋', title: T.step2_title, desc: T.step2_desc },
              { icon: '🚀', title: T.step3_title, desc: T.step3_desc },
            ].map((s, i) => (
              <div key={i} className="lp-step-card lp-reveal" style={{ animationDelay: `${i * 0.13}s` }}>
                <div className="lp-step-card__num">{s.icon}</div>
                <span className="lp-step-card__step">{T.step_label(i + 1)}</span>
                <div className="lp-step-card__title">{s.title}</div>
                <div className="lp-step-card__desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════════════════════════════════════ */}
      <div className="lp-section-wrap lp-section-wrap--alt">
        <div className="lp-section">
          <div className="lp-section__header lp-reveal">
            <div className="lp-section__label">{T.test_label}</div>
            <h2 className="lp-section__title">{T.test_title} <em>{T.test_title_orange}</em></h2>
          </div>
          <div className="lp-testimonials-grid">
            {T.reviews.map((r, i) => (
              <div key={i} className="lp-testi-card lp-reveal" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="lp-testi-card__stars">★★★★★</div>
                <p className="lp-testi-card__text">"{r.text}"</p>
                <div className="lp-testi-card__author">
                  <div className="lp-testi-card__avatar" style={{ background: r.color }}>{r.avatar}</div>
                  <div>
                    <div className="lp-testi-card__name">{r.name}</div>
                    <div className="lp-testi-card__sub">{r.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ FOOTER ════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div>
            <div className="lp-footer__logo">🍽️ ECO <span>Taomlar</span></div>
            <p className="lp-footer__desc">{T.footer_desc}</p>
            <div className="lp-footer__contact">
              <a href={`tel:${T.footer_phone.replace(/\s/g, '')}`}>📞 {T.footer_phone}</a>
              <span>📍 {T.footer_address}</span>
              <span>🕐 {T.footer_hours}</span>
            </div>
          </div>
          <div>
            <div className="lp-footer__col-title">{T.footer_links_title}</div>
            <div className="lp-footer__links">
              <a href="#menu" onClick={e => { e.preventDefault(); scrollTo('menu') }}>{T.nav_menu}</a>
              <a href="#haqimizda" onClick={e => { e.preventDefault(); scrollTo('haqimizda') }}>{T.nav_about}</a>
            </div>
          </div>
          <div>
            <div className="lp-footer__col-title">{T.footer_contact_title}</div>
            <div className="lp-footer__links">
              <a href={`tel:${T.footer_phone.replace(/\s/g, '')}`}>{T.footer_phone}</a>
              <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{T.footer_address}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{T.footer_hours}</span>
            </div>
          </div>
          <div>
            <div className="lp-footer__col-title">{T.footer_staff_title}</div>
            <div className="lp-footer__links">
              <a href="/staff">{T.footer_staff_link}</a>
              <a href="/admin">Admin panel</a>
            </div>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <span className="lp-footer__copy">{T.footer_copy}</span>
          <span className="lp-footer__tagline">{T.footer_tagline}</span>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          OVERLAYS / PANELS
      ══════════════════════════════════════════════════════════════════ */}

      {/* ─── CART SIDEBAR ───────────────────────────────────────────── */}
      {showCart && (
        <>
          <div className="lp-overlay" onClick={() => setShowCart(false)} />
          <aside className="lp-cart">
            <div className="lp-cart__header">
              <span className="lp-cart__title">🛒 {T.cart}{cartCount > 0 ? ` (${cartCount})` : ''}</span>
              <button className="lp-cart__close" onClick={() => setShowCart(false)}>✕</button>
            </div>

            <div className="lp-cart__body">
              {cart.length === 0 ? (
                <div className="lp-cart__empty">
                  <span className="lp-cart__empty-icon">🛒</span>
                  <span>{lang === 'uz' ? "Savat bo'sh" : 'Корзина пуста'}</span>
                </div>
              ) : cart.map(({ item, qty }) => (
                <div key={item.id} className="lp-cart-item">
                  <div className="lp-cart-item__img">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} onError={e => e.target.style.display = 'none'} />
                      : getCatEmoji(item.category)
                    }
                  </div>
                  <div className="lp-cart-item__info">
                    <div className="lp-cart-item__name">{item.name}</div>
                    <div className="lp-cart-item__price">{fmt(item.price * qty)}</div>
                  </div>
                  <div className="lp-cart-item__qty">
                    <button className="lp-qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                    <span className="lp-qty-val">{qty}</span>
                    <button className="lp-qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                  </div>
                  <button className="lp-cart-item__remove" onClick={() => { removeItem(item.id); addToast(T.toast_removed(item.name)) }}>
                    🗑
                  </button>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="lp-cart__footer">
                <div className="lp-cart__total">
                  {lang === 'uz' ? 'Jami:' : 'Итого:'}<strong>{fmt(cartTotal)}</strong>
                </div>
                <button className="lp-cart__checkout" onClick={openCheckout}>
                  📦 {lang === 'uz' ? 'Buyurtma berish' : 'Оформить заказ'}
                </button>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ─── AUTH MODAL ─────────────────────────────────────────────── */}
      {showAuth && (
        <div className="lp-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowAuth(false) }}>
          <div className="lp-modal">
            <div className="lp-modal__head">
              <span className="lp-modal__title">
                {authTab === 'register' ? `🍽️ ${T.auth_register}` : `👤 ${T.auth_login}`}
              </span>
              <button className="lp-modal__close" onClick={() => setShowAuth(false)}>✕</button>
            </div>

            <div className="lp-modal__tabs">
              <button className={`lp-modal__tab${authTab === 'register' ? ' lp-modal__tab--active' : ''}`}
                onClick={() => { setAuthTab('register'); setAuthError('') }}>{T.auth_register}</button>
              <button className={`lp-modal__tab${authTab === 'login' ? ' lp-modal__tab--active' : ''}`}
                onClick={() => { setAuthTab('login'); setAuthError('') }}>{T.auth_login}</button>
            </div>

            <div className="lp-modal__body">
              {authError && <div className="lp-error-msg">{authError}</div>}

              <div className="lp-form-group">
                <label>{T.auth_phone}</label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={authPhone}
                  onChange={e => setAuthPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                  autoFocus
                />
              </div>

              {authTab === 'register' && (
                <>
                  <div className="lp-form-group">
                    <label>{T.auth_fname}</label>
                    <input
                      type="text"
                      placeholder={lang === 'uz' ? 'Ismingiz' : 'Ваше имя'}
                      value={authFName}
                      onChange={e => setAuthFName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>{T.auth_lname}</label>
                    <input
                      type="text"
                      placeholder={lang === 'uz' ? 'Familiyangiz' : 'Ваша фамилия'}
                      value={authLName}
                      onChange={e => setAuthLName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    />
                  </div>
                  <p className="lp-modal__note">{T.auth_note}</p>
                </>
              )}
              {authTab === 'login' && <p className="lp-modal__note">{T.auth_login_note}</p>}

              <button className="lp-modal__submit" onClick={handleAuth} disabled={authLoading}>
                {authLoading
                  ? <><span className="lp-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {lang === 'uz' ? 'Kutib turing...' : 'Подождите...'}</>
                  : (authTab === 'register' ? T.auth_register_btn : T.auth_login_btn)
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHECKOUT MODAL ─────────────────────────────────────────── */}
      {showCheckout && (
        <div className="lp-modal-bg" onClick={e => { if (e.target === e.currentTarget && !coLoading) setShowCheckout(false) }}>
          <div className="lp-modal lp-checkout">
            {coSuccess ? (
              <div className="lp-success-anim">
                <span className="lp-success-anim__icon">🎉</span>
                <div className="lp-success-anim__title">{T.success_title}</div>
                <p className="lp-success-anim__sub">{T.success_sub}</p>
              </div>
            ) : (
              <>
                <div className="lp-modal__head">
                  <span className="lp-modal__title">📦 {T.checkout_title}</span>
                  <button className="lp-modal__close" onClick={() => setShowCheckout(false)}>✕</button>
                </div>
                <div className="lp-modal__body">
                  <div className="lp-form-group">
                    <label>{T.checkout_items}</label>
                  </div>
                  <div className="lp-checkout-items">
                    {cart.map(({ item, qty }) => (
                      <div key={item.id} className="lp-checkout-item">
                        <span className="lp-checkout-item__name">{item.name}</span>
                        <span className="lp-checkout-item__qty">× {qty}</span>
                        <span className="lp-checkout-item__price">{fmt(item.price * qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="lp-form-group">
                    <label>{T.checkout_address} *</label>
                    <textarea rows={3} placeholder={T.checkout_address_ph}
                      value={coAddr} onChange={e => setCoAddr(e.target.value)} />
                  </div>
                  <div className="lp-form-group">
                    <label>{T.checkout_note}</label>
                    <textarea rows={2} placeholder={T.checkout_note_ph}
                      value={coNote} onChange={e => setCoNote(e.target.value)} />
                  </div>

                  <div className="lp-form-group">
                    <label>{T.checkout_promo}</label>
                    <div className="lp-promo-row">
                      <input
                        type="text"
                        placeholder={T.checkout_promo_ph}
                        value={coPromo}
                        onChange={e => { setCoPromo(e.target.value); setPromoResult(null) }}
                      />
                      <button className="lp-promo-apply" onClick={applyPromo}
                        disabled={promoLoading || !coPromo.trim()}>
                        {promoLoading
                          ? <span className="lp-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          : T.checkout_promo_apply
                        }
                      </button>
                    </div>
                  </div>

                  {promoResult && (
                    <div className="lp-promo-success">
                      🎉 {T.toast_promo_ok(promoResult.discount_percent)}
                    </div>
                  )}

                  <div className="lp-checkout-total">
                    <span className="lp-checkout-total__label">{T.checkout_total}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {promoResult && <span className="lp-checkout-total__old">{fmt(cartTotal)}</span>}
                      <span className="lp-checkout-total__price">{fmt(discountedTotal)}</span>
                    </div>
                  </div>

                  {coError && <div className="lp-error-msg">{coError}</div>}

                  <button className="lp-modal__submit" onClick={submitOrder} disabled={coLoading}>
                    {coLoading
                      ? <><span className="lp-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...'}</>
                      : `🚀 ${T.checkout_btn}`
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── ORDERS PANEL ───────────────────────────────────────────── */}
      {showOrders && (
        <>
          <div className="lp-overlay" onClick={() => setShowOrders(false)} />
          <aside className="lp-orders">
            <div className="lp-orders__header">
              <span className="lp-orders__title">📦 {T.orders_title}</span>
              <button className="lp-orders__new-btn" onClick={() => { setShowOrders(false); scrollTo('menu') }}>
                {T.orders_new}
              </button>
              <button className="lp-orders__close" onClick={() => setShowOrders(false)}>✕</button>
            </div>

            <div className="lp-orders__body">
              {ordersLoading ? (
                <div className="lp-orders__loading"><div className="lp-spinner" /><span>{T.orders_loading}</span></div>
              ) : orders.length === 0 ? (
                <div className="lp-orders__empty"><span style={{ fontSize: '2.5rem' }}>📭</span><span>{T.orders_empty}</span></div>
              ) : orders.map(order => {
                const stepIdx    = STATUS_STEPS.indexOf(order.status)
                const isCancelled = order.status === 'cancelled'
                const canCancel  = ['pending', 'cooking'].includes(order.status)

                return (
                  <div key={order.id} className={`lp-order-card${flashOrders.has(order.order_code) ? ' lp-order-card--updated' : ''}`}>
                    <div className="lp-order-card__top">
                      <span className="lp-order-card__code">#{order.order_code}</span>
                      <span className="lp-order-card__date">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      <span className={`lp-status-badge lp-status-badge--${order.status}`}>
                        {T[STATUS_KEY[order.status]] || order.status}
                      </span>
                    </div>

                    <div className="lp-order-card__items">
                      {(order.items || []).map((it, j) => (
                        <div key={j} className="lp-order-card__item">
                          <span>{it.menu_item_name || it.name || it.menu_item?.name || `#${it.menu_item_id}`}{it.quantity > 1 ? ` × ${it.quantity}` : ''}</span>
                          <span className="lp-order-card__item-price">{it.price ? fmt(it.price * (it.quantity || 1)) : ''}</span>
                        </div>
                      ))}
                    </div>

                    <div className="lp-order-card__total">
                      {T.order_total} <span>{fmt(order.total_price || order.total || order.final_price || 0)}</span>
                    </div>

                    {!isCancelled && (
                      <div className="lp-status-bar">
                        <div className="lp-status-bar__steps">
                          {STATUS_STEPS.map((step, si) => (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                              <div className={`lp-status-step${si === stepIdx ? ' lp-status-step--active' : ''}${si < stepIdx ? ' lp-status-step--done' : ''}`}>
                                <div className="lp-status-step__dot" />
                                <span className="lp-status-step__label">{T[STATUS_KEY[step]]}</span>
                              </div>
                              {si < STATUS_STEPS.length - 1 && (
                                <div className={`lp-status-connector${si < stepIdx ? ' lp-status-connector--done' : ''}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {canCancel && (
                      <button className="lp-order-card__cancel" onClick={() => cancelOrder(order.order_code)}>
                        ✕ {T.order_cancel}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        </>
      )}

      {/* ─── TOAST CONTAINER ────────────────────────────────────────── */}
      <div className="lp-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`lp-toast lp-toast--${t.type}${t.exiting ? ' lp-toast--exiting' : ''}`}>
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  )
}
