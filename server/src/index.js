import express from 'express'
import cors from 'cors'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler.js'
import publicRoutes from './routes/publicRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from project root (two levels up from src directory)
dotenv.config({ path: resolve(__dirname, '../../.env') })

const app = express()
const PORT = process.env.PORT || 5000

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Healthy Oats API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      public: '/api/*',
      admin: '/api/admin/* (authentication required)'
    }
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
