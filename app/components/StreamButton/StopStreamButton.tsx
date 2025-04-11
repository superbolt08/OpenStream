"use client";

import React from "react";
import styles from "./StreamButton.module.css";

interface StopStreamButtonProps {
  onClick?: () => void;
}

const StopStreamButton: React.FC<StopStreamButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.button} onClick={onClick}>
      Stop Stream
    </button>
  );
};

export default StopStreamButton;
