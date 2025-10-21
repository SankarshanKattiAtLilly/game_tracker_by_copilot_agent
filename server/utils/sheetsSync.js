const { google } = require('googleapis');
const { getUsers, getTeams, getMatches, saveMatches, assignDefaultBets } = require('./data');

class GoogleSheetsSync {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  }

  // Initialize Google Sheets API
  async initialize() {
    try {
      this.sheets = google.sheets({
        version: 'v4',
        auth: this.apiKey
      });
      console.log('Google Sheets API initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets API:', error);
      return false;
    }
  }

  // Sync data from Google Sheets (overwrites local JSON)
  async syncFromSheets() {
    if (!this.sheets || !this.spreadsheetId) {
      console.log('Google Sheets sync not configured - skipping');
      return false;
    }

    try {
      console.log('Starting sync from Google Sheets...');
      
      // For now, this is a stub implementation
      // In a real implementation, you would:
      // 1. Read data from Google Sheets tabs (users, teams, matches)
      // 2. Overwrite local JSON files
      // 3. Check for newly ended matches and trigger default bet assignment
      
      console.log('Google Sheets sync completed (stub implementation)');
      return true;
    } catch (error) {
      console.error('Error syncing from Google Sheets:', error);
      return false;
    }
  }

  // Example method to read matches from Google Sheets
  async readMatchesFromSheet() {
    if (!this.sheets || !this.spreadsheetId) {
      return null;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'matches!A:H', // Assuming matches data is in columns A-H
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No matches data found in sheet');
        return [];
      }

      // Skip header row and convert to match objects
      const matches = rows.slice(1).map((row, index) => ({
        id: row[0] || `m${index + 1}`,
        team1: row[1],
        team2: row[2],
        startTime: row[3],
        endTime: row[4],
        state: row[5] || 'planned',
        weight: parseInt(row[6]) || 1,
        winnerTeam: row[7] || null,
        draw: row[8] === 'true' || false
      }));

      return matches;
    } catch (error) {
      console.error('Error reading matches from sheet:', error);
      return null;
    }
  }

  // Start periodic sync (every 5 minutes)
  startPeriodicSync() {
    const syncInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Initial sync
    this.initialize().then(() => {
      this.syncFromSheets();
    });

    // Set up interval
    setInterval(async () => {
      await this.syncFromSheets();
    }, syncInterval);

    console.log('Started periodic Google Sheets sync (every 5 minutes)');
  }
}

module.exports = GoogleSheetsSync;
