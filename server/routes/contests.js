const express = require('express');
const router = express.Router();
const { getContests, getContest, getContestMatches, getContestStats, getMatches, getComputedContestDates } = require('../utils/data');

// Helper to derive dynamic contest metrics from its matches
const deriveContestFields = (contest, allMatches) => {
  // Use existing helper to include fallback window logic if no explicit contestId matches
  let contestMatches = allMatches.filter(m => m.contestId === contest.id);
  if (contestMatches.length === 0) {
    // Fallback: date window (same logic as getContestMatches)
    try {
      const start = new Date(contest.startDate).getTime();
      const end = new Date(contest.endDate).getTime();
      contestMatches = allMatches.filter(m => {
        const st = new Date(m.startTime).getTime();
        return st >= start && st <= end;
      });
    } catch (_) {
      contestMatches = [];
    }
  }
  const totalMatches = contestMatches.length;
  const completedMatches = contestMatches.filter(m => m.state === 'ended').length;
  const startedMatches = contestMatches.filter(m => m.state === 'started').length;
  const totalGamePoints = contestMatches.reduce((sum, m) => sum + (typeof m.weight === 'number' ? m.weight : 0), 0);
  const percentComplete = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
  const remainingMatches = totalMatches - completedMatches;

  // Dynamic status override (upcoming / active / completed)
  const now = Date.now();
  const computedDates = getComputedContestDates(contest.id);
  const startTs = computedDates.startDate ? new Date(computedDates.startDate).getTime() : (contest.startDate ? new Date(contest.startDate).getTime() : now + 1);
  const endTs = computedDates.endDate ? new Date(computedDates.endDate).getTime() : (contest.endDate ? new Date(contest.endDate).getTime() : now - 1);
  let dynamicStatus = contest.status;
  if (totalMatches > 0) {
    if (completedMatches === totalMatches) {
      dynamicStatus = 'completed';
    } else if (now < startTs) {
      dynamicStatus = 'upcoming';
    } else if (now > endTs) {
      // After end but not all marked ended -> treat as completed if mostly done
      dynamicStatus = completedMatches > 0 ? 'completed' : 'upcoming';
    } else {
      dynamicStatus = 'active';
    }
  }

  return {
    totalMatches,
    completedMatches,
    startedMatches,
    remainingMatches,
    totalGamePoints,
    percentComplete: Math.round(percentComplete),
    dynamicStatus,
    computedStartDate: computedDates.startDate,
    computedEndDate: computedDates.endDate
  };
};

// Get all contests
router.get('/', async (req, res) => {
  try {
    const contests = await getContests();
    const matches = await getMatches();
    const enriched = contests.map(c => {
      const derived = deriveContestFields(c, matches);
      return {
        ...c,
        ...derived
      };
    });
    res.json(enriched);
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
    const matches = await getMatches();
    const derived = deriveContestFields(contest, matches);
    res.json({
      ...contest,
      ...derived
    });
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