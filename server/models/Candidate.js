import mongoose from 'mongoose'

const candidateSchema = new mongoose.Schema({
  election_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  party: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('Candidate', candidateSchema)
