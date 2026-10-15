import { db, isInitialized } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'

const COLLECTION = 'addons'

export const addonService = {
  async getAll() {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    const snapshot = await db.collection(COLLECTION).get()
    const addons = []

    snapshot.forEach((doc) => {
      addons.push({ id: doc.id, ...doc.data() })
    })

    return addons
  },

  async create(data) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    const addonData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTION).add(addonData)
    return { id: docRef.id, ...addonData }
  },

  async update(id, data) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

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
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    // Find all products with this add-on and remove it from their addOnIds
    const productsSnapshot = await db.collection('products')
      .where('addOnIds', 'array-contains', id)
      .get()

    // Use batch to update all products
    const batch = db.batch()
    let productCount = 0
    
    productsSnapshot.docs.forEach(doc => {
      const productRef = db.collection('products').doc(doc.id)
      const currentAddOnIds = doc.data().addOnIds || []
      const updatedAddOnIds = currentAddOnIds.filter(addonId => addonId !== id)
      batch.update(productRef, { 
        addOnIds: updatedAddOnIds, 
        updatedAt: new Date().toISOString() 
      })
      productCount++
    })

    // Commit batch updates
    if (productCount > 0) {
      await batch.commit()
      console.log(`Removed add-on ${id} from ${productCount} product(s)`)
    }

    // Now delete the add-on
    await db.collection(COLLECTION).doc(id).delete()
    return { success: true, productsUpdated: productCount }
  },
}
