import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import User from '../models/User.js'
import Vote from '../models/Vote.js'

export async function createElection(req, res) {
  try {
    const { title, description } = req.body || {}
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Please provide election title' })
    }
    
    const election = new Election({
      title: title.trim(),
      description: description?.trim() || ''
    })
    
    await election.save()
    
    return res.status(201).json({ 
      message: 'Election created successfully',
      election: {
        id: String(election._id),
        title: election.title,
        description: election.description
      }
    })
  } catch (err) {
    console.error('Create election error:', err)
    return res.status(500).json({ message: 'Failed to create election' })
  }
}

export async function getElections(req, res) {
  try {
    const elections = await Election.find().sort({ created_at: -1 }).lean()
    
    const formattedElections = elections.map(e => ({
      id: String(e._id),
      title: e.title,
      description: e.description || '',
      createdAt: e.created_at
    }))
    
    return res.status(200).json({ elections: formattedElections })
  } catch (err) {
    console.error('Get elections error:', err)
    return res.status(500).json({ message: 'Failed to fetch elections' })
  }
}

export async function addCandidate(req, res) {
  try {
    const { electionId, userId, party } = req.body || {}
    
    if (!electionId || !userId) {
      return res.status(400).json({ message: 'Please provide electionId and userId' })
    }
    
    const election = await Election.findById(electionId).select('_id').lean()
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const user = await User.findById(userId).select('_id role').lean()
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    if (user.role !== 'voter') {
      return res.status(400).json({ message: 'Only voters can be added as candidates' })
    }
    
    const existingCandidate = await Candidate.findOne({ 
      election_id: electionId, 
      user_id: userId 
    }).select('_id').lean()
    
    if (existingCandidate) {
      return res.status(409).json({ message: 'User is already a candidate in this election' })
    }
    
    const candidate = new Candidate({
      election_id: electionId,
      user_id: userId,
      party: party?.trim() || ''
    })
    
    await candidate.save()
    
    return res.status(201).json({ 
      message: 'Candidate added successfully',
      candidate: {
        id: String(candidate._id),
        userId: userId,
        party: candidate.party
      }
    })
  } catch (err) {
    console.error('Add candidate error:', err)
    return res.status(500).json({ message: 'Failed to add candidate' })
  }
}

export async function getVoters(req, res) {
  try {
    const voters = await User.find({ role: 'voter' })
      .select('name email voterId')
      .sort({ name: 1 })
      .lean()
    
    const formattedVoters = voters.map(v => ({
      id: String(v._id),
      name: v.name,
      email: v.email,
      voterId: v.voterId
    }))
    
    return res.status(200).json({ voters: formattedVoters })
  } catch (err) {
    console.error('Get voters error:', err)
    return res.status(500).json({ message: 'Failed to fetch voters' })
  }
}

export async function getResults(req, res) {
  try {
    const { electionId } = req.params
    
    if (!electionId) {
      return res.status(400).json({ message: 'Please provide election ID' })
    }
    
    const election = await Election.findById(electionId).lean()
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidates = await Candidate.find({ election_id: electionId })
      .populate('user_id', 'name email voterId')
      .lean()
    
    const results = []
    let totalVotes = 0
    
    for (const c of candidates) {
      const voteCount = await Vote.countDocuments({ candidate_id: c._id })
      totalVotes += voteCount
      
      results.push({
        candidateId: String(c._id),
        userId: c.user_id ? String(c.user_id._id) : null,
        name: c.user_id ? c.user_id.name : 'Unknown',
        email: c.user_id ? c.user_id.email : '',
        party: c.party || '',
        votes: voteCount
      })
    }
    
    results.sort((a, b) => b.votes - a.votes)
    
    const winner = results.length > 0 && results[0].votes > 0 ? results[0] : null
    
    return res.status(200).json({
      election: {
        id: String(election._id),
        title: election.title,
        description: election.description || '',
        totalVotes
      },
      results,
      winner
    })
  } catch (err) {
    console.error('Get results error:', err)
    return res.status(500).json({ message: 'Failed to fetch results' })
  }
}

export async function deleteElection(req, res) {
  try {
    const { electionId } = req.params
    
    if (!electionId) {
      return res.status(400).json({ message: 'Please provide election ID' })
    }
    
    const election = await Election.findByIdAndDelete(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    await Candidate.deleteMany({ election_id: electionId })
    await Vote.deleteMany({ election_id: electionId })
    
    return res.status(200).json({ message: 'Election deleted successfully' })
  } catch (err) {
    console.error('Delete election error:', err)
    return res.status(500).json({ message: 'Failed to delete election' })
  }
}
