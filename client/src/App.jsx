import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './api'

import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import VoterDashboard from './pages/VoterDashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return { success: true, role: res.data.user.role }
      }
      return { success: false, message: res.data.message }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    }
  }

  const register = async (name, email, password, role) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role })
      if (res.status === 201) {
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/vote'} /> : <Login onLogin={login} />
        } />
        <Route path="/register" element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/vote'} /> : <Register onRegister={register} />
        } />
        <Route path="/admin" element={
          user?.role === 'admin' ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/login" />
        } />
        <Route path="/vote" element={
          user?.role === 'voter' ? <VoterDashboard user={user} onLogout={logout} /> : <Navigate to="/login" />
        } />
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/vote') : '/login'} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
