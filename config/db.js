var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postman',
    charset: 'utf8mb4',
    connectTimeout: 20000, 
    timezone: process.env.DB_TIMEZONE || 'Asia/Kolkata',
    port: process.env.DB_PORT || 3307,
});

// Helper to get a connection and execute a query
connection.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to Postman database');
    connection.release(); 
});

module.exports = connection; 