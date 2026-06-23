import React, { useState, useEffect } from 'react'
import { staffAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Loader, KeyRound, Eye, EyeOff } from 'lucide-react'
import './AdminLayout.css'

const ROLES = [
  { value: 'cashier', label: 'Касса',   color: 'adm-badge-green' },
  { value: 'kitchen', label: 'Ошхона',  color: 'adm-badge-gray'  },
  { value: 'admin',   label: 'Админ',   color: 'adm-badge-green' },
]
const roleLabel = (r) => ROLES.find(x => x.value === r)?.label || r
const roleColor = (r) => ROLES.find(x => x.value === r)?.color || 'adm-badge-gray'

const fmt = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('uz-UZ')
}

const EMPTY = { username: '', password: '', role: 'cashier' }

export default function AdminStaff() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try { const r = await staffAPI.list(); setList(r.data || []) }
    catch { toast.error('Yuklanmadi') }
    finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowPass(false); setModal(true) }
  const openEdit = (u) => {
    setEditing(u)
    setForm({ username: u.username, password: '', role: u.role })
    setShowPass(false)
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY) }

  const save = async (e) => {
    e.preventDefault()
    if (!editing && (!form.username.trim() || !form.password.trim())) {
      toast.error('Логин ва парол киритилиши шарт')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const payload = { role: form.role }
        if (form.password.trim()) payload.password = form.password.trim()
        await staffAPI.update(editing.id, payload)
        toast.success('Янгиланди')
      } else {
        await staffAPI.create({
          username: form.username.trim(),
          password: form.password.trim(),
          role: form.role,
        })
        toast.success('Логин қўшилди')
      }
      closeModal()
      load()
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Хато')
    } finally { setSaving(false) }
  }

  const remove = async (u) => {
    if (!window.confirm(`«${u.username}» логинини ўчирасизми?`)) return
    try { await staffAPI.delete(u.id); toast.success('Ўчирилди'); load() }
    catch (e) { toast.error(e?.response?.data?.error || 'Хато') }
  }

  return (
    <div>
      <div className="adm-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🔑 Логинлар</h1>
            <p>Касса ва ошхона ходимлари учун кириш маълумотлари — {list.length} та</p>
          </div>
          <button onClick={openNew} style={{
            padding: '10px 18px', borderRadius: 10, border: 'none', background: '#FF6B35',
            color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'Inter, sans-serif',
          }}>
            <Plus size={16} /> Янги логин
          </button>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16, padding: 16, fontSize: 13, color: '#6B7280' }}>
        <KeyRound size={14} style={{ verticalAlign: -2, color: '#FF6B35' }} />{' '}
        Ходим <b>/cashier</b> ёки <b>/kitchen</b> саҳифасини очганда шу логин-парол сўралади.
        Кириш қурилмада сақланади (телефон ёки планшет) ва ҳар сафар серверда текширилади.
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /></div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Логин</th>
                <th>Роль</th>
                <th>Яратилган</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>
                  Логинлар йўқ
                </td></tr>
              ) : list.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{u.username}</td>
                  <td><span className={`adm-badge ${roleColor(u.role)}`}>{roleLabel(u.role)}</span></td>
                  <td style={{ fontSize: 12, color: '#6B7280' }}>{fmt(u.created_at)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(u)} style={btn('#0EA5E9')}><Edit2 size={13} /></button>
                    <button onClick={() => remove(u)} style={btn('#EF4444')}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="adm-modal-bg" onClick={closeModal}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="adm-modal-head">
              <h2>{editing ? 'Логинни таҳрирлаш' : 'Янги логин'}</h2>
              <button className="adm-modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={save} style={{ padding: 24 }}>
              <div className="adm-field">
                <label className="adm-label">Логин *</label>
                <input className="adm-input" value={form.username}
                  disabled={!!editing}
                  placeholder="масалан: kassa1"
                  style={editing ? { background: '#F3F4F6', color: '#9CA3AF' } : undefined}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required={!editing} />
              </div>

              <div className="adm-field">
                <label className="adm-label">{editing ? 'Янги парол (ихтиёрий)' : 'Парол *'}</label>
                <div style={{ position: 'relative' }}>
                  <input className="adm-input" type={showPass ? 'text' : 'password'}
                    placeholder={editing ? 'Ўзгартирмаслик учун бўш қолдиринг' : 'Парол'}
                    value={form.password}
                    style={{ paddingRight: 44 }}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required={!editing} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4,
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="adm-field">
                <label className="adm-label">Роль *</label>
                <select className="adm-input" value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button type="button" onClick={closeModal} style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                  background: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                }}>Бекор</button>
                <button type="submit" disabled={saving} style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: '#FF6B35', color: 'white', cursor: 'pointer', fontWeight: 700,
                  fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {saving ? <Loader size={16} className="adm-spin" /> : (editing ? 'Сақлаш' : 'Қўшиш')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const btn = (color) => ({
  marginRight: 4,
  padding: '5px 8px', borderRadius: 6, border: '1px solid ' + color,
  background: 'white', color, cursor: 'pointer',
})
