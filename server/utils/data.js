const fs = require('fs');
const path = require('path');
const { calculatePayouts } = require('./payoutUtils');

const DATA_DIR = path.join(__dirname, '../../data');

// Helper function to read JSON file
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to write JSON file
const writeJSONFile = (filename, data) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// Get all users
const getUsers = () => {
  return readJSONFile('users.json');
};

// Get all teams
const getTeams = () => {
  return readJSONFile('teams.json');
};

// Get all matches
const getMatches = () => {
  return readJSONFile('matches.json');
};

// Get all bets
const getBets = () => {
  return readJSONFile('bets.json');
};

// Get all results
const getResults = () => {
  return readJSONFile('results.json');
};

// Save matches
const saveMatches = (matches) => {
  return writeJSONFile('matches.json', matches);
};

// Save users
const saveUsers = (users) => {
  return writeJSONFile('users.json', users);
};

// Save teams
const saveTeams = (teams) => {
  return writeJSONFile('teams.json', teams);
};

// Save bets
const saveBets = (bets) => {
  return writeJSONFile('bets.json', bets);
};

// Save results
const saveResults = (results) => {
  return writeJSONFile('results.json', results);
};

// Get match by ID
const getMatchById = (matchId) => {
  const matches = getMatches();
  return matches.find(match => match.id === matchId);
};

// Update match state based on current time
const updateMatchStates = () => {
  const matches = getMatches();
  const now = new Date();
  let updated = false;

  matches.forEach(match => {
    const startTime = new Date(match.startTime);
    const endTime = new Date(match.endTime);

    if (now >= endTime && match.state !== 'ended') {
      match.state = 'ended';
      updated = true;
      
      // Trigger default bet assignment if match just ended
      assignDefaultBets(match.id);
    } else if (now >= startTime && match.state === 'planned') {
      match.state = 'started';
      updated = true;
    }
  });

  if (updated) {
    saveMatches(matches);
  }

  return matches;
};

// Check if betting is allowed for a match (before cutoff time)
const isBettingAllowed = (match) => {
  const now = new Date();
  const startTime = new Date(match.startTime);
  const cutoffTime = new Date(startTime.getTime() - 30 * 60 * 1000); // 30 minutes before start
  
  return now < cutoffTime && match.state === 'planned';
};

// Assign default bets for users who haven't bet on a match
const assignDefaultBets = (matchId) => {
  const match = getMatchById(matchId);
  if (!match || match.state !== 'ended') return;

  const users = getUsers();
  const bets = getBets();
  const now = new Date().toISOString();

  // Find users who haven't bet on this match
  const usersBetOnMatch = bets.filter(bet => bet.matchId === matchId).map(bet => bet.username);
  const usersWithoutBets = users.filter(user => !usersBetOnMatch.includes(user.username));

  // Determine the losing team (opposite of winner)
  let defaultTeam;
  if (match.draw) {
    // For draws, randomly assign to one of the teams
    defaultTeam = Math.random() < 0.5 ? match.team1 : match.team2;
  } else if (match.winnerTeam) {
    // Assign to the losing team
    defaultTeam = match.winnerTeam === match.team1 ? match.team2 : match.team1;
  } else {
    // No winner determined, randomly assign
    defaultTeam = Math.random() < 0.5 ? match.team1 : match.team2;
  }

  // Create default bets
  const defaultBets = usersWithoutBets.map(user => ({
    matchId: matchId,
    username: user.username,
    team: defaultTeam,
    timestamp: now,
    isDefault: true
  }));

  // Add default bets to the bets array
  let allBetsForMatch = bets.filter(bet => bet.matchId === matchId);
  if (defaultBets.length > 0) {
    const updatedBets = [...bets, ...defaultBets];
    saveBets(updatedBets);
    allBetsForMatch = [...allBetsForMatch, ...defaultBets];
    console.log(`Assigned ${defaultBets.length} default bets for match ${matchId}`);
  }

  // Calculate and save payout results if match has ended with a result
  if (match.state === 'ended') {
    calculateAndSavePayouts(matchId, match, allBetsForMatch);
  }
};

// Calculate and save payout results for an ended match
const calculateAndSavePayouts = (matchId, match, matchBets) => {
  if (!match.winnerTeam && !match.draw) {
    console.log(`Skipping payout calculation for match ${matchId} - no winner determined`);
    return;
  }

  // Calculate payouts
  const payoutData = calculatePayouts(matchBets, match.winnerTeam, match.weight, match.draw);
  
  // Get existing results
  const results = getResults();
  
  // Remove any existing result for this match
  const filteredResults = results.filter(result => result.matchId !== matchId);
  
  // Add new result
  const newResult = {
    matchId,
    matchWeight: match.weight,
    winnerTeam: match.winnerTeam,
    isDraw: match.draw,
    calculatedAt: new Date().toISOString(),
    ...payoutData
  };
  
  filteredResults.push(newResult);
  saveResults(filteredResults);
  
  console.log(`Calculated payouts for match ${matchId}: ${payoutData.summary.message}`);
};

// Get user's bet for a specific match
const getUserBetForMatch = (username, matchId) => {
  const bets = getBets();
  return bets.find(bet => bet.username === username && bet.matchId === matchId);
};

// Get payout result for a specific match
const getResultByMatchId = (matchId) => {
  const results = getResults();
  return results.find(result => result.matchId === matchId);
};

// Place or update a bet
const placeBet = (matchId, username, team) => {
  const match = getMatchById(matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  if (!isBettingAllowed(match)) {
    throw new Error('Betting not allowed for this match');
  }

  if (team !== match.team1 && team !== match.team2) {
    throw new Error('Invalid team selection');
  }

  const bets = getBets();
  const existingBetIndex = bets.findIndex(bet => bet.username === username && bet.matchId === matchId);
  
  const newBet = {
    matchId,
    username,
    team,
    timestamp: new Date().toISOString(),
    isDefault: false
  };

  if (existingBetIndex >= 0) {
    // Update existing bet
    bets[existingBetIndex] = newBet;
  } else {
    // Add new bet
    bets.push(newBet);
  }

  saveBets(bets);
  return newBet;
};

// Remove a bet
const removeBet = (matchId, username) => {
  const match = getMatchById(matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  if (!isBettingAllowed(match)) {
    throw new Error('Cannot remove bet - betting not allowed for this match');
  }

  const bets = getBets();
  const filteredBets = bets.filter(bet => !(bet.username === username && bet.matchId === matchId));
  
  if (filteredBets.length === bets.length) {
    throw new Error('No bet found to remove');
  }

  saveBets(filteredBets);
  return true;
};

module.exports = {
  getUsers,
  getTeams,
  getMatches,
  getBets,
  getResults,
  saveUsers,
  saveTeams,
  saveMatches,
  saveBets,
  saveResults,
  getMatchById,
  getResultByMatchId,
  updateMatchStates,
  isBettingAllowed,
  assignDefaultBets,
  calculateAndSavePayouts,
  getUserBetForMatch,
  placeBet,
  removeBet
};
