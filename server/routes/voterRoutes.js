import express from 'express'
import { getElectionsForVoter, getCandidatesForElection, requireVoter, optionalVoter } from '../controllers/voterController.js'

const router = express.Router()

router.get('/elections', optionalVoter, getElectionsForVoter)
router.get('/candidates/:electionId', requireVoter, getCandidatesForElection)

export default router
