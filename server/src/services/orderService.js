import { db, isInitialized, admin } from '../config/firebase.js'
import { AppError } from '../middleware/errorHandler.js'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from './emailService.js'
import { settingsService } from './settingsService.js'
import { isValidEmail, trimString, digitsOnly } from '../utils/sanitize.js'

const VALID_ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
const VALID_PAYMENT_STATUSES = ['pending', 'pending_verification', 'paid', 'failed']
const MAX_ITEMS = 30
const MAX_QTY = 20

class OrderService {
  constructor() {
    this.collection = 'orders'
  }

  async create(orderData) {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    try {
      const customer = this.#validateCustomer(orderData?.customer)
      const paymentMethod = orderData?.payment?.method === 'upi' ? 'upi' : 'cod'
      const notes = trimString(orderData?.notes || '', 500)
      const idempotencyKey = trimString(orderData?.idempotencyKey || '', 80) || null

      if (!Array.isArray(orderData?.items) || orderData.items.length === 0) {
        throw new AppError('Your cart is empty', 400)
      }
      if (orderData.items.length > MAX_ITEMS) {
        throw new AppError('Too many items in this order', 400)
      }

      if (idempotencyKey) {
        const existing = await db
          .collection(this.collection)
          .where('idempotencyKey', '==', idempotencyKey)
          .limit(1)
          .get()

        if (!existing.empty) {
          const doc = existing.docs[0]
          return { id: doc.id, ...doc.data() }
        }
      }

      const settings = await settingsService.get()
      const freeThreshold = Number(settings.freeDeliveryThreshold) >= 0
        ? Number(settings.freeDeliveryThreshold)
        : 500
      const deliveryFee = Number(settings.deliveryCharge) >= 0
        ? Number(settings.deliveryCharge)
        : 50

      const items = await this.#priceItems(orderData.items)
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
      const deliveryCharge = subtotal >= freeThreshold ? 0 : deliveryFee
      const total = subtotal + deliveryCharge

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const orderNumber = `ORD-${dateStr}-${randomNum}`

      const order = {
        orderNumber,
        customer,
        items,
        pricing: {
          subtotal,
          deliveryCharge,
          total,
        },
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'upi' ? 'pending_verification' : 'pending',
        },
        status: 'placed',
        notes,
        idempotencyKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docRef = await db.collection(this.collection).add(order)
      const createdOrder = { id: docRef.id, ...order }

      // Send emails and track their success
      const [customerEmailResult, adminEmailResult] = await Promise.allSettled([
        sendOrderConfirmationEmail(createdOrder, settings),
        sendAdminOrderNotification(createdOrder, settings)
      ])

      // Extract email status
      const emailStatus = {
        customer: customerEmailResult.status === 'fulfilled' && customerEmailResult.value?.success === true,
        admin: adminEmailResult.status === 'fulfilled' && adminEmailResult.value?.success === true
      }

      // Log email failures
      if (!emailStatus.customer) {
        console.warn(`Failed to send customer email for order ${orderNumber}:`, 
          customerEmailResult.status === 'rejected' ? customerEmailResult.reason : customerEmailResult.value?.error)
      }
      if (!emailStatus.admin) {
        console.warn(`Failed to send admin email for order ${orderNumber}:`, 
          adminEmailResult.status === 'rejected' ? adminEmailResult.reason : adminEmailResult.value?.error)
      }

      return { ...createdOrder, emailStatus }
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error creating order:', error)
      throw new AppError('Failed to create order', 500)
    }
  }

  #validateCustomer(input = {}) {
    const fullName = trimString(input.fullName, 120)
    const email = trimString(input.email, 160).toLowerCase()
    const phoneDigits = digitsOnly(input.phone)
    const street = trimString(input.address, 300)
    const city = trimString(input.city, 80)
    const state = trimString(input.state, 80)
    const pincode = digitsOnly(input.pincode)

    if (fullName.length < 2) throw new AppError('Full name is required', 400)
    if (!isValidEmail(email)) throw new AppError('A valid email is required', 400)
    if (phoneDigits.length !== 10) throw new AppError('Phone number must be 10 digits', 400)
    if (street.length < 5) throw new AppError('Address is required', 400)
    if (!city) throw new AppError('City is required', 400)
    if (!state) throw new AppError('State is required', 400)
    if (pincode.length !== 6) throw new AppError('Pincode must be 6 digits', 400)

