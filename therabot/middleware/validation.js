const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const authValidation = {
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    validateRequest
  ],
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('phone').isMobilePhone(),
    validateRequest
  ]
};

const chatValidation = {
  message: [
    body('message').trim().notEmpty().isLength({ max: 1000 }),
    validateRequest
  ],
  session: [
    body('sessionId').trim().notEmpty(),
    validateRequest
  ]
};

const otpValidation = {
  send: [
    body('phone').isMobilePhone(),
    validateRequest
  ],
  verify: [
    body('phone').isMobilePhone(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    validateRequest
  ]
};

module.exports = {
  authValidation,
  chatValidation,
  otpValidation
}; 