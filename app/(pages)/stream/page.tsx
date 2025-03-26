"use client";

import { useState, useRef } from "react";
import { useSocket } from "@/app/components/socketprovider/SocketProvider";

const StreamPage = () => {
  const socket = useSocket();
  const [streamKey, setStreamKey] = useState("");
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const startMediaRecording = (stream, streamKey) => {
    // Determine supported mimeType
    let mimeType = "video/webm; codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn(`${mimeType} not supported, falling back.`);
      mimeType = "video/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} is also not supported, using default settings.`);
        mimeType = "";
      }
    }
    const options = mimeType ? { mimeType } : undefined;
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mediaRecorder;

    // Send each chunk to the server as soon as it's available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        socket.emit("video-chunk", { streamKey, chunk: event.data });
        console.log("Chunk sent:", event.data);
      }
    };

    // Start recording with a timeslice of 1000ms
    mediaRecorder.start(1000);
    setStreaming(true);
  };

  const startStreaming = async () => {
    if (!streamKey) {
      alert("Please enter a stream key");
      return;
    }

    // Emit the request to start the stream.
    socket.emit("start-stream", { streamKey });

    // Listen once for confirmation that the stream is ready.
    socket.once("stream-started", async ({ streamKey: key }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Start MediaRecorder only after the server is ready.
        startMediaRecording(stream, key);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    });
  };

  const stopStreaming = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    socket.emit("stop-stream", { streamKey });
    setStreaming(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Live Streaming</h1>
      <div>
        <input
          type="text"
          placeholder="Enter stream key"
          value={streamKey}
          onChange={(e) => setStreamKey(e.target.value)}
          style={{ marginRight: "1rem", padding: "0.5rem" }}
        />
        {!streaming ? (
          <button onClick={startStreaming} style={{ padding: "0.5rem 1rem" }}>
            Start Streaming
          </button>
        ) : (
          <button onClick={stopStreaming} style={{ padding: "0.5rem 1rem" }}>
            Stop Streaming
          </button>
        )}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "400px", height: "300px", background: "#000" }}
        />
      </div>
    </div>
  );
};

export default StreamPage;
