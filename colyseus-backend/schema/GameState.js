import { Schema, MapSchema, type } from '@colyseus/schema';
import { Player } from './Player.js';

export class GameState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }

  createPlayer(sessionId, username) {
    this.players.set(sessionId, new Player(username));
  }

  removePlayer(sessionId) {
    this.players.delete(sessionId);
  }
}

// Define schema types
type({ map: Player })(GameState.prototype, 'players');