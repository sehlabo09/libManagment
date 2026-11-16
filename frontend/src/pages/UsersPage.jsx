import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';
import UserHistoryDialog from '../components/UserHistoryDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const query = params.toString();
      const data = await apiRequest(`/users${query ? `?${query}` : ''}`, { token });
      setUsers(data.users);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  async function handleCreate(values) {
    await apiRequest('/users', { method: 'POST', token, body: values });
    showToast('User created successfully', 'success');
    setShowAdd(false);
    await loadUsers();
  }

  async function handleUpdate(values) {
    await apiRequest(`/users/${editing.id}`, { method: 'PUT', token, body: values });
    showToast('User updated successfully', 'success');
    setEditing(null);
    await loadUsers();
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await apiRequest(`/users/${deleting.id}`, { method: 'DELETE', token });
      showToast('User deleted successfully', 'success');
      setDeleting(null);
      await loadUsers();
    } catch (deleteError) {
      showToast(deleteError.message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>User Management</h1>
          <p className="dashboard-welcome">
            Register members, assign roles and keep accounts up to date.
          </p>
        </div>
        <button type="button" className="transaction-button" onClick={() => setShowAdd(true)}>
          + Register user
        </button>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <label htmlFor="user-search">Search</label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, membership ID or email..."
          />
        </div>
      </div>

      <h2 className="dashboard-section-title">Registered users ({users.length})</h2>

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : loading ? (
        <Loader message="Loading users..." />
      ) : (
        <UserList
          users={users}
          currentUserId={currentUser?.id}
          onEdit={setEditing}
          onDelete={setDeleting}
          onViewHistory={setHistoryUser}
        />
      )}

      {historyUser ? (
        <UserHistoryDialog
          user={historyUser}
          token={token}
          onClose={() => setHistoryUser(null)}
        />
      ) : null}

      {showAdd ? (
        <Modal title="Register a new user" onClose={() => setShowAdd(false)}>
          <UserForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />
        </Modal>
      ) : null}

      {editing ? (
        <Modal title={`Update ${editing.fullName}`} onClose={() => setEditing(null)}>
          <UserForm user={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete user"
          message={`Delete ${deleting.fullName} (${deleting.membershipId})? Users with transaction history cannot be deleted.`}
          confirmLabel="Delete user"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
