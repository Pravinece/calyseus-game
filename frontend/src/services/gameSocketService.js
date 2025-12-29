/**
 * Game Socket Service
 * Handles all socket communication for multiplayer game
 * Separates socket logic from game component
 */

import io from 'socket.io-client';

class GameSocketService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.username = null;
    this.listeners = {};
  }

  /**
   * Connect to socket server
   * @param {string} serverUrl - Socket server URL
   */
  connect(serverUrl = 'http://localhost:4005') {
    if (this.socket?.connected) return;
    
    this.socket = io(serverUrl);
    console.log('🔌 Connecting to game server...');
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to game server:', this.socket.id);
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
    });
  }

  /**
   * Join a game room
   * @param {string} roomId - Room ID to join
   * @param {string} username - Player username
   */
  joinRoom(roomId, username) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    this.roomId = roomId;
    this.username = username;
    
    // Emit join-room event
    this.socket.emit('join-room', { roomId, username });
    console.log(`🚪 Joining room ${roomId} as ${username}`);
  }

  /**
   * Update player state (position, rotation, animation)
   * @param {Array} pos - Position [x, y, z]
   * @param {Array} rot - Rotation [x, y, z]
   * @param {number} anim - Animation index
   */
  updatePlayer(pos, rot, anim) {
    if (!this.socket || !this.roomId) return;
    
    this.socket.emit('update-player', {
      roomId: this.roomId,
      pos,
      rot,
      anim
    });
  }

  /**
   * Listen for room state (existing players when joining)
   * @param {Function} callback - Callback with players data
   */
  onRoomState(callback) {
    if (!this.socket) return;
    
    this.socket.on('room-state', (players) => {
      console.log('📊 Received room state:', Object.keys(players).length, 'players');
      callback(players);
    });
  }

  /**
   * Listen for new player joining
   * @param {Function} callback - Callback with player data
   */
  onPlayerJoined(callback) {
    if (!this.socket) return;
    
    this.socket.on('player-joined', (data) => {
      console.log('👤 Player joined:', data.username, data.socketId);
      callback(data);
    });
  }

  /**
   * Listen for player updates (position, rotation, animation)
   * @param {Function} callback - Callback with update data
   */
  onPlayerUpdated(callback) {
    if (!this.socket) return;
    
    this.socket.on('player-updated', (data) => {
      callback(data);
    });
  }

  /**
   * Listen for player leaving
   * @param {Function} callback - Callback with socketId
   */
  onPlayerLeft(callback) {
    if (!this.socket) return;
    
    this.socket.on('player-left', (data) => {
      console.log('👋 Player left:', data.socketId);
      callback(data);
    });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (!this.socket || !this.roomId) return;
    
    this.socket.emit('leave-room', { roomId: this.roomId });
    console.log(`🚪 Left room ${this.roomId}`);
    
    this.roomId = null;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Disconnected from server');
    }
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export default new GameSocketService();
