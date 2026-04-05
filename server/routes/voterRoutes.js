import express from 'express'
import { getElectionsForVoter, getCandidatesForElection } from '../controllers/voterController.js'

const router = express.Router()

router.get('/elections', getElectionsForVoter)
router.get('/candidates/:electionId', getCandidatesForElection)

export default router
