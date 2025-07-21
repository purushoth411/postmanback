const { add } = require('winston');
const db = require('../config/db');

const addCollection = (user_id, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = 'INSERT INTO tbl_collections (user_id, name) VALUES (?, ?)';
    connection.query(sql, [user_id, name], (err, result) => {
      connection.release(); // release connection back to pool
      callback(err, result);
    });
  });
};

const getCollectionsByUser = (user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("DB connection error:", err);
      return callback(err);
    }

    const query = "SELECT id, name FROM tbl_collections WHERE user_id = ?";
    connection.query(query, [user_id], (err, results) => {
      connection.release(); // Always release the connection
      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};

const addRequest = (data, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_api_requests 
      (collection_id, user_id, name, method, url, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.collection_id,
      data.user_id,
      data.name,
      data.method,
      data.url,
      data.body
    ];

    connection.query(sql, values, (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result.insertId);
    });
  });
};

const getRequestById = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `SELECT * FROM tbl_api_requests WHERE id = ?`;
    connection.query(sql, [id], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results[0]);
    });
  });
};
const getRequestsByCollectionId = (collection_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err, null);
    }

    const sql = `SELECT * FROM tbl_api_requests WHERE collection_id = ?`;
    connection.query(sql, [collection_id], (error, results) => {
      connection.release(); // always release connection

      if (error) {
        console.error("Query error:", error);
        return callback(error, null);
      }

      callback(null, results);
    });
  });
};




module.exports = {
  addCollection,
  getCollectionsByUser,
  addRequest,
  getRequestsByCollectionId,
  getRequestById,
};
