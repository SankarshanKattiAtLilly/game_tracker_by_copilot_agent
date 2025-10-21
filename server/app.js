const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const betsRoutes = require('./routes/bets');
const CSVSync = require('./utils/csvSync');
const { updateMatchStates } = require('./utils/data');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'], // Vite default port
  credentials: true
}));

app.use(express.json());

// Session middleware (for session-based auth backup)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/matches', matchesRoutes);
app.use('/matches', betsRoutes); // Mount bets routes under /matches for RESTful structure
app.use('/bets', betsRoutes); // Also mount under /bets for compatibility

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize background processes
const initializeBackgroundProcesses = () => {
  // Update match states every minute
  setInterval(() => {
    updateMatchStates();
  }, 60 * 1000); // 1 minute

  // Initialize CSV sync
  const csvSync = new CSVSync();
  csvSync.startPeriodicSync();
  csvSync.startFileWatcher();
};

module.exports = { app, initializeBackgroundProcesses };
