// Chat.jsx - Main chat interface component
// This component brings together all the chat features

import { useEffect, useState } from 'react';
import { useSocket } from '../socket/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import RoomList from './RoomList';
import PrivateMessageModal from './PrivateMessageModal';
import './Chat.css';

function Chat({ username, onLogout }) {
  const {
    isConnected,
    messages,
    users,
    typingUsers,
    currentRoom,
    unreadCounts,
    connect,
    disconnect,
    sendMessage,
    setTyping,
    joinRoom,
    addReaction,
    searchMessages,
    loadOlderMessages,
    markAsRead,
  } = useSocket();

  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Connect when component mounts
  useEffect(() => {
    connect(username, 'general');
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [username, connect, disconnect]);

  // Mark messages as read when room changes
  useEffect(() => {
    if (currentRoom) {
      markAsRead(currentRoom);
    }
  }, [currentRoom, markAsRead]);

  // Handle sending a message
  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(message, currentRoom);
    }
  };

  // Handle starting a private message
  const handleStartPrivateMessage = (user) => {
    setSelectedUser(user);
    setShowPrivateModal(true);
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchMessages(query, currentRoom);
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  };

  // Get unread count for current room
  const getUnreadCount = (room) => {
    return unreadCounts[room] || 0;
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <h2>💬 Real-Time Chat</h2>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="header-right">
          <span className="username-display">👤 {username}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="chat-main">
        {/* Sidebar with rooms and users */}
        <aside className="chat-sidebar">
          <RoomList
            currentRoom={currentRoom}
            onJoinRoom={joinRoom}
            unreadCounts={unreadCounts}
          />
          
          <UserList
            users={users}
            currentUsername={username}
            onStartPrivateMessage={handleStartPrivateMessage}
          />
        </aside>

        {/* Main chat area */}
        <main className="chat-content">
          {/* Room header */}
          <div className="room-header">
            <h3>#{currentRoom}</h3>
            <div className="room-actions">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Messages */}
          <MessageList
            messages={messages}
            currentUsername={username}
            typingUsers={typingUsers}
            onReaction={addReaction}
            onLoadOlder={loadOlderMessages}
            showSearch={showSearch}
            searchQuery={searchQuery}
          />

          {/* Message input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={setTyping}
            currentRoom={currentRoom}
          />
        </main>
      </div>

      {/* Private message modal */}
      {showPrivateModal && selectedUser && (
        <PrivateMessageModal
          user={selectedUser}
          currentUsername={username}
          onClose={() => {
            setShowPrivateModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

export default Chat;

