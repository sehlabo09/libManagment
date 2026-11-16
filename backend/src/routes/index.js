const express = require('express');
const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Simple health check used to confirm the API is up.
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.get('/dashboard', authenticate, asyncHandler(getDashboard));
router.use('/books', bookRoutes);
router.use('/transactions', transactionRoutes);
router.use('/users', userRoutes);

module.exports = router;
