const chatModel = require('../models/chatModel');
const { getIO } = require('../socket');

// Helper function to get user_id from authenticated session
const getUserId = (req) => {
  return req.user?.id || req.session?.user?.id || req.body.user_id;
};

// Helper function to extract mentions from message text
const extractMentions = (message) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.push(match[1]); // Extract username
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

// Get channels for a workspace
const getChannels = (req, res) => {
  try {
    const workspace_id = req.query.workspace_id;
    const user_id = getUserId(req);

    if (!workspace_id || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing workspace_id or user_id' });
    }

    chatModel.getChannelsByWorkspace(workspace_id, (err, channels) => {
      if (err) {
        console.error('Error fetching channels:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.json({ status: true, channels });
    });
  } catch (error) {
    console.error('Error in getChannels:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Create a new channel
const createChannel = (req, res) => {
  try {
    const { workspace_id, name, description } = req.body;
    const user_id = getUserId(req);

    if (!workspace_id || !name || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    chatModel.createChannel(workspace_id, name, description || null, user_id, (err, result) => {
      if (err) {
        console.error('Error creating channel:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      // Get the created channel
      chatModel.getChannelsByWorkspace(workspace_id, (err, channels) => {
        if (err) {
          return res.status(500).json({ status: false, message: 'Error fetching channel' });
        }

        const newChannel = channels.find(c => c.id === result.insertId);

        // Emit socket event
        const io = getIO();
        io.to(`workspace:${workspace_id}`).emit('channelCreated', {
          workspaceId: workspace_id,
          channel: newChannel,
        });

        return res.status(201).json({ status: true, message: 'Channel created', channel: newChannel });
      });
    });
  } catch (error) {
    console.error('Error in createChannel:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Get messages for a workspace (workspace-level chat)
const getMessages = (req, res) => {
  try {
    const workspace_id = req.query.workspace_id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const user_id = getUserId(req);

    if (!workspace_id || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing workspace_id or user_id' });
    }

    chatModel.getMessagesByWorkspace(workspace_id, limit, offset, (err, messages) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      // Get mentions for each message
      const messagesWithMentions = [];
      let processed = 0;

      if (messages.length === 0) {
        return res.json({ status: true, messages: [] });
      }

      messages.forEach((message, index) => {
        chatModel.getMentionsByMessage(message.id, (err, mentions) => {
          processed++;
          messagesWithMentions[index] = {
            ...message,
            mentions: mentions || [],
          };

          if (processed === messages.length) {
            return res.json({ status: true, messages: messagesWithMentions });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Send a message (workspace-level)
const sendMessage = (req, res) => {
  try {
    const { workspace_id, message } = req.body;
    const user_id = getUserId(req);

    if (!workspace_id || !message || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    // Extract mentions from message
    const mentionedUsernames = extractMentions(message);

    chatModel.createMessage(workspace_id, user_id, message, null, (err, newMessage) => {
      if (err) {
        console.error('Error creating message:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      // Get workspace members to match usernames with user IDs
      chatModel.getWorkspaceMembers(workspace_id, (err, members) => {
        if (err) {
          console.error('Error fetching members:', err);
          // Continue without mentions
          return handleMessageCreated(newMessage, workspace_id, []);
        }

        // Match usernames to user IDs
        const mentionedUserIds = [];
        mentionedUsernames.forEach(username => {
          const member = members.find(m => 
            m.name.toLowerCase() === username.toLowerCase() || 
            m.email.toLowerCase() === username.toLowerCase()
          );
          if (member) {
            mentionedUserIds.push(member.id);
          }
        });

        // Create mentions
        if (mentionedUserIds.length > 0) {
          chatModel.createMentions(newMessage.id, mentionedUserIds, (err) => {
            if (err) {
              console.error('Error creating mentions:', err);
            }
            handleMessageCreated(newMessage, workspace_id, mentionedUserIds, members);
          });
        } else {
          handleMessageCreated(newMessage, workspace_id, [], members);
        }
      });
    });

    function handleMessageCreated(message, workspace_id, mentionedUserIds, members = []) {
      // Create notifications for mentioned users
      if (mentionedUserIds.length > 0) {
        const sender = members.find(m => m.id === user_id) || { name: 'Someone' };
        mentionedUserIds.forEach(mentionedUserId => {
          chatModel.createNotification(
            mentionedUserId,
            workspace_id,
            'message_mention',
            `You were mentioned in a message`,
            `${sender.name} mentioned you in workspace chat`,
            user_id,
            message.id,
            (err) => {
              if (err) console.error('Error creating mention notification:', err);
            }
          );
        });
      }

      // Emit socket event
      const io = getIO();
      io.to(`workspace:${workspace_id}`).emit('messageSent', {
        workspaceId: workspace_id,
        message: {
          ...message,
          mentions: mentionedUserIds.map(id => ({ mentioned_user_id: id })),
        },
      });

      // Emit to mentioned users specifically
      mentionedUserIds.forEach(userId => {
        io.to(`user:${userId}`).emit('notification', {
          type: 'message_mention',
          workspaceId: workspace_id,
          messageId: message.id,
        });
      });

      return res.status(201).json({
        status: true,
        message: 'Message sent',
        data: {
          ...message,
          mentions: mentionedUserIds,
        },
      });
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Update a message
const updateMessage = (req, res) => {
  try {
    const { message_id, message } = req.body;
    const user_id = getUserId(req);

    if (!message_id || !message || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    chatModel.updateMessage(message_id, user_id, message, (err, updatedMessage) => {
      if (err) {
        console.error('Error updating message:', err);
        if (err.message === 'Message not found or unauthorized') {
          return res.status(403).json({ status: false, message: err.message });
        }
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      // Emit socket event
      const io = getIO();
      io.to(`workspace:${updatedMessage.workspace_id}`).emit('messageUpdated', {
        workspaceId: updatedMessage.workspace_id,
        message: updatedMessage,
      });

      return res.json({
        status: true,
        message: 'Message updated',
        data: updatedMessage,
      });
    });
  } catch (error) {
    console.error('Error in updateMessage:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Delete a message
const deleteMessage = (req, res) => {
  try {
    const { message_id } = req.body;
    const user_id = getUserId(req);

    if (!message_id || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    // First get the message to get workspace_id before deleting
    const db = require('../config/db');
    db.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      const sql = `SELECT workspace_id FROM tbl_chat_messages WHERE id = ?`;
      connection.query(sql, [message_id], (err, results) => {
        const workspace_id = results[0]?.workspace_id;
        connection.release();

        if (err) {
          console.error('Error fetching message:', err);
          return res.status(500).json({ status: false, message: 'Database error' });
        }

        chatModel.deleteMessage(message_id, user_id, (err, result) => {
          if (err) {
            console.error('Error deleting message:', err);
            if (err.message === 'Message not found or unauthorized') {
              return res.status(403).json({ status: false, message: err.message });
            }
            return res.status(500).json({ status: false, message: 'Database error' });
          }

          // Emit socket event
          if (workspace_id) {
            const io = getIO();
            io.to(`workspace:${workspace_id}`).emit('messageDeleted', {
              workspaceId: workspace_id,
              messageId: message_id,
            });
          }

          return res.json({
            status: true,
            message: 'Message deleted',
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Get notifications
const getNotifications = (req, res) => {
  try {
    const user_id = getUserId(req);
    const limit = parseInt(req.query.limit) || 50;

    if (!user_id) {
      return res.status(400).json({ status: false, message: 'Missing user_id' });
    }

    chatModel.getNotificationsByUser(user_id, limit, (err, notifications) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.json({ status: true, notifications });
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Mark notification as read
const markNotificationRead = (req, res) => {
  try {
    const notification_id = req.body.notification_id;
    const user_id = getUserId(req);

    if (!notification_id || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing notification_id or user_id' });
    }

    chatModel.markNotificationAsRead(notification_id, user_id, (err, result) => {
      if (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.json({ status: true, message: 'Notification marked as read' });
    });
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Mark all notifications as read
const markAllNotificationsRead = (req, res) => {
  try {
    const user_id = getUserId(req);

    if (!user_id) {
      return res.status(400).json({ status: false, message: 'Missing user_id' });
    }

    chatModel.markAllNotificationsAsRead(user_id, (err, result) => {
      if (err) {
        console.error('Error marking all notifications as read:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.json({ status: true, message: 'All notifications marked as read' });
    });
  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Get unread notification count
const getUnreadCount = (req, res) => {
  try {
    const user_id = getUserId(req);

    if (!user_id) {
      return res.status(400).json({ status: false, message: 'Missing user_id' });
    }

    chatModel.getUnreadNotificationCount(user_id, (err, count) => {
      if (err) {
        console.error('Error fetching unread count:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.json({ status: true, count });
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Get workspace members for mentions
const getMembers = (req, res) => {
  try {
    const workspace_id = req.query.workspace_id;
    const user_id = getUserId(req);

    if (!workspace_id || !user_id) {
      return res.status(400).json({ status: false, message: 'Missing workspace_id or user_id' });
    }

    chatModel.getWorkspaceMembers(workspace_id, (err, members) => {
      if (err) {
        console.error('Error fetching members:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.json({ status: true, members });
    });
  } catch (error) {
    console.error('Error in getMembers:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

module.exports = {
  getChannels,
  createChannel,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  getMembers,
};


