import EmptyState from './EmptyState';
import { stockRowClass, stockStatus } from '../utils/format';

export default function BookList({ books, onEdit, onDelete }) {
  if (!books || books.length === 0) {
    return (
      <EmptyState
        title="No books found"
        message="Add a book to the catalogue, or clear the search filters to see everything."
      />
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Author</th>
          <th>Genre</th>
          <th>ISBN</th>
          <th>Total</th>
          <th>Available</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book) => {
          const status = stockStatus(book.available);
          return (
            <tr key={book.id} className={stockRowClass(book.available)}>
              <td>{book.id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.genre}</td>
              <td>{book.isbn}</td>
              <td>{book.quantity}</td>
              <td>{book.available}</td>
              <td className={status.className}>{status.label}</td>
              <td className="actions-cell">
                <button type="button" className="edit-button" onClick={() => onEdit(book)}>
                  Update
                </button>
                <button type="button" className="delete-button" onClick={() => onDelete(book)}>
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
