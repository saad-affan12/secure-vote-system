import express from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import { 
  createElection, 
  getElections, 
  toggleElectionStatus,
  addCandidate, 
  getResults, 
  getVoters,
  getElectionCandidates,
  deleteElection 
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/election', adminMiddleware, createElection)
router.get('/elections', adminMiddleware, getElections)
router.patch('/election/:electionId/toggle', adminMiddleware, toggleElectionStatus)
router.post('/candidate', adminMiddleware, addCandidate)
router.get('/candidates/:electionId', adminMiddleware, getElectionCandidates)
router.get('/results/:electionId', adminMiddleware, getResults)
router.get('/voters', adminMiddleware, getVoters)
router.delete('/election/:electionId', adminMiddleware, deleteElection)

export default router
