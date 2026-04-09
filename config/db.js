var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 10, // ✅ 100 is too high for shared hosting
    host: process.env.DB_HOST || '46.202.161.177',
    user: process.env.DB_USER || 'u243066904_postmon',
    password: process.env.DB_PASSWORD || '@Postmon123',
    database: process.env.DB_NAME || 'u243066904_postmon',
    charset: 'utf8mb4',
    connectTimeout: 60000,  // ✅ Increased to 60s
    acquireTimeout: 60000,  // ✅ Add this
    timeout: 60000,         // ✅ Add this
    timezone: process.env.DB_TIMEZONE || 'Asia/Kolkata',
    port: process.env.DB_PORT || 3306,
});

// ✅ Don't crash server if DB is temporarily unreachable
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Warning: DB connection failed on startup:', err.message);
        return; // ❌ removed process.exit(1)
    }
    console.log('Connected to Postmon database');
    connection.release();
});

module.exports = pool;