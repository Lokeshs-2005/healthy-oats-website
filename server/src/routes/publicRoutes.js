import express from 'express'
import { productService } from '../services/productService.js'
import { categoryService } from '../services/categoryService.js'
import { addonService } from '../services/addonService.js'
import { settingsService } from '../services/settingsService.js'

const router = express.Router()

// Products
router.get('/products', async (req, res, next) => {
  try {
    const products = await productService.getAll(req.query)
    res.json(products)
  } catch (error) {
    next(error)
  }
})

router.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await productService.getBySlug(req.params.slug)
    res.json(product)
  } catch (error) {
    next(error)
  }
})

// Categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await categoryService.getAll()
    res.json(categories)
  } catch (error) {
    next(error)
  }
})

// Add-ons
router.get('/addons', async (req, res, next) => {
  try {
    const addons = await addonService.getAll()
    res.json(addons)
  } catch (error) {
    next(error)
  }
})

// Site Settings
router.get('/site-settings', async (req, res, next) => {
  try {
    const settings = await settingsService.get()
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

export default router
