import { pool } from '../config/db.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

async function requireAdmin(req, res) {
  const auth = req.headers.authorization
  if (!auth) return null
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId])
    if (rows.length === 0) return null
    const user = rows[0]
    if (user.role !== 'admin') return null
    return user
  } catch (err) {
    return null
  }
}

export async function createElection(req, res) {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return res.status(403).json({ message: 'Forbidden' })

    const { title, description, start_date, end_date } = req.body || {}
    if (!title) return res.status(400).json({ message: 'Missing title' })

    const [result] = await pool.execute(
      'INSERT INTO elections (title, description, start_date, end_date) VALUES (?, ?, ?, ?)',
      [title, description || null, start_date || null, end_date || null]
    )

    return res.status(201).json({ message: 'Election created', electionId: result.insertId })
  } catch (err) {
    console.error('createElection error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function addCandidate(req, res) {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return res.status(403).json({ message: 'Forbidden' })
    const { electionId, userId, party } = req.body || {}
    if (!electionId || !userId) return res.status(400).json({ message: 'Missing fields' })

    const [exists] = await pool.execute('SELECT id FROM elections WHERE id = ? LIMIT 1', [electionId])
    if (exists.length === 0) return res.status(404).json({ message: 'Election not found' })

    const [userExists] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
    if (userExists.length === 0) return res.status(404).json({ message: 'User not found' })

    const [duplicate] = await pool.execute(
      'SELECT id FROM candidates WHERE election_id = ? AND user_id = ? LIMIT 1',
      [electionId, userId]
    )
    if (duplicate.length > 0) return res.status(409).json({ message: 'Candidate already added to this election' })

    const [result] = await pool.execute(
      'INSERT INTO candidates (election_id, user_id, party) VALUES (?, ?, ?)',
      [electionId, userId, party || null]
    )

    return res.status(201).json({ message: 'Candidate added', candidateId: result.insertId })
  } catch (err) {
    console.error('addCandidate error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function listElections(req, res) {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return res.status(403).json({ message: 'Forbidden' })
    const [rows] = await pool.execute('SELECT * FROM elections ORDER BY created_at DESC')
    return res.status(200).json({ elections: rows })
  } catch (err) {
    console.error('listElections error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getUsers(req, res) {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return res.status(403).json({ message: 'Forbidden' })

    const [rows] = await pool.execute('SELECT id, name, email, voterId FROM users WHERE role = ? ORDER BY name ASC', ['voter'])
    return res.status(200).json({ users: rows })
  } catch (err) {
    console.error('getUsers error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getResults(req, res) {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return res.status(403).json({ message: 'Forbidden' })

    const electionId = req.params.electionId || req.query.electionId
    if (!electionId) return res.status(400).json({ message: 'Election ID is required' })

    const [elections] = await pool.execute('SELECT id, title, description, start_date, end_date FROM elections WHERE id = ? LIMIT 1', [electionId])
    if (elections.length === 0) return res.status(404).json({ message: 'Election not found' })

    const [rows] = await pool.execute(
      `SELECT c.id as candidate_id, u.id as user_id, u.name as name, c.party as party, COUNT(v.id) as votes
       FROM candidates c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN votes v ON v.candidate_id = c.id
       WHERE c.election_id = ?
       GROUP BY c.id, u.id, u.name, c.party
       ORDER BY votes DESC, u.name ASC`,
      [electionId]
    )

    const winner = rows.length > 0 ? rows[0] : null
    return res.status(200).json({ election: elections[0], results: rows, winner })
  } catch (err) {
    console.error('getResults error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
