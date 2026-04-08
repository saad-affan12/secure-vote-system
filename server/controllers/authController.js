import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_2024'
const SALT_ROUNDS = 10

const generateVoterId = async () => {
  while (true) {
    const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    const voterId = `V${num}`
    const exists = await User.findOne({ voterId })
    if (!exists) return voterId
  }
}

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const voterId = await generateVoterId()
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      voterId,
      role: role === 'admin' ? 'admin' : 'voter'
    })
    
    await user.save()
    
    return res.status(201).json({ 
      message: 'Registration successful',
      voterId,
      role: user.role
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ message: 'Registration failed' })
  }
}

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }
    
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Not an admin account' })
    }
    
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    const token = generateToken(user._id, user.role)
    
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return res.status(500).json({ message: 'Login failed' })
  }
}

export const voterLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }
    
    const user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { voterId: email }
      ]
    })
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    if (user.role !== 'voter') {
      return res.status(403).json({ message: 'Not a voter account' })
    }
    
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    const token = generateToken(user._id, user.role)
    
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Voter login error:', error)
    return res.status(500).json({ message: 'Login failed' })
  }
}
