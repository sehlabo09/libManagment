const express = require('express');
const {
  listUsers,
  getUser,
  getUserHistory,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// User management is exclusively an administrator function.
router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(listUsers));
router.get('/:id', asyncHandler(getUser));
router.get('/:id/transactions', asyncHandler(getUserHistory));
router.post('/', asyncHandler(createUser));
router.put('/:id', asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

module.exports = router;
