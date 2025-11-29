/**
 * Payout Calculation Utilities for Match Betting App
 * 
 * Business Rules:
 * - L = number of users who bet on losing team
 * - W = number of users who bet on winning team  
 * - weight = weight of match
 * - Total Pool = L × weight
 * - Reward per winner = Total Pool ÷ W
 * - Each winner gets rewardPerWinner
 * - Losers get 0
 * - If W = 0 → no rewards distributed
 * - If draw → no rewards
 */

/**
 * Calculate final payouts for a completed match
 * @param {Array} bets - Array of bet objects [{ username, team, isDefault }]
 * @param {string} winnerTeam - Name of the winning team
 * @param {number} weight - Weight of the match
 * @param {boolean} isDraw - Whether the match ended in a draw
 * @returns {Object} Payout calculation results
 */
function calculatePayouts(bets, winnerTeam, weight, isDraw = false) {
  if (isDraw) {
    return {
      totalPool: 0,
      rewardPerWinner: 0,
      winners: [],
      losers: bets.map(bet => bet.username),
      payouts: bets.map(bet => ({
        username: bet.username,
        team: bet.team,
        reward: 0,
        isWinner: false,
        isDefault: bet.isDefault || false
      })),
      summary: {
        totalBets: bets.length,
        winningBets: 0,
        losingBets: bets.length,
        message: "Match ended in draw - no rewards distributed"
      }
    };
  }

  const winners = bets.filter(b => b.team === winnerTeam).map(b => b.username);
  const losers = bets.filter(b => b.team !== winnerTeam).map(b => b.username);

  const W = winners.length;
  const L = losers.length;

  const totalPool = L * weight;
  const rewardPerWinner = W > 0 ? totalPool / W : 0;

  return {
    totalPool,
    rewardPerWinner,
    winners,
    losers,
    payouts: bets.map(bet => ({
      username: bet.username,
      team: bet.team,
      // If W = 0 (no winners), no rewards and no penalties
      reward: W === 0 ? 0 : (bet.team === winnerTeam ? rewardPerWinner : -weight),
      isWinner: bet.team === winnerTeam,
      isDefault: bet.isDefault || false
    })),
    summary: {
      totalBets: bets.length,
      winningBets: W,
      losingBets: L,
      message:
        W === 0
          ? "No winners - no rewards distributed"
          : `${W} winner(s) share ${totalPool} points (${rewardPerWinner} each)`
    }
  };
}


/**
 * Calculate potential payouts for each team scenario during a live match
 * @param {Array} bets - Array of bet objects [{ username, team, isDefault }]
 * @param {number} weight - Weight of the match
 * @param {Array} teams - Array of team names [team1, team2]
 * @returns {Object} Potential payout scenarios for each team
 */
function calculatePotentialPayouts(bets, weight, teams) {
  const scenarios = {};

  teams.forEach(team => {
    const potentialWinners = bets.filter(bet => bet.team === team);
    const potentialLosers = bets.filter(bet => bet.team !== team);

    const W = potentialWinners.length;
    const L = potentialLosers.length;

    const totalPool = L * weight;
    const rewardPerWinner = W > 0 ? totalPool / W : 0;

    scenarios[team] = {
      totalPool,
      rewardPerWinner,
      winnersCount: W,
      losersCount: L,
      payouts: bets.map(bet => ({
        username: bet.username,
        team: bet.team,
        potentialReward: W === 0 ? 0 : (bet.team === team ? rewardPerWinner : -weight),
        wouldWin: bet.team === team,
        isDefault: bet.isDefault || false
      })),
      summary: {
        message: W === 0 
          ? `If ${team} wins: No winners on ${team} - no rewards/penalties`
          : `If ${team} wins: ${W} winner(s) share ${totalPool} points (${rewardPerWinner.toFixed(1)} each)`
      }
    };
  });

  return scenarios;
}

/**
 * Get user-specific payout information
 * @param {Object} payoutData - Result from calculatePayouts or calculatePotentialPayouts
 * @param {string} username - Username to filter for
 * @returns {Object} User-specific payout info
 */
function getUserPayout(payoutData, username) {
  if (payoutData.payouts) {
    // Final payout data
    const userPayout = payoutData.payouts.find(p => p.username === username);
    return userPayout || null;
  } else {
    // Potential payout data (scenarios)
    const userScenarios = {};
    Object.keys(payoutData).forEach(team => {
      const userPayout = payoutData[team].payouts.find(p => p.username === username);
      if (userPayout) {
        userScenarios[team] = userPayout;
      }
    });
    return userScenarios;
  }
}

/**
 * Format payout amount for display
 * @param {number} amount - Payout amount
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted amount string
 */
function formatPayoutAmount(amount, decimals = 1) {
  if (amount === 0) return "0";
  return amount % 1 === 0 ? amount.toString() : amount.toFixed(decimals);
}

/**
 * Validate payout calculation inputs
 * @param {Array} bets - Bets array
 * @param {string} winnerTeam - Winner team name
 * @param {number} weight - Match weight
 * @returns {Object} Validation result
 */
function validatePayoutInputs(bets, winnerTeam, weight) {
  const errors = [];

  if (!Array.isArray(bets)) {
    errors.push("Bets must be an array");
  } else if (bets.length === 0) {
    errors.push("No bets provided");
  }

  if (typeof winnerTeam !== 'string' || winnerTeam.trim() === '') {
    errors.push("Winner team must be a non-empty string");
  }

  if (typeof weight !== 'number' || weight <= 0) {
    errors.push("Weight must be a positive number");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  calculatePayouts,
  calculatePotentialPayouts,
  getUserPayout,
  formatPayoutAmount,
  validatePayoutInputs
};
