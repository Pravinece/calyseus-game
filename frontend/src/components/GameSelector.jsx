import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GameSelector() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('test-room');
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        minWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          🎮 Multiplayer Game
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Username:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Room ID:
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => {
              if (!username.trim()) {
                alert('Please enter a username');
                return;
              }
              sessionStorage.setItem('user', JSON.stringify({ username }));
              navigate(`/game/${roomId}`);
            }}
            style={{
              flex: 1,
              padding: '15px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🎯 Join Game
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p><strong>Colyseus:</strong> Real-time multiplayer game with state synchronization</p>
        </div>
      </div>
    </div>
  );
}

export default GameSelector;