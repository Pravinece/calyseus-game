import pkg from 'colyseus';
const { Room } = pkg;
import { GameState } from '../schema/GameState.js';

export class GameRoom extends Room {
  maxClients = 10;

  onCreate(options) {
    this.setState(new GameState());
    console.log(`🎮 GameRoom created with options:`, options);

    // Add general message listener for debugging
    this.onMessage('*', (client, type, data) => {
      console.log(`📨 Message received - Type: ${type}, From: ${client.sessionId}, Data:`, data);
    });

    // Handle player movement updates
    this.onMessage('update-player', (client, data) => {
      console.log(`📥 Received update-player from ${client.sessionId}:`, data);
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.pos = data.pos;
        player.rot = data.rot;
        player.anim = data.anim;
        console.log(`📍 Player ${player.username} moved to:`, data.pos);
      } else {
        console.log(`❌ Player not found for sessionId: ${client.sessionId}`);
      }
    });
  }

  onJoin(client, options) {
    console.log(`✅ Player ${options.username} joined room ${this.roomId}`);

    // Create new player
    this.state.createPlayer(client.sessionId, options.username);
  }

  onLeave(client, consented) {
    console.log(`👋 Player left room ${this.roomId}`);
    
    // Remove player from state
    this.state.removePlayer(client.sessionId);
  }

  onDispose() {
    console.log(`🗑️ GameRoom ${this.roomId} disposed`);
  }
}