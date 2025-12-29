import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [roomId, setRoomId] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/app');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const createRoom = async () => {
    try {
      const response = await fetch('http://localhost:2567/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      
      if (response.ok) {
        const data = await response.json();
        navigate(`/game/${data.roomId}`);
      }
    } catch (error) {
      console.error('Create room error:', error);
    }
  };

  const joinRoom = async () => {
    if (!roomId) return;

    try {
      const response = await fetch('http://localhost:2567/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username: user.username })
      });
      
      if (response.ok) {
        navigate(`/game/${roomId}`);
      }
    } catch (error) {
      console.error('Join room error:', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/app');
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      <div className="header">
        <h2>Welcome, {user.username}</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      
      <div className="room-cards">
        <div className="card">
          <h3>Create Room</h3>
          <p>Start a new game room</p>
          <button onClick={createRoom} className="create-btn">Create Room</button>
        </div>
        
        <div className="card">
          <h3>Join Room</h3>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom} className="join-btn">Join Room</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;