import { db, isInitialized } from '../config/firebase.js'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from './emailService.js'

class OrderService {
  constructor() {
    this.collection = 'orders'
  }

  /**
   * Create a new order
   */
  async create(orderData) {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    try {
      const ordersRef = db.collection(this.collection)
      
      // Generate order number (format: ORD-YYYYMMDD-XXXX)
      const date = new Date()
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const orderNumber = `ORD-${dateStr}-${randomNum}`

      // Prepare order document
      const order = {
        orderNumber,
        
        // Customer Information
        customer: {
          fullName: orderData.customer.fullName,
          email: orderData.customer.email,
          phone: orderData.customer.phone,
          address: {
            street: orderData.customer.address,
            city: orderData.customer.city,
            state: orderData.customer.state,
            pincode: orderData.customer.pincode,
          },
        },

        // Order Items
        items: orderData.items.map(item => ({
          productId: item.id,
          name: item.name,
          slug: item.slug,
          imageUrl: item.imageUrl || '',
          basePrice: item.basePrice,
          quantity: item.quantity,
          subtotal: item.basePrice * item.quantity,
        })),

        // Pricing
        pricing: {
          subtotal: orderData.pricing.subtotal,
          deliveryCharge: orderData.pricing.deliveryCharge || 0,
          total: orderData.pricing.total,
        },

        // Payment Information
        payment: {
          method: orderData.payment.method, // 'cod' or 'upi'
          status: orderData.payment.method === 'cod' ? 'pending' : 'pending_verification', // 'pending', 'pending_verification', 'paid', 'failed'
        },

        // Order Status
        status: 'placed', // 'placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'

        // Notes
        notes: orderData.notes || '',

        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add order to Firestore
      const docRef = await ordersRef.add(order)

      const createdOrder = {
        id: docRef.id,
        ...order,
      }

      // Send emails (non-blocking - don't fail order if email fails)
      sendOrderConfirmationEmail(createdOrder).catch(err => 
        console.error('Failed to send customer email:', err)
      )
      sendAdminOrderNotification(createdOrder).catch(err =>
        console.error('Failed to send admin email:', err)
      )

      return createdOrder
    } catch (error) {
      console.error('Error creating order:', error)
      throw new Error(`Failed to create order: ${error.message}`)
    }
  }

  /**
   * Get order by ID
   */
  async getById(orderId) {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    try {
      const docRef = db.collection(this.collection).doc(orderId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error('Order not found')
      }

      return {
        id: doc.id,
        ...doc.data(),
      }
    } catch (error) {
      console.error('Error getting order:', error)
      throw new Error(`Failed to get order: ${error.message}`)
    }
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber) {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    try {
      const snapshot = await db
        .collection(this.collection)
        .where('orderNumber', '==', orderNumber)
        .limit(1)
        .get()

      if (snapshot.empty) {
        throw new Error('Order not found')
      }

      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      }
    } catch (error) {
      console.error('Error getting order by number:', error)
      throw new Error(`Failed to get order: ${error.message}`)
    }
  }

  /**
   * Get all orders with optional filters
   */
  async getAll(filters = {}) {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    try {
      let query = db.collection(this.collection)

      // Filter by status
      if (filters.status) {
        query = query.where('status', '==', filters.status)
      }

      // Filter by payment status
      if (filters.paymentStatus) {
        query = query.where('payment.status', '==', filters.paymentStatus)
      }

      // Filter by payment method
      if (filters.paymentMethod) {
        query = query.where('payment.method', '==', filters.paymentMethod)
      }

      // Order by creation date (newest first)
      query = query.orderBy('createdAt', 'desc')

      // Limit results
      const limit = parseInt(filters.limit) || 100
      query = query.limit(limit)

      const snapshot = await query.get()

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error('Error getting orders:', error)
      throw new Error(`Failed to get orders: ${error.message}`)
    }
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    const validStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    try {
      const docRef = db.collection(this.collection).doc(orderId)
      
      await docRef.update({
        status,
        updatedAt: new Date().toISOString(),
      })

      return await this.getById(orderId)
    } catch (error) {
      console.error('Error updating order status:', error)
      throw new Error(`Failed to update order status: ${error.message}`)
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    const validStatuses = ['pending', 'pending_verification', 'paid', 'failed']
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`)
    }

    try {
      const docRef = db.collection(this.collection).doc(orderId)
      
      await docRef.update({
        'payment.status': paymentStatus,
        updatedAt: new Date().toISOString(),
      })

      // If payment is verified, also confirm the order
      if (paymentStatus === 'paid') {
        await docRef.update({
          status: 'confirmed',
        })
      }

      return await this.getById(orderId)
    } catch (error) {
      console.error('Error updating payment status:', error)
      throw new Error(`Failed to update payment status: ${error.message}`)
    }
  }

  /**
   * Get order statistics
   */
  async getStatistics() {
    if (!isInitialized) {
      throw new Error('Firebase is not initialized')
    }

    try {
      const snapshot = await db.collection(this.collection).get()
      const orders = snapshot.docs.map(doc => doc.data())

      return {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'placed').length,
        confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        pendingPayments: orders.filter(o => o.payment.status === 'pending_verification').length,
        totalRevenue: orders
          .filter(o => o.payment.status === 'paid' && o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.pricing.total, 0),
      }
    } catch (error) {
      console.error('Error getting statistics:', error)
      throw new Error(`Failed to get statistics: ${error.message}`)
    }
  }
}

export const orderService = new OrderService()

