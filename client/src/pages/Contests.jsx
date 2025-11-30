import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import './Contests.css';

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [activeTab, setActiveTab] = useState('running'); // running | upcoming | completed
  const [contestStats, setContestStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setError(null);
        const contestsData = await apiClient.getContests();
        setContests(contestsData);
        
        // Fetch stats for each contest
        const statsPromises = contestsData.map(contest => 
          apiClient.getContestStats(contest.id).catch(() => null)
        );
        const statsResults = await Promise.all(statsPromises);
        
        const statsMap = {};
        contestsData.forEach((contest, index) => {
          if (statsResults[index]) {
            statsMap[contest.id] = statsResults[index];
          }
        });
        setContestStats(statsMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-active',
      completed: 'status-completed',
      upcoming: 'status-upcoming'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="contests-container">
        <div className="contests-content">
          <div className="loading">Loading contests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contests-container">
        <div className="contests-content">
          <div className="error">
            <p>Error loading contests: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredContests = contests.filter(c => {
    if (activeTab === 'running') return c.status === 'active' || c.status === 'running';
    if (activeTab === 'upcoming') return c.status === 'upcoming' || c.status === 'planned';
    if (activeTab === 'completed') return c.status === 'completed' || c.status === 'ended';
    return true;
  });

  return (
    <div className="contests-container">
      <div className="contests-content page-container">
        <div className="contests-header">
          <h1>Contests</h1>
          <p>Choose a contest to view matches and place predictions</p>
        </div>

        <div className="contest-tabs">
          <button
            className={`contest-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`contest-tab ${activeTab === 'running' ? 'active' : ''}`}
            onClick={() => setActiveTab('running')}
          >
            Running
          </button>
          <button
            className={`contest-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>

        {filteredContests.length === 0 ? (
          <div className="no-contests">
            <p>No contests in this category.</p>
          </div>
        ) : (
          <div className="contests-grid">
          {filteredContests.map(contest => {
            const stats = contestStats[contest.id];
            return (
              <div key={contest.id} className="contest-card">
                <div className="contest-header">
                  <div className="contest-title">
                    <h2>{contest.name}</h2>
                    {getStatusBadge(contest.status)}
                  </div>
                </div>

                <div className="contest-info">
                  <p className="contest-description">{contest.description}</p>
                  
                  <div className="contest-stats">
                    <div className="stat">
                      <span className="stat-label">Matches:</span>
                      <span className="stat-value">
                        {contest.completedMatches}/{contest.totalMatches}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Game Points:</span>
                      <span className="stat-value">{contest.totalGamePoints}</span>
                    </div>
                  </div>

                  {stats && (stats.topWinner || stats.topLoser) && (
                    <div className="contest-leaders">
                      <h4>Contest Leaders</h4>
                      {stats.topWinner && (
                        <div className="leader-item winner">
                          <span className="leader-icon">🏆</span>
                          <div className="leader-info">
                            <span className="leader-name">{stats.topWinner.username}</span>
                            <span className="leader-stat">{stats.topWinner.wins} wins</span>
                          </div>
                        </div>
                      )}
                      {stats.topLoser && (
                        <div className="leader-item loser">
                          <span className="leader-icon">😞</span>
                          <div className="leader-info">
                            <span className="leader-name">{stats.topLoser.username}</span>
                            <span className="leader-stat">{stats.topLoser.losses} losses</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                <div className="contest-dates">
                  <div className="date-info">
                    <span className="date-label">Start:</span>
                    <span className="date-value">{formatDate(contest.startDate)}</span>
                  </div>
                  <div className="date-info">
                    <span className="date-label">End:</span>
                    <span className="date-value">{formatDate(contest.endDate)}</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(contest.completedMatches / contest.totalMatches) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {Math.round((contest.completedMatches / contest.totalMatches) * 100)}% Complete
                </div>
              </div>

              <div className="contest-actions">
                <Link 
                  to={`/contest/${contest.id}`} 
                  className="view-contest-btn"
                >
                  View Matches
                </Link>
              </div>
            </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contests;