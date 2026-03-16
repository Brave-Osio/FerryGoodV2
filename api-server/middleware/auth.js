// middleware/auth.js — JWT authentication and role authorization
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ferry-good-secret';

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, username, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

/**
 * Middleware factory: Require one of the specified roles.
 * @param {...string} roles - Allowed roles ('admin', 'register', 'client')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}.`
      });
    }
    next();
  };
}

/**
 * Generate a JWT token for the given user.
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId:   user.UserID,
      username: user.Username,
      fullName: user.FullName,
      email:    user.Email,
      role:     user.Role
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

module.exports = { authenticate, requireRole, generateToken };