const express = require('express');
const cartService = require('./cart.service');
const { addItemValidator, updateQuantityValidator } = require('./cart.validator');
const { authenticate } = require('../../shared/middleware/authenticate');
const { apiLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

// All cart routes require login
router.use(authenticate);

// GET /api/v1/cart
router.get('/', apiLimiter, async (req, res, next) => {
  try {
    const cart = await cartService.getMyCart(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cart/items
router.post('/items', apiLimiter, addItemValidator, async (req, res, next) => {
  try {
    const { variantId, quantity } = req.body;
    const cart = await cartService.addItemToCart(req.user.id, variantId, quantity);
    
    res.status(200).json({
      status: 'success',
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/cart/items/:variantId
router.patch('/items/:variantId', apiLimiter, updateQuantityValidator, async (req, res, next) => {
  try {
    const cart = await cartService.updateItemQuantity(req.user.id, req.params.variantId, req.body.quantity);
    
    res.status(200).json({
      status: 'success',
      message: 'Cart updated',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/cart/items/:variantId
router.delete('/items/:variantId', apiLimiter, async (req, res, next) => {
  try {
    const cart = await cartService.removeItemFromCart(req.user.id, req.params.variantId);
    
    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/cart
router.delete('/', apiLimiter, async (req, res, next) => {
  try {
    await cartService.clearMyCart(req.user.id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
