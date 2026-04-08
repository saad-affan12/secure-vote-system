import express from 'express'
import { voterMiddleware } from '../middleware/authMiddleware.js'
import { getElections, getCandidates, getMyVotes } from '../controllers/voterController.js'

const router = express.Router()

router.get('/elections', voterMiddleware, getElections)
router.get('/candidates/:electionId', voterMiddleware, getCandidates)
router.get('/my-votes', voterMiddleware, getMyVotes)

export default router
