import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_2024'

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }
      
      req.user = user
      next()
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

export const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' })
      }
      
      req.user = user
      next()
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' })
  }
}
