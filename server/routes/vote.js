import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { castVote } from '../controllers/voterController.js'

const router = express.Router()

router.post('/', authMiddleware, castVote)

export default router
