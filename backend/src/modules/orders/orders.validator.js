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

const checkoutValidator = [
  // shippingAddressId can be optional if it's a digital product, but we assume physical here
  body('shippingAddressId').isUUID().withMessage('Valid shippingAddressId is required'),
  validate
];

module.exports = {
  checkoutValidator
};
