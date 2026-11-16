import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="navbar">
      <h2>University Library</h2>

      <nav className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        {isAdmin && <NavLink to="/books">Book Management</NavLink>}
        {isAdmin && <NavLink to="/transactions">Transactions</NavLink>}
        {isAdmin && <NavLink to="/users">User Management</NavLink>}
        <NavLink to="/change-password">Change Password</NavLink>
        <span className="nav-user">
          {user?.fullName} &middot; {user?.role === 'ADMIN' ? 'Admin' : 'Member'}
        </span>
        <button type="button" className="logout-button" onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
}
