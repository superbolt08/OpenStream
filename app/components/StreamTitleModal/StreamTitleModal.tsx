"use client";

import React, { useState } from "react";
import styles from "./TitleModal.module.css";

interface TitleModalProps {
  onClose: () => void;
  onSubmit: (title: string) => void;
}

const StreamTitleModal: React.FC<TitleModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
    }
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="streamTitle" className={styles.label}>
            Stream Title:
          </label>
          <input
            id="streamTitle"
            className={styles.input}
            type="text"
            placeholder="Enter stream title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className={styles.buttons}>
            <button type="submit" className={styles.button}>
              Confirm
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

export default StreamTitleModal;
