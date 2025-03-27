"use client";

import { useState, useRef, useEffect } from "react";
import { WebRTCAdaptor } from "@antmedia/webrtc_adaptor";
import { uuidv4 } from "@/app/services/uuidc4";

const StreamPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamKey, setStreamKey] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("Offline");
  const [webRTCAdaptor, setWebRTCAdaptor] = useState<WebRTCAdaptor | null>(null);
  const streamIdRef = useRef<string>("");

  // Initialize the WebRTCAdaptor once the component and video element are mounted.
  useEffect(() => {
    if (videoRef.current && !webRTCAdaptor) {
      const adaptor = new WebRTCAdaptor({
        websocket_url: "ws://localhost:5080/WebRTCApp/websocket",
        localVideoElement: videoRef.current,
        // Make sure audio is enabled
        mediaConstraints: { video: true, audio: true },
        callback: (info: string, obj: any) => {
          console.log("Callback info: ", info);
          if (info === "publish_started") {
            console.log("Publish started");
            setStatus("Broadcasting - Stream Id: " + streamIdRef.current);
            setStreaming(true);
          } else if (info === "publish_finished") {
            console.log("Publish finished");
            setStatus("Offline");
            setStreaming(false);
          } else if (info === "initialized") {
            console.log("WebRTCAdaptor initialized");
          }
        },
        callbackError: (error: any, message: string) => {
          console.error("Error callback: ", error, message);
        },
      });
      setWebRTCAdaptor(adaptor);
    }
  }, [videoRef, webRTCAdaptor]);

  const handleStartPublishing = () => {
    if (!webRTCAdaptor) {
      console.error("WebRTCAdaptor is not initialized yet.");
      return;
    }
    // Use the provided streamKey or generate a random stream id using uuidv4
    const id = streamKey || uuidv4();
    streamIdRef.current = id;
    webRTCAdaptor.publish(id);
  };

  const handleStopPublishing = () => {
    if (!webRTCAdaptor) return;
    webRTCAdaptor.stop(streamIdRef.current);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Live Streaming</h1>
      <div>
        <input
          type="text"
          placeholder="Enter stream key (optional)"
          value={streamKey}
          onChange={(e) => setStreamKey(e.target.value)}
          style={{ marginRight: "1rem", padding: "0.5rem" }}
        />
        {!streaming ? (
          <button onClick={handleStartPublishing} style={{ padding: "0.5rem 1rem" }}>
            Start Publishing
          </button>
        ) : (
          <button onClick={handleStopPublishing} style={{ padding: "0.5rem 1rem" }}>
            Stop Publishing
          </button>
        )}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <video
          ref={videoRef}
          autoPlay
          controls
          muted
          playsInline
          style={{ width: "480px", height: "360px", background: "#000" }}
        />
      </div>
      <p>{status}</p>
    </div>
  );
};

export default StreamPage;
