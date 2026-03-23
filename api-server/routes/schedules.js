// routes/schedules.js — Schedule CRUD and customer assignment
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
// Base JOIN query used in schedule listing
// ============================================================
const SCHEDULE_SELECT = `
  SELECT s.ScheduleID, f.FerryID, f.FerryName, f.FerryCode, f.Capacity, f.FerryType,
         r.RouteID, r.RouteCode,
         po.PortName AS OriginPort, po.PortCode AS OriginCode,
         pd.PortName AS DestPort, pd.PortCode AS DestCode,
         r.DistanceKM, r.EstDurationMin,
         s.DepartureTime, s.ArrivalTime, s.Status, s.RemarkNotes,
         s.CreatedAt,
         (SELECT COUNT(*) FROM ScheduleCustomers sc
          WHERE sc.ScheduleID = s.ScheduleID AND sc.Status NOT IN ('cancelled')) AS AssignedCount
  FROM ((((Schedules s
    INNER JOIN Ferries f   ON s.FerryID = f.FerryID)
    INNER JOIN Routes r    ON s.RouteID = r.RouteID)
    INNER JOIN Ports po    ON r.OriginPortID = po.PortID)
    INNER JOIN Ports pd    ON r.DestPortID   = pd.PortID)
`;

// ============================================================
// GET /api/schedules — All schedules (all roles)
// Query params: status, search, sortBy, sortDir, page, limit
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, sortBy = 'DepartureTime', sortDir = 'ASC', page = 1, limit = 20 } = req.query;

    let where = [];
    if (status) where.push(`s.Status = ${escapeValue(status)}`);
    if (search) {
      where.push(`(f.FerryName LIKE ${escapeValue('%' + search + '%')}
        OR po.PortName LIKE ${escapeValue('%' + search + '%')}
        OR pd.PortName LIKE ${escapeValue('%' + search + '%')}
        OR r.RouteCode LIKE ${escapeValue('%' + search + '%')})`);
    }

    const allowedSorts = ['DepartureTime', 'ArrivalTime', 'FerryName', 'Status', 'AssignedCount'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'DepartureTime';
    const safeDir = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `${SCHEDULE_SELECT} ${whereClause} ORDER BY s.${safeSort} ${safeDir}`
    );

    // Client-side pagination (Access doesn't support LIMIT/OFFSET well)
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
    console.error('[Schedules GET]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/schedules/:id — Single schedule with assigned customers
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const schedules = await query(`${SCHEDULE_SELECT} WHERE s.ScheduleID = ${id}`);
    if (!schedules.length) {
      return res.status(404).json({ success: false, message: 'Schedule not found.' });
    }

    // Fetch assigned customers
    const customers = await query(`
      SELECT sc.AssignmentID, sc.SeatNumber, sc.TicketClass, sc.FareAmount, sc.Status AS BookingStatus,
             sc.AssignedAt, sc.RemovedAt, sc.RemovalReason,
             c.CustomerID, c.FirstName, c.LastName, c.Email, c.Phone, c.IDType, c.IDNumber,
             c.Nationality, c.Gender,
             u.FullName AS AssignedByName
      FROM (ScheduleCustomers sc
        INNER JOIN Customers c ON sc.CustomerID = c.CustomerID)
        LEFT JOIN Users u ON sc.AssignedByID = u.UserID
      WHERE sc.ScheduleID = ${id}
      ORDER BY sc.AssignedAt DESC
    `);

    return res.json({
      success: true,
      data: { ...schedules[0], customers }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// POST /api/schedules/:id/assign — Assign customer to schedule
// Roles: admin, register
// ============================================================
router.post('/:id/assign', authenticate, requireRole('admin', 'register'), async (req, res) => {
  const { id } = req.params;
  const { customerId, seatNumber, ticketClass = 'Economy', fareAmount } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'customerId is required.' });
  }

  try {
    // Check schedule exists and is not cancelled
    const sched = await query(`SELECT ScheduleID, Status FROM Schedules WHERE ScheduleID = ${id}`);
    if (!sched.length) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    if (['cancelled', 'arrived', 'departed'].includes(sched[0].Status)) {
      return res.status(409).json({ success: false, message: `Cannot assign to a ${sched[0].Status} schedule.` });
    }

    // Check customer exists
    const cust = await query(`SELECT CustomerID FROM Customers WHERE CustomerID = ${customerId} AND IsActive = Yes`);
    if (!cust.length) return res.status(404).json({ success: false, message: 'Customer not found.' });

    // Check not already assigned
    const existing = await query(
      `SELECT AssignmentID FROM ScheduleCustomers
       WHERE ScheduleID = ${id} AND CustomerID = ${customerId} AND Status NOT IN ('cancelled')`
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Customer is already assigned to this schedule.' });
    }

    // Check capacity
    const capacity = await query(
      `SELECT f.Capacity,
              (SELECT COUNT(*) FROM ScheduleCustomers sc WHERE sc.ScheduleID = ${id} AND sc.Status NOT IN ('cancelled')) AS BookedCount
       FROM Schedules s INNER JOIN Ferries f ON s.FerryID = f.FerryID
       WHERE s.ScheduleID = ${id}`
    );

    if (capacity[0].BookedCount >= capacity[0].Capacity) {
      return res.status(409).json({ success: false, message: 'Ferry is at full capacity.' });
    }

    await execute(`
      INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedAt, AssignedByID)
      VALUES (${id}, ${customerId}, ${escapeValue(seatNumber || '')}, ${escapeValue(ticketClass)},
              ${fareAmount || 'NULL'}, 'confirmed', Now(), ${req.user.userId})
    `);

    await auditLog(req.user.userId, req.user.username, 'INSERT', 'ScheduleCustomers', null,
      '', `Assigned customer ${customerId} to schedule ${id}`);

    return res.status(201).json({ success: true, message: 'Customer assigned successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DELETE /api/schedules/:id/customers/:assignmentId — Remove customer
// Role: admin only
// ============================================================
router.delete('/:id/customers/:assignmentId', authenticate, requireRole('admin'), async (req, res) => {
  const { id, assignmentId } = req.params;
  const { reason } = req.body;

  try {
    const rows = await query(
      `SELECT sc.AssignmentID, sc.CustomerID, sc.Status
       FROM ScheduleCustomers sc
       WHERE sc.AssignmentID = ${assignmentId} AND sc.ScheduleID = ${id}`
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    if (rows[0].Status === 'cancelled') {
      return res.status(409).json({ success: false, message: 'Assignment already cancelled.' });
    }

    await execute(`
      UPDATE ScheduleCustomers
      SET Status = 'cancelled', RemovedAt = Now(), RemovedByID = ${req.user.userId},
          RemovalReason = ${escapeValue(reason || 'Removed by admin')}
      WHERE AssignmentID = ${assignmentId}
    `);

    await auditLog(req.user.userId, req.user.username, 'DELETE', 'ScheduleCustomers', assignmentId,
      `Status=confirmed, Customer=${rows[0].CustomerID}`, `Status=cancelled, Reason=${reason || 'N/A'}`);

    return res.json({ success: true, message: 'Customer removed from schedule.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GET /api/schedules/meta/options — Ferry and route options for filters
// ============================================================
router.get('/meta/options', authenticate, async (req, res) => {
  try {
    const [ferries, routes, statuses] = await Promise.all([
      query(`SELECT FerryID, FerryName, FerryCode FROM Ferries WHERE IsActive = Yes ORDER BY FerryName`),
      query(`SELECT r.RouteID, r.RouteCode, po.PortName AS Origin, pd.PortName AS Dest
             FROM Routes r
             INNER JOIN Ports po ON r.OriginPortID = po.PortID
             INNER JOIN Ports pd ON r.DestPortID = pd.PortID
             WHERE r.IsActive = Yes`),
      Promise.resolve(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })))
    ]);
    return res.json({ success: true, data: { ferries, routes, statuses } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
// ============================================================
// PATCH /api/schedules/:id/status — Update schedule status (admin only)
// ============================================================
router.patch('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  try {
    const rows = await query(`SELECT ScheduleID, Status FROM Schedules WHERE ScheduleID = ${id}`);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    const oldStatus = rows[0].Status;

    // If cancelling, also cancel all active bookings
    if (status === 'cancelled') {
      await execute(`
        UPDATE ScheduleCustomers
        SET Status = 'cancelled', RemovedAt = Now(), RemovedByID = ${req.user.userId},
            RemovalReason = 'Schedule cancelled'
        WHERE ScheduleID = ${id} AND Status NOT IN ('cancelled', 'boarded')
      `);
    }

    await execute(`
      UPDATE Schedules SET Status = ${escapeValue(status)}, UpdatedAt = Now()
      WHERE ScheduleID = ${id}
    `);

    await auditLog(req.user.userId, req.user.username, 'UPDATE', 'Schedules', id,
      `Status=${oldStatus}`, `Status=${status}`);

    return res.json({ success: true, message: `Schedule status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;