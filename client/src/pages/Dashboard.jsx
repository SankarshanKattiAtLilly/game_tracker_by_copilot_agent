import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { apiClient } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Loading dashboard…</div></div>;
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
      <div className="dashboard-content">
        <div className="header">
          <h1>My Betting Dashboard</h1>
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

        <div className="history-section">
          <h2>Match History</h2>
          <div className="history-list">
            {stats.history.length === 0 ? (
              <p>No bets placed yet.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Contest</th>
                    <th>Teams</th>
                    <th>Weight</th>
                    <th>Outcome</th>
                    <th>Bet</th>
                    <th>Reward</th>
                    <th>Go to</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.map((h) => (
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
