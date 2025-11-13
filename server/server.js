// server.js - Main server file for Socket.io chat application
// This handles all the real-time communication between clients

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Set up Socket.io with CORS to allow React client to connect
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (in a real app, you'd use a database)
// Store all connected users with their socket IDs
const users = {};
// Store messages per room (global room is 'general')
const messages = {
  general: [],
};
// Track who's typing in each room
const typingUsers = {};
// Store message reactions (messageId -> { emoji: count })
const messageReactions = {};
// Track unread counts per user per room
const unreadCounts = {};

// Helper function to get or create a room's message array
function getRoomMessages(room) {
  if (!messages[room]) {
    messages[room] = [];
  }
  return messages[room];
}

// Socket.io connection handler - runs when a client connects
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a user joins with their username
  socket.on('user_join', ({ username, room = 'general' }) => {
    // Store user info
    users[socket.id] = { 
      username, 
      id: socket.id, 
      room,
      joinedAt: new Date().toISOString()
    };
    
    // Join the socket room (Socket.io feature for grouping sockets)
    socket.join(room);
    
    // Send updated user list to everyone
    io.emit('user_list', Object.values(users));
    
    // Notify everyone in the room that someone joined
    io.to(room).emit('user_joined', { 
      username, 
      id: socket.id,
      room 
    });
    
    // Send existing messages for this room to the new user
    socket.emit('message_history', getRoomMessages(room));
    
    console.log(`${username} joined room: ${room}`);
  });

  // Handle switching between chat rooms
  socket.on('join_room', ({ room, previousRoom }) => {
    if (users[socket.id]) {
      // Leave previous room
      if (previousRoom) {
        socket.leave(previousRoom);
        io.to(previousRoom).emit('user_left_room', {
          username: users[socket.id].username,
          room: previousRoom
        });
      }
      
      // Join new room
      socket.join(room);
      users[socket.id].room = room;
      
      // Notify room members
      io.to(room).emit('user_joined_room', {
        username: users[socket.id].username,
        room
      });
      
      // Send message history for new room
      socket.emit('message_history', getRoomMessages(room));
      
      // Send updated user list
      io.emit('user_list', Object.values(users));
    }
  });

  // Handle sending messages to a room
  socket.on('send_message', (messageData) => {
    const user = users[socket.id];
    if (!user) return;
    
    const room = messageData.room || user.room || 'general';
    
    const message = {
      id: Date.now() + Math.random(), // Unique ID
      message: messageData.message,
      sender: user.username,
      senderId: socket.id,
      room,
      timestamp: new Date().toISOString(),
      reactions: {},
    };
    
    // Add to room's message history
    const roomMessages = getRoomMessages(room);
    roomMessages.push(message);
    
    // Limit stored messages to prevent memory issues (keep last 500 per room)
    if (roomMessages.length > 500) {
      roomMessages.shift();
    }
    
    // Send message to everyone in the room
    io.to(room).emit('receive_message', message);
    
    // Update unread counts for users not in this room
    Object.keys(users).forEach(userId => {
      if (userId !== socket.id && users[userId].room !== room) {
        if (!unreadCounts[userId]) unreadCounts[userId] = {};
        if (!unreadCounts[userId][room]) unreadCounts[userId][room] = 0;
        unreadCounts[userId][room]++;
        io.to(userId).emit('unread_update', unreadCounts[userId]);
      }
    });
  });

  // Handle typing indicators
  socket.on('typing', ({ isTyping, room = 'general' }) => {
    if (!users[socket.id]) return;
    
    const username = users[socket.id].username;
    
    if (!typingUsers[room]) {
      typingUsers[room] = {};
    }
    
    if (isTyping) {
      typingUsers[room][socket.id] = username;
    } else {
      delete typingUsers[room][socket.id];
    }
    
    // Send typing status to everyone in the room (except the typer)
    socket.to(room).emit('typing_users', {
      room,
      users: Object.values(typingUsers[room] || {})
    });
  });

  // Handle private messages between two users
  socket.on('private_message', ({ to, message }) => {
    const sender = users[socket.id];
    if (!sender) return;
    
    const messageData = {
      id: Date.now() + Math.random(),
      sender: sender.username,
      senderId: socket.id,
      recipientId: to,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
      reactions: {},
    };
    
    // Send to recipient
    socket.to(to).emit('private_message', messageData);
    // Also send back to sender so they see their own message
    socket.emit('private_message', messageData);
    
    // Update unread count for recipient
    if (!unreadCounts[to]) unreadCounts[to] = {};
    if (!unreadCounts[to].private) unreadCounts[to].private = 0;
    unreadCounts[to].private++;
    io.to(to).emit('unread_update', unreadCounts[to]);
  });

  // Handle message reactions (like, love, etc.)
  socket.on('add_reaction', ({ messageId, emoji, room = 'general' }) => {
    const user = users[socket.id];
    if (!user) return;
    
    const roomMessages = getRoomMessages(room);
    const message = roomMessages.find(m => m.id === messageId);
    
    if (message) {
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }
      
      // Check if user already reacted with this emoji
      const existingIndex = message.reactions[emoji].indexOf(user.username);
      if (existingIndex > -1) {
        // Remove reaction if already exists
        message.reactions[emoji].splice(existingIndex, 1);
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji];
        }
      } else {
        // Add reaction
        message.reactions[emoji].push(user.username);
      }
      
      // Broadcast updated message to room
      io.to(room).emit('message_updated', message);
    }
  });

  // Handle marking messages as read
  socket.on('mark_read', ({ room }) => {
    if (unreadCounts[socket.id]) {
      unreadCounts[socket.id][room] = 0;
      io.to(socket.id).emit('unread_update', unreadCounts[socket.id]);
    }
  });

  // Handle searching messages
  socket.on('search_messages', ({ query, room = 'general' }) => {
    const roomMessages = getRoomMessages(room);
    const results = roomMessages.filter(msg => 
      msg.message.toLowerCase().includes(query.toLowerCase()) ||
      msg.sender.toLowerCase().includes(query.toLowerCase())
    );
    socket.emit('search_results', results);
  });

  // Handle requesting older messages (pagination)
  socket.on('get_older_messages', ({ room = 'general', beforeId, limit = 20 }) => {
    const roomMessages = getRoomMessages(room);
    let olderMessages = roomMessages;
    
    // If beforeId is provided, get messages before that ID
    if (beforeId) {
      const beforeIndex = roomMessages.findIndex(m => m.id === beforeId);
      if (beforeIndex > 0) {
        olderMessages = roomMessages.slice(
          Math.max(0, beforeIndex - limit),
          beforeIndex
        );
      } else {
        olderMessages = [];
      }
    } else {
      // Get last N messages
      olderMessages = roomMessages.slice(-limit);
    }
    
    socket.emit('older_messages', olderMessages);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username, room } = users[socket.id];
      
      // Notify everyone that user left
      io.to(room).emit('user_left', { 
        username, 
        id: socket.id,
        room 
      });
      
      // Clean up
      delete users[socket.id];
      delete unreadCounts[socket.id];
      
      // Clean up typing indicators
      Object.keys(typingUsers).forEach(r => {
        if (typingUsers[r][socket.id]) {
          delete typingUsers[r][socket.id];
          io.to(r).emit('typing_users', {
            room: r,
            users: Object.values(typingUsers[r] || {})
          });
        }
      });
      
      // Send updated user list
      io.emit('user_list', Object.values(users));
      
      console.log(`${username} left the chat`);
    }
  });
});

// API routes for REST endpoints

// Get all messages for a room
app.get('/api/messages/:room?', (req, res) => {
  const room = req.params.room || 'general';
  res.json(getRoomMessages(room));
});

// Get all connected users
app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Get available rooms
app.get('/api/rooms', (req, res) => {
  res.json(Object.keys(messages));
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Socket.io Chat Server is running',
    status: 'ok'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
}); 