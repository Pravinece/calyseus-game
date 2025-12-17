import React, { useState } from 'react';

const GameSocketDetails = ({ players, user, roomId, socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', roomId);
      socket.disconnect();
    }
    window.location.href = '/app/dashboard';
  };

  return (
    <>
      <button 
        className="socket-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '☰'}
      </button>
      
      <div className={`socket-details ${isOpen ? 'open' : 'closed'}`}>
      <div className="socket-header">
        <h3>Game Room</h3>
        <button onClick={handleLeaveRoom} className="leave-room-btn">
          Leave Room
        </button>
      </div>
      
      <div className="room-info">
        <div className="info-item">
          <span className="label">Room ID:</span>
          <span className="value">{roomId}</span>
        </div>
        
        <div className="info-item">
          <span className="label">Status:</span>
          <span className={`status ${socket?.connected ? 'connected' : 'disconnected'}`}>
            {socket?.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="info-item">
          <span className="label">You:</span>
          <span className="value">{user?.username}</span>
        </div>
      </div>

      <div className="players-section">
        <h4>Players ({Object.keys(players).length + 1})</h4>
        
        <div className="player-list">
          <div className="player-card current-user">
            <div className="player-info">
              <div className="player-name">{user?.username} (You)</div>
              <div className="player-position">Position: [0, 0, 0]</div>
            </div>
            <div className="player-status online"></div>
          </div>
          
          {Object.entries(players).map(([username, position]) => (
            <div key={username} className="player-card">
              <div className="player-info">
                <div className="player-name">{username}</div>
                <div className="player-position">
                  Position: [{position[0]?.toFixed(1) || 0}, {position[1]?.toFixed(1) || 0}, {position[2]?.toFixed(1) || 0}]
                </div>
              </div>
              <div className="player-status online"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="controls-info">
        <h4>Controls</h4>
        <div className="control-item">
          <span>WASD</span> - Move
        </div>
        <div className="control-item">
          <span>Shift</span> - Run
        </div>
        <div className="control-item">
          <span>Space</span> - Jump
        </div>
        <div className="control-item">
          <span>Enter</span> - Punch
        </div>
      </div>
      </div>
    </>
  );
};

export default GameSocketDetails;