import EmptyState from './EmptyState';
import Loader from './Loader';
import { TRANSACTION_BADGE_CLASS, TRANSACTION_LABELS, formatDateTime } from '../utils/format';

export default function TransactionHistory({
  transactions,
  loading,
  search,
  onSearchChange,
  type,
  onTypeChange,
}) {
  return (
    <>
      <div className="filter-bar">
        <div className="form-group">
          <label htmlFor="txn-search">Search</label>
          <input
            id="txn-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Book title, ISBN, user name or membership ID..."
          />
        </div>

        <div className="form-group narrow">
          <label htmlFor="txn-type-filter">Type</label>
          <select
            id="txn-type-filter"
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
          >
            <option value="">All types</option>
            <option value="BORROW">Borrow</option>
            <option value="RETURN">Return</option>
            <option value="STOCK_ADDITION">Stock addition</option>
          </select>
        </div>
      </div>

      <h2 className="dashboard-section-title">Transaction history</h2>

      {loading ? (
        <Loader message="Loading transactions..." />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          message="Borrow, return or add stock and the records will appear here."
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
              <th>Status</th>
              <th>Note</th>
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
                <td>
                  {transaction.user?.fullName || '-'}
                  <div className="muted-text">{transaction.user?.membershipId || '-'}</div>
                </td>
                <td>{transaction.quantity}</td>
                <td>
                  <span className={transaction.status === 'COMPLETED' ? 'badge' : 'badge badge-danger'}>
                    {transaction.status}
                  </span>
                </td>
                <td className="muted-text">{transaction.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
