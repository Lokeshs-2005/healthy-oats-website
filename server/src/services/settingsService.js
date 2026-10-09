import { db } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'

const COLLECTION = 'siteSettings'
const SETTINGS_DOC_ID = 'main'

export const settingsService = {
  async get() {
    if (!db) throw new AppError('Database not configured', 503)

    const doc = await db.collection(COLLECTION).doc(SETTINGS_DOC_ID).get()

    if (!doc.exists) {
      // Return default settings if none exist
      return {}
    }

    return doc.data()
  },

  async update(data) {
    if (!db) throw new AppError('Database not configured', 503)

    const settingsData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    await db.collection(COLLECTION).doc(SETTINGS_DOC_ID).set(settingsData, { merge: true })
    
    const doc = await db.collection(COLLECTION).doc(SETTINGS_DOC_ID).get()
    return doc.data()
  },
}
