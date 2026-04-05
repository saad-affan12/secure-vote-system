import express from 'express'
import { createElection, addCandidate, listElections, getResults, getUsers } from '../controllers/adminController.js'

const router = express.Router()

router.post('/create-election', createElection)
router.post('/add-candidate', addCandidate)
router.get('/elections', listElections)
router.get('/users', getUsers)
router.get('/results/:electionId', getResults)
router.get('/results', getResults)

export default router
