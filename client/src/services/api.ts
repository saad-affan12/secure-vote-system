import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
})

export const registerUser = (data: any) => API.post('/auth/register', data)
export const loginUser = (data: any) => API.post('/auth/login', data)

export default API

// Admin endpoints
export const createElection = (data: any, token?: string) => API.post('/admin/create-election', data, { headers: { Authorization: `Bearer ${token}` } })
export const addCandidate = (data: any, token?: string) => API.post('/admin/add-candidate', data, { headers: { Authorization: `Bearer ${token}` } })
export const adminElections = (token?: string) => API.get('/admin/elections', { headers: { Authorization: `Bearer ${token}` } })
export const adminResults = (electionId: string | number, token?: string) => API.get(`/admin/results/${electionId}`, { headers: { Authorization: `Bearer ${token}` } })
export const adminUsers = (token?: string) => API.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } })

// Voter endpoints
export const voterElections = (token?: string) => API.get('/voter/elections', { headers: { Authorization: `Bearer ${token}` } })
export const castVote = (data: any, token?: string) => API.post('/vote', data, { headers: { Authorization: `Bearer ${token}` } })
export const voterCandidates = (electionId: string, token?: string) => API.get(`/voter/candidates/${electionId}`, { headers: { Authorization: `Bearer ${token}` } })
