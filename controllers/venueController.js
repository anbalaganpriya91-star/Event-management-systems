/**
 * controllers/venueController.js
 */
const pool = require('../config/db');
const { ok, fail } = require('../utils/helpers');

// GET /api/venues?search=
async function list(req, res, next) {
    try {
        const search = (req.query.search || '').trim();
        let sql = 'SELECT * FROM venues WHERE 1=1';
        const params = [];
        if (search) {
            sql += ' AND (name LIKE ? OR location LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(sql, params);
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/venues/available
async function available(req, res, next) {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, location, capacity, price_per_day FROM venues WHERE status = 'available' ORDER BY name"
        );
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/venues/:id
async function getOne(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM venues WHERE id = ?', [req.params.id]);
        if (!rows.length) return fail(res, 'Venue not found.', 404);
        return ok(res, rows[0]);
    } catch (err) {
        next(err);
    }
}

// POST /api/venues
async function create(req, res, next) {
    try {
        const { name, location, capacity, price_per_day, amenities, status } = req.body;
        const safeStatus = ['available', 'unavailable'].includes(status) ? status : 'available';

        if (!name || !location || !capacity || Number(capacity) <= 0) {
            return fail(res, 'Name, location and valid capacity are required.');
        }

        const [result] = await pool.query(
            'INSERT INTO venues (name, location, capacity, price_per_day, amenities, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, location, capacity, price_per_day || 0, amenities || '', safeStatus, req.session.userId]
        );

        return ok(res, { id: result.insertId }, 'Venue created successfully.');
    } catch (err) {
        next(err);
    }
}

// PUT /api/venues/:id
async function update(req, res, next) {
    try {
        const { name, location, capacity, price_per_day, amenities, status } = req.body;
        const safeStatus = ['available', 'unavailable'].includes(status) ? status : 'available';

        await pool.query(
            'UPDATE venues SET name=?, location=?, capacity=?, price_per_day=?, amenities=?, status=? WHERE id=?',
            [name, location, capacity, price_per_day || 0, amenities || '', safeStatus, req.params.id]
        );

        return ok(res, null, 'Venue updated successfully.');
    } catch (err) {
        next(err);
    }
}

// DELETE /api/venues/:id
async function remove(req, res, next) {
    try {
        await pool.query('DELETE FROM venues WHERE id = ?', [req.params.id]);
        return ok(res, null, 'Venue deleted successfully.');
    } catch (err) {
        next(err);
    }
}

module.exports = { list, available, getOne, create, update, remove };
