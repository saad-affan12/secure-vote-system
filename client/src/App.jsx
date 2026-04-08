import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './api'
import axios from 'axios'

import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import VoterDashboard from './pages/VoterDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const adminLoginAPI = (data) => axios.post(`${API_URL}/auth/admin-login`, data)
const voterLoginAPI = (data) => axios.post(`${API_URL}/auth/voter-login`, data)

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

  const handleAdminLogin = async (email, password) => {
    try {
      const res = await adminLoginAPI({ email, password })
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return { success: true, role: 'admin' }
      }
      return { success: false, message: res.data.message }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    }
  }

  const handleVoterLogin = async (email, password) => {
    try {
      const res = await voterLoginAPI({ email, password })
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return { success: true, role: 'voter' }
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
          user?.role === 'voter' ? <Navigate to="/vote" /> : 
          user?.role === 'admin' ? <Navigate to="/admin" /> : <Login />
        } />
        <Route path="/admin-login" element={
          user?.role === 'admin' ? <Navigate to="/admin" /> : 
          user?.role === 'voter' ? <Navigate to="/vote" /> : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/vote'} /> : <Register onRegister={register} />
        } />
        <Route path="/admin" element={
          user?.role === 'admin' ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/admin-login" />
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
