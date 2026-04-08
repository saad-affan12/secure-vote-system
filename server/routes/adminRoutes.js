import express from 'express'
import { adminMiddleware } from '../middleware/authMiddleware.js'
import { createElection, getElections, addCandidate, getVoters, getResults, deleteElection } from '../controllers/adminController.js'

const router = express.Router()

router.post('/election', adminMiddleware, createElection)
router.get('/elections', adminMiddleware, getElections)
router.post('/candidate', adminMiddleware, addCandidate)
router.get('/voters', adminMiddleware, getVoters)
router.get('/results/:electionId', adminMiddleware, getResults)
router.delete('/election/:electionId', adminMiddleware, deleteElection)

export default router
