import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import InstallPrompt from './components/InstallPrompt'
import LoginPage  from './pages/LoginPage'
import Dashboard  from './pages/Dashboard'
import Assets     from './pages/Assets'
import AssetForm  from './pages/AssetForm'
import Users      from './pages/Users'
import Logs       from './pages/Logs'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/assets"          element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/assets/new"      element={<ProtectedRoute><AssetForm /></ProtectedRoute>} />
          <Route path="/assets/:id"      element={<ProtectedRoute><AssetForm viewOnly /></ProtectedRoute>} />
          <Route path="/assets/:id/edit" element={<ProtectedRoute><AssetForm /></ProtectedRoute>} />
          <Route path="/users"           element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/logs"            element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
