const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

/**
 * Middleware to verify the Access Token.
 * If valid, it adds `req.user` with the user's ID and role.
 * If invalid or expired, it throws an UnauthorizedError.
 */
const authenticate = (req, res, next) => {
  // 1. Check if Authorization header exists and has 'Bearer ' prefix
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Please login to access this resource');
  }

  // 2. Extract the token
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify the token using our secret
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    
    // 4. Attach decoded payload (id, role) to the request object
    // This allows subsequent middleware or route handlers to know WHO is calling them
    req.user = decoded;
    
    next(); // Pass control to the next middleware/route handler
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired. Please refresh.');
    }
    throw new UnauthorizedError('Invalid access token');
  }
};

/**
 * Middleware to restrict access based on roles.
 * MUST be used AFTER `authenticate` middleware so `req.user` exists.
 * E.g. authorize('admin', 'seller')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }
    next();
  };
};

module.exports = { authenticate, authorize };
