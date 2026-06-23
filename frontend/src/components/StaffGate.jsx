import React, { useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'
import { Lock, LogOut, Eye, EyeOff, Loader2 } from 'lucide-react'
import './StaffGate.css'

/*
 * StaffGate — wraps a staff panel (cashier / kitchen) and only renders it to a
 * logged-in user with the matching role. An "admin" account may open any panel.
 *
 * The token is kept in localStorage, i.e. per device (phone keeps the phone's
 * login, tablet keeps the tablet's). On every load the token is verified against
 * the server (`/api/auth/me`) so a deleted or re-roled account is rejected and
 * the saved data must match the real account.
 */
export default function StaffGate({ role, title, children }) {
  const storageKey = `eco_staff_token_${role}`

  const [status, setStatus]   = useState('checking') // checking | login | authed
  const [username, setUser]   = useState('')
  const [password, setPass]   = useState('')
  const [showPass, setShow]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const roleOk = (r) => r === role || r === 'admin'

  // Verify the token saved on this device.
  const verify = useCallback(async () => {
    const token = localStorage.getItem(storageKey)
    if (!token) { setStatus('login'); return }
    try {
      const res = await authAPI.me(token)
      if (roleOk(res.data?.role)) {
        setStatus('authed')
      } else {
        localStorage.removeItem(storageKey)
        setStatus('login')
      }
    } catch {
      localStorage.removeItem(storageKey)
      setStatus('login')
    }
  }, [storageKey])

  useEffect(() => { verify() }, [verify])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(username.trim(), password)
      if (!roleOk(res.data?.role)) {
        setError(`Бу ҳисоб «${title}» панели учун эмас`)
        setLoading(false)
        return
      }
      localStorage.setItem(storageKey, res.data.token)
      setPass('')
      setStatus('authed')
    } catch {
      setError('Нотўғри логин ёки парол')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(storageKey)
    setUser(''); setPass('')
    setStatus('login')
  }

  if (status === 'checking') {
    return (
      <div className="sg-splash">
        <Loader2 className="sg-spin" size={34} />
      </div>
    )
  }

  if (status === 'authed') {
    return (
      <>
        {children}
        <button className="sg-logout-fab" onClick={logout} title="Чиқиш">
          <LogOut size={16} />
        </button>
      </>
    )
  }

  // login screen
  return (
    <div className="sg-page">
      <form className="sg-card" onSubmit={submit}>
        <div className="sg-head">
          <div className="sg-icon"><Lock size={26} /></div>
          <h1 className="sg-title">{title}</h1>
          <p className="sg-sub">Тизимга кириш учун логин ва паролни киритинг</p>
        </div>

        <label className="sg-label">Логин</label>
        <input
          className="sg-input"
          type="text"
          value={username}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Логин"
          autoComplete="username"
          required
        />

        <label className="sg-label">Парол</label>
        <div className="sg-pass-row">
          <input
            className="sg-input"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Парол"
            autoComplete="current-password"
            required
          />
          <button type="button" className="sg-eye" onClick={() => setShow((s) => !s)}>
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <div className="sg-error">{error}</div>}

        <button className="sg-btn" type="submit" disabled={loading}>
          {loading ? <Loader2 className="sg-spin" size={18} /> : <>Кириш</>}
        </button>
      </form>
    </div>
  )
}
