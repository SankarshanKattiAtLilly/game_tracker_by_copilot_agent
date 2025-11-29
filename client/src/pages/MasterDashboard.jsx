import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import './MasterDashboard.css';

export default function MasterDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setError(null);
        const res = await apiClient.getAllUsersStats();
        setData(res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.users.filter(u => !q || u.username.toLowerCase().includes(q));
  }, [data, query]);

  if (loading) return <div className="master-container"><div className="loading page-container">Loading…</div></div>;
  if (error) return <div className="master-container"><div className="error page-container">{error}</div></div>;
  if (!data) return null;

  const L = data.leaders || {};

  return (
    <div className="master-container">
      <div className="master-content page-container">
        <div className="header">
          <h1>All Users Dashboard</h1>
          <p>Platform-wide stats and leaders</p>
        </div>

        <div className="summary-grid">
          <div className="tile">
            <div className="tile-title">Users</div>
            <div className="tile-value">{data.totals.users}</div>
          </div>
          <div className="tile">
            <div className="tile-title">Matches</div>
            <div className="tile-value">{data.totals.matches}</div>
          </div>
          <div className="tile">
            <div className="tile-title">Bets</div>
            <div className="tile-value">{data.totals.bets}</div>
          </div>
        </div>

        <div className="leaders card">
          <h2>Leaders</h2>
          <div className="leaders-grid">
            <div className="leader-item"><span className="label">Highest Wins:</span> <strong>{L.highestWinUser?.username || '-'}</strong> ({L.highestWinUser?.wins || 0})</div>
            <div className="leader-item"><span className="label">Highest Losses:</span> <strong>{L.highestLossUser?.username || '-'}</strong> ({L.highestLossUser?.losses || 0})</div>
            <div className="leader-item"><span className="label">Longest Win Streak:</span> <strong>{L.longestContinuousWinUser?.username || '-'}</strong> ({L.longestContinuousWinUser?.longestWinStreak || 0})</div>
            <div className="leader-item"><span className="label">Longest Loss Streak:</span> <strong>{L.longestContinuousLossUser?.username || '-'}</strong> ({L.longestContinuousLossUser?.longestLossStreak || 0})</div>
            <div className="leader-item"><span className="label">Highest Net:</span> <strong>{L.highestNetUser?.username || '-'}</strong> ({L.highestNetUser?.net || 0})</div>
          </div>
        </div>

        <div className="users card">
          <div className="users-toolbar">
            <input type="text" placeholder="Search users…" value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Net</th>
                <th>Longest Win Streak</th>
                <th>Longest Loss Streak</th>
                <th>Total Bets</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.username}>
                  <td>{u.username}</td>
                  <td>{u.wins}</td>
                  <td>{u.losses}</td>
                  <td>{u.draws}</td>
                  <td className={u.net>=0?'positive':'negative'}>{u.net}</td>
                  <td>{u.longestWinStreak}</td>
                  <td>{u.longestLossStreak}</td>
                  <td>{u.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="charts card">
          <h2>Distribution</h2>
          <div className="chart-row">
            {/* Simple bar charts rendered with CSS widths */}
            <div className="bar-group">
              <div className="bar-label">Wins</div>
              <div className="bar"><div className="bar-fill wins" style={{width: `${Math.min(100, (L.highestWinUser?.wins||0)*10)}%`}} /></div>
            </div>
            <div className="bar-group">
              <div className="bar-label">Losses</div>
              <div className="bar"><div className="bar-fill losses" style={{width: `${Math.min(100, (L.highestLossUser?.losses||0)*10)}%`}} /></div>
            </div>
            <div className="bar-group">
              <div className="bar-label">Net</div>
              <div className="bar"><div className="bar-fill net" style={{width: `${Math.min(100, Math.abs(L.highestNetUser?.net||0))}%`}} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
