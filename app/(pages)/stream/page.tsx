"use client";

import { useState, useRef } from "react";
import { useSocket } from "@/app/components/socketprovider/SocketProvider";

const StreamPage = () => {
  const socket = useSocket();
  const [streamKey, setStreamKey] = useState("");
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStreaming = async () => {
    if (!streamKey) {
      alert("Please enter a stream key");
      return;
    }
    try {
      // Request access to video and audio devices.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Notify the stream server to start the stream.
      socket.emit("start-stream", { streamKey });

      // Check for supported mimeType.
      let mimeType = "video/webm; codecs=vp8";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} is not supported, falling back.`);
        mimeType = "video/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.warn(
            `${mimeType} is also not supported, using default settings.`
          );
          mimeType = "";
        }
      }
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // When a data chunk is available, send it to the stream server.
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          socket.emit("video-chunk", { streamKey, chunk: event.data });
        }
      };

      // Start recording and send data every 1000ms.
      mediaRecorder.start(1000);
      setStreaming(true);
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  };

  const stopStreaming = () => {
    // Stop recording and close the media stream.
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    // Notify the stream server to stop the stream.
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
