import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiClient } from '../api/client';
import MatchCard from '../components/MatchCard';
import './Matches.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  const fetchData = async () => {
    try {
      setError(null);
      const [matchesData, betsData] = await Promise.all([
        apiClient.getMatches(),
        apiClient.getBets()
      ]);
      
      setMatches(matchesData);
      setBets(betsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBetUpdate = () => {
    fetchData();
  };

  const getUserBetForMatch = (matchId) => {
    return bets.find(bet => bet.matchId === matchId && bet.username === user.username);
  };

  const sortMatchesByTime = (matches) => {
    return [...matches].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  if (loading) {
    return (
      <div className="matches-container">
        <div className="loading">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matches-container">
        <div className="error">
          <p>Error loading matches: {error}</p>
          <button onClick={fetchData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const sortedMatches = sortMatchesByTime(matches);

  return (
    <div className="matches-container">
      <header className="matches-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🎯 Match Betting</h1>
            <p>Welcome back, <strong>{user.username}</strong>!</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchData} className="refresh-button" title="Refresh">
              🔄
            </button>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="matches-content">
        {sortedMatches.length === 0 ? (
          <div className="no-matches">
            <p>No matches available</p>
          </div>
        ) : (
          <div className="matches-list">
            {sortedMatches.map((match) => (
              <div key={match.id} className="match-item">
                <MatchCard
                  match={match}
                  userBet={getUserBetForMatch(match.id)}
                  onBetUpdate={handleBetUpdate}
                />
                {(match.state === 'ended' || match.state === 'started') && (
                  <div className="match-details-link">
                    <Link to={`/match/${match.id}`} className="details-button">
                      {match.state === 'started' ? 'View Live Details' : 'View Details'}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
