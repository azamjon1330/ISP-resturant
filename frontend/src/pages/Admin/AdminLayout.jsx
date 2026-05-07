import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, BarChart3, LogOut } from 'lucide-react'
import './AdminLayout.css'

const navItems = [
  { to: '/admin/', icon: LayoutDashboard, label: 'Бош панель', end: true },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Буюртмалар' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Меню' },
  { to: '/admin/agents', icon: Users, label: 'Агентлар' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Аналитика' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('youit_token')
    navigate('/admin')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-emoji">🍽️</span>
          <div>
            <span className="logo-main">YouIt Café</span>
            <span className="logo-sub">Бошқарув панели</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Чиқиш</span>
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
