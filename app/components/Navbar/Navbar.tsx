"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import StartStreamButton from "../StreamButton/StartStreamButton";
import StopStreamButton from "../StreamButton/StopStreamButton";
import LoginModal from "../LoginModal/LoginModal";
import StreamTitleModal from "../StreamTitleModal/StreamTitleModal";

interface NavbarProps {
  user: {
    username?: string;
  } | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [localUser, setLocalUser] = useState(user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);

  // Determine streaming state based on the current pathname.
  const streaming = (): boolean => pathname === "/stream";

  // When user clicks "Start Stream":
  // If not authenticated, prompt for login; if authenticated, show TitleModal.
  const handleStartStream = () => {
    if (!localUser) {
      setShowLoginModal(true);
    } else {
      setShowTitleModal(true);
    }
  };

  const handleStopStream = () => {
  };


  // Clicking the username always opens the login modal for updating the name.
  const handleNameClick = () => {
    setShowLoginModal(true);
  };

  // Update the user state when the login modal returns a username.
  const handleLogin = (username: string) => {
    setLocalUser({ username });
  };

  // When the TitleModal returns a title, call the API to update the stream record.
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
      router.push("/stream");
    } catch (error) {
      console.error("Error updating stream:", error);
    }
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.left}>
          {/* Show Browse link only when not streaming */}
          {!streaming() && (
            <Link href="/browse" className={styles.link}>
              Browse
            </Link>
          )}
          {streaming() ? (
            <StopStreamButton onClick={handleStopStream} />
          ) : (
            <StartStreamButton onClick={handleStartStream} />
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
