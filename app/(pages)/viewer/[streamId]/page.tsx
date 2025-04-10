"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ChatMessage, Stream } from "@/app/services/stream/interface";
import HLSVideo from "@/app/components/HLSVideo/HLSVideo"; // Reuse your HLS video component
import styles from "@/app/(pages)/stream/stream.module.css";
import { useSocket } from "@/app/contexts/SocketProvider/SocketProvider";
import { getColor } from "@/app/services/stream/methods";
import LoginModal from "@/app/components/LoginModal/LoginModal";

interface LocalUser {
  username: string;
}

export default function ViewerPage() {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const socket = useSocket();
  const { streamId } = useParams();
  const [stream, setStream] = useState<Stream | null>(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [duration, setDuration] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const userColorRef = useRef<string>(getColor());

  // Call getUser on mount and store the result in localUser.
  useEffect(() => {
    async function fetchLocalUser() {
      try {
        const res = await fetch('/api/auth/getUser');
        if (res.ok) {
          const data = await res.json();
          setLocalUser(data.user);
        } else {
          setLocalUser(null);
        }
      } catch (error) {
        console.error("Error fetching local user", error);
        setLocalUser(null);
      }
    }
    fetchLocalUser();
  }, []);

  // Fetch the stream details.
  useEffect(() => {
    async function fetchStream() {
      try {
        const res = await fetch(`/api/stream/get/${streamId}`);
        const data = await res.json();
        setStream(data.stream);
      } catch (error) {
        console.error("Failed to fetch stream", error);
      }
    }
    if (streamId) {
      fetchStream();
    }
  }, [streamId]);

  // Update duration every second if stream exists.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stream) {
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
  }, [stream]);

  // Listen for new chat messages.
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

  // Auto-scroll chat to bottom when new messages arrive.
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUser) {
      // If the local user is not set, show the login modal.
      setShowLoginModal(true);
      return;
    }
    if (message.trim() && socket) {
      const newMsg: ChatMessage = {
        user: localUser.username,
        text: message,
        color: userColorRef.current,
        chatId: stream?.chatId,
      };
      socket.emit("newMessage", newMsg);
      setMessage("");
    }
  };

  const handleLogin = (username: string) => {
    setLocalUser({ username });
    setShowLoginModal(false);
  };

  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.videoSection}>
        {stream ? (
          <HLSVideo
            src={stream.playbackURL}
            className={styles.video}
            autoPlay
            controls
            muted={false}
            playsInline
          />
        ) : (
          <p>Loading stream...</p>
        )}
        {stream && (
          <div className={styles.overlay}>
            <div className={styles.title}>{stream.title}</div>
            <div className={styles.duration}>
              Live for: {formatDuration(duration)}
            </div>
            <div className={styles.duration}>By: {stream.streamer}</div>
          </div>
        )}
      </div>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          existingUser={!!localUser}
        />
      )}
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
