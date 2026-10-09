import { db } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'

const COLLECTION = 'products'

export const productService = {
  async getAll(filters = {}) {
    if (!db) throw new AppError('Database not configured', 503)

    // For simple queries without indexes, fetch all and filter in memory
    let query = db.collection(COLLECTION)

    // Only use single field queries to avoid index requirements
    if (filters.categoryId && !filters.featured && !filters.available) {
      query = query.where('categoryId', '==', filters.categoryId)
    }

    const snapshot = await query.get()
    let products = []

    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() })
    })

    // Filter in memory to avoid composite indexes
    if (filters.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId)
    }

    if (filters.featured !== undefined) {
      const isFeatured = filters.featured === 'true' || filters.featured === true
      products = products.filter(p => p.isFeatured === isFeatured)
    }

    if (filters.available !== undefined) {
      const isAvailable = filters.available === 'true' || filters.available === true
      products = products.filter(p => p.isAvailable === isAvailable)
    }

    // Sort by createdAt descending (newest first)
    products.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB - dateA
    })

    // Apply limit after filtering
    if (filters.limit) {
      return products.slice(0, parseInt(filters.limit))
    }

    return products
  },

  async getBySlug(slug) {
    if (!db) throw new AppError('Database not configured', 503)

    const snapshot = await db.collection(COLLECTION)
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new AppError('Product not found', 404)
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  },

  async create(data) {
    if (!db) throw new AppError('Database not configured', 503)

    const productData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTION).add(productData)
    return { id: docRef.id, ...productData }
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
      throw new AppError('Product not found', 404)
    }

    return { id: doc.id, ...doc.data() }
  },

  async delete(id) {
    if (!db) throw new AppError('Database not configured', 503)

    await db.collection(COLLECTION).doc(id).delete()
    return { success: true }
  },
}
