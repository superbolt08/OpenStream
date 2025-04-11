"use client";

import React from "react";
import styles from "./StreamButton.module.css";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/app/services/constants/contants";
import { useStream } from "@/app/contexts/StreamProvider/StreamProvider";

interface StartStreamButtonProps {
  onClick?: () => void;
  startText?: string;
  beginText?: string;
  disabled?: boolean;
}

const StartStreamButton: React.FC<StartStreamButtonProps> = ({
  onClick,
  startText = "Start Stream",
  beginText = "Begin Stream",
  disabled = false,
}) => {
  const pathname = usePathname();
  const isStreamPage = pathname === ROUTES.STREAM;
  const { startStreaming } = useStream();

  const handleClick = () => {
    if (disabled) return;
    if (isStreamPage) {
      startStreaming();
    } else {
      onClick?.();
    }
  };

  return (
    <button
      className={styles.button}
      onClick={handleClick}
      disabled={disabled}
    >
      {isStreamPage ? beginText : startText}
    </button>
  );
};

export default StartStreamButton;
