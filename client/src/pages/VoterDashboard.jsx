import { useState, useEffect } from 'react'
import api from '../api'

export default function VoterDashboard({ user, onLogout }) {
  const [elections, setElections] = useState([])
  const [selectedElection, setSelectedElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    loadElections()
  }, [])

  const loadElections = async () => {
    setLoading(true)
    try {
      const res = await api.get('/voter/elections')
      setElections(res.data.elections || [])
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const handleSelectElection = async (election) => {
    setSelectedElection(election)
    setSelectedCandidate(null)
    setCandidates([])
    
    try {
      const res = await api.get(`/voter/candidates/${election.id}`)
      setCandidates(res.data.candidates || [])
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load candidates')
    }
  }

  const handleVote = async () => {
    if (!selectedElection || !selectedCandidate) return
    
    setVoting(true)
    try {
      const res = await api.post('/vote', {
        electionId: selectedElection.id,
        candidateId: selectedCandidate.id
      })
      showMessage('success', res.data.message)
      setSelectedElection(null)
      setCandidates([])
      setSelectedCandidate(null)
      loadElections()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to cast vote')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-white">Voter Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">ID: {user?.voterId}</span>
            <span className="text-gray-400">Welcome, {user?.name}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
            {message.text}
          </div>
        )}

        <h2 className="text-2xl font-bold text-white mb-6">Available Elections</h2>
        
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
                  election.hasVoted ? 'border-green-500/50' : 'border-gray-700'
                }`}
              >
                <h3 className="text-lg font-semibold text-white mb-2">{election.title}</h3>
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
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
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
              <h3 className="text-xl font-semibold text-white">
                Candidates for: {selectedElection.title}
              </h3>
              <button
                onClick={() => {
                  setSelectedElection(null)
                  setCandidates([])
                  setSelectedCandidate(null)
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
              >
                Close
              </button>
            </div>
            
            {candidates.length === 0 ? (
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
                        <h4 className="font-semibold text-white">{candidate.name}</h4>
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
              <div className="mt-6">
                <button
                  onClick={handleVote}
                  disabled={voting}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {voting ? 'Submitting Vote...' : `Vote for ${selectedCandidate.name}`}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
