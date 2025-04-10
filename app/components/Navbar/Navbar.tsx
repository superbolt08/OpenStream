// Navbar.tsx
"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import StartStreamButton from "../StreamButton/StartStreamButton";
import StopStreamButton from "../StreamButton/StopStreamButton";
import LoginModal from "../LoginModal/LoginModal";
import StreamTitleModal from "../StreamTitleModal/StreamTitleModal";
import { useStream } from "@/app/contexts/StreamProvider/StreamProvider";
import { ROUTES } from "@/app/services/constants/contants";

interface NavbarProps {
  user: {
    username?: string;
  } | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const [localUser, setLocalUser] = useState(user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);

  const { streaming, stopStreaming } = useStream();

  const handleStartStream = () => {
    if (!localUser) {
      setShowLoginModal(true);
    } else {
      setShowTitleModal(true);
    }
  };

  // Use the global stopStreaming from context.
  const handleStopStream = () => {
    stopStreaming();
    router.push(ROUTES.BROWSE)
  };

  const handleNameClick = () => {
    setShowLoginModal(true);
  };

  // Update user state from the login modal.
  const handleLogin = (username: string) => {
    setLocalUser({ username });
  };

  const handleTitleSubmit = async (title: string) => {
    try {
      const response = await fetch("/api/stream/title", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        console.error("Failed to update stream");
        return;
      }
      router.push(ROUTES.STREAM);
    } catch (error) {
      console.error("Error updating stream:", error);
    }
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.left}>
          {!streaming && (
            <Link href="/browse" className={styles.link}>
              Browse
            </Link>
          )}
          {streaming ? (
            <StopStreamButton onClick={handleStopStream} />
          ) : (
            <StartStreamButton 
              onClick={handleStartStream} 
            />
          )}
        </div>
        <div className={styles.right} onClick={handleNameClick}>
          {localUser?.username ? "| " + localUser.username : "| Choose name"}
        </div>
      </nav>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          existingUser={!!localUser}
        />
      )}
      {showTitleModal && (
        <StreamTitleModal
          onClose={() => setShowTitleModal(false)}
          onSubmit={handleTitleSubmit}
        />
      )}
    </>
  );
};

export default Navbar;
