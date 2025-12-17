
const rooms = new Map(); // Store room data

const chatSocket = (io) => {
  try {
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
      });

      socket.on('player-join', (data) => {
        console.log('Player joining:', data);
        const room = rooms.get(data.roomId);
        if (room) {
          room.set(data.username, { position: data.position, socketId: socket.id });
        }

        // Send existing players to new player
        const existingPlayers = {};
        if (room) {
          room.forEach((playerData, username) => {
            if (username !== data.username) {
              existingPlayers[username] = playerData.position;
            }
          });
        }

        // Send existing players to the new player
        Object.entries(existingPlayers).forEach(([username, position]) => {
          socket.emit('player-joined', { username, position });
        });

        // Notify others about new player
        socket.to(data.roomId).emit('player-joined', data);
      });

      socket.on('player-move', (data) => {
        const room = rooms.get(data.roomId);
        if (room && room.has(data.username)) {
          room.get(data.username).position = data.position;
        }
        socket.to(data.roomId).emit('player-moved', data);
      });

      socket.on('player-leave', (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
          room.delete(data.username);
        }
        socket.to(data.roomId).emit('player-left', data);
      });

      socket.on('send-message', (data) => {
        socket.to(data.roomId).emit('receive-message', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up player from all rooms
        rooms.forEach((room, roomId) => {
          room.forEach((playerData, username) => {
            if (playerData.socketId === socket.id) {
              room.delete(username);
              socket.to(roomId).emit('player-left', { username });
            }
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

export default chatSocket;