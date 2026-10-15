/**
 * app.js — Main Express application entry point.
 * Event Management System REST API + static frontend.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const venueRoutes = require('./routes/venueRoutes');
const participantRoutes = require('./routes/participantRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- Core middleware ---------------- */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'ems_dev_secret_change_me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 8, // 8 hours
        },
    })
);

/* ---------------- REST API routes ---------------- */
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

/* ---------------- Static frontend ---------------- */
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: any unmatched non-API GET request serves index.html (client-side redirect handles auth)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ---------------- 404 for unmatched API routes ---------------- */
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.', data: null });
});

/* ---------------- Centralized error handler (must be last) ---------------- */
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 EventLy server running at http://localhost:${PORT}`);
});
