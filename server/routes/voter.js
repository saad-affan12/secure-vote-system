import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getElections, getCandidates, getMyVotes } from '../controllers/voterController.js'

const router = express.Router()

router.get('/elections', authMiddleware, getElections)
router.get('/candidates/:electionId', authMiddleware, getCandidates)
router.get('/my-votes', authMiddleware, getMyVotes)

export default router
