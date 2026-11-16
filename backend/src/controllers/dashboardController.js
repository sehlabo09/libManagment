const prisma = require('../config/prisma');

// A book is considered low stock when fewer than this many copies are on the shelf.
const LOW_STOCK_THRESHOLD = 2;

/**
 * GET /api/dashboard
 * One request that powers the whole dashboard: headline totals, low stock
 * alerts, the most recent activity and the full book stock table.
 */
async function getDashboard(req, res) {
  const [bookCount, stockAggregate, userCount, borrowedCount, transactionCount, lowStockBooks, recentTransactions, books] =
    await Promise.all([
      prisma.book.count(),
      prisma.book.aggregate({ _sum: { available: true, quantity: true } }),
      prisma.user.count(),
      prisma.transaction.count({ where: { type: 'BORROW' } }),
      prisma.transaction.count(),
      prisma.book.findMany({
        where: { available: { lt: LOW_STOCK_THRESHOLD } },
        orderBy: { available: 'asc' },
      }),
      prisma.transaction.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: { id: true, title: true, isbn: true } },
          user: { select: { id: true, fullName: true, membershipId: true } },
        },
      }),
      prisma.book.findMany({ orderBy: { title: 'asc' } }),
    ]);

  // Copies that are currently out with members.
  const borrowSum = await prisma.transaction.aggregate({
    where: { type: 'BORROW' },
    _sum: { quantity: true },
  });
  const returnSum = await prisma.transaction.aggregate({
    where: { type: 'RETURN' },
    _sum: { quantity: true },
  });
  const currentlyBorrowed =
    (borrowSum._sum.quantity || 0) - (returnSum._sum.quantity || 0);

  res.json({
    totals: {
      books: bookCount,
      totalCopies: stockAggregate._sum.quantity || 0,
      availableCopies: stockAggregate._sum.available || 0,
      users: userCount,
      borrowed: borrowedCount,
      currentlyBorrowed,
      transactions: transactionCount,
      lowStock: lowStockBooks.length,
    },
    lowStockBooks,
    recentTransactions,
    books,
  });
}

module.exports = { getDashboard, LOW_STOCK_THRESHOLD };
