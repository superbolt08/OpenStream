"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { useSocket } from "@/app/contexts/SocketProvider/SocketProvider";
import { Stream } from "@/app/services/stream/interface";

interface StreamContextProps {
  streaming: boolean;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webRTCAdaptor: any;
  streamKey: string;
  stream: Stream | null;
}

const StreamContext = createContext<StreamContextProps | undefined>(undefined);

export const StreamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [streaming, setStreaming] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [webRTCAdaptor, setWebRTCAdaptor] = useState<any>(null);
  const [streamKey, setStreamKey] = useState("");
  const [stream, setStream] = useState<Stream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socket = useSocket();

  const startStreaming = async () => {
    try {
      const response = await fetch("/api/stream/start", {
        method: "PATCH",
      });
      if (!response.ok) {
        console.error("Failed to start stream");
        return;
      }
      const data = await response.json();

      const streamKey = data.streamKey;
      const streamInfo = data.streamInfo;

      setStreamKey(streamKey);
      setStream(streamInfo)
      setStreaming(true);

      await initializeAdaptor(streamKey);
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const initializeAdaptor = async (key: string) => {
    try {
      const { WebRTCAdaptor } = await import("@antmedia/webrtc_adaptor");
      const adaptor = new WebRTCAdaptor({
        websocket_url: process.env.STREAM_URL,
        localVideoElement: videoRef.current,
        mediaConstraints: { video: true, audio: true },
        // You can include offerOptions if needed:
        // offerOptions: { offerToReceiveAudio: 1, offerToReceiveVideo: 1 },
        callback: (info: string) => {
          console.log("WebRTCAdaptor callback info:", info);
          if (info === "initialized") {
            console.log("WebRTCAdaptor initialized. Now publishing stream.");
            // Publish only after initialization.
            adaptor.publish(key);
          } else if (info === "publish_started") {
            if (socket && key) {
              socket.emit("streamStarted", { streamKey: key });
            }
          } else if (info === "publish_finished") {
            if (socket && key) {
              socket.emit("streamFinished", { streamKey: key });
            }
            setStreaming(false);
          }
        },
        callbackError: (error: unknown, message: string) => {
          console.error("WebRTCAdaptor error:", error, message);
          if (socket && key) {
            socket.emit("streamError", { streamKey: key, error, message });
          }
        },
      });
      setWebRTCAdaptor(adaptor);
    } catch (error) {
      console.error("Error initializing WebRTCAdaptor:", error);
    }
  };

  const stopStreaming = () => {
    if (webRTCAdaptor) {
      webRTCAdaptor.stop(streamKey);
      setWebRTCAdaptor(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    if (socket && streamKey) {
      socket.emit("streamFinished", { streamKey });
    }
  };

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout;
    if (streaming && streamKey) {
      heartbeatInterval = setInterval(() => {
        if (socket && streamKey) {
          console.log("Sending heartbeat for stream:", streamKey);
          socket.emit("heartbeat", { streamKey });
        }
      }, 30000);
    }
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [streaming, streamKey, socket]);


  useEffect(() => {
    return () => {
      if (streaming) {
        stopStreaming();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  return (
    <StreamContext.Provider
      value={{
        streaming,
        startStreaming,
        stopStreaming,
        videoRef,
        webRTCAdaptor,
        streamKey,
        stream
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStream must be used within a StreamProvider");
  }
  return context;
};
