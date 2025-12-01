const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const betsRoutes = require('./routes/bets');
const contestsRoutes = require('./routes/contests');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const debugRoutes = require('./routes/debug');
const CSVSync = require('./utils/csvSync');
const { updateMatchStates } = require('./utils/data');

const app = express();

// Middleware
// Disable ETag to avoid 304 with empty cached bodies in dev
app.disable('etag');
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
app.use('/contests', contestsRoutes);
app.use('/matches', matchesRoutes);
app.use('/matches', betsRoutes); // Mount bets routes under /matches for RESTful structure
app.use('/bets', betsRoutes); // Also mount under /bets for compatibility
app.use('/users', usersRoutes);
app.use('/admin/manage', adminRoutes);
// Master stats under /admin
try {
  const { adminRouter } = require('./routes/users');
  app.use('/admin', adminRouter);
} catch (e) {
  console.warn('Admin router not available', e.message);
}
app.use('/debug', debugRoutes);

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

  // Initialize CSV sync (optional)
  if (process.env.ENABLE_CSV_SYNC === 'true') {
    const csvSync = new CSVSync();
    csvSync.startPeriodicSync();
    csvSync.startFileWatcher();
  } else {
    console.log('📄 CSV sync disabled (set ENABLE_CSV_SYNC=true to enable)');
  }
};

module.exports = { app, initializeBackgroundProcesses };
