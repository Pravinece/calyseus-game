# Multiplayer Game Setup Guide

## Architecture Overview

### Backend Structure
```
rooms = {
  room123: {
    players: {
      socketId1: { username, pos: [x,y,z], rot: [x,y,z], anim: index },
      socketId2: { username, pos: [x,y,z], rot: [x,y,z], anim: index }
    }
  }
}
```

### Files Created

#### Backend
- `project Game BackEnd/src/socket/gameSocket.js` - Main multiplayer socket handler

#### Frontend
- `src/services/gameSocketService.js` - Socket communication service
- `src/components/GameNew.jsx` - Updated game component with multiplayer

## How It Works

### 1. Backend (gameSocket.js)
- **Room Management**: Stores all rooms and player data
- **Events Handled**:
  - `join-room`: Player joins, receives existing players
  - `update-player`: Broadcasts position/rotation/animation changes
  - `leave-room`: Player leaves, notifies others
  - `disconnect`: Auto-cleanup when player disconnects

### 2. Frontend Service (gameSocketService.js)
- **Singleton Pattern**: One instance manages all socket communication
- **Methods**:
  - `connect()`: Connect to server
  - `joinRoom(roomId, username)`: Join game room
  - `updatePlayer(pos, rot, anim)`: Send player updates
  - `onRoomState()`: Receive existing players
  - `onPlayerJoined()`: New player notification
  - `onPlayerUpdated()`: Player movement updates
  - `onPlayerLeft()`: Player disconnect notification

### 3. Frontend Component (GameNew.jsx)
- **Effect 1**: Socket connection and event listeners
- **Effect 2**: Create/remove 3D models for other players
- **Effect 3**: Three.js scene setup and animation loop

## Usage

### Start Backend
```bash
cd "project Game BackEnd"
npm start
```

### Start Frontend
```bash
npm run dev
```

### Test Multiplayer
1. Open two browser windows
2. Login with different users
3. Create/join same room
4. See other players as red models
5. Move around - positions sync in real-time

## Key Features

✅ Real-time position synchronization
✅ Rotation tracking
✅ Animation state sync
✅ Player join/leave notifications
✅ Username labels above players
✅ Automatic cleanup on disconnect
✅ Room state management
✅ Efficient updates (only when changed)

## Socket Events Flow

### Player Joins:
1. Client → `join-room` → Server
2. Server → `room-state` → Client (existing players)
3. Server → `player-joined` → Other clients

### Player Moves:
1. Client → `update-player` → Server
2. Server → `player-updated` → Other clients

### Player Leaves:
1. Client → `leave-room` → Server
2. Server → `player-left` → Other clients

## Customization

### Change Player Color
In `GameNew.jsx`, line ~140:
```javascript
child.material.color.setHex(0xff0000); // Change color here
```

### Adjust Update Frequency
In `GameNew.jsx`, line ~280:
```javascript
if (Math.abs(currentPos[0] - lastUpdate.pos[0]) > 0.1) // Change threshold
```

### Add More Player Data
1. Update backend room structure in `gameSocket.js`
2. Add fields to `update-player` event
3. Update frontend `gameSocketService.js` methods
4. Use new data in `GameNew.jsx`

## Troubleshooting

### Players not visible?
- Check console for "Creating model for player" logs
- Verify GLTF model loaded: Check for gltfModelRef.current
- Check room state received: Look for "Room state received" log

### Position not syncing?
- Verify socket connection: Check for "Connected to game server"
- Check update threshold in animation loop
- Monitor network tab for socket messages

### Multiple canvases?
- Ensure only one Game component is mounted
- Check useEffect dependencies
- Verify cleanup function runs on unmount
