import { Client } from 'colyseus.js';

class GameClient {
  constructor() {
    this.client = new Client('ws://localhost:2567');
    this.room = null;
  }

  // Join game room
  async joinRoom(username, roomId) {
    this.room = await this.client.joinOrCreate('game_room', { username, roomId });
    
    // Listen for players joining
    this.room.state.players.onAdd((player, sessionId) => {
      console.log('Player joined:', player.username);
    });

    // Listen for players leaving
    this.room.state.players.onRemove((player, sessionId) => {
      console.log('Player left:', sessionId);
    });

    // Listen for player movement
    this.room.state.players.onChange((player, sessionId) => {
      console.log('Player moved:', sessionId, player.pos);
    });
  }

  // Send movement
  movePlayer(pos, rot, anim) {
    this.room.send('update-player', { pos, rot, anim });
  }

  // Leave room
  leave() {
    this.room.leave();
  }
}

// Usage
const game = new GameClient();
game.joinRoom('player1', 'abc12345');

// Move player
game.movePlayer([1, 0, 0], [0, 0, 0], 1);

export default GameClient;