import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import Loader from '../components/Loader';

export default function TransactionsPage() {
  const { token } = useAuth();

  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const loadPickers = useCallback(async () => {
    const [bookData, userData] = await Promise.all([
      apiRequest('/books', { token }),
      apiRequest('/users', { token }),
    ]);
    setBooks(bookData.books);
    setUsers(userData.users);
  }, [token]);

  const loadTransactions = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (type) params.set('type', type);
      const query = params.toString();
      const data = await apiRequest(`/transactions${query ? `?${query}` : ''}`, { token });
      setTransactions(data.transactions);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [search, type, token]);

  useEffect(() => {
    (async () => {
      setLoadingPage(true);
      try {
        await loadPickers();
      } catch (pickerError) {
        setError(pickerError.message);
      } finally {
        setLoadingPage(false);
      }
    })();
  }, [loadPickers]);

  useEffect(() => {
    const timer = setTimeout(loadTransactions, 300);
    return () => clearTimeout(timer);
  }, [loadTransactions]);

  async function handleBorrow(payload) {
    await apiRequest('/transactions/borrow', { method: 'POST', token, body: payload });
    // Refresh the ledger and the stock numbers shown in the pickers.
    await Promise.all([loadTransactions(), loadPickers()]);
  }

  async function handleReturn(payload) {
    await apiRequest('/transactions/return', { method: 'POST', token, body: payload });
    await Promise.all([loadTransactions(), loadPickers()]);
  }

  async function handleAddStock(payload) {
    await apiRequest('/transactions/stock', { method: 'POST', token, body: payload });
    await Promise.all([loadTransactions(), loadPickers()]);
  }

  if (loadingPage) {
    return <Loader message="Loading transactions..." />;
  }

  return (
    <>
      <h1>Transactions</h1>
      <p className="dashboard-welcome">
        Record loans, returns and new stock deliveries. Every movement is logged below.
      </p>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {books.length === 0 ? (
        <div className="alert alert-info">
          There are no books in the catalogue yet. Add a book first from Book Management.
        </div>
      ) : (
        <TransactionForm
          books={books}
          users={users}
          onBorrow={handleBorrow}
          onReturn={handleReturn}
          onAddStock={handleAddStock}
        />
      )}

      <TransactionHistory
        transactions={transactions}
        loading={loadingHistory}
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
      />
    </>
  );
}
