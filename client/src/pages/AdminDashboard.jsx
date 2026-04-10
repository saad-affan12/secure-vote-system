import { useEffect, useState } from 'react'
import {
  addCandidateAPI,
  createElectionAPI,
  getElectionsAPI,
  getResultsAPI,
  getVotersAPI,
  toggleElectionAPI
} from '../api'

export default function AdminDashboard({ user, onLogout }) {
  const [elections, setElections] = useState([])
  const [voters, setVoters] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateParty, setCandidateParty] = useState('')
  const [draftCandidateName, setDraftCandidateName] = useState('')
  const [draftCandidateParty, setDraftCandidateParty] = useState('')
  const [draftCandidates, setDraftCandidates] = useState([])
  const [selectedElection, setSelectedElection] = useState('')
  const [results, setResults] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [electionsRes, votersRes] = await Promise.all([getElectionsAPI(), getVotersAPI()])
      setElections(electionsRes.data.elections || [])
      setVoters(votersRes.data.voters || [])
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadElections = async () => {
    try {
      const res = await getElectionsAPI()
      setElections(res.data.elections || [])
    } catch (err) {
      console.error('Failed to load elections:', err)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const resetElectionForm = () => {
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setDraftCandidateName('')
    setDraftCandidateParty('')
    setDraftCandidates([])
  }

  const addDraftCandidate = () => {
    const normalizedName = draftCandidateName.trim()
    const normalizedParty = draftCandidateParty.trim()

    if (!normalizedName) {
      showMessage('error', 'Please enter a candidate name before adding')
      return
    }

    const exists = draftCandidates.some(
      (candidate) => candidate.name.toLowerCase() === normalizedName.toLowerCase()
    )

    if (exists) {
      showMessage('error', 'This candidate is already added to the election draft')
      return
    }

    setDraftCandidates((current) => [
      ...current,
      { name: normalizedName, party: normalizedParty }
    ])
    setDraftCandidateName('')
    setDraftCandidateParty('')
  }

  const removeDraftCandidate = (name) => {
    setDraftCandidates((current) => current.filter((candidate) => candidate.name !== name))
  }

  const handleCreateElection = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      showMessage('error', 'Please enter election title')
      return
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showMessage('error', 'End date must be after start date')
      return
    }

    try {
      const res = await createElectionAPI({
        title,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        candidates: draftCandidates
      })
      showMessage(
        'success',
        draftCandidates.length > 0
          ? `${res.data.message}. ${draftCandidates.length} candidates added.`
          : res.data.message
      )
      resetElectionForm()
      await loadElections()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to create election')
    }
  }

  const handleToggleElection = async (electionId) => {
    try {
      const res = await toggleElectionAPI(electionId)
      showMessage('success', res.data.message)
      await loadElections()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to toggle election')
    }
  }

  const handleAddCandidate = async (e) => {
    e.preventDefault()

    if (!selectedElection || !candidateName.trim()) {
      showMessage('error', 'Please select election and enter candidate name')
      return
    }

    try {
      const res = await addCandidateAPI({
        electionId: selectedElection,
        name: candidateName,
        party: candidateParty
      })
      showMessage('success', res.data.message)
      setCandidateName('')
      setCandidateParty('')
      await loadElections()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to add candidate')
    }
  }

  const handleViewResults = async (electionId) => {
    try {
      const res = await getResultsAPI(electionId)
      setResults(res.data)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load results')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-yellow-900 border-b border-yellow-600 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-yellow-300 text-sm">Create elections and manage candidates</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-yellow-300">Welcome, {user?.name}</span>
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

        <div className="grid xl:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-yellow-600">
            <h2 className="text-xl font-semibold text-white mb-4">Create Election</h2>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Election title"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white placeholder-gray-400"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white placeholder-gray-400"
                rows={3}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white"
                />
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white"
                />
              </div>

              <div className="rounded-xl border border-yellow-600/40 bg-gray-700/40 p-4 space-y-3">
                <div>
                  <h3 className="text-white font-medium">Candidates standing in this election</h3>
                  <p className="text-sm text-gray-400">
                    Add the people voters should be able to choose from when this election is created.
                  </p>
                </div>
                <div className="grid sm:grid-cols-[1.3fr_1fr_auto] gap-3">
                  <input
                    type="text"
                    value={draftCandidateName}
                    onChange={(e) => setDraftCandidateName(e.target.value)}
                    placeholder="Candidate name"
                    className="px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white placeholder-gray-400"
                  />
                  <input
                    type="text"
                    value={draftCandidateParty}
                    onChange={(e) => setDraftCandidateParty(e.target.value)}
                    placeholder="Party or group"
                    className="px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addDraftCandidate}
                    className="px-4 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
                {draftCandidates.length === 0 ? (
                  <p className="text-sm text-gray-400">No candidates added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {draftCandidates.map((candidate) => (
                      <div
                        key={candidate.name}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-800 border border-gray-600"
                      >
                        <div>
                          <p className="text-white font-medium">{candidate.name}</p>
                          {candidate.party && (
                            <p className="text-sm text-gray-400">{candidate.party}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDraftCandidate(candidate.name)}
                          className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                Create Election
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-yellow-600">
            <h2 className="text-xl font-semibold text-white mb-4">Add Candidate Later</h2>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white"
              >
                <option value="">Select election</option>
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.title} ({election.candidateCount || 0} candidates)
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Candidate name"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white placeholder-gray-400"
              />
              <input
                type="text"
                value={candidateParty}
                onChange={(e) => setCandidateParty(e.target.value)}
                placeholder="Party or group"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-yellow-600/50 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Add Candidate
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-yellow-600">
          <h2 className="text-xl font-semibold text-white mb-4">Manage Elections</h2>
          {elections.length === 0 ? (
            <p className="text-gray-400">No elections created yet.</p>
          ) : (
            <div className="space-y-4">
              {elections.map((election) => (
                <div key={election.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-white">{election.title}</h3>
                        {election.description && (
                          <p className="text-gray-300 text-sm">{election.description}</p>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {election.isActive ? 'Active' : 'Inactive'}
                        {election.startDate && ` | Starts: ${new Date(election.startDate).toLocaleString()}`}
                        {election.endDate && ` | Ends: ${new Date(election.endDate).toLocaleString()}`}
                      </p>
                      <p className="text-yellow-300 text-sm">
                        Candidates standing: {election.candidateCount || 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleElection(election.id)}
                        className={`px-3 py-2 rounded text-white text-sm transition ${
                          election.isActive
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {election.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleViewResults(election.id)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition"
                      >
                        Results
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {election.candidates?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {election.candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600"
                          >
                            <p className="text-white text-sm font-medium">{candidate.name}</p>
                            {candidate.party && (
                              <p className="text-gray-400 text-xs">{candidate.party}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No candidates have been added to this election yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results && (
            <div className="mt-6 pt-6 border-t border-yellow-600">
              <div className="flex justify-between items-center mb-4 gap-3">
                <h3 className="text-lg font-semibold text-white">Results: {results.election?.title}</h3>
                <button
                  onClick={() => setResults(null)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                >
                  Close
                </button>
              </div>
              <p className="text-yellow-300 mb-4">Total Votes: {results.totalVotes}</p>
              {results.results?.length === 0 ? (
                <p className="text-gray-400">No votes yet.</p>
              ) : (
                <div className="space-y-3">
                  {results.results?.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      <div>
                        <span className="font-semibold text-white">{candidate.name}</span>
                        {candidate.party && (
                          <span className="text-gray-400 ml-2">({candidate.party})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {index === 0 && candidate.votes > 0 && (
                          <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                            WINNER
                          </span>
                        )}
                        <span className="text-white font-mono">{candidate.votes} votes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-yellow-600">
          <h2 className="text-xl font-semibold text-white mb-4">Registered Voters ({voters.length})</h2>
          {voters.length === 0 ? (
            <p className="text-gray-400">No voters registered yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voters.slice(0, 12).map((voter) => (
                <div key={voter.id} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <p className="text-white font-medium">{voter.name}</p>
                  <p className="text-yellow-300 text-sm">{voter.voterId}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
