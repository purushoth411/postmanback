// socket.js
const { Server } = require("socket.io");

let io;
const connectedUsers = {}; // userId -> socketId

module.exports = {
    init: (server) => {
        io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);

            // Register userId to socketId mapping
            socket.on("registerUser", (userId) => {
                connectedUsers[userId] = socket.id;
                socket.join(`user:${userId}`); // Join user-specific room for notifications
                console.log(`User registered: ${userId} -> ${socket.id}`);
            });

            // Join workspace room for chat
            socket.on("joinWorkspace", (workspaceId) => {
                socket.join(`workspace:${workspaceId}`);
                console.log(`Socket ${socket.id} joined workspace: ${workspaceId}`);
            });

            // Leave workspace room
            socket.on("leaveWorkspace", (workspaceId) => {
                socket.leave(`workspace:${workspaceId}`);
                console.log(`Socket ${socket.id} left workspace: ${workspaceId}`);
            });

            // Join channel room for real-time updates
            socket.on("joinChannel", (channelId) => {
                socket.join(`channel:${channelId}`);
                console.log(`Socket ${socket.id} joined channel: ${channelId}`);
            });

            // Leave channel room
            socket.on("leaveChannel", (channelId) => {
                socket.leave(`channel:${channelId}`);
                console.log(`Socket ${socket.id} left channel: ${channelId}`);
            });

            // Cleanup on disconnect
            socket.on("disconnect", () => {
                for (let [userId, id] of Object.entries(connectedUsers)) {
                    if (id === socket.id) {
                        delete connectedUsers[userId];
                        console.log(`User disconnected: ${userId}`);
                        break;
                    }
                }
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) throw new Error("Socket.io not initialized");
        return io;
    },
    getConnectedUsers: () => connectedUsers
};
