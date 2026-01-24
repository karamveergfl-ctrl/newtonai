import { memo, useEffect, useRef } from "react";

/**
 * Global Video Preloader Component
 * 
 * This component mounts a hidden video element at app startup to:
 * 1. Force the browser to download the video immediately
 * 2. Decode the first frame for instant display
 * 3. Keep the video in browser memory cache
 * 
 * This eliminates the "video loading delay" when ProcessingOverlay appears.
 */
export const VideoPreloader = memo(() => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force decode the first frame
    video.load();
    
    // Try to play briefly to ensure frames are decoded
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Immediately pause after starting
          video.pause();
          video.currentTime = 0;
        })
        .catch(() => {
          // Autoplay blocked is fine, video is still preloaded
        });
    }
  }, []);

  return (
    <video
      ref={videoRef}
      src="/newton-processing.mp4"
      poster="/newton-poster.webp"
      preload="auto"
      muted
      playsInline
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
        zIndex: -9999,
      }}
    />
  );
});

VideoPreloader.displayName = "VideoPreloader";

export default VideoPreloader;
