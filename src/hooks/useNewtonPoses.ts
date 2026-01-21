import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProcessingPhase } from "@/hooks/useProcessingState";

type PoseType = "thinking" | "writing" | "completed";

interface NewtonPoses {
  thinking: string | null;
  writing: string | null;
  completed: string | null;
}

interface UseNewtonPosesOptions {
  /** Enable pose generation (default: true) */
  enabled?: boolean;
  /** Fallback image to use when pose not available */
  fallbackImage?: string;
}

interface UseNewtonPosesReturn {
  /** Get the image URL for a specific state */
  getPoseImage: (state: ProcessingPhase) => string;
  /** Whether any pose is currently being generated */
  isLoading: boolean;
  /** Loading state for each pose */
  loadingStates: Record<PoseType, boolean>;
  /** Whether all poses have been generated */
  allPosesReady: boolean;
  /** Manually trigger pose generation */
  generatePose: (pose: PoseType) => Promise<void>;
  /** Generate all poses */
  generateAllPoses: () => Promise<void>;
  /** Clear cached poses */
  clearCache: () => void;
}

const CACHE_KEY = "newton_poses_cache";
const CACHE_VERSION = "v1";

function getCachedPoses(): NewtonPoses | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return parsed.poses;
  } catch {
    return null;
  }
}

function setCachedPoses(poses: NewtonPoses): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      poses,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Failed to cache Newton poses:", e);
  }
}

export function useNewtonPoses(options: UseNewtonPosesOptions = {}): UseNewtonPosesReturn {
  const { enabled = true, fallbackImage = "" } = options;
  
  const [poses, setPoses] = useState<NewtonPoses>(() => getCachedPoses() || {
    thinking: null,
    writing: null,
    completed: null
  });
  
  const [loadingStates, setLoadingStates] = useState<Record<PoseType, boolean>>({
    thinking: false,
    writing: false,
    completed: false
  });
  
  const generationInProgress = useRef<Set<PoseType>>(new Set());

  const generatePose = useCallback(async (pose: PoseType): Promise<void> => {
    // Skip if already generated or in progress
    if (poses[pose] || generationInProgress.current.has(pose)) {
      return;
    }
    
    generationInProgress.current.add(pose);
    setLoadingStates(prev => ({ ...prev, [pose]: true }));
    
    try {
      console.log(`Generating Newton ${pose} pose...`);
      
      const { data, error } = await supabase.functions.invoke('generate-newton-pose', {
        body: { pose }
      });
      
      if (error) {
        console.error(`Error generating ${pose} pose:`, error);
        return;
      }
      
      if (data?.image) {
        console.log(`Successfully generated ${pose} pose`);
        setPoses(prev => {
          const updated = { ...prev, [pose]: data.image };
          setCachedPoses(updated);
          return updated;
        });
      }
    } catch (e) {
      console.error(`Failed to generate ${pose} pose:`, e);
    } finally {
      generationInProgress.current.delete(pose);
      setLoadingStates(prev => ({ ...prev, [pose]: false }));
    }
  }, [poses]);

  const generateAllPoses = useCallback(async (): Promise<void> => {
    const posesToGenerate: PoseType[] = ["thinking", "writing", "completed"];
    
    // Generate in parallel
    await Promise.all(
      posesToGenerate
        .filter(pose => !poses[pose])
        .map(pose => generatePose(pose))
    );
  }, [poses, generatePose]);

  const getPoseImage = useCallback((state: ProcessingPhase): string => {
    if (state === "idle") return fallbackImage;
    
    const poseType = state as PoseType;
    return poses[poseType] || fallbackImage;
  }, [poses, fallbackImage]);

  const clearCache = useCallback((): void => {
    localStorage.removeItem(CACHE_KEY);
    setPoses({ thinking: null, writing: null, completed: null });
  }, []);

  // Auto-generate poses on mount if enabled and not cached
  useEffect(() => {
    if (!enabled) return;
    
    const cached = getCachedPoses();
    if (cached) {
      setPoses(cached);
      return;
    }
    
    // Generate all poses in background
    generateAllPoses();
  }, [enabled]); // Only run on mount

  const isLoading = Object.values(loadingStates).some(Boolean);
  const allPosesReady = Boolean(poses.thinking && poses.writing && poses.completed);

  return {
    getPoseImage,
    isLoading,
    loadingStates,
    allPosesReady,
    generatePose,
    generateAllPoses,
    clearCache
  };
}
