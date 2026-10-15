/**
 * controllers/dashboardController.js
 */
const pool = require('../config/db');
const { ok } = require('../utils/helpers');

// GET /api/dashboard/stats
async function stats(req, res, next) {
    try {
        const [[venues]] = await pool.query('SELECT COUNT(*) c FROM venues');
        const [[events]] = await pool.query('SELECT COUNT(*) c FROM events');
        const [[participants]] = await pool.query('SELECT COUNT(*) c FROM participants');
        const [[bookings]] = await pool.query('SELECT COUNT(*) c FROM bookings');
        const [[confirmed]] = await pool.query("SELECT COUNT(*) c FROM bookings WHERE booking_status='confirmed'");
        const [[pending]] = await pool.query("SELECT COUNT(*) c FROM bookings WHERE booking_status='pending'");
        const [[cancelled]] = await pool.query("SELECT COUNT(*) c FROM bookings WHERE booking_status='cancelled'");
        const [[revenue]] = await pool.query("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE payment_status='paid'");
        const [[pendingPayments]] = await pool.query("SELECT COUNT(*) c FROM payments WHERE payment_status='pending'");
        const [[upcoming]] = await pool.query("SELECT COUNT(*) c FROM events WHERE status='upcoming'");

        const [trend] = await pool.query(`
            SELECT DATE_FORMAT(payment_date, '%b %Y') AS month, SUM(amount) AS total
            FROM payments
            WHERE payment_status = 'paid' AND payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY YEAR(payment_date), MONTH(payment_date)
            ORDER BY YEAR(payment_date), MONTH(payment_date)
        `);

        const [byStatus] = await pool.query(
            'SELECT booking_status AS status, COUNT(*) AS count FROM bookings GROUP BY booking_status'
        );

        const [topVenues] = await pool.query(`
            SELECT v.name, COUNT(b.id) AS bookings_count
            FROM venues v LEFT JOIN bookings b ON v.id = b.venue_id
            GROUP BY v.id ORDER BY bookings_count DESC LIMIT 5
        `);

        const [recent] = await pool.query(`
            SELECT b.booking_code, e.name AS event_name, p.name AS participant_name, b.total_amount, b.booking_status, b.created_at
            FROM bookings b JOIN events e ON b.event_id = e.id JOIN participants p ON b.participant_id = p.id
            ORDER BY b.created_at DESC LIMIT 5
        `);

        return ok(res, {
            total_venues: venues.c,
            total_events: events.c,
            total_participants: participants.c,
            total_bookings: bookings.c,
            confirmed_bookings: confirmed.c,
            pending_bookings: pending.c,
            cancelled_bookings: cancelled.c,
            total_revenue: parseFloat(revenue.s),
            pending_payments: pendingPayments.c,
            upcoming_events: upcoming.c,
            revenue_trend: trend,
            bookings_by_status: byStatus,
            top_venues: topVenues,
            recent_bookings: recent,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { stats };
