const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { requireId, requirePositiveInt, requireString } = require('../utils/validate');

// Include the related book and user so the frontend table can show names.
const withRelations = {
  book: { select: { id: true, title: true, author: true, isbn: true } },
  user: { select: { id: true, fullName: true, membershipId: true, email: true } },
};

/**
 * GET /api/transactions
 * Optional query params: ?search=term&type=BORROW
 * Search matches book title, ISBN, user name or membership ID.
 */
async function listTransactions(req, res) {
  const { search = '', type = '' } = req.query;

  const where = {};

  if (type.trim()) {
    const allowed = ['BORROW', 'RETURN', 'STOCK_ADDITION'];
    const normalised = type.trim().toUpperCase();
    if (!allowed.includes(normalised)) {
      throw new ApiError(400, 'Transaction type must be BORROW, RETURN or STOCK_ADDITION');
    }
    where.type = normalised;
  }

  if (search.trim()) {
    const term = search.trim();
    where.OR = [
      { book: { is: { title: { contains: term, mode: 'insensitive' } } } },
      { book: { is: { isbn: { contains: term, mode: 'insensitive' } } } },
      { user: { is: { fullName: { contains: term, mode: 'insensitive' } } } },
      { user: { is: { membershipId: { contains: term, mode: 'insensitive' } } } },
    ];
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: withRelations,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ count: transactions.length, transactions });
}

/**
 * GET /api/transactions/:id
 */
async function getTransaction(req, res) {
  const id = requireId(req.params.id, 'transaction id');
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }
  res.json({ transaction });
}

/**
 * POST /api/transactions/borrow
 * Body: { bookId, userId, quantity }
 * Removes copies from the shelf and writes a BORROW record, atomically.
 */
async function borrowBook(req, res) {
  const bookId = requireId(req.body.bookId, 'book id');
  const userId = requireId(req.body.userId, 'user id');
  const quantity = requirePositiveInt(req.body.quantity, 'Quantity');

  const transaction = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (book.available < quantity) {
      throw new ApiError(
        400,
        book.available === 0
          ? `"${book.title}" has no available copies to borrow`
          : `Only ${book.available} copy/copies of "${book.title}" are available`
      );
    }

    await tx.book.update({
      where: { id: bookId },
      data: { available: { decrement: quantity } },
    });

    return tx.transaction.create({
      data: { type: 'BORROW', status: 'COMPLETED', quantity, bookId, userId },
      include: withRelations,
    });
  });

  res.status(201).json({ message: 'Book borrowed successfully', transaction });
}

/**
 * POST /api/transactions/return
 * Body: { bookId, userId, quantity }
 * Adds copies back to the shelf and writes a RETURN record, atomically.
 */
async function returnBook(req, res) {
  const bookId = requireId(req.body.bookId, 'book id');
  const userId = requireId(req.body.userId, 'user id');
  const quantity = requirePositiveInt(req.body.quantity, 'Quantity');

  const transaction = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // How many copies does this user still have out for this book?
    const borrowed = await tx.transaction.aggregate({
      where: { bookId, userId, type: 'BORROW' },
      _sum: { quantity: true },
    });
    const returned = await tx.transaction.aggregate({
      where: { bookId, userId, type: 'RETURN' },
      _sum: { quantity: true },
    });
    const outstanding =
      (borrowed._sum.quantity || 0) - (returned._sum.quantity || 0);

    if (outstanding <= 0) {
      throw new ApiError(
        400,
        `${user.fullName} has no outstanding copies of "${book.title}" to return`
      );
    }

    if (quantity > outstanding) {
      throw new ApiError(
        400,
        `${user.fullName} only has ${outstanding} copy/copies of "${book.title}" borrowed`
      );
    }

    await tx.book.update({
      where: { id: bookId },
      data: { available: { increment: quantity } },
    });

    return tx.transaction.create({
      data: { type: 'RETURN', status: 'COMPLETED', quantity, bookId, userId },
      include: withRelations,
    });
  });

  res.status(201).json({ message: 'Book returned successfully', transaction });
}

/**
 * POST /api/transactions/stock
 * Body: { bookId, quantity, note? }
 * Records newly delivered copies. Total and available stock both increase.
 */
async function addStock(req, res) {
  const bookId = requireId(req.body.bookId, 'book id');
  const quantity = requirePositiveInt(req.body.quantity, 'Quantity');
  const note = req.body.note ? requireString(req.body.note, 'Note') : null;

  const transaction = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    await tx.book.update({
      where: { id: bookId },
      data: {
        quantity: { increment: quantity },
        available: { increment: quantity },
      },
    });

    // Stock additions are performed by the signed in administrator.
    return tx.transaction.create({
      data: {
        type: 'STOCK_ADDITION',
        status: 'COMPLETED',
        quantity,
        bookId,
        userId: req.user.id,
        note,
      },
      include: withRelations,
    });
  });

  res.status(201).json({ message: 'Stock added successfully', transaction });
}

module.exports = {
  listTransactions,
  getTransaction,
  borrowBook,
  returnBook,
  addStock,
};
