import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import Vote from '../models/Vote.js'

export const getElections = async (req, res) => {
  try {
    const elections = await Election.find({ isActive: true }).sort({ createdAt: -1 })
    const userId = req.user._id
    
    const electionsWithStatus = await Promise.all(
      elections.map(async (e) => {
        const hasVoted = await Vote.findOne({ userId, electionId: e._id })
        return {
          id: e._id,
          title: e.title,
          description: e.description,
          hasVoted: !!hasVoted
        }
      })
    )
    
    return res.status(200).json({ elections: electionsWithStatus })
  } catch (error) {
    console.error('Get elections error:', error)
    return res.status(500).json({ message: 'Failed to fetch elections' })
  }
}

export const getCandidates = async (req, res) => {
  try {
    const { electionId } = req.params
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidates = await Candidate.find({ electionId })
    
    return res.status(200).json({
      election: {
        id: election._id,
        title: election.title
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
    
    if (!electionId || !candidateId) {
      return res.status(400).json({ message: 'Please provide electionId and candidateId' })
    }
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidate = await Candidate.findById(candidateId)
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' })
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
