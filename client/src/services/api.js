import axios from 'axios'
import { API_URL } from '../config/constants'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      error.message = error.response.data.error
    }
    if (error.response?.status === 401) {
      console.error('Unauthorized access')
    }
    return Promise.reject(error)
  }
)

// Public API endpoints
export const publicApi = {
  // Products
  getProducts: (params) => api.get('/api/products', { params }),
  getProductBySlug: (slug) => api.get(`/api/products/${slug}`),
  
  // Site Settings
  getSiteSettings: () => api.get('/api/site-settings'),
  
  // Orders
  createOrder: (data) => api.post('/api/orders', data),
  getOrderByNumber: (orderNumber) => api.get(`/api/orders/${orderNumber}`),
}

// Admin API endpoints
export const adminApi = {
  // Products
  createProduct: (data) => api.post('/api/admin/products', data),
  updateProduct: (id, data) => api.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/admin/products/${id}`),
  
  // Site Settings
  updateSiteSettings: (data) => api.put('/api/admin/site-settings', data),
  
  // Image Upload
  uploadImage: (formData) => api.post('/api/admin/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Orders
  getOrders: (params) => api.get('/api/admin/orders', { params }),
  getOrderById: (id) => api.get(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/api/admin/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.patch(`/api/admin/orders/${id}/payment-status`, { paymentStatus }),
  getOrderStatistics: () => api.get('/api/admin/orders-statistics'),
}

export const getApiError = (error, fallback = 'Something went wrong. Please try again.') => {
  return error.response?.data?.error || error.message || fallback
}

export default api
