const express = require('express');
const router = express.Router();
const { otpValidation } = require('../middleware/validation');
const { authLimiter, sanitizeInput } = require('../middleware/security');
const { auditLogger } = require('../middleware/logging');

// Apply auth rate limiter and sanitization to all OTP routes
router.use(authLimiter);
router.use(sanitizeInput);

// Send OTP
router.post('/send', otpValidation.send, async (req, res, next) => {
  try {
    // Your existing OTP sending logic here
    auditLogger('OTP_SEND', req.body.phone, { ip: req.ip });
  } catch (error) {
    auditLogger('OTP_SEND_FAILURE', req.body.phone, { ip: req.ip, reason: error.message });
    next(error);
  }
});

// Verify OTP
router.post('/verify', otpValidation.verify, async (req, res, next) => {
  try {
    // Your existing OTP verification logic here
    auditLogger('OTP_VERIFY_ATTEMPT', req.body.phone, { ip: req.ip });
    // After successful verification
    auditLogger('OTP_VERIFY_SUCCESS', req.body.phone, { ip: req.ip });
  } catch (error) {
    auditLogger('OTP_VERIFY_FAILURE', req.body.phone, { ip: req.ip, reason: error.message });
    next(error);
  }
});

module.exports = router;
