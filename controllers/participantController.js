/**
 * controllers/participantController.js
 */
const pool = require('../config/db');
const { validateEmail, ok, fail } = require('../utils/helpers');

// GET /api/participants?search=
async function list(req, res, next) {
    try {
        const search = (req.query.search || '').trim();
        let sql = 'SELECT * FROM participants WHERE 1=1';
        const params = [];
        if (search) {
            sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(sql, params);
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/participants/all  (lightweight list for dropdowns)
async function all(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT id, name, email, phone FROM participants ORDER BY name');
        return ok(res, rows);
    } catch (err) {
        next(err);
    }
}

// GET /api/participants/:id
async function getOne(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM participants WHERE id = ?', [req.params.id]);
        if (!rows.length) return fail(res, 'Participant not found.', 404);
        return ok(res, rows[0]);
    } catch (err) {
        next(err);
    }
}

// POST /api/participants
async function create(req, res, next) {
    try {
        const { name, email, phone, address } = req.body;
        if (!name || !email) return fail(res, 'Name and email are required.');
        if (!validateEmail(email)) return fail(res, 'Invalid email format.');

        const [existing] = await pool.query('SELECT id FROM participants WHERE email = ?', [email]);
        if (existing.length) return fail(res, 'A participant with this email already exists.', 409);

        const [result] = await pool.query(
            'INSERT INTO participants (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone || '', address || '']
        );

        return ok(res, { id: result.insertId }, 'Participant added successfully.');
    } catch (err) {
        next(err);
    }
}

// PUT /api/participants/:id
async function update(req, res, next) {
    try {
        const { name, email, phone, address } = req.body;
        if (!validateEmail(email)) return fail(res, 'Invalid email format.');

        await pool.query(
            'UPDATE participants SET name=?, email=?, phone=?, address=? WHERE id=?',
            [name, email, phone || '', address || '', req.params.id]
        );

        return ok(res, null, 'Participant updated successfully.');
    } catch (err) {
        next(err);
    }
}

// DELETE /api/participants/:id
async function remove(req, res, next) {
    try {
        await pool.query('DELETE FROM participants WHERE id = ?', [req.params.id]);
        return ok(res, null, 'Participant deleted successfully.');
    } catch (err) {
        next(err);
    }
}

module.exports = { list, all, getOne, create, update, remove };
