import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiClient } from '../api/client';
import MatchCard from '../components/MatchCard';
import './Matches.css';

const Matches = () => {
  const { contestId } = useParams();
  const [contest, setContest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  const fetchData = async () => {
    try {
      setError(null);
      const [contestData, matchesData, betsData] = await Promise.all([
        apiClient.getContest(contestId),
        apiClient.getContestMatches(contestId),
        apiClient.getBets()
      ]);
      
      setContest(contestData);
      setMatches(matchesData);
      setBets(betsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchData();
    }
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      if (contestId) {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [contestId]);

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
            <Link to="/contests" className="back-link">← Back to Contests</Link>
            <h1>🎯 {contest?.name || 'Loading...'}</h1>
            <p>{contest?.description || 'Loading contest details...'}</p>
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
                {(() => {
                  const matchBets = bets.filter(b => b.matchId === match.id);
                  const winnersCount = (match.state === 'ended' && !match.draw)
                    ? matchBets.filter(b => b.team === match.winnerTeam).length
                    : 0;
                  return (
                <MatchCard
                  match={match}
                  userBet={getUserBetForMatch(match.id)}
                  winnersCount={winnersCount}
                  onBetUpdate={handleBetUpdate}
                />
                  );
                })()}
                {(match.state === 'ended' || match.state === 'started') && (
                  <div className="match-details-link">
                    <Link to={`/match/${match.id}`} state={{ contestId }} className="details-button">
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
