export const activeStreams = new Map();

const socketHandler = (socket, io) => {
  console.log('A user connected:', socket.id);

  socket.on('newMessage', (newMessage) => {
    io.emit('newMessage', newMessage);
  });

  socket.on("streamStarted", ({ streamKey }) => {
    console.log("Stream started:", streamKey);
    activeStreams.set(streamKey, { lastHeartbeat: Date.now(), socketId: socket.id });
  });

  socket.on("streamFinished", ({ streamKey }) => {
    console.log("Stream finished:", streamKey);
    activeStreams.delete(streamKey);
  });

  socket.on("heartbeat", ({ streamKey }) => {
    console.log("Stream heartbeats:", streamKey);
    if (activeStreams.has(streamKey)) {
      activeStreams.get(streamKey).lastHeartbeat = Date.now();
    }
  });

  socket.on("disconnect", () => {
    console.log('A user disconnected:', socket.id);
    for (const [streamKey, info] of activeStreams.entries()) {
      if (info.socketId === socket.id) {
        activeStreams.delete(streamKey);
      }
    }
  });
};

setInterval(() => {
  const now = Date.now();
  const timeout = 30000; 
  for (const [streamKey, info] of activeStreams.entries()) {
    if (now - info.lastHeartbeat > timeout) {
      console.log(`Stream ${streamKey} timed out.`);
      activeStreams.delete(streamKey);
    }
  }
}, 10000); 

export default socketHandler;
