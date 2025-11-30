import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../context/useAuth';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const path = location.pathname;

  const active = (to) => (path.startsWith(to) ? 'active' : '');

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <Link to="/contests" className="brand-link">🎯 Match Prediction</Link>
        </div>
        <div className="right-actions">
          {isAuthenticated && (
            <nav className="nav" aria-label="Primary Navigation">
              <Link to="/contests" className={`nav-link ${active('/contests')}`}>Contests</Link>
              <Link to="/dashboard" className={`nav-link ${active('/dashboard')}`}>My Dashboard</Link>
              <Link to="/admin/dashboard" className={`nav-link ${active('/admin')}`}>Master Dashboard</Link>
            </nav>
          )}
          <div className="actions">
            {isAuthenticated && user?.username && (
              <span className="user-pill">{user.username}</span>
            )}
            {isAuthenticated ? (
              <button className="logout-button" onClick={() => logout()}>Logout</button>
            ) : (
              <Link to="/login" className="nav-link">Login</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
