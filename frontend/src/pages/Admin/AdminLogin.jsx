import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import './AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  if (localStorage.getItem('youit_token')) {
    navigate('/admin/dashboard', { replace: true })
    return null
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
      <div className="login-card slide-in">
        <div className="login-icon">
          <ShieldCheck size={32} color="var(--orange)" />
        </div>
        <h1>Админ панели</h1>
        <p>YouIt Café бошқарув тизими</p>

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
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg login-btn" type="submit" disabled={loading}>
            {loading ? 'Кириш...' : 'Кириш'}
          </button>
        </form>
      </div>
    </div>
  )
}
