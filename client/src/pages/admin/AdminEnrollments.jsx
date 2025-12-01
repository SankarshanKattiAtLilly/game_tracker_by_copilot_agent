import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import './Admin.css';

export default function AdminEnrollments() {
  const [contestId, setContestId] = useState('');
  const [enrolled, setEnrolled] = useState([]);
  const [usernames, setUsernames] = useState('');
  const [error, setError] = useState(null);

  const load = async () => {
    if (!contestId) return;
    try { const res = await apiClient.adminGet(`/admin/manage/contests/${contestId}/users`); setEnrolled(res.enrolledUsers || []); }
    catch(e){ setError(e.message); }
  };
  useEffect(()=>{ load(); },[contestId]);

  const onEnroll = async (e) => {
    e.preventDefault(); setError(null);
    try { const list = usernames.split(',').map(s=>s.trim()).filter(Boolean); const res = await apiClient.adminPost(`/admin/manage/contests/${contestId}/users`, { usernames: list }); setUsernames(''); setEnrolled(res.enrolledUsers || []); }
    catch(e){ setError(e.message); }
  };
  const onUnenroll = async (username) => {
    try { const res = await apiClient.adminDelete(`/admin/manage/contests/${contestId}/users/${username}`); setEnrolled(res.enrolledUsers || []); }
    catch(e){ setError(e.message); }
  };

  return (
    <div className="admin-container">
      <div className="admin-content page-container">
        <h2>Enrollments</h2>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <input placeholder="Contest Id" value={contestId} onChange={e=>setContestId(e.target.value)} />
        </div>
        <form className="admin-form" onSubmit={onEnroll}>
          <input placeholder="usernames (comma-separated)" value={usernames} onChange={e=>setUsernames(e.target.value)} />
          <button type="submit" disabled={!contestId}>Enroll Users</button>
        </form>
        <ul className="list">
          {enrolled.map(u => (
            <li key={u}>
              <span>{u}</span>
              <button onClick={()=>onUnenroll(u)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
