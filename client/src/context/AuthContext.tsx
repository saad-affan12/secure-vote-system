import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loginUser, registerUser } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  voterId: string
  role: 'voter' | 'admin'
  hasVoted: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('vote_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('vote_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginUser({ email, password })
      
      if (res.status === 200 && res.data?.token) {
        const token = res.data.token
        const userData = res.data.user
        
        localStorage.setItem('vote_token', token)
        
        const userObj: User = {
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          voterId: userData.voterId || '',
          role: userData.role || 'voter',
          hasVoted: userData.hasVoted || false
        }
        
        setUser(userObj)
        localStorage.setItem('vote_user', JSON.stringify(userObj))
        
        return { success: true }
      }
      
      return { success: false, message: res.data?.message || 'Login failed' }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Login failed'
      return { success: false, message }
    }
  }, [])

  const register = useCallback(async (data: { name: string; email: string; password: string; role?: string }) => {
    try {
      const res = await registerUser(data)
      
      if (res.status === 201) {
        return { 
          success: true, 
          message: res.data?.message || 'Registration successful'
        }
      }
      
      return { success: false, message: res.data?.message || 'Registration failed' }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Registration failed'
      return { success: false, message }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('vote_token')
    localStorage.removeItem('vote_user')
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
