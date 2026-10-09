import { db } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'

const COLLECTION = 'addons'

export const addonService = {
  async getAll() {
    if (!db) throw new AppError('Database not configured', 503)

    const snapshot = await db.collection(COLLECTION).get()
    const addons = []

    snapshot.forEach((doc) => {
      addons.push({ id: doc.id, ...doc.data() })
    })

    return addons
  },

  async create(data) {
    if (!db) throw new AppError('Database not configured', 503)

    const addonData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTION).add(addonData)
    return { id: docRef.id, ...addonData }
  },

  async update(id, data) {
    if (!db) throw new AppError('Database not configured', 503)

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    await db.collection(COLLECTION).doc(id).update(updateData)
    const doc = await db.collection(COLLECTION).doc(id).get()

    if (!doc.exists) {
      throw new AppError('Add-on not found', 404)
    }

    return { id: doc.id, ...doc.data() }
  },

  async delete(id) {
    if (!db) throw new AppError('Database not configured', 503)

    await db.collection(COLLECTION).doc(id).delete()
    return { success: true }
  },
}
