import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-container">
      <div className="empty-state">
        <h3>Page not found</h3>
        <p className="muted-text">The page you are looking for does not exist.</p>
        <div style={{ marginTop: 16 }}>
          <Link className="edit-button" to="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
