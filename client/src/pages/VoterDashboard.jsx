import { useEffect, useState } from 'react'
import {
  castVoteAPI,
  getMyVotesAPI,
  getVoterCandidatesAPI,
  getVoterElectionsAPI
} from '../api'

export default function VoterDashboard({ user, onLogout }) {
  const [elections, setElections] = useState([])
  const [selectedElection, setSelectedElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [myVotes, setMyVotes] = useState([])
  const [showMyVotes, setShowMyVotes] = useState(false)

  useEffect(() => {
    loadElections()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const loadElections = async () => {
    setLoading(true)
    try {
      const res = await getVoterElectionsAPI()
      setElections(res.data.elections || [])
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  const closeBallot = () => {
    setSelectedElection(null)
    setCandidates([])
    setSelectedCandidate(null)
  }

  const handleSelectElection = async (election) => {
    if (!election.isOpen) {
      if (!election.isActive) {
        showMessage('error', 'This election is currently inactive')
      } else if (election.startDate && new Date(election.startDate) > new Date()) {
        showMessage('error', 'Voting has not started yet')
      } else {
        showMessage('error', 'Voting has ended for this election')
      }
      return
    }

    setSelectedElection(election)
    setSelectedCandidate(null)

    try {
      const res = await getVoterCandidatesAPI(election.id)
      setCandidates(res.data.candidates || [])
      if ((res.data.candidates || []).length === 0) {
        showMessage('error', 'No candidates have been added to this election yet')
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load candidates')
    }
  }

  const handleVote = async () => {
    if (!selectedElection || !selectedCandidate) return

    setVoting(true)
    try {
      const res = await castVoteAPI({
        electionId: selectedElection.id,
        candidateId: selectedCandidate.id
      })
      showMessage('success', res.data.message)
      closeBallot()
      await loadElections()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to cast vote')
    } finally {
      setVoting(false)
    }
  }

  const loadMyVotes = async () => {
    try {
      const res = await getMyVotesAPI()
      setMyVotes(res.data.votes || [])
      setShowMyVotes(true)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load vote history')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-blue-900 border-b border-blue-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Voter Dashboard</h1>
            <p className="text-blue-300 text-sm">Choose your favorite candidate in each election</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <span className="text-blue-300">ID: {user?.voterId}</span>
            <span className="text-blue-300">Welcome, {user?.name}</span>
            <button
              onClick={loadMyVotes}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              My Votes
            </button>
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
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <h2 className="text-2xl font-bold text-white mb-6">Available Elections</h2>

        {elections.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-blue-600 text-center">
            <p className="text-gray-400">No elections available at the moment.</p>
            <p className="text-blue-400 text-sm mt-2">Check back later for upcoming elections.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div
                key={election.id}
                className={`bg-gray-800 rounded-xl p-6 border ${
                  election.hasVoted
                    ? 'border-green-500/50'
                    : election.isOpen
                      ? 'border-blue-500/50'
                      : 'border-gray-700'
                }`}
              >
                <h3 className="text-lg font-semibold text-white mb-2">{election.title}</h3>
                {election.description && (
                  <p className="text-gray-400 text-sm mb-4">{election.description}</p>
                )}

                <div className="space-y-2 text-sm mb-4">
                  <p className="text-blue-300">Candidates standing: {election.candidateCount || 0}</p>
                  {election.startDate && (
                    <p className="text-gray-400">Starts: {new Date(election.startDate).toLocaleString()}</p>
                  )}
                  {election.endDate && (
                    <p className="text-gray-400">Ends: {new Date(election.endDate).toLocaleString()}</p>
                  )}
                  {election.hasVoted ? (
                    <span className="text-green-400">Vote submitted</span>
                  ) : election.isOpen ? (
                    <span className="text-blue-400">Voting open</span>
                  ) : (
                    <span className="text-red-400">Voting closed</span>
                  )}
                </div>

                {election.candidates?.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {election.candidates.map((candidate) => (
                      <span
                        key={candidate.id}
                        className="px-2 py-1 rounded-full bg-gray-700 border border-gray-600 text-xs text-gray-200"
                      >
                        {candidate.name}
                      </span>
                    ))}
                  </div>
                )}

                {!election.hasVoted && (
                  <button
                    onClick={() => handleSelectElection(election)}
                    disabled={!election.isOpen}
                    className={`w-full py-2 rounded-lg font-medium transition ${
                      election.isOpen
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {election.isOpen ? 'Choose Candidate' : 'Not Available'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedElection && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-blue-600">
            <div className="flex justify-between items-center mb-6 gap-3">
              <div>
                <h3 className="text-xl font-semibold text-white">Ballot for: {selectedElection.title}</h3>
                <p className="text-blue-300 text-sm mt-1">
                  Select the candidate you want to support in this election.
                </p>
              </div>
              <button
                onClick={closeBallot}
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
                        : 'border-gray-700 bg-gray-700/50 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <h4 className="font-semibold text-white">{candidate.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {candidate.party || 'Independent candidate'}
                        </p>
                      </div>
                      {selectedCandidate?.id === candidate.id && (
                        <span className="text-blue-400 font-semibold">Selected</span>
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

        {showMyVotes && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6 gap-3">
              <h3 className="text-xl font-semibold text-white">My Vote History</h3>
              <button
                onClick={() => setShowMyVotes(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
              >
                Close
              </button>
            </div>

            {myVotes.length === 0 ? (
              <p className="text-gray-400">You have not voted in any elections yet.</p>
            ) : (
              <div className="space-y-3">
                {myVotes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg gap-4">
                    <div>
                      <p className="text-white font-medium">{vote.electionTitle}</p>
                      <p className="text-gray-400 text-sm">
                        Voted for: {vote.candidateName}
                        {vote.candidateParty && ` (${vote.candidateParty})`}
                      </p>
                    </div>
                    <p className="text-gray-400 text-sm">{new Date(vote.votedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
