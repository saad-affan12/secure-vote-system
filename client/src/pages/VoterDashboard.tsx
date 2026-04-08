import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { voterElections, voterCandidates, castVote } from '../services/api'

interface Election {
  id: string
  title: string
  description: string
  hasVoted: boolean
}

interface Candidate {
  id: string
  name: string
  party: string
}

export default function VoterDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [voting, setVoting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'voter') {
      navigate('/login')
      return
    }
    loadElections()
  }, [user, navigate])

  const loadElections = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await voterElections()
      
      if (res.status === 200) {
        setElections(res.data.elections || [])
      } else {
        setError(res.data?.message || 'Failed to load elections')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectElection = async (election: Election) => {
    if (election.hasVoted) {
      setError('You have already voted in this election')
      return
    }
    
    setSelectedElection(election)
    setSelectedCandidate(null)
    setCandidates([])
    setLoadingCandidates(true)
    setError('')
    
    try {
      const res = await voterCandidates(election.id)
      
      if (res.status === 200) {
        setCandidates(res.data.candidates || [])
      } else {
        setError(res.data?.message || 'Failed to load candidates')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load candidates')
    } finally {
      setLoadingCandidates(false)
    }
  }

  const handleVote = async () => {
    if (!selectedElection || !selectedCandidate) return
    
    setVoting(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await castVote({
        electionId: selectedElection.id,
        candidateId: selectedCandidate.id
      })
      
      if (res.status === 201) {
        setSuccess('Vote cast successfully!')
        setShowConfirm(false)
        
        setElections(prev => prev.map(e => 
          e.id === selectedElection.id ? { ...e, hasVoted: true } : e
        ))
        
        setSelectedElection(null)
        setCandidates([])
        setSelectedCandidate(null)
      } else {
        setError(res.data?.message || 'Failed to cast vote')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cast vote')
    } finally {
      setVoting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Voter Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Voter ID: {user?.voterId}</span>
            <span className="text-gray-400">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
            {success}
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Available Elections</h2>
        
        {elections.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <p className="text-gray-400">No elections available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div
                key={election.id}
                className={`bg-gray-800 rounded-xl p-6 border ${
                  election.hasVoted 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-gray-700'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{election.title}</h3>
                {election.description && (
                  <p className="text-gray-400 text-sm mb-4">{election.description}</p>
                )}
                
                {election.hasVoted ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="text-xl">&#10003;</span>
                    <span className="font-medium">Vote Submitted</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectElection(election)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                  >
                    View Candidates
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedElection && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Candidates for: {selectedElection.title}</h3>
              <button
                onClick={() => {
                  setSelectedElection(null)
                  setCandidates([])
                  setSelectedCandidate(null)
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Close
              </button>
            </div>
            
            {loadingCandidates ? (
              <p className="text-gray-400">Loading candidates...</p>
            ) : candidates.length === 0 ? (
              <p className="text-gray-400">No candidates available for this election.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      selectedCandidate?.id === candidate.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{candidate.name}</h4>
                        {candidate.party && (
                          <p className="text-gray-400 text-sm">{candidate.party}</p>
                        )}
                      </div>
                      {selectedCandidate?.id === candidate.id && (
                        <span className="text-blue-400 text-xl">&#10003;</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedCandidate && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                >
                  Vote for {selectedCandidate.name}
                </button>
              </div>
            )}
          </div>
        )}

        {showConfirm && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Confirm Your Vote</h3>
              <p className="text-gray-400 mb-2">You are about to vote for:</p>
              <p className="text-lg font-semibold mb-4">{selectedCandidate.name}</p>
              {selectedCandidate.party && (
                <p className="text-gray-400 mb-4">Party: {selectedCandidate.party}</p>
              )}
              <p className="text-yellow-400 text-sm mb-6">This action cannot be undone.</p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVote}
                  disabled={voting}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {voting ? 'Submitting...' : 'Confirm Vote'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
