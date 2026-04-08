import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import Vote from '../models/Vote.js'

export async function getElections(req, res) {
  try {
    const elections = await Election.find().sort({ created_at: -1 }).lean()
    const userId = req.userId
    
    const userVotes = await Vote.find({ user_id: userId }).lean()
    const votedElections = new Set(userVotes.map(v => String(v.election_id)))
    
    const formattedElections = elections.map(e => ({
      id: String(e._id),
      title: e.title,
      description: e.description || '',
      hasVoted: votedElections.has(String(e._id)),
      createdAt: e.created_at
    }))
    
    return res.status(200).json({ elections: formattedElections })
  } catch (err) {
    console.error('Get voter elections error:', err)
    return res.status(500).json({ message: 'Failed to fetch elections' })
  }
}

export async function getCandidates(req, res) {
  try {
    const { electionId } = req.params
    
    if (!electionId) {
      return res.status(400).json({ message: 'Please provide election ID' })
    }
    
    const election = await Election.findById(electionId).select('_id title').lean()
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidates = await Candidate.find({ election_id: electionId })
      .populate('user_id', 'name email')
      .lean()
    
    const formattedCandidates = candidates.map(c => ({
      id: String(c._id),
      name: c.user_id ? c.user_id.name : 'Unknown',
      email: c.user_id ? c.user_id.email : '',
      party: c.party || ''
    }))
    
    return res.status(200).json({ 
      election: {
        id: String(election._id),
        title: election.title
      },
      candidates: formattedCandidates 
    })
  } catch (err) {
    console.error('Get candidates error:', err)
    return res.status(500).json({ message: 'Failed to fetch candidates' })
  }
}

export async function castVote(req, res) {
  try {
    const { electionId, candidateId } = req.body || {}
    const userId = req.userId
    
    if (!electionId || !candidateId) {
      return res.status(400).json({ message: 'Please provide electionId and candidateId' })
    }
    
    const election = await Election.findById(electionId).select('_id').lean()
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidate = await Candidate.findOne({ 
      _id: candidateId, 
      election_id: electionId 
    }).select('_id').lean()
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found in this election' })
    }
    
    const existingVote = await Vote.findOne({ 
      user_id: userId, 
      election_id: electionId 
    }).select('_id').lean()
    
    if (existingVote) {
      return res.status(409).json({ message: 'You have already voted in this election' })
    }
    
    const vote = new Vote({
      user_id: userId,
      candidate_id: candidateId,
      election_id: electionId
    })
    
    await vote.save()
    
    return res.status(201).json({ 
      message: 'Vote cast successfully',
      voteId: String(vote._id)
    })
  } catch (err) {
    console.error('Cast vote error:', err)
    return res.status(500).json({ message: 'Failed to cast vote' })
  }
}

export async function getMyVotes(req, res) {
  try {
    const userId = req.userId
    
    const votes = await Vote.find({ user_id: userId })
      .populate('election_id', 'title')
      .populate('candidate_id', 'party')
      .lean()
    
    const formattedVotes = votes.map(v => ({
      voteId: String(v._id),
      electionId: v.election_id ? String(v.election_id._id) : null,
      electionTitle: v.election_id ? v.election_id.title : 'Unknown',
      candidateId: v.candidate_id ? String(v.candidate_id._id) : null,
      party: v.candidate_id ? v.candidate_id.party : '',
      votedAt: v.created_at
    }))
    
    return res.status(200).json({ votes: formattedVotes })
  } catch (err) {
    console.error('Get my votes error:', err)
    return res.status(500).json({ message: 'Failed to fetch votes' })
  }
}
