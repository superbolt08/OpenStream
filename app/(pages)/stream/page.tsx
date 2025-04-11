"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStream } from "@/app/contexts/StreamProvider/StreamProvider"
import { useSocket } from "@/app/contexts/SocketProvider/SocketProvider";
import { ChatMessage } from "@/app/services/stream/interface";
import styles from "./stream.module.css";
import { formatDuration } from "@/app/services/stream/methods";

export default function StreamPage() {
  const { streaming, stream, stopStreaming, videoRef } = useStream();
  const socket = useSocket();

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stream && streaming) {
      const created = new Date(stream.createdAt).getTime();
      timer = setInterval(() => {
        const now = Date.now();
        const seconds = Math.floor((now - created) / 1000);
        setDuration(seconds);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stream, streaming]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: ChatMessage) => {
      if (stream && msg.chatId === stream.chatId) {
        setChatMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, stream]);

  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      const newMsg: ChatMessage = {
        user: "# streamer",
        text: message,
        color: "#FF4500",
        chatId: stream?.chatId,
      };
      socket.emit("newMessage", newMsg);
      setMessage("");
    }
  };

  useEffect(() => {
    return () => {
      if (streaming) stopStreaming();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.videoSection}>
        <video
          ref={videoRef}
          autoPlay
          controls
          muted
          playsInline
          className={styles.video}
        />
        <div className={styles.overlay}>
          <div className={styles.status}>{!streaming && "OFFLINE"}</div>
          <div className={styles.title}>{streaming && stream?.title}</div>
          {streaming && (
            <div className={styles.duration}>
              Live for: {formatDuration(duration)}
            </div>
          )}
        </div>
      </div>

      <div className={styles.chatSection}>
        <div className={styles.chatBox}>
          <div className={styles.chatDisplay} ref={chatDisplayRef}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={styles.chatMessage}>
                <span style={{ color: msg.color, fontWeight: "bold" }}>
                  {msg.user}:
                </span>{" "}
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className={styles.chatForm}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message"
              className={styles.chatInput}
            />
            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
