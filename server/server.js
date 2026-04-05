
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

import morgan from 'morgan'

const app = express()

app.use(cors())
app.use(express.json())
app.get('/health', (req, res) => res.json({ ok: true }))


const PORT = process.env.PORT || 3000

async function start() {
  try {
    // import DB and routes after dotenv is loaded
    const { testConnection } = await import('./config/db.js')
    const { default: authRoutes } = await import('./routes/authRoutes.js')
    const { default: adminRoutes } = await import('./routes/adminRoutes.js')
    const { default: voterRoutes } = await import('./routes/voterRoutes.js')
    const { default: voteRoutes } = await import('./routes/voteRoutes.js')

    app.use('/api/auth', authRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/voter', voterRoutes)
    app.use('/api/vote', voteRoutes)

    await testConnection()
    // ensure required tables exist
    const { ensureTables } = await import('./config/db.js')
    await ensureTables()
    console.log('MySQL Connected Successfully and tables ensured')

    app.get('/', (req, res) => {
      res.json({
        status: 'Backend running',
        service: 'Secure Voting System API'
      })
    })

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()

export default app
