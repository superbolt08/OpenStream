"use client";

import React, { useState } from "react";
import styles from "./LoginModal.module.css";
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username: string) => void;
  existingUser?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, existingUser }) => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      // Use the update endpoint if the user already exists; otherwise, sign up.
      const endpoint = existingUser ? "/api/auth/update" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        onLogin(username);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Error processing session", err);
      setError("Login failed");
    }
    router.refresh()
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="username" className={styles.label}>
            {existingUser ? "Update Username:" : "Username:"}
          </label>
          <input
            id="username"
            className={styles.input}
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.buttons}>
            <button type="submit" className={styles.button}>
              {existingUser ? "Update" : "Choose name"}
            </button>
            <button type="button" onClick={onClose} className={styles.button}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
