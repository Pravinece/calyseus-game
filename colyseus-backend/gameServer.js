import pkg from 'colyseus';
const { Server } = pkg;
import { GameRoom } from './rooms/GameRoom.js';

export function createGameServer(httpServer) {
  // Initialize Colyseus server with HTTP server
  const gameServer = new Server({
    server: httpServer
  });

  // Register GameRoom with room matching logic
  gameServer.define('game_room', GameRoom, {
    filterBy: ['roomId'] // Players with same roomId join same instance
  });

  console.log('🎮 Colyseus Game Server initialized');
  
  return gameServer;
}