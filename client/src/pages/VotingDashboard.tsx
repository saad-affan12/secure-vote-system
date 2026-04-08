import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVote, Candidate } from '../context/VoteContext';
import { useEvent } from '../context/EventContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { Vote, CheckCircle, Lock, AlertTriangle, X } from 'lucide-react';
import { voterCandidates } from '../services/api';
import { toast } from '../components/ui/sonner';

type CandidateApiResponse = {
  id?: string | number;
  candidate_id?: string | number;
  name: string;
  party: string;
  image?: string;
  slogan?: string;
};

const normalizeCandidates = (candidates: CandidateApiResponse[] = []): Candidate[] =>
  candidates
    .map((candidate) => ({
      id: String(candidate.id ?? candidate.candidate_id ?? ''),
      name: candidate.name,
      party: candidate.party,
      image: candidate.image,
      slogan: candidate.slogan,
    }))
    .filter((candidate) => candidate.id && candidate.name);

const isEventAvailable = (startDate?: string, endDate?: string, nowTs: number = Date.now()) => {
  if (!startDate) return false;

  const parsedStartDate = new Date(startDate);
  if (Number.isNaN(parsedStartDate.getTime())) return false;
  if (parsedStartDate.getTime() > nowTs) return false;

  if (!endDate) return true;
  const parsedEndDate = new Date(endDate);
  if (Number.isNaN(parsedEndDate.getTime())) return false;
  return parsedEndDate.getTime() >= nowTs;
};

