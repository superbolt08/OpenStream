"use client";

import { useSocket } from "@/app/components/socketprovider/SocketProvider";
import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

interface ChatMessage {
  text: string;
  color: string;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socket = useSocket();
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  // Predefined high-contrast colors for a black background
  const highContrastColors = [
    "#00FF00", // Lime
    "#FF00FF", // Magenta
    "#FFFF00", // Yellow
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#FF4500", // Orange Red
    "#ADFF2F", // Green Yellow
    "#7CFC00"  // Lawn Green
  ];

  function getRandomColor(): string {
    return highContrastColors[Math.floor(Math.random() * highContrastColors.length)];
  }

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (msg: string) => {
      const newMessage: ChatMessage = { text: msg, color: getRandomColor() };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [socket]);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      if (socket) {
        socket.emit("newMessage", message);
      }
      setMessage("");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Simple Chat</h1>
      <div className={styles.chatBox}>
        <div className={styles.chatDisplay} ref={chatDisplayRef}>
          {messages.map((msg, index) => (
            <div key={index} style={{ margin: "0.5rem 0", color: msg.color }}>
              {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className={styles.form}>
          <input
            className={styles.messageInput}
            type="text"
            placeholder="Send a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className={styles.sendButton} type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
