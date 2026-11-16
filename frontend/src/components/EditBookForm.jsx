import { useState } from 'react';
import COMMON_GENRES from '../utils/genres';

export default function EditBookForm({ book, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    title: book.title || '',
    author: book.author || '',
    genre: book.genre || '',
    isbn: book.isbn || '',
    quantity: String(book.quantity ?? 0),
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const borrowedCopies = Math.max(0, book.quantity - book.available);

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function validate() {
    const next = {};
    if (!values.title.trim()) next.title = 'Title is required';
    if (!values.author.trim()) next.author = 'Author is required';
    if (!values.genre.trim()) next.genre = 'Genre is required';
    if (!values.isbn.trim()) next.isbn = 'ISBN is required';
    const quantity = Number(values.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      next.quantity = 'Quantity must be a whole number of 0 or more';
    } else if (quantity < borrowedCopies) {
      next.quantity = `Quantity cannot be less than the ${borrowedCopies} copies on loan`;
    }
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      await onSubmit({
        title: values.title.trim(),
        author: values.author.trim(),
        genre: values.genre.trim(),
        isbn: values.isbn.trim(),
        quantity: Number(values.quantity),
      });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      {serverError ? <div className="alert alert-error">{serverError}</div> : null}

      <div className="alert alert-info">
        Book ID #{book.id} &middot; {book.available} available now &middot; {borrowedCopies} on loan
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            name="title"
            value={values.title}
            onChange={handleChange}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="edit-author">Author</label>
          <input
            id="edit-author"
            name="author"
            value={values.author}
            onChange={handleChange}
            aria-invalid={Boolean(errors.author)}
          />
          {errors.author ? <span className="field-error">{errors.author}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="edit-genre">Genre</label>
          <input
            id="edit-genre"
            name="genre"
            list="edit-genre-options"
            value={values.genre}
            onChange={handleChange}
            aria-invalid={Boolean(errors.genre)}
          />
          <datalist id="edit-genre-options">
            {COMMON_GENRES.map((genre) => (
              <option key={genre} value={genre} />
            ))}
          </datalist>
          {errors.genre ? <span className="field-error">{errors.genre}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="edit-isbn">ISBN</label>
          <input
            id="edit-isbn"
            name="isbn"
            value={values.isbn}
            onChange={handleChange}
            aria-invalid={Boolean(errors.isbn)}
          />
          {errors.isbn ? <span className="field-error">{errors.isbn}</span> : null}
          <span className="helper-text">ISBN numbers must be unique.</span>
        </div>

        <div className="form-group">
          <label htmlFor="edit-quantity">Total quantity</label>
          <input
            id="edit-quantity"
            name="quantity"
            type="number"
            min={borrowedCopies}
            step="1"
            value={values.quantity}
            onChange={handleChange}
            aria-invalid={Boolean(errors.quantity)}
          />
          {errors.quantity ? <span className="field-error">{errors.quantity}</span> : null}
          <span className="helper-text">
            Available copies are recalculated automatically from this total.
          </span>
        </div>
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Update book'}
        </button>
        <button type="button" className="cancel-button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
