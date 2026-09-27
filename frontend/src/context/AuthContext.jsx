import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import { mockLogin } from '../api/mockApi'

const AuthContext = createContext(null)

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ams_user')
    const token  = localStorage.getItem('ams_token')
    if (stored && token) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    let data
    if (DEMO) {
      const res = await mockLogin(email, password)
      data = res.data
    } else {
      const res = await api.post('/auth/login', { email, password })
      data = res.data
    }
    localStorage.setItem('ams_token', data.token)
    localStorage.setItem('ams_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ams_token')
    localStorage.removeItem('ams_user')
    setUser(null)
  }

  const can = (action) => {
    if (!user) return false
    const permissions = {
      superuser: ['read', 'create', 'edit', 'delete', 'manageUsers', 'export'],
      manager:   ['read', 'create', 'edit', 'delete', 'export'],
      engineer:  ['read', 'create', 'edit'],
    }
    return permissions[user.role]?.includes(action) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, can, isDemo: DEMO }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
