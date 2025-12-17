import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Text } from '@react-three/drei';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';


export default function SocketDetails({ players, user, roomId, socket }){
  return (
    <div style={{
      width: '20%',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      boxSizing: 'border-box',
      borderLeft: '1px solid #ddd',
      overflow: 'auto'
    }}>
      <h3>Details</h3>
      <div style={{ marginBottom: '20px' }}>
        <strong>Room ID:</strong> {roomId}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <strong>Connected:</strong> {socket?.connected ? 'Yes' : 'No'}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <strong>Current User:</strong> {user?.username}
      </div>
      <div>
        <strong>Players ({Object.keys(players).length + 1}):</strong>
        <div style={{ marginTop: '10px' }}>
          <div style={{
            padding: '8px',
            margin: '5px 0',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <div><strong>{user?.username} (You)</strong></div>
            <div>Position: [0, 0, 0]</div>
          </div>
          {Object.entries(players).map(([username, position]) => (
            <div key={username} style={{
              padding: '8px',
              margin: '5px 0',
              backgroundColor: '#f3e5f5',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <div><strong>{username}</strong></div>
              <div>Position: [{position[0].toFixed(1)}, {position[1].toFixed(1)}, {position[2].toFixed(1)}]</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};