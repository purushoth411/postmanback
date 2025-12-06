// Input validation middleware
const { body, query, param, validationResult } = require('express-validator');

// Validation rules
const validateInput = {
  // User registration/login
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage('Name contains invalid characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('userpass')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],

  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('userpass')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Workspace
  workspace: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Workspace name must be between 1 and 100 characters'),
  ],

  // Collection
  collection: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Collection name must be between 1 and 100 characters'),
    body('wks_id')
      .isInt({ min: 1 })
      .withMessage('Invalid workspace ID'),
  ],

  // Folder
  folder: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Folder name must be between 1 and 100 characters'),
    body('collection_id')
      .isInt({ min: 1 })
      .withMessage('Invalid collection ID'),
  ],

  // Request
  request: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Request name must be between 1 and 200 characters'),
    body('method')
      .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
      .withMessage('Invalid HTTP method'),
  ],
};

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

module.exports = { validateInput, checkValidation };

