// Load environment variables FIRST before any other imports
import './config/env.js'

import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import publicRoutes from './routes/publicRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

// Validate critical environment variables on startup
const validateEnvironment = () => {
  const errors = []
  
  // Check ADMIN_EMAILS is configured
  const adminEmails = (process.env.ADMIN_EMAILS || '').trim()
  if (!adminEmails) {
    errors.push('ADMIN_EMAILS environment variable is required and must contain at least one email address')
  } else {
    const emails = adminEmails.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) {
      errors.push('ADMIN_EMAILS must contain at least one valid email address')
    }
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Server startup failed due to configuration errors:')
    errors.forEach(err => console.error(`   - ${err}`))
    console.error('\nPlease check your .env file and ensure all required variables are set.\n')
    process.exit(1)
  }
}

validateEnvironment()

const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'],
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

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
