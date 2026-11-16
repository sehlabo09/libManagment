const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  requireString,
  requireId,
  requireNonNegativeInt,
} = require('../utils/validate');

/**
 * GET /api/books
 * Optional query params: ?search=term&genre=Science
 */
async function listBooks(req, res) {
  const { search = '', genre = '' } = req.query;

  const where = {};

  if (search.trim()) {
    // Case insensitive match against title, author or ISBN.
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { author: { contains: search.trim(), mode: 'insensitive' } },
      { isbn: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  if (genre.trim()) {
    where.genre = { equals: genre.trim(), mode: 'insensitive' };
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: { title: 'asc' },
  });

  res.json({ count: books.length, books });
}

/**
 * GET /api/books/genres
 * Returns every distinct genre so the frontend can build its filter dropdown.
 */
async function listGenres(req, res) {
  const rows = await prisma.book.findMany({
    distinct: ['genre'],
    select: { genre: true },
    orderBy: { genre: 'asc' },
  });
  res.json({ genres: rows.map((row) => row.genre) });
}

/**
 * GET /api/books/:id
 */
async function getBook(req, res) {
  const id = requireId(req.params.id, 'book id');
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }
  res.json({ book });
}

/**
 * POST /api/books
 * Body: { title, author, genre, isbn, quantity }
 * A brand new book starts fully available on the shelf.
 */
async function createBook(req, res) {
  const title = requireString(req.body.title, 'Title');
  const author = requireString(req.body.author, 'Author');
  const genre = requireString(req.body.genre, 'Genre');
  const isbn = requireString(req.body.isbn, 'ISBN');
  const quantity = requireNonNegativeInt(req.body.quantity ?? 0, 'Quantity');

  // Give a clear message before Prisma raises its own unique constraint error.
  const duplicate = await prisma.book.findUnique({ where: { isbn } });
  if (duplicate) {
    throw new ApiError(409, `A book with ISBN "${isbn}" already exists`);
  }

  const book = await prisma.book.create({
    data: { title, author, genre, isbn, quantity, available: quantity },
  });

  res.status(201).json({ message: 'Book added successfully', book });
}

/**
 * PUT /api/books/:id
 * Body: { title, author, genre, isbn, quantity }
 * Changing the total quantity shifts the available quantity by the same delta
 * so stock levels stay consistent. Available copies can never go negative.
 */
async function updateBook(req, res) {
  const id = requireId(req.params.id, 'book id');

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Book not found');
  }

  const title = requireString(req.body.title, 'Title');
  const author = requireString(req.body.author, 'Author');
  const genre = requireString(req.body.genre, 'Genre');
  const isbn = requireString(req.body.isbn, 'ISBN');
  const quantity = requireNonNegativeInt(req.body.quantity, 'Quantity');

  if (isbn !== existing.isbn) {
    const duplicate = await prisma.book.findUnique({ where: { isbn } });
    if (duplicate) {
      throw new ApiError(409, `A book with ISBN "${isbn}" already exists`);
    }
  }

  const borrowedCopies = existing.quantity - existing.available;
  const newAvailable = quantity - borrowedCopies;

  if (newAvailable < 0) {
    throw new ApiError(
      400,
      `Quantity cannot be lower than the ${borrowedCopies} copies currently borrowed`
    );
  }

  const book = await prisma.book.update({
    where: { id },
    data: { title, author, genre, isbn, quantity, available: newAvailable },
  });

  res.json({ message: 'Book updated successfully', book });
}

/**
 * DELETE /api/books/:id
 * Books that appear in the transaction ledger are protected so history stays intact.
 */
async function deleteBook(req, res) {
  const id = requireId(req.params.id, 'book id');

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const transactionCount = await prisma.transaction.count({ where: { bookId: id } });
  if (transactionCount > 0) {
    throw new ApiError(
      409,
      `This book has ${transactionCount} transaction record(s) and cannot be deleted. Keep it for history instead.`
    );
  }

  await prisma.book.delete({ where: { id } });
  res.json({ message: 'Book deleted successfully' });
}

module.exports = { listBooks, listGenres, getBook, createBook, updateBook, deleteBook };
