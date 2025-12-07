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

// Helper function to calculate folder depth
const getFolderDepth = (folder_id, callback) => {
  if (!folder_id) {
    // Root level folder (no parent) = level 1
    return callback(null, 1);
  }

  db.getConnection((err, connection) => {
    if (err) return callback(err);

    let depth = 1;
    let currentFolderId = folder_id;

    const calculateDepth = () => {
      const query = 'SELECT parent_folder_id FROM tbl_request_folders WHERE id = ?';
      connection.query(query, [currentFolderId], (err, rows) => {
        if (err) {
          connection.release();
          return callback(err);
        }

        if (rows.length === 0) {
          connection.release();
          return callback(null, depth);
        }

        const parentId = rows[0].parent_folder_id;
        if (parentId === null) {
          // Reached root level
          connection.release();
          return callback(null, depth + 1);
        }

        depth++;
        currentFolderId = parentId;
        calculateDepth();
      });
    };

    calculateDepth();
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

    // Update both tables: requests and drafts
    const query1 = 'UPDATE tbl_api_requests SET name = ? WHERE id = ?';
    const query2 = 'UPDATE tbl_api_requests_draft SET name = ? WHERE request_id = ?';

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return callback(err);
      }

      connection.query(query1, [name, id], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            callback(err);
          });
        }

        connection.query(query2, [name, id], (err, result2) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              callback(err);
            });
          }

          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            connection.release();
            callback(null, { message: "Renamed in both tables", affectedDrafts: result2.affectedRows });
          });
        });
      });
    });
  });
};




const deleteRequest = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    // Start with deleting from drafts first (using request_id)
    const draftQuery = 'DELETE FROM tbl_api_drafts WHERE request_id = ?';
    connection.query(draftQuery, [id], (err) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      // Then delete from requests (using id)
      const requestQuery = 'DELETE FROM tbl_api_requests WHERE id = ?';
      connection.query(requestQuery, [id], (err, result) => {
        connection.release();
        if (err) return callback(err);
        return callback(null, result); // success
      });
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
        c.workspace_id,
        COUNT(r.collection_id) AS request_count
      FROM 
        tbl_collections c
      LEFT JOIN 
        tbl_api_requests r ON c.id = r.collection_id
      WHERE 
        c.id = ?
      GROUP BY 
        c.id, c.name, c.workspace_id
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


const getRequestsByRequestId = (request_id, user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err, null);
    }

    // 1. Check for draft
      const draftSql = `
      SELECT *, request_id AS id, 1 AS isDraft 
      FROM tbl_api_requests_draft 
      WHERE request_id=? AND user_id=? 
      LIMIT 1
    `;
    connection.query(draftSql, [request_id, user_id], (draftErr, draftRows) => {
      if (draftErr) {
        connection.release();
        console.error("Draft query error:", draftErr);
        return callback(draftErr, null);
      }

      if (draftRows.length > 0) {
        connection.release();
        return callback(null, draftRows[0]); // return draft immediately
      }

      // 2. Otherwise return saved request
      const requestSql = "SELECT *, 0 as isDraft FROM tbl_api_requests WHERE id=? LIMIT 1";
      connection.query(requestSql, [request_id], (reqErr, reqRows) => {
        connection.release();

        if (reqErr) {
          console.error("Request query error:", reqErr);
          return callback(reqErr, null);
        }

        if (reqRows.length > 0) {
          return callback(null, reqRows[0]);
        } else {
          return callback(null, null); // not found
        }
      });
    });
  });
};

const getRequestsById = (request_id,callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err, null);
    }

   

      
      const requestSql = "SELECT * FROM tbl_api_requests WHERE id=? LIMIT 1";
      connection.query(requestSql, [request_id], (reqErr, reqRows) => {
        connection.release();

        if (reqErr) {
          console.error("Request query error:", reqErr);
          return callback(reqErr, null);
        }

        if (reqRows.length > 0) {
          return callback(null, reqRows[0]);
        } else {
          return callback(null, null); // not found
        }
      });
    });

};


