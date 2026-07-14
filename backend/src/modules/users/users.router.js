const express = require('express');
const usersService = require('./users.service');
const { updateProfileValidator, createAddressValidator } = require('./users.validator');
const { authenticate, authorize } = require('../../shared/middleware/authenticate');

const router = express.Router();

/**
 * ─────────────────────────────────────────────────────────────────
 * LAYER: ROUTER
 * ─────────────────────────────────────────────────────────────────
 * All routes here are protected by the `authenticate` middleware.
 * If a user sends a request without a valid JWT, it will be rejected
 * before it even reaches these functions.
 */

// We can apply the middleware to ALL routes in this router at once:
router.use(authenticate);

// GET /api/v1/users (Admin Only)
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me
router.get('/me', async (req, res, next) => {
  try {
    // req.user was populated by the authenticate middleware!
    const user = await usersService.getMyProfile(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/me
router.patch('/me', updateProfileValidator, async (req, res, next) => {
  try {
    const updatedUser = await usersService.updateMyProfile(req.user.id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me/addresses
router.get('/me/addresses', async (req, res, next) => {
  try {
    const addresses = await usersService.getMyAddresses(req.user.id);
    
    res.status(200).json({
      status: 'success',
      results: addresses.length,
      data: { addresses }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users/me/addresses
router.post('/me/addresses', createAddressValidator, async (req, res, next) => {
  try {
    const newAddress = await usersService.addAddress(req.user.id, req.body);
    
    res.status(201).json({
      status: 'success',
      data: { address: newAddress }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
