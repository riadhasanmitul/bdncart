const express = require('express');
const authService = require('./auth.service');
const { registerValidator, loginValidator } = require('./auth.validator');
const { authLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

/**
 * ─────────────────────────────────────────────────────────────────
 * LAYER: ROUTER
 * ─────────────────────────────────────────────────────────────────
 * WHY: This layer ONLY cares about HTTP. It receives the Request, passes data
 * to the Service, and formats the Response. No business logic here!
 */

// POST /api/v1/auth/register
// Notice we pass authLimiter to prevent bot spam
router.post('/register', authLimiter, registerValidator, async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    
    // Send refresh token as an HttpOnly Cookie (more secure than localStorage)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Javascript cannot access this cookie (prevents XSS)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // Prevents CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error); // Passes the error to our centralized errorHandler
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, loginValidator, async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body.email, req.body.password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    // We assume the authenticate middleware runs before this and sets req.user
    // But for a true logout, we could just read the refresh token and decode it
    // Or clear the cookie.
    
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        const jwt = require('jsonwebtoken');
        try {
            const decoded = jwt.decode(refreshToken);
            if(decoded && decoded.id) {
                await authService.logoutUser(decoded.id);
            }
        } catch(e) {} // ignore invalid token on logout
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      // If no token is provided, the user's session expired
      return res.status(401).json({ status: 'fail', message: 'No refresh token provided' });
    }

    // 2. Call service to rotate tokens
    const result = await authService.refreshTokens(refreshToken);

    // 3. Set the new refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 4. Return the new access token
    res.status(200).json({
      status: 'success',
      data: {
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    res.clearCookie('refreshToken'); // Clear invalid token
    next(error);
  }
});

module.exports = router;
