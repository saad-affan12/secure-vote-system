import mongoose from 'mongoose'

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  party: { type: String },
  votes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

const Candidate = mongoose.model('Candidate', candidateSchema)
export default Candidate
