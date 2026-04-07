import mongoose from 'mongoose'

const voteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  election_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

voteSchema.index({ user_id: 1, election_id: 1 }, { unique: true })

export default mongoose.model('Vote', voteSchema)
