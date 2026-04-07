import mongoose from 'mongoose'

const electionSchema = new mongoose.Schema({
  title: String,
  description: String,
  start_date: Date,
  end_date: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('Election', electionSchema)
