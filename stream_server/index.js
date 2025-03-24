const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');
const { prisma } = require('../prisma/index.js'); // Adjust the path as needed

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 4000;

// Function to get the correct webcam input based on OS
const getWebcamInput = () => {
  const platform = os.platform();

  if (platform === 'linux') {
    return {
      input: '/dev/video0', // Default webcam input for Linux
      options: ['-f', 'v4l2'], // v4l2 is the Linux video device input format
    };
  } else if (platform === 'darwin') {
    return {
      input: 'default', // Default webcam input for macOS
      options: ['-f', 'avfoundation'], // avfoundation is the input format for macOS
    };
  } else if (platform === 'win32') {
    return {
      input: 'video="Your Webcam Name"', // Specify webcam name for Windows (change this accordingly)
      options: ['-f', 'dshow'], // dshow is the input format for Windows
    };
  } else {
    throw new Error('Unsupported OS');
  }
};

// Start RTMP stream programmatically
const startStream = async (streamId) => {
  const rtmpUrl = `rtmp://localhost:1935/LiveApp/${streamId}`;

  console.log(`Starting stream: ${rtmpUrl}`);

  const { input, options } = getWebcamInput(); // Get the correct input based on OS

  const command = ffmpeg()
    .input(input)  // Webcam input based on OS
    .inputOptions(options)    // Input options based on OS
    .outputOptions([
      '-c:v libx264',         // Video codec
      '-preset veryfast',      // Encoding speed
      '-b:v 2500k',            // Bitrate
      '-c:a aac',              // Audio codec
      '-b:a 128k'              // Audio bitrate
    ])
    .output(rtmpUrl)
    .on('start', () => console.log(`Stream started: ${streamId}`))
    .on('end', () => console.log(`Stream ended: ${streamId}`))
    .on('error', (err) => console.error('Stream error:', err));

  command.run();

  // Store stream in MongoDB
  await prisma.stream.create({
    data: {
      streamKey: streamId,
      title: `Stream ${streamId}`,
      status: true,
      playbackUrl: `http://localhost:5080/LiveApp/streams/${streamId}.m3u8`
    }
  });
};

// Start stream endpoint
app.get('/start/:streamId', async (req, res) => {
  const { streamId } = req.params;
  await startStream(streamId);
  res.send(`Stream ${streamId} started.`);
});

// WebSocket communication to notify clients
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('start-stream', async (streamId) => {
    await startStream(streamId);
    socket.emit('stream-started', streamId);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
