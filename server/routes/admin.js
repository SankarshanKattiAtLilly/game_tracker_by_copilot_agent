const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  getContests, saveContests, getContest, getMatches, saveMatches, getTeams, saveTeams, logAction, getComputedContestDates
} = require('../utils/data');

const router = express.Router();

// Helper: prevent edits after contest or match started
const isContestStarted = (contestId) => {
  const dates = getComputedContestDates(contestId);
  if (!dates.startDate) return false;
  return new Date(dates.startDate).getTime() <= Date.now();
};
const isMatchStarted = (matchId) => {
  const matches = getMatches();
  const m = matches.find(x => x.id === matchId);
  if (!m) return false;
  const start = new Date(m.startTime).getTime();
  return start <= Date.now() || m.state !== 'planned';
};

router.use(authenticateToken, requireAdmin);

// Contests CRUD
router.get('/contests', (req, res) => {
  res.json(getContests());
});

// Admin meta: next contest id and game options from env
router.get('/meta', (req, res) => {
  const contests = getContests();
  const nums = contests
    .map(c => typeof c.id === 'string' && c.id.startsWith('c') ? parseInt(c.id.slice(1), 10) : NaN)
    .filter(n => !Number.isNaN(n));
  const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
  const nextContestId = `c${nextNum}`;
  const raw = process.env.GAME_OPTIONS || 'Cricket,Football,Tennis,Kabaddi';
  const games = raw.split(',').map(s => s.trim()).filter(Boolean);
  res.json({ nextContestId, games });
});

router.post('/contests', (req, res) => {
  const contests = getContests();
  const { id: providedId, name, description, game = null, teams = [], enrolledUsers = [] } = req.body;
  if (!name || !game) return res.status(400).json({ error: 'name and game are required' });
  let id = providedId;
  if (!id) {
    const nums = contests
      .map(c => typeof c.id === 'string' && c.id.startsWith('c') ? parseInt(c.id.slice(1), 10) : NaN)
      .filter(n => !Number.isNaN(n));
    const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
    id = `c${nextNum}`;
  }
  if (contests.find(c => c.id === id)) return res.status(409).json({ error: 'Contest id already exists' });
  const newContest = { id, name, description: description || '', game, teams, enrolledUsers };
  contests.push(newContest);
  saveContests(contests);
  logAction({ actor: req.user.username, action: 'create', entity: 'contest', entityId: id, payload: newContest });
  res.status(201).json(newContest);
});

router.put('/contests/:id', (req, res) => {
  const contests = getContests();
  const idx = contests.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Contest not found' });
  if (isContestStarted(req.params.id)) return res.status(400).json({ error: 'Contest has started; edits not allowed' });
  const current = contests[idx];
  const update = { ...current, ...req.body, id: current.id };
  contests[idx] = update;
  saveContests(contests);
  logAction({ actor: req.user.username, action: 'update', entity: 'contest', entityId: current.id, payload: req.body });
  res.json(update);
});

