"use client";

import React from "react";
import styles from "./StreamButton.module.css"

interface StartStreamButtonProps {
  onClick?: () => void;
}

const StartStreamButton: React.FC<StartStreamButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.button} onClick={onClick}>
      Start Stream
    </button>
  );
};

export default StartStreamButton;
