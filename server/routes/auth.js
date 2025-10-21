const express = require('express');
const jwt = require('jsonwebtoken');
const { getUsers } = require('../utils/data');

const router = express.Router();

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Get users from JSON file
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Also set session for session-based auth (backup)
  req.session.username = user.username;

  res.json({
    message: 'Login successful',
    token,
    user: { username: user.username }
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  // Clear session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });
  }

  res.json({ message: 'Logout successful' });
});

// GET /auth/me - Get current user info
router.get('/me', (req, res) => {
  // Check JWT token first
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        return res.json({ user: { username: user.username } });
      }
    });
  }

  // Fallback to session
  if (req.session && req.session.username) {
    return res.json({ user: { username: req.session.username } });
  }

  res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;
