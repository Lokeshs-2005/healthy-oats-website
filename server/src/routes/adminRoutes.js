import express from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth.js'
import { productService } from '../services/productService.js'
import { categoryService } from '../services/categoryService.js'
import { addonService } from '../services/addonService.js'
import { settingsService } from '../services/settingsService.js'
import { cloudinary, isConfigured } from '../config/cloudinary.js'

const router = express.Router()

// Apply authentication middleware to all admin routes
router.use(authenticate)

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// Products
router.post('/products', async (req, res, next) => {
  try {
    const product = await productService.create(req.body)
    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
})

router.put('/products/:id', async (req, res, next) => {
  try {
    const product = await productService.update(req.params.id, req.body)
    res.json(product)
  } catch (error) {
    next(error)
  }
})

router.delete('/products/:id', async (req, res, next) => {
  try {
    await productService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Categories
router.post('/categories', async (req, res, next) => {
  try {
    const category = await categoryService.create(req.body)
    res.status(201).json(category)
  } catch (error) {
    next(error)
  }
})

router.put('/categories/:id', async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.body)
    res.json(category)
  } catch (error) {
    next(error)
  }
})

router.delete('/categories/:id', async (req, res, next) => {
  try {
    await categoryService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Add-ons
router.post('/addons', async (req, res, next) => {
  try {
    const addon = await addonService.create(req.body)
    res.status(201).json(addon)
  } catch (error) {
    next(error)
  }
})

router.put('/addons/:id', async (req, res, next) => {
  try {
    const addon = await addonService.update(req.params.id, req.body)
    res.json(addon)
  } catch (error) {
    next(error)
  }
})

router.delete('/addons/:id', async (req, res, next) => {
  try {
    await addonService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Site Settings
router.put('/site-settings', async (req, res, next) => {
  try {
    const settings = await settingsService.update(req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Image Upload
router.post('/upload-image', upload.single('image'), async (req, res, next) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({ 
        error: 'Image upload service not configured. Please configure Cloudinary.' 
      })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'healthy-oats',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(req.file.buffer)
    })

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    next(error)
  }
})

export default router
