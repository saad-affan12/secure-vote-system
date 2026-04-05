import express from 'express'
import { submitVote } from '../controllers/voterController.js'

const router = express.Router()

router.post('/', submitVote)

export default router
