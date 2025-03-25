import express from "express";
import { Server } from "socket.io";
import http from "http";
import ffmpeg from "fluent-ffmpeg";
import os from "os";

ffmpeg.setFfmpegPath("ffmpeg");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Environment variables with fallbacks
const STREAM_PORT = process.env.STREAM_PORT || 4000;

const RTMP_SERVER_HOST = process.env.RTMP_SERVER_HOST || "localhost";
const RTMP_SERVER_PORT = process.env.RTMP_SERVER_PORT || 1935;
const RTMP_APP = process.env.RTMP_APP || "LiveApp";

// Function to get the correct webcam input based on OS
const getWebcamInput = () => {
  const platform = os.platform();
  if (platform === "linux") {
    return { input: "/dev/video0", options: ["-f", "v4l2"] };
  } else if (platform === "darwin") {
    return { input: "0:1", options: ["-f", "avfoundation"] };
  } else if (platform === "win32") {
    return { input: 'video="Your Webcam Name"', options: ["-f", "dshow"] };
  } else {
    throw new Error("Unsupported OS");
  }
};

// Map to track ffmpeg processes keyed by streamKey
const ffmpegCommands = new Map();

// Start a stream based solely on the streamKey
const startStream = async (streamKey) => {
  // Construct the RTMP URL using environment variables
  const rtmpUrl = `rtmp://${RTMP_SERVER_HOST}:${RTMP_SERVER_PORT}/${RTMP_APP}/${streamKey}`;
  console.log(`Starting stream: ${rtmpUrl}`);

  const { input, options } = getWebcamInput();

  const command = ffmpeg()
    .input(input)
    .inputOptions([...options, "-framerate", "30"])
    .outputOptions([
      "-c:v libx264",
      "-preset veryfast",
      "-b:v 2500k",
      "-c:a aac",
      "-b:a 128k",
      "-f",
      "flv",
    ])
    .output(rtmpUrl)
    .on("start", () => console.log(`Stream started: ${streamKey}`))
    .on("end", () => {
      console.log(`Stream ended: ${streamKey}`);
      ffmpegCommands.delete(streamKey);
    })
    .on("error", (err) => {
      console.error("Stream error:", err);
      ffmpegCommands.delete(streamKey);
    });

  // Save the command in the Map using streamKey as the key
  ffmpegCommands.set(streamKey, command);
  command.run();
};

// Endpoint to start a stream: accepts streamKey as a URL parameter
app.post("/start/:streamKey", async (req, res) => {
  const { streamKey } = req.params;
  await startStream(streamKey);
  res.send(`Stream ${streamKey} started.`);
});

// Endpoint to stop a stream: accepts streamKey as a URL parameter
app.post("/stop/:streamKey", async (req, res) => {
  const { streamKey } = req.params;
  const command = ffmpegCommands.get(streamKey);
  if (command) {
    command.kill("SIGINT");
    ffmpegCommands.delete(streamKey);
    res.send(`Stream ${streamKey} stopped.`);
  } else {
    res.status(400).send("No active stream found with that ID.");
  }
});

// WebSocket communication to notify clients about stream events
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("start-stream", async ({ streamKey }) => {
    await startStream(streamKey);
    socket.emit("stream-started", { streamKey });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(STREAM_PORT, () =>
  console.log(`Stream server running on port ${STREAM_PORT}`)
);