// const updateRequest = (id, changes, callback) => {
//   db.getConnection((err, connection) => {
//     if (err) {
//       console.error("Connection error:", err);
//       return callback(err);
//     }

//     // stringify queryParams if it exists
//     const safeChanges = { ...changes };
//     if (safeChanges.queryParams) {
//       safeChanges.queryParams = JSON.stringify(safeChanges.queryParams);
//     }

//     const fields = Object.keys(safeChanges).map(field => `${field} = ?`).join(', ');
//     const values = Object.values(safeChanges);

//     const sql = `UPDATE tbl_api_requests SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

//     connection.query(sql, [...values, id], (err, results) => {
//       connection.release();
//       if (err) {
//         console.error("Query error:", err);
//         return callback(err);
//       }
//       return callback(null, results);
//     });
//   });
// };

// model
const updateRequest = (request_id, user_id, changes, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    // convert queryParams safely
    const safeChanges = { ...changes };
    if (safeChanges.queryParams && typeof safeChanges.queryParams !== "string") {
      safeChanges.queryParams = JSON.stringify(safeChanges.queryParams);
    }

    const sql = `
      INSERT INTO tbl_api_requests_draft
        (request_id, user_id, name, method, url, body_raw, body_formdata, queryParams, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        method = VALUES(method),
        url = VALUES(url),
        body_raw = VALUES(body_raw),
        body_formdata = VALUES(body_formdata),
        queryParams = VALUES(queryParams),
        updated_at = NOW()
    `;

    connection.query(
      sql,
      [
        request_id,
        user_id,
        safeChanges.name || request_name || "Untitled Request",
        safeChanges.method || null,
        safeChanges.url || null,
        safeChanges.body_raw || null,
        safeChanges.body_formdata || null,
        safeChanges.queryParams || null,
      ],
      (err2, results) => {
        connection.release();
        if (err2) return callback(err2);
        callback(null, results);
      }
    );
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
const getWorkspaceById = (workspaceId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "SELECT * FROM tbl_workspaces WHERE id = ?";
    connection.query(sql, [workspaceId], (err, results) => {
      connection.release();
      if (err) return callback(err);

      callback(null, results[0] || null);
    });
  });
};

