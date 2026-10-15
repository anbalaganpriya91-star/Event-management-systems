/**
 * controllers/eventController.js
 */
const pool = require('../config/db');
const { ok, fail } = require('../utils/helpers');

const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

// GET /api/events?search=&status=
async function list(req, res, next) {
    try {
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();

        let sql = `SELECT e.*, v.name AS venue_name, v.location AS venue_location
                   FROM events e JOIN venues v ON e.venue_id = v.id WHERE 1=1`;
        const params = [];
        if (search) {
            sql += ' AND (e.name LIKE ? OR e.category LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            sql += ' AND e.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY e.event_date DESC';

        const [rows] = await pool.query(sql, params);
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/events/upcoming
async function upcoming(req, res, next) {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, event_date, ticket_price, total_seats FROM events WHERE status='upcoming' ORDER BY event_date"
        );
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/events/:id
async function getOne(req, res, next) {
    try {
        const [rows] = await pool.query(
            'SELECT e.*, v.name AS venue_name FROM events e JOIN venues v ON e.venue_id = v.id WHERE e.id = ?',
            [req.params.id]
        );
        if (!rows.length) return fail(res, 'Event not found.', 404);
        return ok(res, rows[0]);
    } catch (err) {
        next(err);
    }
}

// POST /api/events
async function create(req, res, next) {
    try {
        const {
            name, description, category, venue_id, event_date,
            start_time, end_time, organizer_name, ticket_price, total_seats, status,
        } = req.body;
        const safeStatus = STATUSES.includes(status) ? status : 'upcoming';

        if (!name || !venue_id || !event_date || !start_time || !end_time) {
            return fail(res, 'Name, venue, date and time are required.');
        }

        const [result] = await pool.query(
            `INSERT INTO events (name, description, category, venue_id, event_date, start_time, end_time,
                organizer_name, ticket_price, total_seats, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description || '', category || '', venue_id, event_date, start_time, end_time,
                organizer_name || '', ticket_price || 0, total_seats || 0, safeStatus, req.session.userId]
        );

        return ok(res, { id: result.insertId }, 'Event created successfully.');
    } catch (err) {
        next(err);
    }
}

// PUT /api/events/:id
async function update(req, res, next) {
    try {
        const {
            name, description, category, venue_id, event_date,
            start_time, end_time, organizer_name, ticket_price, total_seats, status,
        } = req.body;
        const safeStatus = STATUSES.includes(status) ? status : 'upcoming';

        await pool.query(
            `UPDATE events SET name=?, description=?, category=?, venue_id=?, event_date=?, start_time=?, end_time=?,
                organizer_name=?, ticket_price=?, total_seats=?, status=? WHERE id=?`,
            [name, description || '', category || '', venue_id, event_date, start_time, end_time,
                organizer_name || '', ticket_price || 0, total_seats || 0, safeStatus, req.params.id]
        );

        return ok(res, null, 'Event updated successfully.');
    } catch (err) {
        next(err);
    }
}

// DELETE /api/events/:id
async function remove(req, res, next) {
    try {
        await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
        return ok(res, null, 'Event deleted successfully.');
    } catch (err) {
        next(err);
    }
}

module.exports = { list, upcoming, getOne, create, update, remove };
