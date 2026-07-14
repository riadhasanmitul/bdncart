const productsRepo = require('./products.repository');
const { NotFoundError, ConflictError } = require('../../shared/errors/AppError');

/**
 * ─────────────────────────────────────────────────────────────────
 * BUSINESS LOGIC LAYER
 * ─────────────────────────────────────────────────────────────────
 */

// Generate a URL-friendly slug (e.g., "iPhone 15 Pro" -> "iphone-15-pro-12345")
function generateSlug(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const randomStr = Math.floor(Math.random() * 100000).toString();
  return `${base}-${randomStr}`;
}

async function createProduct(sellerId, payload) {
  const { categoryId, name, description, brand, isPublished, variants, images } = payload;

  // Ensure category exists
  // For production, you might want a `getCategoryById` function. 
  // We'll skip deep category validation here to keep it simple, 
  // but the DB foreign key will throw an error if categoryId is invalid.

  const slug = generateSlug(name);

  const productData = {
    sellerId,
    categoryId,
    name,
    slug,
    description,
    brand,
    isPublished
  };

  // We require at least one variant (the default variant)
  if (!variants || variants.length === 0) {
    throw new ConflictError('A product must have at least one variant');
  }

  // Ensure SKUs are unique locally before sending to DB
  const skus = variants.map(v => v.sku);
  if (new Set(skus).size !== skus.length) {
    throw new ConflictError('Duplicate SKUs found in variants');
  }

  const productId = await productsRepo.createProductWithVariants(productData, variants, images);
  
  return { productId, slug };
}

async function updateProduct(productId, sellerId, payload) {
  const { categoryId, name, description, brand, variants, images } = payload;
  
  const productData = {
    categoryId, name, description, brand
  };
  
  const variantData = (variants && variants.length > 0) ? variants[0] : null;
  const imageData = (images && images.length > 0) ? images[0] : null;

  const success = await productsRepo.updateProduct(productId, sellerId, productData, variantData, imageData);
  if (!success) {
    throw new NotFoundError('Product not found or unauthorized');
  }
  
  return { success: true };
}

async function deleteProduct(productId, sellerId) {
  const success = await productsRepo.deleteProduct(productId, sellerId);
  if (!success) {
    throw new NotFoundError('Product not found or unauthorized');
  }
  return { success: true };
}

async function getProducts(page, limit, filters) {
  return await productsRepo.getProductList(page, limit, filters);
}

async function getProductDetail(slug) {
  const product = await productsRepo.getProductBySlug(slug);
  if (!product) {
    throw new NotFoundError('Product');
  }
  return product;
}

async function getAllCategories() {
  return await productsRepo.getAllCategories();
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductDetail,
  getAllCategories
};
