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

const createProductValidator = [
  body('categoryId').isUUID().withMessage('Valid categoryId is required'),
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 255 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('isPublished').optional().isBoolean(),
  
  // Validate variants array
  body('variants').isArray({ min: 1 }).withMessage('At least one variant is required'),
  body('variants.*.sku').trim().notEmpty().withMessage('SKU is required for all variants'),
  body('variants.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('variants.*.stockQuantity').isInt({ min: 0 }).withMessage('Stock must be 0 or positive integer'),
  body('variants.*.attributes').optional().isObject(),
  
  // Validate images array (optional)
  body('images').optional().isArray(),
  body('images.*.url').isURL().withMessage('Valid Image URL required'),
  body('images.*.isPrimary').optional().isBoolean(),
  body('images.*.variantIndex').optional().isInt({ min: 0 }),
  
  validate
];

const updateProductValidator = [
  body('categoryId').optional().isUUID().withMessage('Valid categoryId is required'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty').isLength({ max: 255 }),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('isPublished').optional().isBoolean(),
  
  body('variants').optional().isArray({ min: 1 }).withMessage('At least one variant is required'),
  body('variants.*.sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('variants.*.price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('variants.*.stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or positive integer'),
  body('variants.*.attributes').optional().isObject(),
  
  body('images').optional().isArray(),
  body('images.*.url').optional().isURL().withMessage('Valid Image URL required'),
  body('images.*.isPrimary').optional().isBoolean(),
  
  validate
];

module.exports = {
  createProductValidator,
  updateProductValidator
};