    return {
      fullName,
      email,
      phone: phoneDigits,
      address: {
        street,
        city,
        state,
        pincode,
      },
    }
  }

  async #priceItems(rawItems) {
    // Extract all unique product IDs and add-on IDs upfront
    const productIds = [...new Set(rawItems.map(item => item.productId || item.id).filter(Boolean))]
    const allAddonIds = new Set()
    rawItems.forEach(item => {
      (item.selectedAddOns || []).forEach(addon => {
        if (addon.id) allAddonIds.add(addon.id)
      })
    })
    const addonIds = [...allAddonIds]

    // Batch-fetch products (Firestore 'in' supports max 10 IDs per query)
    const productMap = new Map()
    for (let i = 0; i < productIds.length; i += 10) {
      const batch = productIds.slice(i, i + 10)
      if (batch.length === 0) continue
      const snapshot = await db.collection('products')
        .where(admin.firestore.FieldPath.documentId(), 'in', batch)
        .get()
      snapshot.docs.forEach(doc => productMap.set(doc.id, doc.data()))
    }

    // Batch-fetch add-ons
    const addonMap = new Map()
    for (let i = 0; i < addonIds.length; i += 10) {
      const batch = addonIds.slice(i, i + 10)
      if (batch.length === 0) continue
      const snapshot = await db.collection('addons')
        .where(admin.firestore.FieldPath.documentId(), 'in', batch)
        .get()
      snapshot.docs.forEach(doc => addonMap.set(doc.id, doc.data()))
    }

    // Build priced items using fetched data
    const priced = []
    for (const item of rawItems) {
      const quantity = Number.parseInt(item.quantity, 10)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
        throw new AppError('Each item quantity must be between 1 and 20', 400)
      }

      const productId = item.productId || item.id
      if (!productId) throw new AppError('Invalid product in cart', 400)

      const product = productMap.get(productId)
      if (!product) {
        throw new AppError('One or more products are no longer available', 400)
      }
      if (product.isAvailable === false) {
        throw new AppError(`${product.name || 'A product'} is currently unavailable`, 400)
      }

      const allowedAddOnIds = new Set(product.addOnIds || [])
      const selectedAddOns = []

      for (const addon of item.selectedAddOns || []) {
        const addonId = addon.id
        if (!addonId || !allowedAddOnIds.has(addonId)) {
          throw new AppError('An add-on is not valid for this product', 400)
        }

        const addonData = addonMap.get(addonId)
        if (!addonData) {
          throw new AppError('An add-on is no longer available', 400)
        }
        if (addonData.isAvailable === false) {
          throw new AppError(`${addonData.name || 'An add-on'} is currently unavailable`, 400)
        }

        selectedAddOns.push({
          id: addonId,
          name: addonData.name,
          additionalPrice: Number(addonData.additionalPrice) || 0,
        })
      }

      const addonTotal = selectedAddOns.reduce((sum, addon) => sum + addon.additionalPrice, 0)
      const unitPrice = (Number(product.basePrice) || 0) + addonTotal

      priced.push({
        productId,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl || '',
        basePrice: Number(product.basePrice) || 0,
        unitPrice,
        selectedAddOns,
        quantity,
        subtotal: unitPrice * quantity,
      })
    }

    return priced
  }

  async getById(orderId) {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    const doc = await db.collection(this.collection).doc(orderId).get()
    if (!doc.exists) {
      throw new AppError('Order not found', 404)
    }

    return { id: doc.id, ...doc.data() }
  }

  async getByOrderNumber(orderNumber, email) {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    const snapshot = await db
      .collection(this.collection)
      .where('orderNumber', '==', orderNumber)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new AppError('Order not found', 404)
    }

    const doc = snapshot.docs[0]
    const order = { id: doc.id, ...doc.data() }

    if (email) {
      const expected = String(order.customer?.email || '').toLowerCase()
      if (expected !== String(email).trim().toLowerCase()) {
        throw new AppError('Order not found', 404)
      }
    }

    return order
  }

  async getAll(filters = {}) {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    const snapshot = await db.collection(this.collection).get()
    let orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (filters.status) {
      orders = orders.filter((order) => order.status === filters.status)
    }
    if (filters.paymentStatus) {
      orders = orders.filter((order) => order.payment?.status === filters.paymentStatus)
    }
    if (filters.paymentMethod) {
      orders = orders.filter((order) => order.payment?.method === filters.paymentMethod)
    }

    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    const limit = parseInt(filters.limit, 10) || 100
    return orders.slice(0, limit)
  }

  async updateStatus(orderId, status) {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`, 400)
    }

    const docRef = db.collection(this.collection).doc(orderId)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new AppError('Order not found', 404)
    }

    await docRef.update({
      status,
      updatedAt: new Date().toISOString(),
    })

    return await this.getById(orderId)
  }

  async updatePaymentStatus(orderId, paymentStatus) {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new AppError(`Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`, 400)
    }

    const docRef = db.collection(this.collection).doc(orderId)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new AppError('Order not found', 404)
    }

    const updates = {
      'payment.status': paymentStatus,
      updatedAt: new Date().toISOString(),
    }

    if (paymentStatus === 'paid') {
      updates.status = 'confirmed'
    }

    await docRef.update(updates)
    return await this.getById(orderId)
  }

  async getStatistics() {
    if (!isInitialized) {
      throw new AppError('Firebase is not initialized', 503)
    }

    const snapshot = await db.collection(this.collection).get()
    const orders = snapshot.docs.map((doc) => doc.data())

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'placed').length,
      confirmedOrders: orders.filter((o) => o.status === 'confirmed').length,
      deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
      cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
      pendingPayments: orders.filter((o) => o.payment?.status === 'pending_verification').length,
      totalRevenue: orders
        .filter((o) => o.payment?.status === 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.pricing?.total) || 0), 0),
    }
  }
}

export const orderService = new OrderService()
