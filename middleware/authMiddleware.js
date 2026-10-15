/**
 * middleware/authMiddleware.js
 * Protects routes by checking express-session state.
 */

function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.', data: null });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden: Admins only.', data: null });
}

module.exports = { requireLogin, requireAdmin };
