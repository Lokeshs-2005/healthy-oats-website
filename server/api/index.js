import express from 'express'
import cors from 'cors'
import { errorHandler } from '../src/middleware/errorHandler.js'
import publicRoutes from '../src/routes/publicRoutes.js'
import adminRoutes from '../src/routes/adminRoutes.js'

const app = express()

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
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

export default app
