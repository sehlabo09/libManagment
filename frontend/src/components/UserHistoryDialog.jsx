import { useEffect, useState } from 'react';
import Modal from './Modal';
import Loader from './Loader';
import { apiRequest } from '../api/client';
import { TRANSACTION_BADGE_CLASS, TRANSACTION_LABELS, formatDateTime } from '../utils/format';

export default function UserHistoryDialog({ user, token, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', summary: null, transactions: [] });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest(`/users/${user.id}/transactions`, { token });
        if (!cancelled) {
          setState({
            loading: false,
            error: '',
            summary: data.summary,
            transactions: data.transactions,
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setState({ loading: false, error: requestError.message, summary: null, transactions: [] });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id, token]);

  const { loading, error, summary, transactions } = state;

  return (
    <Modal
      title={`Borrowing history - ${user.fullName}`}
      onClose={onClose}
      wide
      footer={
        <button type="button" className="cancel-button" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <Loader message="Loading history..." />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <p className="dashboard-welcome">
            {user.membershipId} &middot; {summary.currentlyOutstanding} copy/copies currently on loan
            (borrowed {summary.totalBorrowed}, returned {summary.totalReturned}).
          </p>

          {transactions.length === 0 ? (
            <p className="muted-text">This member has no transactions yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Book</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                    <td>
                      <span className={TRANSACTION_BADGE_CLASS[transaction.type] || 'badge'}>
                        {TRANSACTION_LABELS[transaction.type] || transaction.type}
                      </span>
                    </td>
                    <td>
                      {transaction.book?.title || '-'}
                      <div className="muted-text">ISBN {transaction.book?.isbn || '-'}</div>
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>
                      <span
                        className={
                          transaction.status === 'COMPLETED' ? 'badge' : 'badge badge-danger'
                        }
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Modal>
  );
}
