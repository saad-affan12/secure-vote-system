import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { adminLoginAPI, voterLoginAPI } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = location.pathname.includes('admin-login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    setLoading(true)
    
    try {
      const res = isAdmin 
        ? await adminLoginAPI({ email, password })
        : await voterLoginAPI({ email, password })
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        navigate(res.data.user.role === 'admin' ? '/admin' : '/vote')
      } else {
        setError(res.data.message || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          {isAdmin ? 'Admin Login' : 'Voter Login'}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">
              {isAdmin ? 'Admin Email' : 'Email or Voter ID'}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={isAdmin ? "Enter admin email" : "Enter email or voter ID"}
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 space-y-3 text-center">
          <p className="text-gray-400">
            {isAdmin ? (
              <>
                Voter login?{' '}
                <a href="/login" className="text-blue-400 hover:text-blue-300">Click here</a>
              </>
            ) : (
              <>
                Admin login?{' '}
                <a href="/admin-login" className="text-blue-400 hover:text-blue-300">Click here</a>
              </>
            )}
          </p>
          {!isAdmin && (
            <p className="text-gray-400">
              Don't have an account?{' '}
              <a href="/register" className="text-green-400 hover:text-green-300">Register here</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
