import { admin } from '../config/firebase.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split('Bearer ')[1]
    
    if (!admin.apps.length) {
      return res.status(503).json({ error: 'Firebase Admin not configured' })
    }

    const decodedToken = await admin.auth().verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
