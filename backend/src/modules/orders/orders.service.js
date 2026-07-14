const ordersRepo = require('./orders.repository');
const cartService = require('../cart/cart.service');
const { BadRequestError, NotFoundError } = require('../../shared/errors/AppError');
const { query } = require('../../shared/config/database');

/**
 * Orchestrates the checkout process:
 * 1. Validates the shipping address
 * 2. Fetches the cart from Redis
 * 3. Executes the DB transaction
 * 4. Clears the cart from Redis
 */
async function processCheckout(userId, shippingAddressId) {
  // 1. Validate shipping address belongs to user
  if (shippingAddressId) {
    const addressSql = `SELECT id FROM addresses WHERE id = $1 AND user_id = $2`;
    const addressRes = await query(addressSql, [shippingAddressId, userId]);
    if (addressRes.rows.length === 0) {
      throw new BadRequestError('Invalid shipping address');
    }
  }

  // 2. Fetch cart
  const cart = await cartService.getMyCart(userId);
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  // 3. Execute Checkout Transaction (Throws error if out of stock)
  try {
    const orderId = await ordersRepo.createOrderTransaction(userId, cart, shippingAddressId);
    
    // 4. Clear the cart only after successful transaction!
    await cartService.clearMyCart(userId);
    
    return orderId;
  } catch (error) {
    // If the error message is our custom stock error, wrap it in a BadRequest
    if (error.message.includes('Insufficient stock')) {
      throw new BadRequestError(error.message);
    }
    throw error; // Let the global error handler catch other DB issues
  }
}

async function getMyOrders(userId) {
  return await ordersRepo.getUserOrders(userId);
}

async function getMyOrderDetails(orderId, userId) {
  const order = await ordersRepo.getOrderDetails(orderId, userId);
  if (!order) {
    throw new NotFoundError('Order');
  }
  return order;
}

module.exports = {
  processCheckout,
  getMyOrders,
  getMyOrderDetails
};
