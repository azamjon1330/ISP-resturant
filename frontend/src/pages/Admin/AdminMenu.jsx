import React, { useState, useEffect } from 'react'
import { menuAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Check } from 'lucide-react'
import './AdminMenu.css'

const emptyForm = { name: '', description: '', price: '', category: 'Основные блюда', image_url: '', available: true }
const categories = ['Основные блюда', 'Супы', 'Гриль', 'Выпечка', 'Напитки', 'Десерты']

export default function AdminMenu() {
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadMenu() }, [])

  const loadMenu = async () => {
    setLoading(true)
    try { const r = await menuAPI.getAll(); setMenu(r.data) }
    catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, description: item.description, price: item.price, category: item.category, image_url: item.image_url, available: item.available })
    setShowModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, price: parseFloat(form.price) }
      if (editItem) {
        await menuAPI.update(editItem.id, data)
        setMenu(m => m.map(i => i.id === editItem.id ? { ...i, ...data } : i))
        toast.success('Янгиланди')
      } else {
        const res = await menuAPI.create(data)
        setMenu(m => [...m, res.data])
        toast.success('Қўшилди')
      }
      setShowModal(false)
    } catch { toast.error('Хатолик') }
    finally { setSaving(false) }
  }

  const del = async (item) => {
    if (!confirm(`"${item.name}" ни ўчиришни тасдиқлайсизми?`)) return
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

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Меню бошқаруви</h1>
          <p className="page-header">{menu.length} та таом</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Янги таом
        </button>
      </div>

      {loading ? <div className="page-loading">Юкланмоқда...</div> : (
        <div className="menu-admin-grid">
          {menu.map(item => (
            <div key={item.id} className={`menu-admin-card ${!item.available ? 'unavailable' : ''}`}>
              <div className="mac-header">
                <span className="mac-category">{item.category}</span>
                <button className="toggle-btn" onClick={() => toggle(item)}>
                  {item.available ? <ToggleRight size={22} color="var(--green)" /> : <ToggleLeft size={22} color="var(--gray-400)" />}
                </button>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="mac-footer">
                <span className="mac-price">{item.price?.toLocaleString()} сум</span>
                <div className="mac-actions">
                  <button className="icon-btn" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                  <button className="icon-btn danger" onClick={() => del(item)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-card slide-in">
            <div className="modal-header">
              <h2>{editItem ? 'Таомни таҳрирлаш' : 'Янги таом қўшиш'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="label">Номи *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="label">Нарх (сум) *</label>
                  <input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Тавсиф</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Категория</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Расм URL (ихтиёрий)</label>
                <input className="input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Бекор</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
