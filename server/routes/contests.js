const express = require('express');
const router = express.Router();
const { getContests, getContest, getContestMatches, getContestStats } = require('../utils/data');

// Get all contests
router.get('/', async (req, res) => {
  try {
    const contests = await getContests();
    res.json(contests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific contest
router.get('/:id', async (req, res) => {
  try {
    const contest = await getContest(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get matches for a specific contest
router.get('/:id/matches', async (req, res) => {
  try {
    const matches = await getContestMatches(req.params.id);
    res.set('Cache-Control', 'no-store');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics for a specific contest
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await getContestStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;