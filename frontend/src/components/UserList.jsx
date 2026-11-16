import EmptyState from './EmptyState';
import { formatDate } from '../utils/format';

export default function UserList({ users, currentUserId, onEdit, onDelete, onViewHistory }) {
  if (!users || users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        message="Register a new member or clear the search box to see everyone."
      />
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Full name</th>
          <th>Membership ID</th>
          <th>Email</th>
          <th>Role</th>
          <th>Registered</th>
          <th>Transactions</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>
              {user.fullName}
              {user.id === currentUserId ? <span className="muted-text"> (you)</span> : null}
            </td>
            <td>{user.membershipId}</td>
            <td>{user.email}</td>
            <td>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : ''}`}>
                {user.role}
              </span>
            </td>
            <td>{formatDate(user.createdAt)}</td>
            <td>{user._count?.transactions ?? 0}</td>
            <td className="actions-cell">
              <button
                type="button"
                className="link-button"
                onClick={() => onViewHistory(user)}
              >
                History
              </button>
              <button type="button" className="edit-button" onClick={() => onEdit(user)}>
                Update
              </button>
              <button
                type="button"
                className="delete-button"
                onClick={() => onDelete(user)}
                disabled={user.id === currentUserId}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
