import { db } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'

const COLLECTION = 'categories'

export const categoryService = {
  async getAll() {
    if (!db) throw new AppError('Database not configured', 503)

    // Get all categories (no index required)
    const snapshot = await db.collection(COLLECTION).get()

    const categories = []
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() }
      // Filter active categories in memory
      if (data.isActive !== false) {
        categories.push(data)
      }
    })

    // Sort by displayOrder in memory
    categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

    return categories
  },

  async create(data) {
    if (!db) throw new AppError('Database not configured', 503)

    const categoryData = {
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTION).add(categoryData)
    return { id: docRef.id, ...categoryData }
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
      throw new AppError('Category not found', 404)
    }

    return { id: doc.id, ...doc.data() }
  },

  async delete(id) {
    if (!db) throw new AppError('Database not configured', 503)

    // Check if any products use this category
    const productsSnapshot = await db.collection('products')
      .where('categoryId', '==', id)
      .limit(1)
      .get()

    if (!productsSnapshot.empty) {
      throw new AppError('Cannot delete category with existing products', 400)
    }

    await db.collection(COLLECTION).doc(id).delete()
    return { success: true }
  },
}
