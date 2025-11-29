const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getMatches, getBets, getMatchById, updateMatchStates } = require('../utils/data');
const { calculatePayouts } = require('../utils/payoutUtils');

const router = express.Router();

// GET /users/me/stats - Aggregated stats for the authenticated user
router.get('/me/stats', authenticateToken, (req, res) => {
  try {
    const username = req.user.username;
    updateMatchStates();
    const matches = getMatches();
    const bets = getBets().filter(b => b.username === username);

    let totalWins = 0;
    let totalLosses = 0;
    let totalDraws = 0;
    let pointsGained = 0;
    let pointsLost = 0;
    let netPoints = 0;

    const perMatch = [];

    bets.forEach(bet => {
      const match = getMatchById(bet.matchId);
      if (!match) return;

      const matchBets = getBets().filter(x => x.matchId === bet.matchId && (x.team === match.team1 || x.team === match.team2));
      let reward = 0;
      let outcome = 'pending';

      if (match.state === 'ended') {
        const payout = calculatePayouts(matchBets, match.winnerTeam, match.weight, match.draw);
        const mine = payout.payouts.find(p => p.username === username);
        reward = mine ? mine.reward : 0;
        if (match.draw) {
          outcome = 'draw';
          totalDraws += 1;
        } else if (mine && mine.isWinner) {
          outcome = 'win';
          totalWins += 1;
        } else if (mine && reward < 0) {
          outcome = 'loss';
          totalLosses += 1;
        } else {
          // W=0 or other zero outcome
          outcome = 'no-penalty';
        }

        if (reward > 0) pointsGained += reward;
        if (reward < 0) pointsLost += Math.abs(reward);
        netPoints += reward;
      }

      perMatch.push({
        matchId: match.id,
        contestId: match.contestId || null,
        teams: [match.team1, match.team2],
        weight: match.weight,
        state: match.state,
        draw: !!match.draw,
        winnerTeam: match.winnerTeam || null,
        bet: { team: bet.team, isDefault: !!bet.isDefault },
        reward,
        outcome
      });
    });

    const response = {
      username,
      totals: {
        wins: totalWins,
        losses: totalLosses,
        draws: totalDraws,
        pointsGained,
        pointsLost,
        netPoints
      },
      history: perMatch.sort((a,b)=> a.matchId.localeCompare(b.matchId))
    };

    res.json(response);
  } catch (error) {
    console.error('Error building user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
