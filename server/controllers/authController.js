import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

export async function registerUser(req, res) {
  try {
    const { name, email, voterId, password, role } = req.body || {}
    if (!name || !email || !voterId || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedVoterId = String(voterId).trim()
    const normalizedRole = role === 'admin' ? 'admin' : 'voter'

    const emailExisting = await User.findOne({ email: normalizedEmail })
    if (emailExisting) return res.status(409).json({ message: 'Email already exists' })

    const voterIdExisting = await User.findOne({ voterId: normalizedVoterId })
    if (voterIdExisting) return res.status(409).json({ message: 'Voter ID already exists' })

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = new User({
      name,
      email: normalizedEmail,
      voterId: normalizedVoterId,
      password: passwordHash,
      role: normalizedRole,
      isVerified: true
    })
    await user.save()

    return res.status(201).json({ message: 'Registration successful' })
  } catch (err) {
    console.error('registerUser error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ message: 'Missing email or voter ID, or password' })

    const identifier = String(email).trim()

    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { voterId: identifier }] })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid password' })

    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, { expiresIn: '7d' })

    const safeUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      voterId: user.voterId,
      role: user.role || 'voter',
      hasVoted: !!user.hasVoted,
    }

    return res.status(200).json({ token, user: safeUser })
  } catch (err) {
    console.error('loginUser error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

