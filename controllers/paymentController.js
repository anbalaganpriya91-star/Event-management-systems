/**
 * controllers/paymentController.js
 */
const pool = require('../config/db');
const { ok, fail } = require('../utils/helpers');

const METHODS = ['cash', 'card', 'upi', 'bank_transfer'];

// GET /api/payments?status=
async function list(req, res, next) {
    try {
        const status = (req.query.status || '').trim();
        let sql = `SELECT pay.*, b.booking_code, b.total_amount AS booking_amount, e.name AS event_name,
                          p.name AS participant_name
                   FROM payments pay
                   JOIN bookings b ON pay.booking_id = b.id
                   JOIN events e ON b.event_id = e.id
                   JOIN participants p ON b.participant_id = p.id
                   WHERE 1=1`;
        const params = [];
        if (status) {
            sql += ' AND pay.payment_status = ?';
            params.push(status);
        }
        sql += ' ORDER BY pay.created_at DESC';

        const [rows] = await pool.query(sql, params);
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/payments/:id
async function getOne(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT pay.*, b.booking_code, b.total_amount AS booking_amount, e.name AS event_name, p.name AS participant_name
             FROM payments pay
             JOIN bookings b ON pay.booking_id = b.id
             JOIN events e ON b.event_id = e.id
             JOIN participants p ON b.participant_id = p.id
             WHERE pay.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return fail(res, 'Payment not found.', 404);
        return ok(res, rows[0]);
    } catch (err) {
        next(err);
    }
}

// POST /api/payments/:id/process — completes payment & auto-confirms booking (transactional)
async function process(req, res, next) {
    const conn = await pool.getConnection();
    try {
        const paymentId = req.params.id;
        const method = METHODS.includes(req.body.payment_method) ? req.body.payment_method : 'cash';

        const [rows] = await conn.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
        if (!rows.length) { conn.release(); return fail(res, 'Payment record not found.', 404); }
        const payment = rows[0];
        if (payment.payment_status === 'paid') { conn.release(); return fail(res, 'Payment already completed.'); }

        await conn.beginTransaction();

        await conn.query(
            "UPDATE payments SET payment_status = 'paid', payment_method = ?, payment_date = NOW() WHERE id = ?",
            [method, paymentId]
        );
        await conn.query("UPDATE bookings SET booking_status = 'confirmed' WHERE id = ?", [payment.booking_id]);

        await conn.commit();
        conn.release();

        return ok(res, null, 'Payment completed and booking confirmed.');
    } catch (err) {
        await conn.rollback();
        conn.release();
        next(err);
    }
}

// POST /api/payments/:id/refund — refunds payment & cancels booking (transactional)
async function refund(req, res, next) {
    const conn = await pool.getConnection();
    try {
        const paymentId = req.params.id;
        const [rows] = await conn.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
        if (!rows.length) { conn.release(); return fail(res, 'Payment record not found.', 404); }
        const payment = rows[0];
        if (payment.payment_status !== 'paid') { conn.release(); return fail(res, 'Only paid transactions can be refunded.'); }

        await conn.beginTransaction();

        await conn.query("UPDATE payments SET payment_status = 'refunded' WHERE id = ?", [paymentId]);
        await conn.query("UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?", [payment.booking_id]);

        await conn.commit();
        conn.release();

        return ok(res, null, 'Payment refunded and booking cancelled.');
    } catch (err) {
        await conn.rollback();
        conn.release();
        next(err);
    }
}

// POST /api/payments/:id/fail
async function markFailed(req, res, next) {
    try {
        await pool.query("UPDATE payments SET payment_status = 'failed' WHERE id = ?", [req.params.id]);
        return ok(res, null, 'Payment marked as failed.');
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, process, refund, markFailed };