const getWorkspaceMembers = (workspaceId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT 
        wm.id,
        wm.workspace_id,
        wm.user_id,
        wm.role,
        wm.added_at,
        u.name as user_name,
        u.email as user_email
      FROM tbl_workspace_members wm
      JOIN tbl_users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
      ORDER BY wm.role ASC, u.name ASC
    `;
    
    connection.query(sql, [workspaceId], (err, results) => {
      connection.release();
      if (err) return callback(err);

      callback(null, results);
    });
  });
};

const checkUserRole = (workspaceId, userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "SELECT role FROM tbl_workspace_members WHERE workspace_id = ? AND user_id = ?";
    connection.query(sql, [workspaceId, userId], (err, results) => {
      connection.release();
      if (err) return callback(err);

      callback(null, results[0]?.role || null);
    });
  });
};

const isDefaultWorkspace = (workspaceId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "SELECT is_default_wks FROM tbl_workspaces WHERE id = ?";
    connection.query(sql, [workspaceId], (err, results) => {
      connection.release();
      if (err) return callback(err);

      callback(null, results[0]?.is_default_wks === '1');
    });
  });
};

const updateWorkspaceName = (workspaceId, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "UPDATE tbl_workspaces SET name = ?, updated_at = NOW() WHERE id = ?";
    connection.query(sql, [name, workspaceId], (err) => {
      connection.release();
      if (err) return callback(err);

      callback(null);
    });
  });
};

const updateMemberRole = (workspaceId, userId, role, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "UPDATE tbl_workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?";
    connection.query(sql, [role, workspaceId, userId], (err) => {
      connection.release();
      if (err) return callback(err);

      callback(null);
    });
  });
};

const removeMember = (workspaceId, userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "DELETE FROM tbl_workspace_members WHERE workspace_id = ? AND user_id = ?";
    connection.query(sql, [workspaceId, userId], (err) => {
      connection.release();
      if (err) return callback(err);

      callback(null);
    });
  });
};

const isMember = (workspaceId, userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "SELECT id FROM tbl_workspace_members WHERE workspace_id = ? AND user_id = ?";
    connection.query(sql, [workspaceId, userId], (err, results) => {
      connection.release();
      if (err) return callback(err);

      callback(null, results.length > 0);
    });
  });
};

const deleteWorkspace = (workspaceId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "DELETE FROM tbl_workspaces WHERE id = ?";
    connection.query(sql, [workspaceId], (err) => {
      connection.release();
      if (err) return callback(err);

      callback(null);
    });
  });
};

const findUserByEmail = (email, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "SELECT id, name, email FROM tbl_users WHERE email = ?";
    connection.query(sql, [email], (err, results) => {
      connection.release();
      if (err) return callback(err);

      callback(null, results[0] || null);
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


 const saveRequest= (request_id, user_id, request_data, callback) => {
    db.getConnection((err, connection) => {
      if (err) return callback(err);

      const sqlUpdate = `
        UPDATE tbl_api_requests 
        SET name=?, method=?, url=?, body_raw=?, body_formdata=?, queryParams=?, updated_at=NOW()
        WHERE id=?`;

      const values = [
        request_data.name || "Untitled Request",
        request_data.method || "GET",
        request_data.url || "",
        request_data.body_raw || "",
        request_data.body_formdata || "",
        JSON.stringify(request_data.queryParams || []),
        request_id
      ];

      connection.query(sqlUpdate, values, (error, result) => {
        if (error) {
          connection.release();
          return callback(error);
        }

        // delete draft only for this user
        const sqlDeleteDraft = `
          DELETE FROM tbl_api_requests_draft 
          WHERE request_id=? `;

        connection.query(sqlDeleteDraft, [request_id], (draftErr) => {
          connection.release(); 
          if (draftErr) return callback(draftErr);
          callback(null, result);
        });
      });
    });
  }


  const getEnvironments = (workspaceId, userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      SELECT * FROM tbl_environments
      WHERE workspace_id = ?
      ORDER BY created_at DESC
    `;

    connection.query(sql, [workspaceId], (err, results) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};

// Get active environment for user in workspace
const getActiveEnvironment = (userId, workspaceId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      SELECT environment_id 
      FROM tbl_active_environments
      WHERE user_id = ? AND workspace_id = ?
    `;

    connection.query(sql, [userId, workspaceId], (err, results) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, {
        environment_id: results.length > 0 ? results[0].environment_id : null
      });
    });
  });
};

// Add new environment
const addEnvironment = (userId, workspaceId, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      INSERT INTO tbl_environments (workspace_id, user_id, name)
      VALUES (?, ?, ?)
    `;

    connection.query(sql, [workspaceId, userId, name], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, {
        id: result.insertId,
        workspace_id: workspaceId,
        user_id: userId,
        name: name,
        created_at: new Date()
      });
    });
  });
};

// Set active environment (can be null to deactivate)
const setActiveEnvironment = (userId, workspaceId, environmentId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    // If environmentId is null, delete the active environment record
    if (environmentId === null || environmentId === undefined) {
      const deleteSql = `
        DELETE FROM tbl_active_environments
        WHERE user_id = ? AND workspace_id = ?
      `;
      
      connection.query(deleteSql, [userId, workspaceId], (err, result) => {
        connection.release();

        if (err) {
          console.error("Query error:", err);
          return callback(err);
        }

        return callback(null, { status: true, message: "Active environment deactivated", environment_id: null });
      });
    } else {
      // Insert or update active environment
      const sql = `
        INSERT INTO tbl_active_environments (user_id, workspace_id, environment_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          environment_id = VALUES(environment_id),
          set_at = CURRENT_TIMESTAMP
      `;

      connection.query(sql, [userId, workspaceId, environmentId], (err, result) => {
        connection.release();

        if (err) {
          console.error("Query error:", err);
          return callback(err);
        }

        return callback(null, { status: true, message: "Active environment set", environment_id: environmentId });
      });
    }
  });
};

