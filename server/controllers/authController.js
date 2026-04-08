import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

async function generateUniqueVoterId() {
  while (true) {
    const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    const candidate = `V${num}`
    const exists = await User.findOne({ voterId: candidate }).select('_id').lean()
    if (!exists) return candidate
  }
}

export async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body || {}
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    
    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedRole = role === 'admin' ? 'admin' : 'voter'
    
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean()
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }
    
    const voterId = await generateUniqueVoterId()
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      voterId,
      role: normalizedRole,
      isVerified: true
    })
    
    await user.save()
    
    return res.status(201).json({ 
      message: 'Registered successfully', 
      voterId, 
      role: normalizedRole 
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {}
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }
    
    const identifier = String(email).trim()
    
    const user = await User.findOne({ 
      $or: [{ email: identifier.toLowerCase() }, { voterId: identifier }] 
    }).lean()
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or voter ID' })
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' })
    }
    
    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, { expiresIn: '7d' })
    
    return res.status(200).json({ 
      token, 
      user: { 
        id: String(user._id), 
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        hasVoted: user.hasVoted || false
      } 
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password -otp -otpExpiry').lean()
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    return res.status(200).json({ 
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        hasVoted: user.hasVoted || false
      }
    })
  } catch (err) {
    console.error('Get profile error:', err)
    return res.status(500).json({ message: 'Failed to get profile' })
  }
}
