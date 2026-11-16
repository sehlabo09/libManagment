const express = require('express');
const {
  listTransactions,
  getTransaction,
  borrowBook,
  returnBook,
  addStock,
} = require('../controllers/transactionController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// Any signed in member can read the ledger.
router.get('/', asyncHandler(listTransactions));

// Administrator only: moving stock / recording loans.
router.post('/borrow', requireAdmin, asyncHandler(borrowBook));
router.post('/return', requireAdmin, asyncHandler(returnBook));
router.post('/stock', requireAdmin, asyncHandler(addStock));

router.get('/:id', asyncHandler(getTransaction));

module.exports = router;
