const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getMatches, saveMatches } = require('../utils/data');

const router = express.Router();

// POST /debug/assign-missing-winners
// One-off helper: assign a random winner for matches that have ended but lack winner/draw
router.post('/assign-missing-winners', authenticateToken, (req, res) => {
  try {
    const matches = getMatches();
    let updatedCount = 0;

    matches.forEach(m => {
      if (m.state === 'ended' && !m.winnerTeam && !m.draw && m.team1 && m.team2) {
        const teams = [m.team1, m.team2];
        m.winnerTeam = teams[Math.floor(Math.random() * 2)];
        updatedCount += 1;
      }
    });

    saveMatches(matches);
    res.json({ message: 'Assigned winners for ended matches without results', updated: updatedCount });
  } catch (err) {
    console.error('Error assigning missing winners:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
