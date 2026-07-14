const { redisClient } = require('../../shared/config/redis');

const CART_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Gets the cart from Redis. 
 * If it doesn't exist, returns a fresh empty cart structure.
 */
async function getCart(userId) {
  const key = `cart:${userId}`;
  const cartData = await redisClient.get(key);
  
  if (!cartData) {
    return {
      userId,
      items: [],
      totalPrice: 0,
      updatedAt: new Date().toISOString()
    };
  }
  
  return JSON.parse(cartData);
}

/**
 * Saves the cart to Redis and resets the TTL expiry
 */
async function saveCart(userId, cart) {
  const key = `cart:${userId}`;
  cart.updatedAt = new Date().toISOString();
  
  // JSON.stringify converts our object to a string for Redis
  // EX sets the expiry time in seconds
  await redisClient.set(key, JSON.stringify(cart), {
    EX: CART_TTL
  });
  
  return cart;
}

/**
 * Deletes the cart from Redis (used after successful checkout)
 */
async function clearCart(userId) {
  const key = `cart:${userId}`;
  await redisClient.del(key);
}

module.exports = {
  getCart,
  saveCart,
  clearCart
};
