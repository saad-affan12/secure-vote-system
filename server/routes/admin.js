import express from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import { createElection, getElections, addCandidate, getResults, getVoters } from '../controllers/adminController.js'

const router = express.Router()

router.post('/election', adminMiddleware, createElection)
router.get('/elections', adminMiddleware, getElections)
router.post('/candidate', adminMiddleware, addCandidate)
router.get('/results/:electionId', adminMiddleware, getResults)
router.get('/voters', adminMiddleware, getVoters)

export default router
