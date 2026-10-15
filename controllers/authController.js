/**
 * controllers/authController.js
 */
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { validateEmail, ok, fail } = require('../utils/helpers');

// POST /api/auth/register
async function register(req, res, next) {
    try {
        const { full_name, email, password, role } = req.body;
        const safeRole = ['admin', 'staff'].includes(role) ? role : 'staff';

        if (!full_name || !email || !password) {
            return fail(res, 'All fields are required.');
        }
        if (!validateEmail(email)) {
            return fail(res, 'Invalid email format.');
        }
        if (password.length < 6) {
            return fail(res, 'Password must be at least 6 characters.');
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return fail(res, 'Email already registered.', 409);
        }

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [full_name, email, hashed, safeRole]
        );

        return ok(res, { id: result.insertId }, 'Registration successful. Please login.');
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return fail(res, 'Email and password are required.');
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return fail(res, 'Invalid email or password.', 401);
        }
        if (user.status === 'inactive') {
            return fail(res, 'Your account has been deactivated. Contact admin.', 403);
        }

        req.session.userId = user.id;
        req.session.fullName = user.full_name;
        req.session.email = user.email;
        req.session.role = user.role;

        return ok(res, {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        }, 'Login successful.');
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/logout
function logout(req, res, next) {
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        return ok(res, null, 'Logged out successfully.');
    });
}

// GET /api/auth/me
function me(req, res) {
    if (!req.session || !req.session.userId) {
        return fail(res, 'Not logged in.', 401);
    }
    return ok(res, {
        id: req.session.userId,
        full_name: req.session.fullName,
        email: req.session.email,
        role: req.session.role,
    });
}

module.exports = { register, login, logout, me };
