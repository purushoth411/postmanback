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

const addFolder = (user_id, collection_id, parent_folder_id, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const created_at = new Date();
    const updated_at = new Date();

    const sql = `
      INSERT INTO tbl_request_folders 
        (user_id, collection_id, parent_folder_id, name, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(sql, [user_id, collection_id, parent_folder_id, name, created_at, updated_at], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};


const renameCollection = (id, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const query = 'UPDATE tbl_collections SET name = ? WHERE id = ?';
    connection.query(query, [name, id], (err, result) => {
      connection.release(); // Release the connection
      if (err) return callback(err);
      return callback(null, result);
    });
  });
};

const deleteCollection = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const query = 'DELETE FROM tbl_collections WHERE id = ?';
    connection.query(query, [id], (err, result) => {
      connection.release(); // Release the connection
      if (err) return callback(err);
      return callback(null, result);
    });
  });
};

const getCollectionsByUser = (user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("DB connection error:", err);
      return callback(err);
    }

    const query = `
      SELECT 
        c.id, 
        c.name, 
        COUNT(r.collection_id) AS request_count
      FROM 
        tbl_collections c
      LEFT JOIN 
        tbl_api_requests r ON c.id = r.collection_id
      WHERE 
        c.user_id = ?
      GROUP BY 
        c.id, c.name
    `;

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
      (collection_id, user_id, name, method, url, body,folder_id)
      VALUES (?, ?, ?, ?, ?, ?,?)
    `;
    const values = [
      data.collection_id,
      data.user_id,
      data.name,
      data.method,
      data.url,
      data.body,
      data.folder_id
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

    const folderSql = `SELECT * FROM tbl_request_folders WHERE collection_id = ? AND parent_folder_id is NULL`;
    const requestSql = `SELECT * FROM tbl_api_requests WHERE collection_id = ?`;

    // Execute both queries in parallel
    connection.query(folderSql, [collection_id], (folderErr, folders) => {
      if (folderErr) {
        connection.release();
        console.error("Folder query error:", folderErr);
        return callback(folderErr, null);
      }

      connection.query(requestSql, [collection_id], (reqErr, requests) => {
        connection.release();

        if (reqErr) {
          console.error("Request query error:", reqErr);
          return callback(reqErr, null);
        }

        callback(null, {
          folders,
          requests
        });
      });
    });
  });
};

const getRequestsByFolderId = (folder_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err, null);
    }

    const folderSql = `SELECT * FROM tbl_request_folders WHERE parent_folder_id = ?`;
    const requestSql = `SELECT * FROM tbl_api_requests WHERE folder_id = ?`;

    // Execute both queries in parallel
    connection.query(folderSql, [folder_id], (folderErr, folders) => {
      if (folderErr) {
        connection.release();
        console.error("Folder query error:", folderErr);
        return callback(folderErr, null);
      }

      connection.query(requestSql, [folder_id], (reqErr, requests) => {
        connection.release();

        if (reqErr) {
          console.error("Request query error:", reqErr);
          return callback(reqErr, null);
        }

        callback(null, {
          folders,
          requests
        });
      });
    });
  });
};


const updateRequest = ( id, changes, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const fields = Object.keys(changes).map(field => `${field} = ?`).join(', ');
    const values = Object.values(changes);
    const sql = `UPDATE tbl_api_requests SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    connection.query(sql, [...values, id], (err, results) => {
      connection.release();
      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};


module.exports = {
  addCollection,
  addFolder,
  renameCollection,
  deleteCollection,
  getCollectionsByUser,
  addRequest,
  getRequestsByCollectionId,
  getRequestsByFolderId,
  getRequestById,
  updateRequest,
};
