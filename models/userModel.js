const db = require("../config/db");

const getUserByUserName = (username, callback) => {
  const sql = "SELECT * FROM tbl_admin WHERE fld_username = ? LIMIT 1";
  db.query(sql, [username], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);
    return callback(null, results[0]);
  });
};

const getUserByEmail = (email, callback) => {
  const sql = "SELECT * FROM tbl_users WHERE email = ? LIMIT 1";
  db.query(sql, [email], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);
    return callback(null, results[0]);
  });
};

// check if email exists
const checkEmailExists = (email, callback) => {
  const sql = "SELECT id FROM tbl_users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0); // true if exists
  });
};

// insert user
const insertUser = (name, email, password, callback) => {
  const sql = "INSERT INTO tbl_users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, password], (err, result) => {
    if (err) return callback(err);
    callback(null, result.insertId); // return inserted userId
  });
};

// create workspace (example if you need)
const createWorkspace = (userId, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = "INSERT INTO tbl_workspaces (user_id,name, is_default_wks) VALUES (?,?, 1)";
    connection.query(sql, [userId,"My Workspace"], (err, result) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      const workspaceId = result.insertId;

      // Insert into workspace_members
      const sqlMember = "INSERT INTO tbl_workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'OWNER')";
      connection.query(sqlMember, [workspaceId, userId], (err) => {
        connection.release();
        if (err) return callback(err);

        return callback(null, workspaceId);
      });
    });
  });
};

module.exports = {
  getUserByEmail,
  getUserByUserName,
  createWorkspace,
  insertUser,
  checkEmailExists,
};
