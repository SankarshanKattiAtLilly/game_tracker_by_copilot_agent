import { Link } from 'react-router-dom';
import './Admin.css';

export default function AdminHome() {
  return (
    <div className="admin-container">
      <div className="admin-content page-container">
        <h1>Admin Management</h1>
        <p>Manage contests, teams, matches, and enrollments.</p>
        <div className="admin-grid">
          <Link className="admin-card" to="/admin/manage/contests">Contests</Link>
          <Link className="admin-card" to="/admin/manage/teams">Teams</Link>
          <Link className="admin-card" to="/admin/manage/matches">Matches</Link>
          <Link className="admin-card" to="/admin/manage/enrollments">Enrollments</Link>
        </div>
      </div>
    </div>
  );
}
