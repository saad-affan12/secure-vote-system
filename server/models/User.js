import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, lowercase: true, trim: true },
  voterId: { type: String, unique: true, trim: true },
  password: { type: String },
  role: { type: String, default: 'voter' },
  isVerified: { type: Boolean, default: false },
  hasVoted: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('User', userSchema)
