/**
 * utils/helpers.js
 */
const crypto = require('crypto');

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function generateBookingCode() {
    return 'BK' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generateTransactionId() {
    return 'TXN' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

function ok(res, data = null, message = '') {
    return res.json({ success: true, message, data });
}

function fail(res, message = 'Something went wrong.', status = 400, data = null) {
    return res.status(status).json({ success: false, message, data });
}

module.exports = { validateEmail, generateBookingCode, generateTransactionId, ok, fail };
