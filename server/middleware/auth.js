const jwt = require('jsonwebtoken');
const { getUsers } = require('../utils/data');

// JWT-based authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Attach role if available from users.json
    try {
      const users = getUsers();
      const found = users.find(u => u.username === user.username);
      const role = (found && found.role) ? found.role : undefined;
      req.user = { ...user, role };
    } catch (_) {
      req.user = user;
    }
    next();
  });
};

// Admin guard: either role=admin on user, or username in ADMIN_USERS env list
const requireAdmin = (req, res, next) => {
  const adminList = (process.env.ADMIN_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAdmin = req.user && (req.user.role === 'admin' || adminList.includes(req.user.username));
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Session-based authentication middleware (alternative)
const authenticateSession = (req, res, next) => {
  if (!req.session || !req.session.username) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { username: req.session.username };
  next();
};

module.exports = {
  authenticateToken,
  authenticateSession,
  requireAdmin
};
