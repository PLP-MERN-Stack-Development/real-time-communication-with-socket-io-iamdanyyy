// App.jsx - Main application component
// This is the root component that handles routing between login and chat

import { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

function App() {
  // Store the current user in state
  // If user is null, show login screen; otherwise show chat
  const [user, setUser] = useState(null);

  // Handle login - called when user enters their username
  const handleLogin = (username) => {
    setUser(username);
  };

  // Handle logout - disconnect and clear user
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat username={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

