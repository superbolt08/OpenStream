import { Server } from 'socket.io';

const socketHandler = (socket, io) => {
  console.log('A user connected:', socket.id);

  socket.on('newMessage', (newMessage) => {
    io.emit('newMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
};

export default socketHandler;
