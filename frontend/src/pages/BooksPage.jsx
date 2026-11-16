import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookList from '../components/BookList';
import AddBookForm from '../components/AddBookForm';
import EditBookForm from '../components/EditBookForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Loader from '../components/Loader';


export default function BooksPage() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  /** Loads the catalogue using the current search + genre filters. */
  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (genre) params.set('genre', genre);
      const query = params.toString();
      const data = await apiRequest(`/books${query ? `?${query}` : ''}`, { token });
      setBooks(data.books);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [search, genre, token]);

  /** Loads the genre list used by the filter dropdown. */
  const loadGenres = useCallback(async () => {
    try {
      const data = await apiRequest('/books/genres', { token });
      setGenres(data.genres);
    } catch {
      // A failure here is not critical - the filter simply stays empty.
    }
  }, [token]);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  // Reload whenever the filters change (debounced so typing stays smooth).
  useEffect(() => {
    const timer = setTimeout(loadBooks, 300);
    return () => clearTimeout(timer);
  }, [loadBooks]);

  async function handleAdd(values) {
    await apiRequest('/books', { method: 'POST', token, body: values });
    showToast('Book added successfully', 'success');
    await Promise.all([loadBooks(), loadGenres()]);
  }

  async function handleUpdate(values) {
    await apiRequest(`/books/${editing.id}`, { method: 'PUT', token, body: values });
    showToast('Book updated successfully', 'success');
    setEditing(null);
    await Promise.all([loadBooks(), loadGenres()]);
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await apiRequest(`/books/${deleting.id}`, { method: 'DELETE', token });
      showToast('Book deleted successfully', 'success');
      setDeleting(null);
      await Promise.all([loadBooks(), loadGenres()]);
    } catch (deleteError) {
      showToast(deleteError.message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <h1>Book Management</h1>
      <p className="dashboard-welcome">
        Add, update and remove books, and keep the catalogue up to date.
      </p>

      <AddBookForm onSubmit={handleAdd} />

      <div className="filter-bar">
        <div className="form-group">
          <label htmlFor="book-search">Search</label>
          <input
            id="book-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, author or ISBN..."
          />
        </div>

        <div className="form-group narrow">
          <label htmlFor="genre-filter">Genre</label>
          <select id="genre-filter" value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">All genres</option>
            {genres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {search || genre ? (
          <div className="form-group narrow">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setSearch('');
                setGenre('');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      <h2 className="dashboard-section-title">Catalogue ({books.length})</h2>

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : loading ? (
        <Loader message="Loading books..." />
      ) : (
        <BookList books={books} onEdit={setEditing} onDelete={setDeleting} />
      )}

      {editing ? (
        <Modal title={`Update "${editing.title}"`} onClose={() => setEditing(null)}>
          <EditBookForm book={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete book"
          message={`Delete "${deleting.title}" permanently? Books with transaction history cannot be deleted.`}
          confirmLabel="Delete book"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
