import admin from 'firebase-admin'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from project root (two levels up from config directory)
dotenv.config({ path: resolve(__dirname, '../../../.env') })

let db = null

try {
  // Initialize Firebase Admin
  let serviceAccount
  
  // Check if Firebase credentials are in environment variable (for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    console.log('✓ Using Firebase credentials from environment variable')
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Fallback to file path (for local development)
    const { readFileSync } = await import('fs')
    const fullPath = resolve(__dirname, '../../../', process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'))
    console.log('✓ Using Firebase credentials from file')
  } else {
    throw new Error('Firebase credentials not configured')
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  
  db = admin.firestore()
  console.log('✓ Firebase Admin initialized')
} catch (error) {
  console.error('Firebase initialization error:', error.message)
  console.warn('⚠️  Running without Firebase. Some features will be unavailable.')
}

export { admin, db }
export default admin