const CandidateCard = ({ c, selected, onSelect, disabled }: { c: Candidate; selected: boolean; onSelect: () => void; disabled: boolean }) => (
  <motion.div
    layout
    whileHover={disabled ? {} : { scale: 1.03 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    onClick={disabled ? undefined : onSelect}
    className={`glass-card-hover p-6 cursor-pointer relative overflow-hidden transition-all ${selected ? 'border-primary/60 shadow-[0_0_25px_hsl(var(--glow-primary)/0.2)]' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {selected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-primary-foreground" />
      </motion.div>
    )}
    {c.image ? <div className="text-4xl mb-3">{c.image}</div> : null}
    <h3 className="text-lg font-semibold text-foreground">{c.name}</h3>
    <p className="text-sm text-primary mt-0.5">{c.party}</p>
    {c.slogan ? <p className="text-xs text-muted-foreground mt-2 italic">"{c.slogan}"</p> : null}
  </motion.div>
);

const VotingDashboard = () => {
  const { user } = useAuth();
  const { hasVoted, userVotesByElection, isVotingLocked, castVote, setBallotCandidates } = useVote();
  const { events } = useEvent();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeElection, setActiveElection] = useState<string | null>(null);
  const [expandedElection, setExpandedElection] = useState<string | null>(null);
  const [candidateLists, setCandidateLists] = useState<Record<string, Candidate[]>>({});
  const [candidateErrors, setCandidateErrors] = useState<Record<string, string | null>>({});
  const [loadingElection, setLoadingElection] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!user || user.role !== 'voter') {
      navigate('/login', { replace: true });
      return;
    }
  }, [hasVoted, navigate, user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const availableEvents = events.filter((eventItem) => {
    return isEventAvailable(eventItem.startDate, eventItem.endDate, now);
  });

  useEffect(() => {
    if (expandedElection == null) return;
    const expandedEvent = events.find((eventItem) => Number(eventItem.id) === expandedElection);
    if (expandedEvent && !isEventAvailable(expandedEvent.startDate, expandedEvent.endDate, now)) {
      setExpandedElection(null);
      setActiveElection(null);
      setSelected(null);
      setShowConfirm(false);
      setBallotCandidates([]);
    }
  }, [events, expandedElection, now, setBallotCandidates]);

  const handleVote = () => {
    if (!selected || !activeElection) return;

    (async () => {
      try {
        setShowConfirm(false);
        const succeeded = await castVote(activeElection, selected);
        if (succeeded) {
          navigate('/confirmation');
        }
      } catch (error) {
        console.error('Failed to submit vote', error);
        setShowConfirm(false);
      }
    })();
  };

  const handleToggleCandidates = async (eventItem: typeof events[number]) => {
    const electionId = String(eventItem.id);

    if (expandedElection === electionId) {
      setExpandedElection(null);
      setActiveElection(null);
      setSelected(null);
      setBallotCandidates([]);
      return;
    }

    setExpandedElection(electionId);
    setActiveElection(electionId);
    setSelected(null);

    if (candidateLists[electionId] && !candidateErrors[electionId]) {
      setBallotCandidates(candidateLists[electionId]);
      return;
    }

    const embeddedCandidates = normalizeCandidates((eventItem.candidates || []) as CandidateApiResponse[]);
    if (embeddedCandidates.length > 0) {
      setCandidateLists((prev) => ({ ...prev, [electionId]: embeddedCandidates }));
      setCandidateErrors((prev) => ({ ...prev, [electionId]: null }));
      setBallotCandidates(embeddedCandidates);
      return;
    }

    try {
      setLoadingElection(electionId);
      const token = localStorage.getItem('vote_token') || undefined;
      const res = await voterCandidates(electionId, token);
      const nextCandidates = normalizeCandidates((res.data?.candidates || []) as CandidateApiResponse[]);

      setCandidateLists((prev) => ({ ...prev, [electionId]: nextCandidates }));
      setCandidateErrors((prev) => ({
        ...prev,
        [electionId]: nextCandidates.length === 0 ? 'No candidates are available for this event yet.' : null,
      }));
      setBallotCandidates(nextCandidates);
    } catch (error) {
      console.error('Failed to load candidates', error);
      setCandidateLists((prev) => ({ ...prev, [electionId]: [] }));
      setCandidateErrors((prev) => ({ ...prev, [electionId]: 'Unable to load candidates right now.' }));
      setBallotCandidates([]);
      toast.error('Unable to load candidates right now.');
    } finally {
      setLoadingElection(null);
    }
  };

  if (!user || user.role !== 'voter') return <div>Loading...</div>;
  if (!events) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4 text-sm text-primary">
              <Vote className="w-4 h-4" /> Official Ballot
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Available Events</h1>
            <p className="text-muted-foreground">Choose an event to see candidates and cast your vote</p>
          </motion.div>

          {isVotingLocked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-destructive">
              <Lock className="w-5 h-5" />
              <div>
                <p className="font-medium">Voting is currently locked</p>
                <p className="text-sm opacity-80">The election administrator has temporarily locked voting.</p>
              </div>
            </motion.div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {availableEvents.length === 0 ? (
              <motion.div className="glass-card p-6 text-center">
                <p className="text-lg font-medium">No elections available yet. Please check back later.</p>
              </motion.div>
            ) : availableEvents.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="glass-card p-6">
                  {(() => {
                    const electionId = Number(ev.id);
                    const alreadyVotedForEvent = !!userVotesByElection[String(ev.id)];
                    const eventCandidates = candidateLists[electionId] || [];
                    const canCastVote = !!selected && activeElection === electionId && !isVotingLocked && !alreadyVotedForEvent && eventCandidates.length > 0;

                    return (
                      <>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{ev.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{ev.description}</p>
                  <div className="text-xs text-muted-foreground mb-4">Start: {ev.startDate ? new Date(ev.startDate).toLocaleString() : 'TBD'}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleToggleCandidates(ev)}
                      className="py-2 px-3 rounded bg-primary text-primary-foreground"
                    >
                      {expandedElection === Number(ev.id) ? 'Hide Candidates' : 'View Candidates'}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedElection === Number(ev.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-5">
                          <h4 className="text-lg font-semibold text-foreground mb-2">Candidates</h4>
                          {loadingElection === Number(ev.id) ? (
                            <p className="text-sm text-muted-foreground mb-4">Loading candidates...</p>
                          ) : candidateErrors[Number(ev.id)] ? (
                            <p className="text-sm text-muted-foreground mb-4">{candidateErrors[Number(ev.id)]}</p>
                          ) : alreadyVotedForEvent ? (
                            <p className="text-sm text-muted-foreground mb-4">You have already submitted your vote for this event.</p>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-4">Select a candidate and cast your vote</p>
                          )}

                          {eventCandidates.length > 0 ? (
                            <div className="grid gap-4 mb-4">
                              {eventCandidates.map((c) => (
                                <CandidateCard
                                  key={c.id}
                                  c={c}
                                  selected={selected === c.id && activeElection === electionId}
                                  onSelect={() => {
                                    setActiveElection(electionId);
                                    setSelected(c.id);
                                    setBallotCandidates(eventCandidates);
                                  }}
                                  disabled={isVotingLocked || alreadyVotedForEvent}
                                />
                              ))}
                            </div>
                          ) : null}

                          <div className="flex gap-3">
                            {alreadyVotedForEvent ? (
                              <button
                                type="button"
                                disabled
                                className="py-3 px-4 rounded bg-accent text-accent-foreground font-medium opacity-50 cursor-not-allowed"
                              >
                                Vote Submitted
                              </button>
                            ) : (
                              <button
                                disabled={!canCastVote}
                                onClick={() => setShowConfirm(true)}
                                className="py-3 px-4 rounded bg-accent text-accent-foreground font-medium disabled:opacity-50"
                              >
                                Cast Vote
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setExpandedElection(null);
                                setSelected(null);
                                setActiveElection(null);
                                setBallotCandidates([]);
                              }}
                              className="py-3 px-4 rounded glass-card"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-8 max-w-sm w-full text-center relative"
            >
              <button aria-label="Close" onClick={() => setShowConfirm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Confirm Your Vote</h2>
              <p className="text-muted-foreground mb-2">You are voting for:</p>
              <p className="text-lg font-semibold neon-text mb-1">{(candidateLists[activeElection || -1] || []).find((c) => c.id === selected)?.name}</p>
              <p className="text-sm text-primary/70 mb-6">{(candidateLists[activeElection || -1] || []).find((c) => c.id === selected)?.party}</p>
              <p className="text-xs text-muted-foreground mb-6">This action cannot be undone. Your vote is final and will be encrypted immediately.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-lg glass-card text-foreground font-medium hover:border-primary/30 transition-all">Cancel</button>
                <button onClick={handleVote} className="flex-1 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-all">Confirm Vote</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VotingDashboard;
