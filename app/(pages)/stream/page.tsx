"use client";

import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/app/components/Socketprovider/SocketProvider";

// We'll store the class reference for WebRTCAdaptor in state.
const StreamPage = () => {
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("Offline");
  const [webRTCAdaptor, setWebRTCAdaptor] = useState<any>(null); // we'll set the instance later
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamKeyRef = useRef<string>("");
  const socket = useSocket();

  // Dynamically import WebRTCAdaptor on the client.
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        await import("@antmedia/webrtc_adaptor");
      }
    })();
  }, []);

  // Called when the user clicks "Start Streaming"
  const handleStartStreaming = async () => {
    try {
      const response = await fetch("/api/stream/start", {
        method: "PATCH",
      });
      if (!response.ok) {
        console.error("Failed to start stream");
        return;
      }
      const data = await response.json();
      streamKeyRef.current = data.streamKey;
      setStreaming(true);
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };
  

  // When "streaming" becomes true, initialize the WebRTCAdaptor and publish the stream.
  useEffect(() => {
    if (streaming && videoRef.current && !webRTCAdaptor) {
      (async () => {
        // Dynamically import WebRTCAdaptor once the component is mounted in the browser.
        const { WebRTCAdaptor } = await import("@antmedia/webrtc_adaptor");
        const adaptor = new WebRTCAdaptor({
          websocket_url: "ws://localhost:5080/WebRTCApp/websocket",
          localVideoElement: videoRef.current,
          mediaConstraints: { video: true, audio: true },
          callback: async (info: string, obj: any) => {
            console.log("Callback info:", info);
            if (info === "initialized") {
              console.log("WebRTCAdaptor initialized");
            } else if (info === "publish_started") {
              setStatus("Broadcasting - Stream Id: " + streamKeyRef.current);
              socket?.emit("streamStarted", { streamKey: streamKeyRef.current });
            } else if (info === "publish_finished") {
              setStatus("Offline");
              socket?.emit("streamFinished", { streamKey: streamKeyRef.current });
            }
          },
          callbackError: (error: any, message: string) => {
            console.error("Error callback:", error, message);
            socket?.emit("streamError", { streamKey: streamKeyRef.current, error, message });
          },
        });
        setWebRTCAdaptor(adaptor);
        adaptor.publish(streamKeyRef.current);
      })();
    }
  }, [streaming, webRTCAdaptor, socket]);

  // When streaming is active, send a heartbeat periodically.
  useEffect(() => {
    if (!streaming || !streamKeyRef.current) return;
    const interval = setInterval(() => {
      console.log("Sending heartbeat for stream:", streamKeyRef.current);
      socket?.emit("heartbeat", { streamKey: streamKeyRef.current });
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [streaming, socket]);

  const handleStopStreaming = () => {
    if (webRTCAdaptor) {
      webRTCAdaptor.stop(streamKeyRef.current);
      setWebRTCAdaptor(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setStatus("Offline");
    socket?.emit("streamFinished", { streamKey: streamKeyRef.current });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Live Streaming</h1>
      {!streaming && (
        <button onClick={handleStartStreaming} style={{ padding: "0.5rem 1rem" }}>
          Start Streaming
        </button>
      )}
      {streaming && (
        <>
          <video
            ref={videoRef}
            autoPlay
            controls
            muted
            playsInline
            style={{ width: "480px", height: "360px", background: "#000" }}
          />
          <br />
          <button onClick={handleStopStreaming} style={{ padding: "0.5rem 1rem" }}>
            Stop Streaming
          </button>
        </>
      )}
      <p>{status}</p>
    </div>
  );
};

export default StreamPage;
