// socket.js - Socket.io client setup
// This file handles all the Socket.io connection logic and provides a custom hook

import { io } from 'socket.io-client';
import { useEffect, useState, useCallback, useRef } from 'react';

// Socket.io connection URL - can be set via environment variable
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance with reconnection settings
// autoConnect: false means we'll connect manually after user logs in
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity, // Keep trying to reconnect
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Custom hook for using socket.io throughout the app
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const currentUserRef = useRef(null);
  const notificationSoundRef = useRef(null);

  // Initialize notification sound (if browser supports it)
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      notificationSoundRef.current = audioContext;
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = notificationSoundRef.current;
      if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (e) {
      // Fallback: try HTML5 audio if available
      console.log('Could not play sound');
    }
  }, []);

  // Show browser notification (requires permission)
  const showBrowserNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect to socket server with username
  const connect = useCallback((username, room = 'general') => {
    currentUserRef.current = { username, room };
    socket.connect();
    socket.emit('user_join', { username, room });
    setCurrentRoom(room);
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    socket.disconnect();
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
    currentUserRef.current = null;
  }, []);

  // Send a message to current room
  const sendMessage = useCallback((message, room = null) => {
    socket.emit('send_message', { 
      message, 
      room: room || currentRoom 
    });
  }, [currentRoom]);

  // Send a private message to another user
  const sendPrivateMessage = useCallback((to, message) => {
    socket.emit('private_message', { to, message });
  }, []);

  // Set typing status
  const setTyping = useCallback((isTyping, room = null) => {
    socket.emit('typing', { 
      isTyping, 
      room: room || currentRoom 
    });
  }, [currentRoom]);

  // Join a different room
  const joinRoom = useCallback((room) => {
    if (room !== currentRoom) {
      socket.emit('join_room', { 
        room, 
        previousRoom: currentRoom 
      });
      setCurrentRoom(room);
      setMessages([]); // Clear messages when switching rooms
      // Mark as read when joining
      socket.emit('mark_read', { room });
    }
  }, [currentRoom]);

  // Add reaction to a message
  const addReaction = useCallback((messageId, emoji, room = null) => {
    socket.emit('add_reaction', { 
      messageId, 
      emoji, 
      room: room || currentRoom 
    });
  }, [currentRoom]);

  // Search messages
  const searchMessages = useCallback((query, room = null) => {
    socket.emit('search_messages', { 
      query, 
      room: room || currentRoom 
    });
  }, [currentRoom]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback((beforeId = null, limit = 20) => {
    socket.emit('get_older_messages', { 
      room: currentRoom, 
      beforeId, 
      limit 
    });
  }, [currentRoom]);

  // Mark messages as read
  const markAsRead = useCallback((room) => {
    socket.emit('mark_read', { room });
  }, []);

  // Socket event listeners - set up all the event handlers
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
      console.log('Connected to server');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Play sound and show notification if message is not from current user
      // and not in current room (or is private)
      if (message.senderId !== socket.id) {
        if (message.isPrivate || message.room !== currentRoom) {
          playNotificationSound();
          showBrowserNotification(
            message.isPrivate ? `Private from ${message.sender}` : `New message in ${message.room}`,
            message.message
          );
        }
      }
    };

    const onPrivateMessage = (message) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Always notify for private messages
      if (message.senderId !== socket.id) {
        playNotificationSound();
        showBrowserNotification(
          `Private from ${message.sender}`,
          message.message
        );
      }
    };

    const onMessageHistory = (history) => {
      setMessages(history);
    };

    const onMessageUpdated = (message) => {
      setMessages((prev) => 
        prev.map(m => m.id === message.id ? message : m)
      );
    };

    const onOlderMessages = (olderMessages) => {
      setMessages((prev) => [...olderMessages, ...prev]);
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (data) => {
      // Add system message when someone joins
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          system: true,
          message: `${data.username} joined ${data.room}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          system: true,
          message: `${data.username} left ${data.room}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserJoinedRoom = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          system: true,
          message: `${data.username} joined ${data.room}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (data) => {
      if (data.room === currentRoom) {
        setTypingUsers(data.users);
      }
    };

    // Unread counts
    const onUnreadUpdate = (counts) => {
      setUnreadCounts(counts);
    };

    // Search results
    const onSearchResults = (results) => {
      setSearchResults(results);
    };

    // Register all event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('message_history', onMessageHistory);
    socket.on('message_updated', onMessageUpdated);
    socket.on('older_messages', onOlderMessages);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('user_joined_room', onUserJoinedRoom);
    socket.on('typing_users', onTypingUsers);
    socket.on('unread_update', onUnreadUpdate);
    socket.on('search_results', onSearchResults);

    // Clean up event listeners when component unmounts
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('message_history', onMessageHistory);
      socket.off('message_updated', onMessageUpdated);
      socket.off('older_messages', onOlderMessages);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('user_joined_room', onUserJoinedRoom);
      socket.off('typing_users', onTypingUsers);
      socket.off('unread_update', onUnreadUpdate);
      socket.off('search_results', onSearchResults);
    };
  }, [currentRoom, playNotificationSound, showBrowserNotification]);

  return {
    socket,
    isConnected,
    messages,
    users,
    typingUsers,
    currentRoom,
    unreadCounts,
    searchResults,
    currentUser: currentUserRef.current,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    joinRoom,
    addReaction,
    searchMessages,
    loadOlderMessages,
    markAsRead,
  };
};

export default socket; 