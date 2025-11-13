// RoomList.jsx - Component that displays available chat rooms
// Shows unread counts and allows switching between rooms

import './RoomList.css';

const AVAILABLE_ROOMS = [
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'random', name: 'Random', icon: '🎲' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
];

function RoomList({ currentRoom, onJoinRoom, unreadCounts }) {
  return (
    <div className="room-list">
      <div className="room-list-header">
        <h4>📁 Rooms</h4>
      </div>
      
      <div className="room-list-content">
        {AVAILABLE_ROOMS.map((room) => {
          const unreadCount = unreadCounts[room.id] || 0;
          const isActive = currentRoom === room.id;
          
          return (
            <div
              key={room.id}
              className={`room-item ${isActive ? 'active' : ''}`}
              onClick={() => !isActive && onJoinRoom(room.id)}
            >
              <span className="room-icon">{room.icon}</span>
              <span className="room-name">{room.name}</span>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoomList;

