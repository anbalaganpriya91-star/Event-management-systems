/**
 * config/db.js
 * MySQL connection pool using mysql2/promise for async/await support.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_management_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
});

// Quick connectivity check at startup
pool.getConnection()
    .then((conn) => {
        console.log('✅ MySQL connected successfully.');
        conn.release();
    })
    .catch((err) => {
        console.error('❌ MySQL connection failed:', err.message);
    });

module.exports = pool;
