const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../../shared/errors/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => `${err.path}: ${err.msg}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  next();
};

const updateProfileValidator = [
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  validate
];

const createAddressValidator = [
  body('title').trim().notEmpty().withMessage('Address title is required').isLength({ max: 50 }),
  body('streetAddress').trim().notEmpty().withMessage('Street address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('country').optional().trim(),
  body('isDefault').optional().isBoolean(),
  validate
];

module.exports = {
  updateProfileValidator,
  createAddressValidator
};
