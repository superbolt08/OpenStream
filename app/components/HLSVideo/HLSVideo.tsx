"use client"

import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HLSVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
}

const HLSVideo: React.FC<HLSVideoProps> = ({ src, poster, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If the browser supports HLS natively (e.g. Safari), assign the src directly.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      // Otherwise, use hls.js to load the stream.
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);

      // Cleanup on unmount.
      return () => {
        hls.destroy();
      };
    } else {
      console.error("HLS is not supported in this browser");
    }
  }, [src]);

  return (
    <video ref={videoRef} poster={poster} {...props}>
      Your browser does not support HLS playback.
    </video>
  );
};

export default HLSVideo;
