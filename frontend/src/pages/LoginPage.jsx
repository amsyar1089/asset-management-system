import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // If already logged in, go to dashboard
  if (user) { navigate('/dashboard', { replace: true }); return null }

  return <LoginForm onLogin={async (email, password) => {
    await login(email, password)
    navigate('/dashboard')
  }} />
}
