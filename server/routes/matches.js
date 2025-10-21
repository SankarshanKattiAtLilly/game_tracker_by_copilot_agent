const express = require('express');
const { 
  getMatches, 
  getBets, 
  getMatchById, 
  getResultByMatchId,
  updateMatchStates, 
  isBettingAllowed,
  getUserBetForMatch
} = require('../utils/data');
const { calculatePotentialPayouts, calculatePayouts } = require('../utils/payoutUtils');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /matches - List all matches
router.get('/', authenticateToken, (req, res) => {
  try {
    // Update match states based on current time
    const matches = updateMatchStates();
    const bets = getBets();
    const username = req.user.username;

    // Add additional info to each match
    const matchesWithInfo = matches.map(match => {
      const userBet = getUserBetForMatch(username, match.id);
      const matchBets = bets.filter(bet => bet.matchId === match.id);
      
      return {
        ...match,
        userBet: userBet ? userBet.team : null,
        userBetIsDefault: userBet ? userBet.isDefault : false,
        bettingAllowed: isBettingAllowed(match),
        totalBets: matchBets.length
      };
    });

    // Sort by start time (chronological)
    matchesWithInfo.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    res.json(matchesWithInfo);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /matches/:id - Get match details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const matchId = req.params.id;
    
    // Update match states first
    updateMatchStates();
    
    const match = getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Allow access to match details if match has started or ended
    if (match.state === 'planned') {
      return res.status(403).json({ error: 'Match details not available for planned matches' });
    }

    const bets = getBets();
    const matchBets = bets.filter(bet => bet.matchId === matchId && (bet.team === match.team1 || bet.team === match.team2));

    // Group bets by team
    const team1Bets = matchBets.filter(bet => bet.team === match.team1);
    const team2Bets = matchBets.filter(bet => bet.team === match.team2);

    // Add user info and mark default bets
    const formatBets = (bets) => bets.map(bet => ({
      username: bet.username,
      timestamp: bet.timestamp,
      isDefault: bet.isDefault
    }));

    const matchDetails = {
      ...match,
      bets: {
        [match.team1]: formatBets(team1Bets),
        [match.team2]: formatBets(team2Bets)
      },
      totalBets: matchBets.length,
      bettingAllowed: isBettingAllowed(match)
    };

    // Add payout information based on match state
    if (match.state === 'ended') {
      // Get final payout results
      // const payoutResult = getResultByMatchId(matchId);
    //   if (payoutResult) {
    //     matchDetails.payout = {
    //       totalPool: payoutResult.totalPool,
    //       rewardPerWinner: payoutResult.rewardPerWinner,
    //       payouts: calculatePayouts(matchBets, match.winnerTeam, match.weight, match.draw),
    //       summary: payoutResult.summary
    //     };
    //   }
      matchDetails.payout = calculatePayouts(matchBets, match.winnerTeam, match.weight, match.draw)
    } else if (match.state === 'started' || match.state === 'ended') {
      // Calculate potential payouts for live match
      const teams = [match.team1, match.team2];
      const potentialPayouts = calculatePotentialPayouts(matchBets, match.weight, teams);
      matchDetails.potentialPayouts = potentialPayouts;
    }

    res.json(matchDetails);
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
