const { body, param, validationResult } = require('express-validator');
const { ValidationError } = require('../../shared/errors/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => `${err.path}: ${err.msg}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  next();
};

const addItemValidator = [
  body('variantId').isUUID().withMessage('Valid variantId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  validate
];

const updateQuantityValidator = [
  param('variantId').isUUID().withMessage('Valid variantId is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or positive integer'),
  validate
];

module.exports = {
  addItemValidator,
  updateQuantityValidator
};
