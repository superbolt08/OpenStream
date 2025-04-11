"use client"
import React from "react";
import styles from "@/app/(pages)/browse/browse.module.css";
import HLSVideo from "../HLSVideo/HLSVideo";
import { Stream } from "@/app/services/stream/interface";
import { useRouter } from "next/navigation";

interface StreamCardProps {
  stream: Stream;
}

const StreamCard: React.FC<StreamCardProps> = ({ stream }) => {
  const router = useRouter();
  const handleCardClick = () => {
    router.push(`/viewer/${stream.id}`);
  };

  return (
    <div className={styles.streamCard} onClick={handleCardClick}>
      <HLSVideo
        src={stream.playbackURL}
        className={styles.video}
        autoPlay={false}
        controls={false}
        muted
        playsInline={false}
        preload="metadata"
      />
      <div className={styles.info}>
        <p className={styles.streamTitle}>{stream.title}</p>
        <p className={styles.streamer}>by {stream.streamer}</p>
      </div>
    </div>
  );
};

export default StreamCard;
