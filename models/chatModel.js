const db = require('../config/db');

// Create default channel for workspace
const createDefaultChannel = (workspace_id, user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_chat_channels (workspace_id, name, description, created_by)
      VALUES (?, 'general', 'General discussion channel', ?)
      ON DUPLICATE KEY UPDATE id=id
    `;
    
    connection.query(sql, [workspace_id, user_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Get channels for a workspace
const getChannelsByWorkspace = (workspace_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT c.*, u.name as creator_name
      FROM tbl_chat_channels c
      LEFT JOIN tbl_users u ON c.created_by = u.id
      WHERE c.workspace_id = ?
      ORDER BY c.created_at ASC
    `;
    
    connection.query(sql, [workspace_id], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

// Create a new channel
const createChannel = (workspace_id, name, description, user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_chat_channels (workspace_id, name, description, created_by)
      VALUES (?, ?, ?, ?)
    `;
    
    connection.query(sql, [workspace_id, name, description, user_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Get messages for a workspace (workspace-level chat)
const getMessagesByWorkspace = (workspace_id, limit = 50, offset = 0, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT m.*, u.name as user_name, u.email as user_email
      FROM tbl_chat_messages m
      LEFT JOIN tbl_users u ON m.user_id = u.id
      WHERE m.workspace_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    connection.query(sql, [workspace_id, limit, offset], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results.reverse()); // Reverse to show oldest first
    });
  });
};

// Get messages for a channel (kept for backward compatibility)
const getMessagesByChannel = (channel_id, limit = 50, offset = 0, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT m.*, u.name as user_name, u.email as user_email
      FROM tbl_chat_messages m
      LEFT JOIN tbl_users u ON m.user_id = u.id
      WHERE m.channel_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    connection.query(sql, [channel_id, limit, offset], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results.reverse()); // Reverse to show oldest first
    });
  });
};

// Create a message (workspace-level, channel_id can be null)
const createMessage = (workspace_id, user_id, message, channel_id = null, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_chat_messages (workspace_id, user_id, message, channel_id)
      VALUES (?, ?, ?, ?)
    `;
    
    connection.query(sql, [workspace_id, user_id, message, channel_id], (err, result) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      // Get the created message with user info
      const getMessageSql = `
        SELECT m.*, u.name as user_name, u.email as user_email
        FROM tbl_chat_messages m
        LEFT JOIN tbl_users u ON m.user_id = u.id
        WHERE m.id = ?
      `;
      
      connection.query(getMessageSql, [result.insertId], (err, messageResult) => {
        connection.release();
        if (err) return callback(err);
        callback(null, messageResult[0]);
      });
    });
  });
};

// Update a message
const updateMessage = (message_id, user_id, message, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      UPDATE tbl_chat_messages
      SET message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
    
    connection.query(sql, [message, message_id, user_id], (err, result) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      if (result.affectedRows === 0) {
        connection.release();
        return callback(new Error('Message not found or unauthorized'));
      }

      // Get the updated message with user info
      const getMessageSql = `
        SELECT m.*, u.name as user_name, u.email as user_email
        FROM tbl_chat_messages m
        LEFT JOIN tbl_users u ON m.user_id = u.id
        WHERE m.id = ?
      `;
      
      connection.query(getMessageSql, [message_id], (err, messageResult) => {
        connection.release();
        if (err) return callback(err);
        callback(null, messageResult[0]);
      });
    });
  });
};

// Delete a message
const deleteMessage = (message_id, user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      DELETE FROM tbl_chat_messages
      WHERE id = ? AND user_id = ?
    `;
    
    connection.query(sql, [message_id, user_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      
      if (result.affectedRows === 0) {
        return callback(new Error('Message not found or unauthorized'));
      }
      
      callback(null, result);
    });
  });
};

// Create mentions
const createMentions = (message_id, mentioned_user_ids, callback) => {
  if (!mentioned_user_ids || mentioned_user_ids.length === 0) {
    return callback(null, []);
  }

  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const values = mentioned_user_ids.map(user_id => [message_id, user_id]);
    const sql = `
      INSERT INTO tbl_chat_mentions (message_id, mentioned_user_id)
      VALUES ?
      ON DUPLICATE KEY UPDATE id=id
    `;
    
    connection.query(sql, [values], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Get mentions for a message
const getMentionsByMessage = (message_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT m.*, u.name as user_name, u.email as user_email
      FROM tbl_chat_mentions m
      LEFT JOIN tbl_users u ON m.mentioned_user_id = u.id
      WHERE m.message_id = ?
    `;
    
    connection.query(sql, [message_id], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

// Create notification
const createNotification = (user_id, workspace_id, type, title, message, related_user_id, related_message_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_notifications (user_id, workspace_id, type, title, message, related_user_id, related_message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    connection.query(sql, [user_id, workspace_id, type, title, message, related_user_id, related_message_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Get notifications for a user
const getNotificationsByUser = (user_id, limit = 50, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT n.*, 
             u.name as related_user_name,
             w.name as workspace_name
      FROM tbl_notifications n
      LEFT JOIN tbl_users u ON n.related_user_id = u.id
      LEFT JOIN tbl_workspaces w ON n.workspace_id = w.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ?
    `;
    
    connection.query(sql, [user_id, limit], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

// Mark notification as read
const markNotificationAsRead = (notification_id, user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      UPDATE tbl_notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `;
    
    connection.query(sql, [notification_id, user_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Mark all notifications as read for a user
const markAllNotificationsAsRead = (user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      UPDATE tbl_notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `;
    
    connection.query(sql, [user_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Get unread notification count
const getUnreadNotificationCount = (user_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT COUNT(*) as count
      FROM tbl_notifications
      WHERE user_id = ? AND is_read = 0
    `;
    
    connection.query(sql, [user_id], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results[0]?.count || 0);
    });
  });
};

// Update read receipt
const updateReadReceipt = (user_id, channel_id, last_read_message_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      INSERT INTO tbl_chat_read_receipts (user_id, channel_id, last_read_message_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        last_read_message_id = VALUES(last_read_message_id),
        last_read_at = CURRENT_TIMESTAMP
    `;
    
    connection.query(sql, [user_id, channel_id, last_read_message_id], (err, result) => {
      connection.release();
      if (err) return callback(err);
      callback(null, result);
    });
  });
};

// Get workspace members for mentions
const getWorkspaceMembers = (workspace_id, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    const sql = `
      SELECT u.id, u.name, u.email, wm.role
      FROM tbl_workspace_members wm
      INNER JOIN tbl_users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
      ORDER BY wm.role ASC, u.name ASC
    `;
    
    connection.query(sql, [workspace_id], (err, results) => {
      connection.release();
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

module.exports = {
  createDefaultChannel,
  getChannelsByWorkspace,
  createChannel,
  getMessagesByChannel,
  getMessagesByWorkspace,
  createMessage,
  updateMessage,
  deleteMessage,
  createMentions,
  getMentionsByMessage,
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  updateReadReceipt,
  getWorkspaceMembers,
};


