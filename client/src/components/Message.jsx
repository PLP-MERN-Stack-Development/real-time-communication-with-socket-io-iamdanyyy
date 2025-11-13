// Message.jsx - Individual message component
// Displays a single message with sender, timestamp, reactions, etc.

import { useState } from 'react';
import './Message.css';

// Common emoji reactions
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function Message({ message, isOwn, onReaction }) {
  const [showReactions, setShowReactions] = useState(false);

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If less than a minute ago, show "just now"
    if (diff < 60000) {
      return 'just now';
    }
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle adding a reaction
  const handleReaction = (emoji) => {
    if (onReaction) {
      onReaction(message.id, emoji, message.room);
    }
    setShowReactions(false);
  };

  // System messages (join/leave notifications)
  if (message.system) {
    return (
      <div className="message system-message">
        <span>{message.message}</span>
      </div>
    );
  }

  // Private messages have different styling
  const isPrivate = message.isPrivate;

  return (
    <div className={`message ${isOwn ? 'own-message' : 'other-message'} ${isPrivate ? 'private-message' : ''}`}>
      {!isOwn && (
        <div className="message-sender">
          {isPrivate && '🔒 '}
          {message.sender}
        </div>
      )}
      
      <div className="message-content">
        <p>{message.message}</p>
        
        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                className="reaction-badge"
                onClick={() => handleReaction(emoji)}
                title={users.join(', ')}
              >
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
        
        {/* Reaction button */}
        <button
          className="add-reaction-btn"
          onClick={() => setShowReactions(!showReactions)}
          title="Add reaction"
        >
          +
        </button>
        
        {/* Reaction picker */}
        {showReactions && (
          <div className="reaction-picker">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                className="reaction-emoji"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="message-time">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}

export default Message;

