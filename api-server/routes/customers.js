// routes/customers.js — Customer CRUD and history
const express = require('express');
const router = express.Router();

const { query, execute, getLastInsertId, escapeValue } = require('../db/connection');
const { authenticate, requireRole } = require('../middleware/auth');

async function auditLog(userId, username, action, tableName, recordId, oldVals, newVals) {
  try {
    await execute(
      `INSERT INTO AuditLog (UserID, Username, Action, TableName, RecordID, OldValues, NewValues, IPAddress, ActionAt)
       VALUES (${userId || 'NULL'}, ${escapeValue(username)}, ${escapeValue(action)},
               ${escapeValue(tableName)}, ${recordId || 'NULL'},
               ${escapeValue(oldVals || '')}, ${escapeValue(newVals || '')}, 'api', Now())`
    );
  } catch (_) {}
}

// ============================================================
// GET /api/customers — Customer list (admin + register)
// Query: search, page, limit, sortBy, sortDir
// ============================================================
router.get('/', authenticate, requireRole('admin', 'register'), async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'CreatedAt', sortDir = 'DESC' } = req.query;

    let where = ['c.IsActive = Yes'];
    if (search) {
      where.push(`(c.FirstName LIKE ${escapeValue('%' + search + '%')}
        OR c.LastName LIKE ${escapeValue('%' + search + '%')}
        OR c.Email LIKE ${escapeValue('%' + search + '%')}
        OR c.Phone LIKE ${escapeValue('%' + search + '%')}
        OR c.IDNumber LIKE ${escapeValue('%' + search + '%')})`);
    }

    const allowedSorts = ['LastName', 'FirstName', 'Email', 'CreatedAt'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'CreatedAt';
    const safeDir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const rows = await query(`
      SELECT c.CustomerID, c.FirstName, c.LastName, c.Email, c.Phone,
             c.IDType, c.IDNumber, c.Nationality, c.Gender, c.BirthDate,
             c.IsActive, c.CreatedAt,
             u.FullName AS CreatedByName,
             (SELECT COUNT(*) FROM ScheduleCustomers sc
              WHERE sc.CustomerID = c.CustomerID AND sc.Status NOT IN ('cancelled')) AS ActiveBookings
      FROM Customers c LEFT JOIN Users u ON c.CreatedByID = u.UserID
      WHERE ${where.join(' AND ')}
      ORDER BY c.${safeSort} ${safeDir}
    `);

    const total = rows.length;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const paginated = rows.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    return res.json({
      success: true,
      data: paginated,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/customers/:id — Single customer detail
// ============================================================
router.get('/:id', authenticate, requireRole('admin', 'register'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`
      SELECT c.*, u.FullName AS CreatedByName
      FROM Customers c LEFT JOIN Users u ON c.CreatedByID = u.UserID
      WHERE c.CustomerID = ${id}
    `);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Customer not found.' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// POST /api/customers — Create customer (admin + register)
// ============================================================
router.post('/', authenticate, requireRole('admin', 'register'), async (req, res) => {
  const { firstName, lastName, email, phone, idType, idNumber, nationality = 'Filipino', gender, birthDate, address } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'firstName and lastName are required.' });
  }

  try {
    // Check duplicate by IDNumber if provided
    if (idNumber) {
      const dup = await query(`SELECT CustomerID FROM Customers WHERE IDNumber = ${escapeValue(idNumber)}`);
      if (dup.length) {
        return res.status(409).json({ success: false, message: 'A customer with this ID number already exists.' });
      }
    }

    const birthDateVal = birthDate ? `#${new Date(birthDate).toISOString().split('T')[0]}#` : 'NULL';

    await execute(`
      INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, BirthDate, Address, IsActive, CreatedByID, CreatedAt, UpdatedAt)
      VALUES (${escapeValue(firstName)}, ${escapeValue(lastName)}, ${escapeValue(email || '')},
              ${escapeValue(phone || '')}, ${escapeValue(idType || '')}, ${escapeValue(idNumber || '')},
              ${escapeValue(nationality)}, ${escapeValue(gender || '')},
              ${birthDateVal}, ${escapeValue(address || '')}, Yes, ${req.user.userId}, Now(), Now())
    `);

    const newId = await getLastInsertId();
    await auditLog(req.user.userId, req.user.username, 'INSERT', 'Customers', newId,
      '', `Created: ${firstName} ${lastName}`);

    return res.status(201).json({ success: true, message: 'Customer created successfully.', customerId: newId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// PUT /api/customers/:id — Update customer (admin + register)
// ============================================================
router.put('/:id', authenticate, requireRole('admin', 'register'), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, idType, idNumber, nationality, gender, birthDate, address } = req.body;

  try {
    const existing = await query(`SELECT * FROM Customers WHERE CustomerID = ${id}`);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const old = existing[0];
    const birthDateVal = birthDate ? `#${new Date(birthDate).toISOString().split('T')[0]}#` : 'NULL';

    await execute(`
      UPDATE Customers SET
        FirstName = ${escapeValue(firstName || old.FirstName)},
        LastName  = ${escapeValue(lastName  || old.LastName)},
        Email     = ${escapeValue(email     ?? old.Email)},
        Phone     = ${escapeValue(phone     ?? old.Phone)},
        IDType    = ${escapeValue(idType    ?? old.IDType)},
        IDNumber  = ${escapeValue(idNumber  ?? old.IDNumber)},
        Nationality = ${escapeValue(nationality ?? old.Nationality)},
        Gender    = ${escapeValue(gender    ?? old.Gender)},
        BirthDate = ${birthDate ? birthDateVal : 'NULL'},
        Address   = ${escapeValue(address   ?? old.Address)},
        UpdatedAt = Now()
      WHERE CustomerID = ${id}
    `);

    await auditLog(req.user.userId, req.user.username, 'UPDATE', 'Customers', id,
      `${old.FirstName} ${old.LastName}`, `${firstName || old.FirstName} ${lastName || old.LastName}`);

    return res.json({ success: true, message: 'Customer updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DELETE /api/customers/:id — Soft delete (admin only)
// Marks as inactive, does not physically remove
// ============================================================
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`SELECT CustomerID, FirstName, LastName FROM Customers WHERE CustomerID = ${id}`);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Customer not found.' });

    // Cancel all future schedule assignments
    await execute(`
      UPDATE ScheduleCustomers SET Status = 'cancelled', RemovedAt = Now(), RemovedByID = ${req.user.userId},
        RemovalReason = 'Customer deleted'
      WHERE CustomerID = ${id} AND Status NOT IN ('cancelled', 'boarded')
    `);

    // Soft delete
    await execute(`UPDATE Customers SET IsActive = No, UpdatedAt = Now() WHERE CustomerID = ${id}`);

    await auditLog(req.user.userId, req.user.username, 'DELETE', 'Customers', id,
      `${rows[0].FirstName} ${rows[0].LastName}`, 'IsActive=No');

    return res.json({ success: true, message: 'Customer deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/customers/history — Full customer-schedule history (admin + register)
// ============================================================
router.get('/history/all', authenticate, requireRole('admin', 'register'), async (req, res) => {
  try {
    const { search, scheduleStatus, page = 1, limit = 25, sortBy = 'AssignedAt', sortDir = 'DESC' } = req.query;

    let where = [];
    if (search) {
      where.push(`(c.FirstName LIKE ${escapeValue('%' + search + '%')}
        OR c.LastName LIKE ${escapeValue('%' + search + '%')}
        OR c.Email LIKE ${escapeValue('%' + search + '%')}
        OR f.FerryName LIKE ${escapeValue('%' + search + '%')}
        OR po.PortName LIKE ${escapeValue('%' + search + '%')})`);
    }
    if (scheduleStatus) {
      where.push(`s.Status = ${escapeValue(scheduleStatus)}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(`
      SELECT sc.AssignmentID, sc.SeatNumber, sc.TicketClass, sc.FareAmount,
             sc.Status AS BookingStatus, sc.AssignedAt, sc.RemovedAt, sc.RemovalReason,
             c.CustomerID, c.FirstName & ' ' & c.LastName AS FullName,
             c.Email, c.Phone, c.IDType, c.IDNumber,
             s.ScheduleID, s.DepartureTime, s.ArrivalTime, s.Status AS ScheduleStatus,
             f.FerryName, f.FerryCode,
             po.PortName AS OriginPort, pd.PortName AS DestPort, r.RouteCode,
             ua.FullName AS AssignedByName
      FROM ((((((ScheduleCustomers sc
        INNER JOIN Customers c  ON sc.CustomerID = c.CustomerID)
        INNER JOIN Schedules s  ON sc.ScheduleID = s.ScheduleID)
        INNER JOIN Ferries f    ON s.FerryID = f.FerryID)
        INNER JOIN Routes r     ON s.RouteID = r.RouteID)
        INNER JOIN Ports po     ON r.OriginPortID = po.PortID)
        INNER JOIN Ports pd     ON r.DestPortID = pd.PortID)
        LEFT JOIN Users ua      ON sc.AssignedByID = ua.UserID
      ${whereClause}
      ORDER BY sc.${sortBy === 'AssignedAt' ? 'AssignedAt' : 'AssignedAt'} DESC
    `);

    const total = rows.length;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const paginated = rows.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    return res.json({
      success: true,
      data: paginated,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;