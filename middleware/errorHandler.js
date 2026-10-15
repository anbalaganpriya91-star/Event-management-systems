/**
 * middleware/errorHandler.js
 * Centralized error handler — every controller forwards errors here via next(err).
 */

function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err.message);

    // MySQL foreign key constraint violation
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({
            success: false,
            message: 'Cannot complete this action: linked records exist elsewhere in the system.',
            data: null,
        });
    }

    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'A record with this value already exists.',
            data: null,
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong on the server.',
        data: null,
    });
}

// Wraps async route handlers so thrown errors are forwarded to errorHandler
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = { errorHandler, asyncHandler };
