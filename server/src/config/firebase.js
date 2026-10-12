import admin from 'firebase-admin'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let db = null
let isInitialized = false

try {
  // Only initialize if not already initialized
  if (!admin.apps.length) {
    let serviceAccount
    
    // Check if Firebase credentials are in environment variable (for Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        console.log('✓ Using Firebase credentials from environment variable')
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError.message)
        throw parseError
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Fallback to file path (for local development)
      try {
        const { readFileSync } = await import('fs')
        const fullPath = resolve(__dirname, '../../../', process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'))
        console.log('✓ Using Firebase credentials from file')
      } catch (fileError) {
        console.error('Failed to read Firebase credentials file:', fileError.message)
        throw fileError
      }
    } else {
      throw new Error('Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_KEY')
    }
    
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    
    db = admin.firestore()
    isInitialized = true
    console.log('✓ Firebase Admin initialized successfully')
  } else {
    // Already initialized
    db = admin.firestore()
    isInitialized = true
    console.log('✓ Firebase Admin already initialized')
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message)
  console.error('Stack:', error.stack)
  console.warn('⚠️  Running without Firebase. API endpoints will return errors.')
  isInitialized = false
}

export { admin, db, isInitialized }
export default admin
