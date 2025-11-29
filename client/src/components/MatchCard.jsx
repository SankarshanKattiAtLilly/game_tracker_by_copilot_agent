import { useState } from 'react';
import { apiClient } from '../api/client';
import './MatchCard.css';

const MatchCard = ({ match, userBet, winnersCount = 0, onBetUpdate }) => {
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [error, setError] = useState(null);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getMatchStatus = () => {
    const now = new Date();
    const startTime = new Date(match.startTime);
    const cutoffTime = new Date(startTime.getTime() - 30 * 60 * 1000); // 30 min before start

    if (match.state === 'ended') {
      return 'ended';
    } else if (match.state === 'started') {
      return 'live';
    } else if (now >= cutoffTime) {
      return 'cutoff';
    } else {
      return 'open';
    }
  };

  const canBet = () => {
    return getMatchStatus() === 'open';
  };

  const handleBet = async (team) => {
    if (!canBet() || isPlacingBet) return;

    setIsPlacingBet(true);
    setError(null);

    try {
      await apiClient.placeBet(match.id, team);
      onBetUpdate();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleRemoveBet = async () => {
    if (!canBet() || isPlacingBet) return;

    setIsPlacingBet(true);
    setError(null);

    try {
      await apiClient.removeBet(match.id);
      onBetUpdate();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const status = getMatchStatus();
  const startDateTime = formatDateTime(match.startTime);
  const hasUserBet = userBet && !userBet.isDefault;

  const getUserOutcome = () => {
    // If match ended and user didn't bet, reflect outcome appropriately
    if (!userBet) {
      if (match.state === 'ended') {
        if (match.draw) return 'draw';
        // No winners on winning team → no penalty for anyone
        if (winnersCount === 0) return 'no-penalty';
        // Ended but user had no bet
        return 'no-bet';
      }
      return 'yet-to-bet';
    }
    if (match.state === 'ended') {
      if (match.draw) return 'draw';
      if (userBet.team === match.winnerTeam) return 'won';
      // if no one bet on winning team, no penalty scenario
      if (winnersCount === 0) return 'no-penalty';
      return 'lost';
    }
    return 'bet-placed';
  };

  const outcome = getUserOutcome();

  return (
    <div className={`match-card ${status}`}>
      <div className="match-header">
        <div className="match-header-top">
          <div className="match-id">Match {match.id}</div>
          <div className="match-weight">Game Points: {match.weight}</div>
        </div>
        <div className="match-teams">
          <div className="team-name">{match.team1}</div>
          <div className="vs">vs</div>
          <div className="team-name">{match.team2}</div>
        </div>
      </div>

      <div className="match-details">
        <div className="match-time">
          <span className="date">{startDateTime.date}</span>
          <span className="time">{startDateTime.time}</span>
        </div>
        <div className={`match-status status-${status}`}>
          {status === 'open' && 'Open for betting'}
          {status === 'cutoff' && 'Betting closed'}
          {status === 'live' && 'Live'}
          {status === 'ended' && (
            match.draw ? 'Draw' : `Winner: ${match.winnerTeam}`
          )}
        </div>
        <div className={`user-outcome-pill ${outcome}`}>
          {outcome === 'yet-to-bet' && 'Yet to bet'}
          {outcome === 'no-bet' && 'No bet'}
          {outcome === 'bet-placed' && 'Bet placed'}
          {outcome === 'won' && 'You won'}
          {outcome === 'lost' && 'You lost'}
          {outcome === 'no-penalty' && 'No penalty'}
          {outcome === 'draw' && 'Draw'}
        </div>
      </div>

      {hasUserBet && (
        <div className="current-bet">
          <span className="bet-label">Your bet:</span>
          <span className={`bet-team ${userBet.isDefault ? 'default-bet' : ''}`}>
            {userBet.team} {userBet.isDefault && '(auto)'}
          </span>
          {canBet() && (
            <button
              onClick={handleRemoveBet}
              disabled={isPlacingBet}
              className="remove-bet-btn"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {canBet() && (
        <div className="betting-actions">
          <button
            onClick={() => handleBet(match.team1)}
            disabled={isPlacingBet}
            className={`bet-button ${hasUserBet && userBet.team === match.team1 ? 'selected' : ''}`}
          >
            {isPlacingBet ? '...' : `Bet on ${match.team1}`}
          </button>
          <button
            onClick={() => handleBet(match.team2)}
            disabled={isPlacingBet}
            className={`bet-button ${hasUserBet && userBet.team === match.team2 ? 'selected' : ''}`}
          >
            {isPlacingBet ? '...' : `Bet on ${match.team2}`}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
