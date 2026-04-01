var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST || '46.202.161.177',
    user: process.env.DB_USER || 'u243066904_postmon',
    password: process.env.DB_PASSWORD || '@Postmon123',
    database: process.env.DB_NAME || 'u243066904_postmon',
    charset: 'utf8mb4',
    connectTimeout: 20000, 
    timezone: process.env.DB_TIMEZONE || 'Asia/Kolkata',
    port: process.env.DB_PORT || 3306,
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