import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import Vote from '../models/Vote.js'

export const getElections = async (req, res) => {
  try {
    const now = new Date()
    
    const elections = await Election.find().sort({ createdAt: -1 })
    const userId = req.user._id
    
    const electionsWithStatus = await Promise.all(
      elections.map(async (e) => {
        const hasVoted = await Vote.findOne({ userId, electionId: e._id })
        const isOpen = checkElectionOpen(e, now)
        
        return {
          id: e._id,
          title: e.title,
          description: e.description,
          hasVoted: !!hasVoted,
          isActive: e.isActive,
          isOpen,
          startDate: e.startDate,
          endDate: e.endDate
        }
      })
    )
    
    return res.status(200).json({ elections: electionsWithStatus })
  } catch (error) {
    console.error('Get elections error:', error)
    return res.status(500).json({ message: 'Failed to fetch elections' })
  }
}

function checkElectionOpen(election, now) {
  if (!election.isActive) return false
  if (election.startDate && new Date(election.startDate) > now) return false
  if (election.endDate && new Date(election.endDate) < now) return false
  return true
}

export const getCandidates = async (req, res) => {
  try {
    const { electionId } = req.params
    const now = new Date()
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const isOpen = checkElectionOpen(election, now)
    
    const candidates = await Candidate.find({ electionId })
    
    return res.status(200).json({
      election: {
        id: election._id,
        title: election.title,
        isOpen,
        isActive: election.isActive
      },
      candidates: candidates.map(c => ({
        id: c._id,
        name: c.name,
        party: c.party
      }))
    })
  } catch (error) {
    console.error('Get candidates error:', error)
    return res.status(500).json({ message: 'Failed to fetch candidates' })
  }
}

export const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body
    const userId = req.user._id
    const now = new Date()
    
    if (!electionId || !candidateId) {
      return res.status(400).json({ message: 'Please provide electionId and candidateId' })
    }
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    if (!election.isActive) {
      return res.status(400).json({ message: 'Voting is closed for this election' })
    }
    
    if (election.startDate && new Date(election.startDate) > now) {
      return res.status(400).json({ message: 'Voting has not started yet' })
    }
    
    if (election.endDate && new Date(election.endDate) < now) {
      return res.status(400).json({ message: 'Voting has ended for this election' })
    }
    
    const candidate = await Candidate.findById(candidateId)
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' })
    }
    
    if (candidate.electionId.toString() !== electionId) {
      return res.status(400).json({ message: 'Candidate not in this election' })
    }
    
    const existingVote = await Vote.findOne({ userId, electionId })
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' })
    }
    
    const vote = new Vote({
      userId,
      electionId,
      candidateId
    })
    
    await vote.save()
    
    candidate.votes += 1
    await candidate.save()
    
    return res.status(201).json({
      message: 'Vote cast successfully',
      voteId: vote._id
    })
  } catch (error) {
    console.error('Cast vote error:', error)
    return res.status(500).json({ message: 'Failed to cast vote' })
  }
}

export const getMyVotes = async (req, res) => {
  try {
    const userId = req.user._id
    
    const votes = await Vote.find({ userId })
      .populate('electionId', 'title')
      .populate('candidateId', 'name party')
      .sort({ createdAt: -1 })
    
    return res.status(200).json({
      votes: votes.map(v => ({
        id: v._id,
        electionTitle: v.electionId?.title || 'Unknown',
        candidateName: v.candidateId?.name || 'Unknown',
        candidateParty: v.candidateId?.party || '',
        votedAt: v.createdAt
      }))
    })
  } catch (error) {
    console.error('Get my votes error:', error)
    return res.status(500).json({ message: 'Failed to fetch votes' })
  }
}
