const express = require('express');
const { handleChat, initializeSession, fetchHistory } = require('../controllers/chatController');
const { chatValidation } = require('../middleware/validation');
const { chatLimiter, sanitizeInput, validateSession } = require('../middleware/security');
const { auditLogger } = require('../middleware/logging');

const router = express.Router();

// Apply chat rate limiter, sanitization, and session validation to all chat routes
router.use(chatLimiter);
router.use(sanitizeInput);
router.use(validateSession);

// Initialize chat session
router.post('/initialize-session', chatValidation.session, async (req, res, next) => {
  try {
    // Your existing session initialization logic here
    auditLogger('CHAT_SESSION_INIT', req.session.userId, { sessionId: req.body.sessionId });
  } catch (error) {
    next(error);
  }
});

// Send message
router.post('/webhook', chatValidation.message, async (req, res, next) => {
  try {
    // Your existing message handling logic here
    auditLogger('CHAT_MESSAGE_SENT', req.session.userId, {
      sessionId: req.body.sessionId,
      messageLength: req.body.message.length
    });
  } catch (error) {
    next(error);
  }
});

// Get chat history
router.get('/history', async (req, res, next) => {
  try {
    // Your existing history fetching logic here
    auditLogger('CHAT_HISTORY_ACCESS', req.session.userId, {
      sessionId: req.query.sessionId
    });
  } catch (error) {
    next(error);
  }
});

// Delete chat session
router.delete('/session/:sessionId', async (req, res, next) => {
  try {
    // Your existing session deletion logic here
    auditLogger('CHAT_SESSION_DELETE', req.session.userId, {
      sessionId: req.params.sessionId
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
