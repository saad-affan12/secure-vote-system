import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getElectionsForVoter, getCandidatesForElection } from '../controllers/voterController.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

// Middleware to verify voter authentication (required)
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

// Middleware to extract optional voter authentication
async function optionalVoter(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (auth) {
      const token = auth.split(' ')[1]
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET)
        const userId = decoded.userId
        const user = await User.findById(userId).lean()
        if (user && user.role === 'voter') {
          req.user = user
          req.userId = userId
        }
      }
    }
  } catch (err) {
    // Ignore errors in optional auth
  }
  next()
}

const router = express.Router()

router.get('/elections', optionalVoter, getElectionsForVoter)
router.get('/candidates/:electionId', requireVoter, getCandidatesForElection)

export default router
