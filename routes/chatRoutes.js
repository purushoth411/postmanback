const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// All chat routes require authentication
router.use(authMiddleware);

// Channel routes
router.get('/channels', chatController.getChannels);
router.post('/channels', chatController.createChannel);

// Message routes
router.get('/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.put('/messages', chatController.updateMessage);
router.delete('/messages', chatController.deleteMessage);

// Notification routes
router.get('/notifications', chatController.getNotifications);
router.post('/notifications/read', chatController.markNotificationRead);
router.post('/notifications/read-all', chatController.markAllNotificationsRead);
router.get('/notifications/unread-count', chatController.getUnreadCount);

// Member routes (for mentions)
router.get('/members', chatController.getMembers);

module.exports = router;


