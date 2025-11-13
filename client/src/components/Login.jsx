// Login.jsx - Login component for entering username
// Simple username-based authentication (no password needed for this assignment)

import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation - username must be at least 2 characters
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (username.trim().length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    // If valid, call the onLogin callback with the username
    onLogin(username.trim());
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>💬 Real-Time Chat</h1>
        <p className="subtitle">Enter your username to start chatting</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Enter your username..."
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(''); // Clear error when user types
            }}
            className="username-input"
            autoFocus
            maxLength={20}
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="login-button">
            Join Chat
          </button>
        </form>

        <p className="info-text">
          Built with Socket.io for real-time communication
        </p>
      </div>
    </div>
  );
}

export default Login;

