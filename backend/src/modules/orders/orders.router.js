const express = require('express');
const ordersService = require('./orders.service');
const { checkoutValidator } = require('./orders.validator');
const { authenticate } = require('../../shared/middleware/authenticate');
const { apiLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

// All order routes require login
router.use(authenticate);

// POST /api/v1/orders/checkout
router.post('/checkout', apiLimiter, checkoutValidator, async (req, res, next) => {
  try {
    const orderId = await ordersService.processCheckout(req.user.id, req.body.shippingAddressId);
    
    res.status(201).json({
      status: 'success',
      message: 'Checkout successful',
      data: { orderId }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders
router.get('/', apiLimiter, async (req, res, next) => {
  try {
    const orders = await ordersService.getMyOrders(req.user.id);
    
    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', apiLimiter, async (req, res, next) => {
  try {
    const order = await ordersService.getMyOrderDetails(req.params.id, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
