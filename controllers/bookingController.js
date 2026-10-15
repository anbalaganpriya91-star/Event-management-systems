/**
 * controllers/bookingController.js
 */
const pool = require('../config/db');
const { ok, fail, generateBookingCode, generateTransactionId } = require('../utils/helpers');

const STATUSES = ['pending', 'confirmed', 'cancelled'];

// GET /api/bookings?search=&status=
async function list(req, res, next) {
    try {
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();

        let sql = `SELECT b.*, e.name AS event_name, e.event_date, p.name AS participant_name,
                          p.email AS participant_email, v.name AS venue_name,
                          (SELECT payment_status FROM payments WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) AS payment_status
                   FROM bookings b
                   JOIN events e ON b.event_id = e.id
                   JOIN participants p ON b.participant_id = p.id
                   JOIN venues v ON b.venue_id = v.id
                   WHERE 1=1`;
        const params = [];
        if (search) {
            sql += ' AND (b.booking_code LIKE ? OR e.name LIKE ? OR p.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            sql += ' AND b.booking_status = ?';
            params.push(status);
        }
        sql += ' ORDER BY b.created_at DESC';

        const [rows] = await pool.query(sql, params);
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/bookings/:id
async function getOne(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT b.*, e.name AS event_name, e.event_date, e.ticket_price, p.name AS participant_name,
                    p.email AS participant_email, v.name AS venue_name
             FROM bookings b
             JOIN events e ON b.event_id = e.id
             JOIN participants p ON b.participant_id = p.id
             JOIN venues v ON b.venue_id = v.id
             WHERE b.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return fail(res, 'Booking not found.', 404);
        return ok(res, rows[0]);
    } catch (err) {
        next(err);
    }
}

// POST /api/bookings  — creates booking + auto-generates a pending payment (transactional)
async function create(req, res, next) {
    const conn = await pool.getConnection();
    try {
        const { event_id, participant_id, num_tickets } = req.body;
        const tickets = parseInt(num_tickets, 10) || 0;

        if (!event_id || !participant_id || tickets <= 0) {
            conn.release();
            return fail(res, 'Event, participant and ticket count are required.');
        }

        const [eventRows] = await conn.query(
            'SELECT id, venue_id, ticket_price, total_seats FROM events WHERE id = ?',
            [event_id]
        );
        if (!eventRows.length) {
            conn.release();
            return fail(res, 'Event not found.', 404);
        }
        const event = eventRows[0];

        const [bookedRows] = await conn.query(
            "SELECT COALESCE(SUM(num_tickets),0) AS booked FROM bookings WHERE event_id = ? AND booking_status != 'cancelled'",
            [event_id]
        );
        const bookedCount = parseInt(bookedRows[0].booked, 10);
        const availableSeats = event.total_seats - bookedCount;

        if (tickets > availableSeats) {
            conn.release();
            return fail(res, `Only ${availableSeats} seats available for this event.`, 400, { available_seats: availableSeats });
        }

        const totalAmount = event.ticket_price * tickets;
        const bookingCode = generateBookingCode();

        await conn.beginTransaction();

        const [bookingResult] = await conn.query(
            `INSERT INTO bookings (booking_code, event_id, participant_id, venue_id, num_tickets, total_amount, booking_status, booked_by)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [bookingCode, event_id, participant_id, event.venue_id, tickets, totalAmount, req.session.userId]
        );
        const bookingId = bookingResult.insertId;

        const txnId = generateTransactionId();
        await conn.query(
            "INSERT INTO payments (booking_id, transaction_id, amount, payment_method, payment_status) VALUES (?, ?, ?, 'cash', 'pending')",
            [bookingId, txnId, totalAmount]
        );

        await conn.commit();
        conn.release();

        return ok(res, { id: bookingId, booking_code: bookingCode, total_amount: totalAmount }, 'Booking created successfully.');
    } catch (err) {
        await conn.rollback();
        conn.release();
        next(err);
    }
}

// PUT /api/bookings/:id/status
async function updateStatus(req, res, next) {
    try {
        const { booking_status } = req.body;
        if (!STATUSES.includes(booking_status)) {
            return fail(res, 'Valid booking_status is required.');
        }
        await pool.query('UPDATE bookings SET booking_status = ? WHERE id = ?', [booking_status, req.params.id]);
        return ok(res, null, `Booking status updated to ${booking_status}.`);
    } catch (err) {
        next(err);
    }
}

// DELETE /api/bookings/:id
async function remove(req, res, next) {
    try {
        await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
        return ok(res, null, 'Booking deleted successfully.');
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, updateStatus, remove };
