import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Check, ChefHat, ExternalLink } from 'lucide-react'
import '../Admin/AdminLayout.css'

const CATS = ['Основные блюда', 'Супы', 'Гриль', 'Выпечка', 'Напитки', 'Десерты']
const EMPTY = { name: '', description: '', price: '', category: 'Основные блюда', image_url: '', available: true }

export default function AdminMenu() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const r = await menuAPI.getAll(); setMenu(r.data) }
    catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ name: item.name, description: item.description || '', price: item.price, category: item.category, image_url: item.image_url || '', available: item.available })
    setModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, price: parseFloat(form.price) }
      if (editing) {
        await menuAPI.update(editing.id, data)
        setMenu(m => m.map(i => i.id === editing.id ? { ...i, ...data } : i))
        toast.success('Янгиланди')
      } else {
        const res = await menuAPI.create(data)
        setMenu(m => [...m, res.data])
        toast.success('Қўшилди')
      }
      setModal(false)
    } catch { toast.error('Хатолик') }
    finally { setSaving(false) }
  }

  const del = async (item) => {
    if (!window.confirm(`"${item.name}" ни ўчиришни тасдиқлайсизми?`)) return
    try {
      await menuAPI.delete(item.id)
      setMenu(m => m.filter(i => i.id !== item.id))
      toast.success('Ўчирилди')
    } catch { toast.error('Хатолик') }
  }

  const toggle = async (item) => {
    try {
      await menuAPI.toggleAvailability(item.id, !item.available)
      setMenu(m => m.map(i => i.id === item.id ? { ...i, available: !i.available } : i))
    } catch { toast.error('Хатолик') }
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="adm-page-header" style={{ margin: 0 }}>
          <h1>🍜 Меню бошқаруви</h1>
          <p>{menu.length} та таом</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openNew}>
          <Plus size={16} /> Янги таом
        </button>
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Юкланмоқда...</span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {menu.map(item => (
            <div key={item.id} className="adm-card" style={{ opacity: item.available ? 1 : 0.6, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="adm-badge adm-badge-orange" style={{ fontSize: 11 }}>{item.category}</span>
                <button onClick={() => toggle(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  {item.available
                    ? <ToggleRight size={24} color="#10B981" />
                    : <ToggleLeft size={24} color="#9CA3AF" />}
                </button>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{item.name}</h3>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 10px', lineHeight: 1.4, minHeight: 36 }}>
                {item.description || '—'}
              </p>

              {/* Food cost info strip */}
              {item.food_cost > 0 && (
                <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#6B7280' }}>Таннарх: <strong style={{ color: '#374151' }}>{Number(item.food_cost).toLocaleString()}</strong></span>
                  {item.markup_percent > 0 && (
                    <span style={{ color: '#FF6B35', fontWeight: 700 }}>+{item.markup_percent}%</span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#FF6B35' }}>{item.price?.toLocaleString()} сум</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Recipe detail link */}
                  <button
                    onClick={() => navigate(`/admin/menu/${item.id}`)}
                    title="Рецепт ва таннарх"
                    style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #DBEAFE', background: '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ChefHat size={14} color="#2563EB" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Edit2 size={14} color="#374151" />
                  </button>
                  <button
                    onClick={() => del(item)}
                    style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h2>{editing ? 'Таомни таҳрирлаш' : 'Янги таом қўшиш'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={save}>
              <div className="adm-form-row">
                <div className="adm-field">
                  <label className="adm-label">Номи *</label>
                  <input className="adm-input" value={form.name} onChange={f('name')} required />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Нарх (сум) *</label>
                  <input className="adm-input" type="number" value={form.price} onChange={f('price')} required min="0" />
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-label">Тавсиф</label>
                <textarea className="adm-input" rows={2} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} />
              </div>
              <div className="adm-field">
                <label className="adm-label">Категория</label>
                <select className="adm-input" value={form.category} onChange={f('category')}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">Расм URL (ихтиёрий)</label>
                <input className="adm-input" value={form.image_url} onChange={f('image_url')} placeholder="https://..." />
              </div>

              {editing && (
                <div style={{ background: '#EFF6FF', borderRadius: 9, padding: '10px 14px', marginBottom: 4, fontSize: 12, color: '#1D4ED8' }}>
                  💡 Рецепт ва устама % ни созлаш учун <ExternalLink size={11} style={{ display: 'inline' }} />{' '}
                  <button type="button" onClick={() => { setModal(false); navigate(`/admin/menu/${editing.id}`) }}
                    style={{ background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', fontWeight: 700, padding: 0, fontFamily: 'inherit', fontSize: 12 }}>
                    Рецепт саҳифасига ўтинг
                  </button>
                </div>
              )}

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setModal(false)}>Бекор</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  <Check size={16} /> {saving ? 'Сақланмоқда...' : 'Сақлаш'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
