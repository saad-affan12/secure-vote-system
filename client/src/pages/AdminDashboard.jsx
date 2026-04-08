import { useState, useEffect } from 'react'
import api from '../api'

export default function AdminDashboard({ user, onLogout }) {
  const [elections, setElections] = useState([])
  const [voters, setVoters] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateParty, setCandidateParty] = useState('')
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
      const [electionsRes, votersRes] = await Promise.all([
        api.get('/admin/elections'),
        api.get('/admin/voters')
      ])
      setElections(electionsRes.data.elections || [])
      setVoters(votersRes.data.voters || [])
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleCreateElection = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      showMessage('error', 'Please enter election title')
      return
    }
    try {
      const res = await api.post('/admin/election', { title, description })
      showMessage('success', res.data.message)
      setTitle('')
      setDescription('')
      loadData()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to create election')
    }
  }

  const handleAddCandidate = async (e) => {
    e.preventDefault()
    if (!selectedElection || !candidateName.trim()) {
      showMessage('error', 'Please select election and enter candidate name')
      return
    }
    try {
      const res = await api.post('/admin/candidate', {
        electionId: selectedElection,
        name: candidateName,
        party: candidateParty
      })
      showMessage('success', res.data.message)
      setCandidateName('')
      setCandidateParty('')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to add candidate')
    }
  }

  const handleViewResults = async (electionId) => {
    try {
      const res = await api.get(`/admin/results/${electionId}`)
      setResults(res.data)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to load results')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
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

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Create Election</h2>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Election Title"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
                rows={3}
              />
              <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
                Create Election
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Add Candidate</h2>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
              >
                <option value="">Select Election</option>
                {elections.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Candidate Name"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
              />
              <input
                type="text"
                value={candidateParty}
                onChange={(e) => setCandidateParty(e.target.value)}
                placeholder="Party (optional)"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
              />
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                Add Candidate
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">View Results</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {elections.map((e) => (
              <button
                key={e.id}
                onClick={() => handleViewResults(e.id)}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition text-left"
              >
                <h3 className="font-semibold">{e.title}</h3>
                {e.description && <p className="text-gray-400 text-sm mt-1">{e.description}</p>}
              </button>
            ))}
          </div>
          
          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Results: {results.election.title}</h3>
              <p className="text-gray-400 mb-4">Total Votes: {results.totalVotes}</p>
              <div className="space-y-3">
                {results.results.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                      <span className="font-semibold text-white">{r.name}</span>
                      {r.party && <span className="text-gray-400 ml-2">({r.party})</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {i === 0 && r.votes > 0 && (
                        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">WINNER</span>
                      )}
                      <span className="text-white font-mono">{r.votes} votes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">All Elections ({elections.length})</h2>
          {elections.length === 0 ? (
            <p className="text-gray-400">No elections created yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elections.map((e) => (
                <div key={e.id} className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-white">{e.title}</h3>
                  {e.description && <p className="text-gray-400 text-sm mt-1">{e.description}</p>}
                  <p className="text-gray-500 text-xs mt-2">Status: {e.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Registered Voters ({voters.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voters.slice(0, 12).map((v) => (
              <div key={v.id} className="p-3 bg-gray-700 rounded-lg">
                <p className="text-white font-medium">{v.name}</p>
                <p className="text-gray-400 text-sm">{v.voterId}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
