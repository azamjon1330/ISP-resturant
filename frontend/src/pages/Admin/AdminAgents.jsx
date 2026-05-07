import React, { useState, useEffect } from 'react'
import { agentsAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Users, Star, CreditCard, X, Check, ChevronRight, Gift } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import './AdminAgents.css'

const emptyForm = { name: '', phone: '', regular_card_count: 20, discount_amount: 20000, bonus_threshold: 10, referral_bonus_threshold: 20 }

export default function AdminAgents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [bonuses, setBonuses] = useState([])

  useEffect(() => { loadAgents() }, [])

  const loadAgents = async () => {
    setLoading(true)
    try { const r = await agentsAPI.getAll(); setAgents(r.data) }
    catch { toast.error('Юкланмади') }
    finally { setLoading(false) }
  }

  const selectAgent = async (agent) => {
    setSelected(agent)
    try {
      const r = await agentsAPI.getById(agent.id)
      setSelected(r.data)
      const b = await agentsAPI.getBonuses(agent.id)
      setBonuses(b.data)
    } catch {}
  }

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await agentsAPI.create({ ...form, regular_card_count: +form.regular_card_count, discount_amount: +form.discount_amount, bonus_threshold: +form.bonus_threshold, referral_bonus_threshold: +form.referral_bonus_threshold })
      setAgents(a => [res.data, ...a])
      setShowCreate(false)
      setForm(emptyForm)
      toast.success(`Агент яратилди: ${res.data.code}`)
    } catch (e) { toast.error(e.response?.data?.error || 'Хатолик') }
    finally { setSaving(false) }
  }

  return (
    <div className="agents-page">
      <div className="agents-left">
        <div className="page-header-row">
          <div><h1>Реферал агентлар</h1><p className="sub">{agents.length} та агент</p></div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Агент</button>
        </div>

        {loading ? <div className="page-loading">Юкланмоқда...</div> : (
          <div className="agents-list">
            {agents.map(agent => (
              <div key={agent.id} className={`agent-row ${selected?.id === agent.id ? 'active' : ''}`} onClick={() => selectAgent(agent)}>
                <div className="agent-avatar"><Users size={18} /></div>
                <div className="agent-row-info">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-code">#{agent.code}</span>
                </div>
                <div className="agent-row-stats">
                  <span className="stat-pill gold"><Star size={10} /> {agent.gold_card_uses}</span>
                  <span className="stat-pill">{agent.referral_card_total_uses} реф</span>
                </div>
                <ChevronRight size={16} color="var(--gray-400)" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="agents-right">
        {selected ? (
          <div>
            <div className="agent-detail-header">
              <div className="agent-big-avatar"><Users size={28} /></div>
              <div>
                <h2>{selected.name}</h2>
                <div className="agent-code-big">#{selected.code}</div>
                {selected.phone && <p className="agent-phone">{selected.phone}</p>}
              </div>
            </div>

            <div className="agent-stats-row">
              <div className="astat"><span className="astat-val">{selected.gold_card_uses}</span><span className="astat-label">Олтин карта</span></div>
              <div className="astat"><span className="astat-val">{selected.referral_card_total_uses}</span><span className="astat-label">Реферал</span></div>
              <div className="astat"><span className="astat-val">{selected.total_bonus_earned}</span><span className="astat-label">Бонус</span></div>
              <div className="astat"><span className="astat-val">{selected.discount_amount?.toLocaleString()}</span><span className="astat-label">Скидка (сум)</span></div>
            </div>

            <div className="card" style={{marginBottom: 16}}>
              <h3 className="section-title">Олтин карта</h3>
              <div className="gold-card">
                <div className="gold-card-left">
                  <Star size={20} color="#F59E0B" fill="#F59E0B" />
                  <div>
                    <p className="gc-code">{selected.gold_card_code}</p>
                    <p className="gc-info">{selected.gold_card_uses} / {selected.bonus_threshold} визит → бонус</p>
                  </div>
                </div>
                <QRCodeSVG value={selected.gold_card_code} size={60} />
              </div>
            </div>

            <div className="card" style={{marginBottom: 16}}>
              <h3 className="section-title">Реферал карталар ({selected.cards?.filter(c => c.card_type === 'regular').length} та)</h3>
              <div className="cards-list">
                {selected.cards?.filter(c => c.card_type === 'regular').map(card => (
                  <div key={card.id} className={`ref-card ${!card.is_active ? 'inactive' : ''}`}>
                    <CreditCard size={14} />
                    <span className="ref-code">{card.card_code}</span>
                    <span className="ref-uses">{card.use_count}×</span>
                    <QRCodeSVG value={card.card_code} size={32} />
                  </div>
                ))}
              </div>
            </div>

            {bonuses.length > 0 && (
              <div className="card">
                <h3 className="section-title">Бонуслар ({bonuses.length})</h3>
                {bonuses.map(b => (
                  <div key={b.id} className={`bonus-row ${b.used ? 'used' : ''}`}>
                    <Gift size={14} color={b.bonus_type === 'gold_meal' ? '#F59E0B' : 'var(--green)'} />
                    <span>{b.description}</span>
                    <span className="bonus-amount">{b.amount?.toLocaleString()} сум</span>
                    <span className={`badge ${b.used ? 'badge-gray' : 'badge-green'}`}>{b.used ? 'Ишлатилди' : 'Актив'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="agent-empty">
            <Users size={48} opacity={0.2} />
            <p>Агентни танланг</p>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal-card slide-in">
            <div className="modal-header">
              <h2>Янги агент яратиш</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={create}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="label">Исм *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="label">Телефон</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998..." />
                </div>
                <div className="form-group">
                  <label className="label">Реферал карталар сони</label>
                  <input className="input" type="number" value={form.regular_card_count} onChange={e => setForm(f => ({ ...f, regular_card_count: e.target.value }))} min="1" max="100" />
                </div>
                <div className="form-group">
                  <label className="label">Скидка миқдори (сум)</label>
                  <input className="input" type="number" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} min="0" />
                </div>
                <div className="form-group">
                  <label className="label">Олтин карта бонус (ташриф)</label>
                  <input className="input" type="number" value={form.bonus_threshold} onChange={e => setForm(f => ({ ...f, bonus_threshold: e.target.value }))} min="1" />
                </div>
                <div className="form-group">
                  <label className="label">Реферал бонус (ишлатиш)</label>
                  <input className="input" type="number" value={form.referral_bonus_threshold} onChange={e => setForm(f => ({ ...f, referral_bonus_threshold: e.target.value }))} min="1" />
                </div>
              </div>
              <p className="form-hint">Агентга автоматик 7 рақамли код ва QR карталар берилади</p>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Бекор</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Check size={16} /> {saving ? 'Яратилмоқда...' : 'Яратиш'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
