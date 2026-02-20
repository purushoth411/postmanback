# Chat Module Documentation

## Overview
A comprehensive real-time chat module for workspace members with mentions, notifications, and workspace-level channels.

## Features Implemented

### ✅ Workspace-level Channels
- Default "general" channel created automatically for each workspace
- Users can create additional channels
- Channel list displayed in sidebar

### ✅ Member Mentions (@username)
- Type `@username` in messages to mention members
- Mentions are highlighted in the chat
- Notifications sent to mentioned users
- Mentions stored in database for tracking

### ✅ Notifications (In-app)
- Real-time notification panel
- Unread notification count badge
- Mark individual or all notifications as read
- Different notification types with icons:
  - Workspace created
  - Member added/removed/updated
  - Message mentions
  - Channel created

### ✅ Workspace Notifications
- **Workspace Created**: Notifications sent to all added members
- **Member Added**: Notification sent to the added member
- **Member Removed**: Notification sent (if needed)
- **Member Updated**: Notification sent (if needed)

### ✅ Database Structure
Clean, normalized database schema with:
- `tbl_chat_channels` - Workspace channels
- `tbl_chat_messages` - Chat messages
- `tbl_chat_mentions` - User mentions in messages
- `tbl_notifications` - In-app notifications
- `tbl_chat_read_receipts` - Message read tracking

### ✅ Scalable Architecture
- Node.js backend with Express
- React frontend with Socket.IO
- Real-time updates via WebSocket
- Room-based socket connections (workspace/channel/user)

## Database Setup

Run the SQL schema file to create tables:
```sql
-- Run: public/chat_schema.sql
```

## API Endpoints

### Chat Routes (`/api/chat`)
- `GET /channels?workspace_id=X` - Get channels for workspace
- `POST /channels` - Create new channel
- `GET /messages?channel_id=X` - Get messages for channel
- `POST /messages` - Send message
- `GET /notifications` - Get user notifications
- `POST /notifications/read` - Mark notification as read
- `POST /notifications/read-all` - Mark all as read
- `GET /notifications/unread-count` - Get unread count
- `GET /members?workspace_id=X` - Get workspace members (for mentions)

## Socket.IO Events

### Client → Server
- `registerUser(userId)` - Register user for notifications
- `joinWorkspace(workspaceId)` - Join workspace room
- `leaveWorkspace(workspaceId)` - Leave workspace room
- `joinChannel(channelId)` - Join channel room
- `leaveChannel(channelId)` - Leave channel room

### Server → Client
- `messageSent` - New message in channel
- `channelCreated` - New channel created
- `notification` - New notification received

## Frontend Components

### ChatPanel (`src/components/Chat/ChatPanel.jsx`)
- Main chat interface
- Channel sidebar
- Message list with mentions highlighting
- Message input with @mention support
- Create channel modal

### NotificationPanel (`src/components/Chat/NotificationPanel.jsx`)
- Notification list
- Unread count badge
- Mark as read functionality
- Different notification types with icons

### Integration
- Chat button in Header (only visible when workspace selected)
- Notification button in Header with unread count badge
- Panels slide in from right side

## Usage

1. **Select a workspace** - Chat and notification buttons appear in header
2. **Open Chat** - Click chat icon to open chat panel
3. **Select Channel** - Choose a channel from sidebar (default: "general")
4. **Send Messages** - Type message and press Enter or click Send
5. **Mention Users** - Type `@username` to mention someone
6. **View Notifications** - Click bell icon to see notifications
7. **Create Channels** - Click "New" button in channel sidebar

## Notification Types

- `workspace_created` - You were added to a workspace
- `member_added` - You were added as a member
- `member_removed` - You were removed from workspace
- `member_updated` - Your role was updated
- `message_mention` - You were mentioned in a message
- `channel_created` - A new channel was created

## Security

- All chat routes require authentication (`authMiddleware`)
- Users can only access channels in workspaces they belong to
- Mentions only work for workspace members
- Notifications are user-specific

## Future Enhancements

- File attachments in messages
- Message reactions/emojis
- Thread replies
- Direct messages (DM)
- Typing indicators
- Message search
- Channel permissions/roles
- Message editing/deletion


