const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../../shared/errors/AppError');

/**
 * ─────────────────────────────────────────────────────────────────
 * LAYER: VALIDATOR
 * ─────────────────────────────────────────────────────────────────
 * WHY: Never trust user input. If a user sends a 1-character password,
 * we should block it here before it even reaches our Service or DB.
 */

// Middleware to extract validation errors and throw our custom AppError
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format error message to be readable
    const errorMsg = errors.array().map(err => `${err.path}: ${err.msg}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  next();
};

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    // Regex for at least 1 number and 1 letter (optional complexity)
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('role')
    .optional()
    .isIn(['customer', 'seller'])
    .withMessage('Invalid role'),
  validate
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator
};
