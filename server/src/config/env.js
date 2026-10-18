import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from project root BEFORE anything else
dotenv.config({ path: resolve(__dirname, '../../../.env') })

console.log('✓ Environment variables loaded')
console.log('FIREBASE_SERVICE_ACCOUNT_KEY:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'Set' : 'Not set')
console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS : 'NOT SET - CHECK .env FILE')
console.log('EMAIL_USER:', process.env.EMAIL_USER ? process.env.EMAIL_USER : 'NOT SET')
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'NOT SET')
