import Election from '../models/Election.js'
import Candidate from '../models/Candidate.js'
import User from '../models/User.js'
import Vote from '../models/Vote.js'

const mapCandidate = (candidate) => ({
  id: candidate._id,
  name: candidate.name,
  party: candidate.party
})

const buildElectionResponse = (election, candidates = []) => ({
  id: election._id,
  title: election.title,
  description: election.description,
  isActive: election.isActive,
  startDate: election.startDate,
  endDate: election.endDate,
  createdAt: election.createdAt,
  candidates: candidates.map(mapCandidate),
  candidateCount: candidates.length
})

export const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates = [] } = req.body
    const normalizedTitle = title?.trim()
    
    if (!normalizedTitle) {
      return res.status(400).json({ message: 'Please provide election title' })
    }

    const normalizedCandidates = candidates
      .map((candidate) => ({
        name: candidate?.name?.trim(),
        party: candidate?.party?.trim() || ''
      }))
      .filter((candidate) => candidate.name)

    const duplicateCandidateNames = new Set()
    const seenCandidateNames = new Set()

    for (const candidate of normalizedCandidates) {
      const key = candidate.name.toLowerCase()
      if (seenCandidateNames.has(key)) {
        duplicateCandidateNames.add(candidate.name)
      }
      seenCandidateNames.add(key)
    }

    if (duplicateCandidateNames.size > 0) {
      return res.status(400).json({
        message: `Duplicate candidates are not allowed: ${Array.from(duplicateCandidateNames).join(', ')}`
      })
    }
    
    const election = new Election({
      title: normalizedTitle,
      description: description || '',
      createdBy: req.user._id,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    })
    
    await election.save()

    const createdCandidates = normalizedCandidates.length > 0
      ? await Candidate.insertMany(
          normalizedCandidates.map((candidate) => ({
            ...candidate,
            electionId: election._id,
            userId: req.user._id
          }))
        )
      : []
    
    return res.status(201).json({
      message: 'Election created successfully',
      election: buildElectionResponse(election, createdCandidates)
    })
  } catch (error) {
    console.error('Create election error:', error)
    return res.status(500).json({ message: 'Failed to create election' })
  }
}

export const getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 })
    const electionIds = elections.map((election) => election._id)
    const candidates = await Candidate.find({ electionId: { $in: electionIds } }).sort({ createdAt: 1 })
    const candidatesByElectionId = new Map()

    for (const candidate of candidates) {
      const key = candidate.electionId.toString()
      if (!candidatesByElectionId.has(key)) {
        candidatesByElectionId.set(key, [])
      }
      candidatesByElectionId.get(key).push(candidate)
    }
    
    return res.status(200).json({
      elections: elections.map((election) =>
        buildElectionResponse(
          election,
          candidatesByElectionId.get(election._id.toString()) || []
        )
      )
    })
  } catch (error) {
    console.error('Get elections error:', error)
    return res.status(500).json({ message: 'Failed to fetch elections' })
  }
}

export const toggleElectionStatus = async (req, res) => {
  try {
    const { electionId } = req.params
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    election.isActive = !election.isActive
    await election.save()
    
    return res.status(200).json({
      message: election.isActive ? 'Election activated' : 'Election deactivated',
      election: {
        id: election._id,
        title: election.title,
        isActive: election.isActive
      }
    })
  } catch (error) {
    console.error('Toggle election status error:', error)
    return res.status(500).json({ message: 'Failed to update election' })
  }
}

export const addCandidate = async (req, res) => {
  try {
    const { electionId, name, party } = req.body
    const normalizedName = name?.trim()
    const normalizedParty = party?.trim() || ''
    
    if (!electionId || !normalizedName) {
      return res.status(400).json({ message: 'Please provide electionId and candidate name' })
    }
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    const existingCandidate = await Candidate.findOne({
      electionId,
      name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    })
    if (existingCandidate) {
      return res.status(400).json({ message: 'Candidate already exists in this election' })
    }
    
    const candidate = new Candidate({
      name: normalizedName,
      party: normalizedParty,
      electionId,
      userId: req.user._id
    })
    
    await candidate.save()
    
    return res.status(201).json({
      message: 'Candidate added successfully',
      candidate: mapCandidate(candidate)
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
    
    const winner = results.length > 0 && results[0].votes > 0 ? results[0] : null
    
    return res.status(200).json({
      election: {
        id: election._id,
        title: election.title,
        description: election.description,
        isActive: election.isActive,
        startDate: election.startDate,
        endDate: election.endDate
      },
      results,
      totalVotes,
      winner
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

export const getElectionCandidates = async (req, res) => {
  try {
    const { electionId } = req.params
    
    const candidates = await Candidate.find({ electionId }).sort({ createdAt: 1 })
    
    return res.status(200).json({
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

export const deleteElection = async (req, res) => {
  try {
    const { electionId } = req.params
    
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: 'Election not found' })
    }
    
    await Vote.deleteMany({ electionId })
    await Candidate.deleteMany({ electionId })
    await Election.findByIdAndDelete(electionId)
    
    return res.status(200).json({ message: 'Election deleted successfully' })
  } catch (error) {
    console.error('Delete election error:', error)
    return res.status(500).json({ message: 'Failed to delete election' })
  }
}
