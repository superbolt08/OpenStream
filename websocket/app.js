import express from 'express';
import { Server } from "socket.io";
import socketHandler from './sockets/index.js';

const app = express();
const PORT = process.env.SOCKET_PORT || 3005;

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).send("Websocket server is healthy\n");
});

// Create HTTP server and attach Socket.IO
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Websocket server is running on port ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

io.on('connection', (socket) => {
  socketHandler(socket, io);
});
