var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'postman',
    charset: 'utf8mb4',
    connectTimeout: 20000, 
    timezone: 'Asia/Kolkata',
    port:3307,
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