import { memo, useEffect, useRef, useState } from "react";

/**
 * Global Video Preloader Component
 * 
 * Defers video preloading until after the page has painted (3s delay)
 * to avoid competing with critical resources during FCP.
 */
export const VideoPreloader = memo(() => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Defer loading to after initial paint
  useEffect(() => {
    const timer = setTimeout(() => setShouldLoad(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          video.pause();
          video.currentTime = 0;
        })
        .catch(() => {});
    }
  }, [shouldLoad]);

  if (!shouldLoad) return null;

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
