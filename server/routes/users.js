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
        startTime: match.startTime,
        endTime: match.endTime,
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

// ADMIN/MASTER STATS FOR ALL USERS
const adminRouter = express.Router();

adminRouter.get('/stats/all', authenticateToken, (req, res) => {
  try {
    updateMatchStates();
    const matches = getMatches();
    const bets = getBets();

    // Build per-user histories
    const perUser = {};
    bets.forEach(b => {
      if (!perUser[b.username]) perUser[b.username] = [];
      const match = matches.find(m => m.id === b.matchId);
      if (!match) return;
      const matchBets = bets.filter(x => x.matchId === b.matchId && (x.team === match.team1 || x.team === match.team2));
      const payout = match.state === 'ended' ? calculatePayouts(matchBets, match.winnerTeam, match.weight, match.draw) : null;
      const mine = payout ? payout.payouts.find(p => p.username === b.username) : null;
      const reward = mine ? mine.reward : 0;
      const outcome = match.state !== 'ended' ? 'pending' : (match.draw ? 'draw' : (mine && mine.isWinner ? 'win' : (mine && reward < 0 ? 'loss' : 'no-penalty')));
      perUser[b.username].push({ matchId: match.id, outcome, reward, weight: match.weight, endTime: match.endTime });
    });

    // Compute totals and streaks
    const usersSummary = Object.keys(perUser).map(username => {
      const history = perUser[username].sort((a,b)=> new Date(a.endTime) - new Date(b.endTime));
      let wins=0, losses=0, draws=0, pointsGained=0, pointsLost=0, net=0;
      let longestWinStreak=0, longestLossStreak=0, currentWinStreak=0, currentLossStreak=0;
      history.forEach(h => {
        if (h.outcome === 'win') { wins++; pointsGained += h.reward; net += h.reward; currentWinStreak++; currentLossStreak=0; }
        else if (h.outcome === 'loss') { losses++; pointsLost += Math.abs(h.reward); net += h.reward; currentLossStreak++; currentWinStreak=0; }
        else if (h.outcome === 'draw') { draws++; currentWinStreak=0; currentLossStreak=0; }
        else { currentWinStreak=0; currentLossStreak=0; }
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      });
      return { username, wins, losses, draws, pointsGained, pointsLost, net, longestWinStreak, longestLossStreak, count: history.length };
    });

    // Leaders
    const highestWinUser = [...usersSummary].sort((a,b)=> b.wins - a.wins)[0] || null;
    const highestLossUser = [...usersSummary].sort((a,b)=> b.losses - a.losses)[0] || null;
    const longestContinuousWinUser = [...usersSummary].sort((a,b)=> b.longestWinStreak - a.longestWinStreak)[0] || null;
    const longestContinuousLossUser = [...usersSummary].sort((a,b)=> b.longestLossStreak - a.longestLossStreak)[0] || null;
    const highestNetUser = [...usersSummary].sort((a,b)=> b.net - a.net)[0] || null;

    res.json({
      totals: {
        users: usersSummary.length,
        matches: matches.length,
        bets: bets.length
      },
      users: usersSummary,
      leaders: {
        highestWinUser,
        highestLossUser,
        longestContinuousWinUser,
        longestContinuousLossUser,
        highestNetUser
      }
    });
  } catch (error) {
    console.error('Error building all-users stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports.adminRouter = adminRouter;
