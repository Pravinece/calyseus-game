/**
 * Game Socket Handler
 * Manages multiplayer game state with position, rotation, and animation data
 */
// Room structure: { roomId: { players: { socketId: { pos, rot, anim, username } } } }
const rooms = {};

const gameSocket = (io) => {
  try {
    io.on('connection', (socket) => {
      console.log('🎮 Player connected:', socket.id);

      /**
       * JOIN-ROOM: Player joins a game room
       * Creates room if doesn't exist
       */
      socket.on('join-room', ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`✅ ${username} (${socket.id}) joined room ${roomId}`);
        
        // Initialize room if it doesn't exist
        if (!rooms[roomId]) {
          rooms[roomId] = { players: {} };
        }
        
        // Add player to room with initial data
        rooms[roomId].players[socket.id] = {
          username,
          pos: [0, 0, 0],      // Position [x, y, z]
          rot: [0, 0, 0],      // Rotation [x, y, z]
          anim: 3              // Animation index (3 = idle)
        };
        
        // Send existing players to the new player
        const existingPlayers = {};
        Object.entries(rooms[roomId].players).forEach(([id, data]) => {
          if (id !== socket.id) {
            existingPlayers[id] = data;
          }
        });
        
        // Send current room state to new player
        socket.emit('room-state', existingPlayers);
        console.log('existingPlayers: ', existingPlayers);
        
        // Notify others about new player
        socket.to(roomId).emit('player-joined', {
          socketId: socket.id,
          ...rooms[roomId].players[socket.id]
        });
        
        console.log(`📊 Room ${roomId} now has ${Object.keys(rooms[roomId].players).length} players`);
      });
      
      /**
       * UPDATE-PLAYER: Update player position, rotation, and animation
       * Broadcasts to all other players in the room
       */
      socket.on('update-player', ({ roomId, pos, rot, anim }) => {
        const room = rooms[roomId];
        if (!room || !room.players[socket.id]) return;
        
        // Update player data
        room.players[socket.id].pos = pos;
        room.players[socket.id].rot = rot;
        room.players[socket.id].anim = anim;
        
        // Broadcast to other players in room
        socket.to(roomId).emit('player-updated', {
          socketId: socket.id,
          pos,
          rot,
          anim
        });
      });
      
      /**
       * LEAVE-ROOM: Player explicitly leaves a room
       */
      socket.on('leave-room', ({ roomId }) => {
        handlePlayerLeave(socket, roomId);
      });
      
      /**
       * DISCONNECT: Player disconnects (cleanup)
       */
      socket.on('disconnect', () => {
        console.log('❌ Player disconnected:', socket.id);
        
        // Remove player from all rooms
        Object.keys(rooms).forEach(roomId => {
          if (rooms[roomId].players[socket.id]) {
            handlePlayerLeave(socket, roomId);
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Game socket error:', error);
  }
};

/**
 * Helper function to handle player leaving
 */
function handlePlayerLeave(socket, roomId) {
  const room = rooms[roomId];
  if (!room || !room.players[socket.id]) return;
  
  const username = room.players[socket.id].username;
  
  // Remove player from room
  delete room.players[socket.id];
  
  // Notify others
  socket.to(roomId).emit('player-left', { socketId: socket.id });
  
  console.log(`👋 ${username} left room ${roomId}`);
  
  // Clean up empty rooms
  if (Object.keys(room.players).length === 0) {
    delete rooms[roomId];
    console.log(`🗑️ Room ${roomId} deleted (empty)`);
  } else {
    console.log(`📊 Room ${roomId} now has ${Object.keys(room.players).length} players`);
  }
}

export default gameSocket;