// Update environment name
const updateEnvironment = (environmentId, name, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      UPDATE tbl_environments
      SET name = ?
      WHERE id = ?
    `;

    connection.query(sql, [name, environmentId], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, { status: true, message: "Environment updated" });
    });
  });
};

// Delete environment
const deleteEnvironment = (environmentId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `DELETE FROM tbl_environments WHERE id = ?`;

    connection.query(sql, [environmentId], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, { status: true, message: "Environment deleted" });
    });
  });
};

// Get environment variables
const getEnvironmentVariables = (environmentId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      SELECT * FROM tbl_environment_variables
      WHERE environment_id = ?
      ORDER BY \`key\`
    `;

    connection.query(sql, [environmentId], (err, results) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};

// Add environment variable
const addEnvironmentVariable = (environmentId, key, value, type, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      INSERT INTO tbl_environment_variables (environment_id, \`key\`, value, type)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(sql, [environmentId, key, value || '', type || 'default'], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, {
        id: result.insertId,
        environment_id: environmentId,
        key: key,
        value: value || '',
        type: type || 'default'
      });
    });
  });
};

// Update environment variable
const updateEnvironmentVariable = (id, key, value, type, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      UPDATE tbl_environment_variables
      SET \`key\` = ?, value = ?, type = ?
      WHERE id = ?
    `;

    connection.query(sql, [key, value || '', type || 'default', id], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, { status: true, message: "Variable updated" });
    });
  });
};

// Delete environment variable
const deleteEnvironmentVariable = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `DELETE FROM tbl_environment_variables WHERE id = ?`;

    connection.query(sql, [id], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, { status: true, message: "Variable deleted" });
    });
  });
};

// Get global variables
const getGlobalVariables = (workspaceId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      SELECT * FROM tbl_global_variables
      WHERE workspace_id = ?
      ORDER BY \`key\`
    `;

    connection.query(sql, [workspaceId], (err, results) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, results);
    });
  });
};

// Add global variable
const addGlobalVariable = (workspaceId, key, value, type, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      INSERT INTO tbl_global_variables (workspace_id, \`key\`, value, type)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(sql, [workspaceId, key, value || '', type || 'default'], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, {
        id: result.insertId,
        workspace_id: workspaceId,
        key: key,
        value: value || '',
        type: type || 'default'
      });
    });
  });
};

// Update global variable
const updateGlobalVariable = (id, key, value, type, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `
      UPDATE tbl_global_variables
      SET \`key\` = ?, value = ?, type = ?
      WHERE id = ?
    `;

    connection.query(sql, [key, value || '', type || 'default', id], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, { status: true, message: "Global variable updated" });
    });
  });
};

// Delete global variable
const deleteGlobalVariable = (id, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return callback(err);
    }

    const sql = `DELETE FROM tbl_global_variables WHERE id = ?`;

    connection.query(sql, [id], (err, result) => {
      connection.release();

      if (err) {
        console.error("Query error:", err);
        return callback(err);
      }

      return callback(null, { status: true, message: "Global variable deleted" });
    });
  });
};



module.exports = {
  addCollection,
  addFolder,
  getFolderDepth,
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
  getRequestsByRequestId,
  getRequestById,
  updateRequest,
  getWorkspaces,
  getCollectionsByWorkspace,
  findUserByEmail,
  createWorkspace,
  addMember,
  getWorkspaceById,
  getWorkspaceMembers,
  checkUserRole,
  isDefaultWorkspace,
  updateWorkspaceName,
  updateMemberRole,
  removeMember,
  isMember,
  deleteWorkspace,
  getCollectionById,
  searchRequests,
  saveRequest,
  getRequestsById,
  getEnvironments,
  getActiveEnvironment,
  addEnvironment,
  setActiveEnvironment,
  updateEnvironment,
  deleteEnvironment,
  getEnvironmentVariables,
  addEnvironmentVariable,
  updateEnvironmentVariable,
  deleteEnvironmentVariable,
  getGlobalVariables,
  addGlobalVariable,
  updateGlobalVariable,
  deleteGlobalVariable,
};
