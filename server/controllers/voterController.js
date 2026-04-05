import { pool } from '../config/db.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

function getUserIdFromReq(req) {
  const auth = req.headers.authorization
  if (!auth) return null
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.userId
  } catch (err) {
    return null
  }
}

export async function getElectionsForVoter(req, res) {
  try {
    // return elections with candidates and vote counts
    const [elections] = await pool.execute('SELECT * FROM elections ORDER BY created_at DESC')
    const result = []
    for (const el of elections) {
      // fetch candidates with user name
      const [cands] = await pool.execute(
        `SELECT c.id AS candidate_id, u.id AS user_id, u.name, c.party
         FROM candidates c
         JOIN users u ON c.user_id = u.id
         WHERE c.election_id = ?`,
        [el.id]
      )
      const [counts] = await pool.execute('SELECT candidate_id, COUNT(id) as votes FROM votes WHERE election_id = ? GROUP BY candidate_id', [el.id])
      const map = {}
      for (const r of counts) map[r.candidate_id] = r.votes
      result.push({ ...el, candidates: cands.map(c => ({ id: c.candidate_id, user_id: c.user_id, name: c.name, party: c.party, votes: map[c.candidate_id] || 0 })) })
    }

    // optionally include whether the user already voted per election
    const userId = getUserIdFromReq(req)
    let userVotes = {}
    if (userId) {
      const [rows] = await pool.execute('SELECT election_id FROM votes WHERE user_id = ?', [userId])
      for (const r of rows) userVotes[r.election_id] = true
    }

    return res.status(200).json({ elections: result, userVotes })
  } catch (err) {
    console.error('getElectionsForVoter error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getCandidatesForElection(req, res) {
  try {
    const electionId = req.params.electionId
    if (!electionId) return res.status(400).json({ message: 'Missing electionId' })

    const [cands] = await pool.execute(
      `SELECT c.id as candidate_id, u.id as user_id, u.name, c.party, COUNT(v.id) as votes
       FROM candidates c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN votes v ON v.candidate_id = c.id
       WHERE c.election_id = ?
       GROUP BY c.id, u.id, u.name, c.party`,
      [electionId]
    )

    return res.status(200).json({ candidates: cands })
  } catch (err) {
    console.error('getCandidatesForElection error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function submitVote(req, res) {
  try {
    const userId = getUserIdFromReq(req)
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { electionId, candidateId } = req.body || {}
    if (!electionId || !candidateId) return res.status(400).json({ message: 'Missing fields' })

    // check one-person-one-vote for this election
    const [existing] = await pool.execute('SELECT id FROM votes WHERE user_id = ? AND election_id = ? LIMIT 1', [userId, electionId])
    if (existing.length > 0) return res.status(409).json({ message: 'Already voted' })

    const [candidateRows] = await pool.execute(
      'SELECT id FROM candidates WHERE id = ? AND election_id = ? LIMIT 1',
      [candidateId, electionId]
    )
    if (candidateRows.length === 0) return res.status(404).json({ message: 'Candidate not found for this election' })

    // insert vote
    const [result] = await pool.execute('INSERT INTO votes (user_id, candidate_id, election_id) VALUES (?, ?, ?)', [userId, candidateId, electionId])

    return res.status(201).json({ message: 'Vote recorded', id: String(result.insertId) })
  } catch (err) {
    console.error('submitVote error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
