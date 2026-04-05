import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVote } from '../context/VoteContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { BarChart3, Users, Lock, Unlock, Award, Activity, Shield, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { createElection, addCandidate, adminElections, adminResults, adminUsers } from '../services/api';
import { useEvent } from '../context/EventContext';
import { toast } from '../components/ui/sonner';

const barColors = ['hsl(185, 80%, 50%)', 'hsl(150, 80%, 50%)', 'hsl(40, 90%, 55%)', 'hsl(280, 70%, 60%)'];

const mapElectionToEvent = (election: any) => ({
  id: election.id,
  title: election.title,
  description: election.description,
  startDate: election.startDate ?? election.start_date,
  endDate: election.endDate ?? election.end_date,
  candidates: election.candidates || [],
});

type ResultRow = {
  candidate_id: number;
  user_id: number;
  name: string;
  party: string;
  votes: number;
};

const AdminPanel = () => {
  const { user } = useAuth();
  const { candidates, voteCounts, totalVotes, isVotingLocked, lockVoting, unlockVoting, declareResults, setDeclareResults } = useVote();
  const { setEvents } = useEvent();
  const navigate = useNavigate();
  const [activityLog] = useState<any[]>([]);

  const roleValue = user?.role ? String(user.role).trim().toLowerCase() : null;
  useEffect(() => {
    if (!user || roleValue !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [navigate, roleValue, user]);

  if (!user || roleValue !== 'admin') return <div>Loading...</div>;

  const winner = candidates.length ? candidates.reduce((a, b) => (voteCounts[a.id] || 0) >= (voteCounts[b.id] || 0) ? a : b) : { name: '-', party: '-', id: '' };

  const statCards = [
    { icon: Users, label: 'Total Votes', value: totalVotes, color: 'text-primary' },
    { icon: BarChart3, label: 'Candidates', value: candidates.length, color: 'text-accent' },
    { icon: Activity, label: 'Turnout', value: `${Math.round((totalVotes / 600) * 100)}%`, color: 'text-primary' },
    { icon: Shield, label: 'Status', value: isVotingLocked ? 'Locked' : 'Active', color: isVotingLocked ? 'text-destructive' : 'text-accent' },
  ];

  // Admin forms/state
  const [electionsList, setElectionsList] = useState<any[]>([])
  const [selectedElection, setSelectedElection] = useState<number | null>(null)
  const [candParty, setCandParty] = useState('')
  const [usersList, setUsersList] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [resultsElectionId, setResultsElectionId] = useState<number | null>(null)
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true)

  const [evTitle, setEvTitle] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evStart, setEvStart] = useState('')
  const [evEnd, setEvEnd] = useState('')

  const loadElections = async () => {
    const token = localStorage.getItem('vote_token') || undefined
    const res = await adminElections(token as string | undefined)
      const data = res?.data || {}
      const elections = data.elections || []
      setElectionsList(elections)
      setEvents(elections.map(mapElectionToEvent))
      setResultsElectionId((prev) => prev ?? elections[0]?.id ?? null)
      setSelectedElection((prev) => prev ?? elections[0]?.id ?? null)
  }

  const handleAddCandidate = async () => {
    if (!selectedElection || !selectedUserId) {
      toast.error('Select both election and user');
      return;
    }
    try {
      const token = localStorage.getItem('vote_token') || undefined
      await addCandidate({ electionId: selectedElection, userId: selectedUserId, party: candParty }, token)
      setSelectedUserId(null); setCandParty('')
      toast.success('Candidate added successfully');
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to add candidate');
    }
  }

  const [results, setResults] = useState<ResultRow[]>([])
  const loadResults = async (eid?: number | null) => {
    if (!eid) {
      setResults([])
      return
    }
    try {
      const token = localStorage.getItem('vote_token') || undefined
      const res = await adminResults(eid, token)
      setResults(res.data.results || [])
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to load results')
    }
  }

  const resultsWinner = results.length > 0 ? results[0] : null;
  const chartData = results.map((result) => ({
    name: result.name.split(' ')[1] || result.name,
    votes: Number(result.votes) || 0,
    fullName: result.name,
    party: result.party,
  }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadElections();
        const token = localStorage.getItem('vote_token') || undefined
        const res = await adminUsers(token as string | undefined)
        if (!mounted) return
        setUsersList(res?.data?.users || [])
      } catch (err: any) {
        console.error(err)
        if (mounted) toast.error(err?.response?.data?.message || 'Failed to load admin data')
      } finally {
        if (mounted) setIsLoadingAdminData(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!resultsElectionId) return
    if (declareResults) {
      void loadResults(resultsElectionId)
    }
  }, [declareResults, resultsElectionId])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('vote_token') || undefined
      const title = evTitle.trim() || 'Untitled Event'
      const description = evDesc.trim()
      const payload = {
        title,
        description: description || null,
        start_date: evStart || null,
        end_date: evEnd || null,
      }
      await createElection(payload, token)
      await loadElections()
      setEvTitle(''); setEvDesc(''); setEvStart(''); setEvEnd('');
      toast.success('Event created successfully');
    } catch (err: any) {
      console.error('Add event failed', err);
      toast.error(err?.response?.data?.message || 'Failed to create event');
    }
  }

  if (isLoadingAdminData) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1">Admin Panel</h1>
            <p className="text-muted-foreground">Election monitoring and management dashboard</p>
          </motion.div>

          {/* Create New Event */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Event Title" className="w-full px-3 py-2 rounded text-black placeholder:text-slate-400" />
              <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 rounded text-black placeholder:text-slate-400" />
              <div className="flex gap-2">
                <input aria-label="Start date" title="Start date" type="date" value={evStart} onChange={e => setEvStart(e.target.value)} className="flex-1 px-3 py-2 rounded text-black placeholder:text-slate-400" />
                  <input aria-label="End date" title="End date" type="date" value={evEnd} onChange={e => setEvEnd(e.target.value)} className="flex-1 px-3 py-2 rounded text-black placeholder:text-slate-400" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="py-2 px-4 rounded bg-primary text-primary-foreground">Create Event</button>
                <button type="button" onClick={() => { setEvTitle(''); setEvDesc(''); setEvStart(''); setEvEnd(''); }} className="py-2 px-4 rounded glass-card">Reset</button>
              </div>
            </form>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Vote Distribution
              </h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(230, 45%, 12%)', border: '1px solid hsl(230, 30%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 93%)' }}
                      formatter={(value: number, _name: string, props: any) => [`${value} votes`, props.payload.fullName]}
                    />
                    <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={barColors[i % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  Select an election with results to view vote distribution.
                </div>
              )}
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 flex flex-col gap-4"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">Controls</h2>
              <div className="space-y-3">
                <button
                  onClick={isVotingLocked ? unlockVoting : lockVoting}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    isVotingLocked
                      ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
                  }`}
                >
                  {isVotingLocked ? <><Unlock className="w-4 h-4" /> Unlock Voting</> : <><Lock className="w-4 h-4" /> Lock Voting</>}
                </button>

                <button
                  onClick={() => {
                    if (!declareResults && !resultsElectionId && electionsList.length === 0) {
                      toast.error('Create an election first');
                      return;
                    }
                    if (!declareResults && !resultsElectionId && electionsList[0]?.id) {
                      setResultsElectionId(electionsList[0].id)
                    }
                    setDeclareResults(!declareResults)
                  }}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    declareResults
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  <Award className="w-4 h-4" /> {declareResults ? 'Hide Results' : 'Declare Results'}
                </button>

                {declareResults && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Winner</p>
                    <p className="text-lg font-bold neon-text-green">{resultsWinner?.name || winner.name}</p>
                    <p className="text-xs text-primary">{resultsWinner?.party || winner.party}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {resultsWinner ? `${resultsWinner.votes} votes` : `${voteCounts[winner.id] || 0} votes`}
                    </p>
                  </motion.div>
                )}

                {/* Add Candidate */}
                <div className="glass-card p-4">
                  <h3 className="font-medium mb-2">Add Candidate</h3>
                  <select aria-label="Select election" title="Select election" value={selectedElection || ''} onChange={e => setSelectedElection(Number(e.target.value) || null)} className="w-full mb-2 px-3 py-2 rounded text-black">
                    <option value="">Select election</option>
                    {electionsList.map(el => <option key={el.id} value={el.id}>{el.title}</option>)}
                  </select>
                  <select aria-label="Select user" title="Select user" value={selectedUserId || ''} onChange={e => setSelectedUserId(Number(e.target.value) || null)} className="w-full mb-2 px-3 py-2 rounded text-black">
                    <option value="">Select registered user</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                  </select>
                  <input value={candParty} onChange={e => setCandParty(e.target.value)} placeholder="Party (optional)" className="w-full mb-2 px-3 py-2 rounded text-black placeholder:text-slate-400" />
                  <button onClick={handleAddCandidate} className="w-full py-2 rounded bg-accent text-accent-foreground">Add Candidate</button>
                </div>

                {/* View Results */}
                <div className="glass-card p-4">
                  <h3 className="font-medium mb-2">View Results</h3>
                  <select aria-label="Select election results" title="Select election results" value={resultsElectionId || ''} onChange={e => {
                    const nextElectionId = Number(e.target.value) || null
                    setResultsElectionId(nextElectionId)
                    void loadResults(nextElectionId)
                  }} className="w-full mb-2 px-3 py-2 rounded text-black">
                    <option value="">Select election</option>
                    {electionsList.map(el => <option key={el.id} value={el.id}>{el.title}</option>)}
                  </select>
                  <div className="text-sm">
                    {results.map((r) => (
                      <div key={r.candidate_id} className={`flex justify-between py-2 border-b ${resultsWinner?.candidate_id === r.candidate_id ? 'text-accent' : ''}`}>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.party}</div>
                        </div>
                        <div className="font-mono">{r.votes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Activity log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Activity Log
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Action</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.map((log, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="border-b border-border/10 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{log.time}</td>
                      <td className="py-3 px-4 text-foreground">{log.action}</td>
                      <td className="py-3 px-4 text-primary font-mono text-xs">{log.user}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${log.status === 'success' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                          {log.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
