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
    if (error.response?.status === 401) {
      // Handle unauthorized access
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
  
  // Categories
  getCategories: () => api.get('/api/categories'),
  
  // Add-ons
  getAddOns: () => api.get('/api/addons'),
  
  // Site Settings
  getSiteSettings: () => api.get('/api/site-settings'),
}

// Admin API endpoints
export const adminApi = {
  // Products
  createProduct: (data) => api.post('/api/admin/products', data),
  updateProduct: (id, data) => api.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/admin/products/${id}`),
  
  // Categories
  createCategory: (data) => api.post('/api/admin/categories', data),
  updateCategory: (id, data) => api.put(`/api/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/admin/categories/${id}`),
  
  // Add-ons
  createAddOn: (data) => api.post('/api/admin/addons', data),
  updateAddOn: (id, data) => api.put(`/api/admin/addons/${id}`, data),
  deleteAddOn: (id) => api.delete(`/api/admin/addons/${id}`),
  
  // Site Settings
  updateSiteSettings: (data) => api.put('/api/admin/site-settings', data),
  
  // Image Upload
  uploadImage: (formData) => api.post('/api/admin/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
}

export default api
