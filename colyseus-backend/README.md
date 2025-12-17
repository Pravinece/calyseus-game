# Colyseus Multiplayer Game Backend

This is a Colyseus-based backend for your multiplayer Three.js game, replacing the Socket.IO implementation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run dev
```

The server will run on port 2567 by default.

## Frontend Integration

1. Install Colyseus client in your React app:
```bash
npm install colyseus.js
```

2. Replace your existing socket service with the Colyseus client (see `client-example.js`).

## Key Differences from Socket.IO

- **Automatic State Synchronization**: Colyseus automatically syncs state changes to all clients
- **Schema-based**: Type-safe state management with automatic serialization
- **Room Management**: Built-in room lifecycle and player management
- **Better Performance**: Optimized for real-time multiplayer games

## API

### Server Events
- Players automatically join/leave rooms
- `update-player`: Send position, rotation, and animation updates

### Client Events
- Automatic state synchronization for all player movements
- Real-time updates when players join/leave

## Migration from Socket.IO

Replace your existing `gameSocketService.js` with the Colyseus client implementation. The API is similar but more robust for multiplayer games.