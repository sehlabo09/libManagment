import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import {
  TRANSACTION_BADGE_CLASS,
  TRANSACTION_LABELS,
  formatDateTime,
  stockRowClass,
  stockStatus,
} from '../utils/format';

export default function Dashboard() {
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/dashboard', { token });
      setData(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <Loader message="Loading dashboard..." />;
  }

  if (error && !data) {
    return (
      <>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="transaction-button" onClick={load}>
          Try again
        </button>
      </>
    );
  }

  const { totals } = data;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-welcome">
            A snapshot of the library catalogue, members and stock movements.
          </p>
        </div>
        <button
          type="button"
          className="transaction-button"
          onClick={load}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="dashboard-cards">
        <StatCard label="Total books" value={totals.books} />
        <StatCard label="Copies available" value={totals.availableCopies} />
        <StatCard label="Registered users" value={totals.users} />
        <StatCard label="Borrowed books" value={totals.borrowed} />
        <StatCard
          label="Low stock books"
          value={totals.lowStock}
          variant={totals.lowStock > 0 ? 'dashboard-card--danger' : ''}
        />
      </div>

      {totals.lowStock > 0 ? (
        <div className="alert alert-warn">
          <strong>Low stock warning:</strong> {totals.lowStock} book(s) have fewer than 2 copies
          available. They are highlighted in the table below.
        </div>
      ) : null}

      <h2 className="dashboard-section-title">Recent transactions</h2>
      {data.recentTransactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          message="Borrow, return or add stock and the activity will show up here."
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Book</th>
              <th>User</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDateTime(transaction.createdAt)}</td>
                <td>
                  <span className={TRANSACTION_BADGE_CLASS[transaction.type] || 'badge'}>
                    {TRANSACTION_LABELS[transaction.type] || transaction.type}
                  </span>
                </td>
                <td>{transaction.book?.title || '-'}</td>
                <td>{transaction.user?.fullName || '-'}</td>
                <td>{transaction.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="dashboard-section-title">Books and stock levels</h2>
      {data.books.length === 0 ? (
        <EmptyState
          title="The catalogue is empty"
          message="Administrators can add the first book from Book Management."
        />
      ) : (
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
            </tr>
          </thead>
          <tbody>
            {data.books.map((book) => {
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
