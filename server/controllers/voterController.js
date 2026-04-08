import jwt from 'jsonwebtoken'
import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import Vote from '../models/Vote.js'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

async function requireVoter(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' })
    }
    
    const token = auth.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    const user = await User.findById(userId).lean()
    
    if (!user || user.role !== 'voter') {
      return res.status(403).json({ message: 'Forbidden - Voter access required' })
    }
    
    req.user = user
    req.userId = userId
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized - Invalid or expired token' })
    }
    console.error('Voter auth error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function optionalVoter(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1]
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET)
        const userId = decoded.userId
        const user = await User.findById(userId).lean()
        if (user && user.role === 'voter') {
          req.user = user
          req.userId = userId
        }
      }
    }
  } catch (err) {
    // Ignore errors in optional auth
  }
  next()
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
      result.push({ 
        id: String(el._id), 
        title: el.title, 
        description: el.description, 
        start_date: el.start_date, 
        end_date: el.end_date, 
        candidates: cands.map(c => ({ 
          id: String(c._id),
          candidate_id: String(c._id),
          user_id: c.user_id ? String(c.user_id._id || c.user_id) : null, 
          name: c.user_id ? c.user_id.name : null, 
          party: c.party, 
          votes: map[String(c._id)] || 0 
        })) 
      })
    }

    const userId = req.userId
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
      result.push({ 
        id: String(c._id),
        candidate_id: String(c._id),
        user_id: c.user_id ? String(c.user_id._id || c.user_id) : null, 
        name: c.user_id ? c.user_id.name : null, 
        party: c.party, 
        votes 
      })
    }

    return res.status(200).json({ candidates: result })
  } catch (err) {
    console.error('getCandidatesForElection error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function submitVote(req, res) {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { electionId, candidateId } = req.body || {}
    if (!electionId || !candidateId) return res.status(400).json({ message: 'Missing electionId or candidateId' })

    const existing = await Vote.findOne({ user_id: userId, election_id: electionId })
    if (existing) return res.status(409).json({ message: 'You have already voted in this election' })

    const candidate = await Candidate.findOne({ _id: candidateId, election_id: electionId })
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this election' })

    const election = await Election.findById(electionId)
    if (!election) return res.status(404).json({ message: 'Election not found' })

    const now = new Date()
    if (election.start_date && new Date(election.start_date) > now) {
      return res.status(400).json({ message: 'Election has not started yet' })
    }
    if (election.end_date && new Date(election.end_date) < now) {
      return res.status(400).json({ message: 'Election has ended' })
    }

    const vote = new Vote({ user_id: userId, candidate_id: candidateId, election_id: electionId })
    await vote.save()

    try {
      await User.findByIdAndUpdate(userId, { hasVoted: true })
    } catch (e) {
      console.warn('Failed to update user hasVoted:', e)
    }

    return res.status(201).json({ 
      message: 'Vote recorded successfully', 
      id: String(vote._id),
      voteId: String(vote._id)
    })
  } catch (err) {
    console.error('submitVote error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export { requireVoter, optionalVoter }
