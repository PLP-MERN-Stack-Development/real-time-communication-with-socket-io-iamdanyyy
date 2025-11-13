// MessageList.jsx - Component that displays all messages in the chat
// Handles rendering messages, system messages, typing indicators, and reactions

import { useEffect, useRef } from 'react';
import Message from './Message';
import './MessageList.css';

function MessageList({ 
  messages, 
  currentUsername, 
  typingUsers, 
  onReaction,
  onLoadOlder,
  showSearch,
  searchQuery 
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const hasLoadedOlder = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load older messages when scrolling to top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If scrolled near the top, load older messages
      if (container.scrollTop < 100 && !hasLoadedOlder.current && messages.length > 0) {
        const firstMessage = messages[0];
        if (firstMessage && !firstMessage.system) {
          onLoadOlder(firstMessage.id);
          hasLoadedOlder.current = true;
          
          // Reset flag after a delay
          setTimeout(() => {
            hasLoadedOlder.current = false;
          }, 1000);
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, onLoadOlder]);

  // Filter messages if search is active
  const displayedMessages = showSearch && searchQuery
    ? messages.filter(msg => 
        !msg.system && (
          msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : messages;

  return (
    <div className="message-list" ref={messagesContainerRef}>
      {displayedMessages.length === 0 ? (
        <div className="empty-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <>
          {displayedMessages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isOwn={message.sender === currentUsername || message.senderId === currentUsername}
              onReaction={onReaction}
            />
          ))}
          
          {/* Typing indicator */}
          {typingUsers && typingUsers.length > 0 && (
            <div className="typing-indicator">
              <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
              <span className="typing-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default MessageList;

