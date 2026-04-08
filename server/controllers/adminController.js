import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import User from '../models/User.js'
import Vote from '../models/Vote.js'

export const createElection = async (req, res) => {
  try {
    const { title, description } = req.body
    
    if (!title) {
      return res.status(400).json({ message: 'Please provide election title' })
    }
    
    const election = new Election({
      title,
      description,
      createdBy: req.user._id
    })
    
    await election.save()
    
    return res.status(201).json({
      message: 'Election created successfully',
      election: {
        id: election._id,
        title: election.title,
        description: election.description
      }
    })
  } catch (error) {
    console.error('Create election error:', error)
    return res.status(500).json({ message: 'Failed to create election' })
  }
}

export const getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 })
    
    return res.status(200).json({
      elections: elections.map(e => ({
        id: e._id,
        title: e.title,
        description: e.description,
        isActive: e.isActive,
        createdAt: e.createdAt
      }))
    })
  } catch (error) {
    console.error('Get elections error:', error)
    return res.status(500).json({ message: 'Failed to fetch elections' })
  }
}

export const addCandidate = async (req, res) => {
  try {
    const { electionId, name, party } = req.body
    
    if (!electionId || !name) {
      return res.status(400).json({ message: 'Please provide electionId and candidate name' })
    }
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidate = new Candidate({
      name,
      party,
      electionId,
      userId: req.user._id
    })
    
    await candidate.save()
    
    return res.status(201).json({
      message: 'Candidate added successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        party: candidate.party
      }
    })
  } catch (error) {
    console.error('Add candidate error:', error)
    return res.status(500).json({ message: 'Failed to add candidate' })
  }
}

export const getResults = async (req, res) => {
  try {
    const { electionId } = req.params
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const candidates = await Candidate.find({ electionId })
    
    const results = []
    let totalVotes = 0
    
    for (const candidate of candidates) {
      const voteCount = await Vote.countDocuments({ candidateId: candidate._id })
      totalVotes += voteCount
      results.push({
        id: candidate._id,
        name: candidate.name,
        party: candidate.party,
        votes: voteCount
      })
    }
    
    results.sort((a, b) => b.votes - a.votes)
    
    return res.status(200).json({
      election: {
        id: election._id,
        title: election.title
      },
      results,
      totalVotes
    })
  } catch (error) {
    console.error('Get results error:', error)
    return res.status(500).json({ message: 'Failed to fetch results' })
  }
}

export const getVoters = async (req, res) => {
  try {
    const voters = await User.find({ role: 'voter' }).select('name email voterId')
    
    return res.status(200).json({
      voters: voters.map(v => ({
        id: v._id,
        name: v.name,
        email: v.email,
        voterId: v.voterId
      }))
    })
  } catch (error) {
    console.error('Get voters error:', error)
    return res.status(500).json({ message: 'Failed to fetch voters' })
  }
}
