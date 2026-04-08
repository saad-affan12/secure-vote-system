import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminElections, createElection, addCandidate, adminUsers, adminResults } from '../services/api'

interface Election {
  id: string
  title: string
  description: string
  createdAt: string
}

interface Voter {
  id: string
  name: string
  email: string
  voterId: string
}

interface Result {
  candidateId: string
  name: string
  party: string
  votes: number
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [elections, setElections] = useState<Election[]>([])
  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  
  const [selectedElection, setSelectedElection] = useState('')
  const [selectedVoter, setSelectedVoter] = useState('')
  const [party, setParty] = useState('')
  
  const [results, setResults] = useState<Result[]>([])
  const [selectedResultElection, setSelectedResultElection] = useState('')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const [electionsRes, votersRes] = await Promise.all([
        adminElections(),
        adminUsers()
      ])
      
      if (electionsRes.status === 200) {
        setElections(electionsRes.data.elections || [])
      }
      
      if (votersRes.status === 200) {
        setVoters(votersRes.data.voters || [])
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTitle.trim()) {
      setError('Please enter election title')
      return
    }
    
    setError('')
    setSuccess('')
    
    try {
      const res = await createElection({ title: newTitle, description: newDesc })
      
      if (res.status === 201) {
        setSuccess('Election created successfully!')
        setNewTitle('')
        setNewDesc('')
        loadData()
      } else {
        setError(res.data?.message || 'Failed to create election')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create election')
    }
  }

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedElection || !selectedVoter) {
      setError('Please select election and voter')
      return
    }
    
    setError('')
    setSuccess('')
    
    try {
      const res = await addCandidate({ 
        electionId: selectedElection, 
        userId: selectedVoter, 
        party 
      })
      
      if (res.status === 201) {
        setSuccess('Candidate added successfully!')
        setSelectedElection('')
        setSelectedVoter('')
        setParty('')
      } else {
        setError(res.data?.message || 'Failed to add candidate')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add candidate')
    }
  }

  const handleViewResults = async () => {
    if (!selectedResultElection) {
      setError('Please select an election')
      return
    }
    
    setError('')
    
    try {
      const res = await adminResults(selectedResultElection)
      
      if (res.status === 200) {
        setResults(res.data.results || [])
        setShowResults(true)
      } else {
        setError(res.data?.message || 'Failed to load results')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load results')
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
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
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

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Create Election</h2>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Election Title"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
                rows={3}
              />
              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                Create Election
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Add Candidate</h2>
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
              <select
                value={selectedVoter}
                onChange={(e) => setSelectedVoter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
              >
                <option value="">Select Voter</option>
                {voters.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.voterId})</option>
                ))}
              </select>
              <input
                type="text"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="Party (optional)"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Add Candidate
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">View Results</h2>
          <div className="flex gap-4 items-end">
            <select
              value={selectedResultElection}
              onChange={(e) => setSelectedResultElection(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
            >
              <option value="">Select Election</option>
              {elections.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <button
              onClick={handleViewResults}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
            >
              View Results
            </button>
          </div>
          
          {showResults && results.length > 0 && (
            <div className="mt-6 space-y-3">
              {results.map((r, i) => (
                <div key={r.candidateId} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <span className="font-semibold">{r.name}</span>
                    {r.party && <span className="text-gray-400 ml-2">({r.party})</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {i === 0 && r.votes > 0 && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">WINNER</span>
                    )}
                    <span className="font-mono text-lg">{r.votes} votes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showResults && results.length === 0 && (
            <p className="mt-4 text-gray-400">No votes recorded yet.</p>
          )}
        </div>

        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Elections ({elections.length})</h2>
          {elections.length === 0 ? (
            <p className="text-gray-400">No elections created yet.</p>
          ) : (
            <div className="space-y-3">
              {elections.map((e) => (
                <div key={e.id} className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-semibold">{e.title}</h3>
                  {e.description && <p className="text-gray-400 text-sm mt-1">{e.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
