import { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import './MatchDetails.css';

const MatchDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const fromContestId = location.state?.contestId || null;
  const [match, setMatch] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setError(null);
        const [matchData, betsData] = await Promise.all([
          apiClient.getMatch(id),
          apiClient.getBets()
        ]);
        
        setMatch(matchData);
        setBets(betsData.filter(bet => bet.matchId === id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();

    // Set up auto-refresh for live matches
    const interval = setInterval(() => {
      fetchMatchDetails();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="match-details-container">
        <div className="loading">Loading match details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-details-container">
        <div className="error">
          <p>Error loading match: {error}</p>
          <Link to="/contests" className="back-button">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="match-details-container">
        <div className="error">
          <p>Match not found</p>
          <Link to="/contests" className="back-button">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  // Only allow viewing details for started or ended matches
  if (match.state === 'planned') {
    return <Navigate to="/contests" replace />;
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    };
  };

  const startDateTime = formatDateTime(match.startTime);
  const endDateTime = formatDateTime(match.endTime);

  const team1Bets = bets.filter(bet => bet.team === match.team1);
  const team2Bets = bets.filter(bet => bet.team === match.team2);

  const getWinners = () => {
    if (match.draw) {
      return [];
    }
    return bets.filter(bet => bet.team === match.winnerTeam);
  };

  const winners = getWinners();

  return (
    <div className="match-details-container">
      <div className="match-details-content">
        <div className="back-navigation">
          <Link 
            to={fromContestId ? `/contest/${fromContestId}` : (match?.contestId ? `/contest/${match.contestId}` : '/contests')} 
            className="back-link"
          >
            ← Back to {fromContestId || match?.contestId ? 'Contest' : 'Contests'}
          </Link>
        </div>

        <div className="match-info-card">
          <div className="match-header-details">
            <div className="match-id-details">Match {match.id}</div>
            {match.contestId && (
              <div className="contest-info">
                Contest: {match.contestId.toUpperCase()}
              </div>
            )}
          </div>
          <div className="match-title">
            <h1>{match.team1} vs {match.team2}</h1>
            <div className="match-weight">Game Points: {match.weight}</div>
          </div>

          {/* Explicit winner info banner */}
          {match.state === 'ended' && !match.draw && match.winnerTeam && (
            <div className="winner-banner">
              <strong>Winner:</strong> {match.winnerTeam}
            </div>
          )}

          <div className="match-times">
            <div className="time-info">
              <span className="time-label">Started:</span>
              <span className="time-value">{startDateTime.full}</span>
            </div>
            {match.state === 'ended' ? (
              <div className="time-info">
                <span className="time-label">Ended:</span>
                <span className="time-value">{endDateTime.full}</span>
              </div>
            ) : (
              <div className="time-info">
                <span className="time-label">Expected End:</span>
                <span className="time-value">{endDateTime.full}</span>
              </div>
            )}
          </div>

          <div className="match-result">
            {match.state === 'started' ? (
              <div className="result-live">
                <h2>🔴 Match in Progress</h2>
                <p>Results will be available when the match ends</p>
              </div>
            ) : match.draw ? (
              <div className="result-draw">
                <h2>🤝 Match Ended in Draw</h2>
                <p>No winners this time!</p>
              </div>
            ) : (
              <div className="result-winner">
                <h2>🏆 Winner: {match.winnerTeam}</h2>
                <p>{winners.length} player{winners.length !== 1 ? 's' : ''} won!</p>
              </div>
            )}
          </div>
        </div>

        <div className="betting-summary">
          <h2>Prediction Summary</h2>
          
          <div className="teams-betting">
            <div className="team-bets">
              <h3>{match.team1} ({team1Bets.length} prediction{team1Bets.length !== 1 ? 's' : ''})</h3>
              <div className="bets-list">
                {team1Bets.length === 0 ? (
                  <p className="no-bets">No predictions placed</p>
                ) : (
                  <ul>
                    {team1Bets.map((bet, index) => {
                      const payout = match.payout;
                      const potentialPayout = match.potentialPayouts?.[match.team1];
                      const userFinal = payout?.payouts?.find(p => p.username === bet.username);
                      const finalReward = userFinal ? userFinal.reward : null;

                      return (
                        <li key={index} className={bet.isDefault ? 'default-bet' : ''}>
                          <div className="bet-user-info">
                            {/* Show potential payout for live matches */}
                            {match.state === 'started' && potentialPayout && (
                              <span className="potential-reward">
                                {bet.team === match.team1 
                                  ? `+${potentialPayout.rewardPerWinner.toFixed(1)} pts -`
                                  : `-${match.weight} pts -`
                                }
                              </span>
                            )}
                            {/* Show actual winnings for ended matches based on payoutUtils calculation */}
                            {match.state === 'ended' && payout && (
                              <span className={`actual-reward ${finalReward > 0 ? 'winner' : (finalReward < 0 ? 'loser' : '')}`}>
                                {finalReward !== null
                                  ? `${finalReward > 0 ? '+' : ''}${finalReward % 1 === 0 ? finalReward : finalReward.toFixed(1)} pts -`
                                  : (bet.team === match.winnerTeam && payout.rewardPerWinner > 0
                                      ? `+${payout.rewardPerWinner.toFixed(1)} pts -`
                                      : `-${match.weight} pts -`
                                    )
                                }
                              </span>
                            )}
                            {/* Fallback for ended matches without payout data */}
                            {match.state === 'ended' && !payout && (
                              <span className="actual-reward loser">{`-${match.weight} pts -`}</span>
                            )}
                            <span className="bettor-name">{bet.username}</span>
                            {bet.isDefault && <span className="default-label">(auto)</span>}
                            {match.state === 'ended' && !match.draw && bet.team === match.winnerTeam && (
                              <span className="winner-badge">🏆</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="team-bets">
              <h3>{match.team2} ({team2Bets.length} prediction{team2Bets.length !== 1 ? 's' : ''})</h3>
              <div className="bets-list">
                {team2Bets.length === 0 ? (
                  <p className="no-bets">No predictions placed</p>
                ) : (
                  <ul>
                    {team2Bets.map((bet, index) => {
                      const payout = match.payout;
                      const potentialPayout = match.potentialPayouts?.[match.team2];
                      const userFinal = payout?.payouts?.find(p => p.username === bet.username);
                      const finalReward = userFinal ? userFinal.reward : null;

                      return (
                        <li key={index} className={bet.isDefault ? 'default-bet' : ''}>
                          <div className="bet-user-info">
                            {/* Show potential payout for live matches */}
                            {match.state === 'started' && potentialPayout && (
                              <span className="potential-reward">
                                {bet.team === match.team2 
                                  ? `+${potentialPayout.rewardPerWinner.toFixed(1)} pts -`
                                  : `-${match.weight} pts -`
                                }
                              </span>
                            )}
                            {/* Show actual winnings for ended matches based on payoutUtils calculation */}
                            {match.state === 'ended' && payout && (
                              <span className={`actual-reward ${finalReward > 0 ? 'winner' : (finalReward < 0 ? 'loser' : '')}`}>
                                {finalReward !== null
                                  ? `${finalReward > 0 ? '+' : ''}${finalReward % 1 === 0 ? finalReward : finalReward.toFixed(1)} pts -`
                                  : (bet.team === match.winnerTeam && payout.rewardPerWinner > 0
                                      ? `+${payout.rewardPerWinner.toFixed(1)} pts -`
                                      : `-${match.weight} pts -`
                                    )
                                }
                              </span>
                            )}
                            {/* Fallback for ended matches without payout data */}
                            {match.state === 'ended' && !payout && (
                              <span className="actual-reward loser">{`-${match.weight} pts -`}</span>
                            )}
                            <span className="bettor-name">{bet.username}</span>
                            {bet.isDefault && <span className="default-label">(auto)</span>}
                            {match.state === 'ended' && !match.draw && bet.team === match.winnerTeam && (
                              <span className="winner-badge">🏆</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Payout Information */}
          {match.state === 'ended' && match.payout && (
            <div className="payout-section">
              <h3>💰 Final Payouts</h3>
              <div className="payout-summary">
                <div className="payout-info">
                  <span className="payout-label">Total Pool:</span>
                  <span className="payout-value">{match.payout.totalPool} points</span>
                </div>
                <div className="payout-info">
                  <span className="payout-label">Reward per Winner:</span>
                  <span className="payout-value">
                    {match.payout.rewardPerWinner > 0 
                      ? `${match.payout.rewardPerWinner.toFixed(1)} points`
                      : 'No rewards'
                    }
                  </span>
                </div>
              </div>
              <div className="payout-message">
                {match.payout.summary.message}
              </div>
            </div>
          )}

          {match.state === 'started' && match.potentialPayouts && (
            <div className="potential-payout-section">
              <h3>🎯 Potential Payouts</h3>
              <div className="potential-scenarios">
                {Object.entries(match.potentialPayouts).map(([team, scenario]) => (
                  <div key={team} className="scenario">
                    <h4>If {team} wins:</h4>
                    <div className="scenario-details">
                      <span>Pool: {scenario.totalPool} points</span>
                      <span>Per winner: {scenario.rewardPerWinner.toFixed(1)} points</span>
                    </div>
                    <p className="scenario-message">{scenario.summary.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="betting-stats">
            <div className="stat">
              <span className="stat-label">Total Bets:</span>
              <span className="stat-value">{bets.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Default Bets:</span>
              <span className="stat-value">{bets.filter(bet => bet.isDefault).length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Manual Bets:</span>
              <span className="stat-value">{bets.filter(bet => !bet.isDefault).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
