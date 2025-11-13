// MessageInput.jsx - Input component for typing and sending messages
// Handles typing indicators and message submission

import { useState, useEffect, useRef } from 'react';
import './MessageInput.css';

function MessageInput({ onSendMessage, onTyping, currentRoom }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user is typing, send typing indicator
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true, currentRoom);
    }

    // Set timeout to stop typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false, currentRoom);
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, currentRoom, onTyping, isTyping]);

  // Clean up typing indicator on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTyping(false, currentRoom);
      }
    };
  }, [currentRoom, isTyping, onTyping]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTyping(false, currentRoom);
      }
    }
  };

  // Handle Enter key (submit) or Shift+Enter (new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message #${currentRoom}...`}
          className="message-input"
          maxLength={500}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageInput;

