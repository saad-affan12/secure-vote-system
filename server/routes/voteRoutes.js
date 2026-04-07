import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { submitVote } from '../controllers/voterController.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

// Middleware to verify voter authentication
async function requireVoter(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ message: 'Unauthorized' })
    
    const token = auth.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    const user = await User.findById(userId).lean()
    
    if (!user || user.role !== 'voter') return res.status(403).json({ message: 'Forbidden' })
    
    req.user = user
    req.userId = userId
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

const router = express.Router()

router.post('/', requireVoter, submitVote)

export default router
