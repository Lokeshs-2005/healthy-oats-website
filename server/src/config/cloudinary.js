import { v2 as cloudinary } from 'cloudinary'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from project root (two levels up from config directory)
dotenv.config({ path: resolve(__dirname, '../../../.env') })

let isConfigured = false

try {
  // Debug: Log what environment variables we're seeing
  console.log('Cloudinary env check:', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'missing',
    apiKey: process.env.CLOUDINARY_API_KEY ? 'set' : 'missing',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'missing'
  })
  
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    
    isConfigured = true
    console.log('✓ Cloudinary configured')
  } else {
    console.warn('⚠️  Cloudinary not configured. Image uploads will not work.')
    console.warn('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env')
  }
} catch (error) {
  console.error('Cloudinary configuration error:', error.message)
}

export { cloudinary, isConfigured }
export default cloudinary
