const express = require('express');
const { login, register, me, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();


router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));

// Routes that need a valid token
router.get('/me', authenticate, asyncHandler(me));
router.post('/change-password', authenticate, asyncHandler(changePassword));

module.exports = router;
