import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import './Layout.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard',     permission: 'read' },
  { to: '/assets',    icon: '🖥', label: 'Assets',         permission: 'read' },
  { to: '/assets/new',icon: '＋', label: 'Add Asset',      permission: 'create' },
  { to: '/users',     icon: '👥', label: 'Users',          permission: 'manageUsers' },
  { to: '/logs',      icon: '📋', label: 'Activity Log',   permission: 'manageUsers' },
]

export default function Layout({ children }) {
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => { logout(); navigate('/') }

  const roleColor = { superuser: '#ff4d6d', manager: '#f4a261', engineer: '#06d6a0' }
  const roleLabel = { superuser: 'Super User', manager: 'Manager', engineer: 'Engineer' }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-mark">E</span>
          <div>
            <div className="logo-name">Examedia</div>
            <div className="logo-sub">Asset Management</div>
          </div>
        </div>

        <div className="sidebar-location">
          <span className="location-icon">🏥</span>
          <span>HRPB</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.filter(n => can(n.permission)).map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/dashboard'}
              className={({ isActive }) => `nav-item${isActive ? ' nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role" style={{ color: roleColor[user?.role] }}>
              {roleLabel[user?.role]}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⇤</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="topbar-title">Hospital Raja Permaisuri Bainun</div>
          <div className="topbar-right">
            {DEMO && <span className="demo-badge">⚡ DEMO MODE</span>}
            <span className="topbar-user">{user?.name}</span>
            <button
              className="theme-icon-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>
        {DEMO && (
          <div className="demo-banner">
            ⚡ Demo Mode — using sample data. No backend required.
            Login: <strong>admin@examedia.com.my</strong> / any password
          </div>
        )}
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
