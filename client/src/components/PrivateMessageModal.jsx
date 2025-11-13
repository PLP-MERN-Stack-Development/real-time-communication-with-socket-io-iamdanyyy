// PrivateMessageModal.jsx - Modal for private messaging
// Allows sending direct messages to another user

import { useState, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './PrivateMessageModal.css';

function PrivateMessageModal({ user, currentUsername, onClose }) {
  const { 
    messages, 
    sendPrivateMessage, 
    setTyping,
    markAsRead,
    socket 
  } = useSocket();
  
  const [privateMessages, setPrivateMessages] = useState([]);

  // Filter messages to only show private messages with this user
  useEffect(() => {
    if (!socket || !socket.id) return;
    
    const filtered = messages.filter(msg => {
      if (!msg.isPrivate) return false;
      // Check if this message is between current user and selected user
      const isFromCurrentUser = msg.senderId === socket.id;
      const isToCurrentUser = msg.recipientId === socket.id;
      const isFromSelectedUser = msg.senderId === user.id;
      const isToSelectedUser = msg.recipientId === user.id;
      
      return (isFromCurrentUser && isToSelectedUser) || 
             (isFromSelectedUser && isToCurrentUser);
    });
    
    setPrivateMessages(filtered);
  }, [messages, user, socket]);

  // Handle sending private message
  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendPrivateMessage(user.id, message);
    }
  };

  // Mark as read when modal opens
  useEffect(() => {
    markAsRead('private');
  }, [markAsRead]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔒 Private Chat with {user.username}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-messages">
          {privateMessages.length === 0 ? (
            <div className="empty-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <MessageList
              messages={privateMessages}
              currentUsername={currentUsername}
              typingUsers={[]}
              onReaction={() => {}}
              onLoadOlder={() => {}}
              showSearch={false}
              searchQuery=""
            />
          )}
        </div>
        
        <div className="modal-input">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={(isTyping) => setTyping(isTyping, 'private')}
            currentRoom="private"
          />
        </div>
      </div>
    </div>
  );
}

export default PrivateMessageModal;

