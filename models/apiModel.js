const { add } = require('winston');
const db = require('../config/db');
const connection = require('../config/db');

const addCollection = (user_id,wks_id, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = 'INSERT INTO tbl_collections (user_id,workspace_id, name) VALUES (?, ?,?)';
    connection.query(sql, [user_id,wks_id, name], (err, result) => {
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
      callback(null, result); // Success
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


const renameFolder = (id, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const query = 'UPDATE tbl_request_folders SET name = ? WHERE id = ?';
    connection.query(query, [name, id], (err, result) => {
      connection.release(); 
      if (err) return callback(err);
      return callback(null, result);
    });
  });
};

const deleteFolder = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    // Step 1: Recursively fetch all subfolder IDs
    const getAllSubFolderIds = (folderId, done) => {
      const query = 'SELECT id FROM tbl_request_folders WHERE parent_folder_id = ?';
      connection.query(query, [folderId], (err, rows) => {
        if (err) return done(err);

        let subFolderIds = rows.map(r => r.id);
        if (subFolderIds.length === 0) {
          return done(null, [folderId]);
        }

        // Recursively fetch deeper subfolders
        let pending = subFolderIds.length;
        let allIds = [folderId, ...subFolderIds];

        subFolderIds.forEach(subId => {
          getAllSubFolderIds(subId, (err, ids) => {
            if (err) return done(err);
            allIds.push(...ids);
            pending--;
            if (pending === 0) {
              done(null, allIds);
            }
          });
        });
      });
    };

    // Step 2: Delete requests + folders
    getAllSubFolderIds(id, (err, folderIds) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      if (folderIds.length === 0) {
        connection.release();
        return callback(null, { affectedRows: 0 });
      }

      // Delete all requests belonging to these folders
      const deleteRequests = 'DELETE FROM tbl_api_requests WHERE folder_id IN (?)';
      connection.query(deleteRequests, [folderIds], (err) => {
        if (err) {
          connection.release();
          return callback(err);
        }

        // Delete the folders themselves
        const deleteFolders = 'DELETE FROM tbl_request_folders WHERE id IN (?)';
        connection.query(deleteFolders, [folderIds], (err, result) => {
          connection.release();
          if (err) return callback(err);
          return callback(null, result);
        });
      });
    });
  });
};


const renameRequest = (id, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const query = 'UPDATE tbl_api_requests SET name = ? WHERE id = ?';
    connection.query(query, [name, id], (err, result) => {
      connection.release(); // Release the connection
      if (err) return callback(err);
      callback(null, result); // Success
    });
  });
};



const deleteRequest = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const query = 'DELETE FROM tbl_api_requests WHERE id = ?';
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

const getCollectionsByWorkspace = (wks_id, callback) => {
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
        c.workspace_id = ?
      GROUP BY 
        c.id, c.name
    `;

    connection.query(query, [wks_id], (err, results) => {
      connection.release(); // Always release the connection
      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};

const getCollectionById = (id, callback) => {
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
        c.id = ?
      GROUP BY 
        c.id, c.name
    `;

    connection.query(query, [id], (err, results) => {
      connection.release(); // Always release the connection
      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      // return single object instead of array
      return callback(null, results[0] || null);
    });
  });
};


const addRequest = (data, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_api_requests 
      (collection_id, user_id, name, method, url, body_raw,folder_id)
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
    const requestSql = `SELECT * FROM tbl_api_requests WHERE collection_id = ? AND folder_id is NULL`;

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


const updateRequest = (id, changes, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    // stringify queryParams if it exists
    const safeChanges = { ...changes };
    if (safeChanges.queryParams) {
      safeChanges.queryParams = JSON.stringify(safeChanges.queryParams);
    }

    const fields = Object.keys(safeChanges).map(field => `${field} = ?`).join(', ');
    const values = Object.values(safeChanges);

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


const getWorkspaces = (userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      SELECT w.*, wm.role, wm.added_at
      FROM tbl_workspaces w
      INNER JOIN tbl_workspace_members wm 
        ON w.id = wm.workspace_id
      WHERE wm.user_id = ?
    `;

    connection.query(sql, [userId], (err, results) => {
      connection.release(); // ✅ Always release connection

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};


const createWorkspace = (name, userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "INSERT INTO tbl_workspaces (name, user_id, is_default_wks) VALUES (?, ?, 0)";
    connection.query(sql, [name, userId], (err, result) => {
      connection.release();
      if (err) return callback(err);

      callback(null, result.insertId);
    });
  });
};

// Add member to workspace
const addMember = (workspaceId, userId, role, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "INSERT INTO tbl_workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)";
    connection.query(sql, [workspaceId, userId, role], (err) => {
      connection.release();
      if (err) return callback(err);

      callback(null);
    });
  });
};

// Find user by email
const findUserByEmail = (email, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "SELECT * FROM tbl_users WHERE email = ?";
    connection.query(sql, [email], (err, results) => {
      connection.release();
      if (err) return callback(err);

      if (results.length > 0) return callback(null, results[0]);
      callback(null, null);
    });
  });
};

const searchRequests = (workspaceId, query, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    // First, fetch all folders in this workspace
    const foldersSql = `SELECT id, collection_id, parent_folder_id, name FROM tbl_request_folders WHERE collection_id IN (SELECT id FROM tbl_collections WHERE workspace_id=?)`;
    connection.query(foldersSql, [workspaceId], (err, allFolders) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      // Build folder map for recursive path
      const folderMap = {};
      allFolders.forEach(f => {
        folderMap[f.id] = { id: f.id, parent_folder_id: f.parent_folder_id, name: f.name };
      });

      // Then fetch requests
      const sql = `
        SELECT r.id, r.name, r.method, r.url,
               r.collection_id,
               r.folder_id,
               c.name AS collection_name,
               f.name AS folder_name,
               f.parent_folder_id
        FROM tbl_api_requests r
        LEFT JOIN tbl_collections c ON r.collection_id = c.id
        LEFT JOIN tbl_request_folders f ON r.folder_id = f.id
        WHERE c.workspace_id = ?
          AND (r.name LIKE ? OR r.url LIKE ?)
        ORDER BY r.name ASC
      `;
      const searchParam = `%${query}%`;
      connection.query(sql, [workspaceId, searchParam, searchParam], (err, results) => {
        connection.release();
        if (err) return callback(err);

        // Recursive function to get full folder path
        const getFolderPath = (folderId) => {
          const path = [];
          let currentId = folderId;
          while (currentId && folderMap[currentId]) {
            path.unshift(currentId);
            currentId = folderMap[currentId].parent_folder_id;
          }
          return path;
        };

        const mapped = results.map(r => ({
          id: r.id,
          name: r.name,
          method: r.method,
          url: r.url,
          collection_id: r.collection_id,
          folder_id: r.folder_id,
          folder_path: r.folder_id ? getFolderPath(r.folder_id) : [],
          path: `${r.collection_name || "No Collection"}${r.folder_id ? " / " + getFolderPath(r.folder_id).map(id => folderMap[id]?.name).join(' / ') : ""} / ${r.name}`
        }));

        callback(null, mapped);
      });
    });
  });
};





module.exports = {
  addCollection,
  addFolder,
  renameCollection,
  deleteCollection,
  renameFolder,
  deleteFolder,
  renameRequest,
  deleteRequest,
  getCollectionsByUser,
  addRequest,
  getRequestsByCollectionId,
  getRequestsByFolderId,
  getRequestById,
  updateRequest,
  getWorkspaces,
  getCollectionsByWorkspace,
  findUserByEmail,
  createWorkspace,
  addMember,
  getCollectionById,
  searchRequests,
};
