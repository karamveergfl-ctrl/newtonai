import { useEffect, useState, useCallback } from "react";
import { saveVideo, loadVideo, deleteVideo } from "../lib/videoStore";

export function useToolVideo(key: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    let createdUrl: string | null = null;
    loadVideo(key).then(blob => {
      if (!active || !blob) return;
      createdUrl = URL.createObjectURL(blob);
      setUrl(createdUrl);
    }).catch(() => {});
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [key]);

  const upload = useCallback(async (file: File) => {
    if (!key) return;
    await saveVideo(key, file);
    const newUrl = URL.createObjectURL(file);
    setUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return newUrl;
    });
  }, [key]);

  const clear = useCallback(async () => {
    if (!key) return;
    await deleteVideo(key);
    setUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [key]);

  return { url, upload, clear };
}
