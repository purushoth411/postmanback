const db = require('../config/db');

const getUserByUserName = (username, callback) => {
    const sql = 'SELECT * FROM tbl_admin WHERE fld_username = ? LIMIT 1';
    db.query(sql, [username], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);
        return callback(null, results[0]);
    });
};

const getUserByEmail = (email, callback) => {
    const sql = 'SELECT * FROM tbl_users WHERE email = ? LIMIT 1';
    db.query(sql, [email], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);
        return callback(null, results[0]);
    });
};




const getAllUsers = (filters, callback) => {
  let sql = "SELECT * FROM tbl_admin WHERE fld_admin_type != 'SUPERADMIN'";
  const params = [];

  // Filter by usertype if provided
  if (filters.usertype.length > 0) {
    sql += " AND fld_admin_type IN (" + filters.usertype.map(() => "?").join(",") + ")";
    params.push(...filters.usertype.map(type => type.toUpperCase()));
  }

  // Filter by keyword
  if (filters.keyword && filters.keyword !== "") {
    sql += " AND (fld_name LIKE ? OR fld_email LIKE ?)";
    const search = `%${filters.keyword}%`;
    params.push(search, search);
  }

  db.query(sql, params, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

const getUserCount = (callback) => {
  const sql = `
    SELECT fld_admin_type, COUNT(*) as count 
    FROM tbl_admin 
    WHERE fld_admin_type IN ('EXECUTIVE', 'SUBADMIN', 'CONSULTANT', 'OPERATIONSADMIN')
    GROUP BY fld_admin_type
  `;

  db.query(sql, (err, results) => {
    if (err) return callback(err, null);

    // Convert array to object: { EXECUTIVE: 5, SUBADMIN: 3, ... }
    const counts = {};
    results.forEach(row => {
      counts[row.fld_admin_type] = row.count;
    });

    return callback(null, counts);
  });
};


const getAllUsersIncludingAdmin = (callback) =>{
    const sql = 'SELECT * from tbl_admin';
    db.query(sql, (err, results) => {
        if(err) return callback(err, null);
        return callback(null, results);
    })
}

// Add new user
const addUser = (userData, callback) => {
    const sql = 'INSERT INTO tbl_admin (fld_first_name, fld_email, fld_decrypt_password, fld_admin_type) VALUES (?, ?, ?, ?)';
    const { name, email, password, user_type } = userData;
    db.query(sql, [name, email, password, user_type], (err, result) => {
        if (err) return callback(err, null);
        return callback(null, result);
    });
};

// Update user
const updateUser = (id, userData, callback) => {
    const sql = 'UPDATE tbl_admin SET fld_first_name = ?, fld_email = ?, fld_decrypt_password = ?, fld_admin_type = ? WHERE id = ?';
    const { name, email, password, user_type } = userData;
    db.query(sql, [name, email, password, user_type, id], (err, result) => {
        if (err) return callback(err, null);
        return callback(null, result);
    });
};

// Delete user
const deleteUser = (id, callback) => {
    const sql = 'DELETE FROM tbl_admin WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return callback(err, null);
        return callback(null, result);
    });
};

module.exports = {
  getUserByEmail,
    getUserByUserName,
    getAllUsers,
    getUserCount,
    getAllUsersIncludingAdmin,
    addUser,
    updateUser,
    deleteUser
};
