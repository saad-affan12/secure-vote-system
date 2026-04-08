import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import morgan from 'morgan'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3000

app.use(morgan('dev'))
app.use(express.json())
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false
}))

async function startServer() {
  try {
    const { default: connectDB } = await import('./config/db.js')
    await connectDB()
    console.log('MongoDB connected')

    const { default: authRoutes } = await import('./routes/authRoutes.js')
    const { default: adminRoutes } = await import('./routes/adminRoutes.js')
    const { default: voterRoutes } = await import('./routes/voterRoutes.js')
    const { default: voteRoutes } = await import('./routes/voteRoutes.js')

    app.use('/api/auth', authRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/voter', voterRoutes)
    app.use('/api/vote', voteRoutes)

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' })
    })

    app.get('/', (req, res) => {
      res.json({ 
        message: 'University Voting System API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          admin: '/api/admin',
          voter: '/api/voter',
          vote: '/api/vote'
        }
      })
    })

    app.use((req, res) => {
      res.status(404).json({ message: 'Endpoint not found' })
    })

    app.use((err, req, res, next) => {
      console.error('Server error:', err)
      res.status(500).json({ message: 'Internal server error' })
    })

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()

export default app
