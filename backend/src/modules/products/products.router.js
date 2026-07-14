const express = require('express');
const productsService = require('./products.service');
const { createProductValidator, updateProductValidator } = require('./products.validator');
const { authenticate, authorize } = require('../../shared/middleware/authenticate');
const { apiLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (Anyone can view products)
// ─────────────────────────────────────────────────────────────────

// GET /api/v1/products?page=1&limit=10&categoryId=...&search=...&minPrice=...&maxPrice=...&sort=...
router.get('/', apiLimiter, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      categoryId: req.query.categoryId || null,
      sellerId: req.query.sellerId || null,
      search: req.query.search || null,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      sort: req.query.sort || null // e.g., 'price_asc', 'price_desc', 'newest'
    };

    const result = await productsService.getProducts(page, limit, filters);

    res.status(200).json({
      status: 'success',
      results: result.products.length,
      total: result.total,
      page,
      data: { products: result.products }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/categories
router.get('/categories', apiLimiter, async (req, res, next) => {
  try {
    const categories = await productsService.getAllCategories();
    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:slug
router.get('/:slug', apiLimiter, async (req, res, next) => {
  try {
    const product = await productsService.getProductDetail(req.params.slug);
    
    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (Sellers & Admins only)
// ─────────────────────────────────────────────────────────────────

// POST /api/v1/products
// 1. authenticate: Must be logged in
// 2. authorize: Must be a seller or admin
router.post('/', authenticate, authorize('seller', 'admin'), createProductValidator, async (req, res, next) => {
  try {
    // req.user.id is guaranteed to exist and belong to a seller/admin
    const result = await productsService.createProduct(req.user.id, req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/products/:id
router.patch('/:id', authenticate, authorize('seller', 'admin'), updateProductValidator, async (req, res, next) => {
  try {
    const result = await productsService.updateProduct(req.params.id, req.user.id, req.body);
    
    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/products/:id
router.delete('/:id', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const result = await productsService.deleteProduct(req.params.id, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
