import express from 'express'
import { submitVote, requireVoter } from '../controllers/voterController.js'

const router = express.Router()

router.post('/', requireVoter, submitVote)

export default router
