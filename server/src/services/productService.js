import { db, isInitialized } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'
import { trimString } from '../utils/sanitize.js'

const COLLECTION = 'products'

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const sanitizeProduct = (data = {}, { isUpdate = false } = {}) => {
  const name = trimString(data.name, 120)
  const slug = slugify(data.slug || data.name)
  const description = trimString(data.description, 4000)
  const basePrice = Number(data.basePrice)
  const imageUrl = trimString(data.imageUrl, 500)

  if (!isUpdate || data.name !== undefined) {
    if (name.length < 2) throw new AppError('Product name is required', 400)
  }
  if (!isUpdate || data.slug !== undefined || data.name !== undefined) {
    if (!slug) throw new AppError('Product slug is required', 400)
  }
  if (!isUpdate || data.description !== undefined) {
    if (!description) throw new AppError('Description is required', 400)
  }
  if (!isUpdate || data.basePrice !== undefined) {
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      throw new AppError('A valid price is required', 400)
    }
  }
  if (!isUpdate || data.imageUrl !== undefined) {
    if (!imageUrl) throw new AppError('Product image is required', 400)
  }

  // Additional Images validation
  let additionalImages = []
  if (data.additionalImages !== undefined) {
    if (Array.isArray(data.additionalImages)) {
      additionalImages = data.additionalImages
        .slice(0, 5)
        .map(url => trimString(url, 500))
        .filter(url => url.length > 0)
    }
  }

  // Pricing Tiers validation
  let pricingTiers = []
  if (data.pricingTiers !== undefined) {
    if (Array.isArray(data.pricingTiers)) {
      pricingTiers = data.pricingTiers
        .slice(0, 10)
        .map(tier => {
          const quantity = trimString(tier.quantity, 50)
          const price = Number(tier.price)
          if (!quantity || quantity.length === 0) {
            throw new AppError('Pricing tier quantity is required', 400)
          }
          if (!Number.isFinite(price) || price < 0) {
            throw new AppError('Pricing tier price must be a valid non-negative number', 400)
          }
          return { quantity, price }
        })
        .filter(tier => tier.quantity && Number.isFinite(tier.price))
    }
  }

  const displayOrder = data.displayOrder !== undefined ? Number(data.displayOrder) : 999
  if (!Number.isFinite(displayOrder) || displayOrder < 0) {
    throw new AppError('Display order must be a valid non-negative number', 400)
  }

  const product = {
    name,
    slug,
    description,
    basePrice,
    imageUrl,
    additionalImages,
    pricingTiers,
    displayOrder,
    isAvailable: data.isAvailable !== false,
  }

  if (isUpdate) {
    const allowed = {}
    Object.keys(product).forEach((key) => {
      if (data[key] !== undefined || (key === 'slug' && data.name !== undefined)) {
        allowed[key] = product[key]
      }
    })
    return allowed
  }

  return product
}

export const productService = {
  async getAll(filters = {}) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    try {
      const snapshot = await db.collection(COLLECTION).get()
      let products = []

      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() })
      })

      if (filters.available !== undefined) {
        const isAvailable = filters.available === 'true' || filters.available === true
        products = products.filter((p) => p.isAvailable === isAvailable)
      }

      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

      if (filters.limit) {
        return products.slice(0, parseInt(filters.limit, 10))
      }

      return products
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error fetching products:', error)
      throw new AppError('Failed to fetch products', 500)
    }
  },

  async getBySlug(slug) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    const snapshot = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get()

    if (snapshot.empty) {
      throw new AppError('Product not found', 404)
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  },

  async create(data) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    const productData = sanitizeProduct(data)
    const existing = await db.collection(COLLECTION).where('slug', '==', productData.slug).limit(1).get()
    if (!existing.empty) {
      throw new AppError('A product with this slug already exists', 400)
    }

    const payload = {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTION).add(payload)
    return { id: docRef.id, ...payload }
  },

  async update(id, data) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    const docRef = db.collection(COLLECTION).doc(id)
    const existingDoc = await docRef.get()
    if (!existingDoc.exists) {
      throw new AppError('Product not found', 404)
    }

    const updateData = {
      ...sanitizeProduct({ ...existingDoc.data(), ...data }),
      updatedAt: new Date().toISOString(),
    }
    delete updateData.createdAt

    if (updateData.slug) {
      const slugClash = await db.collection(COLLECTION).where('slug', '==', updateData.slug).limit(1).get()
      if (!slugClash.empty && slugClash.docs[0].id !== id) {
        throw new AppError('A product with this slug already exists', 400)
      }
    }

    await docRef.update(updateData)
    const doc = await docRef.get()
    return { id: doc.id, ...doc.data() }
  },

  async delete(id) {
    if (!isInitialized || !db) {
      throw new AppError('Database service unavailable. Please check server configuration.', 503)
    }

    const doc = await db.collection(COLLECTION).doc(id).get()
    if (!doc.exists) {
      throw new AppError('Product not found', 404)
    }

    // Check if product is in pending orders (not delivered or cancelled)
    const ordersSnapshot = await db.collection('orders').get()
    const pendingOrders = []
    
    ordersSnapshot.docs.forEach((orderDoc) => {
      const order = orderDoc.data()
      // Skip delivered and cancelled orders
      if (order.status === 'delivered' || order.status === 'cancelled') {
        return
      }
      // Check if this product is in the order items
      if (Array.isArray(order.items)) {
        const hasProduct = order.items.some(item => item.productId === id)
        if (hasProduct) {
          pendingOrders.push(order.orderNumber || orderDoc.id)
        }
      }
    })

    if (pendingOrders.length > 0) {
      throw new AppError(
        `Cannot delete product. It is in ${pendingOrders.length} pending order(s). Mark as unavailable instead or wait until orders are completed.`,
        400
      )
    }

    await db.collection(COLLECTION).doc(id).delete()
    return { success: true }
  },
}
