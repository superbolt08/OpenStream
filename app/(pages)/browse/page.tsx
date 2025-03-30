import React from "react";
import styles from "./browse.module.css";
import { Stream } from "@/app/services/stream/interface";


async function getStreams(): Promise<Stream[]> {
  // Use PUBLIC_SITE_URL as the base URL, or fallback to localhost
  const baseUrl = process.env.PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/stream/get`, { method: "GET",cache: "no-store" });
  const data = await res.json();
  return data.streams;
}

export default async function BrowsePage() {
  const streams = await getStreams();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Live Streams</h1>
      <div className={styles.streamsGrid}>
        {streams.map((stream: Stream) => (
          <div key={stream.id} className={styles.streamCard}>
            <video
              controls
              className={styles.video}
              src={stream.playbackURL}
            >
              Your browser does not support HLS playback.
            </video>
            <div className={styles.info}>
              <p className={styles.streamTitle}>{stream.title}</p>
              <p className={styles.streamer}>by {stream.streamer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
