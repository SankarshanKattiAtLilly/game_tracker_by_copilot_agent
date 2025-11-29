const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { saveUsers, saveTeams, saveMatches, assignDefaultBets, getMatches } = require('./data');

class CSVSync {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.csvDir = path.join(this.dataDir, 'csv');
    this.csvFiles = {
      users: path.join(this.csvDir, 'users.csv'),
      teams: path.join(this.csvDir, 'teams.csv'),
      matches: path.join(this.csvDir, 'matches.csv')
    };
  }

  // Read CSV file and return parsed data
  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      if (!fs.existsSync(filePath)) {
        console.log(`CSV file not found: ${filePath}`);
        resolve([]);
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  // Parse users from CSV
  async syncUsers() {
    try {
      const userData = await this.readCSV(this.csvFiles.users);
      const users = userData.map(row => ({
        username: row.username,
        password: row.password
      }));
      
      await saveUsers(users);
      console.log(`✅ Synced ${users.length} users from CSV`);
      return users;
    } catch (error) {
      console.error('❌ Error syncing users from CSV:', error);
      return null;
    }
  }

  // Parse teams from CSV
  async syncTeams() {
    try {
      const teamData = await this.readCSV(this.csvFiles.teams);
      const teams = teamData.map(row => ({
        name: row.name
      }));
      
      await saveTeams(teams);
      console.log(`✅ Synced ${teams.length} teams from CSV`);
      return teams;
    } catch (error) {
      console.error('❌ Error syncing teams from CSV:', error);
      return null;
    }
  }

  // Parse matches from CSV and check for state changes
  async syncMatches() {
    try {
      const matchData = await this.readCSV(this.csvFiles.matches);
      const currentMatches = await getMatches();
      
      const newMatches = matchData.map(row => {
        const existing = currentMatches.find(m => m.id === row.id) || {};
        return {
          id: row.id,
          contestId: row.contestId || existing.contestId || null,
          team1: row.team1,
          team2: row.team2,
          startTime: row.startTime,
          endTime: row.endTime,
          state: row.state || existing.state || 'planned',
          weight: parseInt(row.weight) || existing.weight || 1,
          winnerTeam: row.winnerTeam || existing.winnerTeam || null,
          draw: (row.draw !== undefined ? row.draw === 'true' : !!existing.draw)
        };
      });

      // Check for newly ended matches to trigger default bets
      const newlyEndedMatches = [];
      for (const newMatch of newMatches) {
        const currentMatch = currentMatches.find(m => m.id === newMatch.id);
        if (currentMatch && currentMatch.state !== 'ended' && newMatch.state === 'ended') {
          newlyEndedMatches.push(newMatch);
        }
      }

      await saveMatches(newMatches);
      console.log(`✅ Synced ${newMatches.length} matches from CSV`);

      // Trigger default bet assignment for newly ended matches
      for (const match of newlyEndedMatches) {
        console.log(`🏆 Match ${match.id} ended - assigning default bets`);
        await assignDefaultBets(match.id);
      }

      return newMatches;
    } catch (error) {
      console.error('❌ Error syncing matches from CSV:', error);
      return null;
    }
  }

  // Sync all data from CSV files
  async syncFromCSV() {
    console.log('📁 Starting sync from CSV files...');
    
    try {
      const users = await this.syncUsers();
      const teams = await this.syncTeams();
      const matches = await this.syncMatches();

      if (users && teams && matches) {
        console.log('✅ CSV sync completed successfully');
        return true;
      } else {
        console.log('⚠️ CSV sync completed with some errors');
        return false;
      }
    } catch (error) {
      console.error('❌ Error during CSV sync:', error);
      return false;
    }
  }

  // Write current JSON data to CSV files (for backup/export)
  async exportToCSV() {
    try {
      const { getUsers, getTeams, getMatches } = require('./data');
      
      // Ensure CSV directory exists
      if (!fs.existsSync(this.csvDir)) {
        fs.mkdirSync(this.csvDir, { recursive: true });
      }
      
      // Export users
      const users = await getUsers();
      const usersCsv = 'username,password\n' + 
        users.map(u => `${u.username},${u.password}`).join('\n');
      fs.writeFileSync(this.csvFiles.users, usersCsv);

      // Export teams
      const teams = await getTeams();
      const teamsCsv = 'name\n' + 
        teams.map(t => t.name).join('\n');
      fs.writeFileSync(this.csvFiles.teams, teamsCsv);

      // Export matches
      const matches = await getMatches();
      const matchesCsv = 'id,contestId,team1,team2,startTime,endTime,state,weight,winnerTeam,draw\n' +
        matches.map(m => `${m.id},${m.contestId || ''},${m.team1},${m.team2},${m.startTime},${m.endTime},${m.state},${m.weight},${m.winnerTeam || ''},${m.draw}`).join('\n');
      fs.writeFileSync(this.csvFiles.matches, matchesCsv);

      console.log('📤 Data exported to CSV files successfully');
      return true;
    } catch (error) {
      console.error('❌ Error exporting to CSV:', error);
      return false;
    }
  }

  // Start periodic sync (every 5 minutes)
  startPeriodicSync() {
    const syncInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Initial sync
    this.syncFromCSV();

    // Set up interval
    setInterval(async () => {
      await this.syncFromCSV();
    }, syncInterval);

    console.log('⏰ Started periodic CSV sync (every 5 minutes)');
  }

  // Watch for file changes and sync immediately
  startFileWatcher() {
    Object.values(this.csvFiles).forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.watchFile(filePath, { interval: 1000 }, () => {
          console.log(`📝 CSV file changed: ${path.basename(filePath)} - syncing...`);
          this.syncFromCSV();
        });
      }
    });
    console.log('👁️ Started CSV file watcher');
  }

  // Get file modification times for debugging
  getFileStats() {
    const stats = {};
    Object.entries(this.csvFiles).forEach(([name, filePath]) => {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        stats[name] = {
          path: filePath,
          modified: stat.mtime,
          size: stat.size
        };
      } else {
        stats[name] = { path: filePath, exists: false };
      }
    });
    return stats;
  }
}

module.exports = CSVSync;
