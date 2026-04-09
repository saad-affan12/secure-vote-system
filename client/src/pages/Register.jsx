import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Register({ onRegister }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!name || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    const result = await onRegister(name, email, password, 'voter')
    setLoading(false)
    
    if (result.success) {
      setSuccess('Registration successful! You can now login as a voter.')
      setTimeout(() => navigate('/login'), 2000)
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-2xl p-8 border border-green-500/50">
        <div className="text-center mb-6 p-3 rounded-lg bg-green-500/20">
          <span className="text-sm font-medium text-green-300">
            🗳️ VOTER REGISTRATION
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-white text-center mb-8">Register as Voter</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-green-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-green-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-green-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Min 6 characters"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-green-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Confirm password"
            />
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-gray-400 text-sm text-center">
              <span className="text-yellow-400">Note:</span> Admin accounts are created separately. Contact system administrator for admin access.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register as Voter'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Login here</Link>
        </p>
      </div>
    </div>
  )
}
