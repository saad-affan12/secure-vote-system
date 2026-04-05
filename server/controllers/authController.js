import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'

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

    const [emailExisting] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    )
    if (emailExisting.length > 0) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const [voterIdExisting] = await pool.execute(
      'SELECT id FROM users WHERE voterId = ? LIMIT 1',
      [normalizedVoterId]
    )
    if (voterIdExisting.length > 0) {
      return res.status(409).json({ message: 'Voter ID already exists' })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    await pool.execute(
      'INSERT INTO users (name, email, voterId, password, role, isVerified, createdAt) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [name, normalizedEmail, normalizedVoterId, passwordHash, normalizedRole]
    )

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

    const [rows] = await pool.execute(
      'SELECT id, name, email, voterId, password, role, hasVoted, isVerified FROM users WHERE email = ? OR voterId = ? LIMIT 1',
      [identifier.toLowerCase(), identifier]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' })

    const user = rows[0]

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid password' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    const safeUser = {
      id: user.id,
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

