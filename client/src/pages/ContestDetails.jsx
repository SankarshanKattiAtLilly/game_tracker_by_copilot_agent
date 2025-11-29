import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import './ContestDetails.css';

const ContestDetails = () => {
  const { contestId } = useParams();
  const [contest, setContest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        setError(null);
        const [contestData, matchesData] = await Promise.all([
          apiClient.getContest(contestId),
          apiClient.getContestMatches(contestId)
        ]);
        
        setContest(contestData);
        setMatches(matchesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (contestId) {
      fetchContestDetails();
    }
  }, [contestId]);

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
      <div className="contest-details-container">
        <div className="loading">Loading contest details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contest-details-container">
        <div className="error">
          <p>Error loading contest: {error}</p>
          <Link to="/contests" className="back-button">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="contest-details-container">
        <div className="error">
          <p>Contest not found</p>
          <Link to="/contests" className="back-button">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contest-details-container">
      <div className="back-navigation">
        <Link to="/contests" className="back-link">
          ← Back to Contests
        </Link>
      </div>

      <div className="contest-details-header">
        <div className="contest-title-section">
          <h1>{contest.name}</h1>
          {getStatusBadge(contest.status)}
        </div>
        <p className="contest-description">{contest.description}</p>
      </div>

      <div className="contest-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{contest.completedMatches}/{contest.totalMatches}</div>
          <div className="stat-label">Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{contest.totalGamePoints}</div>
          <div className="stat-label">Total Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatDate(contest.startDate)}</div>
          <div className="stat-label">Start Date</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatDate(contest.endDate)}</div>
          <div className="stat-label">End Date</div>
        </div>
      </div>

      <div className="contest-matches-section">
        <h2>Contest Matches</h2>
        {matches.length === 0 ? (
          <div className="no-matches">
            <p>No matches available for this contest.</p>
          </div>
        ) : (
          <div className="matches-summary">
            <p>{matches.length} match{matches.length !== 1 ? 'es' : ''} in this contest</p>
            <Link 
              to={`/contest/${contestId}`} 
              className="view-matches-btn"
            >
              View & Bet on Matches
            </Link>
          </div>
        )}
      </div>

      <div className="progress-section">
        <h3>Contest Progress</h3>
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
    </div>
  );
};

export default ContestDetails;