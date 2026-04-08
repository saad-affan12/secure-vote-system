import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const adminLoginAPI = (data) => api.post('/auth/admin-login', data)
export const voterLoginAPI = (data) => api.post('/auth/voter-login', data)

export const createElectionAPI = (data) => api.post('/admin/election', data)
export const getElectionsAPI = () => api.get('/admin/elections')
export const toggleElectionAPI = (id) => api.patch(`/admin/election/${id}/toggle`)
export const addCandidateAPI = (data) => api.post('/admin/candidate', data)
export const getElectionCandidatesAPI = (id) => api.get(`/admin/candidates/${id}`)
export const getResultsAPI = (id) => api.get(`/admin/results/${id}`)
export const getVotersAPI = () => api.get('/admin/voters')
export const deleteElectionAPI = (id) => api.delete(`/admin/election/${id}`)

export const getVoterElectionsAPI = () => api.get('/voter/elections')
export const getVoterCandidatesAPI = (id) => api.get(`/voter/candidates/${id}`)
export const castVoteAPI = (data) => api.post('/vote', data)
export const getMyVotesAPI = () => api.get('/voter/my-votes')

export default api
