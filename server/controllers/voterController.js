import jwt from 'jsonwebtoken'
import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import Vote from '../models/Vote.js'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

function getUserIdFromReq(req) {
  const auth = req.headers.authorization
  if (!auth) return null
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.userId
  } catch (err) {
    return null
  }
}

export async function getElectionsForVoter(req, res) {
  try {
    const elections = await Election.find().sort({ created_at: -1 }).lean()
    const result = []
    for (const el of elections) {
      const cands = await Candidate.find({ election_id: el._id }).populate('user_id').lean()
      const map = {}
      for (const c of cands) {
        const votes = await Vote.countDocuments({ candidate_id: c._id })
        map[String(c._id)] = votes
      }
      result.push({ id: String(el._id), title: el.title, description: el.description, start_date: el.start_date, end_date: el.end_date, candidates: cands.map(c => ({ id: String(c._id), user_id: c.user_id ? String(c.user_id._id || c.user_id) : null, name: c.user_id ? c.user_id.name : null, party: c.party, votes: map[String(c._id)] || 0 })) })
    }

    const userId = getUserIdFromReq(req)
    let userVotes = {}
    if (userId) {
      const rows = await Vote.find({ user_id: userId }).lean()
      for (const r of rows) userVotes[String(r.election_id)] = true
    }

    return res.status(200).json({ elections: result, userVotes })
  } catch (err) {
    console.error('getElectionsForVoter error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getCandidatesForElection(req, res) {
  try {
    const electionId = req.params.electionId
    if (!electionId) return res.status(400).json({ message: 'Missing electionId' })

    const cands = await Candidate.find({ election_id: electionId }).populate('user_id').lean()
    const result = []
    for (const c of cands) {
      const votes = await Vote.countDocuments({ candidate_id: c._id })
      result.push({ candidate_id: String(c._id), user_id: c.user_id ? String(c.user_id._id || c.user_id) : null, name: c.user_id ? c.user_id.name : null, party: c.party, votes })
    }

    return res.status(200).json({ candidates: result })
  } catch (err) {
    console.error('getCandidatesForElection error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function submitVote(req, res) {
  try {
    const userId = getUserIdFromReq(req)
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { electionId, candidateId } = req.body || {}
    if (!electionId || !candidateId) return res.status(400).json({ message: 'Missing fields' })

    const existing = await Vote.findOne({ user_id: userId, election_id: electionId })
    if (existing) return res.status(409).json({ message: 'Already voted' })

    const candidate = await Candidate.findOne({ _id: candidateId, election_id: electionId })
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this election' })

    const vote = new Vote({ user_id: userId, candidate_id: candidateId, election_id: electionId })
    await vote.save()

    try {
      await User.findByIdAndUpdate(userId, { hasVoted: true })
    } catch (e) {
      // non-critical
    }

    return res.status(201).json({ message: 'Vote recorded', id: String(vote._id) })
  } catch (err) {
    console.error('submitVote error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
