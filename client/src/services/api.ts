import { authAPI, adminAPI, voterAPI, voteAPI } from '../api/index'

export const registerUser = (data: { name: string; email: string; password: string; role?: string }) => 
  authAPI.register(data)

export const loginUser = (data: { email: string; password: string }) => 
  authAPI.login(data)

export const createElection = (data: { title: string; description?: string }, token?: string) => {
  if (token) {
    return adminAPI.createElection(data)
  }
  return adminAPI.createElection(data)
}

export const adminElections = () => adminAPI.getElections()

export const addCandidate = (data: { electionId: string; userId: string; party?: string }, token?: string) =>
  adminAPI.addCandidate(data)

export const adminResults = (electionId: string, token?: string) =>
  adminAPI.getResults(electionId)

export const adminUsers = () => adminAPI.getVoters()

export const voterElections = (token?: string) => voterAPI.getElections()

export const voterCandidates = (electionId: string, token?: string) => voterAPI.getCandidates(electionId)

export const castVote = (data: { electionId: string; candidateId: string }, token?: string) =>
  voteAPI.castVote(data)
