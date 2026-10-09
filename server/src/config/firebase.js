import admin from 'firebase-admin'
import { readFileSync } from 'fs'
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
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  
  if (!serviceAccountPath) {
    console.warn('⚠️  Firebase service account key not configured')
    console.warn('   Set FIREBASE_SERVICE_ACCOUNT_KEY in .env file')
  } else {
    // Resolve path relative to project root
    const fullPath = resolve(__dirname, '../../../', serviceAccountPath)
    const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'))
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    
    db = admin.firestore()
    console.log('✓ Firebase Admin initialized')
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message)
  console.warn('⚠️  Running without Firebase. Some features will be unavailable.')
}

export { admin, db }
export default admin
