const cartRepo = require('./cart.repository');
const { query } = require('../../shared/config/database');
const { NotFoundError, BadRequestError } = require('../../shared/errors/AppError');

// Helper to recalculate the total price of the cart
function recalculateTotal(cart) {
  const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Ensure we avoid floating point rounding errors (e.g. 19.99000000000001)
  cart.totalPrice = Math.round(total * 100) / 100;
  return cart;
}

async function getMyCart(userId) {
  return await cartRepo.getCart(userId);
}

async function addItemToCart(userId, variantId, quantity) {
  // 1. Fetch variant from DB to ensure it exists and get its real price
  const sql = `
    SELECT v.id, v.price, v.stock_quantity, p.id as product_id, p.name as product_name
    FROM product_variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.id = $1 AND v.is_active = true AND p.is_published = true
  `;
  const dbRes = await query(sql, [variantId]);
  
  if (dbRes.rows.length === 0) {
    throw new NotFoundError('Product Variant');
  }
  
  const variant = dbRes.rows[0];
  
  // 2. Check stock
  if (variant.stock_quantity < quantity) {
    throw new BadRequestError(`Only ${variant.stock_quantity} items left in stock`);
  }

  // 3. Get existing cart from Redis
  const cart = await cartRepo.getCart(userId);
  
  // 4. Check if item is already in cart
  const existingItemIndex = cart.items.findIndex(item => item.variantId === variantId);
  
  if (existingItemIndex > -1) {
    // Update quantity (but check total stock again!)
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (variant.stock_quantity < newQuantity) {
      throw new BadRequestError(`Cannot add more. Only ${variant.stock_quantity} items left in stock`);
    }
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      productId: variant.product_id,
      productName: variant.product_name,
      variantId: variant.id,
      quantity: quantity,
      price: parseFloat(variant.price) // PostgreSQL returns DECIMAL as string in Node
    });
  }

  // 5. Recalculate and save
  recalculateTotal(cart);
  return await cartRepo.saveCart(userId, cart);
}

async function updateItemQuantity(userId, variantId, quantity) {
  if (quantity <= 0) {
    return await removeItemFromCart(userId, variantId);
  }

  const cart = await cartRepo.getCart(userId);
  const existingItemIndex = cart.items.findIndex(item => item.variantId === variantId);
  
  if (existingItemIndex === -1) {
    throw new NotFoundError('Item not found in cart');
  }

  // Check DB stock
  const sql = `SELECT stock_quantity FROM product_variants WHERE id = $1`;
  const dbRes = await query(sql, [variantId]);
  
  if (dbRes.rows.length > 0 && dbRes.rows[0].stock_quantity < quantity) {
    throw new BadRequestError(`Only ${dbRes.rows[0].stock_quantity} items left in stock`);
  }

  cart.items[existingItemIndex].quantity = quantity;
  recalculateTotal(cart);
  
  return await cartRepo.saveCart(userId, cart);
}

async function removeItemFromCart(userId, variantId) {
  const cart = await cartRepo.getCart(userId);
  cart.items = cart.items.filter(item => item.variantId !== variantId);
  
  recalculateTotal(cart);
  return await cartRepo.saveCart(userId, cart);
}

async function clearMyCart(userId) {
  await cartRepo.clearCart(userId);
}

module.exports = {
  getMyCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearMyCart
};
