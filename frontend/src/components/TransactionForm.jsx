import { useState } from 'react';
import { useToast } from '../context/ToastContext';

const MODES = [
  { value: 'borrow', label: 'Borrow (deduct stock)' },
  { value: 'return', label: 'Return (add stock back)' },
  { value: 'stock', label: 'Add new stock' },
];

export default function TransactionForm({ books, users, onBorrow, onReturn, onAddStock }) {
  const { showToast } = useToast();

  const [mode, setMode] = useState('borrow');
  const [values, setValues] = useState({ userId: '', bookId: '', quantity: '1', note: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsUser = mode === 'borrow' || mode === 'return';
  const selectedBook = books.find((book) => String(book.id) === String(values.bookId));

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode(event) {
    setMode(event.target.value);
    setErrors({});
    setServerError('');
  }

  function validate() {
    const next = {};
    if (needsUser && !values.userId) next.userId = 'Please choose a user';
    if (!values.bookId) next.bookId = 'Please choose a book';
    const quantity = Number(values.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      next.quantity = 'Quantity must be a whole number of at least 1';
    }
    if (mode === 'borrow' && selectedBook && quantity > selectedBook.available) {
      next.quantity = `Only ${selectedBook.available} copy/copies available`;
    }
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      bookId: Number(values.bookId),
      quantity: Number(values.quantity),
    };
    if (needsUser) payload.userId = Number(values.userId);
    if (mode === 'stock' && values.note.trim()) payload.note = values.note.trim();

    setSubmitting(true);
    setServerError('');
    try {
      if (mode === 'borrow') await onBorrow(payload);
      if (mode === 'return') await onReturn(payload);
      if (mode === 'stock') await onAddStock(payload);

      showToast('Transaction recorded successfully', 'success');
      // Keep the selections so several transactions can be entered quickly.
      setValues((current) => ({ ...current, quantity: '1', note: '' }));
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      <h2>New transaction</h2>

      {serverError ? <div className="alert alert-error">{serverError}</div> : null}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="txn-mode">Transaction type</label>
          <select id="txn-mode" value={mode} onChange={switchMode}>
            {MODES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {needsUser ? (
          <div className="form-group">
            <label htmlFor="txn-user">User</label>
            <select
              id="txn-user"
              name="userId"
              value={values.userId}
              onChange={handleChange}
              aria-invalid={Boolean(errors.userId)}
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.membershipId})
                </option>
              ))}
            </select>
            {errors.userId ? <span className="field-error">{errors.userId}</span> : null}
          </div>
        ) : null}

        <div className="form-group">
          <label htmlFor="txn-book">Book</label>
          <select
            id="txn-book"
            name="bookId"
            value={values.bookId}
            onChange={handleChange}
            aria-invalid={Boolean(errors.bookId)}
          >
            <option value="">Select a book...</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.available} of {book.quantity} available
              </option>
            ))}
          </select>
          {errors.bookId ? <span className="field-error">{errors.bookId}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="txn-quantity">Quantity</label>
          <input
            id="txn-quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={values.quantity}
            onChange={handleChange}
            aria-invalid={Boolean(errors.quantity)}
          />
          {errors.quantity ? <span className="field-error">{errors.quantity}</span> : null}
          {selectedBook ? (
            <span className="helper-text">
              "{selectedBook.title}" has {selectedBook.available} of {selectedBook.quantity} copies
              available.
            </span>
          ) : null}
        </div>

        {mode === 'stock' ? (
          <div className="form-group">
            <label htmlFor="txn-note">Note (optional)</label>
            <input
              id="txn-note"
              name="note"
              value={values.note}
              onChange={handleChange}
              placeholder="e.g. New delivery from supplier"
            />
          </div>
        ) : null}
      </div>

      <div className="form-buttons">
        <button type="submit" className="transaction-button" disabled={submitting}>
          {submitting ? 'Saving...' : MODES.find((item) => item.value === mode).label}
        </button>
      </div>
    </form>
  );
}
