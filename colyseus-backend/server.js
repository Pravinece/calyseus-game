import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import apiRoutes from './routes/api.js';
import { createGameServer } from './gameServer.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URL="mongodb://172.23.198.248:27017/gamedb"
mongoose.connect(MONGO_URL)
.then(()=>{
    console.log("connected to db")
})
.catch((err)=>{
    console.log(err)
})

app.use('/api', apiRoutes);

const httpServer = createServer(app);

const gameServer = createGameServer(httpServer);

const PORT = process.env.PORT || 2567;
gameServer.listen(PORT);
console.log(`🚀 Server running on port ${PORT}`);
console.log(`📡 API endpoints: http://localhost:${PORT}/api`);
console.log(`🎮 Game server: ws://localhost:${PORT}`);