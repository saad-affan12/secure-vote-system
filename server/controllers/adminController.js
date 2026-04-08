import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import Vote from '../models/Vote.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

async function requireAdmin(req, res) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' })
  }
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    const user = await User.findById(userId).lean()
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' })
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' })
    }
    return user
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized - Invalid or expired token' })
    }
    console.error('Admin auth error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function createElection(req, res) {
  try {
    const { title, description, start_date, end_date } = req.body || {}
    if (!title) return res.status(400).json({ message: 'Missing title' })

    const election = new Election({ 
      title, 
      description: description || null, 
      start_date: start_date || null, 
      end_date: end_date || null 
    })
    await election.save()

    return res.status(201).json({ 
      message: 'Election created successfully', 
      electionId: String(election._id),
      election: {
        id: String(election._id),
        title: election.title,
        description: election.description,
        start_date: election.start_date,
        end_date: election.end_date
      }
    })
  } catch (err) {
    console.error('createElection error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function addCandidate(req, res) {
  try {
    const { electionId, userId, party } = req.body || {}
    if (!electionId || !userId) return res.status(400).json({ message: 'Missing electionId or userId' })

    const exists = await Election.findById(electionId)
    if (!exists) return res.status(404).json({ message: 'Election not found' })

    const userExists = await User.findById(userId)
    if (!userExists) return res.status(404).json({ message: 'User not found' })

    const duplicate = await Candidate.findOne({ election_id: electionId, user_id: userId })
    if (duplicate) return res.status(409).json({ message: 'Candidate already added to this election' })

    const candidate = new Candidate({ election_id: electionId, user_id: userId, party: party || null })
    await candidate.save()

    return res.status(201).json({ 
      message: 'Candidate added successfully', 
      candidateId: String(candidate._id),
      candidate: {
        id: String(candidate._id),
        user_id: userId,
        party: candidate.party
      }
    })
  } catch (err) {
    console.error('addCandidate error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function listElections(req, res) {
  try {
    const rows = await Election.find().sort({ created_at: -1 }).lean()
    const elections = rows.map(e => ({ 
      id: String(e._id), 
      title: e.title, 
      description: e.description, 
      start_date: e.start_date, 
      end_date: e.end_date,
      created_at: e.created_at 
    }))
    return res.status(200).json({ elections })
  } catch (err) {
    console.error('listElections error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getUsers(req, res) {
  try {
    const rows = await User.find({ role: 'voter' }).sort({ name: 1 }).lean()
    const users = rows.map(u => ({ id: String(u._id), name: u.name, email: u.email, voterId: u.voterId }))
    return res.status(200).json({ users })
  } catch (err) {
    console.error('getUsers error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getResults(req, res) {
  try {
    const electionId = req.params.electionId || req.query.electionId
    if (!electionId) return res.status(400).json({ message: 'Election ID is required' })

    const election = await Election.findById(electionId).lean()
    if (!election) return res.status(404).json({ message: 'Election not found' })

    const candidates = await Candidate.find({ election_id: electionId }).populate('user_id').lean()
    const rows = []
    for (const c of candidates) {
      const votes = await Vote.countDocuments({ candidate_id: c._id })
      rows.push({ 
        candidate_id: String(c._id), 
        user_id: c.user_id ? String(c.user_id._id || c.user_id) : null, 
        name: c.user_id ? c.user_id.name : null, 
        party: c.party, 
        votes 
      })
    }

    rows.sort((a, b) => b.votes - a.votes || (a.name || '').localeCompare(b.name || ''))
    const winner = rows.length > 0 && rows[0].votes > 0 ? rows[0] : null
    return res.status(200).json({ 
      election: {
        id: String(election._id),
        title: election.title,
        description: election.description,
        start_date: election.start_date,
        end_date: election.end_date
      },
      results: rows, 
      winner,
      totalVotes: rows.reduce((sum, r) => sum + r.votes, 0)
    })
  } catch (err) {
    console.error('getResults error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
