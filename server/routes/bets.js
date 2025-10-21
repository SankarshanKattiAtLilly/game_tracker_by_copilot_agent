const express = require('express');
const { 
  getBets, 
  placeBet, 
  removeBet, 
  getMatchById,
  updateMatchStates
} = require('../utils/data');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /bets - List all bets (for debugging)
router.get('/', authenticateToken, (req, res) => {
  try {
    const bets = getBets();
    res.json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /matches/:id/bet - Place or update bet
router.post('/:id/bet', authenticateToken, (req, res) => {
  try {
    const matchId = req.params.id;
    const { team } = req.body;
    const username = req.user.username;

    if (!team) {
      return res.status(400).json({ error: 'Team selection required' });
    }

    // Update match states first
    updateMatchStates();

    const bet = placeBet(matchId, username, team);
    
    res.json({
      message: 'Bet placed successfully',
      bet
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    
    if (error.message === 'Match not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Betting not allowed for this match' || 
        error.message === 'Invalid team selection') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /matches/:id/bet - Remove bet
router.delete('/:id/bet', authenticateToken, (req, res) => {
  try {
    const matchId = req.params.id;
    const username = req.user.username;

    // Update match states first
    updateMatchStates();

    removeBet(matchId, username);
    
    res.json({
      message: 'Bet removed successfully'
    });
  } catch (error) {
    console.error('Error removing bet:', error);
    
    if (error.message === 'Match not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Cannot remove bet - betting not allowed for this match' ||
        error.message === 'No bet found to remove') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
