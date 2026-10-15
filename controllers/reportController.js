/**
 * controllers/reportController.js
 */
const pool = require('../config/db');
const { ok } = require('../utils/helpers');

function buildFilteredQuery(query) {
    const { from_date, to_date, status, venue_id } = query;
    let sql = `SELECT b.booking_code, e.name AS event_name, e.event_date, v.name AS venue_name,
                      p.name AS participant_name, p.email AS participant_email,
                      b.num_tickets, b.total_amount, b.booking_status,
                      pay.payment_status, pay.payment_method, pay.payment_date, b.created_at
               FROM bookings b
               JOIN events e ON b.event_id = e.id
               JOIN venues v ON b.venue_id = v.id
               JOIN participants p ON b.participant_id = p.id
               LEFT JOIN payments pay ON pay.booking_id = b.id
               WHERE 1=1`;
    const params = [];

    if (from_date) { sql += ' AND DATE(b.created_at) >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND DATE(b.created_at) <= ?'; params.push(to_date); }
    if (status) { sql += ' AND b.booking_status = ?'; params.push(status); }
    if (venue_id) { sql += ' AND b.venue_id = ?'; params.push(venue_id); }

    sql += ' ORDER BY b.created_at DESC';
    return { sql, params };
}

// GET /api/reports/bookings
async function bookingReport(req, res, next) {
    try {
        const { sql, params } = buildFilteredQuery(req.query);
        const [rows] = await pool.query(sql, params);

        const summary = {
            total_bookings: rows.length,
            total_amount: rows.reduce((sum, r) => sum + parseFloat(r.total_amount), 0),
            total_tickets: rows.reduce((sum, r) => sum + parseInt(r.num_tickets, 10), 0),
            confirmed: rows.filter((r) => r.booking_status === 'confirmed').length,
            pending: rows.filter((r) => r.booking_status === 'pending').length,
            cancelled: rows.filter((r) => r.booking_status === 'cancelled').length,
        };

        return ok(res, { rows, summary });
    } catch (err) {
        next(err);
    }
}

// GET /api/reports/export — streams a CSV download
async function exportCsv(req, res, next) {
    try {
        const { sql, params } = buildFilteredQuery(req.query);
        const [rows] = await pool.query(sql, params);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="booking_report_${Date.now()}.csv"`);

        const header = ['Booking Code', 'Event', 'Event Date', 'Venue', 'Participant', 'Tickets', 'Amount', 'Booking Status', 'Payment Status', 'Created At'];
        const csvRows = [header.join(',')];

        rows.forEach((r) => {
            const line = [
                r.booking_code, r.event_name, r.event_date, r.venue_name, r.participant_name,
                r.num_tickets, r.total_amount, r.booking_status, r.payment_status, r.created_at,
            ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
            csvRows.push(line.join(','));
        });

        res.send(csvRows.join('\n'));
    } catch (err) {
        next(err);
    }
}

module.exports = { bookingReport, exportCsv };
