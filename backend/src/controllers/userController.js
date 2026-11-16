const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  requireString,
  requireEmail,
  requireId,
  requireRole,
  requireStrongPassword,
} = require('../utils/validate');
const { publicUser } = require('./authController');

const SALT_ROUNDS = 10;

/**
 * GET /api/users
 * Optional query params: ?search=term&role=ADMIN
 */
async function listUsers(req, res) {
  const { search = '', role = '' } = req.query;

  const where = {};

  if (search.trim()) {
    where.OR = [
      { fullName: { contains: search.trim(), mode: 'insensitive' } },
      { membershipId: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  if (role.trim()) {
    where.role = requireRole(role);
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { transactions: true } } },
  });

  res.json({ count: users.length, users: users.map(publicUser) });
}

/**
 * GET /api/users/:id
 */
async function getUser(req, res) {
  const id = requireId(req.params.id, 'user id');
  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ user: publicUser(user) });
}

/**
 * GET /api/users/:id/transactions
 * The borrowing history for one member: every ledger row they are linked to
 * (borrows, returns and stock additions) plus a summary of what they still
 * have on loan. Because the ledger is never deleted, this history is complete.
 */
async function getUserHistory(req, res) {
  const id = requireId(req.params.id, 'user id');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      book: { select: { id: true, title: true, author: true, isbn: true } },
    },
  });

  // Copies currently on loan = everything borrowed minus everything returned.
  const [borrowed, returned] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: id, type: 'BORROW' },
      _sum: { quantity: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: id, type: 'RETURN' },
      _sum: { quantity: true },
    }),
  ]);

  const totalBorrowed = borrowed._sum.quantity || 0;
  const totalReturned = returned._sum.quantity || 0;

  res.json({
    user: publicUser(user),
    summary: {
      totalTransactions: transactions.length,
      totalBorrowed,
      totalReturned,
      currentlyOutstanding: totalBorrowed - totalReturned,
    },
    transactions,
  });
}

/**
 * POST /api/users
 * Administrator only. Body: { fullName, membershipId, email, password, role }
 */
async function createUser(req, res) {
  const fullName = requireString(req.body.fullName, 'Full name');
  const membershipId = requireString(req.body.membershipId, 'Membership ID');
  const email = requireEmail(req.body.email);
  const password = requireStrongPassword(req.body.password);
  const role = requireRole(req.body.role || 'USER');

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { membershipId }] },
  });
  if (existing) {
    throw new ApiError(409, 'A user with that email or membership ID already exists');
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      membershipId,
      email,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      role,
      // Administrators created by an admin must change the starter password.
      mustChangePassword: true,
    },
  });

  res.status(201).json({ message: 'User created successfully', user: publicUser(user) });
}

/**
 * PUT /api/users/:id
 * Body: { fullName, membershipId, email, role, password? }
 * The password is only changed when a new one is supplied.
 */
async function updateUser(req, res) {
  const id = requireId(req.params.id, 'user id');

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'User not found');
  }

  const fullName = requireString(req.body.fullName, 'Full name');
  const membershipId = requireString(req.body.membershipId, 'Membership ID');
  const email = requireEmail(req.body.email);
  const role = requireRole(req.body.role || existing.role);

  const conflicting = await prisma.user.findFirst({
    where: {
      AND: [
        { id: { not: id } },
        { OR: [{ email }, { membershipId }] },
      ],
    },
  });
  if (conflicting) {
    throw new ApiError(409, 'Another user already uses that email or membership ID');
  }

  // Never allow the last remaining administrator to lose their admin role.
  if (existing.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new ApiError(400, 'You cannot demote the only administrator account');
    }
  }

  const data = { fullName, membershipId, email, role };

  if (req.body.password) {
    data.password = await bcrypt.hash(requireStrongPassword(req.body.password), SALT_ROUNDS);
    data.mustChangePassword = true;
  }

  const user = await prisma.user.update({ where: { id }, data });

  res.json({ message: 'User updated successfully', user: publicUser(user) });
}

/**
 * DELETE /api/users/:id
 * Users with transaction history are protected. You also cannot delete yourself.
 */
async function deleteUser(req, res) {
  const id = requireId(req.params.id, 'user id');

  if (id === req.user.id) {
    throw new ApiError(400, 'You cannot delete your own account while signed in');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new ApiError(400, 'You cannot delete the only administrator account');
    }
  }

  const transactionCount = await prisma.transaction.count({ where: { userId: id } });
  if (transactionCount > 0) {
    throw new ApiError(
      409,
      `This user has ${transactionCount} transaction record(s) and cannot be deleted. Keep the account for history instead.`
    );
  }

  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User deleted successfully' });
}

module.exports = { listUsers, getUser, getUserHistory, createUser, updateUser, deleteUser };
