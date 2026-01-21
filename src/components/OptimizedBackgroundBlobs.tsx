import { memo } from "react";

interface BlobProps {
  className?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-center";
}

const positionClasses = {
  "top-left": "top-20 -left-32",
  "top-right": "top-40 -right-32",
  "bottom-left": "bottom-20 left-0",
  "bottom-center": "bottom-20 left-1/3",
};

const Blob = memo(({ className = "", position }: BlobProps) => (
  <div
    className={`absolute rounded-full blur-3xl pointer-events-none will-change-transform gpu-accelerated animate-blob-slow motion-reduce:animate-none ${positionClasses[position]} ${className}`}
    aria-hidden="true"
  />
));

Blob.displayName = "Blob";

interface OptimizedBackgroundBlobsProps {
  variant?: "hero" | "section" | "minimal";
}

export const OptimizedBackgroundBlobs = memo(({ variant = "hero" }: OptimizedBackgroundBlobsProps) => {
  if (variant === "minimal") {
    return (
      <Blob
        position="top-right"
        className="w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent"
      />
    );
  }

  if (variant === "section") {
    return (
      <>
        <Blob
          position="top-right"
          className="w-72 h-72 bg-gradient-to-bl from-primary/10 to-transparent"
        />
        <Blob
          position="bottom-left"
          className="w-64 h-64 bg-gradient-to-tr from-secondary/10 to-transparent"
        />
      </>
    );
  }

  // Hero variant - full blobs
  return (
    <>
      <Blob
        position="top-left"
        className="w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10"
      />
      <Blob
        position="top-right"
        className="w-80 h-80 bg-gradient-to-bl from-secondary/20 to-accent/10"
      />
    </>
  );
});

OptimizedBackgroundBlobs.displayName = "OptimizedBackgroundBlobs";

export default OptimizedBackgroundBlobs;
