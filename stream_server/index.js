import express from "express";
import { Server } from "socket.io";
import http from "http";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath("ffmpeg");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// Environment variables with fallbacks
const STREAM_PORT = process.env.STREAM_PORT || 4000;
const RTMP_SERVER_HOST = process.env.RTMP_SERVER_HOST || "localhost";
const RTMP_SERVER_PORT = process.env.RTMP_SERVER_PORT || 1935;
const RTMP_APP = process.env.RTMP_APP || "LiveApp";

// Map to track ffmpeg processes keyed by streamKey
const ffmpegProcesses = new Map();

// Start a stream based solely on the streamKey using a pipe input
const startStream = async (streamKey) => {
  // Construct the RTMP URL using environment variables
  const rtmpUrl = `rtmp://${RTMP_SERVER_HOST}:${RTMP_SERVER_PORT}/${RTMP_APP}/${streamKey}`;
  console.log(`Starting stream: ${rtmpUrl}`);

  // Create an ffmpeg process that reads from stdin (pipe:0).
  // The input format ("webm") should match the format sent from the client.
  const command = ffmpeg()
    .input("pipe:0")
    .inputFormat("webm")
    .outputOptions([
      "-c:v libx264",
      "-preset veryfast",
      "-b:v 2500k",
      "-c:a aac",
      "-b:a 128k",
      "-f flv",
    ])
    .output(rtmpUrl)
    .on("start", () => {
      console.log(`FFmpeg started streaming for ${streamKey}`);
      // Attach an error handler to FFmpeg's stdin once it's available.
      if (command.ffmpegProc && command.ffmpegProc.stdin) {
        command.ffmpegProc.stdin.on("error", (err) => {
          console.error(`FFmpeg stdin error for ${streamKey}:`, err);
          // Clean up to avoid further writes
          command.kill("SIGINT");
          ffmpegProcesses.delete(streamKey);
        });
      }
    })
    .on("end", () => {
      console.log(`FFmpeg ended streaming for ${streamKey}`);
      ffmpegProcesses.delete(streamKey);
    })
    .on("error", (err) => {
      console.error(`FFmpeg error for ${streamKey}:`, err);
      ffmpegProcesses.delete(streamKey);
    });

  // Start ffmpeg; the spawned process is available as command.ffmpegProc
  command.run();
  ffmpegProcesses.set(streamKey, command);
};

// REST endpoint to start a stream
app.post("/start/:streamKey", async (req, res) => {
  const { streamKey } = req.params;
  await startStream(streamKey);
  res.send(`Stream ${streamKey} started.`);
});

// REST endpoint to stop a stream
app.post("/stop/:streamKey", async (req, res) => {
  const { streamKey } = req.params;
  const command = ffmpegProcesses.get(streamKey);
  if (command) {
    command.kill("SIGINT");
    ffmpegProcesses.delete(streamKey);
    res.send(`Stream ${streamKey} stopped.`);
  } else {
    res.status(400).send("No active stream found with that ID.");
  }
});

// Socket.IO to receive video chunks from the client
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a client requests to start a stream
  socket.on("start-stream", async ({ streamKey }) => {
    if (!ffmpegProcesses.has(streamKey)) {
      try {
        await startStream(streamKey);
        // Emit confirmation after starting the stream
        socket.emit("stream-started", { streamKey });
      } catch (err) {
        console.error("Error starting stream", err);
        socket.emit("stream-error", { streamKey, error: err.message });
      }
    } else {
      socket.emit("stream-started", { streamKey });
    }
  });

  // Receive video chunks from the client and write to FFmpeg's stdin.
  socket.on("video-chunk", ({ streamKey, chunk }) => {
    const command = ffmpegProcesses.get(streamKey);
    if (command && command.ffmpegProc && command.ffmpegProc.stdin.writable) {
      command.ffmpegProc.stdin.write(chunk, (err) => {
        if (err) {
          console.error(`Error writing chunk for ${streamKey}:`, err);
        }
      });
    } else {
      console.error(`No active ffmpeg process for streamKey: ${streamKey}`);
    }
  });

  // Stop stream event from client
  socket.on("stop-stream", ({ streamKey }) => {
    const command = ffmpegProcesses.get(streamKey);
    if (command) {
      command.kill("SIGINT");
      ffmpegProcesses.delete(streamKey);
      socket.emit("stream-stopped", { streamKey });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(STREAM_PORT, () =>
  console.log(`Stream server running on port ${STREAM_PORT}`)
);
