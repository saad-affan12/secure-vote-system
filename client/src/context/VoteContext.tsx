import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { voterElections, castVote as apiCastVote } from '../services/api';
import { EventItem, EventProvider, useEvent } from './EventContext';
import { useAuth } from './AuthContext';
import { toast } from '../components/ui/sonner';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  image?: string;
  slogan?: string;
  votes?: number;
}

interface VoteContextType {
  candidates: Candidate[];
  hasVoted: boolean;
  userVotesByElection: Record<string, boolean>;
  votedFor: string | null;
  voteId: string | null;
  castVote: (electionId: string | number, candidateId: string) => Promise<boolean>;
  setBallotCandidates: (candidates: Candidate[]) => void;
  clearRecentVote: () => void;
  voteCounts: Record<string, number>;
  isVotingLocked: boolean;
  lockVoting: () => void;
  unlockVoting: () => void;
  totalVotes: number;
  declareResults: boolean;
  setDeclareResults: (v: boolean) => void;
}

const VoteContext = createContext<VoteContextType | null>(null);

const normalizeCandidates = (candidates: any[] = []): Candidate[] =>
  candidates
    .map((candidate: any) => ({
      id: String(candidate.id ?? candidate.candidate_id ?? ''),
      name: candidate.name,
      party: candidate.party,
      image: candidate.image,
      slogan: candidate.slogan,
      votes: candidate.votes,
    }))
    .filter((candidate: Candidate) => candidate.id && candidate.name);

export const useVote = () => {
  const ctx = useContext(VoteContext);
  if (!ctx) throw new Error('useVote must be inside VoteProvider');
  return ctx;
};

const VoteProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVotesByElection, setUserVotesByElection] = useState<Record<string, boolean>>({});
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [isVotingLocked, setIsVotingLocked] = useState(false);
  const [declareResults, setDeclareResults] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const { setEvents } = useEvent();

  const fetchVoterElections = useCallback(async () => {
    if (!user || user.role !== 'voter') return;

    const token = localStorage.getItem('vote_token') || undefined;
    const res = await voterElections(token);
    const data = res?.data || {};
    const allElections = data.elections || [];

    setElections(allElections);
    setEvents(allElections.map((el: any): EventItem => ({
      id: el.id,
      title: el.title,
      description: el.description,
      startDate: el.startDate ?? el.start_date,
      endDate: el.endDate ?? el.end_date,
      candidates: normalizeCandidates(el.candidates || []),
    })));

    const counts: Record<string, number> = {};
    for (const election of allElections) {
      const normalizedCandidates = normalizeCandidates(election.candidates || []);
      for (const candidate of normalizedCandidates) counts[candidate.id] = candidate.votes || 0;
    }
    setVoteCounts(counts);

    if (allElections.length > 0) {
      setCandidates(normalizeCandidates(allElections[0].candidates || []));
    } else {
      setCandidates([]);
    }

    const userVotes = data.userVotes || {};
    setUserVotesByElection(userVotes);
    setHasVoted(false);
  }, [setEvents, user]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      if (!user || user.role !== 'voter') {
        if (mounted) {
          setElections([]);
          setCandidates([]);
          setVoteCounts({});
          setHasVoted(false);
          setUserVotesByElection({});
          setVotedFor(null);
          setVoteId(null);
          setEvents([]);
        }
        return;
      }

      try {
        if (!mounted) return;
        await fetchVoterElections();
      } catch (err) {
        // on error, keep safe defaults
        // eslint-disable-next-line no-console
        console.error('Failed to load elections', err);
        if (mounted) {
          setElections([]);
          setCandidates([]);
          setVoteCounts({});
          setUserVotesByElection({});
          setEvents([]);
        }
      }
    };
    fetch();
    return () => { mounted = false };
  }, [fetchVoterElections, setEvents, user]);

  const setBallotCandidates = useCallback((nextCandidates: Candidate[]) => {
    setCandidates(nextCandidates);
  }, []);

  const clearRecentVote = useCallback(() => {
    setHasVoted(false);
    setVotedFor(null);
    setVoteId(null);
  }, []);

  const castVote = useCallback(async (electionId: string | number, candidateId: string) => {
    if (userVotesByElection[String(electionId)] || isVotingLocked) return false;
    try {
      const token = localStorage.getItem('vote_token') || undefined;
      const res = await apiCastVote({ electionId, candidateId }, token as string | undefined);
      if (res?.status === 201 || res?.status === 200) {
        setHasVoted(true);
        setUserVotesByElection(prev => ({ ...prev, [String(electionId)]: true }));
        setVotedFor(candidateId);
        setVoteId(res.data?.id || null);
        setVoteCounts(prev => ({ ...prev, [candidateId]: (prev[candidateId] || 0) + 1 }));
        toast.success('Vote submitted');
        return true;
      }
      return false;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('castVote error', err);
      toast.error(err?.response?.data?.message || 'Failed to submit vote');
      return false;
    }
  }, [isVotingLocked, userVotesByElection]);

  const lockVoting = useCallback(() => {
    setIsVotingLocked(true);
    try { localStorage.setItem('voting_locked', 'true'); } catch {}
  }, []);

  const unlockVoting = useCallback(() => {
    setIsVotingLocked(false);
    try { localStorage.removeItem('voting_locked'); } catch {}
  }, []);

  const handleDeclare = useCallback((v: boolean) => {
    setDeclareResults(v);
    try {
      if (v) localStorage.setItem('results_declared', 'true');
      else localStorage.removeItem('results_declared');
    } catch {}
  }, []);

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return (
    <VoteContext.Provider value={{
      candidates,
      hasVoted,
      userVotesByElection,
      votedFor,
      voteId,
      castVote,
      setBallotCandidates,
      clearRecentVote,
      voteCounts,
      isVotingLocked,
      lockVoting,
      unlockVoting,
      totalVotes,
      declareResults,
      setDeclareResults: handleDeclare,
    }}>
      {children}
    </VoteContext.Provider>
  );
};

export const VoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EventProvider>
    <VoteProviderInner>{children}</VoteProviderInner>
  </EventProvider>
);
