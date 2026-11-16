const express = require('express');
const {
  listBooks,
  listGenres,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Every book route requires a signed in user.
router.use(authenticate);

router.get('/', asyncHandler(listBooks));
router.get('/genres', asyncHandler(listGenres)); 
router.get('/:id', asyncHandler(getBook));


router.post('/', requireAdmin, asyncHandler(createBook));
router.put('/:id', requireAdmin, asyncHandler(updateBook));
router.delete('/:id', requireAdmin, asyncHandler(deleteBook));

module.exports = router;