router.delete('/contests/:id', (req, res) => {
  const contests = getContests();
  const found = contests.find(c => c.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Contest not found' });
  if (isContestStarted(req.params.id)) return res.status(400).json({ error: 'Contest has started; deletion not allowed' });
  const remaining = contests.filter(c => c.id !== req.params.id);
  saveContests(remaining);
  logAction({ actor: req.user.username, action: 'delete', entity: 'contest', entityId: req.params.id });
  res.json({ ok: true });
});

// Teams CRUD (global)
router.get('/teams', (req, res) => {
  res.json(getTeams());
});
router.post('/teams', (req, res) => {
  const teams = getTeams();
  const { id, name, game } = req.body;
  if (!id || !name || !game) return res.status(400).json({ error: 'id, name, game required' });
  if (teams.find(t => t.id === id)) return res.status(409).json({ error: 'Team id exists' });
  const newTeam = { id, name, game };
  teams.push(newTeam);
  saveTeams(teams);
  logAction({ actor: req.user.username, action: 'create', entity: 'team', entityId: id, payload: newTeam });
  res.status(201).json(newTeam);
});
router.put('/teams/:id', (req, res) => {
  const teams = getTeams();
  const idx = teams.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Team not found' });
  const updated = { ...teams[idx], ...req.body, id: teams[idx].id };
  teams[idx] = updated;
  saveTeams(teams);
  logAction({ actor: req.user.username, action: 'update', entity: 'team', entityId: updated.id, payload: req.body });
  res.json(updated);
});
router.delete('/teams/:id', (req, res) => {
  const teams = getTeams();
  const exists = teams.find(t => t.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Team not found' });
  const remaining = teams.filter(t => t.id !== req.params.id);
  saveTeams(remaining);
  logAction({ actor: req.user.username, action: 'delete', entity: 'team', entityId: req.params.id });
  res.json({ ok: true });
});

// Link/unlink teams to contest
router.post('/contests/:id/teams', (req, res) => {
  const contests = getContests();
  const idx = contests.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Contest not found' });
  if (isContestStarted(req.params.id)) return res.status(400).json({ error: 'Contest started; edits not allowed' });
  const { teamIds } = req.body;
  if (!Array.isArray(teamIds)) return res.status(400).json({ error: 'teamIds array required' });
  contests[idx].teams = teamIds;
  saveContests(contests);
  logAction({ actor: req.user.username, action: 'link-teams', entity: 'contest', entityId: req.params.id, payload: { teamIds } });
  res.json(contests[idx]);
});

// Matches CRUD within a contest
router.get('/contests/:id/matches', (req, res) => {
  const matches = getMatches().filter(m => m.contestId === req.params.id);
  res.json(matches);
});
router.post('/contests/:id/matches', (req, res) => {
  const contest = getContest(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  if (isContestStarted(req.params.id)) return res.status(400).json({ error: 'Contest started; edits not allowed' });
  const matches = getMatches();
  const { id, team1, team2, startTime, endTime, weight = 1 } = req.body;
  if (!id || !team1 || !team2 || !startTime || !endTime) return res.status(400).json({ error: 'id, team1, team2, startTime, endTime required' });
  if (matches.find(m => m.id === id)) return res.status(409).json({ error: 'Match id exists' });
  const newMatch = { id, contestId: req.params.id, team1, team2, startTime, endTime, state: 'planned', weight, winnerTeam: null, draw: false };
  matches.push(newMatch);
  saveMatches(matches);
  logAction({ actor: req.user.username, action: 'create', entity: 'match', entityId: id, payload: newMatch });
  res.status(201).json(newMatch);
});
router.put('/matches/:id', (req, res) => {
  const matches = getMatches();
  const idx = matches.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Match not found' });
  if (isMatchStarted(req.params.id)) return res.status(400).json({ error: 'Match started; edits not allowed' });
  const cur = matches[idx];
  const allowed = ['team1','team2','startTime','endTime','weight'];
  const update = { ...cur };
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  matches[idx] = update;
  saveMatches(matches);
  logAction({ actor: req.user.username, action: 'update', entity: 'match', entityId: cur.id, payload: req.body });
  res.json(update);
});
router.delete('/matches/:id', (req, res) => {
  const matches = getMatches();
  const match = matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (isMatchStarted(req.params.id)) return res.status(400).json({ error: 'Match started; deletion not allowed' });
  const remaining = matches.filter(m => m.id !== req.params.id);
  saveMatches(remaining);
  logAction({ actor: req.user.username, action: 'delete', entity: 'match', entityId: req.params.id });
  res.json({ ok: true });
});

// Enrollment management
router.get('/contests/:id/users', (req, res) => {
  const contest = getContest(req.params.id);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  res.json({ enrolledUsers: Array.isArray(contest.enrolledUsers) ? contest.enrolledUsers : [] });
});
router.post('/contests/:id/users', (req, res) => {
  const contests = getContests();
  const idx = contests.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Contest not found' });
  if (isContestStarted(req.params.id)) return res.status(400).json({ error: 'Contest started; edits not allowed' });
  const { usernames } = req.body;
  if (!Array.isArray(usernames)) return res.status(400).json({ error: 'usernames array required' });
  const existing = new Set(Array.isArray(contests[idx].enrolledUsers) ? contests[idx].enrolledUsers : []);
  usernames.forEach(u => existing.add(u));
  contests[idx].enrolledUsers = Array.from(existing);
  saveContests(contests);
  logAction({ actor: req.user.username, action: 'enroll', entity: 'contest', entityId: req.params.id, payload: { usernames } });
  res.json({ enrolledUsers: contests[idx].enrolledUsers });
});
router.delete('/contests/:id/users/:username', (req, res) => {
  const contests = getContests();
  const idx = contests.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Contest not found' });
  if (isContestStarted(req.params.id)) return res.status(400).json({ error: 'Contest started; edits not allowed' });
  const u = req.params.username;
  contests[idx].enrolledUsers = (Array.isArray(contests[idx].enrolledUsers) ? contests[idx].enrolledUsers : []).filter(x => x !== u);
  saveContests(contests);
  logAction({ actor: req.user.username, action: 'unenroll', entity: 'contest', entityId: req.params.id, payload: { username: u } });
  res.json({ enrolledUsers: contests[idx].enrolledUsers });
});

module.exports = router;
