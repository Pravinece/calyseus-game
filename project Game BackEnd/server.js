import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import route from './src/routes/routes.js'
import { Server } from 'socket.io';
import { createServer } from 'http';
import handleSocket from './src/socket/socket.js';
import gameSocket from './src/socket/gameSocket.js';
import 'dotenv/config';

const app = express()
app.use(express.json())
app.use(cors())
const server = createServer(app);
const PORT = process.env.PORT || 4004
const SECRET_KEY = process.env.SECRET_KEY
const MONGO_URL = process.env.MONGO_URL

mongoose.connect(MONGO_URL)
.then(()=>{
console.log("connected to db")
})
.catch((err)=>{
console.log(err)
})

// Socket.io setup
const io = new Server(server, {
cors: {
origin: "*",
},
});

// Middleware to attach io to req object
app.use((req, res, next) => {
req.io = io;
next();
});

app.use('/api',route)

try{
// Use gameSocket for multiplayer game
gameSocket(io);
}catch(err){
console.log(err,"socket error")
}

server.listen(PORT,()=>{
console.log(`server is running ${PORT}`)
})