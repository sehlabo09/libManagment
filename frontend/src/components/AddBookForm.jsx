import { useState } from 'react';
import COMMON_GENRES from '../utils/genres';

const EMPTY = { title: '', author: '', genre: '', isbn: '', quantity: '1' };

export default function AddBookForm({ onSubmit, onCancel }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setValues(EMPTY);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      <h2>Add a new book</h2>

      {serverError ? <div className="alert alert-error">{serverError}</div> : null}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="add-title">Title</label>
          <input
            id="add-title"
            name="title"
            value={values.title}
            onChange={handleChange}
            aria-invalid={Boolean(errors.title)}
            placeholder="e.g. Introduction to Algorithms"
          />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="add-author">Author</label>
          <input
            id="add-author"
            name="author"
            value={values.author}
            onChange={handleChange}
            aria-invalid={Boolean(errors.author)}
            placeholder="e.g. Thomas H. Cormen"
          />
          {errors.author ? <span className="field-error">{errors.author}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="add-genre">Genre</label>
          <input
            id="add-genre"
            name="genre"
            list="add-genre-options"
            value={values.genre}
            onChange={handleChange}
            aria-invalid={Boolean(errors.genre)}
            placeholder="e.g. Technology"
          />
          <datalist id="add-genre-options">
            {COMMON_GENRES.map((genre) => (
              <option key={genre} value={genre} />
            ))}
          </datalist>
          {errors.genre ? <span className="field-error">{errors.genre}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="add-isbn">ISBN</label>
          <input
            id="add-isbn"
            name="isbn"
            value={values.isbn}
            onChange={handleChange}
            aria-invalid={Boolean(errors.isbn)}
            placeholder="e.g. 978-0262046305"
          />
          {errors.isbn ? <span className="field-error">{errors.isbn}</span> : null}
          <span className="helper-text">ISBN numbers must be unique.</span>
        </div>

        <div className="form-group">
          <label htmlFor="add-quantity">Initial quantity</label>
          <input
            id="add-quantity"
            name="quantity"
            type="number"
            min="0"
            step="1"
            value={values.quantity}
            onChange={handleChange}
            aria-invalid={Boolean(errors.quantity)}
          />
          {errors.quantity ? <span className="field-error">{errors.quantity}</span> : null}
          <span className="helper-text">All copies start available on the shelf.</span>
        </div>
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add book'}
        </button>
        {onCancel ? (
          <button type="button" className="cancel-button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
