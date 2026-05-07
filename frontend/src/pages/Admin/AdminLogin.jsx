import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import './AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('youit_token')
  if (token) {
    return <Navigate to="/admin/" replace />
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(form.username, form.password)
      localStorage.setItem('youit_token', res.data.token)
      navigate('/admin/', { replace: true })
    } catch {
      toast.error('Нотўғри логин ёки парол')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-brand-emoji">🍽️</span>
          <h1>YouIt Café</h1>
          <p>Миллий таомлар кафеси<br />бошқарув тизими</p>
        </div>
        <div className="login-dishes">
          <span>🥘</span>
          <span>🍜</span>
          <span>🫕</span>
          <span>🥗</span>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card slide-in">
          <p className="login-card-title">Кириш</p>
          <p className="login-card-sub">Админ панелига кириш учун маълумотларни киритинг</p>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="label">Логин</label>
              <input
                className="input"
                type="text"
                placeholder="Логинни киритинг"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="label">Парол</label>
              <div className="pass-wrap">
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Паролни киритинг"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Кириш...' : '🔐 Кириш'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
