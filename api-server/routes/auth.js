// routes/auth.js — Login, logout, profile
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { query, execute, escapeValue } = require('../db/connection');
const { authenticate, generateToken } = require('../middleware/auth');

// Helper: write audit log entry
async function auditLog(userId, username, action, tableName, recordId, oldVals, newVals) {
  try {
    await execute(
      `INSERT INTO AuditLog (UserID, Username, Action, TableName, RecordID, OldValues, NewValues, IPAddress, ActionAt)
       VALUES (${userId || 'NULL'}, ${escapeValue(username)}, ${escapeValue(action)},
               ${escapeValue(tableName)}, ${recordId || 'NULL'},
               ${escapeValue(oldVals || '')}, ${escapeValue(newVals || '')},
               'api', Now())`
    );
  } catch (_) { /* Audit failures should not block main flow */ }
}

// ============================================================
// POST /api/auth/login
// Body: { username, password }
// ============================================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const rows = await query(
      `SELECT UserID, Username, PasswordHash, FullName, Email, Role, IsActive
       FROM Users
       WHERE Username = ${escapeValue(username)}`
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];

    if (!user.IsActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact an administrator.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update last login
    await execute(`UPDATE Users SET LastLogin = Now() WHERE UserID = ${user.UserID}`);

    const token = generateToken(user);

    await auditLog(user.UserID, user.Username, 'LOGIN', 'Users', user.UserID, '', 'Successful login');

    return res.json({
      success: true,
      token,
      user: {
        userId:   user.UserID,
        username: user.Username,
        fullName: user.FullName,
        email:    user.Email,
        role:     user.Role
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ============================================================
// GET /api/auth/me — Return current user from token
// ============================================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const rows = await query(
      `SELECT UserID, Username, FullName, Email, Role, LastLogin
       FROM Users WHERE UserID = ${req.user.userId}`
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// POST /api/auth/logout — Client-side token invalidation (audit log only)
// ============================================================
router.post('/logout', authenticate, async (req, res) => {
  await auditLog(req.user.userId, req.user.username, 'LOGOUT', 'Users', req.user.userId, '', 'User logged out');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ============================================================
// GET /api/auth/users — Admin only: list all users
// ============================================================
router.get('/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  try {
    const rows = await query(
      `SELECT UserID, Username, FullName, Email, Role, IsActive, CreatedAt, LastLogin
       FROM Users ORDER BY CreatedAt DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// POST /api/auth/users — Admin only: create user
// ============================================================
router.post('/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const { username, password, fullName, email, role } = req.body;
  if (!username || !password || !fullName || !role) {
    return res.status(400).json({ success: false, message: 'username, password, fullName, and role are required.' });
  }
  if (!['admin', 'register', 'client'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role. Must be admin, register, or client.' });
  }

  try {
    // Check uniqueness
    const existing = await query(`SELECT UserID FROM Users WHERE Username = ${escapeValue(username)}`);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    await execute(
      `INSERT INTO Users (Username, PasswordHash, FullName, Email, Role, IsActive, CreatedAt)
       VALUES (${escapeValue(username)}, ${escapeValue(hash)}, ${escapeValue(fullName)},
               ${escapeValue(email || '')}, ${escapeValue(role)}, Yes, Now())`
    );

    await auditLog(req.user.userId, req.user.username, 'INSERT', 'Users', null, '', `Created user: ${username}`);
    return res.status(201).json({ success: true, message: 'User created successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error creating user.' });
  }
});

// ============================================================
// PATCH /api/auth/users/:id/toggle — Admin only: activate/deactivate
// ============================================================
router.patch('/users/:id/toggle', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  const { id } = req.params;
  try {
    const rows = await query(`SELECT IsActive, Username FROM Users WHERE UserID = ${id}`);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = rows[0].IsActive ? 'No' : 'Yes';
    await execute(`UPDATE Users SET IsActive = ${newStatus} WHERE UserID = ${id}`);
    await auditLog(req.user.userId, req.user.username, 'UPDATE', 'Users', id,
      `IsActive=${rows[0].IsActive}`, `IsActive=${newStatus}`);

    return res.json({ success: true, message: `User ${newStatus === 'Yes' ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;