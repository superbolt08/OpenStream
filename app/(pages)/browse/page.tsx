// BrowsePage.tsx
import React from "react";
import styles from "./browse.module.css";
import { Stream } from "@/app/services/stream/interface";
import StreamCard from "../../components/StreamCard/StreamCard"; 

async function getStreams(): Promise<Stream[]> {
  const baseUrl = process.env.PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/stream/get`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json();
  return data.streams;
}

export default async function BrowsePage() {
  const streams = await getStreams();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Live Streams</h1>
      <div className={styles.streamsGridContainer}>
        <div className={styles.streamsGrid}>
          {streams.map((stream: Stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      </div>
    </div>
  );
}
