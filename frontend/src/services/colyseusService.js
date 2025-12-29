/**
 * Colyseus Game Service
 * Handles all Colyseus communication for multiplayer game
 * Compatible with existing React Three.js setup
 */

import { Client } from 'colyseus.js';

class ColyseusService {
  constructor() {
    this.client = new Client('ws://localhost:2567');
    this.room = null;
    this.username = null;
    this.callbacks = {};
  }

  /**
   * Join or create a game room
   * @param {string} username - Player username
   * @param {string} roomId - Room ID to join
   */
  async joinRoom(username, roomId) {
    try {
      this.username = username;
      
      // Join or create room (triggers onCreate + onJoin in backend)
      this.room = await this.client.joinOrCreate('game_room', { 
        username, 
        roomId 
      });

      console.log('✅ Connected to Colyseus! SessionId:', this.room.sessionId);
      
      // Setup listeners for state changes
      this.setupListeners();
      
      return this.room;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Setup all room listeners
   */
  setupListeners() {
    if (!this.room) return;

    // Listen when new players join
    this.room.state.players.onAdd((player, sessionId) => {
      console.log('👤 Player joined:', player.username, sessionId);
      
      if (this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined({
          sessionId,
          username: player.username,
          position: [player.pos[0] || 0, player.pos[1] || 0, player.pos[2] || 0],
          rotation: [player.rot[0] || 0, player.rot[1] || 0, player.rot[2] || 0]
        });
      }
    });

    // Listen when players leave  
    this.room.state.players.onRemove((player, sessionId) => {
      console.log('👋 Player left:', player.username, sessionId);
      
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft({ sessionId });
      }
    });

    // Listen for player updates (position, rotation, animation)
    this.room.state.players.onChange((player, sessionId) => {
      if (this.callbacks.onPlayerUpdated) {
        this.callbacks.onPlayerUpdated({
          sessionId,
          username: player.username,
          position: [player.pos[0] || 0, player.pos[1] || 0, player.pos[2] || 0],
          rotation: [player.rot[0] || 0, player.rot[1] || 0, player.rot[2] || 0],
          animation: player.anim || 0
        });
      }
    });

    // Get initial room state (existing players)
    if (this.callbacks.onRoomState) {
      const players = {};
      this.room.state.players.forEach((player, sessionId) => {
        players[sessionId] = {
          username: player.username,
          position: [player.pos[0] || 0, player.pos[1] || 0, player.pos[2] || 0],
          rotation: [player.rot[0] || 0, player.rot[1] || 0, player.rot[2] || 0]
        };
      });
      this.callbacks.onRoomState(players);
    }
  }

  /**
   * Send player movement to server
   * @param {Array} position - Position [x, y, z]
   * @param {Array} rotation - Rotation [x, y, z]  
   * @param {number} animation - Animation index
   */
  updatePlayer(position, rotation, animation) {
    if (!this.room) return;
    
    this.room.send('update-player', {
      pos: [position[0], position[1], position[2]],
      rot: [rotation[0], rotation[1], rotation[2]],
      anim: animation
    });
  }

  /**
   * Listen for room state (existing players when joining)
   * @param {Function} callback - Callback with players data
   */
  onRoomState(callback) {
    this.callbacks.onRoomState = callback;
  }

  /**
   * Listen for new player joining
   * @param {Function} callback - Callback with player data
   */
  onPlayerJoined(callback) {
    this.callbacks.onPlayerJoined = callback;
  }

  /**
   * Listen for player updates
   * @param {Function} callback - Callback with update data
   */
  onPlayerUpdated(callback) {
    this.callbacks.onPlayerUpdated = callback;
  }

  /**
   * Listen for player leaving
   * @param {Function} callback - Callback with sessionId
   */
  onPlayerLeft(callback) {
    this.callbacks.onPlayerLeft = callback;
  }

  /**
   * Leave current room (triggers onLeave in backend)
   */
  leaveRoom() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      console.log('🚪 Left room');
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    this.leaveRoom();
    console.log('🔌 Disconnected from Colyseus server');
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return this.room?.sessionId;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.room !== null;
  }
}

// Export singleton instance
export default new ColyseusService();