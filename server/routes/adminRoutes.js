import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { createElection, addCandidate, listElections, getResults, getUsers } from '../controllers/adminController.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' })
    }
    
    const token = auth.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    const user = await User.findById(userId).lean()
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' })
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' })
    }
    
    req.user = user
    req.userId = userId
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized - Invalid or expired token' })
    }
    console.error('Admin auth error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

const router = express.Router()

router.post('/create-election', requireAdmin, createElection)
router.post('/add-candidate', requireAdmin, addCandidate)
router.get('/elections', requireAdmin, listElections)
router.get('/users', requireAdmin, getUsers)
router.get('/results/:electionId', requireAdmin, getResults)

export default router
