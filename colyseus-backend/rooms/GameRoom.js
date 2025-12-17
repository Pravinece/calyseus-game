import { Room } from 'colyseus';
import { GameState } from '../schema/GameState.js';

export class GameRoom extends Room {
  maxClients = 10;

  onCreate(options) {
    this.setState(new GameState());
    console.log(`🎮 GameRoom created with options:`, options);

    // Handle player movement updates
    this.onMessage('update-player', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.pos = data.pos;
        player.rot = data.rot;
        player.anim = data.anim;
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