import React, { useState, useEffect } from 'react'
import { adminReviewsAPI } from '../../api'
import toast from 'react-hot-toast'
import { Star, Trash2, Loader, MessageSquare, RefreshCw } from 'lucide-react'
import '../Admin/AdminLayout.css'

const fmtDate = iso => {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const initials = name => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminReviewsAPI.getAll()
      setReviews(r.data || [])
    } catch {
      toast.error('Юкланмади')
    } finally {
      setLoading(false)
    }
  }

  const deleteReview = async (id) => {
    if (!window.confirm('Ушбу шархни ўчирмоқчимисиз?')) return
    setDeletingId(id)
    try {
      await adminReviewsAPI.delete(id)
      setReviews(prev => prev.filter(r => r.id !== id))
      toast.success('Шарх ўчирилди')
    } catch {
      toast.error('Хатолик')
    } finally {
      setDeletingId(null)
    }
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <div>
      <div className="adm-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
            <MessageSquare size={22} color="#FF6B35" /> Шархлар
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            Жами: {reviews.length} та шарх · Ўртача рейтинг: {avg}
          </p>
        </div>
        <button
          className="adm-btn adm-btn-secondary"
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={15} /> Янгилаш
        </button>
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /></div>
      ) : reviews.length === 0 ? (
        <div className="adm-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 60 }}>
          <MessageSquare size={64} color="#E5E7EB" />
          <p style={{ margin: 0, fontSize: 15 }}>Шархлар мавжуд эмас</p>
        </div>
      ) : (
        <div className="arv-grid">
          {reviews.map(rv => (
            <div key={rv.id} className="adm-card arv-card">
              <div className="arv-header">
                <div className="arv-author">
                  <div className="arv-av">{initials(rv.customer_name)}</div>
                  <div>
                    <p className="arv-name">{rv.customer_name || 'Мижоз'}</p>
                    {rv.order_code && <p className="arv-order">#{rv.order_code}</p>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="arv-stars">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14}
                        fill={s <= rv.rating ? '#D4A853' : 'none'}
                        color={s <= rv.rating ? '#D4A853' : '#D1D5DB'}
                      />
                    ))}
                  </div>
                  <p className="arv-date">{fmtDate(rv.created_at)}</p>
                </div>
              </div>
              {rv.comment && <p className="arv-comment">"{rv.comment}"</p>}
              <div className="arv-footer">
                <button
                  className="arv-del-btn"
                  onClick={() => deleteReview(rv.id)}
                  disabled={deletingId === rv.id}
                >
                  {deletingId === rv.id
                    ? <Loader size={13} className="adm-spinner" style={{ width: 13, height: 13, border: '2px solid #FCA5A5', borderTopColor: '#EF4444', borderRadius: '50%', animation: 'adm-spin 0.6s linear infinite', display: 'inline-block' }} />
                    : <><Trash2 size={13} /> Ўчириш</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
