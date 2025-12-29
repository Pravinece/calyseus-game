import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Room from '../models/Room.js';

const router = express.Router();

/**
 * CREATE USER API
 * Creates a new user account
 */
router.post('/createUser', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({ username, password });
    await user.save();
    
    res.json({ 
      message: 'User created successfully', 
      user: { username }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * LOGIN API
 * Authenticates user and returns user info
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user = await User.findOne({ username });
    
    if (!user) {
      user = new User({ username, password });
      await user.save();
    } else if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ 
      message: 'Login successful', 
      user: { username }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * CREATE ROOM API
 * Creates a new game room
 */
router.post('/create-room', async (req, res) => {
  try {
    const { username } = req.body;

    const roomId = uuidv4().substring(0, 8);

    const room = new Room({
      roomId,
      createdBy: username,
      users: [username]
    });
    
    await room.save();
    res.json({ 
      message: 'Room created successfully',
      roomId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * JOIN ROOM API
 * Adds user to existing room
 */
router.post('/join-room', async (req, res) => {
  try {
    const { roomId, username } = req.body;
    
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (!room.users.includes(username)) {
      room.users.push(username);
      await room.save();
    }
    
    res.json({ 
      message: 'Joined room successfully', 
      roomId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET ROOMS API
 * Returns list of available rooms
 */
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({}).select('roomId createdBy users createdAt');
    const roomList = rooms.map(room => ({
      roomId: room.roomId,
      createdBy: room.createdBy,
      userCount: room.users.length,
      users: room.users
    }));
    
    res.json(roomList);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;