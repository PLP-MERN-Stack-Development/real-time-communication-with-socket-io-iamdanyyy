// UserList.jsx - Component that displays all online users
// Allows starting private conversations

import './UserList.css';

function UserList({ users, currentUsername, onStartPrivateMessage }) {
  // Filter out current user from the list
  const otherUsers = users.filter(user => 
    user.username !== currentUsername && user.id !== currentUsername
  );

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h4>👥 Online Users ({users.length})</h4>
      </div>
      
      <div className="user-list-content">
        {/* Current user */}
        <div className="user-item current-user">
          <span className="user-status online"></span>
          <span className="user-name">You ({currentUsername})</span>
        </div>
        
        {/* Other users */}
        {otherUsers.length === 0 ? (
          <div className="no-users">No other users online</div>
        ) : (
          otherUsers.map((user) => (
            <div 
              key={user.id} 
              className="user-item"
              onClick={() => onStartPrivateMessage(user)}
              title="Click to send private message"
            >
              <span className="user-status online"></span>
              <span className="user-name">{user.username}</span>
              <button className="private-message-btn" title="Private message">
                💬
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserList;

