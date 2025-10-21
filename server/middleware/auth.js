const jwt = require('jsonwebtoken');

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
    req.user = user;
    next();
  });
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
  authenticateSession
};
