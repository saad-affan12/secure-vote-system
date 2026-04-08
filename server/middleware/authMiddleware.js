import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    
    const user = await User.findById(userId).select('-password -otp -otpExpiry').lean()
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' })
    }
    
    req.user = user
    req.userId = userId
    req.userRole = user.role
    
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized - Token expired' })
    }
    console.error('Auth middleware error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function adminMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    
    const user = await User.findById(userId).select('-password -otp -otpExpiry').lean()
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' })
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' })
    }
    
    req.user = user
    req.userId = userId
    req.userRole = user.role
    
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized - Token expired' })
    }
    console.error('Admin middleware error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function voterMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    
    const user = await User.findById(userId).select('-password -otp -otpExpiry').lean()
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' })
    }
    
    if (user.role !== 'voter') {
      return res.status(403).json({ message: 'Forbidden - Voter access required' })
    }
    
    req.user = user
    req.userId = userId
    req.userRole = user.role
    
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized - Token expired' })
    }
    console.error('Voter middleware error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
