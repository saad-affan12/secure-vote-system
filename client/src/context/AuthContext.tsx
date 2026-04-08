import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  voterId: string;
  role: 'voter' | 'admin';
  hasVoted: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'voter' | 'admin') => Promise<{ success: boolean; message?: string }>;
  register: (data: { name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vote_user');
    return saved ? JSON.parse(saved) : null;
  });

  const register = useCallback(async (data: { name: string; email: string; password: string }) => {
    try {
      const { registerUser } = await import('../services/api')
      const res = await registerUser(data)
      return res.status === 201
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Registration failed')
    }
  }, []);

  const login = useCallback(async (email: string, password: string, role: 'voter' | 'admin') => {
    try {
      const { loginUser } = await import('../services/api')
      const res = await loginUser({ email, password })
      
      if (res.status === 200 && res.data?.token) {
        localStorage.setItem('vote_token', res.data.token)
        const received = res.data.user || {}
        const serverRole = (received.role as string || 'voter').toString().trim().toLowerCase()
        const requestedRole = String(role).trim().toLowerCase()
        
        if (serverRole !== requestedRole) {
          localStorage.removeItem('vote_token')
          return { success: false, message: `You are registered as ${serverRole}, not ${requestedRole}` }
        }

        const userObj: User = {
          id: received.id,
          name: received.name || '',
          email: received.email || '',
          voterId: received.voterId || '',
          role: (received.role as 'voter' | 'admin') || 'voter',
          hasVoted: typeof received.hasVoted === 'boolean' ? received.hasVoted : false,
        }
        setUser(userObj)
        localStorage.setItem('vote_user', JSON.stringify(userObj))
        return { success: true }
      }
      
      return { success: false, message: res.data?.message || 'Login failed' }
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.' }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('vote_user');
    localStorage.removeItem('vote_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
