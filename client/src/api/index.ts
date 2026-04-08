import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vote_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vote_token')
      localStorage.removeItem('vote_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile')
}

export const adminAPI = {
  createElection: (data) => api.post('/admin/election', data),
  getElections: () => api.get('/admin/elections'),
  addCandidate: (data) => api.post('/admin/candidate', data),
  getVoters: () => api.get('/admin/voters'),
  getResults: (electionId) => api.get(`/admin/results/${electionId}`),
  deleteElection: (electionId) => api.delete(`/admin/election/${electionId}`)
}

export const voterAPI = {
  getElections: () => api.get('/voter/elections'),
  getCandidates: (electionId) => api.get(`/voter/candidates/${electionId}`),
  getMyVotes: () => api.get('/voter/my-votes')
}

export const voteAPI = {
  castVote: (data) => api.post('/vote', data)
}

export default api
