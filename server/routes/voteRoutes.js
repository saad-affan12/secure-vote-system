import express from 'express'
import { voterMiddleware } from '../middleware/authMiddleware.js'
import { castVote } from '../controllers/voterController.js'

const router = express.Router()

router.post('/', voterMiddleware, castVote)

export default router
