import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { apiClient } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | wins | losses | draws | no-penalty | pending
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent | weight | reward
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const data = await apiClient.getUserStats();
        setStats(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const filteredHistory = useMemo(() => {
    if (!stats) return [];
    let list = [...stats.history];
    // Filter by outcome
    if (filter !== 'all') {
      list = list.filter(h => {
        if (filter === 'wins') return h.outcome === 'win';
        if (filter === 'losses') return h.outcome === 'loss';
        if (filter === 'draws') return h.draw;
        if (filter === 'no-penalty') return h.outcome === 'no-penalty';
        if (filter === 'pending') return h.state !== 'ended';
        return true;
      });
    }
    // Date range
    if (fromDate) {
      const fromTs = new Date(fromDate).getTime();
      list = list.filter(h => new Date(h.startTime).getTime() >= fromTs);
    }
    if (toDate) {
      const toTs = new Date(toDate).getTime();
      list = list.filter(h => new Date(h.endTime).getTime() <= toTs);
    }
    // Search by team/contest/matchId
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(h =>
        (h.matchId || '').toLowerCase().includes(q) ||
        (h.contestId || '').toLowerCase().includes(q) ||
        h.teams.join(' ').toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === 'weight') {
      list.sort((a,b) => b.weight - a.weight);
    } else if (sortBy === 'reward') {
      list.sort((a,b) => Math.abs(b.reward) - Math.abs(a.reward));
    } else {
      // recent: by matchId assuming chronological-ish; keep as-is
      list.sort((a,b) => a.matchId.localeCompare(b.matchId));
    }
    return list;
  }, [stats, filter, search, sortBy]);

  if (loading) {
    return <div className="dashboard-container"><div className="loading page-container">Loading dashboard…</div></div>;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
        <Link to="/contests" className="back-link">Back to Contests</Link>
      </div>
    );
  }

  const t = stats.totals;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content page-container">
        <div className="header">
          <h1>My Prediction Dashboard</h1>
          <p>Overview for <strong>{stats.username}</strong></p>
        </div>

        <div className="summary-cards">
          <div className="card">
            <div className="card-title">Wins</div>
            <div className="card-value">{t.wins}</div>
          </div>
          <div className="card">
            <div className="card-title">Losses</div>
            <div className="card-value">{t.losses}</div>
          </div>
          <div className="card">
            <div className="card-title">Draws</div>
            <div className="card-value">{t.draws}</div>
          </div>
          <div className="card">
            <div className="card-title">Points Gained</div>
            <div className="card-value positive">{t.pointsGained % 1 === 0 ? t.pointsGained : t.pointsGained.toFixed(1)}</div>
          </div>
          <div className="card">
            <div className="card-title">Points Lost</div>
            <div className="card-value negative">{t.pointsLost % 1 === 0 ? t.pointsLost : t.pointsLost.toFixed(1)}</div>
          </div>
          <div className="card">
            <div className="card-title">Net Points</div>
            <div className={`card-value ${t.netPoints >= 0 ? 'positive' : 'negative'}`}>{t.netPoints % 1 === 0 ? t.netPoints : t.netPoints.toFixed(1)}</div>
          </div>
        </div>

        <div className="toolbar card">
          <div className="toolbar-row">
            <div className="filters">
              <label>
                <span>Filter:</span>
                <select value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="wins">Wins</option>
                  <option value="losses">Losses</option>
                  <option value="draws">Draws</option>
                  <option value="no-penalty">No penalty</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
              <label>
                <span>Sort:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="recent">Recent</option>
                  <option value="weight">By weight</option>
                  <option value="reward">By reward</option>
                </select>
              </label>
              <label>
                <span>From:</span>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </label>
              <label>
                <span>To:</span>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </label>
            </div>
            <div className="search">
              <input
                type="text"
                placeholder="Search by team, contest, match…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="quick-links">
              <Link to="/contests" className="btn btn-outline">Browse Contests</Link>
              <Link to="/dashboard" className="btn btn-primary">Refresh</Link>
            </div>
          </div>
        </div>

        <div className="history-section">
          <h2>Match History</h2>
          <div className="history-list">
            {filteredHistory.length === 0 ? (
              <p>No predictions placed yet.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Contest</th>
                    <th>Teams</th>
                    <th>Weight</th>
                    <th>Outcome</th>
                    <th>Prediction</th>
                    <th>Reward</th>
                    <th>Go to</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.matchId}>
                      <td>{h.matchId}</td>
                      <td>{h.contestId || '-'}</td>
                      <td>{h.teams.join(' vs ')}</td>
                      <td>{h.weight}</td>
                      <td>
                        {h.state === 'ended' ? (
                          h.draw ? 'Draw' : (h.outcome === 'win' ? 'Win' : (h.outcome === 'loss' ? 'Loss' : 'No penalty'))
                        ) : (
                          h.state
                        )}
                      </td>
                      <td>{h.bet.team}{h.bet.isDefault ? ' (auto)' : ''}</td>
                      <td className={h.reward > 0 ? 'positive' : (h.reward < 0 ? 'negative' : '')}>
                        {h.reward > 0 ? '+' : (h.reward < 0 ? '-' : '')}
                        {Math.abs(h.reward) % 1 === 0 ? Math.abs(h.reward) : Math.abs(h.reward).toFixed(1)}
                      </td>
                      <td>
                        <Link to={`/match/${h.matchId}`}>Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
