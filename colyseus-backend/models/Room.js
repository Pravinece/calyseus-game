import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true },
  users: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Room', roomSchema);