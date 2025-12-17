import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { GameRoom } from './rooms/GameRoom.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  res.json({ success: true, username, token: `token_${Date.now()}` });
});

// Get available rooms
app.get('/api/rooms', (req, res) => {
  const rooms = gameServer.gracefullyShutdown ? [] : 
    Array.from(gameServer.rooms.values()).map(room => ({
      roomId: room.roomId,
      clients: room.clients.length,
      maxClients: room.maxClients
    }));
  res.json(rooms);
});

const gameServer = new Server({
  server: createServer(app)
});

// Register the GameRoom
gameServer.define('game_room', GameRoom);

const PORT = process.env.PORT || 2567;

gameServer.listen(PORT);
console.log(`🎮 Colyseus Game Server running on port ${PORT}`);