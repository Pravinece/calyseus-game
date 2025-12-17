// Example client code for your React frontend
// Install: npm install colyseus.js

import { Client } from 'colyseus.js';

class ColyseusGameClient {
  constructor() {
    this.client = new Client('ws://localhost:2567');
    this.room = null;
    this.players = new Map();
    this.baseURL = 'http://localhost:2567';
  }

  // Login using Express endpoint
  async login(username) {
    const response = await fetch(`${this.baseURL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return response.json();
  }

  // Get available rooms using Express endpoint
  async getRooms() {
    const response = await fetch(`${this.baseURL}/api/rooms`);
    return response.json();
  }

  async joinRoom(username, roomId = 'game_room') {
    try {
      this.room = await this.client.joinOrCreate(roomId, { username });
      
      // Listen for state changes
      this.room.state.players.onAdd((player, sessionId) => {
        console.log('Player joined:', player.username);
        this.players.set(sessionId, player);
        
        // Listen for player updates
        player.onChange(() => {
          this.onPlayerUpdate(sessionId, player);
        });
      });

      this.room.state.players.onRemove((player, sessionId) => {
        console.log('Player left:', player.username);
        this.players.delete(sessionId);
        this.onPlayerRemove(sessionId);
      });

      console.log('Joined room successfully');
      return this.room;
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }

  updatePlayer(pos, rot, anim) {
    if (this.room) {
      this.room.send('update-player', { pos, rot, anim });
    }
  }

  onPlayerUpdate(sessionId, player) {
    // Override this method in your game to handle player updates
    console.log('Player updated:', sessionId, player);
  }

  onPlayerRemove(sessionId) {
    // Override this method in your game to handle player removal
    console.log('Player removed:', sessionId);
  }

  leave() {
    if (this.room) {
      this.room.leave();
    }
  }
}

export default ColyseusGameClient;