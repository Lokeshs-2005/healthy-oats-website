import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Firebase
vi.mock('../config/firebase', () => ({
  auth: {},
  db: {},
}))

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:5000'
process.env.VITE_CLOUDINARY_CLOUD_NAME = 'test-cloud'
